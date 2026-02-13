import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create Admin User
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@immoparticuliers.fr' },
    update: {},
    create: {
      email: 'admin@immoparticuliers.fr',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'ImmoParticuliers',
      role: 'ADMIN',
      emailVerified: true,
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create Owner User
  const ownerPassword = await bcrypt.hash('owner123', 10)
  const owner = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: ownerPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'OWNER',
      phone: '0601020304',
      emailVerified: true,
    },
  })
  console.log('✅ Owner created:', owner.email)

  // Create Tenant User
  const tenantPassword = await bcrypt.hash('tenant123', 10)
  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@example.com' },
    update: {},
    create: {
      email: 'tenant@example.com',
      password: tenantPassword,
      firstName: 'Marie',
      lastName: 'Martin',
      role: 'TENANT',
      phone: '0605060708',
      emailVerified: true,
    },
  })
  console.log('✅ Tenant created:', tenant.email)

  // Create Sample Properties
  const property1 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: 'Appartement T3 lumineux - Centre ville',
      description: 'Magnifique appartement de 65m² situé au cœur du centre-ville. Entièrement rénové, il dispose de 2 chambres spacieuses, un salon lumineux avec balcon, une cuisine équipée moderne et une salle de bain avec douche italienne. Proche de toutes commodités (transports, commerces, écoles).',
      type: 'APARTMENT',
      status: 'AVAILABLE',
      address: '15 Rue de la République',
      city: 'Lyon',
      postalCode: '69002',
      country: 'France',
      latitude: 45.7578,
      longitude: 4.8320,
      bedrooms: 2,
      bathrooms: 1,
      surface: 65,
      floor: 3,
      totalFloors: 5,
      furnished: true,
      price: 950,
      charges: 80,
      deposit: 1900,
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
      hasParking: false,
      hasBalcony: true,
      hasElevator: true,
      hasGarden: false,
      amenities: ['wifi', 'dishwasher', 'washing_machine'],
      publishedAt: new Date(),
    },
  })
  console.log('✅ Property 1 created:', property1.title)

  const property2 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: 'Studio cosy - Quartier étudiant',
      description: 'Charmant studio de 25m² idéalement situé dans le quartier étudiant. Parfait pour un étudiant ou jeune actif. Cuisine équipée, salle d\'eau, nombreux rangements. À 5min à pied du métro et des universités.',
      type: 'STUDIO',
      status: 'AVAILABLE',
      address: '42 Avenue Jean Jaurès',
      city: 'Lyon',
      postalCode: '69007',
      country: 'France',
      latitude: 45.7340,
      longitude: 4.8357,
      bedrooms: 0,
      bathrooms: 1,
      surface: 25,
      floor: 2,
      totalFloors: 4,
      furnished: true,
      price: 550,
      charges: 50,
      deposit: 1100,
      images: ['https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800'],
      hasParking: false,
      hasBalcony: false,
      hasElevator: false,
      hasGarden: false,
      amenities: ['wifi', 'microwave'],
      publishedAt: new Date(),
    },
  })
  console.log('✅ Property 2 created:', property2.title)

  const property3 = await prisma.property.create({
    data: {
      ownerId: owner.id,
      title: 'Maison avec jardin - Banlieue',
      description: 'Belle maison individuelle de 120m² avec jardin de 300m². Comprend 4 chambres, 2 salles de bain, un grand salon-séjour, une cuisine équipée et un garage. Quartier calme et familial, proche des écoles et commerces.',
      type: 'HOUSE',
      status: 'AVAILABLE',
      address: '8 Impasse des Lilas',
      city: 'Villeurbanne',
      postalCode: '69100',
      country: 'France',
      latitude: 45.7667,
      longitude: 4.8800,
      bedrooms: 4,
      bathrooms: 2,
      surface: 120,
      furnished: false,
      price: 1600,
      charges: 100,
      deposit: 3200,
      images: ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'],
      hasParking: true,
      hasBalcony: false,
      hasElevator: false,
      hasGarden: true,
      amenities: ['wifi', 'dishwasher', 'washing_machine', 'garden'],
      publishedAt: new Date(),
    },
  })
  console.log('✅ Property 3 created:', property3.title)

  console.log('\n🎉 Seeding completed successfully!')
  console.log('\n📝 Test Accounts:')
  console.log('Admin: admin@immoparticuliers.fr / admin123')
  console.log('Owner: owner@example.com / owner123')
  console.log('Tenant: tenant@example.com / tenant123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
