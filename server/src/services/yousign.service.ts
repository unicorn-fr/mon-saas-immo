/**
 * Yousign API v3 — Service d'intégration
 * Documentation : https://developers.yousign.com/reference
 *
 * Variables d'environnement requises :
 *   YOUSIGN_API_KEY=...
 *   YOUSIGN_WEBHOOK_SECRET=...
 *   YOUSIGN_SANDBOX=true|false
 */

import { createHmac, timingSafeEqual } from 'crypto'

const BASE_URL = process.env.YOUSIGN_SANDBOX === 'false'
  ? 'https://api.yousign.app/v3'
  : 'https://api-sandbox.yousign.app/v3'

function getApiKey(): string {
  const key = process.env.YOUSIGN_API_KEY
  if (!key) throw new Error('YOUSIGN_API_KEY manquant dans les variables d\'environnement')
  return key
}

async function apiGet<T>(path: string): Promise<T> {
  const key = getApiKey()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Yousign GET ${path} → ${res.status}: ${body}`)
  }
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const key = getApiKey()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Yousign POST ${path} → ${res.status}: ${txt}`)
  }
  return res.json() as Promise<T>
}

async function apiPostForm<T>(path: string, formData: FormData): Promise<T> {
  const key = getApiKey()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: formData,
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Yousign POST (form) ${path} → ${res.status}: ${txt}`)
  }
  return res.json() as Promise<T>
}

export interface YousignSigner {
  email: string
  firstName: string
  lastName: string
  role: 'SIGNER'
  signatureLevel?: 'electronic_signature' | 'advanced_electronic_signature'
  signatureAuthenticationMode?: 'no_otp' | 'otp_email' | 'otp_sms'
  phone?: string
}

export interface YousignSignatureRequest {
  id: string
  status: 'draft' | 'ongoing' | 'done' | 'deleted' | 'expired' | 'canceled'
  name: string
  signers: Array<{
    id: string
    email: string
    status: 'initiated' | 'notified' | 'verified' | 'processing' | 'done' | 'refused'
    signatureLink?: string
    signedAt?: string
  }>
  documents: Array<{ id: string; nature: string }>
  expirationDate?: string
  completedAt?: string
}

/**
 * Crée une demande de signature Yousign et retourne les liens de signature
 * Flow : create → upload document → add signers → activate
 */
export async function createSignatureRequest(params: {
  name: string
  pdfBuffer: Buffer
  filename: string
  signers: YousignSigner[]
  expiresInDays?: number
  webhookUrl?: string
  redirectUrls?: { owner?: string; tenant?: string }
}): Promise<{ requestId: string; ownerLink: string; tenantLink: string }> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (params.expiresInDays ?? 30))

  // 1. Créer la demande
  const request = await apiPost<{ id: string }>('/signature_requests', {
    name: params.name,
    delivery_mode: 'email',
    timezone: 'Europe/Paris',
    expiration_date: expiresAt.toISOString(),
    ...(params.webhookUrl && {
      webhook_subscriptions: [
        { url: params.webhookUrl, event: 'signature_request.completed', method: 'POST' },
        { url: params.webhookUrl, event: 'signature_request.signer.done', method: 'POST' },
      ]
    }),
  })

  // 2. Uploader le document
  const formData = new FormData()
  formData.append('file', new Blob([params.pdfBuffer], { type: 'application/pdf' }), params.filename)
  formData.append('nature', 'signable_document')
  formData.append('parse_anchors', 'false')

  const document = await apiPostForm<{ id: string }>(`/signature_requests/${request.id}/documents`, formData)

  // 3. Ajouter les signataires
  const signerLinks: Record<string, string> = {}
  for (const signer of params.signers) {
    const signerPayload: Record<string, unknown> = {
      info: {
        email: signer.email,
        first_name: signer.firstName,
        last_name: signer.lastName,
        ...(signer.phone && { phone_number: signer.phone }),
      },
      signature_level: signer.signatureLevel ?? 'electronic_signature',
      signature_authentication_mode: signer.signatureAuthenticationMode ?? 'otp_email',
      fields: [
        {
          document_id: document.id,
          type: 'signature',
          page: 1,
          width: 180,
          height: 60,
          x: 370,
          y: 700,
        }
      ],
    }

    const addedSigner = await apiPost<{ signature_link?: string }>(`/signature_requests/${request.id}/signers`, signerPayload)
    signerLinks[signer.email] = addedSigner.signature_link ?? ''
  }

  // 4. Activer (envoie les emails aux signataires)
  await apiPost(`/signature_requests/${request.id}/activate`, {})

  // Re-fetch pour avoir les signature_links à jour
  const activated = await apiGet<YousignSignatureRequest>(`/signature_requests/${request.id}`)

  const ownerSigner = activated.signers.find(s => s.email === params.signers[0].email)
  const tenantSigner = activated.signers.find(s => s.email === params.signers[1].email)

  return {
    requestId: request.id,
    ownerLink: ownerSigner?.signatureLink ?? signerLinks[params.signers[0].email] ?? '',
    tenantLink: tenantSigner?.signatureLink ?? signerLinks[params.signers[1].email] ?? '',
  }
}

/** Récupère le statut d'une demande de signature */
export async function getSignatureRequest(requestId: string): Promise<YousignSignatureRequest> {
  return apiGet<YousignSignatureRequest>(`/signature_requests/${requestId}`)
}

/** Télécharge le PDF signé (après status = 'done') */
export async function downloadSignedDocument(requestId: string): Promise<Buffer> {
  const req = await apiGet<YousignSignatureRequest>(`/signature_requests/${requestId}`)
  const doc = req.documents[0]
  if (!doc) throw new Error('Aucun document dans la demande Yousign')

  const key = getApiKey()
  const res = await fetch(
    `${BASE_URL}/signature_requests/${requestId}/documents/${doc.id}/download`,
    { headers: { Authorization: `Bearer ${key}` } }
  )
  if (!res.ok) {
    throw new Error(`Yousign download → ${res.status}: ${await res.text()}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/** Annule une demande de signature (ex: contrat résilié) */
export async function cancelSignatureRequest(requestId: string, reason?: string): Promise<void> {
  await apiPost(`/signature_requests/${requestId}/cancel`, {
    reason: reason ?? 'Demande annulée par le bailleur.',
  })
}

/**
 * Vérifie la signature HMAC du webhook Yousign
 * Retourne true si le payload est authentique
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const secret = process.env.YOUSIGN_WEBHOOK_SECRET
  if (!secret) return false
  const expected = createHmac('sha256', secret).update(payload).digest('hex')
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length) return false
  return timingSafeEqual(sigBuf, expBuf)
}
