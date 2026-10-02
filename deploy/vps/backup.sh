#!/usr/bin/env bash
# Sauvegarde de la base Bailio (appelée chaque nuit par cron).
# 1. Copie locale compressée, gardée 14 jours (/opt/bailio-backups).
# 2. Copie HORS du serveur, chiffrée, gardée 30 jours, si un stockage est configuré dans .env
#    (BACKUP_S3_*, voir .env.example) : une panne ou une perte du serveur ne fait rien perdre.
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
S3_ENDPOINT="$(env_value BACKUP_S3_ENDPOINT)"
S3_BUCKET="$(env_value BACKUP_S3_BUCKET)"
S3_KEY="$(env_value BACKUP_S3_ACCESS_KEY)"
S3_SECRET="$(env_value BACKUP_S3_SECRET_KEY)"
PASSPHRASE="$(env_value BACKUP_PASSPHRASE)"
if [ -z "$S3_ENDPOINT" ] || [ -z "$S3_BUCKET" ] || [ -z "$S3_KEY" ] || [ -z "$S3_SECRET" ] || [ -z "$PASSPHRASE" ]; then
  echo "$(date '+%F %T') ATTENTION : copie hors serveur non configurée (BACKUP_S3_* et BACKUP_PASSPHRASE dans .env)."
  exit 0
fi

command -v rclone >/dev/null || { apt-get install -yq rclone >/dev/null || curl -fsSL https://rclone.org/install.sh | bash >/dev/null; }

# Chiffrement AES-256 avec la phrase secrète : le stockage ne voit jamais les données en clair.
ENC="$FILE.enc"
BACKUP_PASSPHRASE="$PASSPHRASE" openssl enc -aes-256-cbc -pbkdf2 -iter 200000 -salt -pass env:BACKUP_PASSPHRASE -in "$FILE" -out "$ENC"
chmod 600 "$ENC"

export RCLONE_CONFIG_OFFSITE_TYPE=s3
export RCLONE_CONFIG_OFFSITE_PROVIDER=Other
export RCLONE_CONFIG_OFFSITE_ENDPOINT="$S3_ENDPOINT"
export RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID="$S3_KEY"
export RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY="$S3_SECRET"
export RCLONE_CONFIG_OFFSITE_REGION="$(env_value BACKUP_S3_REGION)"
rclone copyto "$ENC" "offsite:$S3_BUCKET/bailio/$(basename "$ENC")"
rclone delete --min-age 30d "offsite:$S3_BUCKET/bailio/"
rm -f "$ENC"
echo "$(date '+%F %T') copie hors serveur OK : $S3_BUCKET/bailio/$(basename "$ENC")"
