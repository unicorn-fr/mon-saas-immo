import { Request, Response, NextFunction } from 'express'
import { contractService } from '../services/contract.service.js'
import { ContractStatus } from '@prisma/client'

class ContractController {
  /**
   * POST /api/v1/contracts
   */
  async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      if (req.user?.role !== 'OWNER') {
        return res.status(403).json({ success: false, message: 'Only owners can create contracts' })
      }

      const { propertyId, tenantId, startDate, endDate, monthlyRent, charges, deposit, terms, content, customClauses } = req.body

      if (!propertyId || !tenantId || !startDate || !endDate || !monthlyRent) {
        return res.status(400).json({ success: false, message: 'Missing required fields' })
      }

      const contract = await contractService.createContract({
        propertyId,
        tenantId,
        ownerId: userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        monthlyRent: parseFloat(monthlyRent),
        charges: charges ? parseFloat(charges) : undefined,
        deposit: deposit ? parseFloat(deposit) : undefined,
        terms,
        content,
        customClauses,
      })

      return res.status(201).json({
        success: true,
        message: 'Contract created successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/contracts/:id
   */
  async getContractById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const contract = await contractService.getContractById(id, userId)

      return res.status(200).json({ success: true, data: { contract } })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/contracts/:id
   */
  async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const updateData: any = {}

      if (req.body.startDate) updateData.startDate = new Date(req.body.startDate)
      if (req.body.endDate) updateData.endDate = new Date(req.body.endDate)
      if (req.body.monthlyRent) updateData.monthlyRent = parseFloat(req.body.monthlyRent)
      if (req.body.charges !== undefined) updateData.charges = parseFloat(req.body.charges)
      if (req.body.deposit !== undefined) updateData.deposit = parseFloat(req.body.deposit)
      if (req.body.terms !== undefined) updateData.terms = req.body.terms
      if (req.body.status) updateData.status = req.body.status
      if (req.body.content !== undefined) updateData.content = req.body.content
      if (req.body.customClauses !== undefined) updateData.customClauses = req.body.customClauses

      const contract = await contractService.updateContract(id, userId, updateData)

      return res.status(200).json({
        success: true,
        message: 'Contract updated successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * DELETE /api/v1/contracts/:id
   */
  async deleteContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      await contractService.deleteContract(id, userId)

      return res.status(200).json({ success: true, message: 'Contract deleted successfully' })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/contracts
   */
  async getContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const { propertyId, status, page, limit, sortBy, sortOrder } = req.query

      const filters: any = {}
      if (req.user?.role === 'OWNER') {
        filters.ownerId = userId
      } else if (req.user?.role === 'TENANT') {
        filters.tenantId = userId
      }

      if (propertyId) filters.propertyId = propertyId as string
      if (status) filters.status = status as ContractStatus

      const pagination = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      }

      const result = await contractService.getContracts(filters, pagination)

      return res.status(200).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT /api/v1/contracts/:id/send
   */
  async sendContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const contract = await contractService.sendContract(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Contract sent successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/contracts/:id/sign
   */
  async signContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const { signature } = req.body

      const contract = await contractService.signContract(id, userId, signature, {
        ip: req.ip || req.socket?.remoteAddress,
        userAgent: req.headers['user-agent'],
      })

      return res.status(200).json({
        success: true,
        message: 'Contract signed successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/contracts/:id/activate
   */
  async activateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const contract = await contractService.activateContract(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Contract activated successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * PUT /api/v1/contracts/:id/terminate
   */
  async terminateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      const contract = await contractService.terminateContract(id, userId)

      return res.status(200).json({
        success: true,
        message: 'Contract terminated successfully',
        data: { contract },
      })
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return res.status(404).json({ success: false, message: 'Contract not found' })
        }
        if (error.message.includes('Unauthorized')) {
          return res.status(403).json({ success: false, message: error.message })
        }
        return res.status(400).json({ success: false, message: error.message })
      }
      next(error)
    }
  }

  /**
   * GET /api/v1/contracts/statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' })
      }

      let statistics
      if (req.user?.role === 'OWNER') {
        statistics = await contractService.getOwnerStatistics(userId)
      } else if (req.user?.role === 'TENANT') {
        statistics = await contractService.getTenantStatistics(userId)
      } else {
        return res.status(403).json({ success: false, message: 'Forbidden' })
      }

      return res.status(200).json({ success: true, data: { statistics } })
    } catch (error) {
      next(error)
    }
  }
}

export const contractController = new ContractController()
