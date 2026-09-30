# Bailio sur un VPS (Infomaniak)

Un seul serveur, en Suisse, fait tout tourner :
- **Caddy** : sert le site (bailio.eu), le HTTPS (certificats automatiques) et relaie `/api` vers l'API ;
- **l'API** : bail, quittances, rappels, et la lecture des baux importés (Tesseract, sur le serveur) ;
- **PostgreSQL** : jamais exposée sur internet.

Aucun service extérieur ne reçoit les documents des propriétaires. Seul Resend reçoit les emails à envoyer.

## Mettre à jour (serveur déjà installé)

```bash
ssh -i ~/.ssh/bailio_infomaniak ubuntu@IP_DU_SERVEUR
sudo /opt/bailio/deploy/vps/update.sh
```

La première fois après le passage du site sur le serveur, `update.sh` ajoute seul à `.env` :
`SITE_DOMAIN=bailio.eu`, `SITE_REDIRECT_DOMAINS=www.bailio.eu`, et passe `CLIENT_URL` à `https://bailio.eu`.

## Faire pointer bailio.eu vers le serveur (zone DNS Infomaniak)

Manager Infomaniak → Domaines → bailio.eu → Zone DNS :

| Type | Nom | Valeur |
|---|---|---|
| A | (vide, « @ ») | IP du serveur (IPv4) |
| AAAA | (vide, « @ ») | IPv6 du serveur (si vous en avez une) |
| A | www | IP du serveur (IPv4) |
| AAAA | www | IPv6 du serveur |
| A / AAAA | api | IP du serveur (déjà en place) |

Supprimez l'ancien enregistrement **A 216.198.79.1** (Vercel) et le **CNAME www** vers vercel-dns.
Le certificat HTTPS est obtenu tout seul par Caddy quelques minutes après la propagation.

Vérification : https://bailio.eu affiche le site, https://www.bailio.eu redirige vers https://bailio.eu,
https://bailio.eu/health affiche `{"ok":true}`.

## bailio.fr (en attendant la récupération du compte Ionos)

bailio.fr pointe encore vers Vercel. Dans Vercel → projet → Settings → Domains :
retirez bailio.eu et www.bailio.eu, puis pour **bailio.fr** et **www.bailio.fr** choisissez
« Redirect to another domain » → `https://bailio.eu` (308). Vercel ne sert plus alors que cette redirection.

Quand l'accès Ionos sera récupéré : faites pointer bailio.fr et www (A/AAAA) vers l'IP du serveur, puis dans `.env` :
`SITE_REDIRECT_DOMAINS=www.bailio.eu, bailio.fr, www.bailio.fr` et relancez `update.sh`. Vous pourrez alors supprimer le projet Vercel.

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
| Mettre à jour Bailio après un push sur `main` | `sudo /opt/bailio/deploy/vps/update.sh` |
| Voir les journaux | `cd /opt/bailio/deploy/vps && sudo docker compose logs -f api` (ou `caddy`) |
| Sauvegarder maintenant | `sudo /opt/bailio/deploy/vps/backup.sh` |
| Restaurer une sauvegarde | `gunzip -c /opt/bailio-backups/bailio-AAAA-MM-JJ.sql.gz \| sudo docker compose exec -T db psql -U bailio -d bailio` |

Conseil : copiez régulièrement `/opt/bailio-backups` ailleurs (par exemple Swiss Backup d'Infomaniak) : une sauvegarde
sur le même serveur ne protège pas d'une panne du serveur.
