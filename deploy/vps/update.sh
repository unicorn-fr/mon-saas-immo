#!/usr/bin/env bash
# Met Bailio à jour avec la dernière version de la branche main (site + API).
set -euo pipefail
cd "$(dirname "$0")"
git -C ../.. pull --ff-only

docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "Bailio est à jour."
