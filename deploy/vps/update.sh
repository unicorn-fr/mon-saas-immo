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
# --pull : images de base (Node, PostgreSQL, Caddy) retéléchargées à chaque mise à jour, pour leurs correctifs de sécurité.
docker compose pull -q db
docker compose build --pull
docker compose up -d --remove-orphans
date +%s > /var/tmp/bailio-last-update 2>/dev/null || true
docker image prune -f >/dev/null
echo "Bailio est à jour (version $BAILIO_VERSION, Node $(docker compose exec -T api node -p process.version 2>/dev/null || echo '?'))."

# Moteurs de recherche (IndexNow : Bing, Yandex, Seznam… ; DuckDuckGo et Qwant s'appuient sur Bing) : toutes les
# pages du plan du site leur sont signalées après chaque mise à jour, pour que les nouveaux guides soient vus vite.
# Google lit le plan du site de lui-même (déclaré une fois dans la Search Console). Sans effet si SITE_DOMAIN est vide.
INDEXNOW_KEY=ca9ecfec4f87d752eed54b9db7ddd7c4
SITE_DOMAIN="$(grep -E '^SITE_DOMAIN=' .env 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [ -n "$SITE_DOMAIN" ]; then
  sleep 20
  URLS="$(curl -fsS -m 20 "https://$SITE_DOMAIN/sitemap.xml" 2>/dev/null | grep -o '<loc>[^<]*</loc>' | sed 's#</*loc>##g' | sed 's/.*/"&"/' | paste -sd, - || true)"
  if [ -n "$URLS" ]; then
    curl -fsS -m 20 -o /dev/null -X POST https://api.indexnow.org/indexnow -H 'Content-Type: application/json; charset=utf-8' \
      -d "{\"host\":\"$SITE_DOMAIN\",\"key\":\"$INDEXNOW_KEY\",\"keyLocation\":\"https://$SITE_DOMAIN/$INDEXNOW_KEY.txt\",\"urlList\":[$URLS]}" \
      && echo "Pages signalées aux moteurs de recherche (IndexNow)." || echo "IndexNow indisponible : les moteurs passeront par le plan du site."
  fi
fi
