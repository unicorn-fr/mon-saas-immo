import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

export interface TourStep {
  targetRef: React.RefObject<HTMLElement | null>
  title: string
  desc: string
}

interface GuidedTourProps {
  steps: TourStep[]
  storageKey: string
  onClose?: () => void
}

export function GuidedTour({ steps, storageKey, onClose }: GuidedTourProps) {
  const [visible, setVisible] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Show after short delay (let page animations settle)
  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    const t = setTimeout(() => setVisible(true), 700)
    return () => clearTimeout(t)
  }, [storageKey])

  // Recompute spotlight rect when step changes
  useEffect(() => {
    if (!visible) return
    const el = steps[stepIdx]?.targetRef.current
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const compute = () => setRect(el.getBoundingClientRect())
    const t = setTimeout(compute, 280)
    window.addEventListener('resize', compute)
    return () => { clearTimeout(t); window.removeEventListener('resize', compute) }
  }, [stepIdx, visible, steps])

  const finish = () => {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onClose?.()
  }

  if (!visible || !rect) return null

  const PAD = 10
  const spotTop  = rect.top  - PAD
  const spotLeft = rect.left - PAD
  const spotW    = rect.width  + PAD * 2
  const spotH    = rect.height + PAD * 2

  // Tooltip: below if room, else above
  const TOOLTIP_W = 300
  const viewH = window.innerHeight
  const below = spotTop + spotH + 260 < viewH
  const tooltipTop = below
    ? spotTop + spotH + 12
    : spotTop - 12 - (tooltipRef.current?.offsetHeight ?? 220)

  let tooltipLeft = spotLeft + spotW / 2 - TOOLTIP_W / 2
  tooltipLeft = Math.max(16, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_W - 16))

  return createPortal(
    <>
      {/* Click-catcher overlay (transparent — dark overlay comes from box-shadow on spotlight) */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9000, cursor: 'default' }}
        onClick={finish}
      />

      {/* Spotlight — box-shadow creates the dark overlay + caramel ring */}
      <div style={{
        position: 'fixed',
        top: spotTop,
        left: spotLeft,
        width: spotW,
        height: spotH,
        zIndex: 9001,
        borderRadius: 14,
        boxShadow: `0 0 0 9999px rgba(10,13,26,0.68), 0 0 0 2px ${BAI.caramel}`,
        pointerEvents: 'none',
        transition: 'top 0.30s cubic-bezier(0.22,1,0.36,1), left 0.30s cubic-bezier(0.22,1,0.36,1), width 0.30s cubic-bezier(0.22,1,0.36,1), height 0.30s cubic-bezier(0.22,1,0.36,1)',
      }} />

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_W,
          zIndex: 9002,
          background: BAI.bgSurface,
          borderRadius: 16,
          padding: '18px 20px 16px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          border: `1px solid ${BAI.border}`,
          fontFamily: BAI.fontBody,
          transition: 'top 0.30s cubic-bezier(0.22,1,0.36,1), left 0.30s cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={finish}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: BAI.bgMuted, border: 'none', cursor: 'pointer',
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: BAI.inkFaint,
          }}
        >
          <X size={12} />
        </button>

        {/* Progress dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              height: 5,
              width: i === stepIdx ? 18 : 5,
              borderRadius: 3,
              background: i < stepIdx ? BAI.caramel : i === stepIdx ? BAI.caramel : BAI.border,
              opacity: i < stepIdx ? 0.4 : 1,
              transition: 'width 0.22s ease, opacity 0.22s ease',
            }} />
          ))}
          <span style={{ fontSize: 10, color: BAI.inkFaint, marginLeft: 2, letterSpacing: '0.04em' }}>
            {stepIdx + 1}/{steps.length}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
          fontSize: 17, color: BAI.ink, margin: '0 0 7px', lineHeight: 1.2,
        }}>
          {steps[stepIdx].title}
        </h3>

        {/* Desc */}
        <p style={{
          fontSize: 12.5, lineHeight: 1.65, color: BAI.inkMid,
          margin: '0 0 16px',
        }}>
          {steps[stepIdx].desc}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={finish}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11.5, color: BAI.inkFaint, padding: 0,
              fontFamily: BAI.fontBody, letterSpacing: '0.02em',
            }}
          >
            Passer
          </button>

          <div style={{ display: 'flex', gap: 7 }}>
            {stepIdx > 0 && (
              <button
                onClick={() => setStepIdx(i => i - 1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '7px 12px', borderRadius: 8,
                  border: `1px solid ${BAI.border}`,
                  background: 'transparent', color: BAI.ink,
                  fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={12} /> Préc.
              </button>
            )}
            <button
              onClick={stepIdx < steps.length - 1 ? () => setStepIdx(i => i + 1) : finish}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7px 16px', borderRadius: 8,
                border: 'none',
                background: stepIdx < steps.length - 1 ? BAI.night : BAI.tenant,
                color: '#fff',
                fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.01em',
              }}
            >
              {stepIdx < steps.length - 1
                ? <> Suivant <ChevronRight size={12} /></>
                : '✓ Terminé'
              }
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
