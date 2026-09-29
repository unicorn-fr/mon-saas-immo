# Bailio

Le bail et le suivi locatif du propriétaire bailleur particulier.
Le propriétaire crée un bail conforme en 5 minutes, sans compte ; Bailio prépare ensuite ses quittances et lui rappelle chaque échéance.

Maquette de référence : [`docs/maquette/bailio-refonte-proprietaire.html`](docs/maquette/bailio-refonte-proprietaire.html).

## Démarrer en local

Prérequis : Node 20+, PostgreSQL.

```bash
npm run install:all                        # installe server/ et client/ (un package-lock.json chacun)
cp server/.env.example server/.env        # renseigner DATABASE_URL
npm --prefix server run db:migrate         # crée les tables
npm run dev                                # API sur :5000, site sur :5173
```

Sans `RESEND_API_KEY`, les emails (lien de reprise, lien de connexion) s'affichent dans le terminal de l'API.

## Structure

```
client/   site et application (React 19, Vite, TypeScript) — déployé sur Vercel
server/   API (Express 5, Prisma, PostgreSQL, React-PDF) — déployée sur Railway (Dockerfile)
docs/     maquette et documents de conception
```

## Parcours

| Route | Écran |
|---|---|
| `/` | Accueil |
| `/commencer` → `/logement` → `/personnes` → `/loyer` → `/relecture` | Tunnel « Créer mon bail » en 5 étapes, sans compte, enregistré à chaque saisie |
| `/commencer/recevoir` | « Votre bail est prêt » : email ou Google, le compte est créé à ce moment-là |
| `/bienvenue/:id` | Bail téléchargé, imprimé, suivi à activer |
| `/importer` | « J'ai déjà un bail signé » : photos ou PDF lus par l'IA, puis relecture |
| `/reprendre?brouillon=…` | Reprise d'un bail commencé (lien reçu par email) |
| `/connexion` | Lien de connexion par email ou Google (pas de mot de passe) |
| `/espace` | « Aujourd'hui » : la liste de ce qu'il y a à faire, les logements |
| `/espace/baux/:id` | Un bail : documents, quittances, échéances |
| `/espace/compte` | Nom, suivi par email, export et suppression des données |

## Variables d'environnement

**API (`server/.env`)** — voir `server/.env.example` :
`DATABASE_URL`, `CLIENT_URL` (URL publique du site, utilisée dans les emails ; `FRONTEND_URL` accepté), `CORS_ORIGINS` (`CORS_ORIGIN` accepté),
emails par SMTP (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`) ou Resend (`RESEND_API_KEY`), `EMAIL_FROM`,
`GOOGLE_CLIENT_ID` (facultatif), `ANTHROPIC_API_KEY` et `ANTHROPIC_MODEL` (facultatif, import de bail).
https://bailio.fr et https://www.bailio.fr sont toujours autorisés.

**Site (Vercel)** : `VITE_API_URL` = URL de l'API (ex. `https://api.bailio.fr` ; un `/api` ou `/api/v1` final est ignoré).

## Déploiement

- **Site** : Vercel, dossier racine `client`, commande `npm run build`, sortie `dist`.
- **API** : Railway, `Dockerfile` à la racine (ou dossier `server/` avec `server/railway.json`). Au démarrage, `prisma migrate deploy` applique les migrations versionnées (jamais de suppression automatique de données).
- Un cron quotidien (8 h, heure de Paris) prolonge les échéances et envoie l'email de rappel aux propriétaires qui ont activé le suivi.

## Vérifications

```bash
npm run typecheck   # client + serveur
npm test            # règles légales et échéances
npm run build
```
