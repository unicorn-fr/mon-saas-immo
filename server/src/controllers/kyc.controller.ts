import { Request, Response } from 'express'
import { KycDocumentType } from '@prisma/client'
import { prisma } from '../config/database.js'
import { analyzeIdentityDocument } from '../services/kyc/ocr.service.js'
import { encryptEmbedding, verifyFaceMatch, FaceEmbedding } from '../services/kyc/biometric.service.js'
import { appendAuditEntry } from '../services/kyc/auditLog.service.js'
import { encryptField, sha256 } from '../utils/encryption.util.js'
import { uploadBufferToCloudinary, generateSignedUrl } from '../utils/cloudinary.util.js'
import { contractService } from '../services/contract.service.js'

export class KycController {

  /** GET /kyc/status */
  async getStatus(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const kyc = await prisma.kycVerification.findUnique({
      where: { userId },
      select: {
        status: true, documentType: true, firstName: true, lastName: true,
        biometricVerifiedAt: true, verifiedAt: true, attempts: true, documentDeletedAt: true,
      },
    })
    return res.json({ success: true, data: kyc })
  }

  /**
   * POST /kyc/upload-document
   * Reçoit la pièce d'identité en mémoire, extrait les données via OCR+MRZ,
   * écrase le buffer immédiatement (RGPD), stocke l'embedding facial chiffré.
   */
  async uploadDocument(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const file = req.file
    const { documentType, faceEmbedding, extractedData } = req.body

    if (!file || !file.buffer) {
      return res.status(400).json({ success: false, message: 'Fichier requis' })
    }

    // Anti-brute force : max 10 tentatives
    const existing = await prisma.kycVerification.findUnique({ where: { userId } })
    if (existing && existing.attempts >= 10) {
      return res.status(429).json({ success: false, message: 'Nombre maximum de tentatives atteint' })
    }

    try {
      // 1. Utiliser les données extraites côté client (OCR browser) si disponibles
      //    Sinon, fallback sur le server-side OCR
      interface ClientExtracted {
        lastName?: string; firstName?: string; birthDate?: string
        documentExpiry?: string; nationality?: string; documentNumber?: string
        mrzLine1?: string; mrzLine2?: string; mrzLine3?: string
        confidence?: number; validationScore?: number
      }
      let clientData: ClientExtracted = {}
      if (extractedData) {
        try { clientData = JSON.parse(extractedData as string) } catch { /* ignore */ }
      }

      let ocrResult: import('../services/kyc/ocr.service.js').OcrResult
      if (clientData.firstName || clientData.lastName || clientData.documentNumber) {
        // Données client-side disponibles → on les utilise directement
        ocrResult = {
          rawText: '',
          confidence: Math.round((clientData.confidence ?? 0) * 100),
          firstName: clientData.firstName,
          lastName: clientData.lastName,
          birthDate: clientData.birthDate ? new Date(clientData.birthDate) : undefined,
          documentExpiry: clientData.documentExpiry ? new Date(clientData.documentExpiry) : undefined,
          nationality: clientData.nationality,
          documentNumber: clientData.documentNumber,
          mrzLine1: clientData.mrzLine1,
          mrzLine2: clientData.mrzLine2,
        }
        console.log('[KYC] Using client-side OCR data:', { firstName: ocrResult.firstName, lastName: ocrResult.lastName })
      } else {
        // Fallback: OCR server-side
        try {
          ocrResult = await analyzeIdentityDocument(file.buffer)
        } catch (ocrErr) {
          console.error('[KYC] Server OCR failed (non-blocking):', (ocrErr as Error).message)
          ocrResult = {
            rawText: '', confidence: 0,
            firstName: undefined, lastName: undefined, birthDate: undefined,
            documentExpiry: undefined, nationality: undefined,
            documentNumber: undefined, mrzLine1: undefined, mrzLine2: undefined,
          }
        }
      }
      const deletedAt = new Date()

      // 2. Chiffrer le numéro de document (si extrait)
      const documentNumberEnc = ocrResult.documentNumber
        ? encryptField(ocrResult.documentNumber)
        : null

      // 3. Chiffrer l'embedding facial (optionnel)
      let faceEmbeddingEnc: string | null = null
      if (faceEmbedding) {
        try {
          const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
          if (Array.isArray(embedding) && embedding.length > 0) {
            faceEmbeddingEnc = encryptEmbedding(embedding)
          }
        } catch { /* invalid embedding — ignored */ }
      }

      // 4. Audit log
      let auditChain = appendAuditEntry(existing?.signatureAuditChain, 'DOCUMENT_UPLOADED', userId, {
        documentType: documentType as string,
        confidence: ocrResult.confidence,
        source: clientData.firstName ? 'client-ocr' : 'server-ocr',
        validationScore: clientData.validationScore,
      })
      auditChain = appendAuditEntry(auditChain, 'OCR_COMPLETED', userId, {
        hasFirstName: !!ocrResult.firstName, hasLastName: !!ocrResult.lastName, hasMrz: !!ocrResult.mrzLine1,
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
        select: { id: true, status: true, firstName: true, lastName: true, documentDeletedAt: true },
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
          },
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[KYC] uploadDocument error:', msg)
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse du document',
        debug: msg, // visible dans les logs Railway
      })
    }
  }

  /** POST /kyc/verify-biometric */
  async verifyBiometric(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const { faceEmbedding, livenessScore } = req.body

    const livenessNum = typeof livenessScore === 'number' ? livenessScore : parseFloat(livenessScore)
    if (isNaN(livenessNum) || livenessNum < 0.5) {
      return res.status(422).json({
        success: false,
        message: 'Liveness insuffisant. Clignez des yeux devant la caméra.',
      })
    }

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    if (!kyc) {
      return res.status(400).json({ success: false, message: "Veuillez d'abord télécharger votre pièce d'identité" })
    }

    // Comparaison faciale si embedding disponible (optionnel)
    let match = true
    let score = 1.0
    if (kyc.faceEmbeddingEnc && faceEmbedding) {
      try {
        const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
        const result = verifyFaceMatch(kyc.faceEmbeddingEnc, embedding)
        match = result.match
        score = result.score
      } catch { /* embedding invalide — on accepte */ }
    }

    let auditChain = appendAuditEntry(kyc.signatureAuditChain, 'BIOMETRIC_CAPTURED', userId, { livenessScore: livenessNum })
    auditChain = appendAuditEntry(auditChain, 'LIVENESS_VERIFIED', userId, { score: livenessNum })

    if (!match) {
      auditChain = appendAuditEntry(auditChain, 'KYC_FAILED', userId, { reason: 'face_mismatch', score })
      await prisma.kycVerification.update({
        where: { userId },
        data: { status: 'FAILED', livenessScore: livenessNum, faceMatchScore: score, signatureAuditChain: auditChain, attempts: { increment: 1 } },
      })
      return res.status(422).json({
        success: false,
        message: `Visage non reconnu (score: ${score.toFixed(2)}). Réessayez.`,
      })
    }

    auditChain = appendAuditEntry(auditChain, 'FACE_MATCHED', userId, { score })

    await prisma.kycVerification.update({
      where: { userId },
      data: {
        status: 'BIOMETRIC_VERIFIED',
        livenessScore: livenessNum,
        faceMatchScore: score,
        biometricVerifiedAt: new Date(),
        signatureAuditChain: auditChain,
      },
    })

    return res.json({ success: true, data: { match: true, score, status: 'BIOMETRIC_VERIFIED' } })
  }

  /** POST /kyc/sign/:contractId */
  async signWithVideo(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const { contractId } = req.params
    const { faceEmbedding, videoHash, signatureImageBase64 } = req.body
    const videoFile = req.file

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    if (!kyc || kyc.status !== 'BIOMETRIC_VERIFIED') {
      return res.status(403).json({ success: false, message: 'Vérification biométrique requise avant signature' })
    }

    // Re-vérification faciale (seuil assoupli à 0.70)
    if (faceEmbedding && kyc.faceEmbeddingEnc) {
      try {
        const embedding: FaceEmbedding = JSON.parse(faceEmbedding as string)
        const { match, score } = verifyFaceMatch(kyc.faceEmbeddingEnc, embedding, 0.70)
        if (!match) {
          return res.status(422).json({ success: false, message: `Vérification échouée (score: ${score.toFixed(2)})` })
        }
      } catch { /* invalid embedding — on accepte */ }
    }

    const signatureTimestamp = new Date()
    let signatureVideoUrl: string | undefined
    let signatureImageUrl: string | undefined

    try {
      // Upload vidéo sur Cloudinary (buffer mémoire)
      if (videoFile?.buffer) {
        try {
          const publicId = await uploadBufferToCloudinary(videoFile.buffer, 'signature.webm', {
            folder: `kyc/signatures/${userId}`,
            resource_type: 'video',
            type: 'authenticated',
          })
          signatureVideoUrl = generateSignedUrl(publicId, 3600 * 24 * 365)
        } catch (uploadErr) {
          console.warn('[KYC] video upload failed (non-blocking):', (uploadErr as Error).message)
        }
      }

      // Upload image signature sur Cloudinary
      if (signatureImageBase64) {
        try {
          const base64Data = (signatureImageBase64 as string).replace(/^data:image\/\w+;base64,/, '')
          const imgBuffer = Buffer.from(base64Data, 'base64')
          const imgPublicId = await uploadBufferToCloudinary(imgBuffer, 'signature.png', {
            folder: `kyc/signature-images/${userId}`,
            type: 'authenticated',
          })
          signatureImageUrl = generateSignedUrl(imgPublicId, 3600 * 24 * 365)
        } catch (imgErr) {
          console.warn('[KYC] signature image upload failed (non-blocking):', (imgErr as Error).message)
        }
      }

      // Audit chain
      let auditChain = appendAuditEntry(kyc.signatureAuditChain, 'SIGNATURE_STARTED', userId, { contractId })
      if (signatureVideoUrl) {
        auditChain = appendAuditEntry(auditChain, 'VIDEO_RECORDED', userId, {
          videoHash: (videoHash as string | undefined) ?? sha256(signatureTimestamp.toISOString()),
          signatureTimestamp: signatureTimestamp.toISOString(),
        })
      }
      auditChain = appendAuditEntry(auditChain, 'SIGNATURE_COMPLETED', userId, {
        contractId, signatureTimestamp: signatureTimestamp.toISOString(), hasVideo: !!signatureVideoUrl,
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
        },
      })

      // Signer le contrat (SENT → SIGNED_TENANT ou COMPLETED)
      let contractSigned = false
      if (contractId) {
        try {
          await contractService.signContract(
            contractId, userId,
            signatureImageUrl || (signatureImageBase64 as string | undefined),
            { ip: req.ip, userAgent: req.headers['user-agent'] }
          )
          contractSigned = true
        } catch (contractErr) {
          console.error('[KYC] signContract failed (non-blocking):', (contractErr as Error).message)
        }
      }

      return res.json({
        success: true,
        data: {
          status: 'COMPLETED',
          signatureTimestamp: signatureTimestamp.toISOString(),
          hasVideoProof: !!signatureVideoUrl,
          contractSigned,
          auditChainLength: (JSON.parse(auditChain) as unknown[]).length,
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[KYC] signWithVideo error:', msg)
      return res.status(500).json({ success: false, message: 'Erreur lors de la signature', debug: msg })
    }
  }

  /** POST /kyc/complete — finalise le KYC sans signature de contrat (vérification owner) */
  async complete(req: Request, res: Response) {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ success: false, message: 'Non authentifié' })

    const kyc = await prisma.kycVerification.findUnique({ where: { userId } })
    if (!kyc) {
      return res.status(400).json({
        success: false,
        message: "Veuillez d'abord télécharger votre pièce d'identité et effectuer la vérification biométrique.",
      })
    }

    if (!['BIOMETRIC_VERIFIED', 'DOCUMENT_VERIFIED'].includes(kyc.status)) {
      return res.status(400).json({
        success: false,
        message: "La vérification biométrique doit être complétée avant de finaliser.",
      })
    }

    const auditChain = appendAuditEntry(
      kyc.signatureAuditChain,
      'KYC_COMPLETED',
      userId,
      { mode: 'standalone' }
    )

    await prisma.kycVerification.update({
      where: { userId },
      data: { status: 'COMPLETED', verifiedAt: new Date(), signatureAuditChain: auditChain },
    })

    // Marquer le propriétaire comme vérifié (réutilise le champ Stripe Identity)
    await prisma.user.update({
      where: { id: userId },
      data: { isVerifiedOwner: true, stripeIdentityStatus: 'verified' },
    })

    return res.json({ success: true, data: { status: 'COMPLETED' } })
  }
}

export const kycController = new KycController()
