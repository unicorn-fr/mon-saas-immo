#!/usr/bin/env bash
# Sauvegarde de la base Bailio (appelée chaque nuit par cron).
# 1. Copie locale compressée, gardée 14 jours (/opt/bailio-backups).
# 2. Copie HORS du serveur, chiffrée, gardée 30 jours, si un stockage est configuré dans .env :
#    - kDrive Infomaniak par l'API (BACKUP_KDRIVE_TOKEN…), possible avec le kDrive gratuit ;
#    - kDrive Infomaniak en WebDAV (BACKUP_KDRIVE_URL…), offres payantes seulement ;
#    - sinon un stockage S3 compatible (BACKUP_S3_*), en secours.
#    Une panne ou une perte du serveur ne fait alors rien perdre. Voir .env.example.
set -euo pipefail
cd "$(dirname "$0")"
DIR=/opt/bailio-backups
mkdir -p "$DIR" && chmod 700 "$DIR"
FILE="$DIR/bailio-$(date +%F).sql.gz"
docker compose exec -T db pg_dump -U bailio -d bailio --no-owner | gzip > "$FILE"
chmod 600 "$FILE"
find "$DIR" -name 'bailio-*.sql.gz' -mtime +14 -delete
echo "$(date '+%F %T') sauvegarde locale OK : $FILE ($(du -h "$FILE" | cut -f1))"

# Lecture d'une valeur de .env (sans exécuter le fichier).
# `|| true` : une clé absente ne doit jamais faire échouer le script sous `set -e` (sinon arrêt silencieux).
env_value() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' || true; }
PASSPHRASE="$(env_value BACKUP_PASSPHRASE)"

# kDrive (API, puis WebDAV) en priorité, sinon S3 compatible. On choisit selon ce qui est renseigné dans .env.
KDRIVE_TOKEN="$(env_value BACKUP_KDRIVE_TOKEN)"
KDRIVE_DRIVE="$(env_value BACKUP_KDRIVE_DRIVE_ID)"
KDRIVE_FOLDER="$(env_value BACKUP_KDRIVE_FOLDER_ID)"
KDRIVE_URL="$(env_value BACKUP_KDRIVE_URL)"
KDRIVE_USER="$(env_value BACKUP_KDRIVE_USER)"
KDRIVE_PASS="$(env_value BACKUP_KDRIVE_PASS)"
S3_ENDPOINT="$(env_value BACKUP_S3_ENDPOINT)"
S3_BUCKET="$(env_value BACKUP_S3_BUCKET)"
S3_KEY="$(env_value BACKUP_S3_ACCESS_KEY)"
S3_SECRET="$(env_value BACKUP_S3_SECRET_KEY)"

MODE=""
if [ -n "$KDRIVE_TOKEN" ] && [ -n "$KDRIVE_DRIVE" ] && [ -n "$KDRIVE_FOLDER" ] && [ -n "$PASSPHRASE" ]; then
  MODE=kdrive-api
elif [ -n "$KDRIVE_URL" ] && [ -n "$KDRIVE_USER" ] && [ -n "$KDRIVE_PASS" ] && [ -n "$PASSPHRASE" ]; then
  MODE=kdrive
elif [ -n "$S3_ENDPOINT" ] && [ -n "$S3_BUCKET" ] && [ -n "$S3_KEY" ] && [ -n "$S3_SECRET" ] && [ -n "$PASSPHRASE" ]; then
  MODE=s3
fi
if [ -z "$MODE" ]; then
  echo "$(date '+%F %T') ATTENTION : copie hors serveur non configurée (BACKUP_KDRIVE_* ou BACKUP_S3_*, et BACKUP_PASSPHRASE dans .env)."
  exit 0
fi

# Chiffrement AES-256 avec la phrase secrète : le stockage ne voit jamais les données en clair.
ENC="$FILE.enc"
BACKUP_PASSPHRASE="$PASSPHRASE" openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -in "$FILE" -out "$ENC"
chmod 600 "$ENC"

if [ "$MODE" = kdrive-api ]; then
  # kDrive par l'API d'Infomaniak (jeton « drive »), dans le dossier choisi ; une version de plus si le nom existe déjà.
  API="https://api.infomaniak.com"
  NAME="$(basename "$ENC")"
  CODE=$(curl -sS -o /tmp/bailio-kdrive.json -w '%{http_code}' -X POST -H "Authorization: Bearer $KDRIVE_TOKEN" \
    -H 'Content-Type: application/octet-stream' --data-binary @"$ENC" \
    "$API/3/drive/$KDRIVE_DRIVE/upload?directory_id=$KDRIVE_FOLDER&file_name=$NAME&total_size=$(stat -c%s "$ENC")&conflict=version") || true
  if [ "$CODE" != 200 ]; then
    echo "$(date '+%F %T') ERREUR : envoi vers le kDrive refusé ($CODE) : $(head -c 300 /tmp/bailio-kdrive.json)"
    rm -f "$ENC" /tmp/bailio-kdrive.json
    exit 1
  fi
  # Copies de plus de 30 jours (d'après la date du nom) : mises à la corbeille du kDrive.
  OLD=$(curl -sS -H "Authorization: Bearer $KDRIVE_TOKEN" "$API/3/drive/$KDRIVE_DRIVE/files/$KDRIVE_FOLDER/files?limit=1000" | python3 -c '
import datetime, json, re, sys
limit = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
for f in json.load(sys.stdin).get("data", []):
    m = re.fullmatch(r"bailio-(\d{4}-\d{2}-\d{2})\.sql\.gz\.enc", f.get("name", ""))
    if m and m.group(1) < limit:
        print(f["id"])
' || true)
  for id in $OLD; do curl -sS -o /dev/null -X DELETE -H "Authorization: Bearer $KDRIVE_TOKEN" "$API/2/drive/$KDRIVE_DRIVE/files/$id" || true; done
  rm -f "$ENC" /tmp/bailio-kdrive.json
  echo "$(date '+%F %T') copie hors serveur OK : kDrive/$NAME"
  exit 0
fi

command -v rclone >/dev/null || { apt-get install -yq rclone >/dev/null || curl -fsSL https://rclone.org/install.sh | bash >/dev/null; }

if [ "$MODE" = kdrive ]; then
  # kDrive Infomaniak : WebDAV. Le mot de passe d'application est brouillé à la volée (jamais écrit sur disque).
  export RCLONE_CONFIG_OFFSITE_TYPE=webdav
  export RCLONE_CONFIG_OFFSITE_VENDOR=other
  export RCLONE_CONFIG_OFFSITE_URL="$KDRIVE_URL"
  export RCLONE_CONFIG_OFFSITE_USER="$KDRIVE_USER"
  RCLONE_CONFIG_OFFSITE_PASS="$(RCLONE_CONFIG_OFFSITE_PASS= rclone obscure "$KDRIVE_PASS")"
  export RCLONE_CONFIG_OFFSITE_PASS
  DEST="offsite:bailio"
  LABEL="kDrive"
else
  export RCLONE_CONFIG_OFFSITE_TYPE=s3
  export RCLONE_CONFIG_OFFSITE_PROVIDER=Other
  export RCLONE_CONFIG_OFFSITE_ENDPOINT="$S3_ENDPOINT"
  export RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID="$S3_KEY"
  export RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY="$S3_SECRET"
  export RCLONE_CONFIG_OFFSITE_REGION="$(env_value BACKUP_S3_REGION)"
  DEST="offsite:$S3_BUCKET/bailio"
  LABEL="$S3_BUCKET/bailio"
fi

rclone copyto "$ENC" "$DEST/$(basename "$ENC")"
rclone delete --min-age 30d "$DEST/"
rm -f "$ENC"
echo "$(date '+%F %T') copie hors serveur OK : $LABEL/$(basename "$ENC")"
