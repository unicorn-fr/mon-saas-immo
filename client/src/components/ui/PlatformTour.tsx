import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight, ArrowUpRight } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

export interface TourFeature {
  icon: React.ElementType
  iconBg: string
  iconColor: string
  label: string
  title: string
  desc: string
  tag?: string
  link?: string
}

interface PlatformTourProps {
  features: TourFeature[]
  storageKey: string
  tourTitle?: string
  subtitle?: string
  onClose?: () => void
  immediate?: boolean
}

export function PlatformTour({
  features,
  storageKey,
  tourTitle = 'Votre plateforme',
  subtitle: _subtitle,
  onClose,
  immediate,
}: PlatformTourProps) {
  const navigate   = useNavigate()
  const [visible, setVisible]     = useState(false)
  const [idx, setIdx]             = useState(0)
  const [entering, setEntering]   = useState(false)
  const [dir, setDir]             = useState<'fwd' | 'bwd'>('fwd')
  const [windowW, setWindowW]     = useState(window.innerWidth)
  const touchX = useRef<number | null>(null)

  const cur     = features[idx]
  const isSmall = windowW < 680
  const Icon    = cur.icon

  /* ── Show ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (localStorage.getItem(storageKey)) return
    if (immediate) { setVisible(true); return }
    const t = setTimeout(() => setVisible(true), 480)
    return () => clearTimeout(t)
  }, [storageKey, immediate])

  /* ── Resize ─────────────────────────────────────────────────── */
  useEffect(() => {
    const h = () => setWindowW(window.innerWidth)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  /* ── Keyboard ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish()
      if (e.key === 'ArrowRight') moveTo(Math.min(idx + 1, features.length - 1), 'fwd')
      if (e.key === 'ArrowLeft')  moveTo(Math.max(idx - 1, 0), 'bwd')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [visible, idx])  // eslint-disable-line

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onClose?.()
  }, [storageKey, onClose])

  const moveTo = (next: number, direction: 'fwd' | 'bwd') => {
    if (next === idx || entering) return
    setDir(direction)
    setEntering(true)
    setIdx(next)
    setTimeout(() => setEntering(false), 260)
  }

  const goNext = () => idx < features.length - 1 ? moveTo(idx + 1, 'fwd') : finish()
  const goPrev = () => idx > 0 && moveTo(idx - 1, 'bwd')

  const handleNav = (href: string) => { finish(); navigate(href) }

  /* ── Touch swipe ────────────────────────────────────────────── */
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX }
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchX.current === null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    if (Math.abs(dx) > 48) dx < 0 ? goNext() : goPrev()
    touchX.current = null
  }

  if (!visible) return null

  /* ── Styles ─────────────────────────────────────────────────── */
  const progress = ((idx + 1) / features.length) * 100

  return createPortal(
    <>
      <style>{`
        @keyframes __ptBg  { from{opacity:0} to{opacity:1} }
        @keyframes __ptIn  { from{opacity:0;transform:translate(-50%,-46%) scale(0.95)} to{opacity:1;transform:translate(-50%,-50%) scale(1)} }
        @keyframes __ptFwd { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes __ptBwd { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── Dark backdrop with blur ─────────────────────────────── */}
      <div
        onClick={finish}
        style={{
          position: 'fixed', inset: 0, zIndex: 9500,
          background: 'rgba(4,6,18,0.82)',
          backdropFilter: 'blur(8px) saturate(130%)',
          WebkitBackdropFilter: 'blur(8px) saturate(130%)',
          animation: '__ptBg 0.24s ease',
        }}
      />

      {/* ── Modal card ──────────────────────────────────────────── */}
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 9501,
          width: isSmall ? '96vw' : 'min(860px, 92vw)',
          maxHeight: '88vh',
          borderRadius: 22,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          background: 'rgba(6, 9, 24, 0.97)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: `
            0 0 0 1px rgba(196,151,106,0.12) inset,
            0 48px 100px rgba(0,0,0,0.72),
            0 0 200px rgba(196,151,106,0.05)
          `,
          animation: '__ptIn 0.30s cubic-bezier(0.22,1,0.36,1)',
          fontFamily: BAI.fontBody,
        }}
      >
        {/* Inner caramel glow (top-right corner) */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 280, height: 280,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,106,0.10) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isSmall ? '16px 18px 14px' : '18px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.055)',
          flexShrink: 0,
        }}>
          <div>
            <p style={{
              fontFamily: BAI.fontBody, fontSize: 9.5, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: BAI.caramel, margin: '0 0 3px',
            }}>
              Guide de démarrage
            </p>
            <h2 style={{
              fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
              fontSize: isSmall ? 17 : 19, color: '#ffffff', margin: 0, lineHeight: 1.1,
            }}>
              {tourTitle}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Keyboard hint */}
            {!isSmall && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {['←', '→'].map(k => (
                  <span key={k} style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: 22, height: 22, borderRadius: 5,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.05)',
                    fontFamily: BAI.fontBody, fontSize: 11,
                    color: 'rgba(255,255,255,0.25)',
                  }}>{k}</span>
                ))}
              </div>
            )}
            <button
              onClick={finish}
              title="Fermer (Esc)"
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer', width: 32, height: 32, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.38)',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* ── Body: sidebar + content ──────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0,
        }}>
          {/* Sidebar — desktop only */}
          {!isSmall && (
            <nav style={{
              width: 210, flexShrink: 0,
              borderRight: '1px solid rgba(255,255,255,0.055)',
              padding: '10px 8px',
              display: 'flex', flexDirection: 'column', gap: 2,
              overflowY: 'auto',
            }}>
              {features.map((f, i) => {
                const active = i === idx
                const FIcon  = f.icon
                return (
                  <button
                    key={i}
                    onClick={() => moveTo(i, i > idx ? 'fwd' : 'bwd')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '8px 10px', borderRadius: 9,
                      border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                      background: active ? 'rgba(196,151,106,0.10)' : 'transparent',
                      borderLeft: active ? `2px solid ${BAI.caramel}` : '2px solid transparent',
                      transition: 'background 0.14s, border-color 0.14s',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={e => {
                      if (!active) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      background: active ? f.iconBg : 'rgba(255,255,255,0.04)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: active ? f.iconColor : 'rgba(255,255,255,0.26)',
                      transition: 'all 0.14s',
                    }}>
                      <FIcon size={14} />
                    </div>
                    <span style={{
                      fontFamily: BAI.fontBody, fontSize: 12.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#ffffff' : 'rgba(255,255,255,0.40)',
                      flex: 1, transition: 'color 0.14s',
                    }}>
                      {f.label}
                    </span>
                    {f.tag && active && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                        padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(196,151,106,0.20)',
                        color: BAI.caramel, textTransform: 'uppercase',
                        flexShrink: 0,
                      }}>
                        {f.tag}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          )}

          {/* ── Content pane ──────────────────────────────────── */}
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: isSmall ? '24px 20px 20px' : '30px 32px 24px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div
              key={idx}
              style={{
                flex: 1,
                animation: `${dir === 'fwd' ? '__ptFwd' : '__ptBwd'} 0.22s cubic-bezier(0.22,1,0.36,1)`,
                opacity: entering ? 0 : 1,
                transition: entering ? 'opacity 0.08s' : undefined,
              }}
            >
              {/* Icon badge */}
              <div style={{
                width: isSmall ? 56 : 64, height: isSmall ? 56 : 64, borderRadius: 18,
                background: cur.iconBg,
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cur.iconColor,
                marginBottom: 20,
                boxShadow: `0 8px 28px ${cur.iconBg}80`,
              }}>
                <Icon size={isSmall ? 24 : 28} />
              </div>

              {/* Title */}
              <h3 style={{
                fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
                fontSize: isSmall ? 22 : 'clamp(24px, 3vw, 30px)',
                color: '#ffffff', margin: '0 0 12px', lineHeight: 1.1,
              }}>
                {cur.title}
              </h3>

              {/* Desc */}
              <p style={{
                fontFamily: BAI.fontBody, fontSize: isSmall ? 13.5 : 14.5,
                lineHeight: 1.74, color: 'rgba(255,255,255,0.58)',
                margin: '0 0 28px', maxWidth: 480,
              }}>
                {cur.desc}
              </p>

              {/* CTA */}
              {cur.link && (
                <button
                  onClick={() => handleNav(cur.link!)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '11px 22px', borderRadius: 10,
                    background: BAI.caramel, color: '#fff', border: 'none',
                    fontFamily: BAI.fontBody, fontSize: 13.5, fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(196,151,106,0.32)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(196,151,106,0.42)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = ''
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(196,151,106,0.32)'
                  }}
                >
                  Accéder à la page <ArrowUpRight size={15} />
                </button>
              )}
            </div>

            {/* Mobile dots */}
            {isSmall && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 24, paddingBottom: 4 }}>
                {features.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => moveTo(i, i > idx ? 'fwd' : 'bwd')}
                    style={{
                      width: i === idx ? 22 : 6, height: 6, borderRadius: 3,
                      border: 'none', cursor: 'pointer', padding: 0,
                      background: i === idx ? BAI.caramel : 'rgba(255,255,255,0.16)',
                      transition: 'width 0.22s ease, background 0.22s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div style={{
          position: 'relative', zIndex: 1, flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.055)',
        }}>
          {/* Progress bar */}
          <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
            <div style={{
              height: '100%', borderRadius: 1,
              background: `linear-gradient(90deg, ${BAI.caramel}, rgba(196,151,106,0.60))`,
              width: `${progress}%`,
              transition: 'width 0.30s cubic-bezier(0.22,1,0.36,1)',
            }} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: isSmall ? '12px 18px 14px' : '13px 24px 15px',
          }}>
            <button onClick={finish} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 500,
              color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em', padding: 0,
            }}>
              Passer le guide
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontFamily: BAI.fontBody, fontSize: 11,
                color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em',
              }}>
                {idx + 1} / {features.length}
              </span>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={goPrev}
                  disabled={idx === 0}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '7px 13px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: 'rgba(255,255,255,0.04)',
                    color: idx === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.60)',
                    fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 600,
                    cursor: idx === 0 ? 'default' : 'pointer',
                  }}
                >
                  <ChevronLeft size={12} /> Préc.
                </button>

                <button
                  onClick={goNext}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '7px 18px', borderRadius: 8, border: 'none',
                    background: idx === features.length - 1
                      ? BAI.tenant
                      : 'rgba(255,255,255,0.10)',
                    color: '#fff',
                    fontFamily: BAI.fontBody, fontSize: 12.5, fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {idx === features.length - 1
                    ? '✓ Terminé'
                    : <> Suivant <ChevronRight size={12} /></>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
