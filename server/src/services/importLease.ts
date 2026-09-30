import { Document, Image, Page, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import type { DraftData } from '../domain/lease.js'
import { HttpError } from '../lib/http.js'
import { searchAddress } from '../lib/geo.js'
import { documentText, ocrAvailable, type UploadedFile } from './import/ocr.js'
import { parseLease, type Extraction } from './import/parse.js'

export type { UploadedFile }

/**
 * Import d'un bail déjà signé. Le document est lu **sur nos serveurs**, sans aucun service extérieur :
 * reconnaissance de caractères (Tesseract) puis lecture par règles (services/import/parse.ts).
 * Seule l'adresse du logement est vérifiée auprès de la Base Adresse Nationale (service public).
 */

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png'])

export function importAvailable(): Promise<boolean> {
  return ocrAvailable()
}

/** Un PDF est conservé tel quel ; des photos sont réunies dans un seul PDF A4 (une page par photo, marges de 24 pt). */
export async function toArchivedFile(files: UploadedFile[]): Promise<{ file: Buffer; mime: string; name: string }> {
  if (files.length === 1 && files[0].mimetype === 'application/pdf') {
    return { file: files[0].buffer, mime: 'application/pdf', name: files[0].originalname || 'bail.pdf' }
  }
  const pages = files.map((f, i) =>
    createElement(Page, { key: i, size: 'A4', style: { padding: 24 } },
      createElement(Image, { src: { data: f.buffer, format: f.mimetype === 'image/png' ? 'png' : 'jpg' }, style: { objectFit: 'contain', width: 547, height: 790 } }),
    ),
  )
  const file = await renderToBuffer(createElement(Document, { title: 'Bail signé' }, pages))
  return { file, mime: 'application/pdf', name: 'bail-signe.pdf' }
}

export function validateFiles(files: UploadedFile[]): void {
  if (files.length === 0) throw new HttpError(400, 'Ajoutez une photo ou un PDF de votre bail.')
  const pdfs = files.filter((f) => f.mimetype === 'application/pdf')
  if (pdfs.length > 1 || (pdfs.length === 1 && files.length > 1)) {
    throw new HttpError(400, 'Envoyez un seul PDF, ou bien des photos (une par page).')
  }
  for (const f of files) {
    if (f.mimetype !== 'application/pdf' && !IMAGE_TYPES.has(f.mimetype)) {
      throw new HttpError(400, 'Format non pris en charge. Utilisez une photo (JPEG, PNG) ou un PDF.')
    }
  }
}

/** Nombre d'informations utiles trouvées : en dessous de 2, la lecture n'a rien donné d'exploitable. */
function foundCount(x: Extraction): number {
  return [
    x.type, x.property.address, x.property.surface, x.property.rooms, x.landlord.lastName, x.tenants[0]?.lastName,
    x.rent.rentEuros, x.rent.chargesEuros, x.rent.depositEuros, x.rent.startDate,
  ].filter((v) => v !== null && v !== undefined).length
}

export async function extractLease(files: UploadedFile[]): Promise<Extraction> {
  const { text, scanned } = await documentText(files)
  const extraction = parseLease(text)
  if (!extraction.isLease) {
    if (text.replace(/\s/g, '').length < 300) {
      throw new HttpError(422, scanned
        ? "Nous n'avons pas réussi à lire ces photos. Reprenez-les bien à plat, en pleine lumière, une page par photo."
        : "Nous n'avons pas trouvé de texte dans ce document.")
    }
    throw new HttpError(422, "Ce document ne ressemble pas à un bail d'habitation.")
  }
  if (foundCount(extraction) < 2) {
    throw new HttpError(422, "Nous n'avons pas pu lire ce bail. Essayez avec des photos plus nettes, ou saisissez-le en 4 questions.")
  }
  return extraction
}

const toCents = (euros: number | null) => (euros === null || euros < 0 ? undefined : Math.round(euros * 100))
const orUndef = <T,>(v: T | null) => (v === null ? undefined : v)

/** Convertit la lecture en données de brouillon ; l'adresse est rapprochée de la Base Adresse Nationale. */
export async function extractionToDraft(x: Extraction): Promise<DraftData> {
  let property: DraftData['property'] = {
    address: orUndef(x.property.address),
    surface: orUndef(x.property.surface),
    rooms: orUndef(x.property.rooms),
    dpeClass: orUndef(x.property.dpeClass),
  }
  if (x.property.address) {
    try {
      const [match] = await searchAddress(x.property.address)
      if (match) property = { ...property, address: match.label, postalCode: match.postalCode, city: match.city, inseeCode: match.inseeCode, banId: match.banId }
    } catch {
      // l'adresse lue est conservée telle quelle
    }
  }
  const day = x.rent.paymentDay
  const g = x.guarantor
  return {
    source: 'import',
    type: orUndef(x.type),
    property,
    landlord: { firstName: orUndef(x.landlord.firstName), lastName: orUndef(x.landlord.lastName), address: orUndef(x.landlord.address) },
    tenants: x.tenants.slice(0, 6).map((t) => ({ firstName: orUndef(t.firstName), lastName: orUndef(t.lastName), email: orUndef(t.email) })),
    guarantor: g && (g.firstName || g.lastName) ? { firstName: orUndef(g.firstName), lastName: orUndef(g.lastName), address: orUndef(g.address) } : null,
    rent: {
      rentCents: toCents(x.rent.rentEuros),
      chargesCents: toCents(x.rent.chargesEuros) ?? 0,
      depositCents: toCents(x.rent.depositEuros),
      startDate: orUndef(x.rent.startDate),
      paymentDay: day && day >= 1 && day <= 28 ? day : 5,
    },
  }
}
