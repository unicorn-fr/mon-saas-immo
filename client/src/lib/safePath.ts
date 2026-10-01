/** Chemin interne sûr (jamais une autre adresse) pour revenir là où l'on était. */
export function safePath(p: string | null | undefined): string | null {
  if (!p || !p.startsWith('/') || p.startsWith('//') || p.includes('\\')) return null
  return p
}
