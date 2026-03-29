import { prisma } from '../config/database.js'

/**
 * Génère les entrées Payment PENDING pour tous les baux actifs.
 * À exécuter le 1er de chaque mois. Idempotent (upsert).
 */
export async function generateMonthlyPayments() {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()

  const activeContracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, monthlyRent: true, charges: true, endDate: true },
  })

  let created = 0
  let skipped = 0

  for (const contract of activeContracts) {
    const dueDate = new Date(year, month - 1, 1)
    if (contract.endDate && dueDate > contract.endDate) {
      skipped++
      continue
    }

    await prisma.payment.upsert({
      where: { contractId_month_year: { contractId: contract.id, month, year } },
      create: {
        contractId: contract.id,
        amount: contract.monthlyRent,
        charges: contract.charges ?? 0,
        dueDate,
        month,
        year,
        status: 'PENDING',
      },
      update: {},
    })

    created++
  }

  console.log(`[generateMonthlyPayments] ${created} créés, ${skipped} ignorés`)
  return { created, skipped }
}
