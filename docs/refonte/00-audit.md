# Refonte Bailio V1 — Phase 0 : audit

> Audit réalisé le 28/09/2026 sur la branche `claude/vigilant-carson-kx4zdo` (commit `4b423b3`).
> Aucun code applicatif n'a été modifié. Ce document attend ta validation avant la phase 1.

---

## 0. Résumé en 10 points

1. **La base est solide et déjà très orientée propriétaire.** Il existe déjà :
   - un bail PDF calqué sur le décret 2015-587, en vide et en meublé (`ContractPDF.tsx`, 876 lignes) ;
   - un état des lieux pièce par pièce avec compteurs et clés ;
   - des quittances ;
   - un pad de signature ;
   - une route IRL et des jobs cron de rappels.
   On réutilise beaucoup plus qu'on ne réécrit.
2. **Blocage structurel n° 1 : aujourd'hui un bail exige un compte locataire.** Dans le schéma, `Contract.tenantId` pointe obligatoirement vers `User` et `Payment` dépend de `Contract`. La V1 veut des locataires sans compte, d'où la proposition de **nouvelles tables** (`Lease`, `Tenant`…). On ajoute, on ne modifie pas l'existant.
3. **Risque majeur de déploiement.** Au démarrage, Railway exécute `prisma db push --accept-data-loss` (`server/package.json` → `start` et `railway:start`). Un simple renommage de champ dans le schéma **supprime la colonne et ses données en production** au déploiement suivant, sans confirmation. Je propose de passer à `prisma migrate deploy` avant la phase 2 (question Q1).
4. **Blocage n° 2 : la création de bail est payante.** `contract_creation` est réservé au plan SOLO et plus dans `lib/stripe.ts`, et le FREE n'a pas les quittances. C'est incompatible avec « Créer mon bail gratuitement » (question Q3).
5. **Écart de documentation.** `CLAUDE.md` indique FREE=3 et PRO=50 biens, mais le code a **4 plans** : FREE=1, SOLO=3, PRO=10, EXPERT=illimité.
6. **Bug confirmé sur l'IRL.** L'API INSEE répond en XML et refuse le paramètre `format=json` (erreur 400). La route `/irl/current` tombe donc **toujours** sur des valeurs figées de 2024 (dernière valeur : 2024-T3 = 145,47). Les vraies valeurs à ce jour : 2026-T2 = **148,37** (JO du 12/07/2026), 2026-T1 = 146,60, 2025-T4 = 145,78, 2025-T3 = 145,77.
7. **Cookie du brouillon anonyme.** Le front est sur Vercel (bailio.fr) et l'API sur Railway (domaine `*.railway.app` d'après `.env.example`). Un cookie posé par l'API serait un cookie tiers, bloqué par Safari et bientôt par les autres navigateurs (question Q2).
8. **Les documents contiennent des données personnelles de tiers.** Aujourd'hui les PDF partent sur Cloudinary en `type: 'upload'`, donc avec des URL publiques. Pour la V1, tous les documents générés doivent être privés (`authenticated`) et servis par URL signée.
9. **Les routes publiques côté locataire sont indexées.** Sont concernées `/search`, `/locataires`, les 20 pages `/location/:ville` et plusieurs articles du guide destinés aux locataires. Les masquer supprimerait des pages indexées (question Q4, règle 5).
10. **État de départ.** Client et serveur compilent avec **0 erreur TypeScript**. En revanche `npm run lint` du client ne tourne pas : il n'y a aucun fichier `.eslintrc`. Côté tests : 1 fichier client et 1 fichier serveur.

---

## 1. Stack réelle

| Couche | Réalité constatée |
|---|---|
| Front | React 18.3, Vite 6, TypeScript strict, React Router 6.22, Zustand 4, TanStack Query 5, react-hook-form 7 + zod 3 + @hookform/resolvers (déjà installés), Tailwind 3 pour la mise en page, tokens `BAI` en inline, lucide-react, framer-motion, PWA (vite-plugin-pwa) |
| PDF côté client | `@react-pdf/renderer` **v4.3** (bail, EDL, dossier) |
| PDF côté serveur | `@react-pdf/renderer` **v3.4** (versions différentes entre client et serveur) + `pdf-lib` (quittance, rapport fiscal) |
| Signature | `react-signature-canvas` (surcouche React de `signature_pad`, MIT). Mode Yousign prévu dans le schéma, avec webhook |
| Back | Express 4 + TypeScript (ESM), `tsx` en dev, pm2 en production |
| Base de données | PostgreSQL + Prisma 5.9, schéma de 1 291 lignes et ~40 modèles. Dossier `migrations/` **abandonné depuis février 2026** : on utilise `db push` |
| Auth | JWT (access + refresh en base), refresh stocké dans le store Zustand côté client (pas de cookie), Google OAuth, lien magique (`TokenType.MAGIC_LINK`, lié à un `userId` existant), TOTP 2FA, Turnstile (anti-bot), vérification d'email par code |
| Emails | `utils/email.util.ts` : SMTP Ionos (nodemailer) → Resend en repli → sinon log console. Templates dans `utils/emailTemplates.ts` |
| Stockage | Cloudinary (images + PDF en `raw`), multer. Des URL signées existent déjà dans `cloudinary.util.ts`, mais l'upload par défaut est public |
| IA | `@anthropic-ai/sdk` (Claude Haiku 4.5 : OCR, scoring de dossiers, recherche en langage naturel) + Gemini, Mindee, docTR, PaddleOCR en Python, Tesseract : **5 moteurs d'OCR** en parallèle |
| Crons | `node-cron` dans `server.ts` : génération mensuelle des paiements, rappels de loyer, rappels de contrat, IRL, emails d'onboarding, alertes de recherche, nettoyage des documents |
| Paiement | Stripe Billing (4 plans), Stripe Connect et SEPA (paiement des loyers), codes promo |
| Hébergement | Front sur **Vercel** (`client/vercel.json`, réécriture SPA, pas de CSP). API sur **Railway** (Dockerfile + nixpacks, Python/Tesseract intégrés). Postgres : fournisseur non visible dans le repo (probablement Railway) |
| Données publiques | Route `georisques` (utile pour l'ERP), `market`/DVF, IRL |
| Qualité | 0 erreur TypeScript côté client et serveur. Lint client non fonctionnel. Pas de CI GitHub Actions |

**API externes vérifiées aujourd'hui :**
- **Adresse** : `https://data.geopf.fr/geocodage/completion?text=…&type=StreetAddress` (autocomplétion) et `https://data.geopf.fr/geocodage/search?q=…` (géocodage), toutes deux en 200 OK. L'ancienne `api-adresse.data.gouv.fr` renvoie un *connection reset* depuis l'environnement : elle est bien migrée vers la Géoplateforme.
- **IRL** : `https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/001515333?lastNObservations=N` → 200, XML SDMX (`<Obs TIME_PERIOD="2026-Q2" OBS_VALUE="148.37" … DATE_JO="2026-07-12"/>`), sans clé. Le paramètre `format=json` renvoie 400.

---

## 2. Cartographie des pages et composants

Légende :
- ✅ **réutilisable** : garder et adapter ;
- ⏸ **pause** : derrière un feature flag désactivé par défaut, sans suppression ;
- 🗑 **à supprimer plus tard** : après la V1, avec ton accord.

### 2.1 Pages propriétaire

| Élément | Verdict | Commentaire |
|---|---|---|
| `owner/Dashboard.tsx` (925 l.) | ✅ refonte | Nouveaux indicateurs : biens, loyers attendus, quittances à générer, échéances |
| `owner/MyProperties`, `PropertyDetails`, `CreatePropertyWizard`, `EditProperty`, `PropertyCard`, `ImageUpload` | ✅ | Enrichis avec les champs de l'étape 3 et les diagnostics. Le wizard adopte le schéma zod partagé |
| `owner/Quittances.tsx` (1 317 l.) | ✅ | À rebrancher sur `Lease`/`RentPayment`. Ajout du reçu partiel, de la génération en masse et du ZIP |
| `owner/MesLocataires`, `owner/TenantProfile` | ✅ réécriture | Aujourd'hui basés sur des `User` locataires. En V1 : fiches `Tenant` créées par le propriétaire |
| `owner/Documents.tsx` (1 454 l.) | ✅ | Devient la liste des documents générés et versionnés |
| `owner/Settings`, `Abonnement`, `Profile` | ✅ | Deviennent « Mon compte » |
| `owner/Finance`, `Rentabilite`, `FiscalWizard`, `Maintenance`, `Outils`, `Wallet` | ⏸ | Hors périmètre V1 (comptabilité, fiscalité, paiement en ligne). Masqués du menu (question Q5) |
| `owner/ApplicationManagement`, `BookingManagement` | ⏸ | Candidatures et visites |
| `contracts/CreateContract.tsx` | ⏸ puis 🗑 | Remplacé par le tunnel. L'étape « Clauses » est réutilisée |
| `contracts/ContractsList`, `ContractDetails` (1 880 l.) | ⏸ | Anciens contrats liés à un compte locataire. Encore lisibles pour l'historique |
| `contracts/EtatDesLieux.tsx` | ✅ | Structure pièces, éléments, compteurs et clés : base de l'EDL V1 (mobile, photos, entrée/sortie) |
| `contracts/EdlSession`, `EdlJoin` | ⏸ | EDL synchrone avec PIN, qui exige un locataire avec compte |

### 2.2 Espace locataire (tout en ⏸)

`TenantDashboard`, `TenantPayments`, `MyBookings`, `MyApplications`, `Favorites`, `DossierLocatif` (2 161 l.), `DossierShareManager`, `PrivacyCenter`, `tenant/Settings`, `tenant/Maintenance`, `tenant/Documents`, `SearchAlerts`, `TenantSidebar`.

Composants concernés : `dossier/*` (dont `KanbanBoard`), `application/*`, `booking/*`, `message/*`, `search/*`, `property/SwipeStack`, `SearchMap`, `SearchFilters`, `ContactModal`, `AvailabilityScheduler`, `PropertyShareKit`, `security/ReportUserModal`.

Pages transverses : `Messages`, `SelectRole` (en V1 l'inscription crée directement un OWNER), `kyc/KycFlow`, `VerifyIdentity`, `components/kyc/*`.

### 2.3 Pages publiques

| Élément | Verdict | Commentaire |
|---|---|---|
| `Home.tsx` (1 725 l.) | ✅ refonte (phase 9) | En phase 1, seuls les boutons d'action pointent vers `/creer-un-bail` |
| `info/Proprietaires`, `APropos`, `FAQ`, `Contact`, `Support`, `Presse`, `Videos`, `Pricing` | ✅ | Textes à réaligner en phase 9 |
| `legal/*` | ✅ à mettre à jour | Données de tiers, export et suppression, sous-traitants (voir risques) |
| `public/Guide`, `GuideArticle`, `Estimer` | ✅ | SEO. Les articles destinés aux propriétaires renverront vers le tunnel |
| `public/SearchProperties`, `PropertyDetailsPublic`, `LocationVille` (×20 villes), `info/Locataires` | ⏸ ? | **Indexés dans le sitemap**, voir Q4 |
| `WaitlistPage` (1 608 l.), `SiteGate`, `LaunchGuard` | 🗑 plus tard | Non montés dans `App.tsx` (SiteGate) ou liés à `LAUNCH_MODE` |

### 2.4 Composants transverses

- **✅ Réutilisables tels quels :** `Layout`, `LayoutRoute`, `Header`, `Footer`, `MobileBottomNav`, `ProtectedRoute`, `AuthGateModal` (utile à l'étape 7 du tunnel), `GoogleSignInButton`, `SignaturePad`, `DocumentUpload`, `billing/*`, `ui/*`.
- **✅ À réécrire :** `OwnerSidebar`, avec 7 entrées (Tableau de bord, Mes biens, Mes locataires, Documents, Annonces, Échéances, Mon compte).
- **🗑 plus tard :** `DarkModeSync` et `themeStore` (les classes `dark:` sont interdites par `CLAUDE.md`), `face-api`, `jscanify`.

### 2.5 Backend

| Élément | Verdict |
|---|---|
| `auth.*`, `email.util`, `emailTemplates`, `cloudinary.util`, `privacy.service`, `planGate`, `featureGate`, `rateLimiter`, `turnstile` | ✅ Turnstile protège les endpoints anonymes du tunnel |
| `property.*`, `georisques.routes` | ✅ enrichis |
| `irl.routes` + `jobs/irlReminders` | ✅ **à corriger** (parser XML, cache en base) |
| `jobs/contractReminders`, `generateMonthlyPayments`, `sendRentReminders` | ✅ adaptés à `Lease` |
| `templates/receiptPDF.ts` (pdf-lib) | ✅ puis 🗑 : remplacé par un template React-PDF (quittance et reçu) |
| `contract.*`, `edl.*`, `document.*` | ⏸ ancien flux, à conserver pour les données existantes |
| `application`, `booking`, `message`, `dossier`, `favorite`, `alert`, `kyc`, `ocr`, `connect`, `sepa`, `yousign.webhook`, `syndication`, `propertyKit` | ⏸ routes désactivées par un flag serveur, qui renvoie 404 |
| Les 5 services d'OCR | 🗑 plus tard, à regrouper sur un seul si on les réactive |

---

## 3. Schéma de données cible et stratégie de migration

### 3.1 Principes

- **Uniquement de l'ajout** de la phase 1 à la phase 8 : nouvelles tables et colonnes nullables sur `Property` et `User`. **Aucune suppression ni aucun renommage.** `Contract`, `Payment`, `EdlSession`, etc. restent intacts pour l'historique et pour une éventuelle réactivation de l'espace locataire.
- Les nouveaux modèles ne dépendent **jamais** d'un compte locataire.
- Les montants sont en **centimes entiers** (`Int`) dans les nouvelles tables, pour éviter les arrondis `Float` sur des documents légaux. L'existant reste en `Float`.
- Chaque formulaire a un **schéma zod partagé** (`shared/schemas/*.ts`, importé par le client et le serveur). Le serveur revalide tout.

### 3.2 Nouveaux modèles (Prisma, version abrégée)

```prisma
enum LandlordKind   { PERSON  COMPANY }                 // COMPANY = SCI ou autre personne morale
enum LeaseType      { UNFURNISHED  FURNISHED  MOBILITY  SHARED_SINGLE_LEASE } // V1 : les 2 premiers
enum LeaseStatus    { DRAFT  ACTIVE  ENDED  IMPORTED }
enum LeaseSource    { CREATED  IMPORTED }
enum ChargesMode    { PROVISION  FLAT }                 // provision + régularisation / forfait
enum DocumentType   { LEASE  LEASE_IMPORTED  RENT_RECEIPT  PAYMENT_RECEIPT  INVENTORY_ENTRY  INVENTORY_EXIT  RENT_NOTICE  DIAGNOSTIC  TENANT_FILE }
enum RentStatus     { EXPECTED  PARTIAL  PAID  LATE  WAIVED }
enum InventoryType  { ENTRY  EXIT }
enum ItemCondition  { NEW  GOOD  WORN  BAD }            // neuf / bon / usage / mauvais
enum ReminderType   { RENT_REVISION  LEASE_END  NOTICE_DEADLINE  INSURANCE_CERT  CHARGES_REGULARISATION  DIAGNOSTIC_EXPIRY }
enum DraftKind      { LEASE_CREATE  LEASE_IMPORT }

model Landlord {            // « Owner » : bailleur, lié au compte User qui le gère
  id, userId → User
  kind LandlordKind, isFamilySci Boolean   // une SCI familiale garde la durée de 3 ans
  firstName?, lastName?, companyName?, siren?, representativeName?
  address, postalCode, city, email, phone?
  agent Json?                              // mandataire éventuel
}

model Property {            // EXISTANT, champs ajoutés (tous nullables)
  + landlordId?, legalRegime (COPRO/MONO)?, constructionPeriod?, livingArea (déjà `surface`)
  + mainRooms?, annexes Json?, equipments Json?, heatingMode?, hotWaterMode?
  + dpeClass?, gesClass?, dpeEnergyCostMin?, dpeEnergyCostMax?, dpeDate?
  + furnishedInventory Json?               // check-list du décret 2015-981
  + isTenseZone?, rentControlArea?         // zone tendue / encadrement
  + diagnostics PropertyDiagnostic[]
}

model PropertyDiagnostic { id, propertyId, kind (DPE|ERP|CREP|ELEC|GAS|ASBESTOS|NOISE), performedAt?, expiresAt?, documentId? }

model Tenant {              // fiche créée par le propriétaire, pas de compte
  id, ownerUserId → User, firstName, lastName, email?, phone?, birthDate?, birthPlace?
  currentAddress?, deletedAt?   // suppression logique + purge planifiée
  files TenantFile[], guarantors Guarantor[]
}
model TenantFile { id, tenantId, category (liste fermée du décret 2015-1437), documentId, expiresAt? }
model Guarantor  { id, tenantId, kind (PERSON|VISALE|ORGANISM), identité, adresse, email?, phone?, maxAmountCents?, durationMonths? }

model Lease {
  id, ownerUserId, landlordId, propertyId
  type LeaseType, status LeaseStatus, source LeaseSource, isStudent Boolean  // meublé étudiant : 9 mois
  startDate, durationMonths, endDate
  rentCents, chargesCents, chargesMode, paymentDay, paymentMethod
  depositCents, isTenseZone
  refRentCents?, refRentMajCents?, rentComplementCents?, rentComplementReason?
  previousRentCents?, previousRentDate?, worksSinceLastLease?, specialClauses Json?
  irlRefQuarter?, irlRefValue?             // trimestre de référence pour la révision
  importedFileDocId?                       // PDF d'un bail importé
  formData Json, schemaVersion Int         // copie complète des saisies du tunnel
  tenants LeaseTenant[], payments RentPayment[], documents Document[], inventories Inventory[], reminders Reminder[]
}
model LeaseTenant { leaseId, tenantId, isPrimary, @@id([leaseId, tenantId]) }

model RentPayment {         // nouveau modèle : l'ancien `Payment` exige un Contract
  id, leaseId, year, month, periodStart, periodEnd
  rentCents, chargesCents, paidCents, paidAt?, method?, status RentStatus
  documentId?                              // quittance (payé en totalité) ou reçu (partiel)
  @@unique([leaseId, year, month])
}

model Document {            // tout document généré ou importé, jamais écrasé
  id, ownerUserId, type DocumentType, leaseId?, propertyId?, tenantId?, inventoryId?, rentPaymentId?
  version Int, supersedesId?               // chaîne des versions
  storageKey                               // Cloudinary type=authenticated, URL signée à la demande
  sha256, sizeBytes, mimeType
  inputSnapshot Json, generatorVersion     // permet de régénérer à l'identique
  signatures DocumentSignature[]
  @@unique([leaseId, type, version])
}
model DocumentSignature {   // prêt pour Documenso/DocuSeal plus tard
  id, documentId, signerRole (LANDLORD|TENANT|GUARANTOR), signerName
  method (PRINTED_HANDWRITTEN|ON_SCREEN_DRAWN|PROVIDER)
  imageKey?, signedAt, ip?, userAgent?, provider?, providerRef?
}

model Inventory     { id, leaseId, type InventoryType, date, entryInventoryId?, meters Json, keys Json, heating Json?, comment?, status (DRAFT|DONE), documentId? }
model InventoryRoom { id, inventoryId, name, position }
model InventoryItem { id, roomId, element, category (FLOOR|WALL|CEILING|JOINERY|EQUIPMENT|OTHER), condition ItemCondition, comment?, photoKeys String[] }

model Reminder  { id, ownerUserId, leaseId?, propertyId?, type ReminderType, dueDate, notifyAt DateTime[], status (PENDING|SENT|DONE|DISMISSED), meta Json?
                  @@unique([leaseId, type, dueDate]) }
model IrlIndex  { quarter String @id /* "2026-Q2" */, value Decimal, publishedAt DateTime }

model LeaseDraft {          // « Draft » : brouillon anonyme puis rattaché à un compte
  id, tokenHash @unique     // on stocke le SHA-256 du token, jamais le token en clair
  kind DraftKind, userId?, currentStep Int, data Json, schemaVersion Int
  resumeEmail?, resumeEmailSentAt?, expiresAt /* +30 j */, claimedAt?, leaseId?
}

model Listing { id, propertyId, platform (LEBONCOIN|SELOGER), title, body, highlights Json, mandatoryMentions Json, model, promptVersion, createdAt }
```

### 3.3 Stratégie de migration

1. **Avant la phase 2 (Q1)**, remplacer `db push --accept-data-loss` au démarrage par `prisma migrate deploy` :
   - générer une migration de référence depuis la base de production (`prisma migrate diff --from-empty --to-schema-datamodel` puis `migrate resolve --applied`) ;
   - ensuite, une migration SQL versionnée et relue par phase.
   C'est un changement du process de déploiement, d'où ta validation.
2. Chaque phase ajoute ses tables (phase 2 : `LeaseDraft`, `Landlord`, `Lease`, `LeaseTenant`, `Tenant`, `Guarantor` + colonnes `Property` ; phase 3 : `Document`, `DocumentSignature` ; etc.).
3. **Reprise des données existantes (optionnelle, script idempotent)** : pour chaque `Contract` d'un propriétaire, créer `Tenant` (copie de l'identité du `User` locataire), `Lease` (`source=IMPORTED`) et `LeaseTenant`, puis recopier les `Payment` payés en `RentPayment`. À lancer seulement si tu confirmes qu'il y a des baux réels en production (Q6).
4. Aucun `DROP` avant la fin de la V1 et ton feu vert explicite.

### 3.4 Feature flags

- Un seul fichier de vérité par côté :
  - client : `client/src/config/features.ts`, lu depuis `VITE_FEATURE_*` ;
  - serveur : `server/src/config/features.ts`, lu depuis `FEATURE_*` + middleware `requireFlag()` qui renvoie 404.
- Flags proposés, tous `false` par défaut : `tenantSpace`, `applications`, `visits`, `messaging`, `marketplaceSearch`, `kyc`, `onlinePayments`, `advancedFinance`, `legacyContracts`.
- **Routes désactivées** : redirection 302 côté client vers `/dashboard/owner` (connecté) ou `/` (anonyme), sauf les routes publiques indexées (voir Q4).

---

## 4. Librairies proposées

Tout est sous licence permissive. **Aucune dépendance AGPL n'est intégrée au code.**

| Besoin | Proposition | Licence | Statut |
|---|---|---|---|
| Formulaires et validation | `react-hook-form`, `zod`, `@hookform/resolvers` | MIT | déjà installés |
| PDF | `@react-pdf/renderer` **côté serveur**, passage de la v3 à la v4 pour aligner sur le client | MIT | déjà installé |
| Fusion de PDF (notice, annexes) | `pdf-lib` | MIT | déjà installé |
| Signature tracée | `react-signature-canvas` / `signature_pad` | MIT | déjà installé |
| Parsing XML de l'INSEE | `fast-xml-parser` | MIT | nouveau (serveur) |
| ZIP des quittances | `archiver` (serveur, en streaming) | MIT | nouveau (serveur) |
| Compression des photos d'EDL sur mobile | `browser-image-compression` | MIT | nouveau (client) |
| Cookie du brouillon | `cookie-parser` | MIT | nouveau (serveur), seulement si Q2 = sous-domaine API |
| Autocomplétion d'adresse | API Géoplateforme en `fetch` direct, sans librairie | Licence Ouverte (données) | — |
| Génération d'annonces | `@anthropic-ai/sdk` | MIT | déjà installé. Modèle exact choisi en phase 7 |
| **Non retenus** | **Gotenberg** (MIT) : inutile, React-PDF couvre le besoin sans service Docker de plus sur Railway. **Documenso** et **DocuSeal** : **AGPL-3.0**, donc à brancher uniquement comme **service séparé** appelé par API et webhooks, sans jamais importer leur code (architecture prévue via `DocumentSignature.provider`) | — | plus tard |

**Pourquoi générer les PDF côté serveur (et non dans le navigateur comme aujourd'hui) :**
- calculer le hash ;
- stocker et versionner le document ;
- l'envoyer par email ;
- faire la génération en masse des quittances ;
- ne pas faire confiance à un PDF fabriqué par le client.

Le navigateur affiche l'aperçu en récupérant le PDF auprès du serveur. Les templates actuels (`ContractPDF.tsx`, `EDLPDF.tsx`) sont déplacés côté serveur quasiment à l'identique.

---

## 5. Plan d'exécution (rappel, avec les fichiers touchés)

| Phase | Contenu | Principaux fichiers |
|---|---|---|
| 1 Nettoyage | Flags client et serveur, nouvelle `OwnerSidebar`, redirections, inscription directement en OWNER, correction du parser IRL | `App.tsx`, `config/features.ts` (×2), `OwnerSidebar.tsx`, `MobileBottomNav.tsx`, `routes/index.ts`, `irl.routes.ts`, `Register.tsx`, `CLAUDE.md` |
| 2 Tunnel | `/creer-un-bail`, 8 étapes, autosave, reprise par lien magique, vérification avec édition en place, rattachement du brouillon | `pages/lease-wizard/*`, `shared/schemas/*`, `routes/draft.routes.ts`, `services/draft.service.ts`, `lib/leaseRules.ts` (durées, plafonds, alertes), migration 1 |
| 3 PDF du bail | Templates vide et meublé + notice + annexes, versionnement, stockage privé, signature tracée | `server/src/pdf/lease/*`, `services/document.service.ts` (nouveau), migration 2 |
| 4 Biens, locataires, import | Fiches, diagnostics, pièces justificatives (liste fermée), `/importer-un-bail` | pages `owner/*`, `routes/tenant.routes.ts`, `routes/lease.routes.ts` |
| 5 Quittances | Unitaire, en masse, email, reçu partiel, ZIP | `Quittances.tsx`, `pdf/receipt/*`, `jobs/generateMonthlyPayments.ts` |
| 6 EDL | Mobile, photos, sortie comparée à l'entrée | `pages/inventory/*`, `pdf/inventory/*` |
| 7 Annonces IA | Leboncoin et SeLoger, mentions obligatoires, copier, pack photos | `routes/listing.routes.ts`, `pages/owner/Annonces.tsx` |
| 8 Échéances | Moteur `Reminder`, cron quotidien, table IRL, emails | `jobs/reminders.ts`, `pages/owner/Echeances.tsx` |
| 9 Public | Home, pages SEO modèles, mentions légales, CGU, confidentialité | `Home.tsx`, `pages/public/*`, `legal/*`, `sitemap.xml` |

---

## 6. Règles juridiques à coder (à faire relire par un juriste avant la mise en ligne)

- **Durée du bail**
  - Vide : 3 ans si le bailleur est une personne physique **ou une SCI familiale**, 6 ans pour une personne morale.
  - Meublé : 1 an, ou 9 mois pour un étudiant (sans reconduction).
  - Mobilité : 1 à 10 mois, sans dépôt de garantie.
- **Dépôt de garantie** : au plus 1 mois hors charges en vide, 2 mois en meublé.
- **DPE et décence**
  - Classe G non décente pour tout nouveau bail depuis le 01/01/2025 (métropole).
  - Classe F à partir de 2028, classe E à partir de 2034.
  - **Gel des loyers pour F et G** (loi Climat, depuis le 24/08/2022) : ni révision IRL, ni hausse à la relocation. **À ajouter au moteur de révision.**
  - Le calendrier est à revérifier au moment de la phase 2, car des ajustements législatifs sont régulièrement débattus.
- **Encadrement des loyers** : dispositif expérimental (loi ELAN, prolongé par la loi 3DS) dont l'**échéance actuelle est fin novembre 2026**, dans deux mois. Il faut vérifier sa prolongation avant de coder l'alerte « loyer au-dessus du loyer de référence majoré ».
- **Mentions et limites**
  - Zone tendue : décret 2013-392 et sa liste mise à jour.
  - Clauses interdites : article 4 de la loi de 1989.
  - Pièces justificatives : liste limitative du décret 2015-1437.
  - Quittance : gratuite (article 21). Paiement partiel : reçu et non quittance.
- **Diagnostics**
  - DPE : valable 10 ans.
  - ERP : moins de 6 mois.
  - CREP : pour un logement construit avant 1949. Illimité s'il est négatif, 6 ans s'il est positif.
  - Électricité et gaz : installation de plus de 15 ans, valables 6 ans.
  - Amiante : mention du dossier.
  - Bruit : zones PEB.
- **Révision annuelle** : à la date prévue au bail, avec l'IRL du même trimestre. Non rétroactive : le bailleur a 1 an pour la demander.

---

## 7. Risques identifiés

| # | Risque | Gravité | Mesure proposée |
|---|---|---|---|
| R1 | `db push --accept-data-loss` au démarrage | 🔴 | Passer à `migrate deploy` (Q1) |
| R2 | Cookie tiers pour le brouillon anonyme | 🟠 | Sous-domaine `api.bailio.fr` ou token en `localStorage` (Q2) |
| R3 | PDF publics sur Cloudinary (données de tiers) | 🔴 RGPD | Documents générés en `authenticated`, URL signées à courte durée, audit des PDF existants |
| R4 | Mentions « Données en France » (page À propos) et « Bailio SAS · 75011 Paris » (footer), alors que l'hébergement est chez Railway, Vercel et Cloudinary, des sociétés américaines | 🟠 légal | À corriger dans les textes (phase 9) ou changer d'hébergeur. Question Q7 |
| R5 | Rôle RGPD sur les données des locataires (Bailio sous-traitant du propriétaire ?) | 🟠 | À trancher avec un juriste. Export et suppression prévus par `Tenant` |
| R6 | Fin de l'expérimentation de l'encadrement des loyers (11/2026) | 🟡 | Règle paramétrable par ville et par date, sans codage en dur |
| R7 | Endpoints anonymes (brouillons) exposés au spam et au bourrage | 🟡 | Turnstile (déjà présent) + limitation de débit + taille maximale du JSON |
| R8 | Double version de `@react-pdf` (v3 serveur, v4 client) | 🟡 | Aligner le serveur sur la v4 en phase 3 |
| R9 | Dette : 5 moteurs d'OCR, `face-api`, dark mode, lint non fonctionnel, pas de CI | 🟡 | Hors V1. Je propose d'ajouter une config ESLint et une CI minimale (typecheck + build) en phase 1 |
| R10 | Des pages indexées disparaissent (SEO) | 🟠 | Q4 |

---

## 8. Questions (réponses nécessaires avant la phase 1 ou 2)

- **Q1 — Déploiement de la base.** Tu valides le passage à `prisma migrate deploy` avec une migration de référence ? Sans ça, chaque phase reste exposée à R1.
- **Q2 — Domaine de l'API.** Peux-tu mettre l'API sur `api.bailio.fr` (domaine personnalisé Railway) ?
  - **Si oui :** cookie `HttpOnly; Secure; SameSite=Lax` propre.
  - **Si non :** token du brouillon en `localStorage` sur bailio.fr + lien magique. Ça fonctionne aussi, mais c'est moins robuste face au nettoyage du navigateur.
- **Q3 — Modèle économique.** Qu'est-ce qui est gratuit ?
  - **Ma proposition :** tunnel, bail PDF (1 bien) et quittances gratuits sur FREE ; SOLO et PRO pour plusieurs biens, EDL, annonces IA, rappels email.
  - **À réaligner ensuite :** `lib/stripe.ts`, `config/pricing.ts` et la page Tarifs.
- **Q4 — Pages publiques indexées côté locataire** (`/search`, `/property/:id`, 20 × `/location/:ville`, `/locataires`, articles du guide pour les locataires). Trois options :
  - (a) les garder en ligne malgré le flag ;
  - (b) les rediriger en 301 vers des pages propriétaires ;
  - (c) les masquer (404).
  - **Ma recommandation :** (a) pour les articles du guide, (b) pour `/location/:ville` vers une future page « Bail à <ville> », (c) pour `/search` et `/property/:id`.
- **Q5 — Outils avancés du propriétaire** (Finances, Rentabilité, Assistant fiscal, Maintenance, Outils, Wallet). Je les masque derrière `advancedFinance` (mon choix), ou tu veux les garder visibles dans un menu « Plus » ?
- **Q6 — Données de production.** Y a-t-il de vrais utilisateurs, baux et paiements en base ? Ça décide si j'écris le script de reprise `Contract` → `Lease`.
- **Q7 — Mentions légales.** Quelle est la structure juridique réelle (SAS ? micro-entreprise ?) et son adresse ? Le footer affiche « Bailio SAS · 75011 Paris ».
- **Q8 — Emails.** En production, le SMTP Ionos est-il actif, ou Resend ? Le domaine d'envoi est-il vérifié (SPF, DKIM) ? Le lien de reprise en dépend.
- **Q9 — Rôle ADMIN.** Les routes propriétaire acceptent aussi le rôle ADMIN. On garde ?
- **Q10 — Marque sur les documents.** Les PDF portent-ils la marque « Bailio » en pied de page, ou restent-ils neutres pour être imprimés comme un document du propriétaire ?
