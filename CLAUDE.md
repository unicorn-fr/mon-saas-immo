# CLAUDE.md — Conventions & Mémoire de Décision
> Règles du projet Bailio. À respecter sans exception.

---

## Stack technique

| Couche | Techno |
|--------|--------|
| Frontend | React 18 + Vite + TypeScript strict |
| State | Zustand (stores dans `client/src/store/`) |
| Styling | Tailwind (layout) + inline `style={{}}` (couleurs) |
| Backend | Express + TypeScript |
| ORM | Prisma + PostgreSQL |
| Auth | JWT + refresh tokens, Google OAuth, TOTP 2FA |
| Storage | Cloudinary (images/docs), multer |
| Billing | Stripe (FREE/PRO/EXPERT) |
| Deploy | Railway (`railway:start` = db push + seed + start) |

---

## Design System "Maison" — RÈGLES STRICTES

### Pattern de couleurs
```tsx
// ✅ CORRECT — couleurs via BAI tokens inline
import { BAI } from '../../constants/bailio-tokens'
<div style={{ background: BAI.bgSurface, color: BAI.ink }}>

// ❌ INTERDIT — classes Tailwind pour les couleurs
<div className="bg-white text-gray-900">
```

### Tokens principaux (BAI.*)
- `BAI.bgBase` = `#fafaf8` (fond page)
- `BAI.bgSurface` = `#ffffff` (cartes)
- `BAI.bgMuted` = `#f4f2ee`
- `BAI.ink` = `#0d0c0a` (texte principal)
- `BAI.inkMid` = `#5a5754`
- `BAI.inkFaint` = `#9e9b96`
- `BAI.border` = `#e4e1db`
- `BAI.caramel` = `#c4976a` (accent)
- `BAI.night` = `#1a1a2e` (CTA principal, sidebar)
- `BAI.owner` = `#1a3270` / `BAI.ownerLight` / `BAI.ownerBorder`
- `BAI.tenant` = `#1b5e3b` / `BAI.tenantLight` / `BAI.tenantBorder`
- `BAI.error` = `#9b1c1c` / `BAI.errorLight` = `#fef2f2`
- `BAI.fontDisplay` = `'Cormorant Garamond', Georgia, serif`
- `BAI.fontBody` = `'DM Sans', system-ui, sans-serif`

### Composants interdits
- ❌ `backdrop-filter` / glassmorphism
- ❌ `dark:` classes Tailwind
- ❌ Gradients bleu/violet, blobs, neon

### Pattern page header
```tsx
<p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700,
  letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel }}>
  Overline
</p>
<h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(28px,5vw,40px)',
  fontWeight: 700, fontStyle: 'italic', color: BAI.ink }}>
  Titre
</h1>
```

---

## Commandes bash essentielles

```bash
# Développement
npm run dev                    # Lance client (5173) + serveur (5000) en parallèle

# Base de données (NON-INTERACTIVE — jamais migrate dev)
npx prisma db push             # ✅ Applique le schema sans migration interactive
npx prisma studio              # Interface DB

# Build
npm run build                  # Compile server TS + client Vite + db push

# Seed
npm run db:seed                # Seed seul
npm run db:reset               # Reset complet + seed
```

---

## Patterns backend

### Route standard
```typescript
// server/src/routes/xxx.routes.ts
router.post('/', authenticate, authorize('OWNER'), controller.method.bind(controller))
// authenticate = vérifie JWT
// authorize('ROLE') = vérifie le rôle
```

### Middleware plan
```typescript
// Vérifie limite de biens selon plan
router.post('/', authenticate, checkPropertyLimit, createProperty)
```

### Réponse API standard
```typescript
return res.status(200).json({ success: true, data: { ... } })
return res.status(400).json({ success: false, message: '...' })
```

### Erreurs à gérer explicitement dans les controllers
- `Property not found` → 404
- `Unauthorized` → 403
- `already booked` / `not available` → 400

---

## Patterns frontend

### Service API call
```typescript
// client/src/services/xxx.service.ts
const res = await apiClient.get('/route')
return res.data.data as Type
```

### Store Zustand
```typescript
// client/src/store/xxxStore.ts
export const useXxxStore = create<XxxStore>((set, get) => ({
  isLoading: false,
  error: null,
  action: async () => {
    set({ isLoading: true, error: null })
    try { ... set({ isLoading: false }) }
    catch (e) { set({ error: msg, isLoading: false }); throw e }
  }
}))
```

### Responsive
- Breakpoints : `BAI.bpMd` = 768px, `BAI.bpLg` = 1024px
- Mobile-first : `clamp(minPx, vwVal, maxPx)` pour font-size et padding
- Sidebar tablet : `isTabletCompact = windowWidth >= BAI.bpMd && windowWidth < BAI.bpLg` → width 64px compact

---

## Mémoire de Décision (NE PAS RÉPÉTER)

| Décision | Contexte | Choix fait |
|----------|----------|------------|
| Plans billing | PRO avait moins de biens que FREE | FREE=3, PRO=50, EXPERT=∞ |
| Gate booking | Trop restrictif (CalendarInvite obligatoire) | APPROVED app OU invite suffit |
| Auto-approve candidatures | Créait des REJECTED automatiques | Supprimé — toujours PENDING |
| Repostuler après REJECTED | Était bloqué | Autorisé (upsert) |
| Publication bien | Wizard créait en DRAFT sans publier | publishProperty() appelé après createProperty() |
| MobileBottomNav z-index | Map Leaflet (z-1000) couvrait le nav | Nav → z-[1010] |
| BAI token migration | Agents tronquaient les noms | Batch perl -i -pe pour substitution |
| prisma migrate dev | Interactif, bloque en CI | Toujours `prisma db push` |

---

## Structure des rôles

| Rôle | Dashboard | Sidebar |
|------|-----------|---------|
| `OWNER` | `/dashboard/owner` | `OwnerSidebar` |
| `TENANT` | `/dashboard/tenant` | `TenantSidebar` |
| `ADMIN` | `/admin/dashboard` | — |
| `SUPER_ADMIN` | `/super-admin/dashboard` | — (dark mode cyber) |
