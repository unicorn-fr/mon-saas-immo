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

/**
 * Variante B pour le test A/B de YouTube : fond encre (contraste fort dans une page blanche de suggestions),
 * promesse émotionnelle, et trois notifications Bailio cochées à droite.
 */
export function MiniatureB() {
  const notifs: Array<[string, string]> = [
    ['Bail signé', 'En ligne, sans papier'],
    ['Quittance envoyée', 'Partie toute seule'],
    ['Révision prête', 'Nouveau loyer calculé'],
  ]
  return (
    <AbsoluteFill style={{ background: M.encre, overflow: 'hidden' }}>
      <style>{polices}</style>
      <div style={{ position: 'absolute', width: 1100, height: 1100, left: 520, top: -380, borderRadius: '50%', background: `radial-gradient(circle, ${M.caramel} 0%, transparent 62%)`, opacity: 0.28 }} />
      <div style={{ position: 'absolute', left: 70, top: 78, width: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <span style={{ alignSelf: 'flex-start', background: M.caramel, borderRadius: 999, padding: '10px 26px', ...capitales(24, M.encre) }}>Propriétaires</span>
        <div style={{ ...serif(112, M.blanc, 700), lineHeight: 0.98 }}>Fini les soirées</div>
        <div style={{ ...serif(112, M.caramel, 700), lineHeight: 0.98 }}>paperasse.</div>
      </div>
      <div style={{ position: 'absolute', left: 70, bottom: 46 }}>
        <Logo height={58} color={M.blanc} />
      </div>
      <div style={{ position: 'absolute', right: 56, top: 118, width: 540, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {notifs.map(([t, d], k) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 20, background: M.blanc, borderRadius: 26, padding: '22px 26px', boxShadow: '0 24px 50px rgba(0,0,0,0.35)', transform: `rotate(${k === 1 ? 0 : k ? 2 : -2}deg) translateX(${k === 1 ? -36 : 0}px)` }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: M.encre, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...serif(44, M.caramel, 700) }}>B</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
              <span style={{ ...capitales(14, M.gris) }}>Bailio · e-mail</span>
              <span style={{ ...sans(32, M.encre, 700), lineHeight: 1.15, whiteSpace: 'nowrap' }}>{t}</span>
              <span style={{ ...sans(22, M.gris), lineHeight: 1.2 }}>{d}</span>
            </div>
            <div style={{ width: 46, height: 46, borderRadius: 23, background: M.bleu, display: 'flex', alignItems: 'center', justifyContent: 'center', ...sans(28, M.blanc, 700), flexShrink: 0 }}>✓</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}
