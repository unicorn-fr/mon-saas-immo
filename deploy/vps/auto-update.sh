#!/usr/bin/env bash
# Mise à jour automatique : toutes les 5 minutes, si la version validée (branche production) a changé sur GitHub,
# le serveur se met à jour seul (update.sh). Rien à faire après un push.
#
# Installation (une seule fois, en root) :  /opt/bailio/deploy/vps/auto-update.sh --install
# Journal :                                  journalctl -u bailio-auto-update -n 50
# Désactiver :                               systemctl disable --now bailio-auto-update.timer
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
APP="$(cd "$DIR/../.." && pwd)"

if [ "${1:-}" = "--install" ]; then
  [ "$(id -u)" -eq 0 ] || { echo "Lancez cette commande avec sudo."; exit 1; }
  chmod +x "$DIR/auto-update.sh" "$DIR/update.sh"
  cat > /etc/systemd/system/bailio-auto-update.service <<UNIT
[Unit]
Description=Bailio : mise à jour depuis GitHub (branche main)
After=network-online.target docker.service

[Service]
Type=oneshot
ExecStart=$DIR/auto-update.sh
UNIT
  cat > /etc/systemd/system/bailio-auto-update.timer <<UNIT
[Unit]
Description=Bailio : vérifie les mises à jour toutes les 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
UNIT
  systemctl daemon-reload
  systemctl enable --now bailio-auto-update.timer
  echo "Mise à jour automatique activée (toutes les 5 minutes)."
  exit 0
fi

# Une seule mise à jour à la fois.
exec 9>/run/bailio-auto-update.lock
flock -n 9 || exit 0

# Branche suivie : « production », avancée par GitHub Actions seulement quand tous les tests passent
# (.github/workflows/ci.yml). Tant qu'elle n'existe pas, main.
BRANCH=main
if git -C "$APP" ls-remote --exit-code --heads origin production >/dev/null 2>&1; then BRANCH=production; fi
git -C "$APP" fetch -q origin "$BRANCH:refs/remotes/origin/$BRANCH"
if [ "$(git -C "$APP" rev-parse HEAD)" = "$(git -C "$APP" rev-parse "origin/$BRANCH")" ]; then
  exit 0
fi
echo "Nouvelle version $(git -C "$APP" rev-parse --short "origin/$BRANCH") ($BRANCH) : mise à jour…"
BAILIO_BRANCH="$BRANCH" "$DIR/update.sh"
