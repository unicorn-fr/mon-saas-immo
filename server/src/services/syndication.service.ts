import { Property, PropertySyndication } from '@prisma/client'
import { prisma } from '../config/database.js'

// ─── Adapter Interface ────────────────────────────────────────────────────────

export interface SyndicationAdapter {
  platform: string
  publish(property: Property, options?: Record<string, unknown>): Promise<{ externalId: string; externalUrl: string }>
  unpublish(externalId: string): Promise<void>
  updateListing(externalId: string, property: Property): Promise<void>
  checkStatus(externalId: string): Promise<'PUBLISHED' | 'FAILED' | 'PAUSED'>
}

// ─── Stub Adapters ────────────────────────────────────────────────────────────

export class LeBonCoinAdapter implements SyndicationAdapter {
  platform = 'leboncoin'

  async publish(property: Property): Promise<{ externalId: string; externalUrl: string }> {
    console.log(`[Syndication][leboncoin] Stub: partnership API not yet active — property ${property.id}`)
    const stubId = `lbc-stub-${property.id.slice(0, 8)}`
    return {
      externalId: stubId,
      externalUrl: `https://www.leboncoin.fr/locations/${stubId}`,
    }
  }

  async unpublish(externalId: string): Promise<void> {
    console.log(`[Syndication][leboncoin] Stub: partnership API not yet active — unpublish ${externalId}`)
  }

  async updateListing(externalId: string, property: Property): Promise<void> {
    console.log(`[Syndication][leboncoin] Stub: partnership API not yet active — update ${externalId} for property ${property.id}`)
  }

  async checkStatus(_externalId: string): Promise<'PUBLISHED' | 'FAILED' | 'PAUSED'> {
    console.log(`[Syndication][leboncoin] Stub: partnership API not yet active`)
    return 'PAUSED'
  }
}

export class FacebookAdapter implements SyndicationAdapter {
  platform = 'facebook'

  async publish(property: Property): Promise<{ externalId: string; externalUrl: string }> {
    console.log(`[Syndication][facebook] Stub: partnership API not yet active — property ${property.id}`)
    const stubId = `fb-marketplace-stub-${property.id.slice(0, 8)}`
    return {
      externalId: stubId,
      externalUrl: `https://www.facebook.com/marketplace/item/${stubId}`,
    }
  }

  async unpublish(externalId: string): Promise<void> {
    console.log(`[Syndication][facebook] Stub: partnership API not yet active — unpublish ${externalId}`)
  }

  async updateListing(externalId: string, property: Property): Promise<void> {
    console.log(`[Syndication][facebook] Stub: partnership API not yet active — update ${externalId} for property ${property.id}`)
  }

  async checkStatus(_externalId: string): Promise<'PUBLISHED' | 'FAILED' | 'PAUSED'> {
    console.log(`[Syndication][facebook] Stub: partnership API not yet active`)
    return 'PAUSED'
  }
}

export class PapAdapter implements SyndicationAdapter {
  platform = 'pap'

  async publish(property: Property): Promise<{ externalId: string; externalUrl: string }> {
    console.log(`[Syndication][pap] Stub: partnership API not yet active — property ${property.id}`)
    const stubId = `pap-stub-${property.id.slice(0, 8)}`
    return {
      externalId: stubId,
      externalUrl: `https://www.pap.fr/annonce/locations-${stubId}`,
    }
  }

  async unpublish(externalId: string): Promise<void> {
    console.log(`[Syndication][pap] Stub: partnership API not yet active — unpublish ${externalId}`)
  }

  async updateListing(externalId: string, property: Property): Promise<void> {
    console.log(`[Syndication][pap] Stub: partnership API not yet active — update ${externalId} for property ${property.id}`)
  }

  async checkStatus(_externalId: string): Promise<'PUBLISHED' | 'FAILED' | 'PAUSED'> {
    console.log(`[Syndication][pap] Stub: partnership API not yet active`)
    return 'PAUSED'
  }
}

// ─── Adapter Registry ─────────────────────────────────────────────────────────

const ADAPTERS: Record<string, SyndicationAdapter> = {
  leboncoin: new LeBonCoinAdapter(),
  facebook: new FacebookAdapter(),
  pap: new PapAdapter(),
}

const SUPPORTED_PLATFORMS = Object.keys(ADAPTERS)

// ─── Main Functions ───────────────────────────────────────────────────────────

export async function syndicateProperty(propertyId: string, platforms: string[]): Promise<void> {
  // Validate property exists
  const property = await prisma.property.findUnique({ where: { id: propertyId } })
  if (!property) throw new Error('Bien introuvable')

  // Filter to supported platforms only
  const validPlatforms = platforms.filter(p => SUPPORTED_PLATFORMS.includes(p))
  if (validPlatforms.length === 0) {
    throw new Error(`Plateformes non supportées. Plateformes disponibles : ${SUPPORTED_PLATFORMS.join(', ')}`)
  }

  await Promise.all(
    validPlatforms.map(async (platform) => {
      const adapter = ADAPTERS[platform]

      // Check existing syndication record
      const existing = await prisma.propertySyndication.findUnique({
        where: { propertyId_platform: { propertyId, platform } },
      })

      try {
        let externalId: string
        let externalUrl: string

        if (existing?.externalId) {
          // Update existing listing
          await adapter.updateListing(existing.externalId, property)
          externalId = existing.externalId
          externalUrl = existing.externalUrl ?? ''
        } else {
          // Publish new listing
          const result = await adapter.publish(property)
          externalId = result.externalId
          externalUrl = result.externalUrl
        }

        await prisma.propertySyndication.upsert({
          where: { propertyId_platform: { propertyId, platform } },
          create: {
            propertyId,
            platform,
            status: 'DRAFT',
            externalId,
            externalUrl,
            syncedAt: new Date(),
            metadata: {
              stub: true,
              note: 'Partenariat API en attente d\'activation. Publication simulée.',
            },
          },
          update: {
            status: 'DRAFT',
            externalId,
            externalUrl,
            syncedAt: new Date(),
            lastError: null,
            metadata: {
              stub: true,
              note: 'Partenariat API en attente d\'activation. Publication simulée.',
            },
          },
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        await prisma.propertySyndication.upsert({
          where: { propertyId_platform: { propertyId, platform } },
          create: {
            propertyId,
            platform,
            status: 'FAILED',
            lastError: message,
          },
          update: {
            status: 'FAILED',
            lastError: message,
            syncedAt: new Date(),
          },
        })
      }
    })
  )
}

export async function getSyndications(propertyId: string): Promise<PropertySyndication[]> {
  return prisma.propertySyndication.findMany({
    where: { propertyId },
    orderBy: { platform: 'asc' },
  })
}
