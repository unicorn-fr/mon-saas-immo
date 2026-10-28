/**
 * Filigrane des justificatifs envoyés par un candidat ou un locataire (pièce d'identité, avis d'imposition, bulletins
 * de salaire…). Il dit à quoi le document a servi : un document volé ou revendu porte la trace de cette location et ne
 * peut pas resservir ailleurs sans que cela se voie. Recommandation de l'ANIL et du service FiligraneFacile de l'État.
 */

const pad = (n: number) => String(n).padStart(2, '0')

/** Texte du filigrane : la location concernée (ville seulement, jamais l'adresse exacte), la date et Bailio. */
export function watermarkText(input: { city?: string | null; date?: Date }): string {
  const d = input.date ?? new Date()
  const city = (input.city ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)
  const where = city ? `un logement à ${city}` : 'un logement'
  return `Uniquement pour louer ${where} · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · Bailio`
}
