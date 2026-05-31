import { prisma } from '../config/database.js'

/**
 * Génère les entrées Payment PENDING pour tous les baux actifs.
 * À exécuter le 1er de chaque mois. Idempotent (upsert).
 * Les quittances sont envoyées automatiquement lors du mark-paid (payment.routes.ts).
 */
export async function generateMonthlyPayments() {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()

  const activeContracts = await prisma.contract.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, monthlyRent: true, charges: true, endDate: true },
  })

  const eligible = activeContracts.filter((c) => {
    if (!c.endDate) return true
    const dueDate = new Date(year, month - 1, 1)
    return dueDate <= c.endDate
  })

  // Run all upserts in parallel — idempotent, safe
  await Promise.all(
    eligible.map((contract) =>
      prisma.payment.upsert({
        where: { contractId_month_year: { contractId: contract.id, month, year } },
        create: {
          contractId: contract.id,
          amount: contract.monthlyRent,
          charges: contract.charges ?? 0,
          dueDate: new Date(year, month - 1, 1),
          month,
          year,
          status: 'PENDING',
        },
        update: {},
      })
    )
  )

  const skipped = activeContracts.length - eligible.length
  console.log(`[generateMonthlyPayments] ${eligible.length} créés/mis à jour, ${skipped} ignorés (bail expiré)`)
  return { created: eligible.length, skipped }
}
