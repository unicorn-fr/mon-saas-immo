#!/usr/bin/env bash
# Met Bailio à jour avec la dernière version de la branche main (site + API).
set -euo pipefail
cd "$(dirname "$0")"
git -C ../.. pull --ff-only

# Version affichée par https://api.bailio.eu/health : permet de vérifier la mise en ligne.
export BAILIO_VERSION="$(git -C ../.. rev-parse --short HEAD)"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "Bailio est à jour (version $BAILIO_VERSION)."
