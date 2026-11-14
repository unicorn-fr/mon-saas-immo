import { useEffect, useRef, useState, type ComponentType } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { AppWindow, type Spot } from './AppWindow'
import { Book, Download, Euro, Home, Mail, Page, People, Signpost, Sun } from './Icons'

/** Icône de chaque onglet, d'après l'identifiant de l'étape (numéro sinon). */
const TAB_ICONS: Record<string, ComponentType<{ size?: number }>> = { jour: Sun, logements: Home, bail: Page, loyers: Euro, banque: Download, relances: Mail, candidats: People, impots: Book, patrimoine: Signpost, bord: Signpost }

export interface TourStep {
  id: string
  tab: string
  img: string
  alt: string
  spot: Spot
  path?: string
}

const STEP_MS = 6000

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const finePointer = () => typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: fine)').matches

/**
 * Visite animée de l'application : captures sur ordinateur qui défilent seules, un curseur va jusqu'à la zone utile et
 * clique, une barre de progression par étape. Pause au survol et au clavier ; rien ne bouge si l'appareil demande moins
 * d'animations. Légère inclinaison 3D qui se redresse quand on descend (souris seulement).
 */
export function ProductTour({ steps, label = 'Écrans de l’application' }: { steps: TourStep[]; label?: string }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [phase, setPhase] = useState(0) // 0 : curseur en route, 1 : clic, 2 : bulle affichée
  const [still] = useState(reducedMotion)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const stage = useRef<HTMLDivElement | null>(null)
  const tilt = useRef<HTMLDivElement | null>(null)
  const s = steps[i]
  const auto = !still && !paused

  // Curseur : en route, clic, puis bulle.
  useEffect(() => {
    if (still) return setPhase(2)
    setPhase(0)
    const a = window.setTimeout(() => setPhase(1), 1100)
    const b = window.setTimeout(() => setPhase(2), 1450)
    return () => (window.clearTimeout(a), window.clearTimeout(b))
  }, [i, still])

  // Inclinaison : 10° au départ, à plat quand la visite est au milieu de l'écran ; suit un peu la souris.
  useEffect(() => {
    const el = stage.current
    const box = tilt.current
    if (!el || !box || still || !finePointer()) return
    let base = 10
    let mx = 0
    let my = 0
    const apply = () => (box.style.transform = `rotateX(${base - my * 4}deg) rotateY(${mx * 6}deg)`)
    const onScroll = () => {
      const r = el.getBoundingClientRect()
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight * 0.9)))
      base = 10 * (1 - p)
      apply()
    }
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      mx = (e.clientX - r.left) / r.width - 0.5
      my = (e.clientY - r.top) / r.height - 0.5
      apply()
    }
    const onLeave = () => ((mx = 0), (my = 0), apply())
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [still])

  const go = (n: number, focus = false) => {
    const k = (n + steps.length) % steps.length
    setI(k)
    if (focus) tabs.current[k]?.focus()
  }

  const cx = s.spot.x + Math.min(s.spot.w, 30) * 0.6
  const cy = s.spot.y + s.spot.h * 0.55

  return (
    <div
      ref={stage}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, perspective: 1600 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div ref={tilt} style={{ transformOrigin: '50% 100%', transition: 'transform .25s ease-out', willChange: 'transform' }}>
        <div id="visite-ecran" role="tabpanel" aria-labelledby={`visite-${s.id}`} style={{ position: 'relative' }}>
          <div className="panel-in" key={s.id}>
            <AppWindow img={s.img} alt={s.alt} spot={phase === 2 ? s.spot : undefined} path={s.path} eager={i === 0} />
          </div>
          {!still ? (
            <span aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', top: 'clamp(26px, 3.4vw, 38px)' }}>
              <span
                style={{
                  position: 'absolute',
                  left: phase === 0 ? `${Math.min(cx + 18, 92)}%` : `${cx}%`,
                  top: phase === 0 ? `${Math.min(cy + 22, 92)}%` : `${cy}%`,
                  transition: 'left 1s cubic-bezier(.2,.8,.2,1), top 1s cubic-bezier(.2,.8,.2,1)',
                  width: 'clamp(14px, 2vw, 24px)',
                }}
              >
                {phase === 1 ? <span className="tour-click" style={{ position: 'absolute', left: -14, top: -14, width: 30, height: 30, borderRadius: 15, border: `3px solid ${BAI.owner}` }} /> : null}
                <svg viewBox="0 0 20 24" width="100%" style={{ display: 'block', transform: phase === 1 ? 'scale(.85)' : 'none', transition: 'transform .15s' }}>
                  <path d="M2 2 L2 19 L6.5 15 L9.5 22 L12.5 20.7 L9.6 13.9 L15.5 13.6 Z" fill={BAI.night} stroke={BAI.surface} strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          ) : null}
        </div>
      </div>
      <div role="tablist" aria-label={label} className="ptour-tabs">
        {steps.map((t, j) => {
          const Icon = TAB_ICONS[t.id]
          return (
            <button
              key={t.id}
              ref={(el) => void (tabs.current[j] = el)}
              type="button"
              role="tab"
              id={`visite-${t.id}`}
              aria-selected={i === j}
              aria-controls="visite-ecran"
              tabIndex={i === j ? 0 : -1}
              className="ptour-tab"
              onClick={() => go(j)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') (e.preventDefault(), go(j + 1, true))
                if (e.key === 'ArrowLeft') (e.preventDefault(), go(j - 1, true))
              }}
            >
              <span aria-hidden className="ptour-ico">
                {Icon ? <Icon size={18} /> : j + 1}
              </span>
              <span className="ptour-lab">{t.tab}</span>
              {i === j && !still ? (
                <span
                  aria-hidden
                  key={`${t.id}-bar`}
                  className="tour-bar ptour-bar"
                  onAnimationEnd={() => go(i + 1)}
                  style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: auto ? 'running' : 'paused' }}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
