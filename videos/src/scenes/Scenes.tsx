import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { Backdrop, Camera, Highlight, MaskLine, Slam, clamp, easeInOut, easeOut, label, title, useBounce, useProgress } from '../fx'
import { C } from '../theme'

/** sousTitre : texte affiché à la place de la voix off quand elle s'écrit autrement (« bailio point f r »). */
export type Scene = { sousTitre?: string } & (
  | { type: 'mots'; voix: string; mots: string[]; chute: string }
  | { type: 'grand'; voix: string; texte: string; accent: string }
  | { type: 'logo'; voix: string; sous: string }
  | { type: 'ecran'; voix: string; titre: string; accent: string; image: string; cote?: 'droite' | 'gauche'; badge?: string; zoom?: boolean; tap?: [number, number] }
  | { type: 'liste'; voix: string; titre: string; items: string[]; images: string[] }
  | { type: 'fin'; voix: string; texte: string; accent: string; url: string }
)

const sfx = (name: string, volume = 0.6) => <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />

/** Accroche : chaque tâche claque plein écran, une par coupe, puis un tampon rouge « des heures perdues ». */
function Mots({ s, frames }: { s: Extract<Scene, { type: 'mots' }>; frames: number }) {
  const frame = useCurrentFrame()
  const intro = 14
  const per = Math.max(7, Math.floor((frames * 0.62 - intro) / s.mots.length))
  const endWords = intro + per * s.mots.length
  const idx = frame < intro ? -1 : Math.min(s.mots.length - 1, Math.floor((frame - intro) / per))
  const stamp = useBounce(endWords + 2, 300, 12)
  return (
    <AbsoluteFill>
      <Backdrop dark />
      <Camera frames={frames} push={0.08} shakeAt={endWords + 2}>
        {frame < endWords ? (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 }}>
            {idx < 0 ? (
              <Slam style={label(110, C.caramel)}>PROPRIÉTAIRE ?</Slam>
            ) : (
              <>
                <div style={{ ...label(46, C.onDark, 500), opacity: 0.8 }}>{`${idx + 1} / ${s.mots.length}`}</div>
                <Slam key={idx} delay={intro + idx * per} style={title(190, C.surface)}>{s.mots[idx]}</Slam>
              </>
            )}
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40, padding: '0 70px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '16px 28px', opacity: 0.35 }}>
              {s.mots.map((m) => <span key={m} style={{ ...title(90, C.onDark), textDecoration: 'line-through', textDecorationColor: C.caramel, textDecorationThickness: 8 }}>{m}</span>)}
            </div>
            <div style={{ transform: `rotate(-6deg) scale(${interpolate(stamp, [0, 1], [2, 1])})`, opacity: stamp > 0.02 ? 1 : 0, border: `10px solid ${C.caramel}`, borderRadius: 26, padding: '18px 40px', ...label(96, C.caramel), textTransform: 'uppercase' }}>{s.chute}</div>
          </AbsoluteFill>
        )}
      </Camera>
      {[0, ...s.mots.map((_, i) => intro + i * per)].map((f, i) => <Sequence key={i} from={f} durationInFrames={10}>{sfx('pop', 0.5)}</Sequence>)}
      <Sequence from={endWords + 2} durationInFrames={12}>{sfx('impact', 0.9)}</Sequence>
    </AbsoluteFill>
  )
}

/** Question qui retourne la situation : lignes révélées par masque, la fin surlignée. */
function Grand({ s, frames }: { s: Extract<Scene, { type: 'grand' }>; frames: number }) {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera frames={frames} push={0.05}>
        <AbsoluteFill style={{ justifyContent: 'center', padding: '0 90px', gap: 6 }}>
          {s.texte.split(' ').reduce<string[][]>((lines, w) => {
            const last = lines[lines.length - 1]
            if (last && last.join(' ').length + w.length < 12) last.push(w)
            else lines.push([w])
            return lines
          }, []).map((l, i) => (
            <MaskLine key={i} delay={i * 4} style={title(160)}>{l.join(' ')}</MaskLine>
          ))}
          <MaskLine delay={14} style={{ ...title(175, C.owner), marginTop: 10 }}>
            <Highlight delay={26} color={C.caramel} style={{ color: C.night }}>{s.accent}</Highlight>
          </MaskLine>
        </AbsoluteFill>
      </Camera>
    </AbsoluteFill>
  )
}

/** Logo : éclat de lumière, lettres qui se resserrent, ligne caramel qui se trace. */
function Logo({ s, frames }: { s: Extract<Scene, { type: 'logo' }>; frames: number }) {
  const frame = useCurrentFrame()
  const p = useProgress(0, 22)
  const line = useProgress(10, 16)
  const sub = useProgress(16, 14)
  const flash = interpolate(frame, [0, 3, 10], [0.9, 0.6, 0], clamp)
  return (
    <AbsoluteFill>
      <Backdrop dark />
      <Camera frames={frames} push={0.1}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 34 }}>
          <div style={{ ...title(300, C.caramel), letterSpacing: interpolate(p, [0, 1], [60, -4]), opacity: p, filter: `blur(${(1 - p) * 20}px)` }}>Bailio</div>
          <div style={{ width: 520 * line, height: 8, background: C.caramel, borderRadius: 4 }} />
          <div style={{ ...label(52, C.onDark, 500), opacity: sub, transform: `translateY(${(1 - sub) * 24}px)`, textAlign: 'center', padding: '0 90px' }}>{s.sous}</div>
        </AbsoluteFill>
      </Camera>
      <AbsoluteFill style={{ background: C.surface, opacity: flash }} />
      <Sequence from={0} durationInFrames={20}>{sfx('impact', 0.8)}</Sequence>
    </AbsoluteFill>
  )
}

/** Téléphone en 3D : il pivote vers nous, l'écran défile, un doigt touche, la caméra plonge vers ce point. */
function Phone({ src, side = 'droite', frames, zoom, badge, tap = [50, 30] }: { src: string; side?: 'droite' | 'gauche'; frames: number; zoom?: boolean; badge?: string; tap?: [number, number] }) {
  const frame = useCurrentFrame()
  const enter = useBounce(4, 140, 16)
  const dir = side === 'droite' ? 1 : -1
  const rotY = interpolate(enter, [0, 1], [dir * -55, dir * -12])
  const rotX = interpolate(enter, [0, 1], [18, 6])
  const scroll = interpolate(frame, [18, frames - 6], [0, zoom ? -260 : -140], { ...clamp, easing: easeInOut })
  const tapAt = Math.floor(frames * 0.55)
  const ripple = interpolate(frame, [tapAt, tapAt + 14], [0, 1], clamp)
  const dive = zoom ? interpolate(frame, [tapAt, frames], [1, 1.35], { ...clamp, easing: easeOut }) : 1
  const shine = interpolate(frame, [8, 34], [-120, 220], clamp)
  const b = useBounce(16, 300, 12)
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 640, height: 1240, perspective: 2200, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 640, height: 1240, transformStyle: 'preserve-3d', transform: `translateX(${(1 - enter) * dir * 700}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${dive})`, transformOrigin: `${tap[0]}% ${tap[1]}%` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 82, background: '#0e0e1a', padding: 20, boxShadow: `${dir * 40}px 70px 120px rgba(10,10,30,0.45)` }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 64, overflow: 'hidden', background: C.bg }}>
            <Img src={staticFile(src)} style={{ width: '100%', transform: `translateY(${scroll}px)` }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)', transform: `translateX(${shine}%)` }} />
            {ripple > 0 && ripple < 1 ? (
              <div style={{ position: 'absolute', left: `${tap[0]}%`, top: `${tap[1]}%`, width: 160, height: 160, marginLeft: -80, marginTop: -80, borderRadius: 80, border: `8px solid ${C.owner}`, transform: `scale(${0.3 + ripple})`, opacity: 1 - ripple }} />
            ) : null}
            <div style={{ position: 'absolute', left: `${tap[0]}%`, top: `${tap[1]}%`, width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: 35, background: 'rgba(26,50,112,0.35)', border: '4px solid rgba(255,255,255,0.9)', opacity: interpolate(frame, [tapAt - 10, tapAt - 4, tapAt + 10, tapAt + 16], [0, 1, 1, 0], clamp), transform: `scale(${frame >= tapAt && frame < tapAt + 4 ? 0.8 : 1})` }} />
          </div>
        </div>
        {badge ? (
          <div style={{ position: 'absolute', top: 150, [side === 'droite' ? 'left' : 'right']: -90, transform: `translateZ(80px) scale(${b}) rotate(${-dir * 8}deg)`, background: C.green, ...label(56, C.surface), padding: '24px 44px', borderRadius: 999, boxShadow: '0 24px 50px rgba(27,94,59,0.45)' }}>{badge}</div>
        ) : null}
      </div>
      <Sequence from={tapAt - 2} durationInFrames={10}>{sfx('pop', 0.55)}</Sequence>
      {badge ? <Sequence from={16} durationInFrames={10}>{sfx('pop', 0.6)}</Sequence> : null}
    </div>
  )
}

function Ecran({ s, frames }: { s: Extract<Scene, { type: 'ecran' }>; frames: number }) {
  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera frames={frames} push={0.04}>
        <div style={{ position: 'absolute', top: 150, left: 70, right: 70, textAlign: 'center' }}>
          <MaskLine style={title(128)}>{s.titre}</MaskLine>
          <MaskLine delay={5} style={{ ...title(140, C.owner), marginTop: 8 }}>
            <Highlight delay={14} color={C.caramel} style={{ color: C.night }}>{s.accent}</Highlight>
          </MaskLine>
        </div>
        <Phone src={s.image} side={s.cote} frames={frames} zoom={s.zoom} badge={s.badge} tap={s.tap} />
      </Camera>
    </AbsoluteFill>
  )
}

/** Plusieurs fonctions : les écrans défilent en carrousel, le mot-clé change à chaque coupe. */
function Liste({ s, frames }: { s: Extract<Scene, { type: 'liste' }>; frames: number }) {
  const frame = useCurrentFrame()
  const per = Math.max(8, Math.floor((frames - 6) / s.items.length))
  const idx = Math.min(s.items.length - 1, Math.floor(frame / per))
  const slide = interpolate(frame, [0, frames], [0, -1], clamp)
  return (
    <AbsoluteFill>
      <Backdrop dark />
      <Camera frames={frames} push={0.05}>
        <div style={{ position: 'absolute', top: 150, left: 70, right: 70, textAlign: 'center' }}>
          <MaskLine style={title(118, C.surface)}>{s.titre}</MaskLine>
          <div style={{ marginTop: 34, height: 110 }}>
            <Slam key={idx} delay={idx * per} style={{ display: 'inline-block', background: C.caramel, borderRadius: 22, padding: '10px 36px', ...label(76, C.night) }}>{s.items[idx]}</Slam>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 760, left: 0, display: 'flex', gap: 60, transform: `translateX(${200 + slide * 900}px)` }}>
          {[...s.images, ...s.images].map((img, i) => (
            <div key={i} style={{ width: 460, height: 900, flexShrink: 0, borderRadius: 56, background: '#0e0e1a', padding: 14, boxShadow: '0 40px 90px rgba(0,0,0,0.5)', transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg) translateY(${(i % 2) * 60}px)` }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 44, overflow: 'hidden' }}>
                <Img src={staticFile(img)} style={{ width: '100%' }} />
              </div>
            </div>
          ))}
        </div>
      </Camera>
      {s.items.map((_, i) => <Sequence key={i} from={i * per} durationInFrames={10}>{sfx('pop', 0.45)}</Sequence>)}
    </AbsoluteFill>
  )
}

/** Appel à l'action : titre par masque, adresse du site dans un bouton qui respire, flèche vers le bas. */
function Fin({ s, frames }: { s: Extract<Scene, { type: 'fin' }>; frames: number }) {
  const frame = useCurrentFrame()
  const btn = useBounce(14, 220, 12)
  const pulse = 1 + Math.sin(frame / 5) * 0.025
  const arrow = Math.sin(frame / 4) * 14
  return (
    <AbsoluteFill>
      <Backdrop />
      <Camera frames={frames} push={0.06}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 26, padding: '0 70px', textAlign: 'center', marginTop: -160 }}>
          <MaskLine style={title(140)}>{s.texte}</MaskLine>
          <MaskLine delay={5} style={title(170, C.owner)}>
            <Highlight delay={14} color={C.caramel} style={{ color: C.night }}>{s.accent}</Highlight>
          </MaskLine>
          <div style={{ marginTop: 40, transform: `scale(${btn * pulse})`, background: C.owner, ...label(90, C.surface), padding: '36px 80px', borderRadius: 999, boxShadow: '0 30px 70px rgba(26,50,112,0.4)' }}>{s.url}</div>
          <div style={{ ...label(40, C.inkMid, 500), opacity: btn }}>Sans carte bancaire · Sans engagement</div>
          <div style={{ ...label(90, C.owner), transform: `translateY(${arrow}px)`, opacity: btn }}>↓</div>
        </AbsoluteFill>
      </Camera>
      <Sequence from={14} durationInFrames={12}>{sfx('impact', 0.7)}</Sequence>
    </AbsoluteFill>
  )
}

export function SceneView({ scene, frames }: { scene: Scene; frames: number }) {
  switch (scene.type) {
    case 'mots':
      return <Mots s={scene} frames={frames} />
    case 'grand':
      return <Grand s={scene} frames={frames} />
    case 'logo':
      return <Logo s={scene} frames={frames} />
    case 'ecran':
      return <Ecran s={scene} frames={frames} />
    case 'liste':
      return <Liste s={scene} frames={frames} />
    case 'fin':
      return <Fin s={scene} frames={frames} />
  }
}
