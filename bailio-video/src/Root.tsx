import './index.css'
import { Composition } from 'remotion'
import { BailioMain }     from './compositions/BailioMain'
import { BailioVertical } from './compositions/BailioVertical'
import { BailioShowcase } from './compositions/BailioShowcase'
import { Wrap4K }         from './components/Wrap4K'

/* ── 4K wrappers ─────────────────────────────────────────────────────────── */
const BailioMain4K     = () => <Wrap4K><BailioMain /></Wrap4K>
const BailioShowcase4K = () => <Wrap4K><BailioShowcase /></Wrap4K>

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── 4K (3840×2160) ─────────────────────────────────────────────── */}
      <Composition
        id="BailioMain4K"
        component={BailioMain4K}
        durationInFrames={1860}
        fps={30}
        width={3840}
        height={2160}
      />
      <Composition
        id="BailioShowcase4K"
        component={BailioShowcase4K}
        durationInFrames={1860}
        fps={30}
        width={3840}
        height={2160}
      />

      {/* ── 1080p originals (preview rapide) ────────────────────────────── */}
      <Composition id="BailioMain"     component={BailioMain}     durationInFrames={1860} fps={30} width={1920} height={1080} />
      <Composition id="BailioShowcase" component={BailioShowcase} durationInFrames={1860} fps={30} width={1920} height={1080} />

      {/* ── Vertical — 1080×1920 (TikTok/IG plafond plateforme) ─────────── */}
      <Composition id="BailioVertical" component={BailioVertical} durationInFrames={900}  fps={30} width={1080} height={1920} />
    </>
  )
}
