# Bailio

Le bail et le suivi locatif du propriétaire bailleur particulier.
Le propriétaire crée un bail conforme en 5 minutes, sans compte ; Bailio prépare ensuite ses quittances et lui rappelle chaque échéance.

Maquette de référence : [`docs/maquette/bailio-refonte-proprietaire.html`](docs/maquette/bailio-refonte-proprietaire.html).

## Démarrer en local

Prérequis : Node 20+, PostgreSQL. Pour l'import de baux : `tesseract-ocr`, `tesseract-ocr-fra` et `poppler-utils` (sinon l'import s'affiche comme indisponible).

```bash
npm run install:all                        # installe server/ et client/ (un package-lock.json chacun)
cp server/.env.example server/.env        # renseigner DATABASE_URL
npm --prefix server run db:migrate         # crée les tables
npm run dev                                # API sur :5000, site sur :5173
```

Sans `SMTP_HOST`, `SMTP_USER` et `SMTP_PASS`, les emails (lien de reprise, lien de connexion) s'affichent dans le terminal de l'API.

## Structure

```
client/   site et application (React 19, Vite, TypeScript)
server/   API (Express 5, Prisma, PostgreSQL, React-PDF, lecture des baux importés)
deploy/   hébergement sur un VPS : API + base + HTTPS, mise à jour automatique (deploy/vps)
e2e/      parcours complets dans un navigateur (Playwright)
docs/     maquette et documents de conception
```

## Parcours

| Route | Écran |
|---|---|
| `/` | Accueil |
| `/commencer` → `/logement` → `/personnes` → `/loyer` → `/relecture` | Tunnel « Créer mon bail » en 5 étapes, sans compte, enregistré à chaque saisie |
| `/commencer/recevoir` | L'email est confirmé par un lien ; le compte et le bail (en préparation) sont créés au clic |
| `/bienvenue/:id` | Bail enregistré : mentions restantes à compléter, puis signature |
| `/importer` | « J'ai déjà un bail signé » : photos ou PDF lus sur le serveur (Tesseract + règles, `server/src/services/import`), puis relecture |
| `/reprendre?brouillon=…` | Reprise d'un bail commencé (lien reçu par email) |
| `/connexion` | Lien de connexion par email (pas de mot de passe) |
| `/espace` | « Aujourd'hui » : la liste de ce qu'il y a à faire, les logements |
| `/espace/baux/:id` | Un bail : documents, quittances, échéances |
| `/espace/compte` | Nom, suivi par email, export et suppression des données |
| `/signer/:jeton` | Signature électronique (lien personnel reçu par email, sans compte) |

## Variables d'environnement

**API (`server/.env`)** — voir `server/.env.example` :
`DATABASE_URL`, `CLIENT_URL` (URL publique du site, utilisée dans les emails ; `FRONTEND_URL` accepté), `CORS_ORIGINS` (`CORS_ORIGIN` accepté),
emails par SMTP, Service Mail Infomaniak en ligne (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`), `EMAIL_FROM`,
https://bailio.eu, https://www.bailio.eu, https://bailio.fr et https://www.bailio.fr sont toujours autorisés.

**Site** : `VITE_SITE_URL` (adresse publique, `https://bailio.fr` par défaut). L'API est toujours appelée sur `/api`, même adresse que le site : relayée par Caddy sur le VPS, par Vite en local.

## Déploiement

- **Tout sur un seul serveur** : VPS Infomaniak (Genève) avec Docker, voir [`deploy/vps/README.md`](deploy/vps/README.md). Caddy sert le site sur https://bailio.fr (www.bailio.fr, bailio.eu et www.bailio.eu y redirigent), relaie `/api` vers l'API et assure le HTTPS ; l'API reste joignable sur https://api.bailio.eu ; la base n'est pas exposée. Emails : Service Mail Infomaniak de bailio.fr. À chaque push sur `main`, GitHub Actions vérifie tout (types, tests, construction, parcours dans un navigateur) puis avance la branche `production` ; le serveur suit cette branche et se met à jour seul toutes les 5 minutes ; la version en ligne est affichée par https://bailio.fr/health. Au démarrage, `prisma migrate deploy` applique les migrations versionnées (jamais de suppression automatique de données).
- Un cron quotidien (8 h, heure de Paris) prolonge les échéances et envoie l'email de rappel aux propriétaires qui ont activé le suivi (actif par défaut à l'inscription).

## Sécurité

- Connexion sans mot de passe (lien magique, 30 minutes). Une session inutilisée 30 jours est fermée.
- « Mon compte » liste les appareils connectés (appareil, adresse IP, dernière visite) ; chacun peut être déconnecté, ou tous les autres d'un coup.
- L'export des données et la suppression du compte demandent un code à 6 chiffres envoyé par email (10 minutes, 5 essais, usage unique).
- Dependabot propose chaque semaine les mises à jour des dépendances ; la CI refuse une faille connue de gravité haute (`npm audit`).

## Vérifications

```bash
npm run typecheck   # client + serveur
npm test            # serveur : règles légales, échéances, lecture des baux (photos si Tesseract est installé) ; site : vitest
npm run build
npm run test:e2e    # parcours complets dans un navigateur (API et site lancés en local, voir e2e/README.md)
```
