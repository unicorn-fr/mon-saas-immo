/** « iPhone · Safari », « Mac · Chrome » : un nom d'appareil lisible, tiré de l'en-tête du navigateur. */
export function deviceLabel(userAgent: string | null | undefined): string {
  const ua = userAgent ?? ''
  if (!ua) return 'Appareil inconnu'
  const os = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X|Macintosh/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'Appareil'
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : ''
  return browser ? `${os} · ${browser}` : os
}
