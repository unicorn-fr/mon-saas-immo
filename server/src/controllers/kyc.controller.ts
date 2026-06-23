import { Request, Response } from 'express'
import { readFile } from 'fs/promises'
import { KycDocumentType } from '@prisma/client'
import { prisma } from '../config/database.js'
import { analyzeIdentityDocument } from '../services/kyc/ocr.service.js'
import { encryptEmbedding, verifyFaceMatch, FaceEmbedding } from '../services/kyc/biometric.service.js'
import { appendAuditEntry } from '../services/kyc/auditLog.service.js'
import { encryptField, sha256 } from '../utils/encryption.util.js'
import { uploadBufferToCloudinary, generateSignedUrl } from '../utils/cloudinary.util.js'
import { secureDelete } from '../utils/secureDelete.util.js'

export class KycController {

  /** GET /kyc/status — Statut KYC de l'utilisateur connecté */
  async getStatus(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const kyc = await prisma.kycVerification.findUnique({
      where: { userId },
      select: {
        status: true,
        documentType: true,
        firstName: true,
        lastName: true,
        biometricVerifiedAt: true,
        verifiedAt: true,
        attempts: true,
        documentDeletedAt: true,
      },
    })
    return res.json({ success: true, data: kyc })
  }

  /**
   * POST /kyc/upload-document
   * Reçoit la pièce d'identité, extrait les données via OCR+MRZ,
   * supprime le fichier immédiatement (RGPD), stocke l'embedding facial chiffré.
   */
  async uploadDocument(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const file = req.file
    const { documentType, faceEmbedding } = req.body

    if (!file) return res.status(400).json({ success: false, message: 'Fichier requis' })
    if (!faceEmbedding) {
      await secureDelete(file.path).catch(() => {})
      return res.status(400).json({ success: false, message: 'Embedding facial requis' })
    }

    // Vérifier max 5 tentatives (anti-brute force)
    const existing = await prisma.kycVerification.findUnique({ where: { userId } })
    if (existing && existing.attempts >= 5) {
      await secureDelete(file.path).catch(() => {})
      return res.status(429).json({ success: false, message: 'Nombre maximum de tentatives atteint' })
    }

    try {
      // 1. OCR + MRZ (supprime le fichier en interne après extraction)
      const ocrResult = await analyzeIdentityDocument(file.path)
      const deletedAt = new Date()

      if (ocrResult.confidence < 30) {
        return res.status(422).json({ success: false, message: 'Document illisible. Veuillez prendre une photo plus nette.' })
      }

      // 2. Chiffrer les données sensibles
      const documentNumberEnc = ocrResult.documentNumber
        ? encryptField(ocrResult.documentNumber)
        : null

      // 3. Chiffrer l'embedding facial du document
      const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
      const faceEmbeddingEnc = encryptEmbedding(embedding)

      // 4. Audit log
      let auditChain = appendAuditEntry(existing?.signatureAuditChain, 'DOCUMENT_UPLOADED', userId, {
        documentType: documentType as string,
        confidence: ocrResult.confidence,
      })
      auditChain = appendAuditEntry(auditChain, 'OCR_COMPLETED', userId, {
        hasFirstName: !!ocrResult.firstName,
        hasLastName: !!ocrResult.lastName,
        hasMrz: !!ocrResult.mrzLine1,
      })
      auditChain = appendAuditEntry(auditChain, 'DOCUMENT_DELETED', userId, { deletedAt: deletedAt.toISOString() })

      // 5. Upsert KycVerification
      const kyc = await prisma.kycVerification.upsert({
        where: { userId },
        create: {
          userId,
          status: 'DOCUMENT_VERIFIED',
          documentType: ((documentType as string) || 'CNI') as KycDocumentType,
          firstName: ocrResult.firstName,
          lastName: ocrResult.lastName,
          birthDate: ocrResult.birthDate,
          documentExpiry: ocrResult.documentExpiry,
          nationality: ocrResult.nationality,
          documentNumberEnc,
          mrzLine1: ocrResult.mrzLine1,
          mrzLine2: ocrResult.mrzLine2,
          documentDeletedAt: deletedAt,
          faceEmbeddingEnc,
          signatureAuditChain: auditChain,
          attempts: 1,
          ipAddress: req.ip,
        },
        update: {
          status: 'DOCUMENT_VERIFIED',
          documentType: ((documentType as string) || 'CNI') as KycDocumentType,
          firstName: ocrResult.firstName,
          lastName: ocrResult.lastName,
          birthDate: ocrResult.birthDate,
          documentExpiry: ocrResult.documentExpiry,
          nationality: ocrResult.nationality,
          documentNumberEnc,
          mrzLine1: ocrResult.mrzLine1,
          mrzLine2: ocrResult.mrzLine2,
          documentDeletedAt: deletedAt,
          faceEmbeddingEnc,
          signatureAuditChain: auditChain,
          attempts: { increment: 1 },
        },
        select: { id: true, status: true, firstName: true, lastName: true, documentDeletedAt: true }
      })

      return res.json({
        success: true,
        data: {
          kycId: kyc.id,
          status: kyc.status,
          firstName: kyc.firstName,
          lastName: kyc.lastName,
          documentDeleted: !!kyc.documentDeletedAt,
          extracted: {
            hasName: !!(ocrResult.firstName && ocrResult.lastName),
            hasBirthDate: !!ocrResult.birthDate,
            hasMrz: !!ocrResult.mrzLine1,
          }
        }
      })
    } catch (err) {
      // Sécurité : s'assurer que le fichier est supprimé même en cas d'erreur
      try { await secureDelete(file.path) } catch { /* ignore */ }
      console.error('[KYC] uploadDocument error:', err)
      return res.status(500).json({ success: false, message: "Erreur lors de l'analyse du document" })
    }
  }

  /**
   * POST /kyc/verify-biometric
   * Reçoit l'embedding webcam + score liveness, compare avec l'embedding stocké.
   */
  async verifyBiometric(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const { faceEmbedding, livenessScore } = req.body

    if (!faceEmbedding) return res.status(400).json({ success: false, message: 'Embedding facial requis' })
    if (typeof livenessScore !== 'number' || livenessScore < 0.6) {
      return res.status(422).json({
        success: false,
        message: "Liveness check insuffisant. Veuillez vous assurer d'être bien éclairé et de bouger légèrement.",
      })
    }

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    if (!kyc || !kyc.faceEmbeddingEnc) {
      return res.status(400).json({ success: false, message: "Veuillez d'abord vérifier votre pièce d'identité" })
    }

    const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
    const { match, score } = verifyFaceMatch(kyc.faceEmbeddingEnc, embedding)

    let auditChain = appendAuditEntry(kyc.signatureAuditChain, 'BIOMETRIC_CAPTURED', userId, { livenessScore })
    auditChain = appendAuditEntry(auditChain, 'LIVENESS_VERIFIED', userId, { score: livenessScore })

    if (!match) {
      auditChain = appendAuditEntry(auditChain, 'KYC_FAILED', userId, { reason: 'face_mismatch', score })
      await prisma.kycVerification.update({
        where: { userId },
        data: {
          status: 'FAILED',
          livenessScore,
          faceMatchScore: score,
          signatureAuditChain: auditChain,
          attempts: { increment: 1 },
        }
      })
      return res.status(422).json({
        success: false,
        message: "Le visage ne correspond pas à la pièce d'identité. Score : " + score.toFixed(2),
      })
    }

    auditChain = appendAuditEntry(auditChain, 'FACE_MATCHED', userId, { score })

    await prisma.kycVerification.update({
      where: { userId },
      data: {
        status: 'BIOMETRIC_VERIFIED',
        livenessScore,
        faceMatchScore: score,
        biometricVerifiedAt: new Date(),
        signatureAuditChain: auditChain,
      }
    })

    return res.json({ success: true, data: { match: true, score, status: 'BIOMETRIC_VERIFIED' } })
  }

  /**
   * POST /kyc/sign/:contractId
   * Reçoit : embedding de vérification + blob vidéo + image signature.
   * Génère la preuve de signature avec horodatage et hash video.
   */
  async signWithVideo(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const { contractId } = req.params
    const { faceEmbedding, videoHash, signatureImageBase64 } = req.body
    const videoFile = req.file

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    if (!kyc || kyc.status !== 'BIOMETRIC_VERIFIED') {
      if (videoFile) await secureDelete(videoFile.path).catch(() => {})
      return res.status(403).json({ success: false, message: 'Vérification biométrique requise avant signature' })
    }

    // Re-vérification faciale rapide
    if (faceEmbedding && kyc.faceEmbeddingEnc) {
      const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
      const { match, score } = verifyFaceMatch(kyc.faceEmbeddingEnc, embedding, 0.75)
      if (!match) {
        if (videoFile) await secureDelete(videoFile.path).catch(() => {})
        return res.status(422).json({
          success: false,
          message: `Vérification d'identité échouée (score: ${score.toFixed(2)})`,
        })
      }
    }

    const signatureTimestamp = new Date()
    let signatureVideoUrl: string | undefined
    let signatureImageUrl: string | undefined

    try {
      // Upload vidéo sur Cloudinary (authentifiée, resource_type: video)
      if (videoFile) {
        const videoBuffer = await readFile(videoFile.path)
        const publicId = await uploadBufferToCloudinary(
          videoBuffer,
          videoFile.originalname || 'signature.webm',
          {
            folder: `kyc/signatures/${userId}`,
            resource_type: 'video',
            type: 'authenticated',
          }
        )
        signatureVideoUrl = generateSignedUrl(publicId, 3600 * 24 * 365) // 1 an
        await secureDelete(videoFile.path)
      }

      // Upload image signature sur Cloudinary (base64 → buffer)
      if (signatureImageBase64) {
        const base64Data = (signatureImageBase64 as string).replace(/^data:image\/\w+;base64,/, '')
        const imgBuffer = Buffer.from(base64Data, 'base64')
        const imgPublicId = await uploadBufferToCloudinary(imgBuffer, 'signature.png', {
          folder: `kyc/signature-images/${userId}`,
          type: 'authenticated',
        })
        signatureImageUrl = generateSignedUrl(imgPublicId, 3600 * 24 * 365)
      }

      // Audit chain finale
      let auditChain = appendAuditEntry(kyc.signatureAuditChain, 'SIGNATURE_STARTED', userId, { contractId })
      if (signatureVideoUrl) {
        auditChain = appendAuditEntry(auditChain, 'VIDEO_RECORDED', userId, {
          videoHash: (videoHash as string | undefined) ?? sha256(signatureTimestamp.toISOString()),
          signatureTimestamp: signatureTimestamp.toISOString(),
        })
      }
      auditChain = appendAuditEntry(auditChain, 'SIGNATURE_COMPLETED', userId, {
        contractId,
        signatureTimestamp: signatureTimestamp.toISOString(),
        hasVideo: !!signatureVideoUrl,
      })
      auditChain = appendAuditEntry(auditChain, 'KYC_COMPLETED', userId, {})

      await prisma.kycVerification.update({
        where: { userId },
        data: {
          status: 'COMPLETED',
          signatureVideoUrl,
          signatureVideoHash: (videoHash as string | null) || null,
          signatureImageUrl,
          signatureTimestamp,
          signatureAuditChain: auditChain,
          verifiedAt: new Date(),
        }
      })

      return res.json({
        success: true,
        data: {
          status: 'COMPLETED',
          signatureTimestamp: signatureTimestamp.toISOString(),
          hasVideoProof: !!signatureVideoUrl,
          auditChainLength: (JSON.parse(auditChain) as unknown[]).length,
        }
      })
    } catch (err) {
      if (videoFile) await secureDelete(videoFile.path).catch(() => {})
      console.error('[KYC] signWithVideo error:', err)
      return res.status(500).json({ success: false, message: 'Erreur lors de la signature' })
    }
  }
}

export const kycController = new KycController()
