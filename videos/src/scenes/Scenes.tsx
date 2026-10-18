import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { C } from '../theme'
import { Background, Phone, Pop, bodyStyle, titleStyle, useSpring } from './kit'

/** sousTitre : texte affiché à la place de la voix off quand elle s'écrit autrement (« bailio point f r »). */
export type Scene = { sousTitre?: string } & (
  | { type: 'mots'; voix: string; mots: string[]; chute: string }
  | { type: 'grand'; voix: string; texte: string; accent: string }
  | { type: 'logo'; voix: string; sous: string }
  | { type: 'ecran'; voix: string; titre: string; accent: string; image: string; cote?: 'droite' | 'gauche'; badge?: string; zoom?: boolean }
  | { type: 'liste'; voix: string; titre: string; items: string[]; images: string[] }
  | { type: 'fin'; voix: string; texte: string; accent: string; url: string }
)

/** Accroche : les tâches s'empilent vite, puis se font barrer. */
function Mots({ s, frames }: { s: Extract<Scene, { type: 'mots' }>; frames: number }) {
  const frame = useCurrentFrame()
  const step = Math.max(6, Math.floor((frames * 0.55) / s.mots.length))
  const strike = interpolate(frame, [frames * 0.62, frames * 0.75], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const shake = frame > frames * 0.62 && frame < frames * 0.7 ? Math.sin(frame * 3) * 8 : 0
  return (
    <AbsoluteFill>
      <Background dark />
      <div style={{ position: 'absolute', top: 260, left: 80, right: 80, display: 'flex', flexDirection: 'column', gap: 26, transform: `translateX(${shake}px)` }}>
        <Pop style={bodyStyle(54, C.caramel, 700)}>PROPRIÉTAIRE ?</Pop>
        {s.mots.map((m, i) => (
          <Pop key={m} delay={8 + i * step} style={{ position: 'relative', alignSelf: i % 2 ? 'flex-end' : 'flex-start' }}>
            <span style={{ ...titleStyle(150, C.surface) }}>{m}</span>
            <div style={{ position: 'absolute', left: -10, right: -10, top: '55%', height: 14, background: C.caramel, transform: `scaleX(${strike})`, transformOrigin: 'left', borderRadius: 7 }} />
          </Pop>
        ))}
        <Pop delay={Math.floor(frames * 0.72)} style={{ ...bodyStyle(70, C.onDark, 700), marginTop: 30 }}>{s.chute}</Pop>
      </div>
    </AbsoluteFill>
  )
}

/** Grande phrase, la fin en couleur. */
function Grand({ s }: { s: Extract<Scene, { type: 'grand' }> }) {
  const frame = useCurrentFrame()
  const words = s.texte.split(' ')
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ position: 'absolute', top: 520, left: 80, right: 80, display: 'flex', flexWrap: 'wrap', gap: '10px 26px' }}>
        {words.map((w, i) => (
          <Pop key={i} delay={i * 3} style={titleStyle(150)}>{w}</Pop>
        ))}
        <Pop delay={words.length * 3 + 4} style={{ ...titleStyle(170, C.owner), position: 'relative' }}>
          {s.accent}
          <div style={{ position: 'absolute', left: 0, bottom: -10, height: 16, width: '100%', background: C.caramel, transform: `scaleX(${interpolate(frame, [words.length * 3 + 12, words.length * 3 + 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })})`, transformOrigin: 'left', borderRadius: 8 }} />
        </Pop>
      </div>
    </AbsoluteFill>
  )
}

/** Apparition du logo : cercle qui s'ouvre, nom en grand, sous-titre. */
function Logo({ s }: { s: Extract<Scene, { type: 'logo' }> }) {
  const c = useSpring(0, 12, 0.8)
  const t = useSpring(6)
  const u = useSpring(14)
  return (
    <AbsoluteFill>
      <Background dark />
      <div style={{ position: 'absolute', left: '50%', top: '42%', width: 1400, height: 1400, marginLeft: -700, marginTop: -700, borderRadius: 700, border: `6px solid ${C.caramel}`, transform: `scale(${c})`, opacity: 0.5 }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 }}>
        <div style={{ ...titleStyle(300, C.caramel), transform: `scale(${0.6 + 0.4 * t})`, opacity: t }}>Bailio</div>
        <div style={{ ...bodyStyle(52, C.onDark, 500), opacity: u, transform: `translateY(${(1 - u) * 30}px)`, textAlign: 'center', padding: '0 80px' }}>{s.sous}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Fonction de Bailio : titre en haut, téléphone avec la vraie page du site. */
function Ecran({ s }: { s: Extract<Scene, { type: 'ecran' }> }) {
  return (
    <AbsoluteFill>
      <Background />
      <div style={{ position: 'absolute', top: 170, left: 80, right: 80, textAlign: 'center' }}>
        <Pop style={titleStyle(130)}>{s.titre}</Pop>
        <Pop delay={5} style={{ ...titleStyle(140, C.owner), marginTop: 10 }}>{s.accent}</Pop>
      </div>
      <Phone src={s.image} side={s.cote} delay={6} zoom={s.zoom} badge={s.badge} />
    </AbsoluteFill>
  )
}

/** Plusieurs fonctions d'un coup : trois écrans en éventail, mots-clés qui défilent. */
function Liste({ s, frames }: { s: Extract<Scene, { type: 'liste' }>; frames: number }) {
  const frame = useCurrentFrame()
  const per = Math.floor((frames * 0.8) / s.items.length)
  const idx = Math.min(s.items.length - 1, Math.floor(frame / per))
  return (
    <AbsoluteFill>
      <Background dark />
      <div style={{ position: 'absolute', top: 170, left: 80, right: 80, textAlign: 'center' }}>
        <Pop style={titleStyle(120, C.surface)}>{s.titre}</Pop>
        <div key={idx} style={{ marginTop: 30 }}>
          <Pop style={{ ...bodyStyle(80, C.caramel, 700) }}>{s.items[idx]}</Pop>
        </div>
      </div>
      {s.images.map((img, i) => {
        const sp = useSpring(4 + i * 4, 15, 0.8)
        const angle = (i - 1) * 12
        return (
          <div key={img} style={{ position: 'absolute', left: '50%', top: 760, width: 440, height: 860, marginLeft: -220 + (i - 1) * 290, transform: `translateY(${(1 - sp) * 900}px) rotate(${angle * sp}deg)`, borderRadius: 54, background: C.surface, padding: 12, boxShadow: '0 40px 80px rgba(0,0,0,0.4)', zIndex: i === 1 ? 2 : 1 }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden' }}>
              <Img src={staticFile(img)} style={{ width: '100%' }} />
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/** Appel à l'action : texte, adresse du site en pastille, logo. */
function Fin({ s }: { s: Extract<Scene, { type: 'fin' }> }) {
  const frame = useCurrentFrame()
  const pulse = 1 + Math.sin(frame / 6) * 0.03
  const b = useSpring(12)
  return (
    <AbsoluteFill>
      <Background />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40, padding: '0 80px', textAlign: 'center' }}>
        <Pop style={titleStyle(140)}>{s.texte}</Pop>
        <Pop delay={4} style={titleStyle(170, C.owner)}>{s.accent}</Pop>
        <div style={{ transform: `scale(${b * pulse})`, background: C.owner, color: C.surface, ...bodyStyle(84, C.surface, 700), padding: '34px 70px', borderRadius: 999, marginTop: 30, boxShadow: '0 30px 60px rgba(26,50,112,0.35)' }}>{s.url}</div>
        <Pop delay={18} style={{ ...bodyStyle(44, C.inkMid, 500) }}>Sans carte bancaire · Sans engagement</Pop>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export function SceneView({ scene, frames }: { scene: Scene; frames: number }) {
  switch (scene.type) {
    case 'mots':
      return <Mots s={scene} frames={frames} />
    case 'grand':
      return <Grand s={scene} />
    case 'logo':
      return <Logo s={scene} />
    case 'ecran':
      return <Ecran s={scene} />
    case 'liste':
      return <Liste s={scene} frames={frames} />
    case 'fin':
      return <Fin s={scene} />
  }
}

export const isDark = (s: Scene) => s.type === 'mots' || s.type === 'logo' || s.type === 'liste'
