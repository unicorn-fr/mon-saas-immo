#!/usr/bin/env bash
# Met Bailio à jour avec la dernière version de la branche main.
set -euo pipefail
cd "$(dirname "$0")"
git -C ../.. pull --ff-only
docker compose up -d --build
docker image prune -f >/dev/null
echo "Bailio est à jour."
