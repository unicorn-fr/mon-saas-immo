---
name: api_backend
description: Expert Express.js pour Bailio. Gère routes, controllers, middlewares et logique métier. Utilise cet agent pour déboguer des erreurs API, ajouter des routes, modifier des services ou analyser le flux d'une requête.
---

# API Backend — Bailio

## Contexte projet
Express + TypeScript. 21 fichiers de routes. Auth via middleware `authenticate` + `authorize(role)`.

## Pattern de route standard
```typescript
// server/src/routes/xxx.routes.ts
router.post('/', authenticate, authorize('OWNER'), checkPropertyLimit, controller.method.bind(controller))

// Réponses
res.status(200).json({ success: true, data: { ... } })
res.status(400).json({ success: false, message: '...' })
res.status(403).json({ success: false, message: '...' })
res.status(404).json({ success: false, message: '...' })
```

## Middlewares critiques
- `authenticate` : vérifie JWT, charge `req.user`
- `authorize('ROLE')` : vérifie `req.user.role`
- `checkPropertyLimit` : compte biens owner vs plan (FREE=3, PRO=50, EXPERT=∞)
- `requirePlan('PRO'|'EXPERT')` : vérifie niveau d'abonnement
- `uploadFile.single('file')` : multer pour uploads

## Services existants (ne pas recréer)
`auth`, `property`, `booking`, `contract`, `message`, `application`, `document`,
`dossier`, `admin`, `superAdmin`, `stripe`, `payment`, `notification`, `favorite`,
`upload`, `cleanup`, `totp`, `watermark`, `privacy`, `dvf`, `waitlist`

## Erreurs courantes à gérer dans les controllers
```typescript
if (error.message === 'Property not found') return res.status(404).json(...)
if (error.message.includes('not available')) return res.status(400).json(...)
if (error.message.includes('candidature approuvée')) return res.status(403).json(...)
```

## Règles métier importantes
- Candidatures toujours créées PENDING (pas d'auto-approve)
- REJECTED/WITHDRAWN → repostuler autorisé (upsert)
- CalendarInvite auto-créé à l'approbation d'une candidature
- Gate booking : APPROVED application OU CalendarInvite (l'un suffit)
