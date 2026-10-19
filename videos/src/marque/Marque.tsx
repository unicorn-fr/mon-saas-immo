import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, staticFile } from 'remotion'
import { glass, label, title } from '../fx'
import { C, fontFaces, sans, serif } from '../theme'

/**
 * Kit des réseaux sociaux : photo de profil, bannières aux dimensions de chaque réseau, couvertures de
 * « stories à la une », post de bienvenue. Images fixes rendues par scripts/marque.mjs dans marque/.
 */

const Fond = ({ dark = true, children }: { dark?: boolean; children: ReactNode }) => (
  <AbsoluteFill style={{ background: dark ? `linear-gradient(160deg, ${C.night} 0%, ${C.nightSoft} 120%)` : C.bg, overflow: 'hidden' }}>
    <style>{fontFaces}</style>
    <div style={{ position: 'absolute', width: '90%', aspectRatio: '1', left: '-20%', top: '-35%', borderRadius: '50%', background: `radial-gradient(circle, ${C.caramel} 0%, transparent 62%)`, opacity: dark ? 0.28 : 0.22 }} />
    <div style={{ position: 'absolute', width: '90%', aspectRatio: '1', right: '-25%', bottom: '-45%', borderRadius: '50%', background: `radial-gradient(circle, ${dark ? C.owner : C.ownerLight} 0%, transparent 62%)`, opacity: dark ? 0.6 : 1 }} />
    {children}
  </AbsoluteFill>
)

/** Le « B » du logo (favicon du site), en grand. */
const Monogramme = ({ size, color = C.caramel }: { size: number; color?: string }) => (
  <span style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 700, fontSize: size, lineHeight: 1, color, transform: 'translateY(-4%)', display: 'inline-block' }}>B</span>
)

const Wordmark = ({ size, color = C.caramel }: { size: number; color?: string }) => <span style={{ ...title(size, color), letterSpacing: -size * 0.02 }}>Bailio</span>

/** Photo de profil : le « B » centré, lisible même en tout petit et dans un cercle. */
export function Profil({ clair = false }: { clair?: boolean }) {
  return (
    <Fond dark={!clair}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Monogramme size={760} color={clair ? C.night : C.caramel} />
      </AbsoluteFill>
    </Fond>
  )
}

const Puce = ({ children, dark = true }: { children: ReactNode; dark?: boolean }) => (
  <span style={{ ...glass(dark), borderRadius: 999, padding: '0.45em 1em', ...label(1, dark ? C.surface : C.ink, 600), fontSize: '1em', whiteSpace: 'nowrap' }}>{children}</span>
)

const Telephone = ({ src, h, style }: { src: string; h: number; style?: CSSProperties }) => (
  <div style={{ height: h, width: h * 0.5, borderRadius: h * 0.07, background: 'linear-gradient(150deg, #2a2a40 0%, #0e0e1a 60%)', padding: h * 0.016, boxShadow: `0 ${h * 0.05}px ${h * 0.1}px rgba(0,0,0,0.45)`, ...style }}>
    <div style={{ width: '100%', height: '100%', borderRadius: h * 0.055, overflow: 'hidden', background: C.bg }}>
      <Img src={staticFile(src)} style={{ width: '100%' }} />
    </div>
  </div>
)

const POINTS = ['Bail conforme à la loi', 'Signature en ligne', 'Quittances automatiques', 'Rappels des échéances']

/**
 * Bannière : nom, promesse, points forts et adresse du site, avec un ou deux téléphones.
 * zone : partie de l'image toujours visible (les réseaux recadrent ou posent la photo de profil par-dessus).
 */
export function Banniere({ width, height, zone, points = 3, telephones = 2 }: { width: number; height: number; zone: { left: number; right: number; top: number; bottom: number }; points?: number; telephones?: number }) {
  const h = height - zone.top - zone.bottom
  const w = width - zone.left - zone.right
  const base = Math.min(h / 7.5, w / 26)
  return (
    <Fond>
      <div style={{ position: 'absolute', left: zone.left, right: zone.right, top: zone.top, bottom: zone.bottom, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: base * 1.5 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: base * 0.45, fontSize: base * 0.62 }}>
          <Wordmark size={base * 2.6} />
          <div style={{ ...title(base * 1.05, C.surface), letterSpacing: -1 }}>Le bail et le suivi de votre location</div>
          {points > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: base * 0.3, marginTop: base * 0.2 }}>
              {POINTS.slice(0, points).map((p) => <Puce key={p}>{p}</Puce>)}
            </div>
          ) : null}
          <div style={{ ...label(base * 0.7, C.caramel), marginTop: base * 0.15 }}>bailio.fr · gratuit pour créer votre bail</div>
        </div>
        {telephones > 0 ? (
          <div style={{ position: 'relative', height: h * 1.25, alignSelf: 'flex-start', marginTop: h * 0.08, display: 'flex', gap: h * 0.08, flexShrink: 0 }}>
            <Telephone src="ecrans/aujourdhui.png" h={h * 1.1} style={{ transform: 'rotate(-6deg)' }} />
            {telephones > 1 ? <Telephone src="ecrans/bail.png" h={h * 1.1} style={{ transform: 'rotate(5deg) translateY(8%)' }} /> : null}
          </div>
        ) : null}
      </div>
    </Fond>
  )
}

/** Icônes des couvertures « à la une » : traits simples, couleur caramel. */
const ICONES: Record<string, ReactNode> = {
  bail: <path d="M30 14h30l14 14v58H30zM60 14v14h14M40 46h24M40 58h24M40 70h14" />,
  quittances: <path d="M28 14h44v72l-8-6-7 6-7-6-7 6-7-6-8 6zM40 34h20M40 46h20M40 58h12" />,
  conseils: <path d="M50 14a24 24 0 0 0-14 43c3 3 4 6 4 10h20c0-4 1-7 4-10a24 24 0 0 0-14-43zM40 76h20M43 86h14" />,
  tutos: <path d="M22 22h56v44H22zM44 34l16 10-16 10zM36 78h28" />,
  avis: <path d="M50 16l10 21 23 3-17 16 4 23-20-11-20 11 4-23-17-16 23-3z" />,
}

export function ALaUne({ icone }: { icone: keyof typeof ICONES; titre?: string }) {
  return (
    <Fond>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60 }}>
        {/* Instagram ne garde que le cercle central : l'icône seule, le titre se saisit dans l'application. */}
        <div style={{ ...glass(true), width: 760, height: 760, borderRadius: 380, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={440} height={440} viewBox="0 0 100 100" fill="none" stroke={C.caramel} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
            {ICONES[icone]}
          </svg>
        </div>
      </AbsoluteFill>
    </Fond>
  )
}

/** Post de bienvenue (4:5) : épingler en premier sur Instagram, Facebook et LinkedIn. */
export function Bienvenue() {
  return (
    <Fond>
      <AbsoluteFill style={{ padding: '110px 90px', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <div style={{ ...label(40, C.caramel), letterSpacing: 3, textTransform: 'uppercase' }}>Bienvenue chez</div>
          <Wordmark size={210} />
          <div style={{ ...title(92, C.surface), maxWidth: 820 }}>Le bail et le suivi de votre location, sans prise de tête.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {['Un bail conforme à la loi en quelques minutes', 'Signature en ligne, sans papier', 'Quittances envoyées toutes seules', 'Une astuce de propriétaire chaque semaine'].map((p) => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 26, ...label(44, C.surface, 500) }}>
              <span style={{ width: 52, height: 52, borderRadius: 26, background: C.caramel, display: 'flex', alignItems: 'center', justifyContent: 'center', ...label(30, C.night) }}>✓</span>
              {p}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: C.owner, borderRadius: 999, padding: '26px 54px', ...label(56, C.surface), fontFamily: sans }}>bailio.fr</span>
          <span style={{ ...label(34, C.onDark, 500) }}>Gratuit pour créer votre bail</span>
        </div>
      </AbsoluteFill>
    </Fond>
  )
}
