import { AbsoluteFill, Img, staticFile } from 'remotion'
import { Logo, M, Rue, capitales, polices, sans, serif } from '../marque/Marque'

/**
 * Miniatures YouTube (1280 × 720) : lisibles en tout petit dans les suggestions. Une accroche courte en grand,
 * un mot en bleu souligné de caramel, un seul visuel à droite, le logo en bas à gauche.
 */
type Props = { kicker: string; ligne1: string; accent: string; visuel: 'telephone' | 'match' | 'calendrier' }

export function Miniature({ kicker, ligne1, accent, visuel }: Props) {
  return (
    <AbsoluteFill style={{ background: M.creme, overflow: 'hidden' }}>
      <style>{polices}</style>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.9 }}>
        <Rue width={1400} height={190} seed="mini" />
      </div>
      <div style={{ position: 'absolute', left: 70, top: 70, width: 700, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <span style={{ alignSelf: 'flex-start', background: M.caramel, borderRadius: 999, padding: '10px 26px', ...capitales(24, M.encre) }}>{kicker}</span>
        <div style={{ ...serif(118, M.encre, 700), lineHeight: 0.98 }}>{ligne1}</div>
        <div style={{ ...serif(118, M.bleu, 700), lineHeight: 0.98 }}>
          <span style={{ borderBottom: `10px solid ${M.caramel}` }}>{accent}</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 70, bottom: 46 }}>
        <Logo height={58} />
      </div>
      <div style={{ position: 'absolute', right: 70, top: 0, bottom: 0, width: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {visuel === 'telephone' ? (
          <div style={{ height: 600, width: 294, borderRadius: 46, background: M.encre, padding: 9, transform: 'rotate(5deg)', boxShadow: '0 40px 80px rgba(26,26,46,0.25)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden' }}>
              <Img src={staticFile('ecrans/aujourdhui.png')} style={{ width: '100%' }} />
            </div>
          </div>
        ) : visuel === 'match' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <span style={{ background: M.bleu, borderRadius: 30, padding: '26px 54px', ...serif(84, M.blanc, 700) }}>Vide</span>
            <span style={{ ...sans(56, M.caramelFonce, 700) }}>ou</span>
            <span style={{ background: M.caramel, borderRadius: 30, padding: '26px 54px', ...serif(84, M.blanc, 700) }}>Meublé</span>
          </div>
        ) : (
          <div style={{ width: 360, borderRadius: 34, overflow: 'hidden', background: M.blanc, boxShadow: '0 40px 80px rgba(26,26,46,0.18)', transform: 'rotate(-4deg)' }}>
            <div style={{ background: M.caramel, height: 70 }} />
            <div style={{ padding: '20px 20px 34px', textAlign: 'center' }}>
              <div style={{ ...sans(230, M.encre, 700), lineHeight: 1, letterSpacing: -10 }}>6</div>
              <div style={{ ...capitales(28), marginTop: 6 }}>dates clés</div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}
