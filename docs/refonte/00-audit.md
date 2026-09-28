# Refonte Bailio — « l'assistant du propriétaire bailleur » — Phase 0 : audit

> Version 2 du 28/09/2026. Elle remplace la version 1 (tunnel « Créer un bail »), qui reste consultable dans l'historique git.
> Branche `claude/vigilant-carson-kx4zdo`. **Aucun code applicatif n'a été modifié.** Ce document attend ta validation avant la phase 1.

---

## 0. Résumé en 12 points

1. **Beaucoup de choses sont réutilisables.** Il existe déjà dans le repo :
   - un bail PDF calqué sur le décret 2015-587, vide et meublé (`ContractPDF.tsx`, 876 lignes) ;
   - un état des lieux pièce par pièce avec compteurs et clés ;
   - les quittances, un pad de signature et une route IRL ;
   - 6 jobs cron de rappels ;
   - un modèle `Expense` (dépenses par bien) et une page Finances (2 346 lignes) qui servira de base à l'onglet **Argent** ;
   - une **lecture de documents par Claude avec vision déjà en production** (pièces d'identité, `ocr.routes.ts` : redimensionnement avec sharp puis Claude Haiku 4.5, en synchrone) ;
   - un gestionnaire SSE (`lib/sseManager.ts`) pour pousser le statut « document analysé » en temps réel ;
   - un composant `CameraCapture`.
2. **Premier blocage : un bail exige un compte locataire.** `Contract.tenantId` pointe obligatoirement vers `User` et `Payment` dépend de `Contract`. D'où de **nouvelles tables** (`Lease`, `Tenant`…), en ajout pur, sans toucher à l'existant.
3. **🔴 Risque en production.** Au démarrage, Railway exécute `prisma db push --accept-data-loss`. Un simple renommage de champ supprime la colonne et ses données, sans confirmation. Je recommande de passer à `prisma migrate deploy` avant la première migration (Q1).
4. **Deuxième blocage : la création de bail et les quittances sont payantes.** Elles sont réservées au plan SOLO (4,90 €/mois) et plus, incompatible avec « Commencer gratuitement » (Q3). Par ailleurs, `CLAUDE.md` est faux : le code a 4 plans (FREE=1 bien, SOLO=3, PRO=10, EXPERT=illimité).
5. **Bug IRL confirmé.** L'INSEE répond en XML et refuse `format=json` (erreur 400). La route renvoie donc toujours des valeurs figées de 2024. Vraies dernières valeurs : **2026-T2 = 148,37** (JO du 12/07/2026), 2026-T1 = 146,60, 2025-T4 = 145,78.
6. **🔴 RGPD : fichiers publics.** Les PDF et les images sont envoyés sur Cloudinary en `type: 'upload'`, donc accessibles par URL publique. Les pièces d'identité des locataires (KYC, dossiers) sont concernées. Le projet exige un stockage chiffré et un accès strictement réservé au propriétaire (Q2).
7. **Cookie du brouillon anonyme.** Le front est sur Vercel (bailio.fr), l'API sur Railway (`*.railway.app`). Un cookie posé par l'API serait un cookie tiers, bloqué par Safari (Q4).
8. **File de tâches IA.** Je recommande **pg-boss**, qui s'appuie sur PostgreSQL (MIT, aucune infrastructure de plus). Redis n'est pas fiable ici : le serveur démarre « sans cache » quand il est absent.
9. **Coût IA estimé** (détail au §4.4) :
   - photo de facture : ~**0,035 $** avec Claude Opus 5, ~0,014 $ avec Sonnet 5 ;
   - bail scanné de 10 pages : ~**0,20 $** avec Opus 5, ~0,08 $ avec Sonnet 5 ;
   - pour un propriétaire de 3 logements : **~0,40 $/mois** avec Opus 5, ~0,16 $/mois avec Sonnet 5.
10. **Email entrant `prenom.xxxx@docs.bailio.fr` : faisable.** Resend (déjà dans la stack) sait recevoir des emails sur un sous-domaine, avec un webhook par message, inclus dans tous les plans. Les emails reçus comptent dans le même quota que les envois (gratuit : 3 000/mois). Alternative gratuite : Cloudflare Email Routing + Worker.
11. **Pré-remplissage : les données officielles existent.** Toutes les API sont gratuites et sous Licence Ouverte (voir §5).
    - **Adresses** : la Géoplateforme répond.
    - **DPE** : l'ADEME publie 15,6 millions de DPE depuis juillet 2021, mis à jour le 23/09/2026, avec l'étiquette, la date de fin de validité et l'identifiant BAN. L'identifiant BAN permet de relier directement le DPE à l'adresse choisie.
    - **Zones tendues** : la DILA publie un JSON de référence, mis à jour aujourd'hui.
    - **Encadrement des loyers** : **aucune source unifiée**, les données sont éclatées par ville et souvent datées de 2023. De plus, l'expérimentation **arrive à échéance fin novembre 2026**.
12. **État de départ.** Client et serveur compilent avec **0 erreur TypeScript**. `npm run lint` (client) ne tourne pas : aucune configuration ESLint. Pas de CI, 2 fichiers de tests.

---

## 1. Stack réelle

| Couche | Réalité constatée |
|---|---|
| Front | React 18.3, Vite 6, TypeScript strict, React Router 6.22, Zustand 4, TanStack Query 5, react-hook-form 7 + zod 3 (installés), Tailwind 3 (mise en page) + tokens `BAI` inline, lucide-react, framer-motion, PWA (`vite-plugin-pwa`), `pdfjs-dist` 5 (affichage de PDF), `react-dropzone` |
| PDF | Client : `@react-pdf/renderer` **v4.3** (bail, EDL). Serveur : `@react-pdf/renderer` **v3.4** + `pdf-lib` (quittance, rapport fiscal). Deux versions différentes |
| Signature | `react-signature-canvas` (surcouche de `signature_pad`, MIT). Champs Yousign prévus dans le schéma, avec webhook |
| Back | Express 4 + TypeScript (ESM), `tsx` en dev, **pm2** en production (`ecosystem.config.cjs`, pratique pour lancer un worker séparé) |
| Base de données | PostgreSQL + Prisma 5.9, schéma de 1 291 lignes (~40 modèles). Dossier `migrations/` abandonné depuis 02/2026 : on utilise `db push --accept-data-loss` |
| Auth | JWT (access + refresh en base), refresh stocké dans le store Zustand côté client (pas de cookie), Google OAuth, lien magique (`TokenType.MAGIC_LINK`, lié à un `User` existant), TOTP 2FA, Cloudflare Turnstile, vérification d'email par code |
| Emails sortants | `utils/email.util.ts` : SMTP Ionos → Resend en repli → log console |
| Stockage | Cloudinary (images + PDF en `raw`), multer en mémoire. URL signées disponibles (`cloudinary.util.ts`) mais non utilisées par défaut |
| IA | `@anthropic-ai/sdk` 0.91 : Claude Haiku 4.5 pour l'OCR d'identité, le scoring de dossiers et la recherche en langage naturel. **5 autres moteurs d'OCR** : Gemini, Mindee, docTR, PaddleOCR (Python), Tesseract |
| Crons | `node-cron` dans `server.ts` : paiements mensuels, rappels de loyer, contrats, IRL, onboarding, alertes de recherche, nettoyage |
| Temps réel | SSE (`sseManager`) + Redis pub/sub **optionnel** |
| Paiement | Stripe Billing (4 plans), Stripe Connect + SEPA (loyers), codes promo |
| Hébergement | Front sur **Vercel** (réécriture SPA, pas de CSP). API sur **Railway** (Dockerfile avec Python/Tesseract). Postgres : fournisseur non visible dans le repo |
| Qualité | 0 erreur TypeScript (client et serveur). Lint client non fonctionnel. Pas de CI |

---

## 2. Cartographie des pages et composants

Légende :
- ✅ **réutilisable** : garder et adapter ;
- ⏸ **pause** : derrière un feature flag désactivé par défaut, sans suppression ;
- 🗑 **à supprimer plus tard** : après la V1, avec ton accord.

### 2.1 Correspondance avec la nouvelle navigation

| Nouvel écran | Point de départ existant | Verdict |
|---|---|---|
| **Aujourd'hui** | `owner/Dashboard.tsx` (925 l.) | ✅ réécrit : liste « À faire » + résumé en une ligne. Les KPI disparaissent |
| **Logements** (liste + fiche + chronologie) | `MyProperties`, `PropertyDetails`, `CreatePropertyWizard` (1 300 l.), `EditProperty`, `PropertyCard`, `ImageUpload` | ✅ fiche épurée. Le wizard fond de 1 300 lignes à 3 écrans (adresse, surface et pièces, photos) |
| **Documents** | `owner/Documents.tsx` (1 454 l.), `DocumentViewerModal`, `DocumentUpload` | ✅ liste filtrable par logement et par type + écran de validation |
| **Argent** | `owner/Finance.tsx` (2 346 l., dépenses et prêts), `owner/Quittances.tsx` (1 317 l.), `routes/finance.routes.ts` | ✅ simplifié : loyers, dépenses, travaux, bilan annuel |
| **Bouton « + »** | `dossier/CameraCapture`, `react-dropzone` | ✅ nouveau composant `CaptureSheet` |
| Mon compte | `owner/Settings`, `Profile`, `Abonnement` | ✅ derrière l'avatar, hors onglets |
| Bail (tunnel) | `contracts/CreateContract.tsx` (3 étapes, clauses) | ⏸ remplacé par le tunnel `/commencer`. L'étape « Clauses » est réutilisée |
| EDL mobile | `contracts/EtatDesLieux.tsx` + `EDLPDF.tsx` | ✅ structure reprise (phase 7) |
| PDF | `ContractPDF.tsx`, `EDLPDF.tsx`, `templates/receiptPDF.ts` | ✅ déplacés côté serveur (voir §4.5) |

### 2.2 Pages propriétaire hors périmètre

| Élément | Verdict | Motif |
|---|---|---|
| `owner/ApplicationManagement`, `BookingManagement`, `components/dossier/KanbanBoard`, `application/*`, `booking/*`, `VisitSlotsManager`, `AvailabilityScheduler` | ⏸ | Candidatures et visites |
| `owner/Rentabilite`, `owner/FiscalWizard` | ⏸ | La fiscalité est hors périmètre. Seul l'export annuel des données est prévu |
| `owner/Maintenance` (tickets ouverts par les locataires), `owner/Outils`, `owner/Wallet` | ⏸ | Remplacés par le carnet de travaux. Wallet = paiement en ligne |
| `owner/MesLocataires`, `owner/TenantProfile` | ✅ réécriture | Basés sur des `User` locataires ; deviennent des fiches `Tenant` intégrées au logement |
| `contracts/ContractsList`, `ContractDetails` (1 880 l.), `EdlSession`, `EdlJoin` | ⏸ | Ancien flux avec compte locataire, gardé en lecture pour l'historique |

### 2.3 Espace locataire et marketplace (tout en ⏸)

- **Pages locataire :** `TenantDashboard`, `TenantPayments`, `MyBookings`, `MyApplications`, `Favorites`, `DossierLocatif` (2 161 l.), `DossierShareManager`, `PrivacyCenter`, `tenant/*`, `SearchAlerts`, `TenantSidebar`.
- **Pages transverses :** `Messages`, `SelectRole`, `kyc/KycFlow`, `VerifyIdentity`.
- **Composants :** `message/*`, `kyc/*`, `search/*`, `property/SwipeStack`, `SearchMap`, `SearchFilters`, `ContactModal`, `PropertyShareKit`, `security/ReportUserModal`.

### 2.4 Pages publiques (le site devient une seule page)

| Élément | Verdict |
|---|---|
| `Home.tsx` (1 725 l.) | ✅ réécrit en phase 9 selon la structure imposée (7 blocs) |
| `legal/*` (mentions, CGU, confidentialité, cookies) | ✅ mis à jour : traitement IA, données de tiers, durées de conservation |
| `Pricing`, `info/Proprietaires`, `APropos`, `FAQ`, `Contact`, `Support`, `Presse`, `Videos` | ⏸ ? Le site passe à une seule page. Ce sont des **pages indexées** (Q5) |
| `public/Guide` + `GuideArticle` (13 articles indexés), `Estimer` | ⏸ ? Base SEO pour les futures pages « modèle de bail », etc. (Q5) |
| `public/SearchProperties`, `PropertyDetailsPublic`, `LocationVille` (×20 villes indexées), `info/Locataires` | ⏸ Indexées (Q5) |
| `WaitlistPage` (1 608 l.), `SiteGate`, `LaunchGuard` | 🗑 plus tard |

### 2.5 Backend

| Élément | Verdict |
|---|---|
| `auth.*`, `email.util`, `emailTemplates`, `privacy.service` (export et suppression), `planGate`, `featureGate`, rate limiters, `turnstile` | ✅ |
| `ocr.routes.ts` (pipeline Claude vision) | ✅ **modèle** pour la capture universelle, en asynchrone |
| `property.*`, `finance.routes` (dépenses), `georisques.routes` (ERP), `market`/DVF | ✅ |
| `irl.routes` + `jobs/irlReminders` | ✅ **à corriger** (XML, cache en base) |
| `jobs/contractReminders`, `generateMonthlyPayments`, `sendRentReminders` | ✅ fusionnés dans le moteur `Reminder` |
| `templates/receiptPDF.ts` (pdf-lib) | ✅ puis 🗑 : remplacé par un template React-PDF (quittance et reçu) |
| `contract.*`, `edl.*`, `document.*` | ⏸ ancien flux, conservé pour les données existantes |
| `application`, `booking`, `message`, `dossier`, `favorite`, `alert`, `kyc`, `connect`, `sepa`, `yousign.webhook`, `syndication` (bouchons Leboncoin), `propertyKit` | ⏸ flag serveur, qui renvoie 404 |
| Les 5 services d'OCR tiers | 🗑 plus tard : un seul pipeline Claude suffit |

### 2.6 Feature flags

- Un fichier par côté :
  - `client/src/config/features.ts`, lu depuis `VITE_FEATURE_*` ;
  - `server/src/config/features.ts`, lu depuis `FEATURE_*`, avec un middleware `requireFlag()` qui renvoie 404.
- Flags proposés, tous `false` par défaut : `tenantSpace`, `applications`, `visits`, `messaging`, `marketplace`, `kyc`, `onlinePayments`, `fiscalTools`, `legacyContracts`.
- Routes désactivées : redirection vers `/aujourdhui` (connecté) ou `/` (anonyme), sauf les pages publiques indexées (Q5).

---

## 3. Schéma de données cible

### 3.1 Principes

- **Uniquement de l'ajout** (nouvelles tables, colonnes nullables, nouvelles valeurs d'enum). Aucun `DROP` ni renommage pendant la refonte.
- Les nouveaux modèles **ne dépendent jamais d'un compte locataire**.
- Les montants des nouvelles tables sont en **centimes entiers**. L'existant (`Expense.amount` en `Float`) est conservé.
- Chaque formulaire a un **schéma zod partagé** entre le client et le serveur (`shared/schemas/*`). Le serveur revalide toujours.
- Toute donnée extraite par l'IA garde sa **provenance** : document, page, statut « suggéré » ou « confirmé ».

### 3.2 Modèles (Prisma, version abrégée)

```prisma
// ── Personnes ──────────────────────────────────────────────
model Landlord {          // « Owner » : bailleur, personne ou SCI, géré par un User
  id, userId → User, kind (PERSON|COMPANY), isFamilySci   // une SCI familiale garde la durée de 3 ans
  firstName?, lastName?, companyName?, siren?, representativeName?
  address, postalCode, city, email, phone?, agent Json?
}
model Tenant    { id, ownerUserId, firstName, lastName, email?, phone?, birthDate?, birthPlace?, deletedAt? }
model Guarantor { id, tenantId, kind (PERSON|VISALE|ORGANISM), identity…, maxAmountCents?, durationMonths? }
model Contractor { id, ownerUserId, name, trade?, phone?, email?, siret?, notes? }   // répertoire des artisans

// ── Logement ───────────────────────────────────────────────
model Property {          // EXISTANT, champs ajoutés (tous nullables)
  + landlordId?, banId? (identifiant BAN), inseeCode?, legalRegime?, constructionPeriod?
  + mainRooms?, annexes Json?, equipments Json?, heatingMode?, hotWaterMode?
  + dpeClass?, gesClass?, dpeNumber? (n° ADEME), dpeEnergyCostMin/Max?
  + furnishedInventory Json? (décret 2015-981), isTenseZone?, rentControlArea?
}
model PropertyTimelineEvent {   // la chronologie : une ligne par événement, avec des liens typés
  id, propertyId, occurredAt, kind (LEASE_SIGNED|RENT_RECEIVED|EXPENSE|WORK|DIAGNOSTIC|INVENTORY|LETTER|DOCUMENT|NOTE…)
  title, amountCents?, documentId?, leaseId?, expenseId?, workOrderId?, reminderId?, createdBy (USER|SYSTEM|AI)
  @@index([propertyId, occurredAt])
}
model Diagnostic { id, propertyId, kind (DPE|ERP|CREP|ELEC|GAS|ASBESTOS|NOISE|TERMITES), performedAt?, expiresAt?, result?, documentId?, source (ADEME|CAPTURE|MANUAL) }

// ── Bail et loyers ─────────────────────────────────────────
model Lease {
  id, ownerUserId, landlordId, propertyId
  type (UNFURNISHED|FURNISHED|MOBILITY|SHARED_SINGLE_LEASE), isStudent
  status (DRAFT|ACTIVE|ENDED|IMPORTED), source (CREATED|IMPORTED)
  startDate, durationMonths, endDate, rentCents, chargesCents, chargesMode (PROVISION|FLAT)
  paymentDay, paymentMethod?, depositCents, isTenseZone
  refRentCents?, refRentMajCents?, rentComplementCents?, previousRentCents?, worksSinceLastLease?
  irlRefQuarter?, irlRefValue?, specialClauses Json?, formData Json, schemaVersion
  tenantInsuranceUntil?              // alimenté par la capture d'une attestation d'assurance
}
model LeaseTenant { leaseId, tenantId, isPrimary  @@id([leaseId, tenantId]) }
model RentPayment {                  // nouveau : l'ancien `Payment` exige un Contract
  id, leaseId, year, month, periodStart, periodEnd, rentCents, chargesCents
  paidCents, paidAt?, status (EXPECTED|PARTIAL|PAID|LATE|WAIVED), documentId? (quittance ou reçu)
  source (MANUAL|BANK)?, bankTransactionRef?   // prêt pour un agrégateur bancaire DSP2 plus tard
  @@unique([leaseId, year, month])
}

// ── Dépenses et travaux ────────────────────────────────────
model Expense {           // EXISTANT, colonnes ajoutées + valeurs d'enum ajoutées
  + documentId?, workOrderId?, supplierName?, amountCents?, vatCents?
  + recoverable Boolean?, recoverableBasis? (rubrique du décret 87-713), classification (ENTRETIEN|AMELIORATION|REPARATION|TAXE|ASSURANCE|COPRO|AUTRE)
  + fieldsStatus Json     // { amount: "confirmed", recoverable: "suggested", … }
  enum ExpenseCategory + (EAU, ENERGIE, ENTRETIEN_COMMUN, HONORAIRES, PRET)
}
model WorkOrder { id, propertyId, date, room?, description, contractorId?, costCents?, beforePhotoKeys[], afterPhotoKeys[],
                  warrantyKind? (DECENNALE|BIENNALE|CONSTRUCTEUR|AUTRE), warrantyEndsAt?, documentIds[] }

// ── Documents et IA ────────────────────────────────────────
model Document {
  id, ownerUserId, propertyId?, leaseId?, tenantId?
  source (GENERATED|UPLOADED|CAPTURED|EMAIL), type (LEASE|RENT_RECEIPT|PAYMENT_RECEIPT|INVENTORY_ENTRY|INVENTORY_EXIT|LETTER|INVOICE|QUOTE|PROPERTY_TAX|COPRO_CALL|CHARGES_STATEMENT|INSURANCE_CERT|DIAGNOSTIC|TENANT_LETTER|LOAN_NOTICE|OTHER)
  status (QUEUED|PROCESSING|NEEDS_REVIEW|VALIDATED|FAILED|REJECTED_FORBIDDEN)
  version, supersedesId?          // versions, jamais d'écrasement
  storageKey (privé, chiffré), sha256 (dédoublonnage), mimeType, sizeBytes, pageCount?
  extracted Json?, fieldSources Json?  // { amount: { page: 1, text: "Total TTC 890,00 €" } }
  aiModel?, aiInputTokens?, aiOutputTokens?, aiCostMicros?, processingError?
  inputSnapshot Json?, generatorVersion?   // pour les documents générés (régénération identique)
  signatures DocumentSignature[]
}
model DocumentSignature { id, documentId, signerRole, signerName, method (PRINTED_HANDWRITTEN|ON_SCREEN_DRAWN|PROVIDER), imageKey?, signedAt, ip?, userAgent?, provider?, providerRef? }
model InboundAddress { id, userId @unique, localPart @unique /* "marie.k7f2" */, active }
model InboundEmail   { id, userId, providerMessageId @unique, from, subject?, receivedAt, status (RECEIVED|PROCESSED|IGNORED|SPAM), documentIds[] }

// ── Échéances ──────────────────────────────────────────────
model Reminder {
  id, ownerUserId, propertyId?, leaseId?, type (RENT_DUE|RENT_REVISION|LEASE_END_NOTICE|INSURANCE_CERT|CHARGES_REGULARISATION|DIAGNOSTIC_EXPIRY|WARRANTY_EXPIRY|PROPERTY_TAX|DEPOSIT_RETURN|CUSTOM)
  dueDate, notifyAt, status (UPCOMING|TODO|DONE|SNOOZED|DISMISSED), snoozedUntil?, doneAt?
  preparedAction Json?   // { kind: "GENERATE_RECEIPT", amountCents, documentDraftId?, emailDraft? }
  sourceDocumentId?      // rappel né d'un document capturé
  @@unique([leaseId, type, dueDate])
}
model IrlIndex { quarter @id, value Decimal, publishedAt }

// ── Entrée sans compte, annonces, EDL ──────────────────────
model Draft   { id, tokenHash @unique, kind (IMPORT_LEASE|NEW_PROPERTY|CREATE_LEASE), userId?, currentStep, data Json, schemaVersion, resumeEmail?, expiresAt (+30 j), claimedAt? }
model Listing { id, propertyId, platform (LEBONCOIN|SELOGER), title, body, mandatoryMentions Json, aiModel, createdAt }
model Inventory     { id, leaseId, type (ENTRY|EXIT), date, entryInventoryId?, meters Json, keys Json, comment?, status, documentId? }
model InventoryRoom { id, inventoryId, name, position }
model InventoryItem { id, roomId, element, category, condition (NEW|GOOD|WORN|BAD), comment?, photoKeys[] }
```

### 3.3 Stratégie de migration

1. **Avant la première migration (Q1)**, remplacer `db push --accept-data-loss` par `prisma migrate deploy` :
   - générer une migration de référence depuis la base de production (`migrate diff` puis `migrate resolve --applied`) ;
   - ensuite, une migration SQL relue par phase.
2. Chaque phase n'ajoute que ses tables :
   - phase 2 : `Landlord`, `PropertyTimelineEvent`, `Diagnostic`, colonnes `Property` ;
   - phase 3 : `Draft`, `Tenant`, `Lease`… ;
   - phase 4 : `Document`, `RentPayment`… ;
   - et ainsi de suite.
3. **Script de reprise optionnel et idempotent** : `Contract` → `Lease` + `Tenant` (copie de l'identité du `User` locataire), `Payment` → `RentPayment`. À écrire seulement s'il y a des baux réels en production (Q6).
4. Aucune suppression avant la fin de la refonte et ton feu vert explicite.

---

## 4. Architecture du traitement IA des documents

### 4.1 Le flux

```
[Bouton + : photo / dépôt]      [Email → prenom.xxxx@docs.bailio.fr]
          │                                   │ (webhook Resend, signature vérifiée)
          ▼                                   ▼
 POST /captures (multer, 25 Mo max, jpg/png/webp/pdf ; heic converti côté navigateur)
          │ 1. sha256 → doublon ? on réutilise le document existant
          │ 2. stockage privé chiffré (clé non devinable)
          │ 3. Document{status: QUEUED} + tâche pg-boss "extract-document"
          ▼
 WORKER (process pm2 séparé, 3 tâches en parallèle, 3 essais avec délai croissant)
          │ a. préparation : rotation EXIF, redimensionnement à 1 568 px (sharp) ;
          │    PDF numérique → texte extrait (pdfjs) ; PDF scanné → envoyé tel quel
          │ b. UN appel Claude : classification + extraction en **sortie structurée** (JSON Schema)
          │    contexte envoyé : le document + la liste des adresses des logements du propriétaire. Rien d'autre.
          │ c. règles déterministes (pas d'IA) :
          │    - logement : géocodage BAN de l'adresse extraite, comparé aux banId des logements ;
          │    - charge récupérable : table du décret 87-713 d'abord, suggestion de l'IA en second ;
          │    - cohérence des montants (HT + TVA = TTC), des dates, d'un doublon de facture ;
          │    - **pièce interdite** (décret 2015-1437) → fichier supprimé, statut REJECTED_FORBIDDEN, message clair
          │ d. Document{status: NEEDS_REVIEW, extracted, fieldSources}
          ▼
 Notification SSE (sseManager existant) + « 1 document à vérifier » sur Aujourd'hui
          ▼
 ÉCRAN DE VALIDATION : document à gauche, champs à droite
 (chaque champ : valeur + badge « à vérifier » + « lu à la page 1 : “Total TTC 890,00 €” »)
          │ bouton « Valider »
          ▼
 Transaction : Expense / Diagnostic / WorkOrder / Lease.tenantInsuranceUntil…
             + PropertyTimelineEvent + Reminder(s) dérivés + Document{status: VALIDATED}
```

### 4.2 Choix techniques et pourquoi

- **Un seul appel par document** (classification et extraction ensemble) plutôt que deux : moins de latence, ce qui compte pour l'objectif de moins de 30 secondes. Le schéma JSON est une union discriminée par type de document.
- **La provenance par champ** passe par le schéma (`page`, `extrait`) et non par l'option Citations de l'API, qui est incompatible avec la sortie structurée.
- **pg-boss plutôt que BullMQ.** La file vit dans PostgreSQL, donc pas de nouveau service. Elle gère les essais, les délais et les tâches planifiées (utile pour le moteur de rappels quotidien et l'email hebdomadaire). Redis n'est pas garanti en production.
- **Minimisation des données** (§10 du brief) :
  - on n'envoie que le document concerné et les adresses des logements, jamais les données des locataires stockées ailleurs ;
  - on ne met en cache que la partie fixe (instructions et schéma) ;
  - on journalise les tokens et le coût dans `Document`, sans le contenu.
- **Latence cible :** 5 à 15 secondes pour une photo, 20 à 40 secondes pour un bail de 10 pages. L'écran affiche « Bailio lit votre document… » avec une barre d'état (en file → en lecture → à vérifier).
- **Le traitement par lots (−50 %) n'est pas retenu** pour le flux temps réel : délai de plusieurs heures, incompatible avec les 30 secondes. Il reste utile pour un retraitement en masse.

### 4.3 Documents reconnus en V1

Facture d'artisan, devis, taxe foncière (avec extraction de la **TEOM**, récupérable), appel de fonds de copropriété, relevé de charges, attestation d'assurance du locataire, diagnostics (DPE, électricité, gaz, plomb, amiante, ERP), bail, état des lieux, courrier du locataire, échéancier de prêt, « autre ».

### 4.4 Coût IA estimé par document

Tarifs publics de l'API Anthropic (par million de tokens, entrée / sortie) :

| Modèle | Entrée | Sortie |
|---|---|---|
| Claude Opus 5 | 5 $ | 25 $ |
| Claude Sonnet 5 | 2 $ | 10 $ |
| Claude Haiku 4.5 | 1 $ | 5 $ |

La lecture du cache coûte 10 % du prix d'entrée.

Hypothèses :
- une photo est redimensionnée à ~1 600 tokens ;
- une page de PDF scanné vaut ~2 500 tokens ;
- les instructions et le schéma (2 500 tokens) sont en cache ;
- la sortie fait 500 à 3 000 tokens selon le document, raisonnement compris.

| Traitement | Opus 5 | Sonnet 5 | Haiku 4.5 |
|---|---|---|---|
| Photo de facture ou attestation (1 page) | ~0,035 $ | ~0,014 $ | ~0,005 $ |
| PDF numérique de 2 pages (texte extrait) | ~0,03 $ | ~0,012 $ | ~0,005 $ |
| Bail scanné de 10 pages | ~0,20 $ | ~0,08 $ | ~0,04 $ |
| Courrier rédigé (relance, révision…) | ~0,045 $ | ~0,018 $ | ~0,008 $ |
| Annonce (fiche + 6 photos) | ~0,09 $ | ~0,035 $ | ~0,015 $ |
| **Propriétaire de 3 logements** (~8 captures + 2 courriers/mois, bail amorti) | **~0,40 $/mois** | **~0,16 $/mois** | ~0,07 $/mois |

- **Recommandation :** Claude Opus 5 par défaut (le plus fiable sur des montants et des dates, là où une erreur coûte cher). Le coût reste inférieur à 1 % d'un abonnement à 4,90 €.
- **Descendre vers Sonnet 5 ou Haiku 4.5 est ta décision.** Je propose de la trancher sur un test de 30 à 50 vrais documents avant la phase 6.
- **Garde-fous :**
  - quota mensuel par plan (la table `AiUsageTracking` existe déjà) ;
  - taille et nombre de pages limités ;
  - dédoublonnage par sha256, pour ne jamais payer deux fois la même lecture.
- Ces chiffres sont des **estimations** : je les mesurerai sur de vrais documents (comptage des tokens) avant la phase 6.

### 4.5 Génération des PDF

Génération **côté serveur** avec `@react-pdf/renderer` v4 (serveur aligné sur le client). C'est nécessaire pour :
- le hash, le versionnement et le stockage ;
- l'envoi par email et la génération en masse des quittances ;
- ne jamais faire confiance à un PDF fabriqué par le navigateur.

Les templates existants sont déplacés quasiment tels quels. **Gotenberg n'est pas retenu** : il ajouterait un conteneur Chromium sur Railway pour un gain nul, puisque React-PDF couvre déjà A4, marges, pagination et numéros de page.

---

## 5. Librairies et API proposées

| Besoin | Proposition | Licence | Coût |
|---|---|---|---|
| File de tâches | `pg-boss` | MIT | 0 (PostgreSQL existant) |
| IA (vision, extraction, courriers, annonces) | `@anthropic-ai/sdk` (installé) | MIT | à l'usage, §4.4 |
| PDF | `@react-pdf/renderer` (installé, serveur passé de v3 à v4), `pdf-lib` (fusion notice et annexes, installé) | MIT | 0 |
| Texte des PDF numériques / aperçu | `pdfjs-dist` (installé côté client ; à ajouter côté serveur) | Apache-2.0 | 0 |
| Images | `sharp` (installé) | Apache-2.0 (libvips LGPL, liaison dynamique, sans contrainte) | 0 |
| Compression photo sur mobile | `browser-image-compression` | MIT | 0 |
| Conversion HEIC (iPhone) | `heic2any` (côté client, en secours) | MIT | 0 |
| Signature tracée | `react-signature-canvas` / `signature_pad` (installés) | MIT | 0 |
| Formulaires | `react-hook-form`, `zod`, `@hookform/resolvers` (installés) | MIT | 0 |
| XML de l'INSEE | `fast-xml-parser` | MIT | 0 |
| ZIP des quittances | `archiver` | MIT | 0 |
| Email entrant | **Resend Inbound** sur le sous-domaine `docs.bailio.fr` (MX), webhook par message, pièces jointes via l'API | — | inclus. Gratuit : 3 000 emails/mois (envoi et réception confondus, 100/jour) ; Pro : 20 $/mois pour 50 000 |
| Email entrant (alternative) | Cloudflare Email Routing + Email Worker (`postal-mime`, MIT) → R2 → webhook | — | gratuit (100 000 requêtes/jour, 25 Mo par email). Le domaine doit être géré chez Cloudflare |
| Adresse | Géoplateforme `data.geopf.fr/geocodage/completion` et `/search` ✔ testées | Licence Ouverte | gratuit (limite de débit à respecter) |
| DPE | ADEME, jeu `dpe03existant` (data-fair) : 15,6 M de DPE, champs `etiquette_dpe`, `date_fin_validite_dpe`, `identifiant_ban`, `numero_etage_appartement` | Licence Ouverte 2.0 | gratuit. ⚠️ `/lines` renvoie 403 depuis cet environnement (pare-feu), **à tester depuis Railway** |
| Zone tendue | DILA, données de référence du simulateur officiel (JSON sur gitlab `pidila/sp-simulateurs-data`, mis à jour le 28/09/2026), indexées par code INSEE | Licence Ouverte | gratuit, copie locale rafraîchie chaque mois |
| Encadrement des loyers | **Pas d'API unifiée**, données par ville (Paris, Lille, Montpellier, Bordeaux…, souvent de 2023) | Licence Ouverte | V1 : liste des communes concernées + saisie guidée + lien vers le simulateur officiel de la ville |
| IRL | INSEE BDM, série `001515333` (XML SDMX, sans clé) ✔ testée | Licence Ouverte | gratuit, copie en base (`IrlIndex`) |
| ERP (risques) | Géorisques (route déjà présente) | Licence Ouverte | gratuit |
| **Non retenus** | Gotenberg (MIT, inutile). **Documenso et DocuSeal : AGPL-3.0**, à brancher plus tard **uniquement comme service séparé** appelé par API, sans jamais importer leur code | — | — |

---

## 6. Plan phase par phase (fichiers principaux)

| Phase | Contenu | Fichiers |
|---|---|---|
| 1 Nettoyage | Flags client et serveur, navigation 4 onglets + « + » (barre du bas sur mobile, sidebar sur desktop), redirections, inscription directement en OWNER, config ESLint + CI minimale (typecheck + build), correction de l'IRL | `App.tsx`, `config/features.ts` ×2, `OwnerSidebar.tsx` → `AppNav.tsx`, `MobileBottomNav.tsx`, `routes/index.ts`, `irl.routes.ts`, `CLAUDE.md` |
| 2 Logements | Fiche épurée, autocomplétion BAN, DPE ADEME proposé, zone tendue, chronologie vide | `pages/logements/*`, `services/geo.service.ts`, `services/dpe.service.ts`, migration 1 |
| 3 Entrée sans compte | `/commencer`, 3 portes, `Draft` + autosave, lien de reprise, vérification avec édition en place, compte à la fin et rattachement du brouillon | `pages/commencer/*`, `routes/draft.routes.ts`, `shared/schemas/*`, `lib/leaseRules.ts` |
| 4 Bail et quittances | PDF vide et meublé + notice + annexes, quittance ou reçu, versions, signature tracée | `server/src/pdf/*`, `services/document.service.ts` |
| 5 Pilote automatique | Moteur `Reminder`, écran Aujourd'hui, email hebdomadaire, révision IRL avec gel F/G | `jobs/reminders.ts`, `pages/Aujourdhui.tsx` |
| 6 Capture universelle | `/captures`, worker pg-boss, email entrant, écran de validation, carnet de travaux, onglet Argent | `routes/capture.routes.ts`, `workers/extract.ts`, `pages/documents/Review.tsx`, `pages/argent/*` |
| 7 EDL et dépôt de garantie | EDL mobile avec photos, comparaison entrée/sortie, compte à rebours de restitution | `pages/edl/*`, `pdf/inventory/*` |
| 8 Courriers et annonces | Courriers IA relus, annonces Leboncoin/SeLoger | `routes/letters.routes.ts`, `routes/listing.routes.ts` |
| 9 Page publique | Home en 7 blocs, légal à jour | `Home.tsx`, `legal/*`, `sitemap.xml` |

---

## 7. Règles juridiques à coder (à faire relire par un juriste avant la mise en ligne)

- **Durée du bail**
  - Vide : 3 ans (personne physique ou **SCI familiale**), 6 ans (personne morale).
  - Meublé : 1 an, ou 9 mois pour un étudiant.
  - Mobilité : 1 à 10 mois, **sans** dépôt de garantie.
- **Dépôt de garantie :** au plus 1 mois hors charges en vide, 2 mois en meublé.
  - Restitution : 1 mois si l'état des lieux de sortie est conforme, 2 mois sinon.
  - Pénalité de retard : 10 % du loyer mensuel par mois commencé (art. 22).
- **Décence énergétique :** un logement classé G ne peut plus faire l'objet d'un nouveau bail depuis le 01/01/2025. Viendront F en 2028 et E en 2034 (métropole).
  - **Gel des loyers F et G** depuis le 24/08/2022 : ni révision IRL, ni hausse à la relocation. **Absent du code actuel, à ajouter.**
  - Calendrier à revérifier au moment du codage.
- **Révision annuelle** (art. 17-1) : à la date prévue au bail, avec l'IRL du trimestre de référence.
  - Le bailleur a **1 an** à compter de la date de révision pour la demander.
  - Elle ne prend effet qu'**à la date de la demande**, sans rétroactivité.
  - D'où un rappel envoyé 1 mois **avant** la date anniversaire.
- **Congé donné par le bailleur :** 6 mois avant l'échéance en vide, 3 mois en meublé, pour un motif légal (vente, reprise, motif légitime et sérieux).
  - Préavis du locataire : 3 mois en vide (1 mois en zone tendue et dans d'autres cas), 1 mois en meublé.
- **Assurance du locataire :** attestation à la remise des clés puis chaque année à la demande du bailleur. Faute de réponse 1 mois après une mise en demeure, le bailleur peut souscrire une assurance pour le compte du locataire.
- **Régularisation des charges :** annuelle. Décompte par nature de charges envoyé 1 mois avant. Justificatifs tenus à disposition 6 mois. Étalement sur 12 mois si la régularisation est faite plus d'un an après l'exigibilité. Prescription de 3 ans. Charges récupérables : **décret 87-713**.
- **Quittance :** gratuite, sur demande (art. 21). En cas de paiement partiel, **reçu** et non quittance.
- **Pièces du locataire :** liste limitative du **décret 2015-1437**. Tout document hors liste est refusé et supprimé à la capture.
- **Encadrement des loyers :** dispositif expérimental (lois ELAN puis 3DS), **échéance fin novembre 2026**. Paramétrable par ville et par date, jamais codé en dur.

---

## 8. Sécurité et RGPD

- **Stockage** (Q2) : les fichiers sortent de Cloudinary public vers un stockage privé et chiffré au repos, avec des clés non devinables, servis uniquement via des URL signées de 5 minutes après contrôle d'appartenance. Les fichiers existants sont à migrer ou à passer en `authenticated`.
- **Contrôle d'accès :** chaque requête est filtrée par `ownerUserId`. Tests d'accès croisé ajoutés dès la phase 2.
- **Export et suppression :** `privacy.service` existe déjà (art. 17 et 20). À étendre aux nouvelles tables et aux fichiers stockés.
- **Durées de conservation à définir avec toi et un juriste.** Proposition :
  - documents d'un bail : durée du bail + 5 ans ;
  - quittances : 3 ans ;
  - pièces justificatives d'un candidat non retenu : **aucune en V1** ;
  - brouillons anonymes : 30 jours ;
  - emails entrants non rattachés : 30 jours.
- **IA :**
  - mention explicite dans la politique de confidentialité ;
  - données envoyées réduites au strict nécessaire ;
  - **pas d'entraînement sur les données transmises par l'API** selon les conditions commerciales d'Anthropic, à confirmer avec le DPA ;
  - **transfert hors UE** à encadrer par les clauses contractuelles types, et vérifier les options de localisation du traitement (Q7).
- **Rôle RGPD** vis-à-vis des locataires : Bailio est probablement sous-traitant du propriétaire. À trancher avec un juriste, car cela conditionne les CGU.

---

## 9. Risques

| # | Risque | Gravité | Mesure |
|---|---|---|---|
| R1 | `db push --accept-data-loss` au démarrage | 🔴 | `migrate deploy` (Q1) |
| R2 | Fichiers publics sur Cloudinary (identité, baux) | 🔴 RGPD | Stockage privé et chiffré (Q2) |
| R3 | Erreur d'extraction IA (montant, date, logement) | 🟠 | Validation humaine obligatoire, provenance affichée, contrôles déterministes, test sur 50 documents réels avant la mise en ligne |
| R4 | Coût IA non maîtrisé (abus, documents énormes) | 🟡 | Quotas par plan, 25 Mo et N pages maximum, dédoublonnage, suivi du coût par document |
| R5 | Cookie tiers pour le brouillon anonyme | 🟠 | Q4 |
| R6 | Spam sur les endpoints anonymes et l'email entrant | 🟡 | Turnstile (déjà présent), limitation de débit, adresse aléatoire (`marie.k7f2`), expéditeurs inconnus mis en attente |
| R7 | Encadrement des loyers : données éclatées + fin d'expérimentation | 🟡 | Règle paramétrable, avertissement plutôt que blocage |
| R8 | Des pages indexées disparaissent (le site passe à 1 page) | 🟠 SEO | Q5 |
| R9 | Mentions « Données en France » (À propos) et « Bailio SAS · 75011 Paris » (footer) alors que l'hébergement est chez Railway, Vercel, Cloudinary et Anthropic, des sociétés américaines | 🟠 légal | Q7 et Q8 |
| R10 | Dette technique : 5 moteurs d'OCR, `face-api`, dark mode, lint cassé, pas de CI | 🟡 | CI minimale en phase 1, le reste après la V1 |

---

## 10. Questions

- **Q1 — Base de données.** Tu valides le passage à `prisma migrate deploy` avec une migration de référence ? C'est un changement du déploiement ; sans lui, chaque phase reste exposée à R1.
- **Q2 — Stockage des fichiers.** Deux options :
  - (a) Cloudinary en mode `authenticated` : peu de changements, mais hébergé aux États-Unis ;
  - (b) stockage objet compatible S3 hébergé en France (Scaleway, OVH), avec chiffrement : **ma recommandation** pour des données de locataires.
  Accepterais-tu un petit coût mensuel pour l'option (b) ?
- **Q3 — Modèle économique.** Qu'est-ce qui est gratuit ? Aujourd'hui le bail et les quittances sont payants (SOLO et plus). Le bloc « Prix » de la page d'accueil en dépend.
- **Q4 — Domaine de l'API.** Peux-tu mettre l'API sur `api.bailio.fr` (domaine personnalisé Railway) ?
  - **Si oui :** cookie `HttpOnly; SameSite=Lax` propre pour le brouillon.
  - **Si non :** token dans le navigateur + lien magique.
- **Q5 — Pages indexées.** Le site devient une seule page. Il faut décider du sort de :
  - Tarifs, Propriétaires, FAQ, Contact, À propos, Presse ;
  - les 13 articles du guide ;
  - `/search` et les 20 pages `/location/:ville`.
  Ma recommandation : garder le guide (futurs contenus « modèle de… »), rediriger en 301 les pages d'information vers les ancres de la page d'accueil, masquer la marketplace (404).
- **Q6 — Données en production.** Y a-t-il de vrais propriétaires, baux et paiements en base ? Ça décide du script de reprise.
- **Q7 — IA et données.** Tu valides l'envoi des documents à l'API Anthropic (hors UE, DPA et clauses contractuelles types), avec mention dans la politique de confidentialité ? Et le choix du modèle se fera-t-il sur un test de 50 documents (Opus 5 par défaut) ?
- **Q8 — Mentions légales.** Quelle est la structure juridique réelle et son adresse (le footer affiche « Bailio SAS · 75011 Paris ») ?
- **Q9 — Emails.** Le domaine d'envoi est-il vérifié (SPF, DKIM) ? Qui gère le DNS de bailio.fr (Ionos ? Cloudflare ?) ? Ça décide entre Resend Inbound et Cloudflare pour `docs.bailio.fr`.
- **Q10 — Espace locataire.** Pour le lien de demande d'attestation d'assurance, le locataire répond-il par email (**ma proposition** en V1, sans compte) ou par un lien de dépôt sécurisé à usage unique ?
- **Q11 — Titre de la page d'accueil.** Je garde « Vos locations, sans la paperasse. » Autre option : « Bailio s'occupe de la paperasse. Vous gardez la main. » À choisir en phase 9.
