import './index.css'
import { Composition } from 'remotion'
import { BailioMain }     from './compositions/BailioMain'
import { BailioVertical } from './compositions/BailioVertical'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* YouTube / LinkedIn — 16:9 — 62 secondes */}
      <Composition
        id="BailioMain"
        component={BailioMain}
        durationInFrames={1860}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* TikTok / Instagram Reels — 9:16 — 30 secondes */}
      <Composition
        id="BailioVertical"
        component={BailioVertical}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  )
}
