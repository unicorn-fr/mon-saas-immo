import { Doc, amountsIn, firstDate, fold } from './text.js'

/**
 * Lecture d'une facture (photo ou PDF) : fournisseur, montant TTC, date, adresse du chantier, objet.
 * Même principe que les baux : texte obtenu sur le serveur, puis règles. Le propriétaire vérifie avant de valider.
 */
export interface InvoiceReading {
  vendor: string | null
  amountCents: number | null
  date: string | null
  address: string | null
  description: string | null
  category: 'REPAIR' | 'MAINTENANCE' | 'TAX' | 'COPRO' | 'INSURANCE' | 'OTHER'
  /** Suggestion : petite réparation à la charge du locataire (décret n° 87-712). */
  tenantRepairHint: string | null
}

const CATEGORY: [RegExp, InvoiceReading['category']][] = [
  [/taxe fonci|avis d.imp|impots?\.gouv|contribution fonci/, 'TAX'],
  [/syndic|copropri|appel de fonds|charges de copro/, 'COPRO'],
  [/assurance|cotisation|prime annuelle|proprietaire non occupant|\bpno\b/, 'INSURANCE'],
  [/entretien|ramonage|contrat de maintenance|visite annuelle|chaudiere/, 'MAINTENANCE'],
  [/plomb|electric|serrur|reparation|remplacement|fuite|depannage|menuis|peinture|travaux|chauffag|vitr/, 'REPAIR'],
]

/** Réparations locatives courantes (décret n° 87-712 du 26 août 1987), sauf vétusté ou malfaçon. */
const TENANT_REPAIRS: [RegExp, string][] = [
  [/joint|siphon|flexible|robinet|mousseur|chasse d.eau|abattant|debouchage|canalisation/, 'Le remplacement de joints, siphons et petites pièces de robinetterie, ou le débouchage, fait souvent partie des réparations locatives à la charge du locataire, sauf usure normale ou vétusté.'],
  [/ampoule|interrupteur|prise electrique|fusible/, 'Le remplacement d’ampoules, d’interrupteurs ou de prises est en principe à la charge du locataire.'],
  [/serrure|cle |cles |badge|verrou/, 'Le graissage et le petit entretien des serrures, ou le remplacement de clés perdues, sont à la charge du locataire.'],
  [/ramonage|entretien (annuel )?de la chaudiere|entretien chaudiere/, 'L’entretien annuel de la chaudière et le ramonage sont à la charge du locataire.'],
]

export function parseInvoice(text: string): InvoiceReading {
  const doc = new Doc(text)
  const lines = doc.raw.split('\n').map((l) => l.trim()).filter(Boolean)

  // Fournisseur : première ligne significative (souvent en capitales), hors mots « facture », « devis », dates.
  const vendorLine = lines.find((l) => /[A-Za-zÀ-ÿ]{3}/.test(l) && !/^(facture|devis|avoir|date|n°|numero|page|client)/i.test(fold(l)) && l.length <= 60)
  const vendor = vendorLine ? vendorLine.replace(/\s{2,}.*/, '').replace(/[^\p{L}\p{N}' &.-]/gu, ' ').replace(/\s+/g, ' ').trim() : null

  // Montant : « Total TTC », « Net à payer », « Montant TTC », sinon le plus grand montant en euros.
  let amount: number | null = null
  for (const re of [/total\s*t\.?t\.?c\.?|net a payer|montant\s*t\.?t\.?c\.?|total a payer|reste a payer|montant du/, /\btotal\b/]) {
    const hits = doc.find(re)
    for (const hit of hits.reverse()) {
      const win = doc.window(hit.end, 60, 2).low
      const a = amountsIn(win)[0]
      if (a && a.value > 0 && a.value < 1_000_000) {
        amount = Math.round(a.value * 100)
        break
      }
    }
    if (amount !== null) break
  }
  if (amount === null) {
    const all = amountsIn(doc.low).filter((a) => a.currency && a.value < 1_000_000)
    if (all.length) amount = Math.round(Math.max(...all.map((a) => a.value)) * 100)
  }

  // Date : libellée « date », sinon la première date du document.
  const dateHit = doc.first(/date( de (la )?facture| d.emission)?\s*[:=]?/)
  const date = (dateHit ? firstDate(doc.window(dateHit.end, 40, 1).low)?.iso : null) ?? firstDate(doc.low)?.iso ?? null

  // Adresse du chantier ou de l'intervention.
  const addrHit = doc.first(/(chantier|adresse (d.intervention|du chantier|des travaux)|lieu (d.intervention|des travaux)|intervention au|bien concerne)\s*[:=]?\s*/)
  const address = addrHit ? doc.raw.slice(addrHit.end, doc.lineAt(addrHit.end).end).replace(/^[\s:]+/, '').trim() || null : null

  // Objet : première ligne de détail accompagnée d'un montant.
  const detail = lines.find((l) => /[a-zA-Zà-ÿ]{4}.*\d+[,.]\d{2}/.test(l) && !/total|tva|h\.?t\.?|ttc|net a payer|acompte/i.test(fold(l)))
  const description = detail ? detail.replace(/\s*\d[\d\s.,]*\s*(€|eur)?\s*$/i, '').trim() || null : null

  const all = fold(doc.raw)
  const category = CATEGORY.find(([re]) => re.test(all))?.[1] ?? 'OTHER'
  const tenantRepairHint = TENANT_REPAIRS.find(([re]) => re.test(all))?.[1] ?? null

  return { vendor, amountCents: amount, date, address, description, category, tenantRepairHint }
}

/** Rapproche une adresse lue d'un logement (numéro + nom de voie, ou code postal + ville). */
export function matchProperty<T extends { id: string; address: string }>(address: string | null, text: string, properties: T[]): T | null {
  const norm = (s: string) => fold(s).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim()
  const hay = norm(`${address ?? ''} ${text}`)
  let best: { p: T; score: number } | null = null
  for (const p of properties) {
    const a = norm(p.address)
    const street = /^(\d+\s*(bis|ter)?\s+[a-z ]+?)(\s\d{5}|$)/.exec(a)?.[1]
    const cp = /\b\d{5}\b/.exec(a)?.[0]
    let score = 0
    if (street && hay.includes(street)) score += 3
    else if (street && street.split(' ').slice(1).filter((w) => w.length > 3).every((w) => hay.includes(w))) score += 2
    if (cp && hay.includes(cp)) score += 1
    if (score > (best?.score ?? 0)) best = { p, score }
  }
  return best && best.score >= 2 ? best.p : null
}
