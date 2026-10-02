import type { PropertyFile } from './contract.js'
import { formatDateFr, formatEuros, parseIsoDate } from './lease.js'
import { energyRentalWarning, maxDepositFor } from './rules.js'

/**
 * Annonce de mise en location : un texte prêt à copier sur un site d'annonces, avec les mentions obligatoires
 * (loyer charges comprises « par mois », charges, dépôt de garantie, surface habitable, meublé ou non, classes
 * énergie et climat, dépenses d'énergie estimées, mention « Logement à consommation énergétique excessive » pour
 * les classes F et G — code de la construction et de l'habitation, art. L. 126-33 — et, en zone d'encadrement,
 * loyer de référence majoré et complément de loyer).
 */

export interface AdSettings {
  title?: string | null
  description?: string | null
  rentCents?: number | null
  chargesCents?: number | null
  chargesMode?: 'PROVISION' | 'FORFAIT' | null
  depositCents?: number | null
  complementCents?: number | null
  availableFrom?: string | null
}

export interface AdCheck {
  label: string
  ok: boolean
  /** Ce qu'il faut compléter, ou pourquoi c'est bloquant. */
  hint?: string
}

export interface Ad {
  title: string
  text: string
  checks: AdCheck[]
  warnings: string[]
}

const e = (cents: number) => formatEuros(cents)
const plural = (n: number, w: string) => `${n} ${w}${n > 1 ? 's' : ''}`

export function buildAd(p: PropertyFile, s: AdSettings): Ad {
  const furnished = Boolean(p.furnished)
  const kind = p.habitat === 'INDIVIDUAL' ? 'Maison' : 'Appartement'
  const rent = s.rentCents ?? null
  const charges = s.chargesCents ?? 0
  const complement = s.complementCents ?? 0
  const dpe = p.diagnostics?.dpe
  const city = [p.city, p.postalCode ? `(${p.postalCode})` : ''].filter(Boolean).join(' ')
  const title =
    s.title?.trim() ||
    [`${kind}${furnished ? ' meublé' : ''}`, p.rooms ? plural(p.rooms, 'pièce') : '', p.surface ? `${String(p.surface).replace('.', ',')} m²` : '', city ? `à ${p.city}` : ''].filter(Boolean).join(' ')

  const lines: string[] = []
  if (s.description?.trim()) lines.push(s.description.trim(), '')
  lines.push(`${kind} ${furnished ? 'meublé' : 'non meublé'}${p.rooms ? `, ${plural(p.rooms, 'pièce')} principale${p.rooms > 1 ? 's' : ''}` : ''}${p.surface ? `, ${String(p.surface).replace('.', ',')} m² habitables` : ''}${city ? `, ${city}` : ''}.`)
  if (s.availableFrom) lines.push(`Disponible à partir du ${formatDateFr(parseIsoDate(s.availableFrom))}.`)
  lines.push('')
  if (rent !== null) {
    lines.push(`Loyer : ${e(rent + charges)} par mois charges comprises, dont ${e(charges)} de charges${charges ? (s.chargesMode === 'FORFAIT' ? ' (forfait)' : ' (provision, avec régularisation annuelle)') : ''}.`)
    if (complement) lines.push(`Dont loyer de base ${e(rent - complement)} et complément de loyer ${e(complement)}.`)
  }
  if (p.market?.refRentMaxCentsM2) lines.push(`Loyer de référence majoré : ${e(p.market.refRentMaxCentsM2)} par m² et par mois.`)
  if (s.depositCents !== null && s.depositCents !== undefined) lines.push(s.depositCents ? `Dépôt de garantie : ${e(s.depositCents)}.` : 'Pas de dépôt de garantie.')
  lines.push('Location entre particuliers : pas de frais d’agence.')
  lines.push('')
  if (dpe?.class) {
    lines.push(`Classe énergie : ${dpe.class}${dpe.ges ? `. Classe climat : ${dpe.ges}` : ''}.`)
    if (dpe.class === 'F' || dpe.class === 'G') lines.push('Logement à consommation énergétique excessive.')
    if (dpe.costMin && dpe.costMax)
      lines.push(`Montant estimé des dépenses annuelles d’énergie pour un usage standard : entre ${dpe.costMin.toLocaleString('fr-FR')} € et ${dpe.costMax.toLocaleString('fr-FR')} € par an${dpe.costYear ? `. Prix moyens des énergies indexés au 1er janvier ${dpe.costYear} (abonnements compris)` : ''}.`)
  }
  const text = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()

  const checks: AdCheck[] = [
    { label: 'Loyer charges comprises, par mois', ok: rent !== null && rent > 0, hint: 'Indiquez le loyer hors charges.' },
    { label: 'Montant des charges', ok: s.chargesCents !== null && s.chargesCents !== undefined, hint: 'Indiquez les charges (0 si aucune).' },
    { label: 'Dépôt de garantie', ok: s.depositCents !== null && s.depositCents !== undefined, hint: 'Indiquez le dépôt de garantie (0 si aucun).' },
    { label: 'Surface habitable', ok: Boolean(p.surface), hint: 'À compléter dans la fiche du logement.' },
    { label: 'Ville', ok: Boolean(p.city), hint: 'À compléter dans la fiche du logement.' },
    { label: 'Classes énergie et climat (DPE)', ok: Boolean(dpe?.class && dpe?.ges), hint: 'À compléter dans la fiche du logement, rubrique diagnostics.' },
    { label: 'Dépenses d’énergie estimées', ok: Boolean(dpe?.costMin && dpe?.costMax), hint: 'Fourchette indiquée sur le DPE : à reporter dans la fiche du logement.' },
  ]
  const warnings: string[] = []
  const blocked = energyRentalWarning(dpe?.class)
  if (blocked) warnings.push(blocked)
  if (rent !== null && s.depositCents) {
    const max = maxDepositFor(furnished ? 'MEUBLE' : 'VIDE', rent)
    if (s.depositCents > max) warnings.push(`Le dépôt de garantie ne peut pas dépasser ${e(max)} (${furnished ? 'deux mois' : 'un mois'} de loyer hors charges).`)
  }
  if (rent !== null && p.market?.refRentMaxCentsM2 && p.surface) {
    const cap = Math.round(p.market.refRentMaxCentsM2 * p.surface)
    if (rent - complement > cap) warnings.push(`Le loyer de base dépasse le loyer de référence majoré (${e(cap)} pour ${p.surface} m²). Au-delà, seul un complément de loyer justifié est possible.`)
  }
  return { title, text, checks, warnings }
}
