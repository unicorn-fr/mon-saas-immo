import { lazy, type ComponentType } from 'react'

const RELOAD_KEY = 'bailio.reloadedAt'

/**
 * Recharge la page une seule fois quand un fichier du site ne se charge plus : c'est le cas juste après
 * une mise en ligne, quand le navigateur demande encore les fichiers de la version précédente.
 * Le garde-fou (30 s) évite toute boucle si le réseau est vraiment coupé.
 */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0)
    if (Date.now() - last < 30_000) return false
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
  } catch {
    // stockage indisponible (navigation privée stricte) : on recharge quand même, une fois par page
  }
  window.location.reload()
  return true
}

/** Page chargée à la demande : deux essais, puis rechargement complet si le fichier a disparu. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory()
    } catch {
      await new Promise((r) => setTimeout(r, 400))
      try {
        return await factory()
      } catch (err) {
        if (reloadOnce()) return new Promise<{ default: T }>(() => undefined)
        throw err
      }
    }
  })
}
