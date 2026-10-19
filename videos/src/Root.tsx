import { Composition, Still } from 'remotion'
import { ALaUne, Banniere, Bienvenue, Profil } from './marque/Marque'
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
      {/* Kit des réseaux sociaux (scripts/marque.mjs → marque/). */}
      <Still id="profil" component={Profil} width={1080} height={1080} />
      <Still id="profil-clair" component={() => <Profil clair />} width={1080} height={1080} />
      <Still id="banniere-facebook" component={() => <Banniere width={1640} height={624} zone={{ left: 274, right: 274, top: 50, bottom: 70 }} telephones={1} />} width={1640} height={624} />
      <Still id="banniere-linkedin-page" component={() => <Banniere width={1128} height={191} zone={{ left: 230, right: 40, top: 22, bottom: 22 }} points={0} telephones={0} />} width={1128} height={191} />
      <Still id="banniere-linkedin-profil" component={() => <Banniere width={1584} height={396} zone={{ left: 440, right: 60, top: 40, bottom: 40 }} telephones={1} />} width={1584} height={396} />
      <Still id="banniere-x" component={() => <Banniere width={1500} height={500} zone={{ left: 360, right: 60, top: 50, bottom: 60 }} telephones={1} />} width={1500} height={500} />
      <Still id="banniere-youtube" component={() => <Banniere width={2560} height={1440} zone={{ left: 507, right: 507, top: 508, bottom: 509 }} telephones={2} />} width={2560} height={1440} />
      <Still id="a-la-une-bail" component={() => <ALaUne icone="bail" titre="Le bail" />} width={1080} height={1920} />
      <Still id="a-la-une-quittances" component={() => <ALaUne icone="quittances" titre="Quittances" />} width={1080} height={1920} />
      <Still id="a-la-une-conseils" component={() => <ALaUne icone="conseils" titre="Conseils" />} width={1080} height={1920} />
      <Still id="a-la-une-tutos" component={() => <ALaUne icone="tutos" titre="Tutos" />} width={1080} height={1920} />
      <Still id="a-la-une-avis" component={() => <ALaUne icone="avis" titre="Avis" />} width={1080} height={1920} />
      <Still id="post-bienvenue" component={Bienvenue} width={1080} height={1350} />
    </>
  )
}
