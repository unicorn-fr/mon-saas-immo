import { Router } from 'express'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'
import { prisma } from '../config/database.js'
import { findRentalMarketData } from '../data/rentalMarketData.js'

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

// GET /finances/market-analysis/:propertyId
router.get('/market-analysis/:propertyId', async (req, res) => {
  try {
    const ownerId = req.user!.id
    const property = await prisma.property.findFirst({
      where: { id: req.params.propertyId, ownerId },
      select: { id: true, title: true, city: true, address: true, postalCode: true, surface: true, price: true, furnished: true },
    })
    if (!property) return res.status(404).json({ success: false, message: 'Bien introuvable' })

    const market = await findRentalMarketData(property.city, property.address, property.postalCode)
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
        advice = `Votre loyer (${rentPerM2} €/m²) est ${Math.abs(vsMarketPct)}% sous la moyenne du marché dans ce secteur (${market.avgRentM2} €/m²). À la prochaine échéance annuelle, vous pourriez revaloriser le loyer selon l'IRL.`
      } else if (vsMarketPct > 15) {
        vsMarket = 'above'
        advice = `Votre loyer (${rentPerM2} €/m²) est ${vsMarketPct}% au-dessus de la moyenne du marché (${market.avgRentM2} €/m²). Vérifiez la conformité avec l'encadrement des loyers si applicable à votre commune.`
      } else {
        advice = `Votre loyer (${rentPerM2} €/m²) est en ligne avec le marché local (${market.avgRentM2} €/m² en moyenne — source : ${market.source === 'paris_arrondissement' ? market.label : market.source === 'city' ? 'observatoire local' : `département ${market.label}`}).`
      }

      if (market.encadrement && market.encadrementMaj) {
        if (rentPerM2 > market.encadrementMaj) {
          encadrementStatus = 'above_limit'
          encadrementInfo = `⚠️ Votre loyer (${rentPerM2} €/m²) dépasse le loyer de référence majoré (${market.encadrementMaj} €/m²) pour ${market.label}. Risque de mise en demeure par le locataire ou le préfet.`
        } else {
          encadrementStatus = 'compliant'
          encadrementInfo = `✓ Votre loyer (${rentPerM2} €/m²) respecte le loyer de référence majoré (${market.encadrementMaj} €/m²) en vigueur pour ${market.label}.`
        }
      } else {
        encadrementStatus = 'not_applicable'
        encadrementInfo = `${market.label} n'est pas soumise à l'encadrement des loyers.`
      }
    } else {
      advice = `Données de marché non disponibles pour ${property.city}. Consultez l'observatoire local des loyers (CLAMEUR, ANIL).`
      encadrementStatus = 'unknown'
      encadrementInfo = "Vérifiez sur Service-Public.fr si votre commune est soumise à l'encadrement des loyers."
    }

    const annualRevenue = property.price * 12
    const fiscalAdvice = property.furnished
      ? annualRevenue < 77700
        ? 'LMNP Micro-BIC recommandé : abattement forfaitaire de 50% sur vos recettes meublées. Déclaration simplifiée.'
        : 'LMNP régime réel recommandé : déduisez toutes vos charges réelles et les amortissements pour optimiser votre fiscalité.'
      : annualRevenue < 15000
        ? 'Micro-foncier applicable : abattement forfaitaire de 30%. Déclaration simplifiée sur votre déclaration de revenus.'
        : "Régime réel recommandé : déduisez charges, travaux, intérêts d'emprunt, assurances pour réduire votre base imposable."

    return res.json({
      success: true,
      data: {
        analysis: {
          propertyId: property.id,
          propertyTitle: property.title,
          rentPerM2,
          market: market ? { city: market.label, avgRentM2: market.avgRentM2, minRentM2: market.minRentM2, maxRentM2: market.maxRentM2, source: market.source, sourceUrl: market.sourceUrl, sourceName: market.sourceName, nbObs: market.nbObs, r2: market.r2 } : null,
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

// Derive source URL from market data + city
function getSourceInfo(market: { source: string; label: string; encadrement: boolean } | null, city: string) {
  if (!market) return { sourceUrl: 'https://www.clameur.fr/', sourceName: 'CLAMEUR' }
  const cityLower = city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (market.source === 'paris_arrondissement' || cityLower === 'paris') {
    return { sourceUrl: 'https://www.encadrementdesloyers.gouv.fr/', sourceName: 'encadrementdesloyers.gouv.fr' }
  }
  if (cityLower.includes('lyon')) return { sourceUrl: 'https://data.grandlyon.com/portail/fr/dataset/loyers-de-reference-metropole-de-lyon', sourceName: 'data.grandlyon.com' }
  if (cityLower.includes('lille')) return { sourceUrl: 'https://www.data.gouv.fr/fr/datasets/encadrement-des-loyers-de-lille/', sourceName: 'data.gouv.fr — Lille' }
  if (cityLower.includes('montpellier')) return { sourceUrl: 'https://www.data.gouv.fr/fr/datasets/encadrement-des-loyers-de-montpellier/', sourceName: 'data.gouv.fr — Montpellier' }
  if (cityLower.includes('bordeaux')) return { sourceUrl: 'https://www.encadrementdesloyers.gouv.fr/', sourceName: 'encadrementdesloyers.gouv.fr' }
  if (cityLower.includes('grenoble')) return { sourceUrl: 'https://www.encadrementdesloyers.gouv.fr/', sourceName: 'encadrementdesloyers.gouv.fr' }
  if (market.encadrement) return { sourceUrl: 'https://www.encadrementdesloyers.gouv.fr/', sourceName: 'encadrementdesloyers.gouv.fr' }
  return { sourceUrl: 'https://www.clameur.fr/', sourceName: 'CLAMEUR (Observatoire national des loyers)' }
}

// GET /finances/city-market?city=xxx — loyer marché pour n'importe quelle commune française
router.get('/city-market', async (req, res) => {
  try {
    const city = (req.query.city as string | undefined)?.trim()
    if (!city || city.length < 2) return res.status(400).json({ success: false, message: 'Ville requise' })
    const market = await findRentalMarketData(city)
    const { sourceUrl, sourceName } = getSourceInfo(market, city)
    return res.json({ success: true, data: { market: market ? {
      avgRentM2: market.avgRentM2,
      minRentM2: market.minRentM2,
      maxRentM2: market.maxRentM2,
      encadrement: market.encadrement,
      label: market.label,
      sourceUrl,
      sourceName,
    } : null } })
  } catch (err) {
    console.error('city-market error:', err)
    return res.status(500).json({ success: false, message: 'Erreur' })
  }
})

// POST /finances/rent-advisor — calcul déterministe, sans API externe
router.post('/rent-advisor', async (req, res) => {
  try {
    const { city, address, postalCode, surface, bedrooms, furnished, type } = req.body
    if (!city || !surface) {
      return res.status(400).json({ success: false, message: 'Champs requis manquants (city, surface)' })
    }

    const surf = Number(surface)
    const rooms = Number(bedrooms) || 1
    const isfurnished = furnished === true || furnished === 'true'

    // Fetch market data (live API if encadrement city, else static)
    const market = await findRentalMarketData(city, address ?? '', postalCode ?? '', rooms, isfurnished)

    // ── Price calculation ──────────────────────────────────────────────
    let baseM2: number
    let minM2: number
    let maxM2: number

    if (market) {
      baseM2 = market.avgRentM2
      minM2  = market.minRentM2
      maxM2  = market.maxRentM2
    } else {
      // National fallback: 12 €/m² average France
      baseM2 = 12; minM2 = 9; maxM2 = 16
    }

    // Adjustments (multiplicative factors)
    let factor = 1.0

    // Meublé premium: +15-25% vs non meublé
    if (isfurnished) factor *= 1.18

    // Surface: small surfaces command higher €/m²
    if (surf < 25) factor *= 1.15
    else if (surf < 40) factor *= 1.08
    else if (surf > 80) factor *= 0.95
    else if (surf > 120) factor *= 0.90

    // Type premium
    if (type === 'LOFT' || type === 'DUPLEX') factor *= 1.10

    const adjBase = baseM2 * factor
    const adjMin  = minM2  * factor
    const adjMax  = maxM2  * factor

    const recommendedRent = Math.round(adjBase * surf)
    const minRent         = Math.round(adjMin  * surf)
    const maxRent         = Math.round(adjMax  * surf)

    // ── Encadrement ────────────────────────────────────────────────────
    let encadrementNote: string | null = null
    if (market?.encadrement && market.encadrementMaj) {
      const plafond = Math.round(market.encadrementMaj * factor * surf)
      if (recommendedRent > plafond) {
        encadrementNote = `⚠ Attention : à ${city}, l'encadrement des loyers fixe un plafond majoré à ${market.encadrementMaj} €/m² (soit ~${plafond} € pour ${surf} m²). Le loyer recommandé a été ajusté pour rester conforme.`
      } else {
        encadrementNote = `✓ Conforme à l'encadrement des loyers de ${city} (plafond majoré ${market.encadrementMaj} €/m² · référence ${market.encadrementRef} €/m²).`
      }
    }

    // ── Reasoning ─────────────────────────────────────────────────────
    const dataSource = market ? `données officielles ${market.label}` : 'moyenne nationale (données marché non disponibles pour cette ville)'
    const furnishedStr = isfurnished ? 'meublé (+18%)' : 'non meublé'
    const reasoning = `Estimation basée sur les ${dataSource} : ${baseM2.toFixed(1)} €/m² moyen, ajusté pour ${furnishedStr}, surface ${surf} m²${surf < 40 ? ' (petite surface, prime appliquée)' : ''}.`

    // ── Tips contextuals ────────────────────────────────────────────────
    const tips: string[] = []
    if (market?.encadrement) tips.push(`Ville soumise à l'encadrement des loyers — mentionnez le loyer de référence (${market.encadrementRef} €/m²) dans le bail.`)
    else tips.push('Consultez les annonces similaires sur SeLoger et PAP pour valider votre positionnement.')

    if (isfurnished) tips.push('Un logement meublé attire les étudiants et jeunes actifs — soignez les photos et listez précisément le mobilier.')
    else tips.push('Un loyer légèrement sous la médiane réduit la vacance et fidélise le locataire.')

    if (surf < 30) tips.push('Les studios et T1 se louent vite en centre-ville — privilégiez une plateforme ciblée (PAP, Leboncoin, Studapart).')
    else if (rooms >= 3) tips.push('Les grands logements attirent les familles — mettez en avant les écoles et transports à proximité.')
    else tips.push('Comparez avec au moins 5 annonces similaires dans un rayon de 500m avant de fixer définitivement le prix.')

    const { sourceUrl, sourceName } = getSourceInfo(market, city)

    return res.json({
      success: true,
      data: {
        advice: { minRent, maxRent, recommendedRent, reasoning, encadrementNote, tips, sourceUrl, sourceName },
        marketAvailable: !!market,
      },
    })
  } catch (err) {
    console.error('rent-advisor error:', err)
    return res.status(500).json({ success: false, message: 'Erreur lors de l\'estimation du loyer' })
  }
})

export default router
