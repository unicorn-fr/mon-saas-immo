import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'

export interface TourStep {
  type?: 'spotlight' | 'slide'
  targetRef?: React.RefObject<HTMLElement | null>
  icon?: React.ReactNode
  iconBg?: string
  iconColor?: string
  title: string
  desc: string
  link?: { label: string; href: string }
}

interface GuidedTourProps {
  steps: TourStep[]
  storageKey: string
  onClose?: () => void
  immediate?: boolean
}

const GLASS: React.CSSProperties = {
  background: 'rgba(8,11,28,0.93)',
  backdropFilter: 'blur(28px) saturate(160%)',
  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: '0 28px 64px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.04)',
  fontFamily: BAI.fontBody,
}

export function GuidedTour({ steps, storageKey, onClose, immediate }: GuidedTourProps) {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStep = steps[stepIdx]
  const isSlide = currentStep?.type === 'slide'

  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    if (immediate) { setVisible(true); return }
    const t = setTimeout(() => setVisible(true), 500)
    return () => clearTimeout(t)
  }, [storageKey, immediate])

  useEffect(() => {
    if (!visible || isSlide) { setRect(null); return }
    const el = currentStep?.targetRef?.current
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const compute = () => setRect(el.getBoundingClientRect())
    const t = setTimeout(compute, 280)
    window.addEventListener('resize', compute)
    return () => { clearTimeout(t); window.removeEventListener('resize', compute) }
  }, [stepIdx, visible, isSlide, currentStep])

  const finish = () => {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onClose?.()
  }

  const goNext = () => {
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1)
    else finish()
  }

  const handleLinkNav = (href: string) => {
    finish()
    navigate(href)
  }

  if (!visible) return null
  if (!isSlide && !rect) return null

  const PAD = 10
  const spotTop  = rect ? rect.top  - PAD : 0
  const spotLeft = rect ? rect.left - PAD : 0
  const spotW    = rect ? rect.width  + PAD * 2 : 0
  const spotH    = rect ? rect.height + PAD * 2 : 0

  const TOOLTIP_W = 320
  const viewH = window.innerHeight
  const below = rect ? spotTop + spotH + 260 < viewH : false
  const tooltipTop = rect
    ? (below ? spotTop + spotH + 14 : spotTop - 14 - (tooltipRef.current?.offsetHeight ?? 220))
    : 0
  let tooltipLeft = rect ? spotLeft + spotW / 2 - TOOLTIP_W / 2 : 0
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 16))

  const dots = steps.map((_, i) => i)

  const ProgressDots = ({ small }: { small?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: small ? 4 : 5, marginBottom: small ? 12 : 20 }}>
      {dots.map((i) => (
        <div key={i} style={{
          height: small ? 3.5 : 4,
          width: i === stepIdx ? (small ? 16 : 20) : (small ? 3.5 : 4),
          borderRadius: 2,
          background: i < stepIdx ? `rgba(196,151,106,0.40)` : i === stepIdx ? BAI.caramel : 'rgba(255,255,255,0.14)',
          transition: 'width 0.22s ease, background 0.22s ease',
        }} />
      ))}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginLeft: small ? 3 : 4, letterSpacing: '0.04em' }}>
        {stepIdx + 1}/{steps.length}
      </span>
    </div>
  )

  const NavButtons = ({ compact }: { compact?: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <button onClick={finish} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 11.5, color: 'rgba(255,255,255,0.28)',
        fontFamily: BAI.fontBody, letterSpacing: '0.02em', padding: 0,
      }}>
        Passer le guide
      </button>
      <div style={{ display: 'flex', gap: compact ? 6 : 7 }}>
        {stepIdx > 0 && (
          <button onClick={() => setStepIdx(i => i - 1)} style={{
            display: 'flex', alignItems: 'center', gap: 3,
            padding: compact ? '6px 10px' : '7px 12px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.13)',
            background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.60)',
            fontFamily: BAI.fontBody, fontSize: compact ? 11.5 : 12, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <ChevronLeft size={compact ? 11 : 12} /> Préc.
          </button>
        )}
        <button
          onClick={goNext}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: compact ? '6px 14px' : '7px 16px', borderRadius: 8, border: 'none',
            background: stepIdx < steps.length - 1 ? 'rgba(255,255,255,0.11)' : BAI.tenant,
            color: '#fff',
            fontFamily: BAI.fontBody, fontSize: compact ? 11.5 : 12, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {stepIdx < steps.length - 1 ? <> Suivant <ChevronRight size={compact ? 11 : 12} /></> : '✓ Terminé'}
        </button>
      </div>
    </div>
  )

  return createPortal(
    <>
      <style>{`
        @keyframes tourSlideIn {
          from { opacity: 0; transform: translate(-50%, -47%) scale(0.95); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes tourFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: isSlide ? 'rgba(8,11,28,0.65)' : 'transparent',
          cursor: 'default',
          animation: isSlide ? 'tourFadeIn 0.20s ease' : undefined,
        }}
        onClick={finish}
      />

      {/* ── SPOTLIGHT step ─────────────────────────────────────────── */}
      {!isSlide && rect && (
        <>
          {/* Caramel ring + dark overlay via box-shadow */}
          <div style={{
            position: 'fixed',
            top: spotTop, left: spotLeft, width: spotW, height: spotH,
            zIndex: 9001, borderRadius: 14, pointerEvents: 'none',
            boxShadow: `0 0 0 9999px rgba(8,11,28,0.74), 0 0 0 2px ${BAI.caramel}`,
            transition: 'top 0.28s cubic-bezier(0.22,1,0.36,1), left 0.28s cubic-bezier(0.22,1,0.36,1), width 0.28s cubic-bezier(0.22,1,0.36,1), height 0.28s cubic-bezier(0.22,1,0.36,1)',
          }} />

          {/* Tooltip card */}
          <div
            ref={tooltipRef}
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: tooltipTop, left: tooltipLeft,
              width: TOOLTIP_W, zIndex: 9002,
              ...GLASS, borderRadius: 18,
              padding: '18px 20px 16px',
              transition: 'top 0.28s cubic-bezier(0.22,1,0.36,1), left 0.28s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <button onClick={finish} style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
              width: 24, height: 24, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.38)',
            }}>
              <X size={12} />
            </button>

            <ProgressDots small />

            <h3 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: 17, color: '#ffffff', margin: '0 0 7px', lineHeight: 1.2,
            }}>
              {currentStep.title}
            </h3>
            <p style={{
              fontSize: 12.5, lineHeight: 1.68, color: 'rgba(255,255,255,0.58)',
              margin: '0 0 16px',
            }}>
              {currentStep.desc}
            </p>
            <NavButtons compact />
          </div>
        </>
      )}

      {/* ── SLIDE step — full centered card ────────────────────────── */}
      {isSlide && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(420px, 90vw)',
            zIndex: 9002,
            ...GLASS,
            borderRadius: 22,
            padding: '28px 28px 24px',
            animation: 'tourSlideIn 0.26s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          <button onClick={finish} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.07)', border: 'none', cursor: 'pointer',
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.38)',
          }}>
            <X size={13} />
          </button>

          <ProgressDots />

          {/* Icon circle */}
          {currentStep.icon && (
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: currentStep.iconBg ?? 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: currentStep.iconColor ?? BAI.caramel,
              marginBottom: 18,
            }}>
              {currentStep.icon}
            </div>
          )}

          <h3 style={{
            fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
            fontSize: 23, color: '#ffffff', margin: '0 0 10px', lineHeight: 1.12,
          }}>
            {currentStep.title}
          </h3>
          <p style={{
            fontSize: 13.5, lineHeight: 1.68, color: 'rgba(255,255,255,0.62)',
            margin: '0 0 22px',
          }}>
            {currentStep.desc}
          </p>

          {/* CTA link */}
          {currentStep.link && (
            <button
              onClick={() => handleLinkNav(currentStep.link!.href)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                width: '100%', padding: '11px 20px', borderRadius: 10,
                background: BAI.caramel, color: '#fff', border: 'none',
                fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 700,
                cursor: 'pointer', marginBottom: 16,
                boxShadow: '0 4px 16px rgba(196,151,106,0.30)',
              }}
            >
              {currentStep.link.label} <ArrowRight size={14} />
            </button>
          )}

          {/* Separator */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

          <NavButtons />
        </div>
      )}
    </>,
    document.body
  )
}
