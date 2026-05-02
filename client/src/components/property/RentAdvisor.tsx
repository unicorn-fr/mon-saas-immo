import { useState } from 'react'
import { Sparkles, Loader2, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'
import { financeService, type RentAdvice } from '../../services/finance.service'

export interface RentAdvisorProps {
  city: string
  address: string
  postalCode: string
  surface: number
  bedrooms: number
  furnished: boolean
  type: string
  onApplyRent: (rent: number) => void
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function RentAdvisor({
  city,
  address,
  postalCode,
  surface,
  bedrooms,
  furnished,
  type,
  onApplyRent,
}: RentAdvisorProps) {
  const [status, setStatus] = useState<Status>('idle')
  const [advice, setAdvice] = useState<RentAdvice | null>(null)
  const [marketAvailable, setMarketAvailable] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [expanded, setExpanded] = useState(true)

  const canEstimate = city.trim().length > 0 && surface > 0

  async function estimate() {
    if (!canEstimate) return
    setStatus('loading')
    setAdvice(null)
    setErrorMsg('')
    try {
      const result = await financeService.getRentAdvice({
        city,
        address,
        postalCode,
        surface,
        bedrooms,
        furnished,
        type,
      })
      setAdvice(result.advice)
      setMarketAvailable(result.marketAvailable)
      setStatus('success')
      setExpanded(true)
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur lors de l\'estimation')
      setStatus('error')
    }
  }

  function applyRent() {
    if (advice) {
      onApplyRent(advice.recommendedRent)
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={estimate}
        disabled={!canEstimate || status === 'loading'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          background: canEstimate && status !== 'loading' ? BAI.caramelLight : BAI.bgMuted,
          border: `1px solid ${canEstimate && status !== 'loading' ? BAI.caramelBorder : BAI.border}`,
          borderRadius: BAI.radius,
          cursor: canEstimate && status !== 'loading' ? 'pointer' : 'not-allowed',
          fontFamily: BAI.fontBody,
          fontSize: 13,
          fontWeight: 600,
          color: canEstimate && status !== 'loading' ? BAI.caramel : BAI.inkFaint,
          minHeight: BAI.touchMin,
          transition: BAI.transition,
        }}
        title={!canEstimate ? 'Renseignez la ville et la surface pour estimer le loyer' : undefined}
      >
        {status === 'loading'
          ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          : <Sparkles size={14} />
        }
        {status === 'loading' ? 'Estimation en cours…' : 'Estimer le loyer avec l\'IA'}
      </button>

      {!canEstimate && (
        <p style={{
          fontSize: 12,
          color: BAI.inkFaint,
          marginTop: 6,
          fontFamily: BAI.fontBody,
        }}>
          Renseignez la ville et la surface pour activer l'estimation IA.
        </p>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div style={{
          marginTop: 12,
          background: BAI.errorLight,
          border: `1px solid #fca5a5`,
          borderRadius: BAI.radius,
          padding: '10px 14px',
          display: 'flex',
          gap: 8,
          alignItems: 'flex-start',
        }}>
          <AlertTriangle size={15} style={{ color: BAI.error, flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 13, color: BAI.error, margin: 0, fontFamily: BAI.fontBody }}>
            {errorMsg}
          </p>
        </div>
      )}

      {/* Result panel */}
      {status === 'success' && advice && (
        <div style={{
          marginTop: 12,
          border: `1px solid ${BAI.ownerBorder}`,
          borderRadius: BAI.radiusLg,
          overflow: 'hidden',
          background: BAI.bgSurface,
          boxShadow: BAI.shadowSm,
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: BAI.ownerLight,
            borderBottom: expanded ? `1px solid ${BAI.ownerBorder}` : 'none',
            cursor: 'pointer',
          }}
            onClick={() => setExpanded(v => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Sparkles size={14} style={{ color: BAI.owner }} />
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: BAI.owner,
                fontFamily: BAI.fontBody,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Recommandation IA
              </span>
              {!marketAvailable && (
                <span style={{
                  fontSize: 11,
                  color: BAI.inkFaint,
                  fontFamily: BAI.fontBody,
                  fontWeight: 400,
                }}>
                  — données marché non disponibles pour cette ville
                </span>
              )}
            </div>
            {expanded
              ? <ChevronUp size={15} style={{ color: BAI.owner }} />
              : <ChevronDown size={15} style={{ color: BAI.owner }} />
            }
          </div>

          {expanded && (
            <div style={{ padding: '16px 16px 14px' }}>

              {/* Range + recommended */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 14, alignItems: 'flex-end' }}>
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: BAI.inkFaint,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 3,
                    fontFamily: BAI.fontBody,
                  }}>
                    Fourchette marché
                  </p>
                  <p style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: BAI.inkMid,
                    fontFamily: BAI.fontBody,
                    margin: 0,
                  }}>
                    {advice.minRent.toLocaleString('fr-FR')} € – {advice.maxRent.toLocaleString('fr-FR')} €/mois
                  </p>
                </div>
                <div>
                  <p style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: BAI.inkFaint,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 3,
                    fontFamily: BAI.fontBody,
                  }}>
                    Prix recommandé
                  </p>
                  <p style={{
                    fontSize: 26,
                    fontWeight: 700,
                    color: BAI.owner,
                    fontFamily: BAI.fontDisplay,
                    fontStyle: 'italic',
                    margin: 0,
                    lineHeight: 1,
                  }}>
                    {advice.recommendedRent.toLocaleString('fr-FR')} €/mois
                  </p>
                </div>
              </div>

              {/* Reasoning */}
              <p style={{
                fontSize: 13,
                color: BAI.inkMid,
                lineHeight: 1.6,
                marginBottom: 12,
                fontFamily: BAI.fontBody,
              }}>
                {advice.reasoning}
              </p>

              {/* Tips */}
              {advice.tips && advice.tips.length > 0 && (
                <ul style={{
                  margin: '0 0 14px',
                  paddingLeft: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}>
                  {advice.tips.map((tip, i) => (
                    <li key={i} style={{
                      fontSize: 13,
                      color: BAI.inkMid,
                      lineHeight: 1.5,
                      fontFamily: BAI.fontBody,
                    }}>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}

              {/* Encadrement warning */}
              {advice.encadrementNote && (
                <div style={{
                  background: BAI.warningLight,
                  border: `1px solid #f3c99a`,
                  borderRadius: BAI.radiusSm,
                  padding: '8px 12px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'flex-start',
                  marginBottom: 14,
                }}>
                  <AlertTriangle size={14} style={{ color: BAI.warning, flexShrink: 0, marginTop: 1 }} />
                  <p style={{
                    fontSize: 12,
                    color: BAI.warning,
                    margin: 0,
                    lineHeight: 1.5,
                    fontFamily: BAI.fontBody,
                  }}>
                    {advice.encadrementNote}
                  </p>
                </div>
              )}

              {/* Source link */}
              {advice.sourceUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14 }}>
                  <ExternalLink size={11} style={{ color: BAI.inkFaint, flexShrink: 0 }} />
                  <span style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>Source :</span>
                  <a
                    href={advice.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: BAI.fontBody, fontSize: 11, color: BAI.owner, textDecoration: 'underline' }}
                  >
                    {advice.sourceName ?? advice.sourceUrl}
                  </a>
                </div>
              )}

              {/* Apply button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={applyRent}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '9px 16px',
                    background: BAI.owner,
                    border: 'none',
                    borderRadius: BAI.radius,
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer',
                    minHeight: BAI.touchMin,
                    transition: BAI.transition,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = BAI.ownerHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = BAI.owner)}
                >
                  <CheckCircle size={14} />
                  Appliquer ce prix ({advice.recommendedRent.toLocaleString('fr-FR')} €)
                </button>
                <button
                  type="button"
                  onClick={estimate}
                  style={{
                    padding: '9px 14px',
                    background: 'none',
                    border: `1px solid ${BAI.border}`,
                    borderRadius: BAI.radius,
                    fontFamily: BAI.fontBody,
                    fontSize: 13,
                    fontWeight: 500,
                    color: BAI.inkMid,
                    cursor: 'pointer',
                    minHeight: BAI.touchMin,
                    transition: BAI.transition,
                  }}
                >
                  Relancer
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inline spinner keyframe — injected as a style tag trick */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
