import { Composition } from 'remotion'
import { FPS, H, W } from './theme'
import { BailioVideo, totalFrames, type VideoDef, type Voix } from './Video'
import presentation from './videos/presentation.json'
import presentationVoix from './videos/presentation.voix.json'
import erreurs from './videos/erreurs.json'
import erreursVoix from './videos/erreurs.voix.json'
import revision from './videos/revision.json'
import revisionVoix from './videos/revision.voix.json'
import impaye from './videos/impaye.json'
import impayeVoix from './videos/impaye.voix.json'

/** Chaque vidéo : son script (src/videos/<id>.json) et la durée de ses phrases (voix.mjs). */
const VIDEOS: Array<{ video: VideoDef; voix: Voix }> = [
  { video: presentation as VideoDef, voix: presentationVoix as Voix },
  { video: erreurs as VideoDef, voix: erreursVoix as Voix },
  { video: revision as VideoDef, voix: revisionVoix as Voix },
  { video: impaye as VideoDef, voix: impayeVoix as Voix },
]

export function Root() {
  return (
    <>
      {VIDEOS.map(({ video, voix }) => (
        <Composition
          key={video.id}
          id={video.id}
          component={BailioVideo}
          durationInFrames={totalFrames(voix.durees)}
          fps={FPS}
          width={W}
          height={H}
          defaultProps={{ video, voix }}
        />
      ))}
    </>
  )
}
