import { ANNEXES, COMMON_AREAS, EQUIPMENTS, type PropertyFile } from './contract.js'
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
  highlights?: string | null
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

const HEATING_ENERGY: Record<string, string> = { GAS: 'au gaz', ELECTRIC: 'électrique', HEAT_PUMP: 'par pompe à chaleur', FUEL: 'au fioul', WOOD: 'au bois', NETWORK: 'par réseau de chaleur' }
const PERIOD: Record<string, string> = { BEFORE_1949: 'avant 1949', '1949_1974': 'entre 1949 et 1974', '1975_1989': 'entre 1975 et 1989', '1990_2005': 'entre 1990 et 2005', AFTER_2005: 'après 2005' }

/**
 * Consigne prête à copier dans l'assistant d'IA de son choix (ChatGPT, Gemini, Claude, Le Chat…) pour rédiger
 * la présentation du logement. Elle ne contient que la description du bien : ni adresse exacte, ni nom, ni
 * coordonnées. Les montants et le DPE sont ajoutés ensuite par Bailio (mentions obligatoires), l'IA ne doit
 * donc pas les écrire, ni rien inventer, ni mentionner de critère sur le locataire.
 */
export function adPrompt(p: PropertyFile, s: AdSettings): string {
  const furnished = Boolean(p.furnished)
  const facts: string[] = []
  facts.push(`${p.habitat === 'INDIVIDUAL' ? 'Maison' : 'Appartement'} ${furnished ? 'meublé' : 'non meublé (location vide)'}`)
  if (p.city) facts.push(`Ville : ${p.city}${p.postalCode ? ` (${p.postalCode})` : ''}`)
  if (p.surface) facts.push(`Surface habitable : ${String(p.surface).replace('.', ',')} m²`)
  if (p.rooms) facts.push(`Pièces principales : ${p.rooms}`)
  const rooms = (p.roomList ?? []).map((r) => [r.name, r.note].filter(Boolean).join(' : ')).filter(Boolean)
  if (rooms.length) facts.push(`Pièces : ${rooms.join(', ')}`)
  if (p.floorDoor) facts.push(`Étage : ${p.floorDoor}`)
  if (p.constructionPeriod) facts.push(`Construit ${PERIOD[p.constructionPeriod]}`)
  if (p.heating?.mode || p.heating?.energy) facts.push(`Chauffage ${p.heating.mode === 'COLLECTIVE' ? 'collectif' : 'individuel'}${p.heating.energy ? ` ${HEATING_ENERGY[p.heating.energy]}` : ''}`)
  if (p.hotWater?.mode) facts.push(`Eau chaude ${p.hotWater.mode === 'COLLECTIVE' ? 'collective' : 'individuelle'}`)
  const equipments = (p.equipments ?? []).map((k) => EQUIPMENTS[k].toLowerCase())
  if (p.otherEquipments) equipments.push(p.otherEquipments)
  if (equipments.length) facts.push(`Équipements : ${equipments.join(', ')}`)
  const annexes = (p.annexes ?? []).map((k) => (k === 'garden' && p.gardenArea ? `jardin privatif de ${p.gardenArea} m²` : ANNEXES[k].toLowerCase()))
  if (annexes.length) facts.push(`Annexes : ${annexes.join(', ')}`)
  const common = (p.commonAreas ?? []).map((k) => COMMON_AREAS[k].toLowerCase())
  if (common.length) facts.push(`Parties communes : ${common.join(', ')}`)
  if (p.internet === 'FIBER') facts.push('Fibre optique')
  if (furnished && p.furniture?.present?.length) facts.push('Entièrement meublé et équipé (mobilier obligatoire complet)')
  if (s.availableFrom) facts.push(`Disponible à partir du ${formatDateFr(parseIsoDate(s.availableFrom))}`)
  if (s.highlights?.trim()) facts.push(`Points forts indiqués par le propriétaire : ${s.highlights.trim()}`)

  return [
    'Rédigez en français une annonce de location pour un logement loué par un particulier.',
    '',
    'Informations sur le logement :',
    ...facts.map((f) => `- ${f}`),
    '',
    'Consignes :',
    '- Utilisez uniquement les informations ci-dessus. N’inventez rien (pas de quartier, de vue, de commerce ou de transport qui ne sont pas indiqués).',
    '- N’écrivez ni le loyer, ni les charges, ni le dépôt de garantie, ni le diagnostic énergétique : ces mentions obligatoires seront ajoutées automatiquement à la suite.',
    '- Aucun critère sur le futur locataire (âge, situation familiale, origine, nationalité, profession…) : la loi l’interdit.',
    '- Ton chaleureux et simple, sans exagération, sans émoticône, sans mise en forme (pas de gras, pas de titres, pas de listes à puces).',
    '- Entre 600 et 1 200 caractères, en 2 ou 3 paragraphes courts.',
    '',
    'Répondez exactement sous cette forme :',
    'Titre : (un titre de 70 caractères au maximum)',
    '(la description)',
  ].join('\n')
}

/**
 * Texte collé depuis un assistant d'IA : sépare le titre (« Titre : … ») de la description et retire la mise en
 * forme Markdown (gras, titres, puces) que certains assistants ajoutent malgré la consigne.
 */
export function parseAiAd(raw: string): { title: string | null; description: string } {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/\*\*|__/g, '').replace(/^\s*[-*•]\s+/, '').trimEnd())
  let title: string | null = null
  const i = lines.findIndex((l) => l.trim() !== '')
  const m = i >= 0 ? /^\s*titre\s*:\s*(.+)$/i.exec(lines[i]) : null
  if (m) {
    title = m[1].trim().replace(/^["«]\s*|\s*["»]$/g, '').slice(0, 140)
    lines.splice(i, 1)
  }
  const description = lines.join('\n').replace(/^\s*description\s*(:[ \t]*|\n)/i, '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 3000)
  return { title, description }
}
