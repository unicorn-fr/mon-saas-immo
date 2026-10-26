/**
 * Compte de démonstration : remplit un compte avec des données fictives (logements, locataires, baux, loyers,
 * dépenses, intervention) pour essayer Bailio comme un vrai propriétaire.
 *
 * Sur le serveur :  ./deploy/vps/demo.sh adresse@exemple.fr
 * En local :        npm --prefix server run demo -- adresse@exemple.fr
 *
 * Tout passe par l'API (mêmes règles et mêmes contrôles qu'à l'écran), avec une session créée pour l'occasion puis
 * fermée. Les locataires et garants ont des adresses @example.com (domaine réservé, jamais distribué) et l'envoi
 * automatique des quittances est coupé : aucun email ne part vers une vraie personne.
 * Refuse un compte qui a déjà des logements (sauf --force), pour ne jamais mélanger avec de vraies données.
 */
import { prisma } from '../db.js'
import { createSession, deleteSession } from '../services/session.js'

const API = process.env.DEMO_API ?? `http://localhost:${process.env.PORT ?? 5000}/api`

async function main() {
  const args = process.argv.slice(2)
  const email = args.find((a) => a.includes('@'))?.trim().toLowerCase()
  const force = args.includes('--force')
  if (!email) throw new Error('Indiquez l’adresse du compte : demo adresse@exemple.fr')

  const user = (await prisma.user.findUnique({ where: { email } })) ?? (await prisma.user.create({ data: { email, emailVerifiedAt: new Date() } }))
  const existing = await prisma.property.count({ where: { userId: user.id } })
  if (existing && !force) throw new Error(`Ce compte a déjà ${existing} logement(s) : rien n’a été ajouté. Relancez avec --force pour ajouter quand même les données de démonstration.`)

  const token = await createSession(user.id)
  const api = async <T = { id: string }>(path: string, method = 'GET', body?: unknown): Promise<T> => {
    const r = await fetch(API + path, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined })
    const j = (await r.json().catch(() => ({}))) as { data?: T; message?: string }
    if (!r.ok) throw new Error(`${method} ${path} : ${r.status} ${j.message ?? ''}`)
    return j.data as T
  }
  const stamp = Date.now().toString(36)
  const fake = (name: string) => `${name}.${stamp}@example.com`

  try {
    // Profil du bailleur : seulement s'il est vide (on ne remplace jamais une identité déjà saisie).
    if (!Object.keys((user.profile as object) ?? {}).length) {
      await api('/profile', 'PUT', { kind: 'PERSON', civility: 'MONSIEUR', firstNames: 'Julien', lastName: 'Fabre', birthDate: '1975-03-14', birthPlace: 'Béziers', address: '5 rue de la Loge', postalCode: '34000', city: 'Montpellier', email, agent: { enabled: false } })
    }

    // 1. Studio meublé loué, bail signé en mai, loyers reçus jusqu'en septembre : octobre en retard.
    const studio = await api('/properties', 'POST', {
      label: 'Studio Écusson',
      address: '12 rue de l’Université, 34000 Montpellier',
      postalCode: '34000',
      city: 'Montpellier',
      habitat: 'COLLECTIVE',
      legalRegime: 'COPRO',
      furnished: true,
      destination: 'HABITATION',
      copro: { syndic: 'Cabinet Rivière (fictif)', extractsProvided: true },
      constructionPeriod: 'BEFORE_1949',
      surface: 28,
      rooms: 1,
      roomList: [{ name: 'Pièce principale' }, { name: 'Salle d’eau' }],
      heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' },
      hotWater: { mode: 'INDIVIDUAL' },
      equipments: ['kitchen', 'hob', 'oven', 'smokeDetector'],
      annexes: [],
      commonAreas: [],
      tv: 'COLLECTIVE',
      internet: 'FIBER',
      fiscalId: '341000000001',
      diagnostics: { dpe: { class: 'D', ges: 'B', date: '2024-03-12', costMin: 520, costMax: 760, costYear: 2023 }, erp: { date: '2026-09-15' }, electricity: { installOver15: true, date: '2024-03-12' }, gas: { hasGas: false } },
      market: { tense: true },
      furniture: { present: ['bedding', 'blackout', 'hob', 'oven', 'fridge', 'dishes', 'utensils', 'table', 'shelves', 'lights', 'cleaning'] },
      smokeDetectors: 1,
      keys: '2 clés, 1 badge',
    })
    const lea = await api('/tenants', 'POST', {
      propertyId: studio.id,
      civility: 'MADAME',
      firstNames: 'Léa',
      lastName: 'Morel',
      birthDate: '2002-09-21',
      birthPlace: 'Perpignan',
      email: fake('lea.morel'),
      phone: '0600000001',
      situation: 'STUDENT',
      living: 'ALONE',
      guarantee: 'CAUTION',
      guarantor: { civility: 'MADAME', firstNames: 'Sophie', lastName: 'Morel', address: '3 avenue des Platanes, 66000 Perpignan', email: fake('sophie.morel'), engagement: 'SOLIDAIRE', duration: 'FIXED', until: '2029-05-01', maxCents: 1500000, signMode: 'ELECTRONIC' },
    })
    const studioLease = await api('/leases', 'POST', { propertyId: studio.id, tenantIds: [lea.id], terms: { kind: 'MEUBLE', startDate: '2026-05-01' } })
    await api(`/leases/${studioLease.id}/terms`, 'PUT', {
      rentCents: 56000,
      chargesCents: 4000,
      chargesMode: 'PROVISION',
      depositCents: 112000,
      paymentDay: 5,
      zone: { tense: true, control: false },
      previous: { rentedWithin18Months: false },
      works: { sinceLast: '' },
      clauses: { resolutoire: true, solidarite: false, custom: [] },
      signature: { place: 'Montpellier', mode: 'PAPER' },
      revision: { enabled: true, irlQuarter: '2026-Q1', irlValue: 146.2 },
    })
    // Quittances : pas d'envoi automatique vers l'adresse fictive.
    await api(`/leases/${studioLease.id}/receipt-auto`, 'PUT', { auto: false, assume: false })
    await api(`/leases/${studioLease.id}/sign`, 'POST')
    for (const [period, day] of [['2026-05', '04'], ['2026-06', '05'], ['2026-07', '03'], ['2026-08', '06'], ['2026-09', '05']]) {
      await api(`/leases/${studioLease.id}/payments`, 'POST', { period, receivedAt: `${period}-${day}` })
    }

    // 2. Appartement vide, locataire choisi, bail en préparation (à relire et faire signer).
    const t3 = await api('/properties', 'POST', {
      label: 'T3 Les Arceaux',
      address: '48 boulevard des Arceaux, 34000 Montpellier',
      postalCode: '34000',
      city: 'Montpellier',
      habitat: 'COLLECTIVE',
      legalRegime: 'COPRO',
      furnished: false,
      destination: 'HABITATION',
      copro: { syndic: 'Cabinet Rivière (fictif)', extractsProvided: true },
      constructionPeriod: '1975_1989',
      surface: 64,
      rooms: 3,
      roomList: [{ name: 'Séjour' }, { name: 'Chambre 1' }, { name: 'Chambre 2' }, { name: 'Cuisine' }, { name: 'Salle de bains' }],
      heating: { mode: 'INDIVIDUAL', energy: 'GAS' },
      hotWater: { mode: 'INDIVIDUAL' },
      equipments: ['kitchen', 'smokeDetector'],
      annexes: ['cellar'],
      commonAreas: ['elevator', 'bikes'],
      tv: 'COLLECTIVE',
      internet: 'FIBER',
      fiscalId: '341000000002',
      diagnostics: { dpe: { class: 'C', ges: 'C', date: '2025-01-20', costMin: 890, costMax: 1240, costYear: 2024 }, erp: { date: '2026-10-01' }, electricity: { installOver15: true, date: '2025-01-20' }, gas: { hasGas: true, installOver15: true, date: '2025-01-20' } },
      market: { tense: true },
      smokeDetectors: 2,
      keys: '3 clés, 1 badge, 1 clé de boîte aux lettres',
    })
    const karim = await api('/tenants', 'POST', {
      propertyId: t3.id,
      civility: 'MONSIEUR',
      firstNames: 'Karim',
      lastName: 'Benali',
      birthDate: '1990-02-11',
      birthPlace: 'Lyon',
      email: fake('karim.benali'),
      phone: '0600000002',
      situation: 'EMPLOYEE',
      living: 'COUPLE',
      guarantee: 'NONE',
    })
    const t3Lease = await api('/leases', 'POST', { propertyId: t3.id, tenantIds: [karim.id], terms: { kind: 'VIDE', startDate: '2026-11-15' } })
    await api(`/leases/${t3Lease.id}/terms`, 'PUT', {
      rentCents: 92000,
      chargesCents: 9000,
      chargesMode: 'PROVISION',
      depositCents: 92000,
      paymentDay: 1,
      zone: { tense: true, control: false },
      previous: { rentedWithin18Months: false },
      works: { sinceLast: '' },
      clauses: { resolutoire: true, solidarite: false, custom: [] },
      signature: { place: 'Montpellier', mode: 'ELECTRONIC' },
      revision: { enabled: true, irlQuarter: '2026-Q2', irlValue: 146.68 },
    })
    await api(`/leases/${t3Lease.id}/receipt-auto`, 'PUT', { auto: false, assume: false })

    // 3. Maison libre, fiche à compléter (le guidage de mise en location démarre ici).
    await api('/properties', 'POST', {
      label: 'Maison de Lunel',
      address: '7 impasse des Oliviers, 34400 Lunel',
      postalCode: '34400',
      city: 'Lunel',
      habitat: 'INDIVIDUAL',
      legalRegime: 'MONO',
      furnished: false,
      constructionPeriod: '1990_2005',
      surface: 92,
      rooms: 4,
      heating: { mode: 'INDIVIDUAL', energy: 'ELECTRIC' },
      hotWater: { mode: 'INDIVIDUAL' },
      equipments: ['kitchen', 'smokeDetector'],
      tv: 'INDIVIDUAL',
      internet: 'ADSL',
      smokeDetectors: 2,
    })

    // Dépenses de l'année et une intervention prévue.
    const expenses = [
      { propertyId: studio.id, vendor: 'Plomberie Durand (fictif)', description: 'Remplacement du mitigeur de la douche', category: 'REPAIR', amountCents: 18500, date: '2026-07-18' },
      { propertyId: studio.id, vendor: 'Cabinet Rivière (fictif)', description: 'Charges de copropriété, 3e trimestre', category: 'COPRO', amountCents: 21000, recoverableCents: 12000, date: '2026-07-01' },
      { propertyId: studio.id, vendor: 'Finances publiques', description: 'Taxe foncière 2026', category: 'TAX', amountCents: 64200, date: '2026-10-15' },
      { propertyId: t3.id, vendor: 'Assurance PNO (fictif)', description: 'Assurance propriétaire non occupant', category: 'INSURANCE', amountCents: 16800, date: '2026-01-10' },
    ]
    for (const e of expenses) await api('/expenses', 'POST', e)
    await api(`/properties/${t3.id}/interventions`, 'POST', {
      title: 'Entretien annuel de la chaudière',
      description: 'Avant l’entrée du nouveau locataire.',
      status: 'PLANNED',
      date: '2026-11-05',
      newContact: { name: 'Chauffage Martin (fictif)', trade: 'Chauffagiste', phone: '0400000000' },
    })

    console.log(`Compte de démonstration prêt : ${email}`)
    console.log('Connectez-vous sur le site avec cette adresse (lien par email). Logements : Studio Écusson (loué, loyer d’octobre en retard), T3 Les Arceaux (bail à faire signer), Maison de Lunel (fiche à compléter).')
  } finally {
    await deleteSession(token)
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
