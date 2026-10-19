import { Composition, Still } from 'remotion'
import { ALaUne, Banniere, Bienvenue, Charte, Profil, STORIES, Story } from './marque/Marque'

/** Stories à la une, dans l'ordre conseillé sur Instagram. */
const A_LA_UNE = [
  ['1-a-propos', 'a-propos'],
  ['2-le-bail', 'le-bail'],
  ['3-signature', 'signature'],
  ['4-quittances', 'quittances'],
  ['5-etat-des-lieux', 'etat-des-lieux'],
  ['6-guide', 'guide'],
  ['7-faq', 'faq'],
  ['8-actu', 'actu'],
  ['9-avis', 'avis'],
] as const
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
import { Miniature } from './yt/Miniature'
import { BailioYT, totalYT, YT_H, YT_W, type VideoYTDef } from './yt/VideoYT'
import ytPresentation from './videos/yt-presentation.json'
import ytPresentationVoix from './videos/yt-presentation.voix.json'
import ytVideMeuble from './videos/yt-vide-meuble.json'
import ytVideMeubleVoix from './videos/yt-vide-meuble.voix.json'
import ytCalendrier from './videos/yt-calendrier.json'
import ytCalendrierVoix from './videos/yt-calendrier.voix.json'

/** Chaque vidéo : son script (src/videos/<id>.json) et la durée de ses phrases (voix.mjs). */
const VIDEOS: Array<{ video: VideoDef; voix: Voix }> = [
  { video: presentation as VideoDef, voix: presentationVoix as Voix },
  { video: erreurs as VideoDef, voix: erreursVoix as Voix },
  { video: revision as VideoDef, voix: revisionVoix as Voix },
  { video: impaye as VideoDef, voix: impayeVoix as Voix },
]

/** Vidéos YouTube, en 16:9 (src/yt). */
const VIDEOS_YT: Array<{ video: VideoYTDef; voix: Voix }> = [
  { video: ytPresentation as VideoYTDef, voix: ytPresentationVoix as Voix },
  { video: ytVideMeuble as VideoYTDef, voix: ytVideMeubleVoix as Voix },
  { video: ytCalendrier as VideoYTDef, voix: ytCalendrierVoix as Voix },
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
      {VIDEOS_YT.map(({ video, voix }) => (
        <Composition key={video.id} id={video.id} component={BailioYT} durationInFrames={totalYT(voix.durees)} fps={FPS} width={YT_W} height={YT_H} defaultProps={{ video, voix }} />
      ))}
      <Still id="miniature-yt-presentation" component={() => <Miniature kicker="Propriétaires" ligne1="Votre bail," accent="sans stress." visuel="telephone" />} width={1280} height={720} />
      <Still id="miniature-yt-vide-meuble" component={() => <Miniature kicker="Le match" ligne1="Vide ou" accent="meublé ?" visuel="match" />} width={1280} height={720} />
      <Still id="miniature-yt-calendrier" component={() => <Miniature kicker="Propriétaires" ligne1="Les dates" accent="à ne pas rater" visuel="calendrier" />} width={1280} height={720} />
      {/* Kit des réseaux sociaux (scripts/marque.mjs → marque/). */}
      <Still id="profil" component={Profil} width={1080} height={1080} />
      <Still id="profil-sombre" component={() => <Profil clair={false} />} width={1080} height={1080} />
      <Still id="banniere-facebook" component={() => <Banniere width={1640} height={624} zone={{ left: 274, right: 274, top: 50, bottom: 70 }} />} width={1640} height={624} />
      <Still id="banniere-linkedin-page" component={() => <Banniere width={1128} height={191} zone={{ left: 230, right: 40, top: 26, bottom: 26 }} rue={false} />} width={1128} height={191} />
      <Still id="banniere-linkedin-profil" component={() => <Banniere width={1584} height={396} zone={{ left: 440, right: 60, top: 40, bottom: 40 }} />} width={1584} height={396} />
      <Still id="banniere-x" component={() => <Banniere width={1500} height={500} zone={{ left: 360, right: 60, top: 50, bottom: 60 }} />} width={1500} height={500} />
      <Still id="banniere-youtube" component={() => <Banniere width={2560} height={1440} zone={{ left: 507, right: 507, top: 508, bottom: 509 }} />} width={2560} height={1440} />
      {A_LA_UNE.map(([id, icone]) => <Still key={id} id={`a-la-une-${id}`} component={() => <ALaUne icone={icone} />} width={1080} height={1920} />)}
      {Object.entries(STORIES).map(([id, s]) => <Still key={id} id={`story-${id}`} component={() => <Story s={s} />} width={1080} height={1920} />)}
      <Still id="post-bienvenue" component={Bienvenue} width={1080} height={1350} />
      <Still id="charte" component={Charte} width={2400} height={1500} />
    </>
  )
}
