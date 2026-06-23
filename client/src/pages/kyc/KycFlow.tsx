import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { KycStepper } from '../../components/kyc/KycStepper'
import { DocumentCapture } from '../../components/kyc/DocumentCapture'
import { LivenessCheck } from '../../components/kyc/LivenessCheck'
import { VideoSignature } from '../../components/kyc/VideoSignature'

export default function KycFlow() {
  const { contractId } = useParams<{ contractId: string }>()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [docData, setDocData] = useState<{ firstName: string; lastName: string } | null>(null)

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
            fontFamily: BAI.fontBody,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: BAI.caramel,
            margin: '0 0 6px',
          }}>
            Vérification d'identité
          </p>
          <h1 style={{
            fontFamily: BAI.fontDisplay,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 'clamp(24px,4vw,36px)',
            color: BAI.ink,
            margin: 0,
            lineHeight: 1.1,
          }}>
            Signez votre bail en toute sécurité
          </h1>
        </div>

        {/* Stepper */}
        <KycStepper current={step} />

        {/* Carte principale */}
        <div style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 20,
          padding: 'clamp(24px,4vw,40px)',
          boxShadow: BAI.shadowMd,
        }}>
          {step === 1 && (
            <DocumentCapture onComplete={(data) => { setDocData(data); setStep(2) }} />
          )}
          {step === 2 && (
            <LivenessCheck onComplete={(_score) => setStep(3)} />
          )}
          {step === 3 && contractId && (
            <VideoSignature
              contractId={contractId}
              contractTitle={`Contrat ${contractId}`}
              onComplete={() => setStep(4)}
            />
          )}
          {step === 3 && !contractId && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.error }}>
                Identifiant de contrat manquant.
              </p>
            </div>
          )}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: 28, color: BAI.ink, margin: '0 0 10px',
              }}>
                Vérification complète !
              </h3>
              <p style={{
                fontFamily: BAI.fontBody, fontSize: 15, color: BAI.inkMid,
                margin: '0 0 28px', lineHeight: 1.6,
              }}>
                {docData?.firstName ? `${docData.firstName}, votre` : 'Votre'} identité a été confirmée et votre bail est signé. Vous allez recevoir un email de confirmation.
              </p>
              <button
                onClick={() => navigate('/dashboard/tenant')}
                style={{
                  background: BAI.night, color: '#fff', border: 'none',
                  borderRadius: 10, padding: '14px 32px',
                  fontFamily: BAI.fontBody, fontWeight: 600, fontSize: 15,
                  cursor: 'pointer', minHeight: 44,
                }}
              >
                Accéder à mon espace →
              </button>
            </div>
          )}
        </div>

        {/* Badges sécurité */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 20,
          marginTop: 20, flexWrap: 'wrap',
        }}>
          {['AES-256', 'eIDAS', 'RGPD / CNIL', 'Preuve vidéo'].map(b => (
            <span key={b} style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
