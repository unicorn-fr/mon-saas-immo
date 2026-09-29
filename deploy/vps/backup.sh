#!/usr/bin/env bash
# Sauvegarde de la base Bailio (appelée chaque nuit par cron). Garde 14 jours.
set -euo pipefail
cd "$(dirname "$0")"
DIR=/opt/bailio-backups
mkdir -p "$DIR"
FILE="$DIR/bailio-$(date +%F).sql.gz"
docker compose exec -T db pg_dump -U bailio -d bailio --no-owner | gzip > "$FILE"
chmod 600 "$FILE"
find "$DIR" -name 'bailio-*.sql.gz' -mtime +14 -delete
echo "$(date '+%F %T') sauvegarde OK : $FILE ($(du -h "$FILE" | cut -f1))"
