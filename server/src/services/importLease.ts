import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { Document, Image, Page, renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { z } from 'zod'
import { env } from '../env.js'
import type { DraftData } from '../domain/lease.js'
import { HttpError } from '../lib/http.js'
import { searchAddress } from '../lib/geo.js'

// Ce que l'IA doit lire dans un bail signé. Tout est facultatif : ce qui n'est pas lisible reste vide.
const extractionSchema = z.object({
  isLease: z.boolean().describe("true si le document est bien un contrat de location d'habitation"),
  type: z.enum(['UNFURNISHED', 'FURNISHED']).nullable().describe('UNFURNISHED = location vide (nue), FURNISHED = meublée'),
  property: z.object({
    address: z.string().nullable().describe('Adresse complète du logement loué'),
    surface: z.number().nullable().describe('Surface habitable en m²'),
    rooms: z.number().int().nullable().describe('Nombre de pièces principales'),
    dpeClass: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G']).nullable(),
  }),
  landlord: z.object({
    firstName: z.string().nullable(),
    lastName: z.string().nullable(),
    address: z.string().nullable().describe('Domicile du bailleur'),
  }),
  tenants: z.array(z.object({ firstName: z.string().nullable(), lastName: z.string().nullable(), email: z.string().nullable() })),
  rent: z.object({
    rentEuros: z.number().nullable().describe('Loyer mensuel hors charges, en euros'),
    chargesEuros: z.number().nullable().describe('Provision ou forfait de charges mensuel, en euros'),
    depositEuros: z.number().nullable().describe('Dépôt de garantie, en euros'),
    startDate: z.string().nullable().describe("Date de prise d'effet au format AAAA-MM-JJ"),
    paymentDay: z.number().int().nullable().describe('Jour du mois où le loyer est payé (1 à 28)'),
  }),
})
type Extraction = z.infer<typeof extractionSchema>

const SYSTEM = `Tu lis des contrats de location d'habitation français (loi du 6 juillet 1989) pour un propriétaire bailleur.
Extrais uniquement ce qui est écrit dans le document. N'invente rien : si une information est absente, illisible ou ambiguë, renvoie null.
Les montants sont en euros, sans symbole. Les dates au format AAAA-MM-JJ.`

export interface UploadedFile {
  buffer: Buffer
  mimetype: string
  originalname: string
}

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png'])

export function importAvailable(): boolean {
  return Boolean(env.ANTHROPIC_API_KEY)
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

export async function extractLease(files: UploadedFile[]): Promise<Extraction> {
  if (!env.ANTHROPIC_API_KEY) throw new HttpError(503, "La lecture automatique n'est pas encore disponible.")
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const content: Anthropic.Beta.BetaContentBlockParam[] = files.map((f) =>
    f.mimetype === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.buffer.toString('base64') } }
      : { type: 'image', source: { type: 'base64', media_type: f.mimetype as 'image/jpeg' | 'image/png', data: f.buffer.toString('base64') } },
  )
  content.push({ type: 'text', text: 'Voici le bail. Extrais les informations demandées.' })

  const response = await client.beta.messages.parse({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: betaZodOutputFormat(extractionSchema) },
    messages: [{ role: 'user', content }],
  })

  if (response.stop_reason === 'refusal' || !response.parsed_output) {
    throw new HttpError(422, "Nous n'avons pas pu lire ce document. Essayez avec une photo plus nette ou un PDF.")
  }
  if (!response.parsed_output.isLease) {
    throw new HttpError(422, "Ce document ne ressemble pas à un bail d'habitation.")
  }
  return response.parsed_output
}

const toCents = (euros: number | null) => (euros === null || euros < 0 ? undefined : Math.round(euros * 100))
const orUndef = <T,>(v: T | null) => (v === null ? undefined : v)

/** Convertit la lecture de l'IA en données de brouillon ; l'adresse est rapprochée de la Base Adresse Nationale. */
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
  const startOk = x.rent.startDate && /^\d{4}-\d{2}-\d{2}$/.test(x.rent.startDate)
  const day = x.rent.paymentDay
  return {
    source: 'import',
    type: orUndef(x.type),
    property,
    landlord: { firstName: orUndef(x.landlord.firstName), lastName: orUndef(x.landlord.lastName), address: orUndef(x.landlord.address) },
    tenants: x.tenants.map((t) => ({ firstName: orUndef(t.firstName), lastName: orUndef(t.lastName), email: orUndef(t.email) })),
    rent: {
      rentCents: toCents(x.rent.rentEuros),
      chargesCents: toCents(x.rent.chargesEuros) ?? 0,
      depositCents: toCents(x.rent.depositEuros),
      startDate: startOk ? x.rent.startDate! : undefined,
      paymentDay: day && day >= 1 && day <= 28 ? day : 5,
    },
  }
}
