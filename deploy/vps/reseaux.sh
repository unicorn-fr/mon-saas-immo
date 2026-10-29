#!/usr/bin/env bash
# Publication sur les réseaux sociaux (n8n), sur ce serveur, à côté de Bailio.
#
# Activer :     sudo /opt/bailio/deploy/vps/reseaux.sh reseaux.bailio.fr
# Désactiver :  sudo /opt/bailio/deploy/vps/reseaux.sh --off
#
# Avant d'activer : enregistrement DNS A « reseaux » de bailio.fr vers ce serveur (même adresse que bailio.fr).
# L'adresse est protégée par un identifiant et un mot de passe générés ici, affichés une seule fois et gardés
# dans /root/bailio-reseaux.txt. Le site n'est jamais touché : en cas d'erreur, tout est remis comme avant.
set -euo pipefail
cd "$(dirname "$0")"

# Adresse protégée par mot de passe, relayée vers n8n (vérifiée aussi en CI : reseaux.sh --print-site).
site_block() {
  cat <<CADDY
# Écrit par reseaux.sh : publication sur les réseaux sociaux (n8n), protégée par mot de passe.
$1 {
	import securite
	request_body {
		max_size 1GB
	}
	basic_auth {
		bailio $2
	}
	reverse_proxy n8n:5678
}
CADDY
}
if [ "${1:-}" = "--print-site" ]; then site_block "$2" "$3"; exit 0; fi

[ "$(id -u)" -eq 0 ] || { echo "Lancez cette commande avec sudo."; exit 1; }
[ -f .env ] || { echo "Fichier .env introuvable : Bailio n'est pas installé ici."; exit 1; }

SITE_FILE=sites/reseaux.caddy
set_env() {
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else printf '%s=%s\n' "$1" "$2" >> .env; fi
}
reload_caddy() { docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile; }

if [ "${1:-}" = "--off" ]; then
  rm -f "$SITE_FILE"
  reload_caddy
  docker compose stop n8n 2>/dev/null || true
  sed -i '/^COMPOSE_PROFILES=/d' .env
  echo "Publication sur les réseaux sociaux désactivée (les réglages de n8n sont gardés pour une réactivation)."
  exit 0
fi

DOMAIN="${1:-}"
if ! printf '%s' "$DOMAIN" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$'; then
  echo "Indiquez l'adresse, par exemple : sudo $0 reseaux.bailio.fr"
  exit 1
fi
if ! getent ahosts "$DOMAIN" >/dev/null; then
  echo "L'adresse $DOMAIN n'existe pas encore. Ajoutez d'abord l'enregistrement DNS A « ${DOMAIN%%.*} » vers ce serveur"
  echo "(Manager Infomaniak → Domaines → zone DNS), attendez quelques minutes, puis relancez cette commande."
  exit 1
fi

mkdir -p sites
PASS="$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | cut -c1-24)"
HASH="$(docker compose exec -T caddy caddy hash-password --plaintext "$PASS" | tr -d '\r\n')"
[ -n "$HASH" ] || { echo "Le mot de passe n'a pas pu être préparé : rien n'a été changé."; exit 1; }

site_block "$DOMAIN" "$HASH" > "$SITE_FILE"
chmod 644 "$SITE_FILE"

# Vérification avant de toucher au site : une adresse refusée est retirée, le site reste tel quel.
if ! docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  rm -f "$SITE_FILE"
  echo "La configuration n'a pas été acceptée : rien n'a été changé."
  exit 1
fi

set_env RESEAUX_DOMAIN "$DOMAIN"
set_env COMPOSE_PROFILES reseaux
docker compose up -d n8n
reload_caddy

umask 077
printf 'Adresse : https://%s\nIdentifiant : bailio\nMot de passe : %s\n' "$DOMAIN" "$PASS" > /root/bailio-reseaux.txt
echo
echo "C'est prêt : https://$DOMAIN (le certificat HTTPS arrive en une minute environ)."
echo "  Identifiant : bailio"
echo "  Mot de passe : $PASS"
echo "Notez-le dans votre gestionnaire de mots de passe (copie gardée dans /root/bailio-reseaux.txt)."
echo "À la première visite, n8n vous demande de créer votre compte : utilisez votre adresse et un autre mot de passe."
