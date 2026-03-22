import { getApps, initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { env } from '../config/env.js'

/**
 * Initialise le SDK Firebase Admin (singleton).
 * Utilise FIREBASE_SERVICE_ACCOUNT_JSON (JSON stringifié de la clé de service).
 */
function initFirebaseAdmin() {
  if (getApps().length > 0) return

  if (!env.FIREBASE_SERVICE_ACCOUNT) {
    console.warn('Firebase Admin non configuré (FIREBASE_SERVICE_ACCOUNT manquant)')
    return
  }

  try {
    const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT)
    initializeApp({ credential: cert(serviceAccount) })
  } catch (e) {
    console.error('Erreur initialisation Firebase Admin:', e)
  }
}

initFirebaseAdmin()

/**
 * Vérifie un ID token Firebase (émis après vérification OTP téléphone côté client).
 * Retourne le numéro de téléphone vérifié si le token est valide.
 */
export async function verifyFirebasePhoneToken(
  idToken: string
): Promise<{ phoneNumber: string; uid: string }> {
  const auth = getAuth()
  const decoded = await auth.verifyIdToken(idToken)

  if (!decoded.phone_number) {
    throw new Error('Token Firebase sans numéro de téléphone vérifié')
  }

  return {
    phoneNumber: decoded.phone_number,
    uid: decoded.uid,
  }
}
