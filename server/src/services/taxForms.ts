import { readFile } from 'node:fs/promises'
import { PDFDocument, PDFName, PDFDict, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFForm } from 'pdf-lib'
import type { PropertyTax, TaxSummary } from '../domain/tax.js'
import { wholeEuros } from '../domain/taxForms.js'

/**
 * Formulaires officiels pré-remplis, à partir des fichiers vierges d'impots.gouv.fr (server/assets/forms) :
 * - 2044 (revenus fonciers) : formulaire sans champs, les montants sont écrits à l'emplacement de chaque case
 *   (coordonnées relevées sur l'édition 2026, revenus 2025) ;
 * - 1447-C-SD (déclaration initiale de CFE, meublé) : formulaire à champs, rempli champ par champ.
 * Un bandeau rappelle que le document est pré-rempli par Bailio et doit être vérifié.
 * Chaque année, à la sortie des nouvelles éditions : remplacer les fichiers et revoir les coordonnées.
 */

const asset = (name: string) => readFile(new URL(`../../assets/forms/${name}`, import.meta.url))

/** Édition de la 2044 disponible : celle des revenus 2025 (publiée en 2026). */
export const FORM_2044_YEAR = 2025
/** Édition de la 1447-C-SD disponible : CFE 2027, pour une activité commencée en 2026. */
export const FORM_1447_YEAR = 2026

const INK = rgb(0.06, 0.12, 0.38)
const fmt = (cents: number) => `${cents < 0 ? '- ' : ''}${Math.abs(wholeEuros(cents)).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g, ' ')}`

function right(page: PDFPage, font: PDFFont, text: string, xRight: number, y: number, size = 9) {
  page.drawText(text, { x: xRight - font.widthOfTextAtSize(text, size), y, size, font, color: INK })
}

function left(page: PDFPage, font: PDFFont, text: string, x: number, y: number, maxWidth: number, size = 8.5) {
  let t = text
  while (t.length > 3 && font.widthOfTextAtSize(t, size) > maxWidth) t = t.slice(0, -2)
  page.drawText(t === text ? t : `${t.trimEnd()}…`, { x, y, size, font, color: INK })
}

function stamp(page: PDFPage, font: PDFFont, text: string) {
  const size = 8
  const w = font.widthOfTextAtSize(text, size) + 16
  const { width, height } = page.getSize()
  page.drawRectangle({ x: width - w - 18, y: height - 22, width: w, height: 15, color: rgb(1, 0.93, 0.84) })
  page.drawText(text, { x: width - w - 10, y: height - 18, size, font, color: rgb(0.6, 0.2, 0.05) })
}

// ── 2044 ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Bas de chaque case (en points PDF) sur les pages 2 et 3, mêmes hauteurs sur les deux pages.
const ROW: Record<string, number> = { '211': 548.3, '212': 533.3, '213': 520.3, '214': 490.3, '215': 472.3, '221': 413.3, '222': 399.3, '223': 385.3, '224': 361.3, '224bis': 337.3, '225': 323.3, '226': 309.3, '227': 285.3, '228': 245.3, '229': 215.3, '230': 201.3, '240': 187.3, '250': 158.3, '261': 120.3, '262': 105.3, '263': 88.3 }
// Bord droit des colonnes « Immeuble 1 » à « Immeuble 8 » : 1 à 3 en page 2, 4 à 8 en page 3.
// `units` : centre de la case « Nombre de locaux » de la colonne.
const COLUMNS: Array<{ page: number; right: number; units: number }> = [
  { page: 1, right: 418, units: 395.5 },
  { page: 1, right: 503, units: 480.5 },
  { page: 1, right: 588, units: 565.5 },
  { page: 2, right: 141, units: 117.5 },
  { page: 2, right: 226, units: 202.5 },
  { page: 2, right: 311, units: 287.5 },
  { page: 2, right: 396, units: 372.5 },
  { page: 2, right: 481, units: 457.5 },
]
// Colonne des totaux (page 3) : cases E (215), F (240), G (250), I (263).
const TOTALS: Record<string, number> = { '215': 469.3, '240': 183.3, '250': 154.3, '263': 85.3 }
// Page 4 : montants à gauche du symbole €, ligne par ligne.
const RESULT: Record<string, number> = { '420': 653.9, '431': 602.2, '432': 589.1, '433': 575.9, '434': 562.7, '436': 532.0, '437': 517.9, '438': 504.7, '439': 491.5, '441': 459.9, '442': 446.7 }
// Lignes « Immeuble n » : nom du locataire (page 2) et adresse du logement (page 3).
const IDENTITY_Y = [739, 724, 709, 694, 679, 664, 649, 634]

/** Montants d'un logement, ligne par ligne, tels qu'ils s'écrivent sur la 2044 (sans signe, en euros entiers). */
export function lines2044(p: PropertyTax): Record<string, number> {
  const get = (line: string) => p.lines.find((l) => l.line === line)?.cents ?? 0
  const out: Record<string, number> = {}
  for (const l of ['211', '213', '214', '221', '222', '223', '224', '227', '229']) out[l] = get(l)
  out['215'] = out['211'] + out['213'] + out['214']
  out['230'] = -get('230')
  out['240'] = out['221'] + out['222'] + out['223'] + out['224'] + out['227'] + out['229'] - out['230']
  out['250'] = get('250')
  out['261'] = out['215'] - out['240'] - out['250']
  out['263'] = out['261']
  return out
}

export async function filled2044(input: { year: number; owner: string; ownerAddress: string; summary: TaxSummary; addresses: Record<string, string>; tenants?: Record<string, string> }): Promise<Uint8Array> {
  const doc = await PDFDocument.load(await asset('2044-revenus-2025.pdf'))
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const pages = doc.getPages()
  const props = input.summary.properties.filter((p) => !p.furnished)
  stamp(pages[0], bold, `Pré-remplie par Bailio, revenus ${input.year} : vérifiez chaque montant avant de déclarer.`)
  if (input.year !== FORM_2044_YEAR) stamp(pages[1], font, `Modèle publié en 2026 (revenus ${FORM_2044_YEAR}) : celui de vos revenus ${input.year} n’est pas encore paru.`)
  left(pages[0], font, input.owner, 272, 681, 316, 10)
  left(pages[0], font, input.ownerAddress, 272, 657, 316, 9)

  const totals: Record<string, number> = { '215': 0, '240': 0, '250': 0, '263': 0 }
  props.slice(0, COLUMNS.length).forEach((p, k) => {
    const col = COLUMNS[k]
    const v = lines2044(p)
    left(pages[1], font, input.tenants?.[p.id] ?? '', 292, IDENTITY_Y[k] + 1, 310)
    left(pages[2], font, input.addresses[p.id] ?? '', 162, IDENTITY_Y[k] + 1, 420)
    right(pages[col.page], font, '1', col.units + 2.5, 598)
    for (const [line, cents] of Object.entries(v)) {
      if (!cents && line !== '211' && line !== '263') continue
      right(pages[col.page], font, fmt(cents), col.right, ROW[line] + 3.5)
    }
    for (const t of Object.keys(totals)) totals[t] += v[t]
  })
  for (const [line, y] of Object.entries(TOTALS)) right(pages[2], font, fmt(totals[line]), 590, y + 3.5)
  if (props.length > COLUMNS.length) left(pages[2], bold, `Plus de ${COLUMNS.length} logements : joignez un état sur le même modèle pour les suivants.`, 76, 60, 420)

  // Résultat et répartition du déficit (page 4, lignes 420 à 442).
  const res = totals['263']
  const p4 = pages[3]
  right(p4, bold, fmt(res), 438, RESULT['420'])
  // Rubriques 400 (travaux) et 410 (intérêts) : une ligne par logement concerné, le détail reste sur vos factures.
  const works = props.map((p, k) => ({ k, cents: lines2044(p)['224'] })).filter((x) => x.cents).slice(0, 4)
  works.forEach((w, r) => {
    left(p4, font, `Immeuble ${w.k + 1} : travaux`, 64, 811 - 12.8 * r, 140)
    left(p4, font, 'Entreprises et dates : sur vos factures', 196, 811 - 12.8 * r, 230)
    right(p4, font, fmt(w.cents), 588, 811 - 12.8 * r)
  })
  const loans = props.map((p, k) => ({ k, cents: lines2044(p)['250'] })).filter((x) => x.cents).slice(0, 3)
  loans.forEach((l, r) => {
    left(p4, font, `Immeuble ${l.k + 1} : prêteur et date du prêt sur votre tableau d’amortissement`, 64, 727.5 - 12.8 * r, 350)
    right(p4, font, fmt(l.cents), 588, 727.5 - 12.8 * r)
  })
  const deficit = input.summary.empty?.deficit
  if (res < 0 && deficit) {
    const gross = totals['215']
    const interest = totals['250']
    const other = totals['240']
    right(p4, font, fmt(gross), 438, RESULT['431'])
    right(p4, font, fmt(interest), 438, RESULT['432'])
    right(p4, font, fmt(other), 438, RESULT['433'])
    if (interest > gross) {
      right(p4, font, fmt(deficit.globalCents), 438, RESULT['436'])
      right(p4, font, fmt(Math.max(0, other - deficit.globalCents)), 438, RESULT['437'])
      right(p4, font, fmt(interest - gross), 438, RESULT['438'])
      right(p4, font, fmt(deficit.carriedCents), 438, RESULT['439'])
    } else {
      right(p4, font, fmt(deficit.globalCents), 438, RESULT['441'])
      right(p4, font, fmt(deficit.carriedCents), 438, RESULT['442'])
    }
  }
  return doc.save()
}

// ── 1447-C-SD ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Coche le n-ième choix d'une case à plusieurs widgets (« Propriétaire », « Autre local loué meublé »…). */
function checkOption(form: PDFForm, name: string, index: number) {
  const field = form.getCheckBox(name).acroField
  const widgets = field.getWidgets()
  const w = widgets[index]
  if (!w) return
  const normal = w.dict.lookup(PDFName.of('AP'), PDFDict)?.lookup(PDFName.of('N'), PDFDict)
  const on = normal?.keys().find((k) => k.asString() !== '/Off')
  if (!on) return
  field.dict.set(PDFName.of('V'), on)
  widgets.forEach((x, k) => x.setAppearanceState(k === index ? on : PDFName.of('Off')))
}

export interface CfeInput {
  owner: string
  ownerAddress: string
  siret?: string | null
  propertyAddress: string
  postalCode?: string | null
  city?: string | null
  floorDoor?: string | null
  house: boolean
  surface?: number | null
  /** Début de la location meublée (AAAA-MM-JJ). */
  startDate: string
  /** Recettes annuelles estimées (loyer et charges sur douze mois). */
  yearlyReceiptsCents: number
  /** Lieu et date de la signature (page 1, « À … le … »). */
  signedAt?: { place: string | null; date: string } | null
  /** Signature du profil (image PNG en data URL), posée dans le cadre « Signature ». */
  signaturePng?: string | null
}

export async function filled1447(i: CfeInput): Promise<Uint8Array> {
  const doc = await PDFDocument.load(await asset('1447-c-sd-2027.pdf'))
  const form = doc.getForm()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const set = (name: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return
    try {
      form.getTextField(name).setText(String(value))
    } catch {
      /* champ absent dans cette édition */
    }
  }
  const fr = (iso: string) => iso.split('-').reverse().join('/')
  // Adresse du logement : la ville n'est ajoutée que si l'adresse saisie ne la contient pas déjà.
  const place = i.city && i.propertyAddress.toLowerCase().includes(i.city.toLowerCase()) ? i.propertyAddress : [i.propertyAddress, [i.postalCode, i.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
  const dept = (i.postalCode ?? '').trim().slice(0, i.postalCode?.startsWith('97') ? 3 : 2)
  // Page 1 : lieu d'imposition, identité, activité.
  set('a1', dept)
  set('a2', i.city)
  set('a5', i.owner)
  set('a6', 'Location de logement meublé (loueur en meublé non professionnel)')
  set('a7', place)
  set('a8', i.ownerAddress)
  set('a9', i.siret?.replace(/\s/g, ''))
  set('a10', '6820A') // NACE 68.20A, location de logements
  // Page 2 : création d'établissement, date, recettes estimées.
  try {
    form.getCheckBox('cac2').check()
  } catch {
    /* édition différente */
  }
  set('date1', fr(i.startDate))
  set('b14', wholeEuros(i.yearlyReceiptsCents))
  // Page 3 : le logement.
  set('c1', i.house ? 'Maison louée meublée' : 'Appartement loué meublé')
  set('c2', place)
  set('c3', i.floorDoor)
  set('c6', fr(i.startDate))
  set('c7', i.surface ? Math.round(i.surface) : null)
  set('c11', i.surface ? Math.round(i.surface) : null)
  checkOption(form, 'cac8', 0) // Vous êtes : propriétaire
  checkOption(form, 'cac11', 2) // Autre local loué meublé
  const first = doc.getPages()[0]
  // Inscription au registre des métiers : non. Le formulaire n'a de champ que pour « oui » : la croix est dessinée.
  first.drawText('X', { x: 450.5, y: 197.5, size: 10, font: bold, color: INK })
  // Lieu, date et signature (page 1, cadre du bas).
  if (i.signedAt) {
    set('a19', i.signedAt.place)
    set('a20', fr(i.signedAt.date))
  }
  if (i.signaturePng?.startsWith('data:image/png;base64,')) {
    try {
      const img = await doc.embedPng(Buffer.from(i.signaturePng.split(',')[1], 'base64'))
      const h = 26
      const w = Math.min(200, (img.width / img.height) * h)
      first.drawImage(img, { x: 330, y: 34, width: w, height: (w / ((img.width / img.height) * h)) * h })
    } catch {
      /* signature illisible : le propriétaire signe à la main */
    }
  }
  form.updateFieldAppearances(font)
  const missing = [i.siret ? null : 'le SIRET', i.signaturePng ? null : 'votre signature'].filter(Boolean)
  stamp(first, bold, missing.length ? `Pré-remplie par Bailio : vérifiez, ajoutez ${missing.join(' et ')}.` : 'Pré-remplie par Bailio : relisez avant de l’envoyer.')
  return doc.save()
}
