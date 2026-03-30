# DOCUMENTATION TECHNIQUE — Bailio

> Générée le 2026-03-30 · Analyse exhaustive de 201 fichiers source

---

## Résumé exécutif

**Bailio** est une plateforme SaaS de gestion locative entre particuliers, permettant à des propriétaires de publier des annonces et gérer leurs locataires, et à des locataires de rechercher un logement, constituer un dossier numérique et signer des contrats. Le tout-en-un couvre : annonces avec carte, visite planifiée, dossier locatif avec scanner IA (OCR + MRZ), contrats légaux (Loi ALUR) avec signature électronique double partie, messagerie temps réel, quittances PDF automatiques et abonnements Stripe (FREE / PRO / EXPERT). Le projet est en phase **Beta avancée / quasi-production** : fonctionnalités core complètes, panel super-admin, audit logs, PWA offline, déployé sur Railway (backend) et Vercel (frontend). La stack est React + Vite + Zustand (frontend) / Express + Prisma + PostgreSQL (backend), TypeScript strict partout, design system "Maison" light editorial.

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique complète](#2-stack-technique-complète)
3. [Infrastructure et déploiement](#3-infrastructure-et-déploiement)
4. [Cartographie des fichiers](#4-cartographie-des-fichiers)
5. [Fonctionnalités implémentées](#5-fonctionnalités-implémentées)
6. [Flux utilisateur principaux](#6-flux-utilisateur-principaux)
7. [Sécurité et points d'attention](#7-sécurité-et-points-dattention)
8. [Dette technique et améliorations](#8-dette-technique-et-améliorations)
9. [Pour reprendre ce projet from scratch](#9-pour-reprendre-ce-projet-from-scratch)

---

## 1. Vue d'ensemble

### Nom et description

**Bailio** — Plateforme de gestion locative entre particuliers.

Application qui met en relation propriétaires et locataires sans intermédiaire agence. Le propriétaire publie ses annonces, planifie des visites, évalue les dossiers, génère des contrats légaux et suit ses paiements. Le locataire cherche un logement, constitue son dossier numérique (analysé par IA), signe électroniquement et reçoit ses quittances automatiquement.

### Type d'application

SaaS B2C avec marketplace immobilière intégrée. Double audience : propriétaires (bailleurs) et locataires. Modèle plateforme fermée (inscription obligatoire, pas d'accès guest aux fonctionnalités).

### Public cible

| Rôle | Qui | Pour quoi faire |
|------|-----|-----------------|
| **OWNER** (Propriétaire) | Particulier bailleur | Publier des annonces, gérer visites, sélectionner locataires, rédiger contrats |
| **TENANT** (Locataire) | Particulier cherchant un logement | Rechercher, visiter, constituer un dossier, signer un bail |
| **ADMIN** | Modérateur Bailio | Valider annonces, gérer signalements, modérer |
| **SUPER_ADMIN** | Fondateur / tech | Accès total : audit, DB explorer, gestion rôles |

### Modèle économique

Freemium par abonnement mensuel ou annuel :

| Plan | Prix visible | Fonctionnalités |
|------|-------------|-----------------|
| **FREE** | 0€ | 1 propriété, pas d'IA, pas de signature électronique |
| **PRO** | Configurable Stripe | 5 propriétés, IA dossier, signature électronique, analytics |
| **EXPERT** | Configurable Stripe | Propriétés illimitées, toutes fonctionnalités |

Essai gratuit 14 jours sur PRO/EXPERT (configuré dans Stripe checkout).

### Stade de développement

**Beta avancée / pré-production.** L'ensemble des fonctionnalités core est implémenté et testable. Un mode waitlist est en place (LAUNCH_MODE env var) permettant de collecter des inscrits avant ouverture publique. Déploiement Railway + Vercel actif. Domaine : `bailio.fr`.

---

## 2. Stack technique complète

### Frontend

| Catégorie | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| Framework | React | 18.3 | UI composants |
| Build tool | Vite | 6.4.1 | Dev server + bundler |
| Language | TypeScript | 5.3.3 | Type safety |
| Routing | React Router DOM | 6.22 | SPA routing + guards |
| Style | TailwindCSS | 3.4.1 | Layout classes (flex, grid, spacing) |
| Style | CSS Variables (foyer-tokens.css) | — | Design system couleurs/typo |
| État global | Zustand | 4.5 | 10 stores (auth, properties, contracts…) |
| Data fetching | @tanstack/react-query | 5.20 | Cache + invalidation serveur |
| HTTP client | Axios | 1.6.7 | Appels API + interceptors JWT |
| Formulaires | React Hook Form | 7.50 | Formulaires + validation |
| Validation | Zod | 3.22 | Schémas de validation côté client |
| PDF viewer | pdfjs-dist | 5.4.624 | Affichage PDF in-app |
| PDF génération | @react-pdf/renderer | 4.3.2 | Génération PDF contrats + quittances |
| Cartes | Leaflet + react-leaflet | 1.9.4 | Carte de recherche + marker propriétés |
| OCR | Tesseract.js | 7.0 | Scanner pièces d'identité (dossier IA) |
| QR/MRZ | jsqr + mrz | 1.4 / 5.0.1 | Lecture MRZ (passeport, CNI) |
| Signature | react-signature-canvas | 1.1.0-alpha | Pad de signature électronique |
| Animations | Framer Motion | 12.34.3 | Animations UI |
| Icônes | Lucide React | 0.331 | Icônes SVG |
| Charts | Recharts | 3.7 | Graphiques Super Admin dashboard |
| Notifications UI | react-hot-toast | 2.6 | Toasts |
| Push notif | Firebase | 12.11 | Firebase Cloud Messaging |
| Captcha | @marsidev/react-turnstile | 1.4.2 | Cloudflare Turnstile |
| PWA | vite-plugin-pwa | 0.21.2 | Service worker + offline |
| Confetti | canvas-confetti | 1.9.4 | Célébration signature contrat |
| ZIP | jszip | 3.10.1 | Téléchargement archive dossier |
| Dropzone | react-dropzone | 14.2.3 | Upload drag & drop |

**Design system "Maison" (light editorial) :**
- Palette éditoriale chaude : `#fafaf8` (fond), `#0d0c0a` (texte), `#1a1a2e` (night/CTA)
- Caramel accent : `#c4976a`
- Typographie : Cormorant Garamond (headers) + DM Sans (corps)
- Pattern : couleurs via `style={{}}` inline, Tailwind uniquement pour layout
- Dual thread : navy `#1a3270` (owner) / forest green `#1b5e3b` (tenant)

### Backend

| Catégorie | Technologie | Version | Rôle |
|-----------|-------------|---------|------|
| Runtime | Node.js | 20 (via nixpacks) | Serveur |
| Framework | Express | 4.18.2 | API REST |
| Language | TypeScript | 5.3.3 | Type safety |
| ORM | Prisma | 5.9 | Accès base de données type-safe |
| Validation | Zod | 3.22.4 | Validation requêtes entrantes |
| Auth JWT | jsonwebtoken | 9.0.2 | Access (15m) + Refresh (7d) tokens |
| Hashing | bcrypt | 6.0 | Hash mots de passe |
| 2FA | otplib | 13.3 | TOTP (SUPER_ADMIN obligatoire) |
| Google OAuth | google-auth-library | 10.5 | Vérification ID token Google |
| Upload | multer | 1.4.5-lts.1 | Traitement multipart/form-data |
| Images | sharp | 0.33.2 | Compression images avant upload |
| Cloud storage | cloudinary | 2.9 | Upload fichiers permanents |
| PDF | pdf-lib | 1.17.1 | Manipulation PDF |
| PDF génération | @react-pdf/renderer | 3.4 | Génération PDF côté serveur |
| Email | nodemailer | 8.0.2 | SMTP (Resend) |
| Paiements | stripe | 16.12 | Abonnements + webhooks |
| Push notif | firebase-admin | 13.7 | Firebase Admin SDK |
| Cache | redis | 4.6.12 | Cache requêtes fréquentes |
| Cron | node-cron | 3.0.3 | Génération paiements mensuels |
| Logging | morgan + winston | 1.10 / 3.11 | Logs HTTP + applicatifs |
| Sécurité | helmet | 7.1 | Headers HTTP sécurisés |
| Rate limit | express-rate-limit | 7.1.5 | Protection brute-force |
| SSE | (custom lib) | — | Server-Sent Events temps réel |
| Dev server | tsx | 4.7 | TypeScript watch mode |

**Authentification — flux complet :**
1. Inscription : `POST /auth/register` → hash password → create User → send verification email → JWT
2. Connexion : `POST /auth/login` → verify password → si TOTP activé → retour `{ requires2FA: true }` → `POST /auth/verify-totp` → JWT pair (access 15m + refresh 7d)
3. Google OAuth : frontend `GoogleSignInButton` → Google ID token → `POST /auth/google` → backend vérifie avec `google-auth-library` → upsert User → JWT pair
4. Refresh : `POST /auth/refresh` → vérifie RefreshToken en DB → nouveau access token
5. Logout : supprime RefreshToken en DB

### Base de données

**Provider :** PostgreSQL via Railway (interne `postgres.railway.internal:5432`).

**ORM :** Prisma 5.9 avec `prisma db push` (sans migration history).

#### Modèles et relations

```
User ──< Property            (ownerId)
User ──< Booking             (tenantId)
User ──< Contract            (tenantId, ownerId)
User ──< Message             (senderId, receiverId)
User ──< Conversation        (user1Id, user2Id)
User ──< Notification        (userId)
User ──< Favorite            (userId)
User ──< TenantDocument      (userId)
User ──< ContractDocument    (uploadedById)
User ──< Application         (tenantId)
User ──< DossierShare        (tenantId, ownerId)
User ──< FraudReport         (reporterId, targetId)
User -- Subscription         (userId, 1-to-1)
User ──< RefreshToken        (userId)
User ──< VerificationToken   (userId)
User ──< AuditLog            (actorId — SUPER_ADMIN actions)

Property ──< Booking
Property ──< Contract
Property ──< Favorite
Property ──< Application
Property ──< VisitAvailabilitySlot
Property ──< VisitDateOverride

Contract ──< ContractDocument
Contract ──< Payment

Conversation ──< Message
```

#### Tables complètes

<details>
<summary>Voir tous les modèles Prisma (22 tables)</summary>

| Modèle | Champs clés | Relations |
|--------|-------------|-----------|
| **User** | id, email, password, googleId, firstName, lastName, phone, avatar, role (TENANT/OWNER/ADMIN/SUPER_ADMIN), emailVerified, totpSecret, totpEnabled, tenantScore, trustScore, isVerifiedOwner, isBanned, reportCount, birthDate, birthCity, nationality, nationalNumber, documentNumber, documentExpiry, profileMeta (JSON) | ownedProperties, bookings, contracts, conversations, messages, notifications, favorites, tenantDocuments, applications, dossierShares, fraudReports, subscription |
| **RefreshToken** | id, token, userId, expiresAt | user |
| **VerificationToken** | id, token, userId, type (EMAIL_VERIFY/PASSWORD_RESET/MAGIC_LINK), expiresAt, usedAt | user |
| **Property** | id, ownerId, title, description, type (APARTMENT/HOUSE/STUDIO/DUPLEX/LOFT), status (AVAILABLE/OCCUPIED/RESERVED/DRAFT/PENDING_REVIEW), address, city, postalCode, latitude, longitude, bedrooms, bathrooms, surface, floor, furnished, price, charges, deposit, images[], virtualTour, hasParking, hasBalcony, hasElevator, hasGarden, amenities[], selectionCriteria (JSON), views, contactCount, publishedAt | owner, bookings, contracts, favorites, applications, visitAvailabilitySlots, visitDateOverrides |
| **Booking** | id, propertyId, tenantId, visitDate, visitTime, duration, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), confirmedAt, cancelledAt, cancellationReason | property, tenant |
| **Conversation** | id, user1Id, user2Id, lastMessageAt, lastMessageText, unreadCountUser1, unreadCountUser2 | user1, user2, messages |
| **Message** | id, conversationId, senderId, receiverId, content, attachments[], isRead, readAt | conversation, sender, receiver |
| **Contract** | id, propertyId, tenantId, ownerId, status (DRAFT→SENT→SIGNED_OWNER/TENANT→COMPLETED→ACTIVE→EXPIRED/TERMINATED), startDate, endDate, monthlyRent, charges, deposit, content (JSON wizard), customClauses (JSON), pdfUrl, ownerSignature (base64), tenantSignature (base64), signedByOwner, signedByTenant, signedAt, terms | property, tenant, owner, documents, payments |
| **ContractDocument** | id, contractId, uploadedById, category, fileName, fileUrl, fileSize, mimeType, status, rejectionReason, fromDossier | contract, uploader |
| **TenantDocument** | id, userId, category, docType, fileName, fileUrl, fileSize, mimeType, status, note, expiresAt | user |
| **DossierAccessLog** | id, tenantId, viewerId, viewerName, viewerEmail, propertyId, propertyTitle, createdAt | tenant, viewer |
| **Favorite** | id, userId, propertyId | user, property |
| **Notification** | id, userId, type, title, message, isRead, readAt, metadata (JSON), actionUrl | user |
| **VisitAvailabilitySlot** | id, propertyId, dayOfWeek (0-6), startTime, endTime | property |
| **VisitDateOverride** | id, propertyId, date, type (BLOCKED/EXTRA), startTime, endTime | property |
| **Application** | id, propertyId, tenantId, status (PENDING/APPROVED/REJECTED/WITHDRAWN), score (0-100), matchDetails (JSON), coverLetter, hasGuarantor, guarantorType | property, tenant |
| **DossierShare** | id, tenantId, ownerId, propertyId, expiresAt, revokedAt | tenant, owner, property |
| **FraudReport** | id, reporterId, targetId, reason, details, status, reviewNote, reviewedAt, reviewedBy | reporter, target |
| **AuditLog** | id, actorId, actorEmail, action, resource, resourceId, metadata (JSON), severity (INFO/WARNING/CRITICAL) | actor |
| **Subscription** | id, userId, stripeCustomerId, stripeSubscriptionId, plan (FREE/PRO/EXPERT), billingCycle (MONTHLY/ANNUAL), status (TRIALING/ACTIVE/PAST_DUE/CANCELED/UNPAID), currentPeriodEnd, cancelAtPeriodEnd, trialEndsAt | user |
| **Payment** | id, contractId, amount, charges, dueDate, paidDate, status (PENDING/PAID/LATE/WAIVED), month, year, receiptCloudinaryId | contract |
| **WaitlistEntry** | id, email, name, createdAt | — |

</details>

### Services externes

| Service | Rôle dans Bailio | Intégration | Variables d'env |
|---------|-----------------|-------------|-----------------|
| **Railway** | Hébergement backend + PostgreSQL | nixpacks build, `railway.json` | — |
| **Vercel** | Hébergement frontend | Auto-deploy sur push main | `VITE_API_URL` |
| **PostgreSQL (Railway)** | Base de données principale | Prisma ORM | `DATABASE_URL` |
| **Redis (Upstash)** | Cache requêtes (non-bloquant) | redis SDK | `REDIS_URL` |
| **Cloudinary** | Stockage persistant fichiers (images annonces, documents dossier, PDFs) | SDK v2, upload_stream | `CLOUDINARY_URL` ou `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` |
| **Stripe** | Abonnements PRO/EXPERT, checkout sessions, portail client, webhooks paiement | Stripe SDK v16, webhook raw body | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_MONTHLY_PRICE_ID`, `STRIPE_PRO_ANNUAL_PRICE_ID`, `STRIPE_EXPERT_MONTHLY_PRICE_ID`, `STRIPE_EXPERT_ANNUAL_PRICE_ID` |
| **Resend** | Emails transactionnels (vérification, reset mdp, welcome, magic link) via SMTP | Nodemailer SMTP → smtp.resend.com:465 | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| **Google OAuth** | Connexion Google (social login) | google-auth-library (verify ID token) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Firebase** | Push notifications mobiles | firebase-admin SDK | `FIREBASE_SERVICE_ACCOUNT` (JSON stringifié) |
| **Cloudflare Turnstile** | CAPTCHA anti-bot sur formulaires | @marsidev/react-turnstile + backend verify | `TURNSTILE_SECRET_KEY` |

---

## 3. Infrastructure et déploiement

### Repository

- **Plateforme :** GitHub (`https://github.com/unicorn-fr/mon-saas-immo`)
- **Branche principale :** `main` (déploiement automatique)
- **Monorepo :** `/server` (backend) + `/client` (frontend) dans le même repo

**Fichiers de configuration à la racine :**

| Fichier | Rôle |
|---------|------|
| `package.json` | Scripts monorepo (dev, build, db:reset) |
| `railway.json` | Config déploiement Railway (builder, restart policy) |
| `nixpacks.toml` | Build pipeline Railway (install → build → start) |
| `DOCUMENTATION.md` | Ce fichier |

### CI/CD

**Backend (Railway) :**
- Déclenché sur push `main`
- Pipeline nixpacks : `npm ci --prefix server` → `npm run build --prefix server` → `npm run railway:start --prefix server`
- `railway:start` : `npx prisma db push --accept-data-loss && node dist/server.js`
- Pas de tests automatiques avant déploiement
- Healthcheck : `/health` (désactivé temporairement dans `railway.json`, à réactiver)

**Frontend (Vercel) :**
- Déclenché sur push `main`
- Build : `cd client && npm run build` (tsc + vite build)
- Deploy automatique preview sur PR, production sur `main`

### Environnements

| Environnement | Frontend | Backend |
|---------------|----------|---------|
| **Local dev** | `localhost:5173` (Vite) | `localhost:5000` (tsx watch) |
| **Production** | `https://bailio.fr` / `https://www.bailio.fr` | `https://[service].railway.app` |

### Variables d'environnement complètes

#### Backend (`server/.env`)

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `NODE_ENV` | `development` ou `production` | ✅ |
| `PORT` | Port d'écoute (Railway injecte automatiquement) | ✅ |
| `API_VERSION` | Version API, défaut `v1` | ✅ |
| `DATABASE_URL` | URL connexion PostgreSQL complète | ✅ critique |
| `JWT_SECRET` | Clé secrète JWT access token (min 32 chars) | ✅ critique |
| `REFRESH_TOKEN_SECRET` | Clé secrète JWT refresh token (min 32 chars) | ✅ critique |
| `JWT_EXPIRES_IN` | Durée access token, défaut `15m` | |
| `REFRESH_TOKEN_EXPIRES_IN` | Durée refresh token, défaut `7d` | |
| `FRONTEND_URL` | URL du frontend ex: `https://bailio.fr` | ✅ |
| `CORS_ORIGIN` | Origines CORS autorisées (virgule-séparées) | ✅ |
| `SERVER_URL` | URL publique du backend (pour URLs fichiers locaux) | |
| `REDIS_URL` | URL Redis (Upstash), optionnel | |
| `GOOGLE_CLIENT_ID` | OAuth Google client ID | |
| `GOOGLE_CLIENT_SECRET` | OAuth Google client secret | |
| `CLOUDINARY_URL` | URL Cloudinary (format `cloudinary://key:secret@cloud`) | |
| `CLOUDINARY_CLOUD_NAME` | Nom cloud Cloudinary (alternative à CLOUDINARY_URL) | |
| `CLOUDINARY_API_KEY` | Clé API Cloudinary | |
| `CLOUDINARY_API_SECRET` | Secret API Cloudinary | |
| `SMTP_HOST` | Hôte SMTP ex: `smtp.resend.com` | ✅ |
| `SMTP_PORT` | Port SMTP ex: `465` | |
| `SMTP_USER` | Utilisateur SMTP ex: `resend` | |
| `SMTP_PASS` | Clé API Resend | |
| `EMAIL_FROM` | Adresse expéditeur ex: `noreply@bailio.fr` | ✅ |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe `sk_live_...` | |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe `whsec_...` | |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Price ID Stripe plan Pro mensuel | |
| `STRIPE_PRO_ANNUAL_PRICE_ID` | Price ID Stripe plan Pro annuel | |
| `STRIPE_EXPERT_MONTHLY_PRICE_ID` | Price ID Stripe plan Expert mensuel | |
| `STRIPE_EXPERT_ANNUAL_PRICE_ID` | Price ID Stripe plan Expert annuel | |
| `FIREBASE_SERVICE_ACCOUNT` | JSON stringifié clé service Firebase Admin | |
| `TURNSTILE_SECRET_KEY` | Clé secrète Cloudflare Turnstile | |
| `RATE_LIMIT_WINDOW_MS` | Fenêtre rate limit, défaut `900000` (15 min) | |
| `RATE_LIMIT_MAX_REQUESTS` | Max requêtes par fenêtre, défaut `100` | |
| `LAUNCH_MODE` | `waitlist` ou `live` (gate mode) | |
| `ADMIN_SECRET` | Header secret pour bypass waitlist admin | |
| `ADMIN_EMAILS` | Emails whitelist waitlist (virgule-séparés) | |
| `NOTIFY_SECRET` | Secret notifications waitlist | |
| `LAUNCH_DATE` | Date lancement officielle ISO8601 | |
| `MAX_FILE_SIZE` | Taille max upload bytes, défaut `5242880` (5 MB) | |
| `UPLOAD_DIR` | Dossier uploads locaux, défaut `./uploads` | |
| `LOG_LEVEL` | Niveau log Winston, défaut `info` | |

#### Frontend (`client/.env`)

| Variable | Description | Publique |
|----------|-------------|---------|
| `VITE_API_URL` | URL base API backend | ✅ `VITE_` |
| `VITE_GOOGLE_CLIENT_ID` | Client ID Google OAuth | ✅ `VITE_` |
| `VITE_FIREBASE_*` | Config Firebase web (apiKey, projectId…) | ✅ `VITE_` |
| `VITE_TURNSTILE_SITE_KEY` | Clé publique Cloudflare Turnstile | ✅ `VITE_` |
| `VITE_LAUNCH_MODE` | `waitlist` ou `live` | ✅ `VITE_` |

### Domaines

| Domaine | Usage |
|---------|-------|
| `bailio.fr` | Site principal production (Vercel) |
| `www.bailio.fr` | Alias www (Vercel) |
| `[service].railway.app` | API backend production (Railway) |
| `localhost:5173` | Frontend développement |
| `localhost:5000` | Backend développement |

---

## 4. Cartographie des fichiers

```
plateforme-gestion-locative/
│
├── package.json                          → Scripts monorepo (dev, build, db:reset, db:seed)
├── railway.json                          → Config déploiement Railway (builder NIXPACKS, restart policy)
├── nixpacks.toml                         → Pipeline build Railway (nodejs_20, npm ci, railway:start)
├── DOCUMENTATION.md                      → Ce fichier
│
├── client/                               → Frontend React/Vite/PWA
│   ├── package.json                      → Dépendances frontend (React, Zustand, Leaflet, Tesseract…)
│   ├── vite.config.ts                    → Config Vite : PWA, alias @/, proxy /api → :5000, chunks optimisés
│   ├── tailwind.config.js                → Config Tailwind : couleurs brand, écrans xs:375px, animations
│   ├── tsconfig.json                     → TypeScript strict mode
│   ├── index.html                        → Entry HTML, manifest PWA
│   │
│   └── src/
│       ├── main.tsx                      → Point d'entrée Vite, mount React, QueryClient
│       ├── App.tsx                       → Router React Router v6, toutes les routes + guards
│       ├── index.css                     → Import foyer-tokens, reset CSS, classes globales
│       │
│       ├── styles/
│       │   └── foyer-tokens.css          → Design system complet : CSS variables couleurs, typo, shadows, radius
│       │
│       ├── pages/
│       │   ├── Home.tsx                  → Landing page publique (hero, features, CTA)
│       │   ├── WaitlistPage.tsx          → Page waitlist pre-launch (formulaire inscription)
│       │   ├── Login.tsx                 → Page connexion (email/mdp + Google OAuth)
│       │   ├── Register.tsx              → Page inscription (role selection, Turnstile)
│       │   ├── SelectRole.tsx            → Sélection rôle après OAuth Google
│       │   ├── ForgotPassword.tsx        → Demande reset mot de passe
│       │   ├── ResetPassword.tsx         → Reset via token email
│       │   ├── VerifyEmail.tsx           → Vérification email via token
│       │   ├── VerifyMagicLink.tsx       → Connexion magic link
│       │   ├── SearchProperties.tsx      → Recherche avec carte Leaflet + filtres
│       │   ├── PropertyDetailsPublic.tsx → Fiche annonce publique
│       │   ├── Profile.tsx               → Édition profil utilisateur
│       │   ├── Notifications.tsx         → Centre de notifications
│       │   ├── Messages.tsx              → Messagerie (conversations + chat temps réel SSE)
│       │   ├── NotFound.tsx              → Page 404
│       │   ├── Calculateur.tsx           → Outil calcul loyer / charges
│       │   │
│       │   ├── owner/
│       │   │   ├── Dashboard.tsx         → Tableau de bord propriétaire (KPIs, annonces, contrats)
│       │   │   ├── MyProperties.tsx      → Liste annonces avec CRUD
│       │   │   ├── CreateProperty.tsx    → Wizard création annonce (étapes multiples)
│       │   │   ├── EditProperty.tsx      → Édition annonce existante
│       │   │   ├── PropertyDetails.tsx   → Détail annonce owner (stats, candidatures, contrats)
│       │   │   ├── BookingManagement.tsx → Gestion visites demandées
│       │   │   ├── ApplicationManagement.tsx → CRM candidatures locataires (scoring IA)
│       │   │   └── TenantProfile.tsx     → Profil locataire vu par propriétaire
│       │   │
│       │   ├── tenant/
│       │   │   ├── TenantDashboard.tsx   → Tableau de bord locataire
│       │   │   ├── MyBookings.tsx        → Mes réservations de visites
│       │   │   ├── MyApplications.tsx    → Mes candidatures envoyées
│       │   │   ├── Favorites.tsx         → Annonces sauvegardées
│       │   │   ├── DossierLocatif.tsx    → Scanner IA documents (upload + analyse OCR)
│       │   │   ├── DossierShareManager.tsx → Gestion partages dossier (qui peut voir quoi)
│       │   │   └── PrivacyCenter.tsx     → Journal d'accès à son dossier
│       │   │
│       │   ├── contracts/
│       │   │   ├── ContractsList.tsx     → Liste tous contrats (owner + tenant vues)
│       │   │   ├── CreateContract.tsx    → Wizard création contrat (formulaire ALUR)
│       │   │   ├── ContractDetails.tsx   → Détail contrat : signature, PDF, documents, timeline
│       │   │   └── EtatDesLieux.tsx      → Éditeur état des lieux (pièce par pièce)
│       │   │
│       │   ├── admin/
│       │   │   ├── AdminDashboard.tsx    → Dashboard modération
│       │   │   ├── UsersManagement.tsx   → Gestion utilisateurs (ban, rôle, vérif)
│       │   │   └── WaitlistAdmin.tsx     → Gestion waitlist (secret-protected)
│       │   │
│       │   ├── super-admin/
│       │   │   ├── SADashboard.tsx       → Dashboard global (Recharts, métriques plateforme)
│       │   │   ├── SAUsers.tsx           → Tous les utilisateurs + actions
│       │   │   ├── SAUserDetail.tsx      → Fiche détaillée utilisateur (dossier, contrats, logs)
│       │   │   ├── SADossiers.tsx        → Validation dossiers locataires
│       │   │   ├── SAContracts.tsx       → Vue globale contrats
│       │   │   ├── SAMessages.tsx        → Modération messages
│       │   │   ├── SAProperties.tsx      → Modération annonces
│       │   │   ├── SADatabase.tsx        → DB Explorer read-only (tables whitelistées)
│       │   │   └── SAAuditLogs.tsx       → Journal d'audit SUPER_ADMIN
│       │   │
│       │   └── legal/ + info/
│       │       ├── MentionsLegales.tsx, CGU.tsx, PolitiqueConfidentialite.tsx, Cookies.tsx
│       │       └── FAQ.tsx, Contact.tsx, Support.tsx, Presse.tsx, Pricing.tsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Layout.tsx            → Wrapper principal (Header + Sidebar + main content)
│       │   │   ├── Header.tsx            → Navigation top : logo, nav links, notifications bell, user menu
│       │   │   ├── OwnerSidebar.tsx      → Sidebar propriétaire (annonces, visites, contrats, messages)
│       │   │   ├── TenantSidebar.tsx     → Sidebar locataire (recherche, dossier, contrats, favoris)
│       │   │   ├── MobileBottomNav.tsx   → Navigation bottom mobile (4-5 items)
│       │   │   └── Footer.tsx            → Pied de page (liens légaux, réseaux, logo)
│       │   │
│       │   ├── auth/
│       │   │   ├── ProtectedRoute.tsx    → Guard routes : vérifie auth + rôle, redirect sinon
│       │   │   ├── GoogleSignInButton.tsx → Bouton connexion Google (OAuth flow)
│       │   │   ├── LaunchGuard.tsx       → Gate waitlist : affiche WaitlistPage si LAUNCH_MODE=waitlist
│       │   │   └── ChangePasswordModal.tsx → Modal changement mot de passe
│       │   │
│       │   ├── property/
│       │   │   ├── PropertyCard.tsx      → Carte annonce (image, prix, localisation, statut)
│       │   │   ├── SearchFilters.tsx     → Filtres recherche (ville, type, prix, pièces, meublé…)
│       │   │   ├── PropertyMap.tsx       → Carte Leaflet pour une propriété (marker)
│       │   │   ├── SearchMap.tsx         → Carte Leaflet recherche (multiple markers)
│       │   │   ├── ImageUpload.tsx       → Upload images propriété (drag & drop, preview)
│       │   │   ├── AvailabilityScheduler.tsx → Configurateur créneaux visite (jour/heure)
│       │   │   ├── ContactModal.tsx      → Modal contact propriétaire
│       │   │   └── StatusChangeModal.tsx → Modal changement statut annonce
│       │   │
│       │   ├── booking/
│       │   │   ├── BookingCard.tsx       → Carte réservation visite (statut, date, actions)
│       │   │   ├── BookingModal.tsx      → Modal réserver une visite (TimeSlotPicker)
│       │   │   ├── TimeSlotPicker.tsx    → Sélecteur créneaux disponibles
│       │   │   ├── Calendar.tsx          → Calendrier disponibilités
│       │   │   └── CancelBookingModal.tsx → Confirmation annulation visite
│       │   │
│       │   ├── contract/
│       │   │   ├── ContractPDF.tsx       → Composant @react-pdf pour génération PDF bail
│       │   │   ├── DocumentUpload.tsx    → Upload pièces jointes contrat
│       │   │   ├── SignaturePad.tsx      → Pad signature électronique (canvas)
│       │   │   ├── EDLPDF.tsx            → PDF état des lieux
│       │   │   └── ContractActivityFeed.tsx → Timeline activités contrat (changements statut)
│       │   │
│       │   ├── dossier/
│       │   │   ├── DossierWizard.tsx     → Wizard étape par étape upload documents (8 catégories)
│       │   │   ├── KanbanBoard.tsx       → Vue kanban documents par statut
│       │   │   ├── SignalBreakdown.tsx   → Graphique confiance IA (score 0-100%)
│       │   │   └── TenantDossierModal.tsx → Modal vue propriétaire : dossier complet locataire
│       │   │
│       │   ├── document/
│       │   │   ├── DocumentChecklist.tsx → Checklist pièces requises (upload par catégorie)
│       │   │   ├── DocumentViewerModal.tsx → Visualiseur PDF/image in-app
│       │   │   └── WatermarkedViewer.tsx → Viewer avec filigrane anti-copie (documents privés)
│       │   │
│       │   ├── message/
│       │   │   ├── ChatWindow.tsx        → Fenêtre chat (messages + input + attachements)
│       │   │   ├── MessageBubble.tsx     → Bulle message (owner navy / tenant green)
│       │   │   ├── ConversationList.tsx  → Liste conversations avec badge non-lus
│       │   │   ├── MessageInput.tsx      → Champ saisie message + envoi fichier
│       │   │   ├── CreateLeaseModal.tsx  → Modal création contrat depuis messagerie
│       │   │   └── ProposeRdvModal.tsx   → Modal proposition rendez-vous visite
│       │   │
│       │   ├── application/
│       │   │   ├── PreQualificationModal.tsx → Score matching candidature (critères propriétaire)
│       │   │   └── SelectionCriteriaForm.tsx → Formulaire critères sélection locataire (owner)
│       │   │
│       │   ├── security/
│       │   │   ├── ReportUserModal.tsx   → Signalement fraude/arnaque
│       │   │   └── TrustBadge.tsx        → Badge confiance utilisateur (score visuel)
│       │   │
│       │   ├── pwa/
│       │   │   ├── InstallPWA.tsx        → Prompt installation app mobile
│       │   │   └── UpdatePWA.tsx         → Notification mise à jour service worker
│       │   │
│       │   └── ui/
│       │       ├── StatusBadge.tsx       → Badge statut coloré (contrats, candidatures…)
│       │       ├── Skeleton.tsx          → Squelettes de chargement
│       │       ├── KPICard.tsx           → Carte KPI (chiffre + label + icône)
│       │       ├── BailioLogo.tsx        → Logo vectoriel Bailio
│       │       ├── BugReportButton.tsx   → Bouton rapport de bug flottant
│       │       ├── OnboardingModal.tsx   → Modal bienvenue premier login
│       │       ├── ScrollToTop.tsx       → Scroll automatique haut de page
│       │       └── NotificationBell.tsx  → Cloche notifications (badge compteur)
│       │
│       ├── services/
│       │   ├── api.service.ts            → Client Axios (base URL, interceptors JWT, refresh auto)
│       │   ├── auth.service.ts           → Auth API (login, register, logout, refresh, Google, TOTP)
│       │   ├── property.service.ts       → Propriétés CRUD + search + upload images
│       │   ├── contract.service.ts       → Contrats lifecycle (create → sign → activate)
│       │   ├── dossierService.ts         → Dossier IA (upload, process, extract, score)
│       │   ├── document.service.ts       → Documents contrat (upload, validate, reject)
│       │   ├── booking.service.ts        → Réservations visites (create, confirm, cancel)
│       │   ├── message.service.ts        → Messages (conversations, send, SSE subscribe)
│       │   ├── notification.service.ts   → Notifications (list, mark read, FCM token)
│       │   ├── application.service.ts    → Candidatures (apply, review, approve/reject)
│       │   ├── admin.service.ts          → Admin API (users, properties, reports)
│       │   ├── superAdmin.service.ts     → Super Admin API (audit, DB explorer, roles)
│       │   └── favorite.service.ts       → Favoris (add, remove, list)
│       │
│       ├── store/
│       │   ├── authStore.ts              → Auth state (user, tokens, login/logout actions) + persist
│       │   ├── propertyStore.ts          → Propriétés state (list, CRUD, search, stats)
│       │   ├── contractStore.ts          → Contrats state (list, lifecycle, signature)
│       │   ├── messageStore.ts           → Conversations + messages + unread counts
│       │   ├── bookingStore.ts           → Réservations state
│       │   ├── notificationStore.ts      → Notifications state + unread count
│       │   ├── documentStore.ts          → Documents uploadés state
│       │   ├── themeStore.ts             → Dark/light mode toggle + persist
│       │   ├── sidebarStore.ts           → Sidebar mobile open/close
│       │   └── favoriteStore.ts          → Favoris state
│       │
│       ├── hooks/
│       │   ├── useAuth.ts                → Hook auth (user, login, logout, isAuthenticated)
│       │   ├── useProperties.ts          → Hook propriétés (list, search, CRUD)
│       │   ├── useBookings.ts            → Hook réservations
│       │   ├── useMessages.ts            → Hook messagerie + SSE connexion
│       │   ├── useNotifications.ts       → Hook notifications + polling
│       │   └── [autres utilitaires]      → useDebounce, useMediaQuery, usePWA…
│       │
│       ├── types/
│       │   ├── auth.types.ts             → User, LoginCredentials, RegisterData, AuthResponse
│       │   ├── property.types.ts         → Property, PropertyFilters, PropertyStatistics
│       │   ├── contract.types.ts         → Contract, ContractStatus, ContractDocument
│       │   ├── booking.types.ts          → Booking, BookingStatus
│       │   ├── message.types.ts          → Message, Conversation
│       │   ├── notification.types.ts     → Notification, NotificationType
│       │   ├── document.types.ts         → TenantDocument, DocumentCategory
│       │   ├── admin.types.ts            → AdminStats, FraudReport, AuditLog
│       │   └── application.types.ts      → Application, ApplicationStatus, MatchDetails
│       │
│       └── data/
│           ├── bailTemplate.ts           → Template complet bail Loi ALUR (interpolation variables)
│           ├── cautionnementTemplate.ts  → Template cautionnement solidaire
│           ├── etatDesLieuxTemplate.ts   → Structure EDL (pièces, éléments, compteurs, clés)
│           └── loiAlurClauses.ts         → Clauses légales Loi ALUR sélectionnables
│
└── server/
    ├── package.json                      → Dépendances backend (Express, Prisma, Stripe, Nodemailer…)
    ├── tsconfig.json                     → TypeScript ES2022, ESNext modules, strict
    ├── .env                              → Variables d'environnement locales (non commité)
    ├── .env.example                      → Template variables d'environnement (81 lignes)
    │
    ├── prisma/
    │   ├── schema.prisma                 → Schéma base de données (22 modèles, 19 enums, 820 lignes)
    │   ├── seed.ts                       → Seeding dev : admin, owner, tenant test + propriétés
    │   └── migrations/                   → Historique migrations (non utilisé en prod, db push à la place)
    │
    └── src/
        ├── server.ts                     → Point d'entrée : httpServer.listen() immédiat, Prisma/Redis après
        ├── app.ts                        → Express app : /health first, CORS, Helmet, routes, error handler
        │
        ├── config/
        │   ├── env.ts                    → Validation Zod de toutes les env vars + export objet `env`
        │   └── database.ts               → Prisma Client singleton (global.prisma pour hot reload dev)
        │
        ├── routes/
        │   ├── index.ts                  → Registre de toutes les routes (21 groupes)
        │   ├── auth.routes.ts            → /auth/* (register, login, logout, refresh, google, totp, verify)
        │   ├── property.routes.ts        → /properties/* (CRUD, search, status, contact, images)
        │   ├── market.routes.ts          → /market/* (recherche publique sans auth)
        │   ├── booking.routes.ts         → /bookings/* (create, confirm, cancel, availability)
        │   ├── contract.routes.ts        → /contracts/* (wizard, sign, activate, terminate, EDL)
        │   ├── document.routes.ts        → /documents/* (upload, list, validate, reject)
        │   ├── dossier.routes.ts         → /dossier/* (upload, scan IA, partage, accès logs)
        │   ├── message.routes.ts         → /messages/* (conversations, send, SSE stream)
        │   ├── notification.routes.ts    → /notifications/* (list, read, FCM token)
        │   ├── application.routes.ts     → /applications/* (apply, list, review)
        │   ├── dashboard.routes.ts       → /dashboard/* (stats agrégées owner/tenant)
        │   ├── payment.routes.ts         → /payments/* (list, mark paid, quittance PDF)
        │   ├── stripe.routes.ts          → /stripe/* (checkout, portal, subscription, webhook)
        │   ├── upload.routes.ts          → /upload/* (multer generic)
        │   ├── favorite.routes.ts        → /favorites/* (add, remove, list)
        │   ├── privacy.routes.ts         → /privacy/* (DossierShare, DossierAccessLog)
        │   ├── admin.routes.ts           → /admin/* (ADMIN+ : users, properties, reports)
        │   ├── superAdmin.routes.ts      → /super-admin/* (SUPER_ADMIN : audit, DB explorer, roles)
        │   ├── waitlist.routes.ts        → /waitlist/* (inscription pré-lancement)
        │   └── bugs.routes.ts            → /bugs/* (rapport de bug utilisateur)
        │
        ├── controllers/                  → Handlers HTTP (extract params → call service → send response)
        │   ├── auth.controller.ts
        │   ├── property.controller.ts
        │   ├── booking.controller.ts
        │   ├── contract.controller.ts
        │   ├── message.controller.ts
        │   ├── document.controller.ts
        │   ├── dossier.controller.ts
        │   ├── application.controller.ts
        │   ├── dashboard.controller.ts
        │   ├── admin.controller.ts
        │   ├── superAdmin.controller.ts
        │   ├── notification.controller.ts
        │   ├── upload.controller.ts
        │   ├── totp.controller.ts
        │   ├── privacy.controller.ts
        │   ├── waitlist.controller.ts
        │   └── favorite.controller.ts
        │
        ├── services/                     → Logique métier pure (accès DB, validations business)
        │   ├── auth.service.ts           → Inscription, connexion, refresh, TOTP, Google OAuth
        │   ├── property.service.ts       → CRUD propriétés, recherche, transitions de statut
        │   ├── booking.service.ts        → Créneaux, réservation, confirmation, annulation
        │   ├── contract.service.ts       → Lifecycle contrat, signature double partie, PDF
        │   ├── dossier.service.ts        → Scan IA OCR (Tesseract), MRZ parsing, score confiance
        │   ├── document.service.ts       → Upload, validation, rejet pièces justificatives
        │   ├── message.service.ts        → Conversations, envoi, SSE push temps réel
        │   ├── application.service.ts    → Candidature, scoring, approbation/rejet
        │   ├── notification.service.ts   → Création, lecture, FCM push mobile
        │   ├── admin.service.ts          → Modération utilisateurs, annonces, signalements
        │   ├── superAdmin.service.ts     → Audit logs, rôles, DB explorer (read-only)
        │   ├── stripe.service.ts         → Customer Stripe, checkout, portail, sync abonnement
        │   ├── cleanup.service.ts        → Cron : nettoyage tokens expirés, vieux documents
        │   ├── privacy.service.ts        → Partage dossier (grant/revoke), audit accès
        │   ├── watermark.service.ts      → Filigrane documents PDF avant consultation
        │   ├── dvf.service.ts            → Prix immobiliers DVF (données valeurs foncières)
        │   ├── favorite.service.ts       → Gestion favoris
        │   ├── waitlist.service.ts       → Gestion entrées waitlist + email notification
        │   └── totp.service.ts           → Setup/verify TOTP 2FA (otplib)
        │
        ├── middlewares/
        │   ├── auth.middleware.ts        → authenticate (JWT verify), optionalAuthenticate, authorize(roles)
        │   ├── error.middleware.ts       → AppError class, errorHandler global, asyncHandler wrapper
        │   ├── security.middleware.ts    → Sanitization inputs, rate limiters spécialisés, Zod helpers
        │   ├── launchMode.middleware.ts  → Gate waitlist (LAUNCH_MODE env), bypass admin secret
        │   ├── rateLimiter.middleware.ts → Instances rate-limit configurées
        │   ├── planGate.middleware.ts    → requirePlan('PRO'|'EXPERT') : vérifie abonnement Stripe
        │   └── turnstile.middleware.ts   → Vérification CAPTCHA Cloudflare Turnstile
        │
        ├── lib/
        │   ├── sseManager.ts             → Map userId→Response, send/broadcast SSE events
        │   └── stripe.ts                 → Stripe client singleton (null si clé absente), PLANS config
        │
        ├── jobs/
        │   └── generateMonthlyPayments.ts → Cron 1er du mois 8h : crée Payment PENDING pour contrats ACTIVE
        │
        ├── templates/
        │   └── receiptPDF.ts             → Template PDF quittance de loyer
        │
        └── utils/
            ├── jwt.util.ts               → generateAccessToken, generateRefreshToken, verify, decode
            ├── password.util.ts          → hashPassword, comparePassword, validatePasswordStrength
            ├── email.util.ts             → sendEmail via Nodemailer SMTP
            ├── emailTemplates.ts         → Templates HTML : welcome, verify, reset, magic link
            ├── cloudinary.util.ts        → Upload/delete/signedUrl Cloudinary (lazy config)
            ├── upload.util.ts            → Config Multer (taille limite, types acceptés)
            ├── validation.util.ts        → validateEmail, validatePhone, validatePassword
            ├── token.util.ts             → generateSecureToken (crypto.randomBytes)
            ├── apiResponse.ts            → Helpers réponses HTTP standardisées
            ├── cache.ts                  → Client Redis (non-bloquant, REDIS_URL optionnel)
            ├── firebase.util.ts          → Firebase Admin : sendPushNotification
            └── checkEnv.ts              → Vérification vars env au démarrage (warnings sans crash)
```

---

## 5. Fonctionnalités implémentées

### Authentification et profil

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Inscription email/mdp | Création compte avec vérification email | ✅ | `auth.service.ts`, `Register.tsx` |
| Connexion email/mdp | Login + access/refresh tokens | ✅ | `auth.service.ts`, `Login.tsx` |
| Google OAuth | Login/inscription via Google | ✅ | `GoogleSignInButton.tsx`, `auth.service.ts` |
| Vérification email | Token envoyé par email, expiry 24h | ✅ | `emailTemplates.ts`, `VerifyEmail.tsx` |
| Reset mot de passe | Lien sécurisé par email | ✅ | `ForgotPassword.tsx`, `ResetPassword.tsx` |
| Magic link | Connexion sans mot de passe | ✅ | `VerifyMagicLink.tsx`, `auth.service.ts` |
| TOTP 2FA | Authentification 2 facteurs (SUPER_ADMIN obligatoire) | ✅ | `totp.service.ts`, `totp.controller.ts` |
| Refresh token | Rotation automatique, stocké en DB | ✅ | `jwt.util.ts`, `api.service.ts` (interceptor) |
| Édition profil | Photo, nom, téléphone, bio | ✅ | `Profile.tsx`, `auth.service.ts` |
| Sélection de rôle | Après OAuth, choix OWNER/TENANT | ✅ | `SelectRole.tsx` |

### Annonces immobilières

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Création annonce | Wizard étapes : infos, photos, prix, disponibilités | ✅ | `CreateProperty.tsx`, `property.service.ts` |
| Édition annonce | Mise à jour toutes propriétés | ✅ | `EditProperty.tsx` |
| Suppression annonce | Soft delete + nettoyage Cloudinary | ✅ | `property.service.ts` |
| Upload images | Drag & drop, compression Sharp, Cloudinary | ✅ | `ImageUpload.tsx`, `cloudinary.util.ts` |
| Transitions statut | DRAFT → PENDING_REVIEW → AVAILABLE → OCCUPIED | ✅ | `StatusChangeModal.tsx` |
| Recherche et filtres | Ville, type, prix min/max, chambres, meublé | ✅ | `SearchProperties.tsx`, `market.routes.ts` |
| Carte interactive | Leaflet avec markers cliquables | ✅ | `SearchMap.tsx`, `PropertyMap.tsx` |
| Statistiques propriété | Vues, contacts, réservations, candidatures | ✅ | `Dashboard.tsx`, `dashboard.service.ts` |
| Critères sélection | Owner définit pré-requis locataire (revenus, garanties) | ✅ | `SelectionCriteriaForm.tsx` |
| Tour virtuel | URL vidéo 360° intégrée | ✅ | `property.routes.ts` |
| Créneaux visite | Configurateur jours/heures disponibles + exceptions | ✅ | `AvailabilityScheduler.tsx`, `VisitAvailabilitySlot` |

### Réservations de visites

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Réserver une visite | Sélection créneau disponible, durée configurable | ✅ | `BookingModal.tsx`, `TimeSlotPicker.tsx` |
| Confirmation visite | Owner confirme/refuse demande | ✅ | `BookingManagement.tsx` |
| Annulation visite | Owner ou tenant, avec raison | ✅ | `CancelBookingModal.tsx` |
| Calendrier disponibilités | Vue calendrier créneaux libres/pris | ✅ | `Calendar.tsx` |
| Dates bloquées/extra | Override dates ponctuelles | ✅ | `VisitDateOverride` |

### Dossier locatif IA

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Scanner OCR documents | Tesseract.js analyse pièces justificatives | ✅ | `dossier.service.ts`, `DossierWizard.tsx` |
| Parsing MRZ | Extraction données CNI/passeport (TD1/TD3) | ✅ | `dossier.service.ts`, `mrz` lib |
| Score confiance | ≥90% auto-confirmation, <90% picker catégorie | ✅ | `SignalBreakdown.tsx` |
| Extraction données | birthDate, nationality, documentNumber, revenus, caution | ✅ | `ExtractedChips` (dossier.service.ts) |
| Kanban documents | Vue glisser-déposer par statut (pending/uploaded/validated) | ✅ | `KanbanBoard.tsx` |
| Partage contrôlé | Tenant partage son dossier à un owner avec expiry | ✅ | `DossierShare`, `DossierShareManager.tsx` |
| Audit d'accès | Log de chaque consultation du dossier | ✅ | `DossierAccessLog`, `PrivacyCenter.tsx` |
| Filigrane documents | WatermarkedViewer protège les PDFs partagés | ✅ | `WatermarkedViewer.tsx`, `watermark.service.ts` |
| Expiration documents | Auto-suppression docs anciens (TenantDocument.expiresAt) | ✅ | `cleanup.service.ts` |

### Candidatures

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Postuler à une annonce | Lettre de motivation + infos garant | ✅ | `application.service.ts` |
| Score de matching | Application.score (0-100) basé sur critères owner | ✅ | `PreQualificationModal.tsx` |
| CRM candidatures | Owner voit toutes candidatures, peut approuver/refuser | ✅ | `ApplicationManagement.tsx` |
| Vue locataire | Locataire suit statut de ses candidatures | ✅ | `MyApplications.tsx` |

### Messagerie

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Conversations 1-to-1 | Thread entre owner et tenant | ✅ | `message.service.ts`, `Messages.tsx` |
| Temps réel SSE | Server-Sent Events, pas de WebSocket | ✅ | `sseManager.ts`, `useMessages.ts` |
| Pièces jointes | Upload fichiers dans messages | ✅ | `MessageInput.tsx` |
| Compteur non-lus | Badge par conversation + total header | ✅ | `ConversationList.tsx` |
| Proposition RDV | Modal pour proposer visite depuis messagerie | ✅ | `ProposeRdvModal.tsx` |
| Création contrat depuis message | Owner propose bail depuis conversation | ✅ | `CreateLeaseModal.tsx` |

### Contrats

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Wizard création | Formulaire étapes : type, durée, loyer, clauses | ✅ | `CreateContract.tsx`, `contract.service.ts` |
| Templates légaux | Bail Loi ALUR, cautionnement solidaire | ✅ | `bailTemplate.ts`, `cautionnementTemplate.ts` |
| Envoi pour signature | Changement statut DRAFT → SENT, email notification | ✅ | `contract.service.ts` |
| Signature électronique | Signature canvas (base64), métadonnées légales | ✅ | `SignaturePad.tsx` |
| Double signature | Owner + Tenant signent séparément → COMPLETED | ✅ | `ContractDetails.tsx` |
| Génération PDF | @react-pdf/renderer, filigrane Bailio | ✅ | `ContractPDF.tsx` |
| Activation contrat | COMPLETED → ACTIVE (début occupation) | ✅ | `contract.service.ts` |
| Résiliation | ACTIVE → TERMINATED avec date effective | ✅ | `contract.service.ts` |
| Pièces jointes contrat | Upload documents liés (diagnostics, état des lieux) | ✅ | `DocumentChecklist.tsx`, `ContractDocument` |
| État des lieux | Éditeur pièce par pièce, export PDF | ✅ | `EtatDesLieux.tsx`, `EDLPDF.tsx` |
| Timeline activité | Feed chronologique actions sur contrat | ✅ | `ContractActivityFeed.tsx` |

### Paiements et quittances

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Génération loyers automatique | Cron 1er du mois, Payment PENDING par contrat ACTIVE | ✅ | `generateMonthlyPayments.ts` |
| Marquage payé | Owner marque loyer comme reçu | ✅ | `payment.routes.ts` |
| Quittance PDF | Génération et stockage Cloudinary | ✅ | `receiptPDF.ts`, `Payment.receiptCloudinaryId` |
| Suivi retards | Statut LATE automatique | 🚧 | `Payment.status` (champ présent, logique partielle) |

### Abonnements Stripe

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Checkout session | Redirection vers paiement Stripe | ✅ | `stripe.service.ts`, `/stripe/checkout` |
| Portail client | Gestion abonnement (cancel, change plan) | ✅ | `/stripe/portal` |
| Webhook Stripe | Sync abonnement en DB (created/updated/deleted) | ✅ | `stripeWebhookHandler` |
| Essai 14 jours | Trial automatique sur PRO/EXPERT | ✅ | `stripe.service.ts` |
| Gate plans | requirePlan() middleware sur routes premium | ✅ | `planGate.middleware.ts` |
| Page pricing | Affichage plans FREE/PRO/EXPERT | ✅ | `Pricing.tsx` |

### Notifications

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Notifications in-app | Création, liste, marquage lu | ✅ | `notification.service.ts`, `Notifications.tsx` |
| Push mobile Firebase | FCM via firebase-admin | 🚧 | `firebase.util.ts` (implémenté, non testé en prod) |
| Badge notifications | Compteur non-lus dans header | ✅ | `NotificationBell.tsx` |

### Administration

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| Panel admin | Gestion utilisateurs, annonces, signalements | ✅ | `AdminDashboard.tsx`, `admin.service.ts` |
| Super Admin panel | Dashboard dark mode, audit, DB explorer | ✅ | `super-admin/`, `superAdmin.service.ts` |
| Explorateur DB | Tables whitelistées, read-only, $queryRawUnsafe | ✅ | `SADatabase.tsx` |
| Journal d'audit | Toutes actions SUPER_ADMIN loggées | ✅ | `AuditLog`, `SAAuditLogs.tsx` |
| Gestion waitlist | Dashboard inscrits + export | ✅ | `WaitlistAdmin.tsx` |
| Signalement fraude | FraudReport, review par admin | ✅ | `ReportUserModal.tsx`, `FraudReport` |

### Autres

| Fonctionnalité | Description | Statut | Fichiers principaux |
|---------------|-------------|--------|---------------------|
| PWA / Offline | Workbox caching, install prompt | ✅ | `vite.config.ts`, `InstallPWA.tsx` |
| Mode waitlist | LAUNCH_MODE gate, inscription anticipée | ✅ | `LaunchGuard.tsx`, `launchMode.middleware.ts` |
| Rapport de bug | Bouton flottant → ticket | ✅ | `BugReportButton.tsx`, `bugs.routes.ts` |
| Calculateur | Estimation loyer / charges | ✅ | `Calculateur.tsx` |
| Favoris | Sauvegarde annonces | ✅ | `Favorites.tsx`, `favorite.service.ts` |
| Pages légales | CGU, confidentialité, mentions, cookies | ✅ | `legal/` |

---

## 6. Flux utilisateur principaux

### Flux 1 — Inscription et onboarding

```
1. Utilisateur arrive sur bailio.fr
   → [LaunchGuard] vérifie LAUNCH_MODE
   → si "waitlist" : affiche WaitlistPage.tsx
   → si "live" : affiche Home.tsx

2. Clic "S'inscrire"
   → Register.tsx
   → Choix role OWNER ou TENANT
   → Formulaire (email, mot de passe, prénom, nom, téléphone)
   → Cloudflare Turnstile CAPTCHA
   → POST /api/v1/auth/register
     → auth.service.ts : validatePasswordStrength()
     → bcrypt.hash(password, 12)
     → prisma.user.create()
     → Génère EmailVerification token (VerificationToken)
     → sendEmail(emailVerificationTemplate)
     → Retourne { user, accessToken, refreshToken }
   → authStore.login() → stocke tokens
   → Redirect vers /dashboard/[role]

3. Vérification email
   → Email reçu avec lien /verify-email?token=xxx
   → VerifyEmail.tsx → POST /api/v1/auth/verify-email
   → auth.service.ts : trouve token, marque emailVerified=true, supprime token
   → Toast "Email vérifié !"

4. Onboarding
   → OnboardingModal.tsx apparaît au premier login
   → Guide les premières actions selon le rôle
```

### Flux 2 — Flux métier principal (Owner publie → Tenant signe un bail)

```
OWNER :
1. /properties/new (CreateProperty.tsx)
   → Wizard étapes : titre, type, adresse, surface, prix, charges, caution
   → Upload photos : ImageUpload → sharp.resize → POST /upload → Cloudinary
   → Configurer créneaux : AvailabilityScheduler → VisitAvailabilitySlot en DB
   → POST /api/v1/properties → property.service.createProperty()
   → Statut initial : DRAFT
   → "Publier" → PATCH status → AVAILABLE

TENANT :
2. /search (SearchProperties.tsx)
   → SearchFilters + carte Leaflet
   → GET /api/v1/market/search?city=...&type=...&minPrice=...
   → PropertyCard grid + SearchMap markers
   → Clic PropertyCard → /property/:id

3. Fiche annonce (PropertyDetailsPublic.tsx)
   → GET /api/v1/market/properties/:id
   → Clic "Visiter" → BookingModal.tsx
   → TimeSlotPicker : GET /api/v1/bookings/availability/:propertyId
   → POST /api/v1/bookings → booking.service.create()
   → Notification créée pour le propriétaire
   → SSE push si owner connecté

4. Candidature
   → PreQualificationModal : score matching vs selectionCriteria
   → "Postuler" → POST /api/v1/applications
   → application.service.create() : calcule score
   → Notification owner

OWNER confirme visite :
5. /bookings/manage → GET /api/v1/bookings (owner)
   → PATCH /api/v1/bookings/:id/confirm
   → Notification tenant

OWNER crée contrat :
6. Message vers tenant (Messages.tsx)
   → CreateLeaseModal → /contracts/new
   → CreateContract.tsx wizard : locataire (email ou ID), durée, loyer, clauses
   → POST /api/v1/contracts → contract.service.create() → statut DRAFT

OWNER envoie pour signature :
7. ContractDetails.tsx → "Envoyer pour signature"
   → PATCH /api/v1/contracts/:id/send → statut SENT
   → Email envoyé au locataire

TENANT signe :
8. /contracts/:id → ContractDetails.tsx
   → "Signer" → SignaturePad.tsx (canvas)
   → POST /api/v1/contracts/:id/sign?party=tenant
   → Stocke base64 signature + métadonnées légales
   → statut : SIGNED_TENANT

OWNER signe :
9. Même flux → statut SIGNED_OWNER → puis COMPLETED

Activation :
10. Owner "Activer le contrat" → ACTIVE
    → Cron mensuel : generateMonthlyPayments() crée Payment PENDING chaque 1er du mois
```

### Flux 3 — Paiement et upgrade Stripe

```
1. Utilisateur FREE sur /pricing (Pricing.tsx) → clic "Passer en PRO"
   → POST /api/v1/stripe/checkout { priceId: 'price_xxx' }
   → stripe.service.getOrCreateStripeCustomer() → Stripe customer
   → stripe.checkout.sessions.create() (trial 14 jours)
   → Retourne { url: 'https://checkout.stripe.com/...' }
   → Redirect vers Stripe Checkout

2. Stripe Checkout
   → Utilisateur entre carte bancaire
   → Stripe traite paiement

3. Webhook Stripe (POST /api/v1/stripe/webhook)
   → stripeWebhookHandler : vérifie signature stripe-signature
   → event.type = 'customer.subscription.created'
   → syncSubscriptionFromStripe(stripeSubId)
   → stripe.subscriptions.retrieve() → get priceId → mapPriceIdToPlan()
   → prisma.subscription.updateMany({ plan: 'PRO', status: 'ACTIVE' })

4. Redirect vers /dashboard?upgrade=success
   → Toast "Bienvenue en PRO !"
   → requirePlan('PRO') routes maintenant accessibles

5. Annulation
   → POST /api/v1/stripe/portal → Stripe billing portal
   → Stripe envoie webhook 'customer.subscription.deleted'
   → plan → FREE
```

### Flux 4 — Emails transactionnels

| Email | Déclencheur | Template |
|-------|-------------|----------|
| **Bienvenue** | Inscription réussie | `welcomeTemplate()` |
| **Vérification email** | Inscription → token 24h | `emailVerificationTemplate(token)` |
| **Reset mot de passe** | /forgot-password | `passwordResetTemplate(token)` |
| **Magic link** | Demande connexion sans mdp | `magicLinkTemplate(token)` |
| **Notification visite** | Nouvelle réservation | Notification in-app + (email partiel) |
| **Contrat envoyé** | Owner envoie bail | Email direct au tenant |
| **Waitlist confirmation** | Inscription waitlist | `waitlist.service.ts` |

Tous les emails passent par `email.util.ts → nodemailer.createTransport(SMTP)` → Resend sur `smtp.resend.com:465`.

---

## 7. Sécurité et points d'attention

### Protection des routes

**Backend :**
- Middleware `authenticate` : vérifie JWT access token (`Bearer xxx`), injecte `req.user`
- Middleware `authorize(...roles)` : RBAC, compare `req.user.role` contre rôles requis
- Middleware `optionalAuthenticate` : auth silencieuse (routes mixtes public/privé)
- Middleware `requirePlan` : vérifie `Subscription.plan` en DB

**Frontend :**
- `ProtectedRoute.tsx` : vérifie `isAuthenticated` + `user.role`, redirect `/login` sinon
- Route Super Admin séparée avec `RequireSuperAdmin` layout

### Rôles et permissions

| Rôle | Accès |
|------|-------|
| `TENANT` | Recherche, dossier, candidatures, contrats propres, messagerie |
| `OWNER` | Gestion annonces, visites, contrats, paiements, applications |
| `ADMIN` | Panel admin : users, propriétés, signalements |
| `SUPER_ADMIN` | Tout + DB explorer read-only + audit logs + 2FA obligatoire |

### Validation des entrées

- **Zod** sur toutes les routes backend : `validateBody(schema)` dans middlewares
- **express-validator** sur quelques routes auth
- **Sanitization** : `sanitizeInput` middleware retire null bytes, caractères de contrôle, patterns injection SQL/XSS/path traversal
- **Multer** : types MIME whitelistés, taille max configurable

### Données sensibles

- Mots de passe : bcrypt avec factor 12, jamais exposés en réponse API
- Tokens JWT : access en mémoire côté client (non-persisté), refresh en DB + localStorage
- Signatures contrat : base64 stocké en DB (à considérer pour migration vers stockage Cloudinary)
- Firebase service account : env var JSON stringifié (ne jamais committer)
- DB Explorer Super Admin : `$queryRawUnsafe` avec whitelist tables, read-only uniquement

### Headers sécurité (Helmet)

```
Content-Security-Policy: strict
HSTS: max-age=31536000, includeSubDomains, preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate limiting

| Limiteur | Route | Limite |
|----------|-------|--------|
| Global | `/api/*` | 100 req / 15 min (dev: 10 000) |
| Login | `POST /auth/login` | 10 tentatives / 15 min |
| Email | `POST /auth/forgot-password` | 5 req / heure |
| Super Admin | `/super-admin/*` | 60 req / min + 2FA obligatoire |

### Points d'attention

1. **Signatures en base64 dans DB** : Les signatures contrat sont stockées en base64 dans `Contract.ownerSignature` / `tenantSignature`. Pour un volume important, migrer vers Cloudinary.
2. **`$queryRawUnsafe` DB Explorer** : Protégé par whitelist de tables et SUPER_ADMIN uniquement, mais à monitorer dans les audit logs.
3. **Refresh tokens** : Stockés en localStorage frontend (acceptable mais XSS-vulnérable vs cookie httpOnly). Les access tokens sont en mémoire.
4. **SMTP password en clair** : `SMTP_PASS` dans les variables d'env — bien géré via Railway Secrets.
5. **Images annonces** : Non protégées (URLs publiques Cloudinary) — normal pour une marketplace.
6. **Documents dossier** : Protégés via `WatermarkedViewer` + `DossierShare` avec expiry — bonne pratique.

---

## 8. Dette technique et améliorations

### Fonctionnalités partielles

| Élément | État | Détail |
|---------|------|--------|
| Push notifications Firebase | 🚧 | `firebase.util.ts` implémenté, FCM token stocké, mais envoi push non systématique |
| Statut LATE paiements | 🚧 | Champ présent sur `Payment`, pas de job cron pour auto-passer PENDING → LATE après due date |
| Tour virtuel | 🚧 | Champ `virtualTour` en DB, UI non implémentée |
| Données DVF | 🚧 | `dvf.service.ts` présent, non intégré dans l'UI |
| Emails sur toutes les actions | 🚧 | Notifications contrat/visite manquent parfois l'email (notification in-app uniquement) |
| Tests automatiques | ❌ | Vitest installé (`package.json` client), aucun test écrit. 0% coverage. |

### Fichiers de config manquants

| Fichier | Impact |
|---------|--------|
| `.env.example` (client/) | Absent — variables Vite non documentées |
| `vercel.json` | Absent — Vercel gère automatiquement mais `SPA fallback` pourrait nécessiter config |
| `eslintrc` unifié | Backend et frontend ont des configs séparées non synchronisées |

### Hardcodés à externaliser

```typescript
// server/src/app.ts — origines hardcodées (redondant avec env var CORS_ORIGIN)
'https://bailio.fr'
'https://www.bailio.fr'

// client/src/services/api.service.ts — fallback hardcodé
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

// server/src/utils/email.util.ts — adresse fallback
EMAIL_FROM: 'noreply@immoparticuliers.fr'  // ancien nom
```

### Dépendances notables

- `@types/qrcode` installé en dependencies (devrait être devDependencies)
- `prisma` et `typescript` en dependencies (devrait être devDependencies pour le build Railway — mais nécessaire car Railway installe uniquement les prod deps sans `--include=dev`)
- `cors` importé dans `app.ts` mais non utilisé (supprimé, import résiduel à vérifier)

### Variables d'environnement non documentées dans .env.example

Vérifier la présence de ces variables dans le `.env.example` côté client :
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_TURNSTILE_SITE_KEY`
- `VITE_LAUNCH_MODE`

### Améliorations recommandées

1. **Tests** : Ajouter des tests d'intégration Vitest pour les services critiques (auth, contrats, paiements)
2. **Job LATE payments** : Ajouter un cron quotidien qui passe les `Payment.status = LATE` après `dueDate`
3. **Healthcheck Railway** : Réactiver `healthcheckPath: "/health"` dans `railway.json` maintenant que `/health` répond en premier
4. **Cookie httpOnly pour refresh** : Migrer de localStorage vers cookie httpOnly sécurisé pour les refresh tokens
5. **Pagination côté server** : Plusieurs listes (notifications, audit logs) chargent tout sans pagination côté client

---

## 9. Pour reprendre ce projet from scratch

### Prérequis

- Node.js 20+
- PostgreSQL 14+ (ou compte Railway)
- Compte Cloudinary (optionnel, fallback disque local)
- Compte Resend (optionnel, emails désactivés sinon)

### Installation locale

```bash
# 1. Cloner le repo
git clone https://github.com/unicorn-fr/mon-saas-immo.git bailio
cd bailio

# 2. Installer toutes les dépendances (monorepo)
npm run install:all
# équivalent à : npm install && cd server && npm install && cd ../client && npm install

# 3. Configurer les variables d'environnement backend
cp server/.env.example server/.env
# Éditer server/.env — variables obligatoires :
#   DATABASE_URL=postgresql://user:pass@localhost:5432/bailio
#   JWT_SECRET=<32+ caractères aléatoires>
#   REFRESH_TOKEN_SECRET=<32+ caractères aléatoires>
#   NODE_ENV=development

# Générer des secrets sécurisés :
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. Configurer les variables d'environnement frontend
# Créer client/.env :
echo "VITE_API_URL=http://localhost:5000/api/v1" > client/.env

# 5. Synchroniser le schéma Prisma avec la base de données
cd server
npx prisma db push
# (ou npx prisma migrate dev pour créer les migrations)

# 6. (Optionnel) Peupler la base avec des données de test
npm run prisma:seed
# Crée : admin@bailio.fr / owner@bailio.fr / tenant@bailio.fr (mdp: Password123!)

cd ..

# 7. Lancer en développement (backend + frontend en parallèle)
npm run dev
# Backend  → http://localhost:5000
# Frontend → http://localhost:5173

# 8. Vérifier que tout fonctionne
curl http://localhost:5000/health
# → {"status":"ok","ts":...}
```

### Commandes utiles

```bash
# Reset complet de la base de données
npm run db:reset
# = prisma migrate reset --force + seed

# Build production (backend uniquement — pour vérifier avant deploy)
cd server && npm run build
node dist/server.js

# Build production frontend
cd client && npm run build
# Sortie dans client/dist/

# Lancer Prisma Studio (interface DB graphique)
cd server && npm run prisma:studio

# Vérification TypeScript (sans build)
cd server && npm run type-check
cd client && npx tsc --noEmit

# Lint
cd server && npm run lint
cd client && npm run lint

# Générer le client Prisma après modification du schema
cd server && npx prisma generate
```

### Variables d'environnement minimales pour démarrer en local

```env
# server/.env — minimum pour démarrer sans crash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:password@localhost:5432/bailio
JWT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
REFRESH_TOKEN_SECRET=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

---

*Documentation générée automatiquement par analyse statique du code source. À mettre à jour à chaque ajout de fonctionnalité majeure.*
