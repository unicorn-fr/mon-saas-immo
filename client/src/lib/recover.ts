/**
 * Filet de sécurité : si une page plante dans le navigateur d'un visiteur, l'erreur est signalée au serveur
 * et la page est rechargée une fois automatiquement (un rechargement complet l'affiche toujours).
 * Si le même plantage revient aussitôt, on s'arrête et on affiche un message.
 */
const KEY = 'bailio.recover'

export function reportError(error: unknown, where: string): void {
  try {
    const e = error instanceof Error ? error : new Error(String(error))
    const body = JSON.stringify({ message: e.message, stack: e.stack, where, url: window.location.href })
    if (navigator.sendBeacon) navigator.sendBeacon('/api/client-errors', new Blob([body], { type: 'application/json' }))
    else void fetch('/api/client-errors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
  } catch {
    // le signalement ne doit jamais aggraver la situation
  }
}

/** Recharge la page une fois. Renvoie false si l'on vient déjà de recharger cette adresse (évite une boucle). */
export function recoverOnce(): boolean {
  const here = window.location.pathname + window.location.search
  try {
    const last = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { url: string; at: number } | null
    if (last && last.url === here && Date.now() - last.at < 15_000) return false
    sessionStorage.setItem(KEY, JSON.stringify({ url: here, at: Date.now() }))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
