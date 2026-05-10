import { Router, Request, Response } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()
router.use(authenticate)

// GET /georisques/property/:propertyId
// Retourne les risques Géorisques pour un bien (via ses coordonnées GPS ou code postal)
router.get('/property/:propertyId', async (req: Request, res: Response) => {
  try {
    const property = await prisma.property.findFirst({
      where: {
        id: req.params.propertyId,
        OR: [{ ownerId: req.user!.id }, { bookings: { some: { tenantId: req.user!.id } } }],
      },
      select: { latitude: true, longitude: true, postalCode: true, city: true, address: true },
    })

    if (!property) return res.status(404).json({ success: false, message: 'Bien introuvable' })

    const { latitude, longitude, postalCode, city, address } = property

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Ce bien n\'a pas de coordonnées GPS. Ajoutez une adresse précise pour générer l\'ERRIAL.',
      })
    }

    // Appel API Géorisques v1 — libre d'accès
    const baseUrl = 'https://www.georisques.gouv.fr/api/v1'
    const params = `latlon=${longitude},${latitude}&rayon=200`

    const [sismique, argile, catnat] = await Promise.allSettled([
      fetch(`${baseUrl}/zonage_sismique?${params}`).then(r => r.json()),
      fetch(`${baseUrl}/argiles?${params}`).then(r => r.json()),
      fetch(`${baseUrl}/gaspar/catnat?code_postal=${postalCode}&page=1&page_size=5`).then(r => r.json()),
    ])

    const risks = {
      sismique: sismique.status === 'fulfilled' ? sismique.value : null,
      argile:   argile.status === 'fulfilled'   ? argile.value   : null,
      catnat:   catnat.status === 'fulfilled'   ? catnat.value   : null,
    }

    // Générer le texte ERRIAL (État des Risques et Résiliences)
    const errial = generateERRIAL({ address: `${address}, ${postalCode} ${city}`, risks })

    return res.json({ success: true, data: { risks, errial, address: `${address}, ${postalCode} ${city}` } })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(500).json({ success: false, message: msg })
  }
})

function generateERRIAL(params: { address: string; risks: Record<string, unknown> }): string {
  const lines = [
    'ÉTAT DES RISQUES ET RÉSILIENCES (ERR)',
    `Établi conformément aux articles L125-5 et R125-23 à R125-27 du Code de l\'environnement`,
    '',
    `Bien concerné : ${params.address}`,
    `Date d\'établissement : ${new Date().toLocaleDateString('fr-FR')}`,
    '',
    '--- INFORMATIONS SUR LES RISQUES ---',
    '',
  ]

  const sismique = params.risks.sismique as { data?: Array<{ zone_sismique?: string }> } | null
  if (sismique?.data?.[0]?.zone_sismique) {
    lines.push(`Risque sismique : Zone ${sismique.data[0].zone_sismique}`)
  } else {
    lines.push('Risque sismique : Données non disponibles')
  }

  const argile = params.risks.argile as { data?: Array<{ alea?: string }> } | null
  if (argile?.data?.[0]?.alea) {
    lines.push(`Risque argile (retrait-gonflement) : Aléa ${argile.data[0].alea}`)
  } else {
    lines.push('Risque argile : Données non disponibles')
  }

  const catnat = params.risks.catnat as { data?: Array<{ lib_risque_jo?: string; dat_deb_evt?: string }> } | null
  if (catnat?.data && catnat.data.length > 0) {
    lines.push(`Arrêtés de catastrophe naturelle : ${catnat.data.length} événement(s) recensé(s)`)
    catnat.data.slice(0, 3).forEach(c => {
      lines.push(`  - ${c.lib_risque_jo ?? 'Événement'} (${c.dat_deb_evt?.slice(0, 10) ?? 'date inconnue'})`)
    })
  } else {
    lines.push('Arrêtés de catastrophe naturelle : Aucun recensé')
  }

  lines.push('')
  lines.push('Ce document doit être annexé au contrat de location conformément à la réglementation en vigueur.')
  lines.push('Pour plus d\'informations : www.georisques.gouv.fr')

  return lines.join('\n')
}

export default router
