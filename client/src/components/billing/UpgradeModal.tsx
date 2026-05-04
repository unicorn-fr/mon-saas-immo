/**
 * UpgradeModal — affiché quand l'API retourne { error: 'feature_not_available' }
 *
 * Usage:
 *   const { showUpgrade, UpgradeModal } = useUpgradeModal()
 *
 *   // Dans un catch :
 *   if (err.response?.data?.error === 'feature_not_available') {
 *     showUpgrade({
 *       feature: 'Paiement SEPA automatique',
 *       requiredPlan: err.response.data.upgrade_required,
 *       message: err.response.data.message,
 *     })
 *   }
 */

import { useState, useCallback } from 'react'
import { X, Zap, ArrowRight, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'
import { apiClient } from '../../services/api.service'
import { PLANS, type PlanId } from '../../config/pricing'

interface UpgradeModalProps {
  feature: string
  requiredPlan: string   // 'SOLO' | 'PRO' | 'EXPERT'
  message?: string
  onClose: () => void
}

const PLAN_ID_MAP: Record<string, PlanId> = {
  SOLO: 'solo',
  PRO: 'pro',
  EXPERT: 'expert',
}

const PLAN_LABELS: Record<string, string> = {
  SOLO: 'Solo',
  PRO: 'Pro',
  EXPERT: 'Expert',
}

export function UpgradeModal({ feature, requiredPlan, message, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const planId = PLAN_ID_MAP[requiredPlan] ?? 'pro'
  const plan = PLANS.find(p => p.id === planId)

  const handleUpgrade = async () => {
    if (!plan?.priceIds) {
      navigate('/pricing')
      onClose()
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.post<{ url: string }>('/stripe/checkout', {
        priceId: plan.priceIds.monthly, // mensuel pour minimiser la friction
      })
      window.location.href = res.data.url
    } catch {
      toast.error('Erreur lors de la redirection. Accède à la page pricing.')
      navigate('/pricing')
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(13,12,10,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 8px 40px rgba(13,12,10,0.15)',
          position: 'relative',
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
        >
          <X style={{ width: 18, height: 18, color: BAI.inkFaint }} />
        </button>

        {/* Icon */}
        <div style={{ width: 48, height: 48, borderRadius: 12, background: BAI.ownerLight, border: `1px solid ${BAI.ownerBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Lock style={{ width: 22, height: 22, color: BAI.owner }} />
        </div>

        {/* Titre */}
        <p style={{ fontFamily: BAI.fontBody, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel, margin: '0 0 6px' }}>
          Fonctionnalité verrouillée
        </p>
        <h2 style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 22, color: BAI.ink, margin: '0 0 10px' }}>
          {feature}
        </h2>

        {message && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid, lineHeight: 1.6, margin: '0 0 20px' }}>
            {message}
          </p>
        )}

        {/* Plan requis */}
        {plan && (
          <div style={{ background: BAI.bgMuted, border: `1px solid ${BAI.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, color: BAI.ink, margin: '0 0 2px' }}>
                  Plan {PLAN_LABELS[requiredPlan]}
                </p>
                <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkMid, margin: 0 }}>
                  {plan.description}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                <span style={{ fontFamily: BAI.fontDisplay, fontSize: 22, fontWeight: 700, color: BAI.ink }}>
                  {plan.monthlyPrice.toFixed(2).replace('.', ',')} €
                </span>
                <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}> /mois</span>
              </div>
            </div>
          </div>
        )}

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: BAI.owner, color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600,
              cursor: 'pointer', opacity: loading ? 0.7 : 1,
            }}
          >
            <Zap style={{ width: 15, height: 15 }} />
            {loading ? 'Chargement...' : `Passer en ${PLAN_LABELS[requiredPlan]} — ${plan?.monthlyPrice.toFixed(2).replace('.', ',')} €/mois`}
          </button>
          <button
            onClick={() => { navigate('/pricing'); onClose() }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 10, border: `1px solid ${BAI.border}`,
              background: 'transparent', color: BAI.inkMid,
              fontFamily: BAI.fontBody, fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Voir tous les plans <ArrowRight style={{ width: 13, height: 13 }} />
          </button>
        </div>

        {plan?.trialDays && (
          <p style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint, textAlign: 'center', margin: '12px 0 0' }}>
            {plan.trialDays} jours d'essai gratuit — sans carte bancaire
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Hook pour utiliser facilement le modal depuis n'importe où ───────────────
interface UpgradeState {
  feature: string
  requiredPlan: string
  message?: string
}

export function useUpgradeModal() {
  const [state, setState] = useState<UpgradeState | null>(null)

  const showUpgrade = useCallback((s: UpgradeState) => setState(s), [])
  const hideUpgrade = useCallback(() => setState(null), [])

  const modal = state ? (
    <UpgradeModal
      feature={state.feature}
      requiredPlan={state.requiredPlan}
      message={state.message}
      onClose={hideUpgrade}
    />
  ) : null

  return { showUpgrade, hideUpgrade, UpgradeModal: modal }
}

// ─── Intercepteur global Axios (à appeler une fois dans App.tsx) ──────────────
// Exemple d'utilisation dans les services :
//
//   import { handleUpgradeError } from '../components/billing/UpgradeModal'
//
//   catch (err) {
//     if (!handleUpgradeError(err, showUpgrade)) throw err
//   }

export function handleUpgradeError(
  err: unknown,
  showUpgrade: (s: UpgradeState) => void,
  featureLabel?: string
): boolean {
  const data = (err as { response?: { data?: { error?: string; upgrade_required?: string; message?: string } } })?.response?.data
  if (data?.error === 'feature_not_available' && data.upgrade_required) {
    showUpgrade({
      feature: featureLabel ?? 'Cette fonctionnalité',
      requiredPlan: data.upgrade_required,
      message: data.message,
    })
    return true
  }
  return false
}
