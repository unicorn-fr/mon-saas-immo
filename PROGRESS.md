# PROGRESS.md — Bailio (Plateforme Gestion Locative)
> RAM externe du projet. À lire en PRIORITÉ au démarrage de chaque session.
> Dernière mise à jour : 2026-04-22

---

## 🎯 OBJECTIF ACTUEL
Stabilisation du système de réservation de visites (booking flow complet).

---

## ✅ DONE (fonctionnalités stables)

### Auth & Sécurité
- JWT + refresh tokens, Google OAuth, email verification, reset password
- TOTP 2FA, CORS, Helmet CSP, rate limiting, input sanitization
- WaitlistPage bouton secret → `/login?pass=...`

### Propriétés
- CRUD complet avec wizard 8 étapes :
  Type → Adresse → Descriptif → DPE → Prix → **Critères** → Créneaux → Médias
- Wizard publie automatiquement (DRAFT → AVAILABLE) via `publishProperty()` en fin de submit
- EditProperty avec AvailabilityScheduler + SelectionCriteriaForm (critères + créneaux modifiables)
- Fix plans : FREE=3, PRO=50, EXPERT=∞ (était inversé)
- Bouton "Modifier" dans MyProperties + PropertyDetails → `/properties/:id/edit`

### Candidatures
- Candidatures toujours créées PENDING (propriétaire décide manuellement)
- Repostuler autorisé après REJECTED ou WITHDRAWN (upsert)
- Bouton "Repostuler" dans MyApplications.tsx
- Bouton "Réserver une visite" → `/my-bookings` (après APPROVED)
- Auto-création CalendarInvite quand propriétaire approuve une candidature

### Booking / Visites
- Gate : APPROVED application OR CalendarInvite (l'un suffit)
- MyBookings : charge invites explicites + synthetic invites pour candidatures APPROVED
- MobileBottomNav z-index 1010 > Leaflet 1000
- Controller : 403 sur accès refusé, 400 sur slot invalide/indisponible

### Design System "Maison" (Bailio tokens)
- Tokens centralisés : `client/src/constants/bailio-tokens.ts` (BAI.*)
- Pattern : inline `style={{}}` couleurs + Tailwind layout uniquement
- Responsive mobile-first, clamp(), sidebar 220px desktop / 64px tablet / drawer mobile
- MobileBottomNav iOS-style fixé en bas

### Autres (stable)
- Contrats dual-signature + PDF, état des lieux room-by-room
- Dossier Locatif IA OCR v5 (seuil 90%, ExtractedData v7, MrzData v2)
- Super Admin (dashboard, users, DB explorer, audit logs)
- Messaging 1-to-1 avec unread counts
- Stripe billing (webhooks, subscriptions)

---

## 📋 BACKLOG (priorités décroissantes)

### P0 — Validation fonctionnelle
- [ ] Tester flux complet : création bien → candidature → approbation → booking
- [ ] Vérifier créneaux du wizard sauvegardés en DB

### P1 — Fonctionnalités manquantes
- [ ] Notifications email (service de delivery non configuré, SMTP/Resend absent)
- [ ] Page publique détail bien pour locataires (route /property/:id côté tenant)
- [ ] DVF service branché aux routes (service existe, pas de route)
- [ ] Watermark sur documents sensibles

### P2 — Polish
- [ ] Tests E2E Playwright flux critiques (candidature, booking)
- [ ] Page 404 stylisée
- [ ] Optimisation images lazy load

---

## 🚧 BLOCAGES CONNUS
- Email delivery : pas de SMTP/Resend configuré dans les services
- CalendarInvite routes API : model Prisma OK, routes potentiellement incomplètes
- DVF service défini dans services/ mais absent des routes montées

---

## 📁 FICHIERS CLÉS À CONNAÎTRE
```
server/src/lib/stripe.ts              — PLANS config (FREE/PRO/EXPERT)
server/src/services/booking.service.ts — Gate booking (APPROVED app OU invite)
server/src/services/application.service.ts — updateStatus auto-crée CalendarInvite
server/src/middlewares/planGate.middleware.ts — checkPropertyLimit

client/src/constants/bailio-tokens.ts — Design system (BAI.*)
client/src/pages/owner/CreatePropertyWizard.tsx — 8 étapes + publish auto
client/src/pages/owner/EditProperty.tsx — Modify bien (critères + créneaux)
client/src/pages/tenant/MyApplications.tsx — Repostuler, bouton visite
client/src/pages/tenant/MyBookings.tsx — InvitePanel + synthetic invites
client/src/components/layout/MobileBottomNav.tsx — z-[1010]
```
