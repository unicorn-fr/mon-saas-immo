import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { B } from '../components/tokens'
import { Reveal, WordReveal, LineDraw } from '../components/Reveal'
import { BailioLogo } from '../components/BailioLogo'
import { FeatureScene } from '../components/FeatureScene'

// ─── Scene boundaries (frames at 30fps) ──────────────────────────────────────
const S = {
  intro:      0,    // 0–3s   : orbe + logo
  tagline:    90,   // 3–9s   : "La location réinventée"
  feat1:      270,  // 9–15s  : Publiez en 8 minutes
  feat2:      450,  // 15–21s : Candidatures en ligne
  feat3:      630,  // 21–27s : Bail signé électroniquement
  feat4:      810,  // 27–33s : Quittances automatiques
  split:      990,  // 33–39s : Pour tous
  zeroCom:    1170, // 39–46s : 0 € de frais d'agence
  available:  1380, // 46–56s : DISPONIBLE MAINTENANT
  outro:      1680, // 56–62s : bailio.fr
} as const

// ─── Dot particle (decorative) ───────────────────────────────────────────────
function Particle({ x, y, delay, size = 3 }: { x: number; y: number; delay: number; size?: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = interpolate(
    spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 40 } }),
    [0, 1], [0, 0.4]
  )
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: '50%',
        background: B.caramel,
        opacity,
      }}
    />
  )
}

// ─── Orb (ambient light) ─────────────────────────────────────────────────────
function Orb({ cx, cy, r, color, startFrame }: { cx: number; cy: number; r: number; color: string; startFrame: number }) {
  const frame = useCurrentFrame()
  const local = frame - startFrame
  const opacity = interpolate(local, [0, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = interpolate(local, [0, 60], [0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <div
      style={{
        position: 'absolute',
        left: cx - r,
        top: cy - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: 'blur(60px)',
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Scene: Intro ─────────────────────────────────────────────────────────────
function SceneIntro() {
  return (
    <AbsoluteFill style={{ background: B.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Orb cx={1400} cy={200} r={500} color="rgba(196,151,106,0.30)" startFrame={0} />
      <Orb cx={300} cy={900} r={380} color="rgba(196,151,106,0.12)" startFrame={10} />
      {/* Particles */}
      {[
        [260,180,5], [520,320,12], [1640,160,8], [1700,480,3], [800,80,15],
        [1200,900,6], [400,700,18], [1500,820,9], [960,200,20], [1100,600,2],
      ].map(([x, y, d], i) => (
        <Particle key={i} x={x as number} y={y as number} delay={d as number} size={2 + (i % 3)} />
      ))}
      <BailioLogo startFrame={20} size={96} />
    </AbsoluteFill>
  )
}

// ─── Scene: Tagline ──────────────────────────────────────────────────────────
function SceneTagline() {
  const frame = useCurrentFrame()
  const local = frame - S.tagline
  const bgOpacity = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        background: B.night,
        opacity: bgOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 160px',
      }}
    >
      <Orb cx={960} cy={200} r={600} color="rgba(196,151,106,0.18)" startFrame={S.tagline} />

      <Reveal startFrame={S.tagline + 8} direction="up" distance={16}>
        <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, marginBottom: 32, textAlign: 'center' }}>
          Bailio
        </p>
      </Reveal>

      <WordReveal
        text="La location immobilière réinventée."
        startFrame={S.tagline + 16}
        stagger={4}
        style={{ justifyContent: 'center', textAlign: 'center', maxWidth: 1200 }}
        wordStyle={{
          fontFamily: B.display,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 108,
          color: B.cream,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
        }}
      />

      <LineDraw startFrame={S.tagline + 56} color={`${B.caramel}80`} duration={30} width={200} height={2} />

      <Reveal startFrame={S.tagline + 70} direction="up" distance={20} style={{ marginTop: 36, textAlign: 'center' }}>
        <p style={{ fontFamily: B.body, fontSize: 24, color: 'rgba(250,250,248,0.55)', lineHeight: 1.6, maxWidth: 700, margin: 0 }}>
          Propriétaires et locataires, directement connectés. Sans intermédiaire.
        </p>
      </Reveal>
    </AbsoluteFill>
  )
}

// ─── Icons SVG ───────────────────────────────────────────────────────────────
const IconAnnonce = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={B.caramel} strokeWidth="1.5" strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <path d="M3 9h18M9 21V9"/>
  </svg>
)
const IconCandidature = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={B.caramel} strokeWidth="1.5" strokeLinecap="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconBail = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={B.caramel} strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconQuittance = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={B.caramel} strokeWidth="1.5" strokeLinecap="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
)

// ─── Scene: Split (pour tous) ────────────────────────────────────────────────
function SceneSplit() {
  const frame = useCurrentFrame()
  const local = frame - S.split
  const { fps } = useVideoConfig()

  const leftX = interpolate(
    spring({ frame: local, fps, config: { damping: 18, stiffness: 60 } }),
    [0, 1], [-400, 0]
  )
  const rightX = interpolate(
    spring({ frame: local, fps, config: { damping: 18, stiffness: 60 } }),
    [0, 1], [400, 0]
  )
  const opacity = interpolate(local, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: B.night, opacity, display: 'flex' }}>
      {/* Left — Propriétaire */}
      <div style={{
        flex: 1,
        borderRight: `1px solid rgba(196,151,106,0.2)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: `translateX(${leftX}px)`,
        padding: '0 80px',
      }}>
        <Reveal startFrame={S.split + 15} direction="up">
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1a3270', marginBottom: 20 }}>Propriétaire</p>
        </Reveal>
        <Reveal startFrame={S.split + 22} direction="up">
          <h2 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: B.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 24px' }}>
            Publiez, gérez, encaissez.
          </h2>
        </Reveal>
        <Reveal startFrame={S.split + 32} direction="up">
          <p style={{ fontFamily: B.body, fontSize: 20, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6 }}>
            Annonce, candidatures, bail, quittances. Tout en ligne.
          </p>
        </Reveal>
      </div>

      {/* Right — Locataire */}
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        transform: `translateX(${rightX}px)`,
        padding: '0 80px',
      }}>
        <Reveal startFrame={S.split + 15} direction="up">
          <p style={{ fontFamily: B.body, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#1b5e3b', marginBottom: 20 }}>Locataire</p>
        </Reveal>
        <Reveal startFrame={S.split + 22} direction="up">
          <h2 style={{ fontFamily: B.display, fontStyle: 'italic', fontWeight: 700, fontSize: 64, color: B.cream, lineHeight: 1.1, textAlign: 'center', margin: '0 0 24px' }}>
            Trouvez, postulez, emménagez.
          </h2>
        </Reveal>
        <Reveal startFrame={S.split + 32} direction="up">
          <p style={{ fontFamily: B.body, fontSize: 20, color: 'rgba(250,250,248,0.55)', textAlign: 'center', lineHeight: 1.6 }}>
            Des annonces de particuliers. Zéro frais d'agence.
          </p>
        </Reveal>
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene: 0€ de frais ───────────────────────────────────────────────────────
function SceneZeroFrais() {
  const frame = useCurrentFrame()
  const local = frame - S.zeroCom
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const bigScale = interpolate(
    spring({ frame: local - 10, fps, config: { damping: 22, stiffness: 50 } }),
    [0, 1], [0.6, 1]
  )
  const bigOpacity = interpolate(local - 10, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ background: '#f4f2ee', opacity: bgOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Orb cx={1700} cy={150} r={500} color="rgba(196,151,106,0.20)" startFrame={S.zeroCom} />

      <Reveal startFrame={S.zeroCom + 5} direction="up">
        <p style={{ fontFamily: B.body, fontSize: 14, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: B.caramel, marginBottom: 28 }}>La différence Bailio</p>
      </Reveal>

      <div style={{ opacity: bigOpacity, transform: `scale(${bigScale})` }}>
        <span style={{
          fontFamily: B.display,
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 220,
          color: B.night,
          lineHeight: 0.9,
          letterSpacing: '-0.04em',
          display: 'block',
          textAlign: 'center',
        }}>
          0 €
        </span>
      </div>

      <Reveal startFrame={S.zeroCom + 30} direction="up" distance={24} style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: B.body, fontSize: 26, color: B.inkMid, marginTop: 28, letterSpacing: '0.04em' }}>
          de frais d'agence — pour tout le monde.
        </p>
      </Reveal>

      <LineDraw startFrame={S.zeroCom + 44} color={`${B.caramel}90`} duration={28} width={160} height={2} />
    </AbsoluteFill>
  )
}

// ─── Scene: DISPONIBLE MAINTENANT ────────────────────────────────────────────
function SceneAvailable() {
  const frame = useCurrentFrame()
  const local = frame - S.available
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(local, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const lineProgress = spring({ frame: local - 5, fps, config: { damping: 25, stiffness: 35 } })
  const lineWidth = interpolate(lineProgress, [0, 1], [0, 1920])

  const textProgress = spring({ frame: local - 20, fps, config: { damping: 20, stiffness: 50 } })
  const textY = interpolate(textProgress, [0, 1], [80, 0])
  const textOpacity = interpolate(local - 20, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const subProgress = spring({ frame: local - 50, fps, config: { damping: 18, stiffness: 60 } })
  const subY = interpolate(subProgress, [0, 1], [40, 0])
  const subOpacity = interpolate(local - 50, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const pulseOpacity = interpolate(
    Math.sin((local * Math.PI) / 30),
    [-1, 1], [0.4, 1]
  )

  return (
    <AbsoluteFill style={{ background: B.night, opacity: bgOpacity }}>
      <Orb cx={960} cy={540} r={700} color="rgba(196,151,106,0.22)" startFrame={S.available} />

      {/* Top line */}
      <div style={{ position: 'absolute', top: 200, left: 0, height: 1, width: lineWidth, background: `rgba(196,151,106,0.5)` }} />

      {/* Main text */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)` }}>
          <span style={{
            fontFamily: B.display,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 160,
            color: B.cream,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            display: 'block',
            textAlign: 'center',
          }}>
            Disponible
          </span>
          <span style={{
            fontFamily: B.display,
            fontStyle: 'italic',
            fontWeight: 700,
            fontSize: 160,
            color: B.caramel,
            lineHeight: 0.92,
            letterSpacing: '-0.04em',
            display: 'block',
            textAlign: 'center',
          }}>
            maintenant.
          </span>
        </div>

        {/* Sub */}
        <div style={{ opacity: subOpacity, transform: `translateY(${subY}px)`, marginTop: 56 }}>
          <p style={{
            fontFamily: B.body,
            fontSize: 24,
            color: 'rgba(250,250,248,0.55)',
            textAlign: 'center',
            letterSpacing: '0.02em',
          }}>
            Créez votre compte gratuitement sur
          </p>
          <p style={{
            fontFamily: B.display,
            fontStyle: 'italic',
            fontSize: 38,
            color: B.caramel,
            textAlign: 'center',
            opacity: pulseOpacity,
            marginTop: 8,
          }}>
            bailio.fr
          </p>
        </div>
      </div>

      {/* Bottom line */}
      <div style={{ position: 'absolute', bottom: 200, left: 0, height: 1, width: lineWidth, background: `rgba(196,151,106,0.5)` }} />
    </AbsoluteFill>
  )
}

// ─── Scene: Outro ────────────────────────────────────────────────────────────
function SceneOutro() {
  const frame = useCurrentFrame()
  const local = frame - S.outro
  const { fps } = useVideoConfig()

  const bgOpacity = interpolate(local, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const pulseOpacity = interpolate(
    Math.sin((local * Math.PI) / 40),
    [-1, 1], [0.6, 1]
  )

  const urlProgress = spring({ frame: local - 30, fps, config: { damping: 16, stiffness: 50 } })
  const urlScale = interpolate(urlProgress, [0, 1], [0.85, 1])
  const urlOpacity = interpolate(local - 30, [0, 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{
      background: B.night,
      opacity: bgOpacity,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0,
    }}>
      <Orb cx={960} cy={540} r={600} color="rgba(196,151,106,0.25)" startFrame={S.outro} />

      <BailioLogo startFrame={S.outro + 8} size={120} />

      <div style={{ opacity: urlOpacity, transform: `scale(${urlScale})`, marginTop: 40 }}>
        <p style={{
          fontFamily: B.body,
          fontSize: 22,
          fontWeight: 500,
          color: 'rgba(250,250,248,0.45)',
          letterSpacing: '0.12em',
          textAlign: 'center',
        }}>
          bailio.fr
        </p>
      </div>

      {/* Tagline fade */}
      <Reveal startFrame={S.outro + 50} direction="up" distance={12} style={{ marginTop: 40 }}>
        <p style={{
          fontFamily: B.body,
          fontSize: 16,
          color: 'rgba(250,250,248,0.30)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          textAlign: 'center',
          opacity: pulseOpacity,
        }}>
          Location entre particuliers, simplement.
        </p>
      </Reveal>
    </AbsoluteFill>
  )
}

// ─── Transition overlay ───────────────────────────────────────────────────────
function SceneTransition({ at, duration = 18 }: { at: number; duration?: number }) {
  const frame = useCurrentFrame()
  const local = frame - at
  const opacity = interpolate(
    local,
    [0, duration * 0.35, duration * 0.65, duration],
    [0, 0.9, 0.9, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )
  return (
    <AbsoluteFill style={{ background: B.night, opacity, pointerEvents: 'none' }} />
  )
}

// ─── Main composition ─────────────────────────────────────────────────────────
export function BailioMain() {
  const frame = useCurrentFrame()

  const showIntro    = frame < S.tagline + 10
  const showTagline  = frame >= S.tagline - 4 && frame < S.feat1 + 10
  const showFeat1    = frame >= S.feat1 - 4 && frame < S.feat2 + 10
  const showFeat2    = frame >= S.feat2 - 4 && frame < S.feat3 + 10
  const showFeat3    = frame >= S.feat3 - 4 && frame < S.feat4 + 10
  const showFeat4    = frame >= S.feat4 - 4 && frame < S.split + 10
  const showSplit    = frame >= S.split - 4 && frame < S.zeroCom + 10
  const showZero     = frame >= S.zeroCom - 4 && frame < S.available + 10
  const showAvail    = frame >= S.available - 4 && frame < S.outro + 10
  const showOutro    = frame >= S.outro - 4

  return (
    <AbsoluteFill style={{ background: B.night, fontFamily: B.body }}>
      {showIntro    && <SceneIntro />}
      {showTagline  && <SceneTagline />}
      {showFeat1    && (
        <FeatureScene
          startFrame={S.feat1}
          tag="Annonce"
          headline="Publiez en 8 minutes."
          sub="Photos, description, loyer — votre bien est en ligne immédiatement."
          icon={<IconAnnonce />}
        />
      )}
      {showFeat2    && (
        <FeatureScene
          startFrame={S.feat2}
          tag="Candidatures"
          headline="Choisissez votre locataire."
          sub="Recevez les dossiers, comparez les profils, répondez en un clic."
          icon={<IconCandidature />}
        />
      )}
      {showFeat3    && (
        <FeatureScene
          startFrame={S.feat3}
          tag="Bail électronique"
          headline="Signez en ligne, c'est légal."
          sub="Signature eIDAS certifiée. Votre contrat a la même valeur qu'un acte notarié."
          lightBg
          icon={<IconBail />}
        />
      )}
      {showFeat4    && (
        <FeatureScene
          startFrame={S.feat4}
          tag="Quittances"
          headline="Automatiques chaque mois."
          sub="Bailio génère et envoie vos quittances de loyer sans que vous n'ayez rien à faire."
          lightBg
          icon={<IconQuittance />}
        />
      )}
      {showSplit    && <SceneSplit />}
      {showZero     && <SceneZeroFrais />}
      {showAvail    && <SceneAvailable />}
      {showOutro    && <SceneOutro />}

      {/* Smooth transitions between scenes */}
      <SceneTransition at={S.tagline - 8} />
      <SceneTransition at={S.feat1 - 8} />
      <SceneTransition at={S.feat2 - 8} />
      <SceneTransition at={S.feat3 - 8} />
      <SceneTransition at={S.feat4 - 8} />
      <SceneTransition at={S.split - 8} />
      <SceneTransition at={S.zeroCom - 8} />
      <SceneTransition at={S.available - 8} />
      <SceneTransition at={S.outro - 8} />
    </AbsoluteFill>
  )
}
