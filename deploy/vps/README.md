# Mettre l'API Bailio en ligne sur un VPS (Infomaniak)

Un seul serveur fait tourner l'API, la base PostgreSQL (non exposée sur internet) et le HTTPS (Caddy, certificat automatique).
Le site reste sur Vercel. Durée : environ 30 minutes.

## 1. Commander le serveur (Infomaniak)

- Produit : **VPS Lite**, système **Ubuntu 24.04**, **2 Go de RAM minimum** (le script ajoute 2 Go de mémoire de secours).
- Dans le Manager Infomaniak → **Régler le Firewall** : ouvrez les ports **80** et **443** (TCP), en plus du 22 (SSH).
- À la commande, ajoutez votre **clé SSH** (plus sûr qu'un mot de passe ; le script désactive alors les mots de passe SSH).
- Notez l'**adresse IP** du serveur.

## 2. Faire pointer api.bailio.eu vers le serveur (Ionos)

Ionos → Domaines → bailio.fr → DNS → Ajouter un enregistrement :
- type **A**, nom d'hôte **api**, valeur = **l'IP du serveur**.
- (si le serveur a une IPv6 : type **AAAA**, nom **api**, valeur = l'IPv6)

Ne touchez pas aux enregistrements existants de bailio.fr (ils pointent vers Vercel).

## 3. Installer

Connectez-vous au serveur (`ssh root@IP`, ou `ssh ubuntu@IP` puis `sudo -i`), puis :

```bash
curl -fsSL https://raw.githubusercontent.com/unicorn-fr/mon-saas-immo/main/deploy/vps/install.sh -o install.sh
bash install.sh
```

Si le téléchargement échoue (dépôt privé), ouvrez `deploy/vps/install.sh` sur GitHub, copiez son contenu,
puis sur le serveur : `nano install.sh`, collez, enregistrez, et `bash install.sh`.

Le script :
- met le système à jour et active les mises à jour de sécurité automatiques ;
- ferme tous les ports sauf SSH, HTTP et HTTPS, et bloque les tentatives de connexion répétées (fail2ban) ;
- installe Docker, récupère le code (il vous demandera d'ajouter une clé de déploiement GitHub si le dépôt est privé) ;
- crée le fichier `.env` avec un mot de passe de base aléatoire, et vous l'ouvre pour compléter les emails (SMTP Ionos) ;
- démarre l'API, la base et le HTTPS, et programme une sauvegarde de la base chaque nuit (14 jours conservés).

Vérification : https://api.bailio.eu/health doit afficher `{"ok":true}`.

## 4. Brancher le site (Vercel)

Vercel → projet **bailio** → Settings → Environment Variables :
- `VITE_API_URL` = `https://api.bailio.eu`

Puis Deployments → dernier déploiement → **Redeploy**.

## Au quotidien

| Besoin | Commande (sur le serveur) |
|---|---|
| Mettre à jour Bailio après un push sur `main` | `/opt/bailio/deploy/vps/update.sh` |
| Voir les journaux | `cd /opt/bailio/deploy/vps && docker compose logs -f api` |
| Sauvegarder maintenant | `/opt/bailio/deploy/vps/backup.sh` |
| Restaurer une sauvegarde | `gunzip -c /opt/bailio-backups/bailio-AAAA-MM-JJ.sql.gz \| docker compose exec -T db psql -U bailio -d bailio` |

Conseil : copiez régulièrement `/opt/bailio-backups` ailleurs (par exemple Swiss Backup d'Infomaniak) : une sauvegarde sur le même serveur ne protège pas d'une panne du serveur.
