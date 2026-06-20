import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Sparkles, ChevronLeft } from 'lucide-react'
import { BAI } from '../../constants/bailio-tokens'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SpotlightStep {
  targetId: string | null   // null → écran d'accueil plein écran
  title: string
  description: string
  tag?: string              // badge ex: "IA", "eIDAS"
  ctaLabel?: string         // label CTA sur l'écran d'accueil
}

interface SpotlightTourProps {
  steps: SpotlightStep[]
  storageKey: string
  onClose?: () => void
  immediate?: boolean       // ignorer localStorage, démarrer direct
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAD = 14             // padding autour de l'élément spotlighté

function queryTarget(id: string | null): DOMRect | null {
  if (!id) return null
  const el = document.getElementById(id)
  return el ? el.getBoundingClientRect() : null
}

// ─── Spotlight box (SVG mask) ─────────────────────────────────────────────────

interface SpotRect { x: number; y: number; w: number; h: number }

function SpotlightMask({
  vw, vh, spot,
}: { vw: number; vh: number; spot: SpotRect | null }) {
  const noSpot = !spot
  return (
    <svg
      width={vw}
      height={vh}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <mask id="st-mask">
          <rect width={vw} height={vh} fill="white" />
          {!noSpot && (
            <motion.rect
              animate={{ x: spot!.x, y: spot!.y, width: spot!.w, height: spot!.h }}
              initial={{ x: spot!.x, y: spot!.y, width: spot!.w, height: spot!.h }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              rx={12}
              fill="black"
            />
          )}
        </mask>
      </defs>

      {/* Overlay sombre */}
      <motion.rect
        width={vw}
        height={vh}
        fill="rgba(5, 8, 22, 0.82)"
        mask="url(#st-mask)"
        animate={{ opacity: 1 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Anneau caramel autour du spotlight */}
      {!noSpot && (
        <motion.rect
          animate={{
            x: spot!.x - 2,
            y: spot!.y - 2,
            width: spot!.w + 4,
            height: spot!.h + 4,
          }}
          initial={{
            x: spot!.x - 2,
            y: spot!.y - 2,
            width: spot!.w + 4,
            height: spot!.h + 4,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          rx={14}
          fill="none"
          stroke="rgba(196,151,106,0.45)"
          strokeWidth={1.5}
        />
      )}
    </svg>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  step: SpotlightStep
  idx: number
  total: number
  rect: DOMRect | null
  vw: number
  vh: number
  onAdvance: () => void
  onBack: () => void
  onClose: () => void
}

function Tooltip({ step, idx, total, rect, vw, vh, onAdvance, onBack, onClose }: TooltipProps) {
  const isWelcome = idx === 0
  const isMobile  = vw < 768
  const isLast    = idx === total - 1

  // ── Positionnement ──────────────────────────────────────────────────────────
  let tipStyle: React.CSSProperties
  // Sur mobile, on fixe toujours la card en bas (au-dessus de la MobileBottomNav ~64px)
  const MOBILE_NAV_H = 72 // hauteur de la bottom nav

  if (isMobile) {
    tipStyle = {
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    }
  } else if (isWelcome || !rect) {
    tipStyle = {
      position: 'fixed',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(500px, 92vw)',
    }
  } else {
    const left = rect.right + PAD + 24
    const maxW = Math.min(330, vw - left - 20)
    const top  = Math.max(20, Math.min(rect.top - 16, vh - 340))
    tipStyle = { position: 'fixed', left, top, width: maxW }
  }

  const cardStyle: React.CSSProperties = {
    ...tipStyle,
    zIndex: 9999,
    background: 'linear-gradient(155deg, #10132a 0%, #0a0d1a 100%)',
    border: '1px solid rgba(196,151,106,0.20)',
    borderRadius: isMobile ? '22px 22px 0 0' : 18,
    padding: isMobile ? '20px 20px 0' : (isWelcome ? 'clamp(28px,4vw,36px) clamp(24px,4vw,32px)' : '22px 24px'),
    boxShadow: '0 -8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)',
    pointerEvents: 'none',
  }

  return (
    <motion.div
      key={idx}
      role="dialog" aria-modal="true" aria-label={step.title}
      initial={isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.93, y: 8 }}
      animate={isMobile ? { y: 0, opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { y: '100%', opacity: 1 } : { opacity: 0, scale: 0.93, y: 6 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={cardStyle}
    >
      {/* ── Handle drag (mobile uniquement) ─────────────────────────────── */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.16)' }} />
        </div>
      )}

      {/* ── Fermer ──────────────────────────────────────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Fermer le guide"
        style={{
          position: 'absolute', top: isMobile ? 16 : 12, right: isMobile ? 16 : 12,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', pointerEvents: 'auto',
          minWidth: 44, minHeight: 44,
        }}
      >
        <X size={14} />
      </button>

      {/* ── Icône bienvenue ─────────────────────────────────────────────── */}
      {isWelcome && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(196,151,106,0.14)',
            border: '1px solid rgba(196,151,106,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Sparkles size={22} style={{ color: BAI.caramel }} />
        </motion.div>
      )}

      {/* ── Badge étape ─────────────────────────────────────────────────── */}
      {!isWelcome && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: BAI.caramel }}>
            {idx} / {total - 1}
          </span>
          {step.tag && (
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase', background: 'rgba(196,151,106,0.16)', border: '1px solid rgba(196,151,106,0.28)', color: BAI.caramel }}>
              {step.tag}
            </span>
          )}
        </div>
      )}

      {/* ── Titre ───────────────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
        fontSize: isWelcome ? (isMobile ? 28 : 'clamp(28px,5vw,40px)') : (isMobile ? 22 : 24),
        color: '#ffffff', margin: `0 0 ${isMobile ? 8 : 10}px`, lineHeight: 1.2,
        paddingRight: 40,
      }}>
        {step.title}
      </h2>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: isMobile ? 14 : (isWelcome ? 16 : 15),
        lineHeight: 1.6,
        color: 'rgba(255,255,255,0.60)',
        margin: `0 0 ${isMobile ? 20 : (isWelcome ? 28 : 20)}px`,
      }}>
        {step.description}
      </p>

      {/* ── Dots de progression ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: isMobile ? 16 : 20 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            borderRadius: 3,
            width: i === idx ? 18 : 5, height: 5,
            background: i === idx ? BAI.caramel : i < idx ? 'rgba(196,151,106,0.40)' : 'rgba(255,255,255,0.14)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* ── Boutons navigation ──────────────────────────────────────────── */}
      {isMobile ? (
        // Mobile : gros boutons tactiles pleine largeur
        <div style={{
          display: 'flex', gap: 10,
          paddingBottom: `calc(16px + env(safe-area-inset-bottom) + ${MOBILE_NAV_H}px)`,
        }}>
          {/* Précédent */}
          {idx > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onBack() }}
              style={{
                flex: 1, height: 52, borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.75)',
                fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', pointerEvents: 'auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <ChevronLeft size={16} /> Précédent
            </button>
          )}

          {/* Suivant / Terminer */}
          <button
            onClick={(e) => { e.stopPropagation(); isLast ? onClose() : onAdvance() }}
            style={{
              flex: idx > 0 ? 2 : 1, height: 52, borderRadius: 12,
              border: 'none',
              background: isLast
                ? 'linear-gradient(135deg, rgba(196,151,106,0.9), rgba(196,151,106,0.7))'
                : BAI.caramel,
              color: '#fff',
              fontFamily: BAI.fontBody, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            {isWelcome
              ? (step.ctaLabel ?? "C'est parti !")
              : isLast ? 'Terminer ✓' : <>Suivant <ArrowRight size={15} /></>}
          </button>
        </div>
      ) : (
        // Desktop : footer discret
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {idx > 0 && !isWelcome ? (
            <button
              onClick={(e) => { e.stopPropagation(); onBack() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: BAI.fontBody, fontSize: 12,
                color: 'rgba(255,255,255,0.28)', background: 'none',
                border: 'none', cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              <ChevronLeft size={12} /> Précédent
            </button>
          ) : <span />}

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: BAI.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
            {isLast ? <span>Terminer</span> : (
              <>
                <span>{isWelcome ? step.ctaLabel ?? "C'est parti !" : 'Suivant'}</span>
                <span style={{ fontSize: 11, padding: '2px 5px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4 }}>Espace</span>
                <ArrowRight size={11} style={{ color: 'rgba(255,255,255,0.22)' }} />
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Lien "Passer" bienvenue desktop ─────────────────────────────── */}
      {isWelcome && !isMobile && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          style={{
            display: 'block', width: '100%', marginTop: 10,
            fontFamily: BAI.fontBody, fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'center', pointerEvents: 'auto',
          }}
        >
          Passer le guide
        </button>
      )}
    </motion.div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function SpotlightTour({ steps, storageKey, onClose, immediate = false }: SpotlightTourProps) {
  const [visible, setVisible]   = useState(false)
  const [idx, setIdx]           = useState(0)
  const [rect, setRect]         = useState<DOMRect | null>(null)
  const [vw, setVw]             = useState(() => window.innerWidth)
  const [vh, setVh]             = useState(() => window.innerHeight)
  const touchStartX             = useRef<number | null>(null)

  // ── Décision d'affichage ─────────────────────────────────────────────────
  useEffect(() => {
    const done = localStorage.getItem(storageKey)
    if (immediate || !done) {
      setVisible(true)
      setIdx(0)
    }
  }, [storageKey, immediate])

  // ── Resize ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const handle = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', handle)
    return () => window.removeEventListener('resize', handle)
  }, [])

  // ── Mise à jour du rect cible ────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    const step = steps[idx]
    const update = () => setRect(queryTarget(step?.targetId ?? null))
    update()
    // Délai pour attendre les animations de la sidebar
    const t = setTimeout(update, 90)
    return () => clearTimeout(t)
  }, [idx, visible, steps, vw, vh])

  // ── Actions ──────────────────────────────────────────────────────────────
  const close = useCallback(() => {
    localStorage.setItem(storageKey, '1')
    setVisible(false)
    onClose?.()
  }, [storageKey, onClose])

  const advance = useCallback(() => {
    setIdx(i => {
      if (i < steps.length - 1) return i + 1
      close()
      return i
    })
  }, [steps.length, close])

  const back = useCallback(() => {
    setIdx(i => Math.max(0, i - 1))
  }, [])

  // ── Clavier ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return
    const handle = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); advance() }
      if (e.key === 'ArrowLeft') back()
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [visible, advance, back, close])

  // ── Swipe tactile (mobile) ───────────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) { advance(); return }   // small tap = advance
    if (dx < -40) advance()   // swipe left = next
    if (dx >  40) back()      // swipe right = prev
  }, [advance, back])

  if (!visible) return null

  const step  = steps[idx]
  const spot: SpotRect | null = rect ? {
    x: rect.left - PAD,
    y: rect.top  - PAD,
    w: rect.width  + PAD * 2,
    h: rect.height + PAD * 2,
  } : null

  return createPortal(
    <AnimatePresence>
      {visible && (
        <>
          {/* ── Overlay cliquable / swipable ─────────────────────────────── */}
          <div
            key="overlay"
            onClick={advance}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9998, cursor: 'pointer',
              // iOS safe area bottom
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            aria-hidden="true"
          >
            <SpotlightMask vw={vw} vh={vh} spot={spot} />
          </div>

          {/* ── Tooltip ───────────────────────────────────────────────────── */}
          <Tooltip
            step={step}
            idx={idx}
            total={steps.length}
            rect={rect}
            vw={vw}
            vh={vh}
            onAdvance={advance}
            onBack={back}
            onClose={close}
          />
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
