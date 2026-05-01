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

// French city rental market data (CLAMEUR/SeLoger 2024 estimates)
interface CityRentalData {
  avgRentM2: number
  minRentM2: number
  maxRentM2: number
  encadrement: boolean
  encadrementRef?: number
  encadrementMaj?: number  // ref * 1.2
  encadrementMin?: number  // ref * 0.8
}

const RENTAL_MARKET: Record<string, CityRentalData> = {
  'paris': { avgRentM2: 31, minRentM2: 22, maxRentM2: 45, encadrement: true, encadrementRef: 27, encadrementMaj: 32.4, encadrementMin: 21.6 },
  'lyon': { avgRentM2: 15, minRentM2: 11, maxRentM2: 22, encadrement: true, encadrementRef: 14, encadrementMaj: 16.8, encadrementMin: 11.2 },
  'lille': { avgRentM2: 14, minRentM2: 10, maxRentM2: 18, encadrement: true, encadrementRef: 13, encadrementMaj: 15.6, encadrementMin: 10.4 },
  'bordeaux': { avgRentM2: 15, minRentM2: 11, maxRentM2: 20, encadrement: true, encadrementRef: 14, encadrementMaj: 16.8, encadrementMin: 11.2 },
  'montpellier': { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: true, encadrementRef: 12, encadrementMaj: 14.4, encadrementMin: 9.6 },
  'grenoble': { avgRentM2: 12, minRentM2: 9, maxRentM2: 16, encadrement: true, encadrementRef: 11, encadrementMaj: 13.2, encadrementMin: 8.8 },
  'marseille': { avgRentM2: 13, minRentM2: 10, maxRentM2: 18, encadrement: false },
  'toulouse': { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false },
  'nantes': { avgRentM2: 14, minRentM2: 10, maxRentM2: 18, encadrement: false },
  'strasbourg': { avgRentM2: 13, minRentM2: 10, maxRentM2: 17, encadrement: false },
  'nice': { avgRentM2: 18, minRentM2: 13, maxRentM2: 26, encadrement: false },
  'rennes': { avgRentM2: 14, minRentM2: 10, maxRentM2: 18, encadrement: false },
  'toulon': { avgRentM2: 12, minRentM2: 9, maxRentM2: 15, encadrement: false },
  'dijon': { avgRentM2: 11, minRentM2: 8, maxRentM2: 14, encadrement: false },
  'angers': { avgRentM2: 12, minRentM2: 9, maxRentM2: 15, encadrement: false },
  'aix-en-provence': { avgRentM2: 17, minRentM2: 13, maxRentM2: 24, encadrement: false },
  'reims': { avgRentM2: 10, minRentM2: 8, maxRentM2: 13, encadrement: false },
  'clermont-ferrand': { avgRentM2: 10, minRentM2: 8, maxRentM2: 13, encadrement: false },
}

// GET /finances/market-analysis/:propertyId
router.get('/market-analysis/:propertyId', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, ownerId },
      select: { id: true, title: true, city: true, surface: true, price: true, charges: true, furnished: true },
    })
    if (!property) return res.status(404).json({ success: false, message: 'Bien introuvable' })

    const cityKey = property.city.toLowerCase().trim()
    const market = RENTAL_MARKET[cityKey]

    const rentPerM2 = property.surface > 0 ? Math.round((property.price / property.surface) * 10) / 10 : 0

    let vsMarket: 'below' | 'inline' | 'above' = 'inline'
    let vsMarketPct = 0
    let advice = ''
    let encadrementStatus: 'compliant' | 'above_limit' | 'not_applicable' | 'unknown' = 'unknown'
    let encadrementInfo = ''

    if (market) {
      vsMarketPct = Math.round(((rentPerM2 - market.avgRentM2) / market.avgRentM2) * 100)
      if (vsMarketPct < -10) {
        vsMarket = 'below'
        advice = `Votre loyer est ${Math.abs(vsMarketPct)}% sous la moyenne du marché à ${property.city} (${market.avgRentM2} €/m²). Vous pourriez envisager une révision à la prochaine échéance annuelle.`
      } else if (vsMarketPct > 15) {
        vsMarket = 'above'
        advice = `Votre loyer est ${vsMarketPct}% au-dessus de la moyenne du marché (${market.avgRentM2} €/m²). Vérifiez la conformité avec l'encadrement des loyers si applicable.`
      } else {
        advice = `Votre loyer est en ligne avec le marché local (${market.avgRentM2} €/m² en moyenne à ${property.city}).`
      }

      if (market.encadrement && market.encadrementRef) {
        const refMaj = market.encadrementMaj!
        if (rentPerM2 > refMaj) {
          encadrementStatus = 'above_limit'
          encadrementInfo = `⚠️ Votre loyer (${rentPerM2} €/m²) dépasse le loyer de référence majoré (${refMaj} €/m²) de l'encadrement des loyers de ${property.city}. Risque de mise en demeure.`
        } else {
          encadrementStatus = 'compliant'
          encadrementInfo = `✓ Votre loyer (${rentPerM2} €/m²) respecte le loyer de référence majoré (${refMaj} €/m²) de ${property.city}.`
        }
      } else if (!market.encadrement) {
        encadrementStatus = 'not_applicable'
        encadrementInfo = `${property.city} n'est pas soumise à l'encadrement des loyers.`
      }
    } else {
      advice = `Données de marché non disponibles pour ${property.city}. Consultez les observatoires locaux des loyers (CLAMEUR, ANIL).`
    }

    // Fiscal regime advice
    const annualRevenue = property.price * 12
    let fiscalAdvice = ''
    if (property.furnished) {
      fiscalAdvice = annualRevenue < 77700
        ? 'LMNP Micro-BIC recommandé : abattement forfaitaire de 50% sur vos recettes meublées.'
        : 'LMNP régime réel recommandé : déduisez toutes vos charges réelles et les amortissements.'
    } else {
      fiscalAdvice = annualRevenue < 15000
        ? 'Micro-foncier possible : abattement forfaitaire de 30% — déclaration simplifiée.'
        : 'Régime réel recommandé : déduisez charges, travaux, intérêts d\'emprunt pour réduire votre imposition.'
    }

    return res.json({
      success: true,
      data: {
        analysis: {
          propertyId: property.id,
          propertyTitle: property.title,
          rentPerM2,
          market: market ? {
            city: property.city,
            avgRentM2: market.avgRentM2,
            minRentM2: market.minRentM2,
            maxRentM2: market.maxRentM2,
          } : null,
          vsMarket,
          vsMarketPct,
          advice,
          encadrementStatus,
          encadrementInfo,
          encadrementRef: market?.encadrementRef ?? null,
          encadrementMaj: market?.encadrementMaj ?? null,
          encadrementMin: market?.encadrementMin ?? null,
          fiscalAdvice,
          annualRevenue,
        },
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: 'Erreur serveur' })
  }
})

export default router
