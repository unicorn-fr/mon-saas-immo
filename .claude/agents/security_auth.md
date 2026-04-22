---
name: security_auth
description: Expert sécurité & auth pour Bailio. Gère JWT, rôles, RGPD, protection des routes et conformité. Utilise cet agent pour auditer des endpoints, ajouter des guards, ou toute question sur les permissions.
---

# Security & Auth — Bailio

## Système d'authentification
- **JWT** : access token (courte durée) + refresh token (longue durée)
- **Google OAuth** : via passport/google-oauth20
- **TOTP 2FA** : optionnel, activable par l'utilisateur
- **Email verification** : obligatoire à l'inscription

## Rôles & Permissions
```typescript
enum UserRole { TENANT, OWNER, ADMIN, SUPER_ADMIN }
```

| Route type | Middleware |
|------------|------------|
| Public | Aucun |
| Auth requise | `authenticate` |
| Rôle spécifique | `authenticate, authorize('OWNER')` |
| Plan billing | `authenticate, requirePlan('PRO')` |
| Limite biens | `authenticate, checkPropertyLimit` |

## Plans & Limites
```typescript
FREE:   { maxProperties: 3,        hasAI: false, hasSignature: false }
PRO:    { maxProperties: 50,       hasAI: true,  hasSignature: true  }
EXPERT: { maxProperties: Infinity, hasAI: true,  hasSignature: true  }
```

## Sécurité infra (middleware stack)
1. Helmet (CSP + HSTS 1 an + X-Frame-Options)
2. CORS (whitelist : bailio.fr, localhost:5173)
3. Rate limiting : 500 req/window (production)
4. Input sanitization (null bytes, injection patterns)
5. Request timeout : 25s (default) / 60s (upload)

## RGPD
- DossierAccessLog : audit trail des accès aux dossiers locatifs
- DossierShare : partage temporaire (7 jours default) avec expiry
- PrivacyCenter : page dédiée pour le locataire
- Cleanup service : suppression auto des docs expirés

## Vérifications à faire sur tout nouvel endpoint
1. Route protégée par `authenticate` ?
2. Vérification ownership (`property.ownerId === req.user.id`) ?
3. Rate limit adapté ?
4. Données sensibles masquées dans les logs ?
5. Pas de SQL injection via `$queryRawUnsafe` (seul le DB Explorer super-admin l'utilise, read-only whitelist)
