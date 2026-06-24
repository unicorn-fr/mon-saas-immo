import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { KycStepper } from '../../components/kyc/KycStepper'
import { DocumentCapture } from '../../components/kyc/DocumentCapture'
import { LivenessCheck } from '../../components/kyc/LivenessCheck'
import { VideoSignature } from '../../components/kyc/VideoSignature'
import { apiClient } from '../../services/api.service'

export default function KycFlow() {
  const { contractId } = useParams<{ contractId?: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [docData, setDocData] = useState<{ firstName: string; lastName: string } | null>(null)
  const [completing, setCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  const isStandalone = !contractId

  const handleLivenessComplete = async (score: number) => {
    if (isStandalone) {
      // Mode owner : finaliser le KYC sans contrat
      setCompleting(true)
      setCompleteError(null)
      try {
        await apiClient.post('/kyc/complete')
        setStep(4) // Success screen
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message
          || 'Erreur lors de la finalisation. Réessayez.'
        setCompleteError(msg)
        setStep(3) // Stay on completion step
      } finally {
        setCompleting(false)
      }
    } else {
      setStep(3) // Mode contrat : passer à la signature vidéo
    }
    void score
  }

  // Stepper adapté selon le mode
  const totalSteps = isStandalone ? 3 : 4

  return (
    <div style={{
      minHeight: '100vh',
      background: BAI.bgBase,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(20px,4vw,40px)',
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: BAI.night,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Shield size={24} color={BAI.caramel} />
          </div>
          <p style={{
            fontFamily: BAI.fontBody, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel, margin: '0 0 6px',
          }}>
            Vérification d'identité
          </p>
          <h1 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 'clamp(24px,4vw,36px)', color: BAI.ink, margin: 0, lineHeight: 1.1,
          }}>
            {isStandalone ? 'Confirmez votre identité' : 'Signez votre bail en toute sécurité'}
          </h1>
        </div>

        {/* Stepper */}
        <KycStepper current={step} totalSteps={totalSteps} />

        {/* Carte principale */}
        <div style={{
          background: BAI.bgSurface, border: `1px solid ${BAI.border}`,
          borderRadius: 20, padding: 'clamp(24px,4vw,40px)', boxShadow: BAI.shadowMd,
        }}>

          {/* Étape 1 : pièce d'identité */}
          {step === 1 && (
            <DocumentCapture onComplete={(data) => { setDocData(data); setStep(2) }} />
          )}

          {/* Étape 2 : liveness */}
          {step === 2 && (
            <LivenessCheck onComplete={handleLivenessComplete} />
          )}

          {/* Étape 3 : signature vidéo (mode contrat seulement) */}
          {step === 3 && !isStandalone && contractId && (
            <VideoSignature
              contractId={contractId}
              contractTitle={`Contrat ${contractId}`}
              onComplete={() => setStep(4)}
            />
          )}

          {/* Étape 3 : finalisation standalone (loading ou erreur) */}
          {step === 3 && isStandalone && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              {completing ? (
                <>
                  <div style={{
                    width: 48, height: 48, border: `3px solid ${BAI.border}`,
                    borderTopColor: BAI.night, borderRadius: '50%',
                    margin: '0 auto 16px', animation: 'spin 0.8s linear infinite',
                  }} />
                  <p style={{ fontFamily: BAI.fontBody, color: BAI.inkMid }}>
                    Finalisation en cours…
                  </p>
                </>
              ) : completeError ? (
                <>
                  <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error, marginBottom: 16 }}>
                    {completeError}
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    style={{
                      background: BAI.night, color: '#fff', border: 'none',
                      borderRadius: 8, padding: '12px 24px',
                      fontFamily: BAI.fontBody, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Réessayer
                  </button>
                </>
              ) : null}
            </div>
          )}

          {/* Étape 4 / Succès */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: BAI.tenantLight, border: `2px solid ${BAI.tenantBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle size={36} color={BAI.tenant} />
              </div>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 28, color: BAI.ink, margin: '0 0 10px',
              }}>
                {isStandalone ? 'Identité confirmée !' : 'Vérification complète !'}
              </h3>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 15, color: BAI.inkMid,
                margin: '0 0 28px', lineHeight: 1.6,
              }}>
                {isStandalone
                  ? `${docData?.firstName ? `${docData.firstName}, votre` : 'Votre'} identité a été vérifiée avec succès. Le badge de vérification apparaîtra sur votre profil.`
                  : `${docData?.firstName ? `${docData.firstName}, votre` : 'Votre'} identité a été confirmée et votre bail est signé. Vous allez recevoir un email de confirmation.`
                }
              </p>
              <button
                onClick={() => navigate(
                  contractId ? `/contracts/${contractId}` :
                  '/dashboard/owner'
                )}
                style={{
                  background: BAI.night, color: '#fff', border: 'none',
                  borderRadius: 10, padding: '14px 32px',
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                {contractId ? 'Voir mon contrat →' : 'Retour au tableau de bord →'}
              </button>
            </div>
          )}
        </div>

        {/* Badges sécurité */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20,
          marginTop: 20, flexWrap: 'wrap',
        }}>
          {['AES-256', 'RGPD / CNIL', 'Preuve biométrique'].map(b => (
            <span key={b} style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
