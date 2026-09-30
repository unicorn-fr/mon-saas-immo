#!/usr/bin/env bash
# Met Bailio à jour avec la dernière version de la branche main (site + API).
set -euo pipefail
cd "$(dirname "$0")"
git -C ../.. pull --ff-only

# Réglages apparus avec l'hébergement du site sur ce serveur (ajoutés une seule fois, sans toucher au reste).
if ! grep -q '^SITE_DOMAIN=' .env; then
  {
    echo ''
    echo '# Site servi par ce serveur (ajouté automatiquement par update.sh)'
    echo 'SITE_DOMAIN=bailio.eu'
    echo 'SITE_REDIRECT_DOMAINS=www.bailio.eu'
  } >> .env
  echo "Ajouté à .env : SITE_DOMAIN=bailio.eu et SITE_REDIRECT_DOMAINS=www.bailio.eu"
fi
SITE_DOMAIN=$(grep '^SITE_DOMAIN=' .env | cut -d= -f2)
if grep -q '^CLIENT_URL=' .env; then
  sed -i "s#^CLIENT_URL=.*#CLIENT_URL=https://${SITE_DOMAIN}#" .env
else
  echo "CLIENT_URL=https://${SITE_DOMAIN}" >> .env
fi

docker compose up -d --build --remove-orphans
docker image prune -f >/dev/null
echo "Bailio est à jour : https://${SITE_DOMAIN}"
