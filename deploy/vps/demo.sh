#!/usr/bin/env bash
# Remplit un compte avec des données fictives pour essayer Bailio (server/src/scripts/demo.ts).
# Usage, depuis ce dossier :  sudo ./demo.sh adresse@exemple.fr        (--force si le compte a déjà des logements)
set -euo pipefail
cd "$(dirname "$0")"
docker compose exec -T api node dist/scripts/demo.js "$@"
