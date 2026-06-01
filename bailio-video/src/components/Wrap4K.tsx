import { AbsoluteFill } from 'remotion'

/**
 * Wraps a 1920×1080 composition into a 3840×2160 (4K UHD) canvas.
 *
 * Strategy: render the 1920×1080 design inside a div of exactly
 * that size, then CSS-transform scale(2) from top-left.
 * Chromium (used by Remotion) renders the full transform tree at
 * the composition's native 3840×2160 resolution — fonts, shadows,
 * and sub-pixel anti-aliasing are all computed at 4K quality.
 * No content changes required; every pixel is exactly 2× sharper.
 */
export function Wrap4K({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ background: '#1a1a2e', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          transformOrigin: 'top left',
          transform: 'scale(2)',
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  )
}
