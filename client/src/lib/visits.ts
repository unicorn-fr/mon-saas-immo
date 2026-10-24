/**
 * Mesure d'audience sans cookie (server/src/domain/visits.ts) : à chaque page affichée, le chemin est envoyé au
 * serveur, avec pour la première page le site d'où vient le visiteur. Rien n'est gardé dans le navigateur ; le
 * serveur ne compte que les pages publiques et n'enregistre que des totaux par jour. Les visiteurs qui refusent le
 * suivi (Do Not Track, Global Privacy Control) ne sont pas comptés.
 */
let first = true

const refused = () => {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean }
  return n.globalPrivacyControl === true || n.doNotTrack === '1'
}

/** Rechargement de la page : ce n'est pas une nouvelle visite. */
const reloaded = () => (performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined)?.type === 'reload'

export function countVisit(path: string) {
  const entry = first && !reloaded()
  first = false
  if (refused() || typeof navigator.sendBeacon !== 'function') return
  const utm = new URLSearchParams(location.search).get('utm_source') ?? undefined
  const body = JSON.stringify({ path, entry, ...(entry ? { referrer: document.referrer || undefined, utm } : {}) })
  try {
    navigator.sendBeacon('/api/visits', new Blob([body], { type: 'application/json' }))
  } catch {
    // Mesure facultative : un échec ne gêne jamais le visiteur.
  }
}
