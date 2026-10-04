# Bailio sur un VPS (Infomaniak)

Un seul serveur, en Suisse, fait tourner :
- **l'API** : bail, quittances, rappels, et la lecture des baux importés (Tesseract, sur le serveur) ;
- **PostgreSQL** : jamais exposée sur internet ;
- **Caddy** : le HTTPS (certificats automatiques) ; il peut aussi servir le site lui-même (voir plus bas).

Pour l'instant, le site reste sur **bailio.fr (Vercel)**, et Vercel relaie `/api` vers `api.bailio.eu`
(`client/vercel.json`). Le navigateur des visiteurs ne contacte donc que bailio.fr, un domaine ancien et connu :
les filtres réseau qui bloquent les domaines récemment créés (comme bailio.eu) ne gênent personne.

Aucun service extérieur ne reçoit les documents des propriétaires. Les emails partent de ce serveur par la messagerie Ionos de bailio.fr (SMTP authentifié, port 587) : un VPS Lite ne peut pas les remettre lui-même (port 25 sortant fermé par Infomaniak).

### Emails par la messagerie Ionos

1. Sur le serveur : `sudo nano /opt/bailio/deploy/vps/.env` et renseignez :
   `SMTP_HOST=smtp.ionos.fr`, `SMTP_PORT=587`, `SMTP_USER=` l'adresse de la boîte Ionos (par exemple contact@bailio.fr),
   `SMTP_PASS=` son mot de passe, `EMAIL_FROM=Bailio <la même adresse>`.
2. `cd /opt/bailio/deploy/vps && sudo docker compose up -d api`
3. Vérifiez https://api.bailio.eu/health : `"email":"smtp"`. Demandez un lien de connexion pour contrôler la réception.

## Mettre à jour

**Automatique** : à chaque push sur `main`, GitHub Actions lance toutes les vérifications ; si elles passent, la
branche `production` est avancée. Toutes les 5 minutes, le serveur regarde cette branche et se met à jour seul
(`auto-update.sh`, activé par `install.sh`). Une version qui échoue aux tests n'est jamais mise en ligne.

Vérification : https://api.bailio.eu/health affiche la version en ligne (`"version":"abc1234"`, le début du
numéro du dernier commit validé).

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
| Restaurer une sauvegarde | `sudo ./restore.sh /opt/bailio-backups/bailio-AAAA-MM-JJ.sql.gz` (ou `bailio-AAAA-MM-JJ.sql.gz.enc` pour la copie hors serveur) |

## Sauvegarde hors du serveur (à activer)

Chaque nuit, `backup.sh` garde une copie sur le serveur (14 jours). Pour qu'une panne du serveur ne fasse rien
perdre, il envoie aussi une copie **chiffrée** (AES-256) vers un stockage externe compatible S3, gardée 30 jours.

1. Créez un stockage S3 : par exemple Manager Infomaniak → **Swiss Backup** → espace « S3 compatible »
   (ou Infomaniak Object Storage, Scaleway, OVH). Notez l'adresse (endpoint), le nom du compartiment (bucket),
   la clé d'accès et la clé secrète.
2. Générez une phrase secrète : `openssl rand -base64 32`. **Notez-la ailleurs que sur le serveur**
   (gestionnaire de mots de passe) : sans elle, impossible de restaurer.
3. Sur le serveur : `sudo nano /opt/bailio/deploy/vps/.env` et remplissez `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION`
   (si demandée), `BACKUP_S3_BUCKET`, `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY`, `BACKUP_PASSPHRASE`.
4. Testez tout de suite : `sudo /opt/bailio/deploy/vps/backup.sh` doit afficher « copie hors serveur OK ».

Journal : `/var/log/bailio-backup.log`.
