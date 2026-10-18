import { Composition } from 'remotion'
import { FPS, H, W } from './theme'
import { BailioVideo, sceneFrames, type VideoDef } from './Video'
import presentation from './videos/presentation.json'
import presentationVoix from './videos/presentation.voix.json'

/** Chaque vidéo : son script (src/videos/<id>.json) et la durée de ses phrases (voix.mjs). */
const VIDEOS: Array<{ video: VideoDef; durees: number[] }> = [{ video: presentation as VideoDef, durees: presentationVoix.durees }]

export function Root() {
  return (
    <>
      {VIDEOS.map(({ video, durees }) => (
        <Composition
          key={video.id}
          id={video.id}
          component={BailioVideo}
          durationInFrames={sceneFrames(durees).reduce((a, b) => a + b, 0)}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{ video, durees }}
        />
      ))}
    </>
  )
}
