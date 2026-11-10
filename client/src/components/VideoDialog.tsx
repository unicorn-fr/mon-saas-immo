import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { BAI } from '../constants/bailio-tokens'
import { Close } from './Icons'

/** Vidéo de présentation, servie par le site (client/public/video/), sans service tiers ni traceur. */
export const DEMO_VIDEO = { src: '/video/bailio-presentation.mp4', poster: '/video/bailio-presentation.jpg', duration: '1 min 15', title: 'Bailio en une minute' }

/**
 * Bouton qui ouvre la vidéo de présentation par-dessus la page : fond assombri, lecture lancée, Échap, la croix ou un clic
 * à côté ferment et rendent la main au bouton. Sous-titres incrustés : la vidéo se comprend sans le son.
 */
export function VideoButton({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement | null>(null)
  const close = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') shut()
      if (e.key === 'Tab') (e.preventDefault(), close.current?.focus())
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shut = () => {
    setOpen(false)
    button.current?.focus()
  }

  return (
    <>
      <button ref={button} type="button" className={className} style={style} onClick={() => setOpen(true)} aria-haspopup="dialog">
        {children}
      </button>
      {open
        ? createPortal(
            <div className="drawer-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(12px, 3vw, 40px)' }}>
              <div className="drawer-backdrop" aria-hidden onClick={shut} style={{ background: `${BAI.night}d9` }} />
              <div role="dialog" aria-modal="true" aria-label={DEMO_VIDEO.title} className="panel-in" style={{ position: 'relative', width: 'min(1200px, 100%)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button ref={close} type="button" aria-label="Fermer la vidéo" onClick={shut} style={{ width: 44, height: 44, borderRadius: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: BAI.surface, color: BAI.ink, cursor: 'pointer' }}>
                    <Close size={18} />
                  </button>
                </div>
                <video src={DEMO_VIDEO.src} poster={DEMO_VIDEO.poster} controls autoPlay playsInline preload="metadata" aria-label="Présentation de Bailio : les écrans de l’application, avec des sous-titres" style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 18, background: BAI.night, display: 'block' }} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
