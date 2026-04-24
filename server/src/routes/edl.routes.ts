import { Router } from 'express'
import { edlController } from '../controllers/edl.controller.js'
import { authenticate, authorize } from '../middlewares/auth.middleware.js'

const router = Router()

// Owner : créer/récupérer la session EDL d'un contrat
router.post('/sessions', authenticate, authorize('OWNER'), edlController.createSession.bind(edlController))

// Locataire : rejoindre via PIN
router.post('/sessions/join', authenticate, edlController.joinSession.bind(edlController))

// Récupérer session par contrat (avant /:id pour éviter conflit)
router.get('/sessions/by-contract/:contractId', authenticate, edlController.getByContract.bind(edlController))

// Récupérer session par ID
router.get('/sessions/:id', authenticate, edlController.getSession.bind(edlController))

// SSE — EventSource ne peut pas envoyer Authorization header → auth via query token
router.get('/sessions/:id/stream', edlController.streamSession.bind(edlController))

// Mettre à jour les données EDL
router.patch('/sessions/:id/data', authenticate, edlController.updateData.bind(edlController))

// Signer l'EDL (owner ou tenant) — déclenche la finalisation quand les 2 ont signé
router.post('/sessions/:id/sign', authenticate, edlController.signSession.bind(edlController))

// Finaliser la session (compat — appelé auto depuis signSession)
router.post('/sessions/:id/complete', authenticate, edlController.completeSession.bind(edlController))

export default router
