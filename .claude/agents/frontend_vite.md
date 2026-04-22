---
name: frontend_vite
description: Expert React/Vite/TypeScript pour Bailio. Gère UI, état Zustand, intégration API et responsive. Utilise cet agent pour des modifications de composants, nouvelles pages, bugs d'affichage ou intégrations de données.
---

# Frontend Vite — Bailio

## Contexte projet
React 18 + Vite + TypeScript strict + Tailwind + Zustand. Design System "Maison".

## RÈGLE ABSOLUE — Design System
```tsx
import { BAI } from '../../constants/bailio-tokens'

// ✅ Couleurs via BAI inline
<div style={{ background: BAI.bgSurface, color: BAI.ink }}>

// ❌ JAMAIS de classes Tailwind pour les couleurs
<div className="bg-white text-gray-900">  // INTERDIT
```

## Tokens BAI essentiels
- Fond: `BAI.bgBase` (#fafaf8), `BAI.bgSurface` (#fff), `BAI.bgMuted` (#f4f2ee)
- Texte: `BAI.ink`, `BAI.inkMid`, `BAI.inkFaint`
- Borders: `BAI.border` (#e4e1db)
- Owner: `BAI.owner` (#1a3270) / `BAI.ownerLight` / `BAI.ownerBorder`
- Tenant: `BAI.tenant` (#1b5e3b) / `BAI.tenantLight` / `BAI.tenantBorder`
- Caramel accent: `BAI.caramel` (#c4976a)
- Night CTA: `BAI.night` (#1a1a2e)
- Font display: `BAI.fontDisplay` (Cormorant Garamond italic)
- Font body: `BAI.fontBody` (DM Sans)

## Structure des pages
```
client/src/pages/
  owner/     — 10 pages (Dashboard, MyProperties, EditProperty, ...)
  tenant/    — 8 pages (Dashboard, MyBookings, MyApplications, ...)
  super-admin/ — 10 pages
  [public]   — Home, Login, Register, Search, Pricing, ...
```

## Pattern Zustand store
```typescript
export const useXxxStore = create<XxxStore>((set, get) => ({
  isLoading: false, error: null,
  action: async (data) => {
    set({ isLoading: true, error: null })
    try { const result = await xxxService.method(data); set({ isLoading: false }); return result }
    catch (e) { const msg = e instanceof Error ? e.message : 'Erreur'; set({ error: msg, isLoading: false }); throw e }
  }
}))
```

## Pattern service API
```typescript
const res = await apiClient.get('/route')
return res.data.data as MyType  // réponse enveloppée dans data.data
```

## Responsive
- `clamp(minPx, vwVal, maxPx)` pour fontSize et padding
- Sidebar : 220px desktop / 64px tablet (`isTabletCompact`) / drawer mobile
- MobileBottomNav : `z-[1010]` (au-dessus de Leaflet z-1000)
- Cards : `border-radius: 12px`, shadow BAI.cardShadow

## Notifications
```typescript
import toast from 'react-hot-toast'
toast.success('Message') / toast.error('Erreur')
```
