import { linearTiming, TransitionSeries } from '@remotion/transitions'
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile } from 'remotion'
import { Captions, estimateWords, type Word } from './captions'
import { FilmLook, easeInOut } from './fx'
import { Guide } from './guide'
import { guideStop, SceneView, type Scene } from './scenes/Scenes'
import { C, FPS, fontFaces } from './theme'
import { circleReveal, whip, zoomThrough } from './transitions'

export interface VideoDef {
  id: string
  titre: string
  legende: string
  /** Nappe musicale en boucle (public/musique/…), discrète sous la voix. */
  musique?: string
  scenes: Scene[]
}

export interface Voix {
  /** Durée de chaque phrase, en secondes. */
  durees: number[]
  /** Mots de chaque phrase avec leur instant (horodatage ElevenLabs, ou estimation). */
  mots?: Word[][]
  /** Extension des fichiers audio (wav pour Piper, mp3 pour ElevenLabs). */
  ext?: string
}

/** Durée d'une transition, en images : courte, c'est ce qui donne le rythme. */
export const T = 12
/** Marge après chaque phrase. */
const PAD = 0.25

export const sceneFrames = (durees: number[]) => durees.map((d) => Math.max(36, Math.ceil((d + PAD) * FPS) + T))
export const totalFrames = (durees: number[]) => sceneFrames(durees).reduce((a, b) => a + b, 0) - T * (durees.length - 1)

/** Transitions variées, choisies selon la scène qui arrive. */
function transitionFor(next: Scene, i: number) {
  if (next.type === 'logo' || next.type === 'fin') return zoomThrough()
  if (next.type === 'ecran' && next.tap && !next.notifs) return circleReveal(next.tap[0], 40 + next.tap[1] * 0.5)
  return whip(i % 2 ? 'gauche' : 'droite')
}

/** Une vidéo verticale : scènes enchaînées par des transitions de monteur, voix off, bruitages, sous-titres, grain. */
export function BailioVideo({ video, voix }: { video: VideoDef; voix: Voix }) {
  const frames = sceneFrames(voix.durees)
  const starts = frames.map((_, i) => frames.slice(0, i).reduce((a, b) => a + b, 0) - i * T)
  const stops = video.scenes.map((s, i) => guideStop(s, frames[i]))
  const total = totalFrames(voix.durees)
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <style>{fontFaces}</style>
      <TransitionSeries>
        {video.scenes.flatMap((scene, i) => [
          <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames[i]}>
            <SceneView scene={scene} frames={frames[i]} words={voix.mots?.[i] ?? undefined} voiceAt={i ? Math.round(T * 0.6) : 4} />
          </TransitionSeries.Sequence>,
          ...(i < video.scenes.length - 1
            ? [<TransitionSeries.Transition key={`t${i}`} presentation={transitionFor(video.scenes[i + 1], i) as never} timing={linearTiming({ durationInFrames: T, easing: easeInOut })} />]
            : []),
        ])}
      </TransitionSeries>
      <Guide stops={stops} starts={starts} T={T} />
      {video.musique ? (
        <Audio src={staticFile(video.musique)} loop volume={(f) => interpolate(f, [0, 12, total - 24, total], [0, 0.08, 0.08, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      ) : null}
      <FilmLook />
      {video.scenes.map((scene, i) => {
        // La voix démarre quand la scène est installée (après la transition d'entrée).
        const from = starts[i] + (i ? Math.round(T * 0.6) : 4)
        // Sous-titres : le texte écrit (sousTitre) s'il diffère de ce que dit la voix, sinon les mots horodatés.
        const words = scene.sousTitre ? estimateWords(scene.sousTitre, voix.durees[i]) : (voix.mots?.[i] ?? estimateWords(scene.voix, voix.durees[i]))
        return (
          <Sequence key={i} from={from} durationInFrames={frames[i]}>
            <Audio src={staticFile(`voix/${video.id}/${String(i).padStart(2, '0')}.${voix.ext ?? 'wav'}`)} />
            {/* Sous-titres seulement quand l'écran ne montre pas déjà la phrase en grand. */}
            {scene.type === 'ecran' || scene.type === 'liste' ? <Captions words={words} /> : null}
          </Sequence>
        )
      })}
      {/* Un souffle par transition (deux variantes en alternance), un clic quand la flèche touche. */}
      {starts.slice(1).map((s, i) => (
        <Sequence key={`w${i}`} from={s - 4} durationInFrames={28}>
          <Audio src={staticFile(i % 2 ? 'sfx/whoosh2.wav' : 'sfx/whoosh.wav')} volume={0.18} />
        </Sequence>
      ))}
      {stops.map((st, i) =>
        st.click !== undefined ? (
          <Sequence key={`c${i}`} from={starts[i] + st.click} durationInFrames={10}>
            <Audio src={staticFile('sfx/click.wav')} volume={0.3} />
          </Sequence>
        ) : null,
      )}
    </AbsoluteFill>
  )
}
