import { Request, Response, NextFunction } from 'express'

export const requireEmailVerified = (req: Request, res: Response, next: NextFunction) => {
  // emailVerified est chargé par le middleware authenticate via getUserById
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Veuillez vérifier votre adresse email avant d'effectuer cette action.",
      code: 'EMAIL_NOT_VERIFIED',
    })
  }
  next()
}
