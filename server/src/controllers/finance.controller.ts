import { Request, Response } from 'express'
import { prisma } from '../config/database.js'
import { generateFiscalPDF, FiscalPDFData } from '../templates/fiscalPDF.js'

class FinanceController {
  /**
   * GET /api/v1/finances/fiscal-data?year=2024
   * Generate pre-filled fiscal data for French tax forms (2044, 2042, 2031)
   */
  async getFiscalData(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const year = parseInt(req.query.year as string) || new Date().getFullYear() - 1

      // Validate year is reasonable (not in future, not too old)
      const currentYear = new Date().getFullYear()
      if (year > currentYear) {
        return res.status(400).json({ success: false, message: 'Year cannot be in the future' })
      }
      if (year < 2010) {
        return res.status(400).json({ success: false, message: 'Year too far in the past' })
      }

      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31T23:59:59`)

      // Fetch payments for the year
      const payments = await prisma.payment.findMany({
        where: {
          contract: { ownerId: userId },
          status: 'PAID',
          paidDate: { gte: startDate, lte: endDate },
        },
        include: { contract: { include: { property: true } } },
      })

      // Fetch expenses for the year
      const expenses = await prisma.expense.findMany({
        where: {
          ownerId: userId,
          date: { gte: startDate, lte: endDate },
        },
        include: { property: true },
      })

      // Fetch all loans for the owner (to calculate annual interests)
      const loans = await prisma.loan.findMany({
        where: { ownerId: userId },
      })

      // Calculate totals
      const totalRevenusBruts = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalChargesDeductibles = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

      // Calculate annual interests: using simple formula monthlyPayment * 12 * (interestRate / (100 + interestRate))
      // If that's too complex, use: totalAmount * interestRate / 100
      const totalInteretsEmprunt = loans.reduce((sum, l) => {
        // Simple approximation: interest per year = monthly payment * 12 - (principal paid per year)
        // For simplicity, use: totalAmount * interestRate / 100
        return sum + (l.totalAmount * l.interestRate) / 100
      }, 0)

      const totalAutresCharges = totalChargesDeductibles - totalInteretsEmprunt
      const revenuNetFoncier = Math.max(0, totalRevenusBruts - totalChargesDeductibles)

      // Group payments and expenses by property
      const byProperty: Record<
        string,
        {
          id: string
          title: string
          address: string
          revenus: number
          charges: number
        }
      > = {}

      payments.forEach((p) => {
        const prop = p.contract?.property
        if (!prop) return
        if (!byProperty[prop.id]) {
          byProperty[prop.id] = {
            id: prop.id,
            title: prop.title,
            address: prop.address ?? '',
            revenus: 0,
            charges: 0,
          }
        }
        byProperty[prop.id].revenus += p.amount || 0
      })

      expenses.forEach((e) => {
        const prop = e.property
        if (!prop) return
        if (!byProperty[prop.id]) {
          byProperty[prop.id] = {
            id: prop.id,
            title: prop.title,
            address: prop.address ?? '',
            revenus: 0,
            charges: 0,
          }
        }
        byProperty[prop.id].charges += e.amount || 0
      })

      // Build form 2044 data (declaration of real estate income)
      // ligne110 = total rental income (loyers)
      // ligne220 = deductible charges
      // ligne420 = mortgage interests
      // ligne430 = insurance expenses
      // ligne440 = management fees
      // ligne240 = net rental income
      const insuranceAmount = expenses
        .filter((e) => e.category === 'ASSURANCE')
        .reduce((s, e) => s + e.amount, 0)
      const managementAmount = expenses
        .filter((e) => e.category === 'CHARGES_COPRO' || e.category === 'AUTRE')
        .reduce((s, e) => s + e.amount, 0)

      // Build form 2042 data (income tax declaration)
      // case4BA = net rental income from real estate (micro-foncier or excess from 2044)
      // case4BC = net rental income from furnished rental (LMNP)
      // case4BE = gross rental income (all loyers collected)
      const form2042Data = {
        case4BA: Math.round(revenuNetFoncier),
        case4BC: 0,
        case4BE: Math.round(totalRevenusBruts),
      }

      return res.json({
        success: true,
        data: {
          year,
          summary: {
            totalRevenusBruts: Math.round(totalRevenusBruts),
            totalChargesDeductibles: Math.round(totalChargesDeductibles),
            totalInteretsEmprunt: Math.round(totalInteretsEmprunt),
            totalAutresCharges: Math.round(totalAutresCharges),
            revenuNetFoncier: Math.round(revenuNetFoncier),
          },
          properties: Object.values(byProperty),
          form2044: {
            ligne110: Math.round(totalRevenusBruts),
            ligne220: Math.round(totalChargesDeductibles),
            ligne420: Math.round(totalInteretsEmprunt),
            ligne430: Math.round(insuranceAmount),
            ligne440: Math.round(managementAmount),
            ligne240: Math.round(revenuNetFoncier),
          },
          form2042: form2042Data,
          loans: loans.map((l) => ({
            bankName: l.bankName ?? 'Banque',
            totalAmount: l.totalAmount,
            interestRate: l.interestRate,
            annualInterests: Math.round((l.totalAmount * l.interestRate) / 100),
          })),
        },
      })
    } catch (err) {
      console.error('getFiscalData error:', err)
      return res.status(500).json({ success: false, message: 'Server error' })
    }
  }

  /**
   * GET /api/v1/finances/fiscal-pdf?year=2024
   * Generate a fiscal PDF report for the authenticated owner
   */
  async getFiscalPDF(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const year = parseInt(req.query.year as string) || new Date().getFullYear() - 1

      const currentYear = new Date().getFullYear()
      if (year > currentYear) {
        return res.status(400).json({ success: false, message: 'Year cannot be in the future' })
      }
      if (year < 2010) {
        return res.status(400).json({ success: false, message: 'Year too far in the past' })
      }

      const startDate = new Date(`${year}-01-01`)
      const endDate = new Date(`${year}-12-31T23:59:59`)

      // Fetch owner name
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      })

      // Fetch payments for the year
      const payments = await prisma.payment.findMany({
        where: {
          contract: { ownerId: userId },
          status: 'PAID',
          paidDate: { gte: startDate, lte: endDate },
        },
        include: { contract: { include: { property: true } } },
      })

      // Fetch expenses for the year
      const expenses = await prisma.expense.findMany({
        where: {
          ownerId: userId,
          date: { gte: startDate, lte: endDate },
        },
        include: { property: true },
      })

      // Fetch all loans for the owner
      const loans = await prisma.loan.findMany({
        where: { ownerId: userId },
      })

      // Calculate totals
      const totalRevenusBruts = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
      const totalChargesDeductibles = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
      const totalInteretsEmprunt = loans.reduce((sum, l) => {
        return sum + (l.totalAmount * l.interestRate) / 100
      }, 0)
      const revenuNetFoncier = Math.max(0, totalRevenusBruts - totalChargesDeductibles)

      // Group payments and expenses by property
      const byProperty: Record<string, { title: string; address: string; revenus: number; charges: number }> = {}

      payments.forEach((p) => {
        const prop = p.contract?.property
        if (!prop) return
        if (!byProperty[prop.id]) {
          byProperty[prop.id] = { title: prop.title, address: prop.address ?? '', revenus: 0, charges: 0 }
        }
        byProperty[prop.id].revenus += p.amount || 0
      })

      expenses.forEach((e) => {
        const prop = e.property
        if (!prop) return
        if (!byProperty[prop.id]) {
          byProperty[prop.id] = { title: prop.title, address: prop.address ?? '', revenus: 0, charges: 0 }
        }
        byProperty[prop.id].charges += e.amount || 0
      })

      const insuranceAmount = expenses
        .filter((e) => e.category === 'ASSURANCE')
        .reduce((s, e) => s + e.amount, 0)
      const managementAmount = expenses
        .filter((e) => e.category === 'CHARGES_COPRO' || e.category === 'AUTRE')
        .reduce((s, e) => s + e.amount, 0)

      // Determine regime
      const regimeParam = req.query.regime as string | undefined
      let regime = regimeParam && regimeParam !== 'auto'
        ? regimeParam
        : totalRevenusBruts < 15000
          ? 'Revenus fonciers — Micro-foncier (abattement 30%)'
          : 'Revenus fonciers — Régime Réel'

      const ownerName = user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : 'Propriétaire'
      const generatedDate = new Date().toLocaleDateString('fr-FR')

      const pdfData: FiscalPDFData = {
        year,
        ownerName,
        generatedDate,
        regime,
        summary: {
          totalRevenusBruts: Math.round(totalRevenusBruts),
          totalChargesDeductibles: Math.round(totalChargesDeductibles),
          totalInteretsEmprunt: Math.round(totalInteretsEmprunt),
          revenuNetFoncier: Math.round(revenuNetFoncier),
        },
        properties: Object.values(byProperty),
        form2044: {
          ligne110: Math.round(totalRevenusBruts),
          ligne220: Math.round(totalChargesDeductibles),
          ligne420: Math.round(totalInteretsEmprunt),
          ligne430: Math.round(insuranceAmount),
          ligne440: Math.round(managementAmount),
          ligne240: Math.round(revenuNetFoncier),
        },
        form2042: {
          case4BA: Math.round(revenuNetFoncier),
          case4BC: 0,
          case4BE: Math.round(totalRevenusBruts),
        },
        loans: loans.map((l) => ({
          bankName: l.bankName ?? 'Banque',
          totalAmount: l.totalAmount,
          interestRate: l.interestRate,
          annualInterests: Math.round((l.totalAmount * l.interestRate) / 100),
        })),
      }

      const buffer = await generateFiscalPDF(pdfData)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="rapport-fiscal-${year}.pdf"`)
      return res.send(buffer)
    } catch (err) {
      console.error('getFiscalPDF error:', err)
      return res.status(500).json({ success: false, message: 'Server error' })
    }
  }

  /**
   * GET /api/v1/finances/wizard-prefill?year=2024
   * Returns pre-filled WizardAnswers from existing Bailio data.
   * Avoids re-asking the user for data the platform already knows.
   */
  async getWizardPrefill(req: Request, res: Response) {
    try {
      const userId = req.user!.id
      const year = parseInt(req.query.year as string) || new Date().getFullYear() - 1
      const startDate = new Date(`${year}-01-01`)
      const endDate   = new Date(`${year}-12-31T23:59:59`)

      // ── 1. Properties ────────────────────────────────────────────────────────
      const properties = await prisma.property.findMany({
        where: { ownerId: userId },
        select: { id: true, title: true, address: true, city: true, furnished: true, price: true },
      })

      // Auto-detect location type
      const allFurnished = properties.length > 0 && properties.every((p) => p.furnished)
      const allNu        = properties.length > 0 && properties.every((p) => !p.furnished)
      const mixed        = properties.length > 0 && !allFurnished && !allNu

      // ── 2. Paid payments for the year ────────────────────────────────────────
      const payments = await prisma.payment.findMany({
        where: {
          contract: { ownerId: userId },
          status: 'PAID',
          paidDate: { gte: startDate, lte: endDate },
        },
        select: { amount: true, charges: true },
      })
      const loyersBruts = Math.round(payments.reduce((s, p) => s + (p.amount ?? 0), 0))
      const recettesMeublees = loyersBruts  // same total, regime-split is semantic

      // ── 3. Expenses by category ──────────────────────────────────────────────
      const expenses = await prisma.expense.findMany({
        where: { ownerId: userId, date: { gte: startDate, lte: endDate } },
        select: { category: true, amount: true },
      })
      const sumCat = (cat: string) =>
        Math.round(expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0))

      const taxeFonciere   = sumCat('TAXE_FONCIERE')
      const assurances     = sumCat('ASSURANCE')
      const travaux        = sumCat('TRAVAUX')
      const chargesCopro   = sumCat('CHARGES_COPRO')
      const autresCharges  = sumCat('AUTRE')

      // ── 4. Loans → annual interests ──────────────────────────────────────────
      const loans = await prisma.loan.findMany({
        where: { ownerId: userId },
        select: { bankName: true, totalAmount: true, interestRate: true, monthlyPayment: true },
      })
      const interetsEmprunt = Math.round(
        loans.reduce((s, l) => s + (l.totalAmount * l.interestRate) / 100, 0)
      )

      // ── 5. Build prefill object ──────────────────────────────────────────────
      const prefill = {
        // Always nom propre default — user will be asked about SCI/indivision
        holdingMode: 'NOM_PROPRE' as const,
        // Location type if unambiguous
        locationType: allNu ? 'NU' : allFurnished ? 'MEUBLE' : undefined,
        // Financials
        loyersBruts,
        recettesMeublees,
        interetsEmprunt,
        taxeFonciere,
        assurances,
        travaux,
        chargesCopro,
        autresCharges,
        // Regime hint (auto based on threshold)
        opteRegimeReel: loyersBruts >= 15000,
      }

      return res.json({
        success: true,
        data: {
          prefill,
          properties: properties.map((p) => ({
            id: p.id,
            title: p.title,
            address: `${p.address ?? ''}, ${p.city ?? ''}`.trim().replace(/^,\s*/, ''),
            furnished: p.furnished,
            monthlyRent: p.price,
          })),
          mixed,
          year,
          dataQuality: {
            hasPayments: payments.length > 0,
            hasExpenses: expenses.length > 0,
            hasLoans:    loans.length > 0,
          },
        },
      })
    } catch (err) {
      console.error('getWizardPrefill error:', err)
      return res.status(500).json({ success: false, message: 'Server error' })
    }
  }
}

export const financeController = new FinanceController()
