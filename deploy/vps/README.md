# Bailio sur un VPS (Infomaniak)

Un seul serveur, en Suisse, fait tourner :
- **l'API** : bail, quittances, rappels, et la lecture des baux importés (Tesseract, sur le serveur) ;
- **PostgreSQL** : jamais exposée sur internet ;
- **Caddy** : le HTTPS (certificats automatiques) ; il peut aussi servir le site lui-même (voir plus bas).

Pour l'instant, le site reste sur **bailio.fr (Vercel)**, et Vercel relaie `/api` vers `api.bailio.eu`
(`client/vercel.json`). Le navigateur des visiteurs ne contacte donc que bailio.fr, un domaine ancien et connu :
les filtres réseau qui bloquent les domaines récemment créés (comme bailio.eu) ne gênent personne.

Aucun service extérieur ne reçoit les documents des propriétaires. Seul Resend reçoit les emails à envoyer.

## Mettre à jour

**Automatique** : toutes les 5 minutes, le serveur regarde la branche `main` sur GitHub et se met à jour seul
s'il y a du nouveau (`auto-update.sh`, activé par `install.sh`). Rien à faire après un push.

Vérification : https://api.bailio.eu/health affiche la version en ligne (`"version":"abc1234"`, le début du
numéro du dernier commit de `main`).

**À la main** (ou pour activer la mise à jour automatique sur un serveur installé avant) — les commandes se tapent
**sur le serveur**, pas sur votre ordinateur. Ouvrez d'abord une session sur le serveur :

```bash
ssh -i ~/.ssh/VOTRE_CLE ubuntu@179.237.104.243
```

(ou, sans SSH : Manager Infomaniak → votre VPS → **Console**), puis :

```bash
cd /opt/bailio && sudo git pull --ff-only
sudo deploy/vps/update.sh                 # mise à jour immédiate
sudo deploy/vps/auto-update.sh --install  # mises à jour automatiques ensuite
```

Journal des mises à jour automatiques : `journalctl -u bailio-auto-update -n 50`.

## Servir le site depuis ce serveur (plus tard, quand bailio.fr sera récupéré chez Ionos)

1. Zone DNS de bailio.fr : A « @ » et A « www » vers l'IP du serveur (et AAAA vers l'IPv6), en supprimant les
   enregistrements Vercel.
2. Dans `/opt/bailio/deploy/vps/.env` :
   ```
   SITE_DOMAIN=bailio.fr
   SITE_REDIRECT_DOMAINS=www.bailio.fr, bailio.eu, www.bailio.eu
   SITE_URL=https://bailio.fr
   ```
   (pour bailio.eu et www : A/AAAA vers le serveur aussi, dans la zone DNS Infomaniak)
3. `sudo /opt/bailio/deploy/vps/update.sh`. Caddy obtient les certificats seul, en quelques minutes.
4. Le projet Vercel peut alors être supprimé.

Tant que `SITE_DOMAIN` est vide, le serveur ne sert pas le site (seulement l'API).

## Première installation (nouveau serveur)

- Produit : **VPS Lite**, **Ubuntu 24.04**, **2 Go de RAM minimum** (le script ajoute 2 Go de mémoire de secours).
- Manager Infomaniak → **Firewall** : ouvrez **80** et **443** (TCP), en plus du 22 (SSH). Ajoutez votre **clé SSH** à la commande.
- DNS : voir plus haut.
- Sur le serveur :

```bash
curl -fsSL https://raw.githubusercontent.com/unicorn-fr/mon-saas-immo/main/deploy/vps/install.sh -o install.sh
sudo bash install.sh
```

Le script met le système à jour (mises à jour de sécurité automatiques), ferme tous les ports sauf SSH/HTTP/HTTPS,
active fail2ban, installe Docker, crée `.env` (mot de passe de base aléatoire), démarre tout et programme une sauvegarde
de la base chaque nuit (14 jours conservés).

## Au quotidien

| Besoin | Commande (sur le serveur) |
|---|---|
| Mettre à jour Bailio après un push sur `main` | automatique (5 min) ; à la main : `sudo /opt/bailio/deploy/vps/update.sh` |
| Voir la version en ligne | https://api.bailio.eu/health |
| Voir les journaux | `cd /opt/bailio/deploy/vps && sudo docker compose logs -f api` (ou `caddy`) |
| Sauvegarder maintenant | `sudo /opt/bailio/deploy/vps/backup.sh` |
| Restaurer une sauvegarde | `gunzip -c /opt/bailio-backups/bailio-AAAA-MM-JJ.sql.gz \| sudo docker compose exec -T db psql -U bailio -d bailio` |

Conseil : copiez régulièrement `/opt/bailio-backups` ailleurs (par exemple Swiss Backup d'Infomaniak) : une sauvegarde
sur le même serveur ne protège pas d'une panne du serveur.
