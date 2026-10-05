import { AsyncLocalStorage } from 'node:async_hooks'
import { PrismaClient } from '@prisma/client'
import { scopeQuery, type Scope } from './domain/access.js'
import { HttpError } from './lib/http.js'

/**
 * Espace partagé en cours (invité d'un propriétaire) : posé par requireUser pour la durée de la requête.
 * Hors espace partagé (le propriétaire lui-même, les liens publics), aucune requête n'est modifiée.
 */
export const accessScope = new AsyncLocalStorage<Scope>()

const denied = () => new HttpError(404, 'Introuvable, ou hors des logements partagés avec vous.')

const base = new PrismaClient()

export const prisma = base.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const scope = accessScope.getStore()
        if (!scope) return query(args)
        const a = (args ?? {}) as Record<string, unknown>
        const rule = scopeQuery(model, operation, a, scope)
        // Le filtre s'ajoute dans AND, à côté de la condition d'origine (une recherche par identifiant garde son identifiant).
        const and = (where: Record<string, unknown>) => {
          const w = (a.where ?? {}) as Record<string, unknown>
          const prev = w.AND === undefined ? [] : Array.isArray(w.AND) ? w.AND : [w.AND]
          return { ...a, where: { ...w, AND: [...prev, where] } }
        }
        switch (rule.kind) {
          case 'ALLOW':
            return query(args)
          case 'DENY':
            throw denied()
          case 'CHECK':
            if (!rule.ok) throw denied()
            return query(args)
          case 'FILTER':
            return query(and(rule.where) as typeof args)
          case 'UPSERT':
            if (!rule.ok) throw denied()
            return query((rule.where ? and(rule.where) : a) as typeof args)
        }
      },
    },
  },
})
