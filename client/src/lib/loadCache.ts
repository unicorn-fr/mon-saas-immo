import { getSpace } from './shared'
import { SESSION_KEY, storage } from './storage'

/**
 * Dernières données vues, par page (source de la fonction de chargement + paramètres + session + espace partagé) :
 * en revenant sur une page, elle s'affiche tout de suite avec ce qu'on y a vu, puis se met à jour en arrière-plan.
 * En mémoire seulement (rien dans le navigateur), vidée à la déconnexion et au changement d'espace.
 */
export const loadCache = new Map<string, unknown>()
const CACHE_MAX = 60
export function clearLoadCache() {
  loadCache.clear()
}
export function cacheKey(load: () => unknown, deps: unknown[]) {
  let extra = ''
  try {
    extra = `${storage.get(SESSION_KEY) ?? ''}|${getSpace()?.id ?? ''}`
  } catch {
    // stockage indisponible : la clé reste propre à la page
  }
  return `${load.toString()}|${JSON.stringify(deps)}|${extra}`
}
export function remember(key: string, value: unknown) {
  loadCache.delete(key)
  loadCache.set(key, value)
  if (loadCache.size > CACHE_MAX) loadCache.delete(loadCache.keys().next().value as string)
}

