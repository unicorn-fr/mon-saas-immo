import type { TransitionPresentation, TransitionPresentationComponentProps } from '@remotion/transitions'
import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { estimateWords, type Word } from '../captions'
import { FilmLook, clamp, easeInOut } from '../fx'
import { Logo, M, capitales, polices, sans } from '../marque/Marque'
import { FPS, T } from '../theme'
import { whip, zoomThrough } from '../transitions'
import type { Voix } from '../Video'
import { SceneYTView, type SceneYT } from './Scenes'

/**
 * Vidéo YouTube (16:9) : scènes enchaînées, chapitres (barre de progression découpée en haut), voix off,
 * sous-titres en bas, nappe musicale et souffles. Les chapitres s'ouvrent par un volet caramel puis encre.
 */
export interface VideoYTDef {
  id: string
  titre: string
  legende: string
  musique?: string
  scenes: SceneYT[]
}

export const YT_W = 1920
export const YT_H = 1080
const PAD = 0.3
export const framesYT = (durees: number[]) => durees.map((d) => Math.max(40, Math.ceil((d + PAD) * FPS) + T))
export const totalYT = (durees: number[]) => framesYT(durees).reduce((a, b) => a + b, 0) - T * (durees.length - 1)

/** Volet : une bande caramel balaie l'écran de gauche à droite, la scène suivante apparaît derrière elle. */
function VoletView({ children, presentationDirection, presentationProgress: p }: TransitionPresentationComponentProps<Record<string, never>>) {
  if (presentationDirection === 'exiting') return <AbsoluteFill style={{ transform: `translateX(${-p * 8}%)` }}>{children}</AbsoluteFill>
  const edge = p * 112 - 6 // bord de la bande, en % de la largeur
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ clipPath: `inset(0 ${100 - Math.max(0, edge - 6)}% 0 0)` }}>{children}</AbsoluteFill>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${edge - 6}%`, width: '6%', background: M.caramel }} />
    </AbsoluteFill>
  )
}
const volet = (): TransitionPresentation<Record<string, never>> => ({ component: VoletView, props: {} })

function transitionFor(next: SceneYT, i: number) {
  if (next.type === 'titre') return volet()
  if (next.type === 'fin') return zoomThrough()
  return whip(i % 2 ? 'gauche' : 'droite')
}

/** Sous-titres : une ligne à la fois, en bas, mot prononcé en blanc, les suivants estompés. */
function SousTitres({ words }: { words: Word[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const t = frame / fps
  const groups: Word[][] = []
  let cur: Word[] = []
  for (const w of words) {
    cur.push(w)
    const len = cur.map((x) => x.w).join(' ').length
    if (len >= 34 || /[.?!:;…]$/.test(w.w) || (len >= 18 && /,$/.test(w.w))) {
      groups.push(cur)
      cur = []
    }
  }
  if (cur.length) groups.push(cur)
  const g = groups.find((_, i) => t < (groups[i + 1]?.[0].start ?? Infinity)) ?? groups[groups.length - 1]
  if (!g || t < g[0].start - 0.05 || t > g[g.length - 1].end + 0.6) return null
  const local = Math.max(0, frame - Math.round(g[0].start * fps))
  const pop = spring({ frame: local, fps, config: { stiffness: 300, damping: 20, mass: 0.5 } })
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center' }}>
      <div style={{ display: 'flex', gap: '0 14px', background: 'rgba(26,26,46,0.88)', borderRadius: 18, padding: '14px 30px', transform: `translateY(${(1 - pop) * 14}px)`, opacity: Math.min(1, pop * 2) }}>
        {g.map((w, i) => (
          <span key={i} style={{ ...sans(44, t >= w.start - 0.02 ? M.blanc : 'rgba(255,255,255,0.5)', 500), lineHeight: 1.2 }}>{w.w}</span>
        ))}
      </div>
    </div>
  )
}

/** En haut : le logo, le chapitre en cours, et une barre découpée par chapitre qui se remplit. */
function Chapitres({ chapitres, total, cacher }: { chapitres: Array<{ from: number; nom: string }>; total: number; cacher: Array<[number, number]> }) {
  const frame = useCurrentFrame()
  if (!chapitres.length) return null
  const hidden = cacher.some(([a, b]) => frame >= a && frame < b)
  const fade = interpolate(frame, [chapitres[0].from, chapitres[0].from + 20], [0, 1], clamp)
  const k = chapitres.reduce((a, c, i) => (frame >= c.from ? i : a), -1)
  const ends = chapitres.map((c, i) => chapitres[i + 1]?.from ?? total)
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top: 40, opacity: hidden ? 0 : fade, transition: 'none' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {chapitres.map((c, i) => (
          <div key={i} style={{ flex: ends[i] - c.from, height: 6, borderRadius: 3, background: 'rgba(26,26,46,0.1)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${interpolate(frame, [c.from, ends[i]], [0, 100], clamp)}%`, background: M.caramel }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 18 }}>
        <Logo height={44} />
        {k >= 0 ? <span style={{ ...capitales(20, M.caramelFonce) }}>{chapitres[k].nom}</span> : null}
      </div>
    </div>
  )
}

export function BailioYT({ video, voix }: { video: VideoYTDef; voix: Voix }) {
  const frames = framesYT(voix.durees)
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0) - i * T)
  const total = totalYT(voix.durees)
  const voiceAt = (i: number) => (i ? Math.round(T * 0.8) : 6)
  // Chapitres : les scènes « titre » ; à défaut, chaque « date » (vidéo calendrier).
  const avecTitres = video.scenes.some((s) => s.type === 'titre')
  const nDates = video.scenes.filter((s) => s.type === 'date').length
  let rang = 0
  const chapitres = video.scenes.flatMap((s, i) => {
    if (s.type === 'titre') return [{ from: starts[i], nom: `${s.numero} · ${s.titre}` }]
    if (!avecTitres && s.type === 'date') return [{ from: starts[i], nom: `${++rang} / ${nDates} · ${s.kicker}` }]
    return []
  })
  // La barre des chapitres s'efface sur les scènes plein écran (titres, fin) et sur fond sombre.
  const cacher = video.scenes.flatMap((s, i): Array<[number, number]> => (s.type === 'titre' || s.type === 'fin' || s.sombre ? [[starts[i] - 4, starts[i] + frames[i] - T + 4]] : []))
  return (
    <AbsoluteFill style={{ background: M.creme }}>
      <style>{polices}</style>
      <TransitionSeries>
        {video.scenes.flatMap((scene, i) => [
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames[i]}>
            <SceneYTView scene={scene} frames={frames[i]} words={voix.mots?.[i] ?? undefined} voiceAt={voiceAt(i)} />
          </TransitionSeries.Sequence>,
          ...(i < video.scenes.length - 1
            ? [<TransitionSeries.Transition key={`t${i}`} presentation={transitionFor(video.scenes[i + 1], i) as never} timing={linearTiming({ durationInFrames: T, easing: easeInOut })} />]
            : []),
        ])}
      </TransitionSeries>
      <Chapitres chapitres={chapitres} total={total} cacher={cacher} />
      {video.musique ? (
        <Audio src={staticFile(video.musique)} loop volume={(f) => interpolate(f, [0, 15, total - 30, total], [0, 0.14, 0.14, 0], clamp)} />
      ) : null}
      <FilmLook />
      {video.scenes.map((scene, i) => {
        const from = starts[i] + voiceAt(i)
        const words = scene.sousTitre ? estimateWords(scene.sousTitre, voix.durees[i]) : (voix.mots?.[i] ?? estimateWords(scene.voix, voix.durees[i]))
        const avecSousTitres = scene.type !== 'titre' && scene.type !== 'phrase' && scene.type !== 'fin'
        return (
          <Sequence key={i} from={from} durationInFrames={frames[i]}>
            <Audio src={staticFile(`voix/${video.id}/${String(i).padStart(2, '0')}.${voix.ext ?? 'mp3'}`)} />
            {avecSousTitres ? <SousTitres words={words} /> : null}
          </Sequence>
        )
      })}
      {starts.slice(1).map((s, i) => (
        <Sequence key={`w${i}`} from={s - 4} durationInFrames={28}>
          <Audio src={staticFile(i % 2 ? 'sfx/whoosh2.wav' : 'sfx/whoosh.wav')} volume={0.09} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
