import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, sans } from './theme'

export interface Word {
  w: string
  start: number // secondes depuis le début de la phrase
  end: number
}

/** Mots à mettre en valeur (accent caramel) : chiffres, mots-clés de Bailio. */
const KEY = /^(bailio|gratuit|gratuitement|minutes?|loi|signer|signé|automatique|automatiquement|seul|seules|quittances?|bail|relance|heures|fr\.?|bailio\.fr)/i

/**
 * Sous-titres « réseaux sociaux » : deux ou trois mots à la fois, au centre bas, en gras,
 * chaque groupe arrive avec un petit rebond ; le mot prononcé s'allume, les mots-clés passent en caramel.
 */
export function Captions({ words, offset = 0 }: { words: Word[]; offset?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps - offset
  // Groupes de 3 mots au plus, coupés après une ponctuation.
  const groups: Word[][] = []
  let cur: Word[] = []
  for (const w of words) {
    cur.push(w)
    if (cur.length >= 3 || /[.,?!:;…]$/.test(w.w)) {
      groups.push(cur)
      cur = []
    }
  }
  if (cur.length) groups.push(cur)
  const g = groups.find((x, i) => t < (groups[i + 1]?.[0].start ?? Infinity)) ?? groups[groups.length - 1]
  if (!g || t < g[0].start - 0.05) return null
  const local = Math.max(0, frame - Math.round((g[0].start + offset) * fps))
  const pop = spring({ frame: local, fps, config: { stiffness: 320, damping: 16, mass: 0.5 } })
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 1420, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0 20px', background: 'rgba(26,26,46,0.9)', borderRadius: 30, padding: '22px 30px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', transform: `scale(${interpolate(pop, [0, 1], [0.7, 1])})`, opacity: Math.min(1, pop * 2) }}>
      {g.map((w, i) => {
        const said = t >= w.start - 0.02
        const key = KEY.test(w.w.replace(/[«»"]/g, ''))
        return (
          <span
            key={i}
            style={{
              fontFamily: sans,
              fontWeight: 700,
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              textTransform: 'uppercase',
              color: said ? (key ? C.caramel : C.surface) : 'rgba(255,255,255,0.55)',
            }}
          >
            {w.w}
          </span>
        )
      })}
    </div>
  )
}

/** Temps de chaque mot estimé sur la durée réelle de la phrase (voix sans horodatage). */
export function estimateWords(text: string, duration: number): Word[] {
  const parts = text.split(/\s+/).filter(Boolean)
  const weight = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, '').length + (/[.,?!:;…]$/.test(s) ? 3 : 0) + 1
  const total = parts.reduce((a, p) => a + weight(p), 0)
  let acc = 0.05
  const span = Math.max(0.5, duration - 0.15)
  return parts.map((p) => {
    const d = (weight(p) / total) * span
    const w = { w: p, start: acc, end: acc + d }
    acc += d
    return w
  })
}
