#!/usr/bin/env bash
# Installation de l'API Bailio sur un serveur Ubuntu 24.04 neuf (VPS Infomaniak).
# Usage (en root) :  curl -fsSL <url de ce fichier> -o install.sh && bash install.sh
# Le script peut être relancé sans risque : il ne refait que ce qui manque.
set -euo pipefail

REPO_HTTPS="https://github.com/unicorn-fr/mon-saas-immo.git"
REPO_SSH="git@github-bailio:unicorn-fr/mon-saas-immo.git"
APP_DIR="/opt/bailio"
BACKUP_DIR="/opt/bailio-backups"
COMPOSE_DIR="$APP_DIR/deploy/vps"

say() { printf '\n\033[1;34m▶ %s\033[0m\n' "$*"; }
[ "$(id -u)" -eq 0 ] || { echo "Lancez ce script en root (sudo -i)."; exit 1; }

say "1/7 Mise à jour du système et outils de sécurité"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -yq
apt-get install -yq ca-certificates curl git ufw fail2ban unattended-upgrades openssl
dpkg-reconfigure -f noninteractive unattended-upgrades   # mises à jour de sécurité automatiques
systemctl enable --now fail2ban                          # bloque les tentatives de connexion SSH répétées

# Mémoire de secours (swap) : indispensable sur les serveurs à 2 Go pour construire l'application.
if ! swapon --show | grep -q . ; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  sysctl -q vm.swappiness=10 && echo 'vm.swappiness=10' > /etc/sysctl.d/99-bailio-swap.conf
  echo "Mémoire de secours de 2 Go activée."
fi

say "2/7 Pare-feu : seuls SSH, HTTP et HTTPS sont ouverts"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

say "3/7 Connexion SSH par clé uniquement (si une clé est déjà installée)"
if find /root/.ssh /home/*/.ssh -name authorized_keys -size +0 2>/dev/null | grep -q .; then
  printf 'PasswordAuthentication no\nPermitRootLogin prohibit-password\n' > /etc/ssh/sshd_config.d/99-bailio.conf
  systemctl reload ssh || systemctl reload sshd || true
  echo "Mots de passe SSH désactivés."
else
  echo "Aucune clé SSH trouvée : mots de passe SSH laissés actifs (ajoutez une clé puis relancez le script)."
fi

say "4/7 Docker"
if ! command -v docker >/dev/null; then curl -fsSL https://get.docker.com | sh; fi
systemctl enable --now docker

say "5/7 Code de Bailio"
if [ ! -d "$APP_DIR/.git" ]; then
  if ! GIT_TERMINAL_PROMPT=0 git clone --depth 1 "$REPO_HTTPS" "$APP_DIR" 2>/dev/null; then
    # Dépôt privé : clé de déploiement en lecture seule.
    KEY=/root/.ssh/bailio_deploy
    mkdir -p /root/.ssh && chmod 700 /root/.ssh
    [ -f "$KEY" ] || ssh-keygen -t ed25519 -N "" -C "bailio-vps" -f "$KEY" >/dev/null
    grep -q "Host github-bailio" /root/.ssh/config 2>/dev/null || printf 'Host github-bailio\n  HostName github.com\n  User git\n  IdentityFile %s\n  IdentitiesOnly yes\n' "$KEY" >> /root/.ssh/config
    ssh-keyscan -t ed25519 github.com >> /root/.ssh/known_hosts 2>/dev/null
    echo
    echo "Le dépôt GitHub est privé. Ajoutez cette clé dans GitHub :"
    echo "  dépôt mon-saas-immo → Settings → Deploy keys → Add deploy key (NE PAS cocher « Allow write access »)"
    echo
    cat "$KEY.pub"
    echo
    read -r -p "Appuyez sur Entrée une fois la clé ajoutée… " _
    git clone --depth 1 "$REPO_SSH" "$APP_DIR"
  fi
fi

say "6/7 Configuration (.env)"
cd "$COMPOSE_DIR"
if [ ! -f .env ]; then
  cp .env.example .env
  sed -i "s/^POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env
  chmod 600 .env
  echo "Complétez les emails (SMTP_USER, SMTP_PASS…) et les clés facultatives, puis enregistrez (Ctrl+O, Entrée, Ctrl+X)."
  read -r -p "Appuyez sur Entrée pour ouvrir le fichier… " _
  ${EDITOR:-nano} .env
fi
chmod 600 .env

say "7/7 Démarrage (construction de l'image : quelques minutes)"
BAILIO_VERSION="$(git -C "$APP_DIR" rev-parse --short HEAD)" docker compose up -d --build

# Sauvegarde quotidienne de la base à 3 h 15, conservée 14 jours.
mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"
echo "15 3 * * * root $COMPOSE_DIR/backup.sh >> /var/log/bailio-backup.log 2>&1" > /etc/cron.d/bailio-backup
chmod +x "$COMPOSE_DIR/backup.sh" "$COMPOSE_DIR/update.sh" "$COMPOSE_DIR/auto-update.sh"
# Mise à jour automatique après chaque push sur main.
"$COMPOSE_DIR/auto-update.sh" --install

DOMAIN=$(grep '^SITE_DOMAIN=' .env | cut -d= -f2)
say "Terminé."
echo "Vérification dans une minute : https://${DOMAIN:-bailio.eu} doit afficher le site, et /health {\"ok\":true}"
echo "Journaux de l'API :  cd $COMPOSE_DIR && docker compose logs -f api"
echo "Mettre à jour :      $COMPOSE_DIR/update.sh"
