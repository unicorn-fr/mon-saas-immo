# CODEBASE — Index de Référence Rapide

## Stack Technique

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Zustand (stores)
- **Backend**: Express + Prisma ORM + PostgreSQL + TypeScript
- **Auth**: JWT + Google OAuth + Email verification + 2FA TOTP
- **Services**: Cloudinary (images), Firebase (auth), Stripe (paiements), Resend (emails)

---

## Design System — "Maison" (Light Editorial)

**Source unique**: `client/src/constants/bailio-tokens.ts` (BAI object)

### Règles clés
- **Palettes**:
  - Backgrounds: `#fafaf8` (page), `#ffffff` (surface), `#f4f2ee` (muted), `#f8f7f4` (inputBg)
  - Text: `#0d0c0a` (ink), `#5a5754` (inkMid), `#9e9b96` (inkFaint)
  - Night (sidebar): `#1a1a2e` + hover/border variants
  - Owner (bleu): `#1a3270` / light `#eaf0fb` / border `#b8ccf0`
  - Tenant (vert): `#1b5e3b` / light `#edf7f2` / border `#9fd4ba`
  - Caramel (accent): `#c4976a` / light `#fdf5ec`
  - Danger/Warning/Info: rouge/orange/bleu sémantiques

- **Typographie**: Cormorant Garamond (display), DM Sans (body)
- **Espacements**: Fluides clamp() + constants (8-48px)
- **Border radius**: 8px (standard), 4px (petit), 12px (grand)
- **Ombres**: sm/md/lg avec opacité 0.04-0.10
- **Transitions**: `all 0.18s ease`

### Pattern CSS
- **Pas de Tailwind pour couleurs**: tout via `style={{}}` inline
- **Tailwind pour**: layout (flex, gap, p-4, etc), positionnement, responsive
- **Pas de**: dark: classes, backdrop-filter, gradients bleu/purple, glass (sauf exceptions)
- **Boutons**: `.btn-primary` (night bg) / `.btn-secondary` (white + border `#e4e1db`)
- **Inputs**: bg `#f8f7f4`, border `#e4e1db`, sans ring
- **Cards**: white, border 1px `#e4e1db`, radius 12px, shadow md

---

## Index CLIENT

### Pages (client/src/pages/)

| Chemin | Rôle |
|--------|------|
| Home.tsx | Landing page publique |
| WaitlistPage.tsx | Waitlist inscription |
| Login.tsx | Connexion utilisateur |
| Register.tsx | Inscription + rôle sélection |
| ForgotPassword.tsx | Récupération mot de passe |
| ResetPassword.tsx | Réinitialisation token |
| VerifyEmail.tsx | Vérification email |
| VerifyMagicLink.tsx | OAuth magic link |
| SelectRole.tsx | Choix rôle post-OAuth |
| NotFound.tsx | Erreur 404 |
| Pricing.tsx | Tarification plans |
| public/SearchProperties.tsx | Recherche annonces publique |
| public/PropertyDetailsPublic.tsx | Détail propriété publique |
| owner/Dashboard.tsx | Tableau de bord propriétaire |
| owner/MyProperties.tsx | Liste propriétés |
| owner/CreatePropertyWizard.tsx | Wizard création annonce |
| owner/EditProperty.tsx | Edition propriété |
| owner/PropertyDetails.tsx | Détail propriété propriétaire |
| owner/BookingManagement.tsx | Gestion visites |
| owner/ApplicationManagement.tsx | Gestion candidatures |
| owner/TenantProfile.tsx | Profil candidat détail |
| owner/Settings.tsx | Paramètres propriétaire |
| owner/Rentabilite.tsx | Analyses rentabilité |
| tenant/TenantDashboard.tsx | Tableau de bord locataire |
| tenant/MyBookings.tsx | Mes visites |
| tenant/MyApplications.tsx | Mes candidatures |
| tenant/Favorites.tsx | Favoris |
| tenant/DossierLocatif.tsx | Dossier IA scanner |
| tenant/DossierShareManager.tsx | Partages dossier |
| tenant/PrivacyCenter.tsx | Contrôle données |
| tenant/Settings.tsx | Paramètres locataire |
| contracts/ContractsList.tsx | Liste baux |
| contracts/CreateContract.tsx | Wizard création bail |
| contracts/ContractDetails.tsx | Détail bail + signatures |
| contracts/EtatDesLieux.tsx | État des lieux |
| Messages.tsx | Chat conversations |
| Notifications.tsx | Toutes notifications |
| Profile.tsx | Profil utilisateur |
| admin/AdminDashboard.tsx | Dashboard admin |
| admin/UsersManagement.tsx | Gestion utilisateurs |
| admin/WaitlistAdmin.tsx | Gestion waitlist |
| legal/MentionsLegales.tsx | Mentions légales |
| legal/CGU.tsx | Conditions générales |
| legal/PolitiqueConfidentialite.tsx | Politique confidentialité |
| legal/Cookies.tsx | Politique cookies |
| info/FAQ.tsx | FAQ |
| info/Contact.tsx | Formulaire contact |
| info/Support.tsx | Centre support |
| info/Presse.tsx | Kit presse |
| super-admin/SuperAdminLayout.tsx | Layout Cerveau Central |
| super-admin/SADashboard.tsx | Dashboard super-admin |
| super-admin/SAUsers.tsx | Gestion tous utilisateurs |
| super-admin/SAUserDetail.tsx | Détail utilisateur |
| super-admin/SADossiers.tsx | Monitoring dossiers IA |
| super-admin/SAContracts.tsx | Monitoring contrats |
| super-admin/SAMessages.tsx | Monitoring messages |
| super-admin/SADatabase.tsx | DB explorer read-only |
| super-admin/SAProperties.tsx | Monitoring annonces |
| super-admin/SAAuditLogs.tsx | Audit trail sécurité |

### Components (client/src/components/)

| Chemin | Rôle |
|--------|------|
| App.tsx | Root router principal |
| main.tsx | Entrée Vite |
| Layout.tsx | Wrapper pages (header/sidebar/footer) |
| Header.tsx | Barre navigation |
| Footer.tsx | Pied de page |
| ScrollToTop.tsx | Auto-scroll au changement route |
| BailioLogo.tsx | Logo branding |
| BugReportButton.tsx | Bouton signalement bugs |
| auth/ProtectedRoute.tsx | Middleware auth routes |
| auth/LaunchGuard.tsx | Blocage mode waitlist |
| auth/SiteGate.tsx | Verrou password site |
| auth/GoogleSignInButton.tsx | Sign-in OAuth |
| auth/PhoneVerification.tsx | SMS 2FA |
| auth/ChangePasswordModal.tsx | Modal changement password |
| booking/VisitSlotsManager.tsx | Gestion créneaux visites |
| booking/TimeSlotPicker.tsx | Sélecteur horaire |
| booking/BookingModal.tsx | Réservation visite |
| booking/CancelBookingModal.tsx | Annulation visite |
| booking/BookingCard.tsx | Card visite |
| booking/Calendar.tsx | Calendrier visites |
| booking/CalendarShareModal.tsx | Invitation partage calendrier |
| property/SearchFilters.tsx | Filtres recherche |
| property/PropertyCard.tsx | Card annonce |
| property/PropertyMap.tsx | Carte propriété |
| property/SearchMap.tsx | Carte recherche |
| property/ContactModal.tsx | Modal contact propriétaire |
| property/StatusChangeModal.tsx | Modal changement statut |
| property/ImageUpload.tsx | Upload images annonce |
| property/AvailabilityScheduler.tsx | Planner disponibilités |
| contract/ContractPDF.tsx | Rendu PDF bail React-PDF |
| contract/EDLPDF.tsx | Rendu PDF EDL |
| contract/SignaturePad.tsx | Pad signature digitale |
| contract/DocumentUpload.tsx | Upload documents contrat |
| message/ChatWindow.tsx | Fenêtre chat |
| message/ConversationList.tsx | Liste conversations |
| message/MessageInput.tsx | Saisie message |
| message/MessageBubble.tsx | Bulle message |
| message/ContractActivityFeed.tsx | Fil activité contrat |
| message/ProposeRdvModal.tsx | Proposition RDV |
| message/CreateLeaseModal.tsx | Création bail depuis chat |
| document/DocumentChecklist.tsx | Checklist documents |
| document/DocumentViewerModal.tsx | Visualiseur document |
| document/WatermarkedViewer.tsx | Watermark anti-vol |
| document/DossierReviewModal.tsx | Review dossier propriétaire |
| dossier/DossierWizard.tsx | Wizard scanner IA |
| dossier/KanbanBoard.tsx | Kanban dossier par statut |
| dossier/TenantDossierModal.tsx | Modal view dossier |
| dossier/SignalBreakdown.tsx | Breakdown extraction IA |
| application/PreQualificationModal.tsx | Score matching |
| application/SelectionCriteriaForm.tsx | Critères pré-qualification |
| notification/NotificationBell.tsx | Bell notifications |
| security/TrustBadge.tsx | Badge confiance utilisateur |
| security/ReportUserModal.tsx | Signalement fraude |
| layout/OwnerSidebar.tsx | Sidebar propriétaire |
| layout/TenantSidebar.tsx | Sidebar locataire |
| layout/MobileBottomNav.tsx | Nav mobile bottom |
| onboarding/OnboardingModal.tsx | Modal onboarding |
| ui/KPICard.tsx | Card KPI dashboard |
| ui/StatusBadge.tsx | Badge statut |
| ui/Skeleton.tsx | Loader squelette |
| pwa/InstallPWA.tsx | Bouton install PWA |
| pwa/UpdatePWA.tsx | Notification update PWA |
| waitlist/HowItWorksSection.tsx | Section "comment ça marche" |
| waitlist/FounderSection.tsx | Section fondateurs |

### Hooks (client/src/hooks/)

| Chemin | Rôle |
|--------|------|
| useAuth.ts | Context auth utilisateur |
| useProperties.ts | Fetch/query properties |
| useBookings.ts | Fetch/query visites |
| useMessages.ts | Fetch/query messages temps réel |
| useNotifications.ts | Fetch/query notifications |
| useMediaQuery.ts | Hook responsive breakpoints |
| useWindowWidth.ts | Hook largueur fenêtre |
| useReveal.ts | Hook scroll reveal animation |

### Stores (client/src/store/)

| Chemin | Rôle |
|--------|------|
| themeStore.ts | État dark/light mode |
| (Zustand) | Gestion état global |

### Services (client/src/services/)

| Chemin | Rôle |
|--------|------|
| (API calls) | Appels backend HTTP |

### Utils (client/src/utils/)

| Chemin | Rôle |
|--------|------|
| matchingEngine.ts | Scoring candidatures |
| DocumentIntelligence.ts | Extraction documents IA |
| IdentityMatcher.ts | Matching identité |
| UniversalScraper.ts | Scraping données document |
| TemporalMapper.ts | Parsing dates documents |
| validateDocumentIntegrity.ts | Validation intégrité doc |
| fileUtils.ts | Utilitaires fichiers |
| progressState.ts | State scan IA |
| celebrate.ts | Animations célébration |
| registerServiceWorker.ts | SW PWA |

### Types (client/src/types/)

| Chemin | Rôle |
|--------|------|
| auth.types.ts | Types User/Auth |
| property.types.ts | Types Property |
| booking.types.ts | Types Booking/Visit |
| contract.types.ts | Types Contract |
| document.types.ts | Types Document |
| notification.types.ts | Types Notification |
| message.types.ts | Types Message/Chat |
| application.types.ts | Types Application |
| admin.types.ts | Types Admin |

### Data (client/src/data/)

| Chemin | Rôle |
|--------|------|
| bailTemplate.ts | Template bail ALUR interpolation |
| cautionnementTemplate.ts | Template cautionnement solidaire |
| etatDesLieuxTemplate.ts | Template EDL rooms/éléments |
| loiAlurClauses.ts | Clauses légales ALUR |

### Constants (client/src/constants/)

| Chemin | Rôle |
|--------|------|
| bailio-tokens.ts | Design system tokens BAI |

### Config (client/src/config/)

| Chemin | Rôle |
|--------|------|
| firebase.ts | Init Firebase |

---

## Index SERVER

### Controllers (server/src/controllers/)

| Chemin | Rôle |
|--------|------|
| auth.controller.ts | Endpoints auth login/register |
| property.controller.ts | CRUD propriétés |
| booking.controller.ts | Endpoints visites |
| message.controller.ts | Endpoints messages chat |
| notification.controller.ts | Endpoints notifications |
| contract.controller.ts | CRUD contrats + signatures |
| document.controller.ts | CRUD documents contrat |
| dossier.controller.ts | Endpoints dossier IA scanner |
| application.controller.ts | Endpoints candidatures |
| favorite.controller.ts | Endpoints favoris |
| upload.controller.ts | Upload fichiers |
| admin.controller.ts | Endpoints admin dashboard |
| superAdmin.controller.ts | Endpoints Cerveau Central |
| privacy.controller.ts | Endpoints contrôle données |
| totp.controller.ts | Endpoints 2FA TOTP |
| waitlist.controller.ts | Endpoints waitlist |

### Services (server/src/services/)

| Chemin | Rôle |
|--------|------|
| auth.service.ts | Logique auth JWT/OAuth |
| property.service.ts | Logique métier propriétés |
| booking.service.ts | Logique métier visites |
| message.service.ts | Logique métier messages |
| notification.service.ts | Logique notifications |
| contract.service.ts | Logique contrats + PDF |
| document.service.ts | Logique documents |
| dossier.service.ts | Logique extraction IA |
| application.service.ts | Logique matching candidatures |
| favorite.service.ts | Logique favoris |
| admin.service.ts | Logique admin |
| superAdmin.service.ts | Logique super-admin |
| privacy.service.ts | Logique RGPD/données |
| stripe.service.ts | Intégration Stripe |
| waitlist.service.ts | Logique waitlist |
| totp.service.ts | Logique 2FA TOTP |
| cleanup.service.ts | Nettoyage données expirées |
| dvf.service.ts | Intégration API DVF |
| watermark.service.ts | Watermark documents |

### Routes (server/src/routes/)

| Chemin | Rôle |
|--------|------|
| index.ts | Registre central routes |
| auth.routes.ts | Routes /api/v1/auth |
| property.routes.ts | Routes /api/v1/properties |
| booking.routes.ts | Routes /api/v1/bookings |
| message.routes.ts | Routes /api/v1/messages |
| notification.routes.ts | Routes /api/v1/notifications |
| contract.routes.ts | Routes /api/v1/contracts |
| document.routes.ts | Routes /api/v1/documents |
| dossier.routes.ts | Routes /api/v1/dossier |
| application.routes.ts | Routes /api/v1/applications |
| favorite.routes.ts | Routes /api/v1/favorites |
| upload.routes.ts | Routes /api/v1/upload (multer) |
| admin.routes.ts | Routes /api/v1/admin |
| superAdmin.routes.ts | Routes /api/v1/super-admin |
| privacy.routes.ts | Routes /api/v1/privacy |
| stripe.routes.ts | Routes /api/v1/stripe (webhooks) |
| payment.routes.ts | Routes /api/v1/payments |
| dashboard.routes.ts | Routes /api/v1/dashboard |
| market.routes.ts | Routes /api/v1/market (public) |
| bugs.routes.ts | Routes /api/v1/bugs (signalement) |
| waitlist.routes.ts | Routes /api/v1/waitlist |

### Middlewares (server/src/middlewares/)

| Chemin | Rôle |
|--------|------|
| auth.middleware.ts | Vérification JWT + user |
| security.middleware.ts | CORS/CSP/XSS/headers |
| rateLimiter.middleware.ts | Rate limiter 500 req/window |
| error.middleware.ts | Centralized error handler |
| turnstile.middleware.ts | Cloudflare Turnstile |
| planGate.middleware.ts | Gating par plan Stripe |
| launchMode.middleware.ts | Blocage waitlist mode |

### Utils (server/src/utils/)

| Chemin | Rôle |
|--------|------|
| email.util.ts | Envoi emails Resend |
| jwt.util.ts | Génération/vérif JWT |
| password.util.ts | Hash bcrypt/vérification |
| token.util.ts | Tokens vérification/reset |
| firebase.util.ts | Init Firebase Admin |
| cloudinary.util.ts | Upload images Cloudinary |
| upload.util.ts | Config multer |
| validation.util.ts | Zod validation schemas |
| apiResponse.ts | Wrapper réponses API |
| cache.ts | Cache utility |
| checkEnv.ts | Vérification env vars |
| emailTemplates.ts | Templates HTML emails |
| waitlistEmails.ts | Templates emails waitlist |

### Config (server/src/config/)

| Chemin | Rôle |
|--------|------|
| database.ts | Init Prisma client |
| env.ts | Parsing .env variables |

### Libs (server/src/lib/)

| Chemin | Rôle |
|--------|------|
| stripe.ts | Init Stripe SDK |
| sseManager.ts | Server-Sent Events manager |

### Templates (server/src/templates/)

| Chemin | Rôle |
|--------|------|
| receiptPDF.ts | Génération PDF quittance |

### Jobs (server/src/jobs/)

| Chemin | Rôle |
|--------|------|
| generateMonthlyPayments.ts | Job cron création loyers |

### Prisma (server/prisma/)

| Chemin | Rôle |
|--------|------|
| schema.prisma | Définition modèles DB |
| migrations/ | Historique migrations |

### Main (server/src/)

| Chemin | Rôle |
|--------|------|
| app.ts | Express app setup + routes |
| server.ts | Démarrage serveur |

---

## Routes API Principales

### Auth (`/api/v1/auth`)
- `POST /login` — Connexion email/password
- `POST /register` — Inscription
- `POST /verify-email` — Vérification email
- `POST /forgot-password` — Réinitialisation
- `POST /reset-password` — Changement password
- `POST /auth/google` — OAuth Google
- `POST /auth/verify` — Vérification magic link
- `POST /refresh-token` — JWT refresh

### Properties (`/api/v1/properties`)
- `GET /` — Liste publique (AVAILABLE)
- `GET /:id` — Détail propriété
- `POST /` — Créer (OWNER)
- `PUT /:id` — Modifier (OWNER)
- `DELETE /:id` — Supprimer (OWNER)
- `POST /:id/publish` — Publier (OWNER)
- `POST /:id/images` — Upload images
- `GET /owner/me` — Mes propriétés (OWNER)
- `POST /:id/availability-slots` — Créneaux visites
- `POST /:id/date-overrides` — Blocages/extras

### Bookings (`/api/v1/bookings`)
- `POST /` — Réserver visite (TENANT)
- `GET /` — Mes visites
- `PUT /:id` — Modifier visite
- `DELETE /:id` — Annuler visite
- `POST /:id/confirm` — Confirmer (OWNER)

### Contracts (`/api/v1/contracts`)
- `GET /` — Liste contrats
- `GET /:id` — Détail contrat
- `POST /` — Créer contrat (OWNER)
- `PUT /:id` — Modifier contrat
- `POST /:id/sign` — Signer (owner/tenant)
- `POST /:id/pdf` — Générer PDF
- `POST /:id/etat-des-lieux` — Submit EDL

### Messages (`/api/v1/messages`)
- `GET /conversations` — Mes conversations
- `GET /conversations/:id/messages` — Messages conversation
- `POST /` — Envoyer message
- `PUT /:id/read` — Marquer lu

### Dossier (`/api/v1/dossier`)
- `POST /upload` — Upload document IA
- `POST /process` — Extraction IA
- `GET /` — Voir dossier
- `POST /share` — Partager dossier
- `GET /shares` — Mes partages

### Applications (`/api/v1/applications`)
- `POST /` — Soumettre candidature (TENANT)
- `GET /` — Mes candidatures
- `GET /:propertyId` — Candidatures annonce (OWNER)
- `PUT /:id/status` — Changer statut (OWNER)

### Documents (`/api/v1/documents`)
- `POST /:contractId` — Upload document contrat
- `GET /:id` — Voir document
- `DELETE /:id` — Supprimer document

### Admin (`/api/v1/admin`)
- `GET /users` — Tous utilisateurs (ADMIN)
- `PUT /users/:id` — Modifier user (ADMIN)
- `DELETE /users/:id` — Supprimer user (ADMIN)
- `GET /properties` — Modération annonces
- `PUT /properties/:id/status` — Approuver/rejeter

### Super-Admin (`/api/v1/super-admin`)
- `GET /dashboard` — Stats globales (SUPER_ADMIN)
- `GET /users` — Tous utilisateurs
- `GET /users/:id` — Détail user
- `GET /database` — DB explorer read-only
- `GET /audit-logs` — Audit trail
- `PUT /users/:id/role` — Changer rôle
- `DELETE /users/:id` — Supprimer user

### Stripe (`/api/v1/stripe`)
- `POST /webhook` — Webhook raw body (pas de auth)
- `POST /create-subscription` — Créer abonnement
- `GET /subscription` — Voir abonnement
- `POST /cancel-subscription` — Annuler abonnement

### Waitlist (`/api/v1/waitlist`)
- `POST /join` — S'inscrire waitlist
- `GET /position` — Position waitlist

---

## Schéma DB (Prisma Models)

### User
Fields: id, email, password (hashed), googleId, role (TENANT/OWNER/ADMIN/SUPER_ADMIN), firstName, lastName, phone, avatar, bio, birthDate, birthCity, nationality, nationalNumber, documentNumber, documentExpiry, profileMeta (JSON), emailVerified, emailVerifiedAt, phoneVerified, phoneVerifiedAt, tenantScore, trustScore, isVerifiedOwner, reportCount, isBanned, totpSecret, totpEnabled, timestamps

Relations: ownedProperties, bookings, sentMessages, receivedMessages, tenantContracts, ownerContracts, favorites, notifications, refreshTokens, conversations, verificationTokens, uploadedDocuments, tenantDocuments, applications, dossierShares, fraudReports, subscription

### Property
Fields: id, ownerId, title, description, type, status (DRAFT/PENDING_REVIEW/AVAILABLE/OCCUPIED/RESERVED), address, city, postalCode, country, latitude, longitude, bedrooms, bathrooms, surface, floor, totalFloors, furnished, price, charges, deposit, images[], virtualTour, amenities[], availableFrom, visitDuration, ownerIdDocument, propertyProofDocument, reviewNote, selectionCriteria (JSON), views, contactCount, timestamps, publishedAt

Relations: owner, bookings, conversations, favorites, contracts, visitAvailabilitySlots, visitDateOverrides, applications, calendarInvites

### Contract
Fields: id, propertyId, tenantId, ownerId, status (DRAFT/SENT/SIGNED_OWNER/SIGNED_TENANT/COMPLETED/ACTIVE/EXPIRED/TERMINATED/CANCELLED), startDate, endDate, monthlyRent, charges, deposit, content (JSON wizard form), customClauses (JSON), pdfUrl, ownerSignature (base64), tenantSignature (base64), signedByOwner, signedByTenant, signedAt, terms, timestamps

Relations: property, tenant, owner, documents, payments

### ContractDocument
Fields: id, contractId, uploadedById, category, status (PENDING/UPLOADED/VALIDATED/REJECTED), fileName, fileUrl, fileSize, mimeType, rejectionReason, fromDossier (bool), timestamps

Relations: contract, uploadedBy

### TenantDocument
Fields: id, userId, category (IDENTITE/SITUATION_PRO/REVENUS/HISTORIQUE/GARANTIES), docType, status, fileName, fileUrl, fileSize, mimeType, note, expiresAt, timestamps

Relations: user

### Application
Fields: id, propertyId, tenantId, status (PENDING/APPROVED/REJECTED/WITHDRAWN), score (0-100), matchDetails (JSON), coverLetter, hasGuarantor, guarantorType, timestamps

Relations: property, tenant

### DossierShare
Fields: id, tenantId, ownerId, propertyId (optional), expiresAt, revokedAt, timestamps

Relations: tenant (grantedBy), owner (receivedBy)

### Booking
Fields: id, propertyId, tenantId, visitDate, visitTime, duration, status (PENDING/CONFIRMED/CANCELLED/COMPLETED), tenantNotes, ownerNotes, confirmedAt, cancelledAt, cancellationReason, timestamps

Relations: property, tenant

### Message
Fields: id, conversationId, senderId, receiverId, content, attachments[], isRead, readAt, timestamps

Relations: conversation, sender, receiver

### Conversation
Fields: id, user1Id, user2Id, propertyId (optional), lastMessageAt, lastMessageText, unreadCountUser1, unreadCountUser2, timestamps

Relations: user1, user2, property, messages

### Notification
Fields: id, userId, type, title, message, isRead, readAt, metadata (JSON), actionUrl, timestamps

Relations: user

### AuditLog
Fields: id, actorId, actorEmail, action, resource, resourceId, metadata (JSON), severity (INFO/WARNING/CRITICAL), timestamps

### Subscription (Stripe)
Fields: id, userId (unique), stripeCustomerId, stripeSubscriptionId, plan (FREE/PRO/EXPERT), billingCycle (MONTHLY/ANNUAL), status (TRIALING/ACTIVE/PAST_DUE/CANCELED/UNPAID), currentPeriodEnd, cancelAtPeriodEnd, trialEndsAt, timestamps

Relations: user

### Payment
Fields: id, contractId, amount, charges, dueDate, paidDate, status (PENDING/PAID/LATE/WAIVED), month, year, receiptCloudinaryId, notes, timestamps

Relations: contract

### WaitlistEntry
Fields: id, email (unique), firstName, position, isEarlyAccess, notifiedAt, timestamps

### VisitAvailabilitySlot
Fields: id, propertyId, dayOfWeek (0-6), startTime, endTime, timestamps

Relations: property

### VisitDateOverride
Fields: id, propertyId, date, type (BLOCKED/EXTRA), startTime (si EXTRA), endTime (si EXTRA), timestamps

Relations: property

### CalendarInvite
Fields: id, propertyId, ownerId, tenantId, timestamps

Relations: property, owner, tenant

### FraudReport
Fields: id, reporterId, targetId, reason, details, status (PENDING/REVIEWED/DISMISSED/ACTIONED), reviewNote, reviewedAt, reviewedBy, timestamps

Relations: reporter, target

### RefreshToken / VerificationToken
Fields: id, token (unique), userId, (type, expiresAt), timestamps

Relations: user

---

## Conventions & Patterns Clés

### Frontend
- **Stores**: Zustand en `client/src/store/`
- **Services API**: Appels centralisés
- **Hooks personnalisés**: Réutilisation logique
- **Design**: Tokens BAI + style inline pour couleurs
- **Layout**: Pages wrappées dans `<Layout>` pour header/sidebar
- **Forms**: Zod validation + React Hook Form

### Backend
- **Services**: Logique métier en `server/src/services/`
- **Controllers**: Endpoints + validation en `server/src/controllers/`
- **Routes**: Groupées par domaine en `server/src/routes/`
- **Auth**: JWT + middleware `authenticate()` + `authorize(roles)`
- **Prisma**: Pooling connection, migrations avec `prisma db push` (env non-interactive)
- **Email**: Templates Resend + variables interpolation
- **Upload**: Multer + Cloudinary

### Security
- **Rate limiting**: 500 req/window (auth endpoints exclus)
- **CORS**: Configuré strictement
- **JWT expiry**: 15m access + refresh token
- **Password**: Bcrypt 10 rounds
- **2FA TOTP**: Google Authenticator compatible
- **Audit logs**: AuditLog model pour super-admin
- **Super-admin**: Rôle SUPER_ADMIN avec accès DB explorer read-only

### Data Deletion
- **Cascade**: User → ownedProperties, tenantDocuments, etc
- **Auto-deletion**: TenantDocument expiresAt + cleanup job
- **RGPD**: Privacy routes pour data export/deletion

---

Généré: 2026-04-20 | Stack: Express+Prisma Backend, React+Vite Frontend
