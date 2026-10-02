#!/usr/bin/env bash
# Restaurer une sauvegarde dans la base Bailio. ATTENTION : remplace les données actuelles.
#   sudo ./restore.sh /opt/bailio-backups/bailio-2026-10-02.sql.gz        (copie locale)
#   sudo ./restore.sh bailio-2026-10-02.sql.gz.enc                         (copie hors serveur, téléchargée et déchiffrée)
set -euo pipefail
cd "$(dirname "$0")"
[ $# -eq 1 ] || { echo "Usage : $0 <fichier .sql.gz ou .sql.gz.enc>"; exit 1; }
env_value() { grep -E "^$1=" .env 2>/dev/null | tail -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
SRC="$1"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
if [[ "$SRC" == *.enc ]]; then
  if [ ! -f "$SRC" ]; then
    export RCLONE_CONFIG_OFFSITE_TYPE=s3 RCLONE_CONFIG_OFFSITE_PROVIDER=Other
    export RCLONE_CONFIG_OFFSITE_ENDPOINT="$(env_value BACKUP_S3_ENDPOINT)"
    export RCLONE_CONFIG_OFFSITE_ACCESS_KEY_ID="$(env_value BACKUP_S3_ACCESS_KEY)"
    export RCLONE_CONFIG_OFFSITE_SECRET_ACCESS_KEY="$(env_value BACKUP_S3_SECRET_KEY)"
    export RCLONE_CONFIG_OFFSITE_REGION="$(env_value BACKUP_S3_REGION)"
    rclone copyto "offsite:$(env_value BACKUP_S3_BUCKET)/bailio/$(basename "$SRC")" "$TMP/backup.enc"
    SRC="$TMP/backup.enc"
  fi
  BACKUP_PASSPHRASE="$(env_value BACKUP_PASSPHRASE)" openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 -pass env:BACKUP_PASSPHRASE -in "$SRC" -out "$TMP/backup.sql.gz"
  SRC="$TMP/backup.sql.gz"
fi
gunzip -t "$SRC"
read -r -p "Remplacer TOUTES les données actuelles par cette sauvegarde ? Tapez OUI : " ok
[ "$ok" = "OUI" ] || { echo "Annulé."; exit 1; }
docker compose stop api
docker compose exec -T db psql -U bailio -d postgres -c "DROP DATABASE IF EXISTS bailio WITH (FORCE);" -c "CREATE DATABASE bailio OWNER bailio;"
gunzip -c "$SRC" | docker compose exec -T db psql -q -U bailio -d bailio
docker compose start api
echo "Sauvegarde restaurée."
