#!/usr/bin/env bash
# Sauvegarde de la base Bailio (appelée chaque nuit par cron).
# 1. Copie locale compressée, gardée 14 jours (/opt/bailio-backups).
# 2. Copie HORS du serveur, chiffrée, gardée 30 jours, si un stockage est configuré dans .env :
#    - kDrive Infomaniak en WebDAV (BACKUP_KDRIVE_*), le choix par défaut ;
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
env_value() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
PASSPHRASE="$(env_value BACKUP_PASSPHRASE)"

# kDrive (WebDAV) en priorité, sinon S3 compatible. On choisit selon ce qui est renseigné dans .env.
KDRIVE_URL="$(env_value BACKUP_KDRIVE_URL)"
KDRIVE_USER="$(env_value BACKUP_KDRIVE_USER)"
KDRIVE_PASS="$(env_value BACKUP_KDRIVE_PASS)"
S3_ENDPOINT="$(env_value BACKUP_S3_ENDPOINT)"
S3_BUCKET="$(env_value BACKUP_S3_BUCKET)"
S3_KEY="$(env_value BACKUP_S3_ACCESS_KEY)"
S3_SECRET="$(env_value BACKUP_S3_SECRET_KEY)"

MODE=""
if [ -n "$KDRIVE_URL" ] && [ -n "$KDRIVE_USER" ] && [ -n "$KDRIVE_PASS" ] && [ -n "$PASSPHRASE" ]; then
  MODE=kdrive
elif [ -n "$S3_ENDPOINT" ] && [ -n "$S3_BUCKET" ] && [ -n "$S3_KEY" ] && [ -n "$S3_SECRET" ] && [ -n "$PASSPHRASE" ]; then
  MODE=s3
fi
if [ -z "$MODE" ]; then
  echo "$(date '+%F %T') ATTENTION : copie hors serveur non configurée (BACKUP_KDRIVE_* ou BACKUP_S3_*, et BACKUP_PASSPHRASE dans .env)."
  exit 0
fi

command -v rclone >/dev/null || { apt-get install -yq rclone >/dev/null || curl -fsSL https://rclone.org/install.sh | bash >/dev/null; }

# Chiffrement AES-256 avec la phrase secrète : le stockage ne voit jamais les données en clair.
ENC="$FILE.enc"
BACKUP_PASSPHRASE="$PASSPHRASE" openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -in "$FILE" -out "$ENC"
chmod 600 "$ENC"

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
