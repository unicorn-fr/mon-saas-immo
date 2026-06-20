import { prisma } from '../config/database.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface KitResult {
  leboncoin: string
  facebook: string
  pap: string
  whatsapp: string
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    STUDIO: 'Studio',
    LOFT: 'Loft',
    DUPLEX: 'Duplex',
    ROOM: 'Chambre',
    PARKING: 'Parking',
    COMMERCIAL: 'Local commercial',
    OTHER: 'Logement',
  }
  return map[type] ?? type
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return 'Immédiate'
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date)
}

function truncate(text: string | null | undefined, maxLen: number): string {
  if (!text) return ''
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 3) + '...'
}

function buildFeatureList(p: {
  hasParking?: boolean | null
  hasBalcony?: boolean | null
  hasGarden?: boolean | null
  hasElevator?: boolean | null
  furnished?: boolean | null
}): string[] {
  const features: string[] = []
  if (p.furnished) features.push('Meublé')
  if (p.hasParking) features.push('Parking')
  if (p.hasBalcony) features.push('Balcon')
  if (p.hasGarden) features.push('Jardin')
  if (p.hasElevator) features.push('Ascenseur')
  return features
}

// ─── Service ─────────────────────────────────────────────────────────────────

export async function generatePropertyKit(propertyId: string, ownerId: string): Promise<KitResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      ownerId: true,
      title: true,
      type: true,
      city: true,
      postalCode: true,
      surface: true,
      bedrooms: true,
      bathrooms: true,
      price: true,
      charges: true,
      furnished: true,
      hasParking: true,
      hasBalcony: true,
      hasGarden: true,
      hasElevator: true,
      description: true,
      availableFrom: true,
    },
  })

  if (!property) throw new Error('Bien introuvable')
  if (property.ownerId !== ownerId) throw new Error('Accès refusé')

  const typeLbl = typeLabel(property.type)
  const features = buildFeatureList(property)
  const featuresStr = features.length > 0 ? features.join(', ') : 'Aucun équipement spécifique'
  const descShort = truncate(property.description, 500)
  const dispo = formatDate(property.availableFrom)
  const chargesStr = property.charges ? ` + ${property.charges}€ de charges` : ''
  const bedroomsStr = property.bedrooms > 0
    ? `${property.bedrooms} chambre${property.bedrooms > 1 ? 's' : ''}`
    : 'Studio'

  // ── LeBonCoin ───────────────────────────────────────────────────────────
  const leboncoin = [
    property.title,
    '',
    `Type : ${typeLbl}`,
    `Surface : ${property.surface} m²`,
    `Pièces : ${property.bedrooms + 1}`,
    `Chambres : ${bedroomsStr}`,
    `Loyer : ${property.price}€/mois${chargesStr}`,
    `Localisation : ${property.city} (${property.postalCode})`,
    `Meublé : ${property.furnished ? 'Oui' : 'Non'}`,
    `Disponibilité : ${dispo}`,
    `Équipements : ${featuresStr}`,
    '',
    descShort,
  ].join('\n')

  // ── Facebook ─────────────────────────────────────────────────────────────
  const fbFeatures = features.map(f => {
    const icons: Record<string, string> = { Parking: '🚗', Balcon: '🏗️', Jardin: '🌿', Ascenseur: '🛗', Meublé: '🛋️' }
    return `${icons[f] ?? '✅'} ${f}`
  })
  const facebook = [
    `🏠 ${typeLbl} à louer — ${property.city}`,
    '',
    `📍 ${property.city} (${property.postalCode})`,
    `📐 ${property.surface} m² · ${bedroomsStr}`,
    `💰 ${property.price}€/mois${chargesStr}`,
    `📅 Disponible dès le ${dispo}`,
    ...(fbFeatures.length > 0 ? ['', ...fbFeatures] : []),
    '',
    truncate(property.description, 500),
    '',
    '👉 Contactez-moi pour organiser une visite !',
  ].join('\n')

  // ── PAP ──────────────────────────────────────────────────────────────────
  const pap = [
    `${typeLbl} ${property.bedrooms + 1} pièce${property.bedrooms + 1 > 1 ? 's' : ''} à louer — ${property.city}`,
    '',
    `Localisation : ${property.city} ${property.postalCode}`,
    `Surface habitable : ${property.surface} m²`,
    `Nombre de pièces : ${property.bedrooms + 1}`,
    `Nombre de chambres : ${property.bedrooms}`,
    `Loyer mensuel : ${property.price} €${chargesStr}`,
    `Logement ${property.furnished ? 'meublé' : 'vide'}`,
    `Disponibilité : ${dispo}`,
    ...(features.length > 0 ? [`Équipements : ${featuresStr}`] : []),
    '',
    'Description :',
    descShort,
  ].join('\n')

  // ── WhatsApp ─────────────────────────────────────────────────────────────
  const whatsapp = [
    `${typeLbl} ${property.surface}m² — ${property.city}`,
    `${bedroomsStr} · ${property.furnished ? 'Meublé' : 'Vide'}`,
    `${property.price}€/mois${chargesStr}`,
    `Dispo : ${dispo}`,
    ...(features.length > 0 ? [features.join(' · ')] : []),
  ].join('\n')

  return { leboncoin, facebook, pap, whatsapp }
}
