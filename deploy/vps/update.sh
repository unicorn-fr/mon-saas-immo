#!/usr/bin/env bash
# Met Bailio à jour avec la dernière version validée (branche production, sinon main).
set -euo pipefail
cd "$(dirname "$0")"
# Branche : celle demandée (BAILIO_BRANCH), sinon production si elle existe, sinon main.
BRANCH="${BAILIO_BRANCH:-}"
if [ -z "$BRANCH" ]; then
  BRANCH=main
  if git -C ../.. ls-remote --exit-code --heads origin production >/dev/null 2>&1; then BRANCH=production; fi
fi
git -C ../.. fetch -q origin "$BRANCH:refs/remotes/origin/$BRANCH"
git -C ../.. checkout -q -B "$BRANCH" "origin/$BRANCH"

# Version affichée par https://api.bailio.eu/health : permet de vérifier la mise en ligne.
export BAILIO_VERSION="$(git -C ../.. rev-parse --short HEAD)"
docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "Bailio est à jour (version $BAILIO_VERSION)."
