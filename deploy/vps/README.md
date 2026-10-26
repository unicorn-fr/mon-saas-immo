# Bailio sur un VPS (Infomaniak)

Un seul serveur, en Suisse, fait tourner :
- **le site** (https://bailio.fr) : fichiers statiques servis par Caddy, qui relaie `/api` vers l'API ;
- **l'API** : bail, quittances, rappels, et la lecture des baux importés (Tesseract, sur le serveur), aussi joignable sur https://api.bailio.eu ;
- **PostgreSQL** : jamais exposée sur internet ;
- **Caddy** : le HTTPS (certificats Let's Encrypt automatiques) et les redirections de www.bailio.fr, bailio.eu et www.bailio.eu vers bailio.fr.

Aucun service extérieur ne reçoit les documents des propriétaires. Les emails partent de ce serveur par le Service Mail
Infomaniak de bailio.fr (SMTP authentifié, port 587) : un VPS Lite ne peut pas les remettre lui-même (port 25 sortant fermé).

### Emails par le Service Mail Infomaniak

1. Manager Infomaniak → Service Mail → bailio.fr : l'adresse `contact@bailio.fr` (MX, SPF et DKIM gérés par Infomaniak,
   à contrôler dans « Diagnostic DNS »).
2. Sur le serveur, dans `/opt/bailio/deploy/vps/.env` :
   `SMTP_HOST=mail.infomaniak.com`, `SMTP_PORT=587`, `SMTP_USER=contact@bailio.fr`, `SMTP_PASS=` son mot de passe,
   `EMAIL_FROM=Bailio <contact@bailio.fr>`.
3. `cd /opt/bailio/deploy/vps && sudo docker compose up -d api`
4. Vérifiez https://bailio.fr/health : `"email":"smtp"`. Demandez un lien de connexion pour contrôler la réception.

### DNS (zones Infomaniak)

| Domaine | Enregistrements |
|---|---|
| bailio.fr | A et AAAA « @ » et « www » vers le serveur ; MX, SPF, DKIM et DMARC du Service Mail |
| bailio.eu | A et AAAA « @ », « www » et « api » vers le serveur ; enregistrements de son Service Mail |

Dans `.env` : `SITE_DOMAIN=bailio.fr`, `SITE_REDIRECT_DOMAINS=www.bailio.fr, bailio.eu, www.bailio.eu`,
`SITE_URL=https://bailio.fr`, `API_DOMAIN=api.bailio.eu`. Tant que `SITE_DOMAIN` est vide, le serveur ne sert que l'API.

## Mettre à jour

**Automatique** : à chaque push sur `main`, GitHub Actions lance toutes les vérifications ; si elles passent, la
branche `production` est avancée. Toutes les 5 minutes, le serveur regarde cette branche et se met à jour seul
(`auto-update.sh`, activé par `install.sh`). Une version qui échoue aux tests n'est jamais mise en ligne.

Vérification : https://bailio.fr/health affiche la version en ligne (`"version":"abc1234"`, le début du
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

## Première installation (nouveau serveur)

- Produit : **VPS Lite**, **Ubuntu 24.04**, **2 Go de RAM minimum** (le script ajoute 2 Go de mémoire de secours).
- Manager Infomaniak → **Firewall** : ouvrez **80** et **443** (TCP), en plus du 22 (SSH). Ajoutez votre **clé SSH** à la commande.
- DNS : voir « DNS » plus haut, avant de lancer le script (Caddy en a besoin pour les certificats).
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
| Voir la version en ligne | https://bailio.fr/health |
| Voir les journaux | `cd /opt/bailio/deploy/vps && sudo docker compose logs -f api` (ou `caddy`) |
| Sauvegarder maintenant | `sudo /opt/bailio/deploy/vps/backup.sh` |
| Restaurer une sauvegarde | `sudo ./restore.sh /opt/bailio-backups/bailio-AAAA-MM-JJ.sql.gz` (ou `bailio-AAAA-MM-JJ.sql.gz.enc` pour la copie hors serveur) |

## Sauvegarde hors du serveur (à activer)

Chaque nuit, `backup.sh` garde une copie sur le serveur (14 jours). Pour qu'une panne du serveur ne fasse rien
perdre, il envoie aussi une copie **chiffrée** (AES-256) hors du serveur, gardée 30 jours. Deux choix de stockage :
kDrive Infomaniak (WebDAV, **offre payante seulement** : le kDrive gratuit de my kSuite refuse WebDAV, erreur
« 403 Forbidden »), ou un stockage compatible S3 (Backblaze B2 : 10 Go gratuits, bien assez).

Générez d'abord une phrase secrète : `openssl rand -base64 32`. **Notez-la ailleurs que sur le serveur**
(gestionnaire de mots de passe) : sans elle, impossible de restaurer. Elle va dans `BACKUP_PASSPHRASE`.

**Choix A — kDrive Infomaniak par l'API** (marche avec le kDrive gratuit)

1. Manager Infomaniak → **Mon profil → Développeur → Tokens API** → **Créer un token**, autorisation **drive**
   seulement, durée illimitée. Copiez-le (il n'est affiché qu'une fois).
2. Dans kDrive, créez un dossier (par exemple « Sauvegardes Bailio ») et ouvrez-le : l'adresse se termine par
   `/drive/<numéro du kDrive>/files/<numéro du dossier>`.
3. Sur le serveur : remplissez `BACKUP_KDRIVE_TOKEN`, `BACKUP_KDRIVE_DRIVE_ID`, `BACKUP_KDRIVE_FOLDER_ID` et
   `BACKUP_PASSPHRASE`. Les copies de plus de 30 jours partent dans la corbeille du kDrive.

**Choix A bis — kDrive Infomaniak (WebDAV)**, offre kDrive payante (Solo, Team, Pro)

1. Dans le Manager Infomaniak → **Mon profil → Sécurité → Mots de passe d'application** : créez un mot de passe
   d'application dédié (« sauvegarde bailio »). N'utilisez **jamais** le mot de passe principal du compte.
2. Repérez l'ID de votre kDrive (le numéro dans l'URL de kDrive). L'adresse WebDAV est alors
   `https://<ID>.connect.kdrive.infomaniak.com/<ID>`.
3. Sur le serveur : `sudo nano /opt/bailio/deploy/vps/.env` et remplissez `BACKUP_KDRIVE_URL`, `BACKUP_KDRIVE_USER`
   (votre identifiant Infomaniak), `BACKUP_KDRIVE_PASS` (le mot de passe d'application) et `BACKUP_PASSPHRASE`.

**Choix B — stockage compatible S3** (Backblaze B2 gratuit jusqu'à 10 Go, Scaleway, OVH, Swiss Object Storage…)

1. Créez le stockage et notez l'adresse (endpoint), le compartiment (bucket), la clé d'accès et la clé secrète.
   Backblaze B2 : compartiment **privé**, région « EU Central », puis **Application Keys → Add a New Application Key**
   limitée à ce compartiment ; keyID = clé d'accès, applicationKey = clé secrète, endpoint affiché sur le compartiment
   (`https://s3.eu-central-003.backblazeb2.com` par exemple), région = la partie du milieu (`eu-central-003`).
2. Sur le serveur : remplissez `BACKUP_S3_ENDPOINT`, `BACKUP_S3_REGION` (si demandée), `BACKUP_S3_BUCKET`,
   `BACKUP_S3_ACCESS_KEY`, `BACKUP_S3_SECRET_KEY` et `BACKUP_PASSPHRASE`. (Utilisé seulement si les variables
   kDrive sont vides.)

Dans les deux cas, testez tout de suite : `sudo /opt/bailio/deploy/vps/backup.sh` doit afficher
« copie hors serveur OK ». Journal : `/var/log/bailio-backup.log`.

## Compte de démonstration

Pour essayer Bailio avec des données fictives (trois logements, un bail signé avec un loyer en retard, un bail à faire signer, des dépenses et une intervention) :

```bash
cd /opt/bailio/deploy/vps && sudo ./demo.sh adresse@exemple.fr
```

Le compte est créé s'il n'existe pas ; un compte qui a déjà des logements est refusé (sauf `--force`). Les locataires fictifs ont des adresses `@example.com` et l'envoi automatique des quittances est coupé : aucun email ne part vers une vraie personne. Connectez-vous ensuite sur le site avec cette adresse.
