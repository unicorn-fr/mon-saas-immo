import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Layout } from '../components/layout/Layout'
import { apiClient } from '../services/api.service'
import toast from 'react-hot-toast'
import { ShieldCheck, Clock, CheckCircle2, AlertCircle, Camera, Lock, CreditCard } from 'lucide-react'

export default function VerifyIdentity() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const loadStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<{ status: string | null; isVerified: boolean }>('/stripe/identity-status')
      setStatus(res.data.status)
      if (res.data.isVerified) {
        toast.success('Identité vérifiée — vous pouvez continuer.')
        navigate(redirectTo, { replace: true })
      }
    } catch { /* ignore */ } finally {
      setChecking(false)
    }
  }, [navigate, redirectTo])

  useEffect(() => { loadStatus() }, [loadStatus])

  const handleVerify = async () => {
    setLoading(true)
    try {
      const res = await apiClient.post<{ clientSecret: string }>('/stripe/identity-verify')
      const stripeInstance = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')
      if (!stripeInstance) { toast.error('Stripe non disponible'); return }
      const { error } = await stripeInstance.verifyIdentity(res.data.clientSecret)
      if (error) {
        toast.error(error.message ?? 'Vérification annulée')
      } else {
        setStatus('processing')
        toast.success('Vérification soumise — résultat sous 24h.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la vérification')
    } finally {
      setLoading(false)
    }
  }

  const StatusBadge = () => {
    if (status === 'verified') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 600 }}>
        <CheckCircle2 size={14} /> Identité vérifiée
      </span>
    )
    if (status === 'processing') return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#fef9c3', color: '#854d0e', fontSize: 13, fontWeight: 600 }}>
        <Clock size={14} /> En cours de vérification
      </span>
    )
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: BAI.errorLight, color: BAI.error, fontSize: 13, fontWeight: 600 }}>
        <AlertCircle size={14} /> Non vérifié
      </span>
    )
  }

  return (
    <Layout>
      {/* Dark hero strip */}
      <div style={{
        background: '#0a0d1a',
        padding: 'clamp(40px,6vw,72px) clamp(16px,4vw,48px) clamp(36px,5vw,56px)',
        textAlign: 'center',
      }}>
        {/* Shield icon in glass circle */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(196,151,106,0.15)',
          border: '1px solid rgba(196,151,106,0.30)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          <ShieldCheck size={28} color={BAI.caramel} />
        </div>

        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: BAI.caramel,
          margin: '0 0 10px',
        }}>
          Sécurité &amp; Confiance
        </p>
        <h1 style={{
          fontFamily: BAI.fontDisplay,
          fontSize: 'clamp(26px,5vw,40px)',
          fontWeight: 700,
          fontStyle: 'italic',
          color: '#ffffff',
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          Vérification d'identité
        </h1>
        <p style={{
          fontFamily: BAI.fontBody,
          fontSize: 15,
          color: 'rgba(255,255,255,0.55)',
          maxWidth: 520,
          margin: '0 auto',
          lineHeight: 1.65,
        }}>
          Bailio exige une vérification d'identité pour garantir la sécurité de tous les utilisateurs. Cette étape est nécessaire avant de pouvoir postuler à une location ou créer un bail.
        </p>
      </div>

      {/* Light card section */}
      <div style={{
        background: BAI.bgBase,
        display: 'flex',
        justifyContent: 'center',
        padding: 'clamp(32px,5vw,56px) clamp(16px,4vw,48px)',
        fontFamily: BAI.fontBody,
      }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          {/* Card */}
          <div style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: 16,
            padding: 32,
            boxShadow: BAI.shadowMd,
          }}>
            {checking ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 14 }}>
                Vérification du statut…
              </div>
            ) : (
              <>
                {/* Status row */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: `1px solid ${BAI.border}`,
                }}>
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink }}>Statut actuel</span>
                  <StatusBadge />
                </div>

                {status === 'processing' ? (
                  <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
                    <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: '#92400e', margin: 0, lineHeight: 1.6 }}>
                      <strong>Vérification en cours</strong> — Stripe analyse vos documents. Vous recevrez un email de confirmation dans les 24h. Si le statut n'est pas mis à jour, revenez dans quelques instants.
                    </p>
                  </div>
                ) : status !== 'verified' ? (
                  <>
                    <div style={{ marginBottom: 24 }}>
                      {[
                        { Icon: CreditCard, text: 'Carte nationale d\'identité ou passeport en cours de validité' },
                        { Icon: Camera, text: 'Photo claire du document (recto-verso pour la CNI)' },
                        { Icon: Lock, text: 'Vos données sont chiffrées et traitées par Stripe' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: BAI.bgMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <item.Icon size={14} style={{ color: BAI.caramel }} />
                          </div>
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.5, paddingTop: 6 }}>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      style={{
                        width: '100%',
                        padding: '14px 24px',
                        background: BAI.night,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontFamily: BAI.fontBody,
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        opacity: loading ? 0.7 : 1,
                      }}
                    >
                      {loading ? 'Chargement…' : <><ShieldCheck size={18} /> Vérifier mon identité</>}
                    </button>
                  </>
                ) : null}

                {/* Back link */}
                <button
                  onClick={() => navigate(-1)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 20,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    color: BAI.inkFaint,
                    padding: 0,
                  }}
                >
                  ← Retour
                </button>
              </>
            )}
          </div>

          {/* Info footer */}
          {!checking && status !== 'verified' && (
            <p style={{
              textAlign: 'center',
              fontFamily: BAI.fontBody,
              fontSize: 12,
              color: BAI.inkFaint,
              marginTop: 20,
              lineHeight: 1.6,
            }}>
              La vérification est effectuée par <strong>Stripe Identity</strong>, un service certifié conforme aux normes eIDAS. Bailio ne stocke pas vos données biométriques.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
