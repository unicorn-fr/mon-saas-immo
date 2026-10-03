import { randomInt } from 'node:crypto'
import sharp from 'sharp'
import { Router, type Request } from 'express'
import { z } from 'zod'
import type { Prisma, SignatureRequest, Signer, User } from '@prisma/client'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { HttpError } from '../lib/http.js'
import { layout, sendEmail } from '../lib/email.js'
import { clientIp, limitPerVisitor } from '../lib/rateLimit.js'
import { hashToken, newToken, sha256 } from '../lib/tokens.js'
import { requireUser } from '../services/session.js'
import { leaseOwned } from '../services/contract.js'
import type { ContractInput } from '../domain/contract.js'
import { CODE_ATTEMPTS, CODE_MINUTES, LINK_DAYS, READ_AND_APPROVED, SIGN_WINDOW_MINUTES, linkExpiry, maskEmail, mentionMatches } from '../domain/esign.js'
import type { CertificateData } from '../pdf/certificate.js'
import type { SignatureMark } from '../pdf/contract.js'
import { renderLeasePdf } from '../services/annexes.js'
import { cautionMention, renderGuaranteePdf } from '../pdf/guarantee.js'
import { landlordName, personName, propertyAddress } from '../pdf/labels.js'
import { activateLease, assertReadyToSign } from './leases.js'
import { sendPdf } from './helpers.js'

/**
 * Signature électronique d'un bail, sans prestataire extérieur :
 * 1. le propriétaire lance la signature : le contrat est figé, son empreinte SHA-256 enregistrée ;
 * 2. chaque signataire reçoit un lien personnel, puis un code à usage unique à son adresse email ;
 * 3. il relit le document, recopie la mention, dessine sa signature ;
 * 4. une fois tous passés, Bailio produit le PDF signé avec un certificat de preuve, envoyé à chacun.
 * Procédé de signature électronique au sens des articles 1366 et 1367 du Code civil.
 */
const router = Router()

type Hashes = { lease: string; leaseFile: string; guarantees: Record<string, { hash: string; file: string }>; amendment?: boolean }
type RequestWithSigners = SignatureRequest & { signers: Signer[] }

const ROLE_LABEL: Record<string, string> = { LANDLORD: 'Bailleur', TENANT: 'Locataire', GUARANTOR: 'Caution' }
const signUrl = (token: string) => `${env.CLIENT_URL}/signer/${encodeURIComponent(token)}`
const contractOf = (r: SignatureRequest) => r.snapshot as unknown as ContractInput

async function storePdf(userId: string, name: string, pdf: Buffer): Promise<string> {
  const row = await prisma.fileBlob.create({ data: { userId, name, mimeType: 'application/pdf', sizeBytes: pdf.length, data: new Uint8Array(pdf) } })
  return row.id
}

async function invite(signer: Signer, token: string, c: ContractInput, landlord: string, amendment = false) {
  const what = signer.role === 'GUARANTOR' ? 'l’acte de cautionnement du bail' : amendment ? 'la nouvelle version du bail (avenant)' : 'le bail'
  const mail = layout({
    title: 'Un bail vous attend pour signature.',
    paragraphs: [
      `Bonjour ${signer.name},`,
      `${landlord} vous invite à signer électroniquement ${what} du logement situé ${propertyAddress(c.property)}.`,
      `Le lien ci-dessous vous est personnel et reste valable ${LINK_DAYS} jours. Vous pourrez relire le document en entier, puis recevoir un code à six chiffres à cette adresse pour confirmer votre identité.`,
      'La signature électronique a la même valeur qu’une signature sur papier (article 1367 du Code civil). Si vous ne vous attendiez pas à ce message, ignorez-le.',
    ],
    cta: { label: 'Relire et signer', url: signUrl(token) },
  })
  await sendEmail({ to: signer.email, subject: signer.role === 'GUARANTOR' ? 'Signature de l’acte de cautionnement' : amendment ? 'Signature de l’avenant au bail' : 'Signature du bail', ...mail })
}

const statusView = (r: RequestWithSigners) => ({
  id: r.id,
  status: r.status,
  createdAt: r.createdAt.toISOString(),
  completedAt: r.completedAt?.toISOString() ?? null,
  signers: r.signers
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((s) => ({
      id: s.id,
      role: s.role,
      roleLabel: ROLE_LABEL[s.role],
      name: s.name,
      email: s.email,
      signedAt: s.signedAt?.toISOString() ?? null,
      linkExpiresAt: s.tokenExpiresAt?.toISOString() ?? null,
      linkExpired: Boolean(!s.signedAt && s.tokenExpiresAt && s.tokenExpiresAt < new Date()),
    })),
  amendment: Boolean((r.hashes as unknown as Hashes).amendment),
})

async function currentRequest(leaseId: string) {
  return prisma.signatureRequest.findFirst({ where: { leaseId, status: { in: ['PENDING', 'COMPLETED'] } }, include: { signers: true }, orderBy: { createdAt: 'desc' } })
}

// ── Côté propriétaire ────────────────────────────────────────────────────────

router.get('/leases/:id/esign', requireUser, async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const r = await currentRequest(lease.id)
  res.json({ success: true, data: r ? statusView(r) : null })
})

router.post('/leases/:id/esign', requireUser, async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const amendment = lease.status === 'ACTIVE' && Boolean((lease.data as { dirty?: boolean }).dirty)
  if (lease.status !== 'DRAFT' && !amendment) throw new HttpError(409, lease.status === 'ACTIVE' ? 'Rien à signer : le bail n’a pas changé depuis sa signature.' : 'Ce bail ne peut plus être signé.')
  const c0 = await assertReadyToSign(user, lease)
  const c: ContractInput = { ...c0, terms: { ...c0.terms, signature: { ...c0.terms.signature, mode: 'ELECTRONIC' } } }
  const withoutEmail = [...c.tenants.filter((t) => !t.email).map((t) => personName(t)), ...c.guarantors.filter((g) => !g.email).map((g) => `${personName(g)} (caution)`)]
  if (withoutEmail.length) throw new HttpError(400, `Pour signer en ligne, chaque signataire doit avoir une adresse email. Ajoutez-la pour : ${withoutEmail.join(', ')}.`)

  // Une seule signature en cours par bail : la précédente est annulée.
  await prisma.signatureRequest.updateMany({ where: { leaseId: lease.id, status: 'PENDING' }, data: { status: 'CANCELLED' } })

  const leasePdf = await renderLeasePdf(c, lease.propertyId)
  const hashes: Hashes = { lease: sha256(leasePdf), leaseFile: await storePdf(user.id, 'bail-a-signer.pdf', leasePdf), guarantees: {}, amendment }
  for (const [i, g] of c.guarantors.entries()) {
    const pdf = await renderGuaranteePdf(c, g)
    hashes.guarantees[i] = { hash: sha256(pdf), file: await storePdf(user.id, `caution-a-signer-${i + 1}.pdf`, pdf) }
  }
  const landlordLabel = landlordName(c.landlord) || 'Votre bailleur'
  const people = [
    { role: 'LANDLORD', position: 0, name: landlordLabel, email: c.landlord.email || user.email },
    ...c.tenants.map((t, i) => ({ role: 'TENANT', position: i, name: personName(t), email: t.email! })),
    ...c.guarantors.map((g, i) => ({ role: 'GUARANTOR', position: i, name: personName(g), email: g.email! })),
  ]
  const tokens = people.map(() => newToken())
  const request = await prisma.signatureRequest.create({
    data: {
      userId: user.id,
      leaseId: lease.id,
      snapshot: c as unknown as Prisma.InputJsonObject,
      hashes: hashes as unknown as Prisma.InputJsonObject,
      signers: { create: people.map((p, i) => ({ ...p, tokenHash: hashToken(tokens[i]), tokenExpiresAt: linkExpiry() })) },
    },
    include: { signers: true },
  })
  // Les invitations partent aux locataires et cautions ; le propriétaire signe depuis son espace.
  for (const [i, p] of people.entries()) {
    if (p.role === 'LANDLORD') continue
    const signer = request.signers.find((s) => s.tokenHash === hashToken(tokens[i]))!
    await invite(signer, tokens[i], c, landlordLabel, amendment)
  }
  await prisma.lease.update({ where: { id: lease.id }, data: { data: { ...(lease.data as object), terms: c.terms } as Prisma.InputJsonObject } })
  res.status(201).json({ success: true, data: { ...statusView(request), landlordUrl: `/signer/${encodeURIComponent(tokens[0])}` } })
})

// Lien du propriétaire (un nouveau jeton à chaque fois : seule l'empreinte est conservée).
router.post('/leases/:id/esign/landlord-link', requireUser, async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  const r = await currentRequest(lease.id)
  const me = r?.status === 'PENDING' ? r.signers.find((s) => s.role === 'LANDLORD') : null
  if (!r || !me) throw new HttpError(404, 'Aucune signature en cours.')
  if (me.signedAt) throw new HttpError(409, 'Vous avez déjà signé.')
  const token = newToken()
  await prisma.signer.update({ where: { id: me.id }, data: { tokenHash: hashToken(token), tokenExpiresAt: linkExpiry() } })
  res.json({ success: true, data: { url: `/signer/${encodeURIComponent(token)}` } })
})

router.post('/leases/:id/esign/remind/:signerId', requireUser, async (req, res) => {
  const user = req.user!
  const lease = await leaseOwned(user.id, String(req.params.id))
  const r = await currentRequest(lease.id)
  const signer = r?.status === 'PENDING' ? r.signers.find((s) => s.id === String(req.params.signerId)) : null
  if (!r || !signer || signer.role === 'LANDLORD') throw new HttpError(404, 'Signataire introuvable.')
  if (signer.signedAt) throw new HttpError(409, `${signer.name} a déjà signé.`)
  const token = newToken()
  await prisma.signer.update({ where: { id: signer.id }, data: { tokenHash: hashToken(token), tokenExpiresAt: linkExpiry() } })
  await invite(signer, token, contractOf(r), landlordName(contractOf(r).landlord) || 'Votre bailleur', Boolean((r.hashes as unknown as Hashes).amendment))
  res.json({ success: true, data: { sentTo: signer.email } })
})

router.delete('/leases/:id/esign', requireUser, async (req, res) => {
  const lease = await leaseOwned(req.user!.id, String(req.params.id))
  await prisma.signatureRequest.updateMany({ where: { leaseId: lease.id, status: 'PENDING' }, data: { status: 'CANCELLED' } })
  res.json({ success: true, data: { cancelled: true } })
})

// ── Côté signataire (lien personnel, sans compte) ────────────────────────────

async function signerOf(req: Request): Promise<{ signer: Signer; request: RequestWithSigners }> {
  const token = String(req.params.token ?? '')
  const signer = token ? await prisma.signer.findUnique({ where: { tokenHash: hashToken(token) } }) : null
  if (!signer) throw new HttpError(404, 'Ce lien de signature n’est plus valable. Demandez au propriétaire de vous en renvoyer un.')
  const request = await prisma.signatureRequest.findUnique({ where: { id: signer.requestId }, include: { signers: true } })
  if (!request || request.status === 'CANCELLED') throw new HttpError(410, 'Cette signature a été annulée par le propriétaire. Un nouveau lien vous sera envoyé si besoin.')
  // Lien expiré : seulement pour qui n'a pas encore signé (un signataire garde l'accès à son exemplaire).
  if (!signer.signedAt && signer.tokenExpiresAt && signer.tokenExpiresAt < new Date()) {
    throw new HttpError(410, 'Ce lien de signature a expiré. Demandez au propriétaire de vous en renvoyer un : il le fait en un clic.')
  }
  return { signer, request }
}

const expectedMention = (signer: Signer, c: ContractInput) => (signer.role === 'GUARANTOR' && c.guarantors[signer.position] ? cautionMention(c, c.guarantors[signer.position]) : READ_AND_APPROVED)

router.get('/esign/:token', limitPerVisitor(5, 60), async (req, res) => {
  const { signer, request } = await signerOf(req)
  const c = contractOf(request)
  res.json({
    success: true,
    data: {
      role: signer.role,
      roleLabel: ROLE_LABEL[signer.role],
      name: signer.name,
      email: maskEmail(signer.email),
      document: signer.role === 'GUARANTOR' ? 'Acte de cautionnement' : (request.hashes as unknown as Hashes).amendment ? 'Avenant au contrat de location' : 'Contrat de location',
      landlord: landlordName(c.landlord),
      property: propertyAddress(c.property),
      mention: expectedMention(signer, c),
      codeVerified: Boolean(signer.codeVerifiedAt && Date.now() - signer.codeVerifiedAt.getTime() < SIGN_WINDOW_MINUTES * 60_000),
      photoAt: signer.photoAt?.toISOString() ?? null,
      signedAt: signer.signedAt?.toISOString() ?? null,
      completed: request.status === 'COMPLETED',
      others: request.signers.filter((s) => s.id !== signer.id).map((s) => ({ roleLabel: ROLE_LABEL[s.role], name: s.name, signed: Boolean(s.signedAt) })),
    },
  })
})

router.get('/esign/:token/document.pdf', limitPerVisitor(5, 60), async (req, res) => {
  const { signer, request } = await signerOf(req)
  const h = request.hashes as unknown as Hashes
  const fileId = signer.role === 'GUARANTOR' ? h.guarantees[signer.position]?.file : h.leaseFile
  if (request.status === 'COMPLETED' && request.signedDocumentId) {
    const doc = await prisma.document.findUnique({ where: { id: request.signedDocumentId } })
    if (doc?.file && signer.role !== 'GUARANTOR') return sendPdf(res, Buffer.from(doc.file), 'bail-signe.pdf', req.query.download === '1')
  }
  const blob = fileId ? await prisma.fileBlob.findUnique({ where: { id: fileId } }) : null
  if (!blob) throw new HttpError(404, 'Document introuvable.')
  sendPdf(res, Buffer.from(blob.data), signer.role === 'GUARANTOR' ? 'acte-de-caution.pdf' : 'bail.pdf', req.query.download === '1')
})

router.post('/esign/:token/code', limitPerVisitor(10, 6), async (req, res) => {
  const { signer, request } = await signerOf(req)
  if (signer.signedAt || request.status !== 'PENDING') throw new HttpError(409, 'Ce document est déjà signé.')
  if (signer.codeExpiresAt && signer.codeExpiresAt.getTime() - (CODE_MINUTES - 1) * 60_000 > Date.now()) throw new HttpError(429, 'Un code vient de vous être envoyé. Patientez une minute avant d’en demander un autre.')
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0')
  await prisma.signer.update({ where: { id: signer.id }, data: { codeHash: hashToken(`${signer.id}:${code}`), codeExpiresAt: new Date(Date.now() + CODE_MINUTES * 60_000), codeAttempts: 0 } })
  const mail = layout({
    title: `Votre code de signature : ${code}`,
    paragraphs: [`Bonjour ${signer.name},`, `Saisissez ce code sur la page de signature : ${code}. Il est valable ${CODE_MINUTES} minutes.`, 'Ne le communiquez à personne : il confirme que c’est bien vous qui signez.'],
  })
  await sendEmail({ to: signer.email, subject: `Code de signature : ${code}`, ...mail })
  res.json({ success: true, data: { sentTo: maskEmail(signer.email), minutes: CODE_MINUTES } })
})

router.post('/esign/:token/verify', limitPerVisitor(10, 20), async (req, res) => {
  const { signer } = await signerOf(req)
  const { code } = z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Le code compte 6 chiffres.') }).parse(req.body)
  if (!signer.codeHash || !signer.codeExpiresAt || signer.codeExpiresAt.getTime() < Date.now()) throw new HttpError(400, 'Ce code a expiré. Demandez-en un nouveau.')
  if (signer.codeAttempts >= CODE_ATTEMPTS) throw new HttpError(429, 'Trop d’essais. Demandez un nouveau code.')
  if (hashToken(`${signer.id}:${code}`) !== signer.codeHash) {
    await prisma.signer.update({ where: { id: signer.id }, data: { codeAttempts: { increment: 1 } } })
    throw new HttpError(400, `Code incorrect. Il vous reste ${CODE_ATTEMPTS - signer.codeAttempts - 1} essai${CODE_ATTEMPTS - signer.codeAttempts - 1 > 1 ? 's' : ''}.`)
  }
  await prisma.signer.update({ where: { id: signer.id }, data: { codeVerifiedAt: new Date(), codeHash: null } })
  res.json({ success: true, data: { verified: true } })
})

/**
 * Photo du signataire, prise avec l'appareil photo au moment de signer : réencodée (sans données de localisation
 * ni métadonnées), horodatée par le serveur et identifiée par son empreinte. Elle figure dans le certificat de preuve.
 */
router.post('/esign/:token/photo', limitPerVisitor(10, 10), async (req, res) => {
  const { signer, request } = await signerOf(req)
  if (signer.signedAt || request.status !== 'PENDING') throw new HttpError(409, 'Ce document est déjà signé.')
  if (!signer.codeVerifiedAt || Date.now() - signer.codeVerifiedAt.getTime() > SIGN_WINDOW_MINUTES * 60_000) throw new HttpError(400, 'Confirmez d’abord votre identité avec le code reçu par email.')
  const { photo } = z.object({ photo: z.string().max(8_000_000).regex(/^data:image\/(jpeg|png|webp);base64,/, 'Photo invalide.') }).parse(req.body)
  let jpeg: Buffer
  try {
    jpeg = await sharp(Buffer.from(photo.split(',')[1], 'base64'), { limitInputPixels: 40_000_000 }).rotate().resize(640, 640, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 78 }).toBuffer()
  } catch {
    throw new HttpError(400, 'Cette image ne peut pas être lue. Reprenez la photo.')
  }
  const photoAt = new Date()
  await prisma.signer.update({ where: { id: signer.id }, data: { photo: `data:image/jpeg;base64,${jpeg.toString('base64')}`, photoAt, photoHash: sha256(jpeg) } })
  res.json({ success: true, data: { photoAt: photoAt.toISOString() } })
})

router.post('/esign/:token/sign', limitPerVisitor(10, 10), async (req, res) => {
  const { signer, request } = await signerOf(req)
  if (signer.signedAt) throw new HttpError(409, 'Vous avez déjà signé ce document.')
  if (request.status !== 'PENDING') throw new HttpError(409, 'Cette signature est terminée.')
  if (!signer.codeVerifiedAt || Date.now() - signer.codeVerifiedAt.getTime() > SIGN_WINDOW_MINUTES * 60_000) throw new HttpError(400, 'Confirmez d’abord votre identité avec le code reçu par email.')
  const body = z
    .object({
      mention: z.string().trim().min(2).max(3000),
      image: z.string().max(400_000).regex(/^data:image\/png;base64,/, 'Signature invalide.'),
      consent: z.literal(true, { message: 'Cochez la case pour accepter de signer électroniquement.' }),
      /** Photo facultative : le signataire peut choisir de signer sans (c'est indiqué dans le certificat). */
      noPhoto: z.boolean().optional(),
    })
    .parse(req.body)
  if ((!signer.photo || !signer.photoAt) && !body.noPhoto) throw new HttpError(400, 'Prenez-vous en photo, ou choisissez « Signer sans photo ».')
  const c = contractOf(request)
  const expected = expectedMention(signer, c)
  if (!mentionMatches(expected, body.mention)) throw new HttpError(400, signer.role === 'GUARANTOR' ? 'La mention recopiée ne correspond pas au texte demandé. Vérifiez en particulier le montant et la durée.' : `Recopiez la mention « ${READ_AND_APPROVED} ».`)
  await prisma.signer.update({
    where: { id: signer.id },
    data: { mention: body.mention, image: body.image, signedAt: new Date(), ip: clientIp(req).slice(0, 80), userAgent: String(req.headers['user-agent'] ?? '').slice(0, 300) },
  })
  const fresh = await prisma.signatureRequest.findUnique({ where: { id: request.id }, include: { signers: true } })
  if (fresh && fresh.signers.every((s) => s.signedAt)) await complete(fresh)
  res.json({ success: true, data: { signed: true, completed: Boolean(fresh?.signers.every((s) => s.signedAt)) } })
})

// ── Finalisation : PDF signés + certificat, bail activé, exemplaires envoyés ──

async function complete(r: RequestWithSigners) {
  const claimed = await prisma.signatureRequest.updateMany({ where: { id: r.id, status: 'PENDING' }, data: { status: 'COMPLETED', completedAt: new Date() } })
  if (!claimed.count) return
  try {
    await finalize(r)
  } catch (e) {
    // Rien n'est perdu : les signatures restent enregistrées, la finalisation sera retentée.
    await prisma.signatureRequest.update({ where: { id: r.id }, data: { status: 'PENDING', completedAt: null } })
    throw e
  }
}

async function finalize(r: RequestWithSigners) {
  const completedAt = new Date()
  const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(completedAt)
  const c0 = contractOf(r)
  // « Fait à …, le … » : date à laquelle la dernière partie a signé.
  const c: ContractInput = { ...c0, terms: { ...c0.terms, signature: { ...c0.terms.signature, date: today, mode: 'ELECTRONIC' } } }
  const h = r.hashes as unknown as Hashes
  const mark = (s?: Signer): SignatureMark | undefined => (s?.signedAt ? { image: s.image, mention: s.mention, signedAt: s.signedAt.toISOString() } : undefined)
  const cert = (title: string, hash: string, signers: Signer[]): CertificateData => ({
    requestId: r.id,
    documentTitle: title,
    documentHash: hash,
    createdAt: r.createdAt.toISOString(),
    completedAt: completedAt.toISOString(),
    signers: signers.map((s) => ({ role: ROLE_LABEL[s.role], name: s.name, email: s.email, codeVerifiedAt: s.codeVerifiedAt?.toISOString() ?? null, signedAt: s.signedAt?.toISOString() ?? null, ip: s.ip, userAgent: s.userAgent, mention: s.mention, photo: s.photo, photoAt: s.photoAt?.toISOString() ?? null, photoHash: s.photoHash })),
  })
  const landlord = r.signers.find((s) => s.role === 'LANDLORD')
  const tenants = r.signers.filter((s) => s.role === 'TENANT').sort((a, b) => a.position - b.position)
  const leaseSigners = [landlord, ...tenants].filter((s): s is Signer => Boolean(s))
  const leaseRow = await prisma.lease.findUnique({ where: { id: r.leaseId }, select: { propertyId: true } })
  const leasePdf = await renderLeasePdf(c, leaseRow?.propertyId, { landlord: mark(landlord), tenants: c.tenants.map((_, i) => mark(tenants.find((t) => t.position === i))), certificate: cert(h.amendment ? 'Contrat de location, nouvelle version (avenant)' : 'Contrat de location', h.lease, leaseSigners) })
  const guarantees = new Map<number, Buffer>()
  for (const g of r.signers.filter((s) => s.role === 'GUARANTOR')) {
    const gf = c.guarantors[g.position]
    if (!gf) continue
    guarantees.set(g.position, await renderGuaranteePdf(c, gf, { guarantor: mark(g), landlord: mark(landlord), certificate: cert('Acte de cautionnement', h.guarantees[g.position]?.hash ?? '', [g]) }))
  }

  const user = (await prisma.user.findUnique({ where: { id: r.userId } })) as User
  const lease = await leaseOwned(user.id, r.leaseId)
  await activateLease(user, lease, c, { leasePdf, guarantees })
  const signedDoc = await prisma.document.findFirst({ where: { leaseId: lease.id, kind: 'LEASE' }, orderBy: { version: 'desc' } })
  await prisma.signatureRequest.update({ where: { id: r.id }, data: { signedDocumentId: signedDoc?.id ?? null } })

  // Un exemplaire signé pour chacun (il vaut original : Code civil, art. 1375).
  const address = propertyAddress(c.property)
  for (const s of r.signers) {
    const pdf = s.role === 'GUARANTOR' ? guarantees.get(s.position) : leasePdf
    if (!pdf) continue
    const mail = layout({
      title: 'Le bail est signé.',
      paragraphs: [`Bonjour ${s.name},`, `Toutes les parties ont signé ${s.role === 'GUARANTOR' ? 'l’acte de cautionnement' : 'le bail'} du logement situé ${address}.`, 'Votre exemplaire signé est en pièce jointe, avec le certificat de signature en dernière page. Conservez-le : il vaut original.'],
    })
    await sendEmail({ to: s.email, subject: s.role === 'GUARANTOR' ? 'Acte de cautionnement signé' : 'Bail signé', ...mail, attachments: [{ filename: s.role === 'GUARANTOR' ? 'acte-de-caution-signe.pdf' : 'bail-signe.pdf', content: pdf }] }).catch((e) =>
      console.error('[signature] envoi de l’exemplaire signé impossible', s.email, e),
    )
  }
}

export default router
