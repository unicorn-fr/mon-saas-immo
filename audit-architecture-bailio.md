# AUDIT D'ARCHITECTURE — BAILIO.FR

> Rapport généré le 12 avril 2026.
> Lecture seule — aucun fichier modifié.

---

## ÉTAPE 1 — CARTOGRAPHIE DU PROJET

### Structure générale

Monorepo **React + Vite + Express** (pas Next.js) :

```
plateforme-gestion-locative/
├── client/    711 MB  — React + Vite + TypeScript + TailwindCSS
├── server/    388 MB  — Express + Prisma + TypeScript
├── docs/       88 KB  — Documentation API
├── docker/             — Dockerfiles déploiement
└── scripts/    16 KB  — Utilitaires (test-waitlist, etc.)
```

---

## ÉTAPE 2 — FICHIERS DE CONFIGURATION

### Client

| Fichier | Rôle | Statut |
|---------|------|--------|
| `vite.config.ts` | Build Vite + PWA Workbox + Alias paths + Code splitting | ✅ Actif |
| `tailwind.config.js` | Thème design + mode dark + animations custom | ✅ Actif |
| `postcss.config.js` | Tailwind + Autoprefixer | ✅ Actif |
| `tsconfig.json` | TypeScript strict + aliases `@/` | ✅ Actif |

**Vite :** PWA actif, chunks séparés (react-vendor, ui-vendor, map-vendor, ocr-vendor), proxy API vers `localhost:5000`, sourcemaps prod.

**Tailwind :** Thème complet avec dark mode, couleurs primaires/success/warning/error, animations (slide-in, fade-in, pulse-slow, shimmer), ombres premium.

### Server

| Fichier | Rôle | Statut |
|---------|------|--------|
| `tsconfig.json` | TypeScript Node.js, strict partiel | ✅ Actif |
| `prisma/schema.prisma` | Schéma PostgreSQL, 13+ enums, relations complexes | ✅ Actif |

**Prisma :** Users, Properties, Bookings, Contracts, Messages, Documents, AuditLog. Support OAuth, Dossier, Kanban, Super Admin.

---

## ÉTAPE 3 — ANALYSE DES COMPOSANTS CLIENT

**Total : ~60 composants répartis en 13 catégories**

| Catégorie | Composants |
|-----------|-----------|
| `application/` | PreQualificationModal, SelectionCriteriaModal |
| `auth/` | GoogleSignIn, PhoneVerification, LaunchGuard, SiteGate, ProtectedRoute, RoleGuard |
| `booking/` | Calendar, TimeSlotPicker, BookingCard, BookingModal, CancelBookingModal |
| `contract/` | SignaturePad, ContractPDFDocument, BailPDF, EDLDocument |
| `document/` | WatermarkedViewer, DocumentChecklist, DossierReviewModal, DocumentViewerModal |
| `dossier/` | TenantDossierModal, KanbanBoard, DossierWizard, SignalBreakdown |
| `layout/` | Header, Footer, OwnerSidebar, TenantSidebar, Layout, MobileNav |
| `message/` | MessageInput, ConversationList, ChatWindow, CreateLeaseModal, ActivityFeed, MessageBubble |
| `notification/` | NotificationBell |
| `onboarding/` | OnboardingModal |
| `property/` | PropertyCard, PropertyMap, SearchMap, SearchFilters, ImageUpload, AvailabilityCalendar, PropertyGallery, PropertyDetails |
| `pwa/` | PWAInstallPrompt, PWAUpdatePrompt |
| `security/` | ReportUserModal, TrustBadge |
| `ui/` | Skeleton, StatusBadge, KPICard |
| `waitlist/` | HowItWorksSection, FounderSection |

### Doublons potentiels

⚠️ **DOUBLON DESIGN : `api.ts` vs `api.service.ts`**
- `client/src/services/api.ts` : instance Axios simple, export par défaut
- `client/src/services/api.service.ts` : `apiClient` + `handleApiError`, exports nommés
- Les deux sont importés dans des fichiers différents — refactorisation incomplète

---

## ÉTAPE 4 — ROUTES FRONTEND

**50+ routes** organisées en 8 sections dans `App.tsx` :

| Section | Exemples de routes | Accès |
|---------|-------------------|-------|
| Public | `/`, `/search`, `/property/:id` | Tous |
| Auth | `/login`, `/register`, `/reset-password`, `/verify-email` | Non connecté |
| Legal/Info | `/cgu`, `/faq`, `/pricing`, `/contact` | Tous |
| Owner | `/dashboard/owner`, `/properties/*`, `/bookings/manage` | OWNER, ADMIN |
| Tenant | `/dashboard/tenant`, `/dossier/*`, `/my-bookings` | TENANT, ADMIN |
| Contracts | `/contracts`, `/contracts/:id`, `/contracts/:id/edl` | Authentifié |
| Admin | `/admin`, `/admin/users`, `/admin/waitlist` | ADMIN, SUPER_ADMIN |
| Super Admin | `/super-admin/dashboard`, `/users`, `/audit`, etc. (9 routes) | SUPER_ADMIN |

### Pages sans route

🔴 **`client/src/pages/Calculateur.tsx`** — Page complète de calculateur de rentabilité, non routée, non accessible.

🔴 **`client/src/pages/owner/CreateProperty.tsx`** — Ancien formulaire remplacé par `CreatePropertyWizard.tsx` (routé via `/properties/new`). Code mort.

---

## ÉTAPE 5 — ANALYSE DES STYLES

### Fichiers CSS

| Fichier | Rôle |
|---------|------|
| `client/src/styles/index.css` | Directives Tailwind, `@layer base/components`, classes utilitaires globales |
| `client/src/styles/foyer-tokens.css` | Variables CSS du design system "Maison" (70+ variables) |

### Design tokens (`foyer-tokens.css`)

| Groupe | Variables | Valeurs clés |
|--------|-----------|-------------|
| Arrière-plans | `--bg-base`, `--bg-surface`, `--bg-muted` | #fafaf8, #ffffff, #f4f2ee |
| Texte | `--ink`, `--ink-mid`, `--ink-faint` | #0d0c0a, #5a5754, #9e9b96 |
| Night (primaire) | `--night`, `--night-hover`, `--night-light` | #1a1a2e, #2a2a4a, #edf0f8 |
| Caramel (accent) | `--caramel`, `--caramel-light` | #c4976a, #fdf5ec |
| Owner (bleu) | `--owner`, `--owner-light`, `--owner-border` | #1a3270, #eaf0fb, #b8ccf0 |
| Tenant (vert) | `--tenant`, `--tenant-light`, `--tenant-border` | #1b5e3b, #edf7f2, #9fd4ba |
| Statuts | `--f-success/warning/danger` | Vert/Orange/Rouge |
| Ombres | `--shadow-card`, `--shadow-modal` | Warm rgba |
| Radius | `--radius-sm` à `--radius-pill` | 8px à 999px |

### Alertes styles

⚠️ **STYLE DUPLIQUÉ :** La couleur `#c4976a` (caramel) est définie dans `foyer-tokens.css` ET réécrite en dur dans `tailwind.config.js` sous `colors.accent`. Risque de désynchronisation.

⚠️ **INLINE STYLES MASSIFS :** `WaitlistPage.tsx` (1200+ lignes) utilise exclusivement des `style={{}}` inline au lieu des tokens CSS — contourne complètement le design system et le rend difficile à maintenir.

---

## ÉTAPE 6 — ASSETS PUBLIC

| Fichier | Type | Taille | Référencé |
|---------|------|--------|-----------|
| `enzo1.jpeg` | Image | ~100 KB | ✅ Oui — `FounderSection photo="/enzo1.jpeg"` |
| `icons/icon.svg` | SVG | < 1 KB | ✅ Oui — manifest PWA |
| `manifest.json` | JSON | < 1 KB | ✅ Oui — PWA |
| `offline.html` | HTML | < 5 KB | ✅ Oui — Service Worker |
| `service-worker.js` | JS | < 5 KB | ✅ Oui — PWA |

✅ Aucun asset orphelin.

---

## ÉTAPE 7 — DÉPENDANCES

### Client — Packages déclarés mais non importés

🟡 **`jszip`** — Déclaré dans `package.json`, aucun `import jszip` trouvé dans le code.

🟡 **`clsx`** — Déclaré dans `package.json`, jamais importé. `tailwind-merge` utilisé à la place pour la fusion de classes.

### Client — Packages utilisés confirmés

React 18, React Router DOM, TanStack Query, Framer Motion, Lucide React, React Hook Form + Zod, Firebase, Axios, Date-fns, Leaflet + React-Leaflet, PDF.js, @react-pdf/renderer, Tesseract.js, jsQR, MRZ, React Dropzone, React Hot Toast, Recharts, Zustand, Tailwind Merge.

### Server — Tous utilisés

Express, Prisma, JWT, bcrypt, Nodemailer, Resend, Firebase Admin, Stripe, Cloudinary, Redis, Zod, Winston, Sharp, QRCode.

---

## ÉTAPE 8 — ORPHELINS ET DOUBLONS

### Fichiers orphelins confirmés

🔴 **ORPHELIN : `client/src/pages/Calculateur.tsx`**
Page de calculateur de rentabilité immobilière. Non routée dans `App.tsx`. Non importée dans aucun fichier. Code complet mais inaccessible.

🔴 **ORPHELIN : `client/src/pages/owner/CreateProperty.tsx`**
Ancien formulaire de création de propriété. Remplacé fonctionnellement par `CreatePropertyWizard.tsx` qui est lui routé sur `/properties/new`. Maintien des deux = confusion et maintenance double.

🟡 **ORPHELIN PROBABLE : `client/src/utils/SmartDocumentScanner.ts`**
Mentionné en commentaire dans `UniversalScraper.ts` mais jamais importé directement. Remplacé par la logique OR-of-ANDs de `UniversalScraper.ts`.

### Doublons de fichiers

🟡 **DOUBLON FONCTIONNEL : `client/src/services/api.ts` vs `client/src/services/api.service.ts`**

Fichiers utilisant `api.ts` :
- BugReportButton, PhoneVerification, TenantDossierModal, TenantProfile, Login, dossierService, document.service, application.service

Fichiers utilisant `api.service.ts` :
- MessageInput, DocumentViewerModal, WatermarkedViewer, VerifyMagicLink, message.service, auth.service, notification.service, contract.service, admin.service, superAdmin.service, booking.service

### Naming inconsistant

🟢 **`client/src/services/dossierService.ts`** — Tous les autres services sont nommés `*.service.ts` (snake_case). Ce fichier utilise camelCase sans point. À renommer en `dossier.service.ts`.

---

## ÉTAPE 9 — SYNTHÈSE

### 9.1 — Ce qui va bien

✅ **Séparation client/server nette** — monorepo bien organisé, aucun mélange de responsabilités.

✅ **Routing sophistiqué** — 50+ routes avec guards par rôle (OWNER, TENANT, ADMIN, SUPER_ADMIN) proprement implémentés.

✅ **Design system cohérent** — `foyer-tokens.css` centralise 70+ variables CSS. Convention "inline styles pour couleurs, Tailwind pour layout" globalement respectée dans l'app principale.

✅ **Stack moderne** — React 18, Vite, TailwindCSS, Zustand, TanStack Query, Framer Motion, Zod.

✅ **Fonctionnalités complètes** — Auth OAuth, OCR (Tesseract + MRZ), signature électronique, génération PDF, messagerie temps réel, PWA offline.

✅ **Server robuste** — Prisma, Redis, Stripe, Cloudinary, rate limiting, helmet, sanitization, timeout middleware.

✅ **Aucun asset orphelin** dans `public/`.

---

### 9.2 — Problèmes identifiés

#### 🔴 CRITIQUE

**C1 — Deux services API en concurrence**
- `api.ts` et `api.service.ts` coexistent, importés par des fichiers différents.
- Risque : comportements différents si l'un est mis à jour mais pas l'autre.
- Action : fusionner en `api.service.ts` (le plus complet), migrer tous les imports.

**C2 — Pages orphelines non routées**
- `Calculateur.tsx` et `CreateProperty.tsx` sont du code mort.
- Risque : confusion pour nouveaux développeurs, maintenance inutile.
- Action : supprimer (ou router `Calculateur.tsx` si la fonctionnalité est voulue).

#### 🟡 IMPORTANT

**I1 — Dépendances inutilisées**
- `jszip` et `clsx` déclarés dans `package.json` mais jamais importés.
- ~50 KB de dépendances superflues en bundle.
- Action : `npm remove jszip clsx` côté client.

**I2 — WaitlistPage.tsx non intégrée au design system**
- 1200+ lignes de `style={{}}` inline avec variables CSS custom (`--c-*`) redéfinies localement.
- Non connecté aux tokens de `foyer-tokens.css`.
- Action : migrer vers les variables CSS globales du design system.

**I3 — SmartDocumentScanner.ts probablement orphelin**
- Remplacé par `UniversalScraper.ts`, jamais importé directement.
- Action : vérifier et supprimer si confirmé.

**I4 — Couleur caramel dupliquée**
- `#c4976a` définie dans `foyer-tokens.css` ET dans `tailwind.config.js`.
- Action : faire pointer `tailwind.config.js` vers la variable CSS.

#### 🟢 COSMÉTIQUE

**K1 — Naming `dossierService.ts`**
- Tous les autres services : `*.service.ts`. Celui-ci : `dossierService.ts`.
- Action : renommer en `dossier.service.ts`.

**K2 — Pas d'index.ts exports centralisés**
- Imports souvent longs (`../../components/booking/BookingCard`).
- Action : ajouter `index.ts` dans `components/`, `services/`, `store/`.

---

### 9.3 — Arborescence cible recommandée

Structure idéale pour ce monorepo React+Vite+Express :

```
plateforme-gestion-locative/
├── client/
│   ├── public/
│   │   ├── enzo1.jpeg
│   │   ├── icons/
│   │   ├── manifest.json
│   │   ├── offline.html
│   │   └── service-worker.js
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── components/
│   │   │   ├── application/
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── contract/
│   │   │   ├── document/
│   │   │   ├── dossier/
│   │   │   ├── layout/
│   │   │   ├── message/
│   │   │   ├── notification/
│   │   │   ├── onboarding/
│   │   │   ├── property/
│   │   │   ├── pwa/
│   │   │   ├── security/
│   │   │   ├── ui/
│   │   │   ├── waitlist/
│   │   │   └── index.ts             ← À AJOUTER (exports centralisés)
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── contracts/
│   │   │   ├── owner/
│   │   │   │   └── (supprimer CreateProperty.tsx)
│   │   │   ├── super-admin/
│   │   │   ├── tenant/
│   │   │   ├── (supprimer Calculateur.tsx ou le router)
│   │   │   └── index.ts             ← À AJOUTER
│   │   ├── services/
│   │   │   ├── api.service.ts       ← CONSERVER (fusionner api.ts ici)
│   │   │   ├── dossier.service.ts   ← RENOMMER (actuellement dossierService.ts)
│   │   │   └── (autres : OK)
│   │   ├── store/
│   │   │   ├── index.ts             ← À AJOUTER
│   │   │   └── (10 stores Zustand : OK)
│   │   ├── hooks/                   ← OK
│   │   ├── types/                   ← OK
│   │   ├── utils/
│   │   │   ├── (supprimer SmartDocumentScanner.ts)
│   │   │   └── (autres : OK)
│   │   ├── data/                    ← Templates légaux (OK)
│   │   ├── config/                  ← OK
│   │   └── styles/
│   │       ├── foyer-tokens.css     ← Source unique de vérité couleurs
│   │       └── index.css
│   ├── vite.config.ts
│   ├── tailwind.config.js           ← Faire pointer vers foyer-tokens.css
│   ├── tsconfig.json
│   └── package.json                 ← Retirer jszip, clsx
│
├── server/
│   ├── prisma/
│   │   ├── schema.prisma            ← OK
│   │   ├── migrations/              ← OK
│   │   └── seed.ts                  ← OK
│   ├── src/
│   │   ├── app.ts
│   │   ├── server.ts
│   │   ├── config/                  ← OK
│   │   ├── controllers/             ← OK
│   │   ├── services/                ← OK
│   │   ├── routes/                  ← OK (registre central)
│   │   ├── middlewares/             ← OK
│   │   ├── utils/                   ← OK
│   │   ├── lib/                     ← OK
│   │   └── jobs/                    ← OK
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── API.md
│   ├── AUTH_API.md
│   └── ARCHITECTURE.md              ← À CRÉER
│
├── docker/
├── scripts/
├── .gitignore
├── .env.example
├── docker-compose.yml
└── package.json                     ← Monorepo root
```

---

## ACTIONS PRIORITAIRES RECOMMANDÉES

### Court terme (1–2 jours)

1. **Fusionner les services API** — Conserver `api.service.ts`, migrer tous les imports de `api.ts`, supprimer `api.ts`.
2. **Supprimer les fichiers orphelins** — `Calculateur.tsx`, `CreateProperty.tsx`, `SmartDocumentScanner.ts`.
3. **Nettoyer `package.json` client** — `npm remove jszip clsx`.

### Moyen terme (1–2 semaines)

4. **Centraliser les tokens couleur** — Faire référencer `tailwind.config.js` depuis `foyer-tokens.css`.
5. **Migrer `WaitlistPage.tsx`** vers le design system global (remplacer `--c-*` locales par `--caramel`, `--night`, etc.).
6. **Renommer `dossierService.ts`** → `dossier.service.ts`.
7. **Ajouter `index.ts`** dans `components/`, `services/`, `store/`.

### Long terme (documentation)

8. **Créer `docs/ARCHITECTURE.md`** — Documenter les conventions (tokens, routing, stores).
9. **Documenter les stores Zustand** — Quelles données, quels composants.

---

*Fin du rapport. Aucun fichier modifié.*
