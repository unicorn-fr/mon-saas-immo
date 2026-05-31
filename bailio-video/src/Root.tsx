import './index.css'
import { Composition } from 'remotion'
import { BailioMain }     from './compositions/BailioMain'
import { BailioVertical } from './compositions/BailioVertical'
import { BailioShowcase } from './compositions/BailioShowcase'

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* YouTube / LinkedIn branding — 16:9 — 62s */}
      <Composition id="BailioMain"     component={BailioMain}     durationInFrames={1860} fps={30} width={1920} height={1080} />
      {/* TikTok / Instagram Reels — 9:16 — 30s */}
      <Composition id="BailioVertical" component={BailioVertical} durationInFrames={900}  fps={30} width={1080} height={1920} />
      {/* Showcase 3D UI + voix off — 16:9 — 62s */}
      <Composition id="BailioShowcase" component={BailioShowcase} durationInFrames={1860} fps={30} width={1920} height={1080} />
    </>
  )
}
