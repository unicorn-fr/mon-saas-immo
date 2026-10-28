import { Router } from 'express'
import { z } from 'zod'
import { env } from '../env.js'
import { layout, sendEmail } from '../lib/email.js'
import { HttpError } from '../lib/http.js'
import { limitPerVisitor } from '../lib/rateLimit.js'
import { CONTACT_NEEDS, readPhone } from '../domain/contact.js'

/**
 * Page « Contact » : deux questions, le besoin puis le numéro (ou l'email). La demande part tout de suite par email à
 * l'équipe (FEEDBACK_TO, la boîte lue sur le téléphone), avec un bouton qui appelle le numéro d'un geste.
 * Rien n'est enregistré dans la base.
 */
const router = Router()

const contactSchema = z.object({
  need: z.enum(Object.keys(CONTACT_NEEDS) as [keyof typeof CONTACT_NEEDS, ...Array<keyof typeof CONTACT_NEEDS>]),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.email('Cet email ne semble pas valide.').max(200).optional().nullable(),
  details: z.string().trim().max(1000).optional().nullable(),
  page: z.string().trim().max(200).optional().nullable(),
  // Champ invisible : rempli seulement par les robots.
  website: z.string().max(200).optional().nullable(),
})

router.post('/contact', limitPerVisitor(60, 5), async (req, res) => {
  const body = contactSchema.parse(req.body)
  if (body.website) return res.json({ success: true, data: { sent: true } })
  const phone = body.phone ? readPhone(body.phone) : null
  if (body.phone && !phone) throw new HttpError(400, 'Ce numéro ne semble pas complet. Exemple : 06 12 34 56 78.')
  if (!phone && !body.email) throw new HttpError(400, 'Indiquez un numéro ou un email pour que nous puissions vous répondre.')
  const need = CONTACT_NEEDS[body.need]
  const mail = layout({
    title: phone ? `À rappeler : ${phone.display}` : `À recontacter : ${body.email}`,
    paragraphs: [
      `Besoin : ${need}`,
      body.details ? `Précision : ${body.details}` : '',
      phone ? `Numéro : ${phone.display}` : `Email : ${body.email}`,
      `Page : ${body.page || 'Contact'}`,
    ].filter(Boolean),
    ...(phone ? { cta: { label: `Appeler le ${phone.display}`, url: phone.tel } } : {}),
  })
  await sendEmail({ to: env.FEEDBACK_TO, subject: `${phone ? 'À rappeler' : 'À recontacter'} · ${need} · ${phone?.display ?? body.email}`, ...(body.email ? { replyTo: body.email } : {}), ...mail })
  res.json({ success: true, data: { sent: true } })
})

export default router
