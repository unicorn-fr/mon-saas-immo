import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Layout } from '../components/layout/Layout'
import { apiClient } from '../services/api.service'
import toast from 'react-hot-toast'
import { ShieldCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

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
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px', background: BAI.bgBase }}>
        <div style={{ maxWidth: 520, width: '100%' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${BAI.night}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <ShieldCheck size={32} color={BAI.night} />
            </div>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 8px' }}>
              Sécurité & Confiance
            </p>
            <h1 style={{ fontFamily: BAI.fontDisplay, fontSize: 'clamp(26px,5vw,36px)', fontWeight: 700, fontStyle: 'italic', color: BAI.ink, margin: '0 0 12px' }}>
              Vérification d'identité
            </h1>
            <p style={{ fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid, lineHeight: 1.6, margin: 0 }}>
              Bailio exige une vérification d'identité pour garantir la sécurité de tous les utilisateurs. Cette étape est nécessaire avant de pouvoir postuler à une location ou créer un bail.
            </p>
          </div>

          {/* Card */}
          <div style={{ background: BAI.bgSurface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: 32, boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
            {checking ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: BAI.inkFaint, fontFamily: BAI.fontBody, fontSize: 14 }}>
                Vérification du statut…
              </div>
            ) : (
              <>
                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BAI.border}` }}>
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
                        { icon: '🪪', text: 'Carte nationale d\'identité ou passeport en cours de validité' },
                        { icon: '📸', text: 'Photo claire du document (recto-verso pour la CNI)' },
                        { icon: '🔒', text: 'Vos données sont chiffrées et traitées par Stripe' },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 18, lineHeight: 1 }}>{item.icon}</span>
                          <span style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.5 }}>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={loading}
                      style={{ width: '100%', padding: '14px 24px', background: BAI.night, color: '#fff', border: 'none', borderRadius: 10, fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Chargement…' : <><ShieldCheck size={18} /> Vérifier mon identité</>}
                    </button>
                  </>
                ) : null}

                {/* Back link */}
                <button
                  onClick={() => navigate(-1)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkFaint, padding: 0 }}
                >
                  ← Retour
                </button>
              </>
            )}
          </div>

          {/* Info footer */}
          {!checking && status !== 'verified' && (
            <p style={{ textAlign: 'center', fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkFaint, marginTop: 20, lineHeight: 1.6 }}>
              La vérification est effectuée par <strong>Stripe Identity</strong>, un service certifié conforme aux normes eIDAS. Bailio ne stocke pas vos données biométriques.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}
