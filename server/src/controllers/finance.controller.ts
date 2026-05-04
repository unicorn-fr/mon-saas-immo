import { Request, Response } from 'express'
import { prisma } from '../config/database.js'

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
}

export const financeController = new FinanceController()
