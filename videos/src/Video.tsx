import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { C, FPS, fontFaces } from './theme'
import { Captions, Reveal, Wipe } from './scenes/kit'
import { SceneView, isDark, type Scene } from './scenes/Scenes'

export interface VideoDef {
  id: string
  titre: string
  legende: string
  scenes: Scene[]
}

/** Marge après chaque phrase : le temps de lire avant la scène suivante. */
const PAD = 0.35

export const sceneFrames = (durees: number[]) => durees.map((d) => Math.max(40, Math.ceil((d + PAD) * FPS)))

/** Une vidéo verticale : chaque scène dure le temps de sa phrase de voix off, avec volet de transition et sous-titres. */
export function BailioVideo({ video, durees }: { video: VideoDef; durees: number[] }) {
  const frames = sceneFrames(durees)
  let from = 0
  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <style>{fontFaces}</style>
      {video.scenes.map((scene, i) => {
        const start = from
        from += frames[i]
        return (
          <Sequence key={i} from={start} durationInFrames={frames[i]}>
            <SceneView scene={scene} frames={frames[i]} />
            <Captions text={scene.sousTitre ?? scene.voix} frames={Math.ceil(durees[i] * FPS)} dark={isDark(scene)} />
            {i > 0 ? <Reveal /> : null}
            {i < video.scenes.length - 1 ? <Wipe frames={frames[i]} /> : null}
            <Audio src={staticFile(`voix/${video.id}/${String(i).padStart(2, '0')}.wav`)} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
