import { useCallback, useEffect, useState } from 'react'
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

function Tooltip({ step, idx, total, rect, vw, vh, onBack, onClose }: TooltipProps) {
  const isWelcome = idx === 0
  const isMobile = vw < 768

  // ── Positionnement ──────────────────────────────────────────────────────────
  let tipStyle: React.CSSProperties

  if (isWelcome || !rect) {
    // Plein écran centré
    tipStyle = {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: `min(500px, 92vw)`,
    }
  } else if (isMobile) {
    // Mobile : en bas ou en haut selon l'espace disponible
    const spaceBelow = vh - rect.bottom - PAD
    const spaceAbove = rect.top - PAD
    const useBelow = spaceBelow >= 170 || spaceBelow >= spaceAbove
    tipStyle = {
      position: 'fixed',
      left: 16,
      right: 16,
      ...(useBelow
        ? { top: Math.min(rect.bottom + PAD + 16, vh - 175) }
        : { bottom: Math.max(vh - rect.top + PAD + 10, 12) }),
    }
  } else {
    // Desktop : à droite de la sidebar
    const left = rect.right + PAD + 24
    const maxW = Math.min(330, vw - left - 20)
    const top = Math.max(20, Math.min(rect.top - 16, vh - 300))
    tipStyle = {
      position: 'fixed',
      left,
      top,
      width: maxW,
    }
  }

  const isLast = idx === total - 1

  return (
    <motion.div
      key={idx}
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.93, y: 6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      style={{
        ...tipStyle,
        zIndex: 9999,
        background: 'linear-gradient(155deg, #10132a 0%, #0a0d1a 100%)',
        border: '1px solid rgba(196,151,106,0.20)',
        borderRadius: 18,
        padding: isWelcome ? 'clamp(28px,4vw,36px) clamp(24px,4vw,32px)' : '22px 24px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.06)',
        // Les clics passent au travers vers l'overlay (sauf les boutons)
        pointerEvents: 'none',
      }}
    >
      {/* ── Fermer ──────────────────────────────────────────────────────────── */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        aria-label="Fermer le guide"
        style={{
          position: 'absolute', top: 14, right: 14,
          width: 28, height: 28, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.40)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', pointerEvents: 'auto',
          transition: 'background 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.13)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.40)'
        }}
      >
        <X size={12} />
      </button>

      {/* ── Icône de bienvenue ───────────────────────────────────────────────── */}
      {isWelcome && (
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'rgba(196,151,106,0.14)',
            border: '1px solid rgba(196,151,106,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20,
          }}
        >
          <Sparkles size={22} style={{ color: BAI.caramel }} />
        </motion.div>
      )}

      {/* ── Badge étape ─────────────────────────────────────────────────────── */}
      {!isWelcome && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            fontFamily: BAI.fontBody, fontSize: 12, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: BAI.caramel,
          }}>
            {idx} / {total - 1}
          </span>
          {step.tag && (
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase',
              background: 'rgba(196,151,106,0.16)',
              border: '1px solid rgba(196,151,106,0.28)',
              color: BAI.caramel,
            }}>
              {step.tag}
            </span>
          )}
        </div>
      )}

      {/* ── Titre ───────────────────────────────────────────────────────────── */}
      <h2 style={{
        fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700,
        fontSize: isWelcome ? 'clamp(28px,5vw,40px)' : 24,
        color: '#ffffff', margin: '0 0 10px', lineHeight: 1.15,
      }}>
        {step.title}
      </h2>

      {/* ── Description ─────────────────────────────────────────────────────── */}
      <p style={{
        fontFamily: BAI.fontBody,
        fontSize: isWelcome ? 16 : 15,
        lineHeight: 1.65,
        color: 'rgba(255,255,255,0.60)',
        margin: `0 0 ${isWelcome ? 28 : 20}px`,
      }}>
        {step.description}
      </p>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Points de progression */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 3,
              width: i === idx ? 18 : 5,
              height: 5,
              background: i === idx
                ? BAI.caramel
                : i < idx
                  ? 'rgba(196,151,106,0.40)'
                  : 'rgba(255,255,255,0.14)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Hint clic / Espace */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontFamily: BAI.fontBody, fontSize: 12,
          color: 'rgba(255,255,255,0.28)',
        }}>
          {isLast ? (
            <span>Terminer</span>
          ) : (
            <>
              <span>{isWelcome ? step.ctaLabel ?? "C'est parti !" : 'Suivant'}</span>
              <span style={{
                fontSize: 11, padding: '2px 5px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 4,
              }}>Espace</span>
              <ArrowRight size={11} style={{ color: 'rgba(255,255,255,0.22)' }} />
            </>
          )}
        </div>
      </div>

      {/* ── Navigation arrière (non-welcome) ────────────────────────────────── */}
      {!isWelcome && idx > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onBack() }}
          aria-label="Étape précédente"
          style={{
            position: 'absolute', bottom: 22, left: 24,
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: BAI.fontBody, fontSize: 12,
            color: 'rgba(255,255,255,0.28)', background: 'none',
            border: 'none', cursor: 'pointer', pointerEvents: 'auto',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
        >
          <ChevronLeft size={12} /> Précédent
        </button>
      )}

      {/* ── Lien "Passer" sur l'écran de bienvenue ──────────────────────────── */}
      {isWelcome && (
        <button
          onClick={(e) => { e.stopPropagation(); onClose() }}
          style={{
            display: 'block', width: '100%', marginTop: 10,
            fontFamily: BAI.fontBody, fontSize: 13,
            color: 'rgba(255,255,255,0.25)',
            background: 'none', border: 'none', cursor: 'pointer',
            textAlign: 'center', pointerEvents: 'auto',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.50)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
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
          {/* ── Overlay cliquable ─────────────────────────────────────────── */}
          <div
            key="overlay"
            onClick={advance}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 9998, cursor: 'pointer',
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
