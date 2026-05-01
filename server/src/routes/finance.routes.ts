import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'

const router = Router()
router.use(authenticate)
router.use(authorize('OWNER'))

// GET /finances/expenses
router.get('/expenses', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const expenses = await prisma.expense.findMany({
      where: { ownerId },
      include: { property: { select: { title: true } } },
      orderBy: { date: 'desc' },
    })
    return res.json({ success: true, data: { expenses } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /finances/expenses
router.post('/expenses', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const { propertyId, category, description, amount, date, receiptUrl } = req.body
    if (!propertyId || !category || !description || !amount || !date) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    }
    // Verify property ownership
    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } })
    if (!property) return res.status(403).json({ success: false, message: 'Propriété introuvable' })

    const expense = await prisma.expense.create({
      data: { propertyId, ownerId, category, description, amount: Number(amount), date: new Date(date), receiptUrl },
      include: { property: { select: { title: true } } },
    })
    return res.status(201).json({ success: true, data: { expense } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// DELETE /finances/expenses/:id
router.delete('/expenses/:id', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, ownerId } })
    if (!expense) return res.status(404).json({ success: false, message: 'Dépense introuvable' })
    await prisma.expense.delete({ where: { id: req.params.id } })
    return res.json({ success: true, data: {} })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /finances/loans
router.get('/loans', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const loans = await prisma.loan.findMany({
      where: { ownerId },
      include: { property: { select: { title: true } } },
    })
    return res.json({ success: true, data: { loans } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// POST /finances/loans (upsert by propertyId)
router.post('/loans', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const { propertyId, bankName, totalAmount, monthlyPayment, interestRate, durationMonths, startDate } = req.body
    if (!propertyId || !totalAmount || !monthlyPayment || !interestRate || !durationMonths || !startDate) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants' })
    }
    const property = await prisma.property.findFirst({ where: { id: propertyId, ownerId } })
    if (!property) return res.status(403).json({ success: false, message: 'Propriété introuvable' })

    const loan = await prisma.loan.upsert({
      where: { propertyId },
      create: { propertyId, ownerId, bankName, totalAmount: Number(totalAmount), monthlyPayment: Number(monthlyPayment), interestRate: Number(interestRate), durationMonths: Number(durationMonths), startDate: new Date(startDate) },
      update: { bankName, totalAmount: Number(totalAmount), monthlyPayment: Number(monthlyPayment), interestRate: Number(interestRate), durationMonths: Number(durationMonths), startDate: new Date(startDate) },
      include: { property: { select: { title: true } } },
    })
    return res.json({ success: true, data: { loan } })
  } catch {
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

// GET /finances/summary
router.get('/summary', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

    // Fetch payments and expenses for last 12 months in parallel
    const [payments, expenses, loans, activeContracts, totalProperties] = await Promise.all([
      prisma.payment.findMany({
        where: {
          status: 'PAID',
          paidDate: { gte: twelveMonthsAgo },
          contract: { ownerId },
        },
        select: { amount: true, charges: true, paidDate: true, month: true, year: true },
      }),
      prisma.expense.findMany({
        where: { ownerId, date: { gte: twelveMonthsAgo } },
        select: { amount: true, date: true },
      }),
      prisma.loan.findMany({ where: { ownerId }, select: { monthlyPayment: true } }),
      prisma.contract.count({ where: { ownerId, status: 'ACTIVE' } }),
      prisma.property.count({ where: { ownerId } }),
    ])

    const totalLoanMonthly = loans.reduce((s, l) => s + l.monthlyPayment, 0)

    // Build 12-month cash flow array
    const cashFlowByMonth: { month: string; revenue: number; expenses: number; net: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      const label = `${y}-${String(m).padStart(2, '0')}`

      const revenue = payments
        .filter(p => p.month === m && p.year === y)
        .reduce((s, p) => s + p.amount + (p.charges ?? 0), 0)

      const exp = expenses
        .filter(e => {
          const ed = new Date(e.date)
          return ed.getMonth() + 1 === m && ed.getFullYear() === y
        })
        .reduce((s, e) => s + e.amount, 0)

      cashFlowByMonth.push({ month: label, revenue, expenses: exp, net: revenue - exp - totalLoanMonthly })
    }

    const totalRevenue = cashFlowByMonth.reduce((s, m) => s + m.revenue, 0)
    const totalExpenses = cashFlowByMonth.reduce((s, m) => s + m.expenses, 0)
    const netCashFlow = totalRevenue - totalExpenses - totalLoanMonthly * 12
    const occupancyRate = totalProperties > 0 ? Math.round((activeContracts / totalProperties) * 100) : 0

    return res.json({ success: true, data: { summary: { totalRevenue, totalExpenses, totalLoanMonthly, netCashFlow, cashFlowByMonth, occupancyRate } } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
