import { BAI } from '../constants/bailio-tokens'

/** Zone mise en avant sur une capture, en pourcentage de l'image (1440 × 900). */
export interface Spot {
  x: number
  y: number
  w: number
  h: number
  /** Bulle affichée sous la zone. */
  label: string
}

/**
 * Capture de l'application sur ordinateur dans une fenêtre de navigateur : montrée telle quelle, même sur téléphone,
 * pour voir tout l'écran. Images dans client/public/fonctionnalites/ (1440 × 900, compte d'exemple).
 */
export function AppWindow({ img, alt, spot, path = 'bailio.fr/espace', eager = false }: { img: string; alt: string; spot?: Spot; path?: string; eager?: boolean }) {
  return (
    <figure style={{ margin: 0, width: '100%', borderRadius: 'clamp(10px, 1.6vw, 16px)', border: `1px solid ${BAI.border}`, background: BAI.surface, overflow: 'hidden', boxShadow: `0 1px 2px ${BAI.border}, 0 12px 32px -18px ${BAI.night}` }}>
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 6, padding: 'clamp(6px, 1vw, 10px) clamp(8px, 1.4vw, 14px)', background: BAI.bg, borderBottom: `1px solid ${BAI.border}` }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: BAI.peach, border: `1px solid ${BAI.border}` }} />
        <span style={{ width: 9, height: 9, borderRadius: 5, background: BAI.sky, border: `1px solid ${BAI.border}` }} />
        <span style={{ width: 9, height: 9, borderRadius: 5, background: BAI.surface, border: `1px solid ${BAI.border}` }} />
        <span style={{ marginLeft: 'auto', marginRight: 'auto', fontSize: 'clamp(9px, 1.2vw, 12px)', color: BAI.inkMid, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 999, padding: '2px 14px' }}>{path}</span>
      </div>
      <div style={{ position: 'relative', aspectRatio: '1440 / 900' }}>
        <img src={`/fonctionnalites/${img}.webp`} alt={alt} width={1440} height={900} loading={eager ? 'eager' : 'lazy'} decoding="async" style={{ width: '100%', height: '100%', display: 'block' }} />
        {spot ? (
          <>
            <span aria-hidden style={{ position: 'absolute', left: `${spot.x - 1}%`, top: `${spot.y - 1.2}%`, width: `${spot.w + 2}%`, height: `${spot.h + 2.4}%`, border: `2px solid ${BAI.owner}`, borderRadius: 10, boxShadow: `0 0 0 4px ${BAI.sky}` }} />
            <span
              style={{
                position: 'absolute',
                left: `${Math.min(spot.x, 62)}%`,
                top: `calc(${spot.y + spot.h + 2.4}% + 6px)`,
                maxWidth: '36%',
                background: BAI.night,
                color: BAI.surface,
                fontSize: 'clamp(10px, 1.3vw, 14px)',
                fontWeight: 600,
                lineHeight: 1.3,
                borderRadius: 10,
                padding: 'clamp(4px, 0.7vw, 8px) clamp(8px, 1vw, 12px)',
              }}
            >
              {spot.label}
            </span>
          </>
        ) : null}
      </div>
    </figure>
  )
}
