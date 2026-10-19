import { AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { Backdrop, Camera, Highlight, MaskLine, Slam, clamp, easeInOut, easeOut, glass, label, title, useBounce, useCount, useProgress } from '../fx'
import type { Word } from '../captions'
import type { GuideStop } from '../guide'
import { C, serif } from '../theme'

/** Notification (email) qui descend sur l'écran du téléphone. */
export type Notif = { titre: string; texte: string }
/** Carte flottante à côté du téléphone : montant qui défile, ou progression d'étapes. */
export type Carte = { titre: string; sous?: string; montant?: number; etape?: [number, number] }

/** sousTitre : texte affiché à la place de la voix off quand elle s'écrit autrement (« bailio point f r »). */
export type Scene = { sousTitre?: string } & (
  | { type: 'mots'; voix: string; mots: string[]; chute: string; reperes?: string[]; relance?: { repere: string; texte: string } }
  | { type: 'grand'; voix: string; texte: string; accent: string }
  | { type: 'logo'; voix: string; sous: string }
  | { type: 'ecran'; voix: string; titre: string; accent: string; image: string; cote?: 'droite' | 'gauche'; badge?: string; zoom?: boolean; tap?: [number, number]; notifs?: Notif[]; carte?: Carte }
  | { type: 'liste'; voix: string; titre: string; items: string[]; images: string[] }
  | { type: 'fin'; voix: string; texte: string; accent: string; url: string }
)

const sfx = (name: string, volume = 0.6) => <Audio src={staticFile(`sfx/${name}.wav`)} volume={volume} />

/**
 * Accroche : chaque tâche claque plein écran au moment où la voix la prononce, puis un tampon « des heures perdues ».
 * reperes : un mot prononcé par tâche, puis un pour le tampon (calés sur l'horodatage de la voix s'il existe).
 */
function Mots({ s, frames, words, voiceAt = 0 }: { s: Extract<Scene, { type: 'mots' }>; frames: number; words?: Word[]; voiceAt?: number }) {
  const frame = useCurrentFrame()
  const norm = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z]/g, '')
  const cue = (k: number) => {
    const r = s.reperes?.[k]
    const w = r && words?.find((x) => norm(x.w) === norm(r))
    return w ? voiceAt + Math.round(w.start * 30) : null
  }
  const fallbackIntro = Math.floor(frames * 0.2)
  const fallbackPer = Math.max(7, Math.floor((frames * 0.6 - fallbackIntro) / s.mots.length))
  const starts = s.mots.map((_, k) => cue(k) ?? fallbackIntro + k * fallbackPer)
  const intro = starts[0]
  const endWords = cue(s.mots.length) ?? fallbackIntro + fallbackPer * s.mots.length
  const idx = frame < intro ? -1 : starts.reduce((a, st, k) => (frame >= st ? k : a), 0)
  // Entre la question et la première tâche : une phrase de relance (« Vous connaissez ça… »).
  const relanceWord = s.relance && words?.find((x) => norm(x.w) === norm(s.relance!.repere))
  const relanceAt = relanceWord ? voiceAt + Math.round(relanceWord.start * 30) : null
  const stamp = useBounce(endWords + 2, 300, 12)
  return (
    <AbsoluteFill>
      <Backdrop dark />
      <Camera frames={frames} push={0.08} shakeAt={endWords + 2}>
        {frame < endWords ? (
          <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 }}>
            {idx < 0 && relanceAt !== null && frame >= relanceAt ? (
              <Slam key="relance" delay={relanceAt} style={{ ...title(150, C.surface), textAlign: 'center', padding: '0 80px' }}>{s.relance!.texte}</Slam>
            ) : idx < 0 ? (
              <Slam style={label(110, C.caramel)}>PROPRIÉTAIRE ?</Slam>
            ) : (
              <>
                <div style={{ ...label(46, C.onDark, 500), opacity: 0.8 }}>{`${idx + 1} / ${s.mots.length}`}</div>
                <Slam key={idx} delay={starts[idx]} style={title(170, C.surface)}>{s.mots[idx]}</Slam>
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
      {[0, ...(relanceAt !== null ? [relanceAt] : []), ...starts].map((f, i) => <Sequence key={i} from={f} durationInFrames={10}>{sfx('pop', 0.5)}</Sequence>)}
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

/** Géométrie du téléphone (pixels de l'image) : sert aussi à poser la flèche guide sur l'écran. */
const PHONE = { left: 220, top: 640, w: 640, h: 1240, inset: 20 }
export const tapFrame = (frames: number) => Math.floor(frames * 0.55)
/** Point de l'écran du téléphone (en %) → pixels de l'image, en tenant compte de sa légère rotation. */
const tapPoint = (tap: [number, number], side: 'droite' | 'gauche' = 'droite') => {
  const dir = side === 'droite' ? 1 : -1
  const x = PHONE.left + PHONE.inset + ((PHONE.w - 2 * PHONE.inset) * tap[0]) / 100
  const y = PHONE.top + PHONE.inset + ((PHONE.h - 2 * PHONE.inset) * tap[1]) / 100
  // rotateY de quelques degrés : le côté éloigné se resserre vers le centre.
  return { x: 540 + (x - 540) * 0.985 - dir * 8, y }
}

/**
 * Téléphone : il glisse et pivote vers nous puis se pose presque de face, flotte, l'écran défile.
 * Le clic est donné par la flèche guide ; ici, seulement l'onde sous le doigt.
 */
function Phone({ src, side = 'droite', frames, zoom, badge, tap }: { src: string; side?: 'droite' | 'gauche'; frames: number; zoom?: boolean; badge?: string; tap?: [number, number] }) {
  const frame = useCurrentFrame()
  const enter = useBounce(2, 120, 18)
  const dir = side === 'droite' ? 1 : -1
  const rotY = interpolate(enter, [0, 1], [dir * -38, dir * -6]) + Math.sin(frame / 30) * 1.5
  const rotX = interpolate(enter, [0, 1], [14, 3]) + Math.cos(frame / 34) * 1
  const lift = Math.sin(frame / 22) * 8
  const scroll = interpolate(frame, [16, frames - 6], [0, zoom ? -260 : -140], { ...clamp, easing: easeInOut })
  const tapAt = tapFrame(frames)
  const ripple = interpolate(frame, [tapAt, tapAt + 16], [0, 1], clamp)
  const t = tap ?? [50, 30]
  const dive = zoom ? interpolate(frame, [tapAt + 2, frames], [1, 1.3], { ...clamp, easing: easeOut }) : 1
  const shine = interpolate(frame, [6, 30], [-120, 220], clamp)
  const b = useBounce(16, 300, 12)
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: PHONE.top, height: PHONE.h, perspective: 2400, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: PHONE.w, height: PHONE.h, transformStyle: 'preserve-3d', transform: `translateX(${(1 - enter) * dir * 640}px) translateY(${lift}px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${dive})`, transformOrigin: `${t[0]}% ${t[1]}%` }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 86, background: 'linear-gradient(150deg, #2a2a40 0%, #0e0e1a 60%)', padding: PHONE.inset, boxShadow: `${dir * 30}px 60px 110px rgba(10,10,30,0.38), inset 0 0 0 3px rgba(255,255,255,0.08)` }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 66, overflow: 'hidden', background: C.bg }}>
            <Img src={staticFile(src)} style={{ width: '100%', transform: `translateY(${scroll}px)` }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)', transform: `translateX(${shine}%)` }} />
            {tap && ripple > 0 && ripple < 1 ? (
              <div style={{ position: 'absolute', left: `${t[0]}%`, top: `${t[1]}%`, width: 170, height: 170, marginLeft: -85, marginTop: -85, borderRadius: 85, background: 'rgba(26,50,112,0.16)', border: `6px solid ${C.owner}`, transform: `scale(${0.3 + ripple})`, opacity: 1 - ripple }} />
            ) : null}
          </div>
        </div>
        {badge ? (
          <div style={{ position: 'absolute', top: 150, [side === 'droite' ? 'left' : 'right']: -90, transform: `translateZ(80px) scale(${b}) rotate(${-dir * 6}deg)`, background: C.green, ...label(56, C.surface), padding: '24px 44px', borderRadius: 999, boxShadow: '0 24px 50px rgba(27,94,59,0.45)' }}>{badge}</div>
        ) : null}
      </div>
      {badge ? <Sequence from={16} durationInFrames={30}>{sfx('ding', 0.35)}</Sequence> : null}
    </div>
  )
}

/** Notifications email empilées sur le téléphone : la plus récente arrive en haut et pousse les autres. */
export const notifTimes = (n: number, frames: number) => Array.from({ length: n }, (_, j) => 8 + j * Math.max(10, Math.floor((frames * 0.62) / n)))
const NOTIF_TOP = 700
const NOTIF_STEP = 196
function Notifs({ items, frames, pressAt }: { items: Notif[]; frames: number; pressAt: number }) {
  const frame = useCurrentFrame()
  const times = notifTimes(items.length, frames)
  const bounces = times.map((t) => useBounce(t, 200, 17))
  const pressed = frame >= pressAt && frame < pressAt + 6 ? 0.96 : 1
  return (
    <>
      {items.map((n, j) => {
        const shift = bounces.slice(j + 1).reduce((a, b) => a + b, 0) * NOTIF_STEP
        const enter = bounces[j]
        const isTop = j === items.length - 1
        return (
          <div key={j} style={{ position: 'absolute', left: 120, right: 120, top: NOTIF_TOP + shift, transform: `translateY(${(1 - enter) * -220}px) scale(${(0.9 + enter * 0.1) * (isTop ? pressed : 1)})`, opacity: Math.min(1, enter * 1.6), ...glass(), borderRadius: 38, padding: '24px 30px', display: 'flex', gap: 24, alignItems: 'center' }}>
            <div style={{ width: 92, height: 92, flexShrink: 0, borderRadius: 24, background: C.night, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: C.caramel }}>B</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', ...label(26, C.inkMid, 500), letterSpacing: 1.5, textTransform: 'uppercase' }}>
                <span>Bailio · E-mail</span>
                <span>maintenant</span>
              </div>
              <div style={{ ...label(38, C.ink), marginTop: 6 }}>{n.titre}</div>
              <div style={{ ...label(31, C.inkMid, 400), marginTop: 4 }}>{n.texte}</div>
            </div>
          </div>
        )
      })}
      {times.map((t, j) => <Sequence key={j} from={t} durationInFrames={30}>{sfx('ding', 0.4)}</Sequence>)}
    </>
  )
}

/** Carte flottante à côté du téléphone : chiffre qui défile ou barre d'étapes qui se remplit. */
function CarteFlottante({ c, side, frames }: { c: Carte; side: 'droite' | 'gauche'; frames: number }) {
  const frame = useCurrentFrame()
  const at = Math.floor(frames * 0.28)
  const b = useBounce(at, 180, 15)
  const amount = useCount(c.montant ?? 0, at + 4, 26)
  const fill = useProgress(at + 4, 30)
  const dir = side === 'droite' ? 1 : -1
  return (
    <>
      <div style={{ position: 'absolute', top: 1090 + Math.sin(frame / 18) * 8, [side === 'droite' ? 'right' : 'left']: 40, width: 520, transform: `translateX(${(1 - b) * dir * 220}px) scale(${0.8 + b * 0.2}) rotate(${-dir * 3}deg)`, opacity: Math.min(1, b * 1.5), ...glass(), padding: '30px 36px' }}>
        <div style={{ ...label(28, C.inkMid, 500), letterSpacing: 1.5, textTransform: 'uppercase' }}>{c.titre}</div>
        {c.montant !== undefined ? <div style={{ ...label(84, C.ink), letterSpacing: -2, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{amount} €</div> : null}
        {c.etape ? (
          <>
            <div style={{ ...label(52, C.ink), marginTop: 8 }}>{`Question ${Math.max(1, Math.round(c.etape[0] * fill))} sur ${c.etape[1]}`}</div>
            <div style={{ marginTop: 18, height: 16, borderRadius: 8, background: C.ownerLight, overflow: 'hidden' }}>
              <div style={{ width: `${(c.etape[0] / c.etape[1]) * 100 * fill}%`, height: '100%', borderRadius: 8, background: C.owner }} />
            </div>
          </>
        ) : null}
        {c.sous ? <div style={{ ...label(32, C.green), marginTop: 12 }}>{c.sous}</div> : null}
      </div>
      <Sequence from={at} durationInFrames={10}>{sfx('pop', 0.4)}</Sequence>
    </>
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
        <Phone src={s.image} side={s.cote} frames={frames} zoom={s.zoom} badge={s.badge} tap={s.notifs ? undefined : s.tap} />
        {s.notifs ? <Notifs items={s.notifs} frames={frames} pressAt={tapFrame(frames)} /> : null}
        {s.carte ? <CarteFlottante c={s.carte} side={s.cote === 'gauche' ? 'droite' : 'gauche'} frames={frames} /> : null}
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

export const FIN_CLICK = 34

/** Appel à l'action : titre par masque, adresse du site dans un bouton qui respire, flèche vers le bas. */
function Fin({ s, frames }: { s: Extract<Scene, { type: 'fin' }>; frames: number }) {
  const frame = useCurrentFrame()
  const btn = useBounce(14, 220, 12)
  // La flèche guide clique sur le bouton : il s'enfonce puis rebondit.
  const press = frame >= FIN_CLICK && frame < FIN_CLICK + 5 ? 0.93 : 1
  const pulse = (1 + Math.sin(frame / 5) * 0.025) * press
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

export function SceneView({ scene, frames, words, voiceAt }: { scene: Scene; frames: number; words?: Word[]; voiceAt?: number }) {
  switch (scene.type) {
    case 'mots':
      return <Mots s={scene} frames={frames} words={words} voiceAt={voiceAt} />
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

/** Où se pose la flèche guide dans chaque scène, et quand elle clique (images de la scène). */
export function guideStop(scene: Scene, frames: number): GuideStop {
  switch (scene.type) {
    case 'mots':
      return { x: 0, y: 0, hide: true }
    case 'grand':
      return { x: 860, y: 1250, dir: -150 }
    case 'logo':
      return { x: 830, y: 1010, dir: -160 }
    case 'ecran':
      if (scene.notifs) return { x: 820, y: NOTIF_TOP + 120, dir: -125, click: tapFrame(frames) }
      return { ...tapPoint(scene.tap ?? [50, 30], scene.cote), dir: -125, click: scene.tap ? tapFrame(frames) : undefined }
    case 'liste':
      return { x: 760, y: 430, dir: -140 }
    case 'fin':
      return { x: 720, y: 880, dir: -130, click: FIN_CLICK }
  }
}
