import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, Img, staticFile } from 'remotion'
import icones from './icones.json'
import logo from './logo.json'

/**
 * Identité de Bailio pour les réseaux sociaux (charte : marque/CHARTE.md).
 * Clair et net : fond crème ou blanc, bleu Bailio, le « toit » caramel comme signature,
 * titres en Outfit, texte en DM Sans, icônes Lucide au trait. Rendu par scripts/marque.mjs dans marque/.
 */

export const M = {
  bleu: '#1a3270',
  encre: '#1a1a2e',
  gris: '#45455a',
  caramel: '#c4976a',
  caramelFonce: '#8a5f36',
  creme: '#faf7f2',
  blanc: '#ffffff',
  bleuClair: '#eef1f8',
  ligne: '#e4dfd6',
}

const polices = `
@font-face { font-family: 'Outfit'; font-weight: 700; src: url('${staticFile('fonts/outfit-700.ttf')}') format('truetype'); }
@font-face { font-family: 'Outfit'; font-weight: 400; src: url('${staticFile('fonts/outfit-400.ttf')}') format('truetype'); }
@font-face { font-family: 'DM Sans'; font-weight: 400; src: url('${staticFile('fonts/dm-sans-latin-400-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 500; src: url('${staticFile('fonts/dm-sans-latin-500-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 700; src: url('${staticFile('fonts/dm-sans-latin-700-normal.woff2')}') format('woff2'); }
`

export const titre = (size: number, color: string = M.encre): CSSProperties => ({ fontFamily: 'Outfit', fontWeight: 700, fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.025, color })
export const texte = (size: number, color: string = M.gris, weight = 400): CSSProperties => ({ fontFamily: 'DM Sans', fontWeight: weight, fontSize: size, lineHeight: 1.35, color })

/** Le toit : chevron caramel, la signature graphique de la marque. */
export const Toit = ({ w, color = M.caramel, t, style }: { w: number; color?: string; t?: number; style?: CSSProperties }) => {
  const h = w * 0.42
  const s = t ?? w * 0.14
  return (
    <svg width={w + s} height={h + s * 1.6} viewBox={`${-s / 2} ${-s} ${w + s} ${h + s * 1.6}`} style={{ display: 'block', overflow: 'visible', ...style }}>
      <path d={`M0 ${h} L${w / 2} 0 L${w} ${h}`} fill="none" stroke={color} strokeWidth={s} strokeLinejoin="miter" strokeMiterlimit={10} />
    </svg>
  )
}

/** Monogramme : le « b » maison (toit caramel, fût en cheminée). plein : sans arrondi (photo de profil). */
export const Monogramme = ({ size, fond = M.bleu, lettre = M.blanc, accent = M.caramel, arrondi = 0.22 }: { size: number; fond?: string | null; lettre?: string; accent?: string; arrondi?: number }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" style={{ display: 'block' }}>
    {fond ? <rect width={512} height={512} rx={512 * arrondi} fill={fond} /> : null}
    <path d={logo.monogramme.toit} fill="none" stroke={accent} strokeWidth={logo.monogramme.trait} strokeLinejoin="miter" strokeMiterlimit={10} />
    <path d={logo.monogramme.lettre} fill={lettre} />
  </svg>
)

/** Logotype « bailio », points des i en toits. */
export const Logotype = ({ height, color = M.bleu, accent = M.caramel }: { height: number; color?: string; accent?: string }) => {
  const [x, y, w, h] = logo.logotype.viewBox
  return (
    <svg height={height} width={(height * w) / h} viewBox={`${x} ${y} ${w} ${h}`} style={{ display: 'block' }}>
      <path d={logo.logotype.lettres} fill={color} />
      {logo.logotype.toits.map((d, i) => <path key={i} d={d} fill="none" stroke={accent} strokeWidth={logo.logotype.trait} strokeLinejoin="miter" strokeMiterlimit={10} />)}
    </svg>
  )
}

/** Logo horizontal : monogramme + logotype. */
export const Logo = ({ height, sombre = false }: { height: number; sombre?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: height * 0.24 }}>
    <Monogramme size={height} fond={sombre ? M.blanc : M.bleu} lettre={sombre ? M.bleu : M.blanc} />
    <Logotype height={height * 0.86} color={sombre ? M.blanc : M.bleu} />
  </div>
)

/** Icône Lucide (trait arrondi). */
export const Icone = ({ nom, size, color = M.blanc, trait = 1.6 }: { nom: keyof typeof icones; size: number; color?: string; trait?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={trait} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }} dangerouslySetInnerHTML={{ __html: icones[nom] }} />
)

/** Trame de toits : motif discret de la marque (fond des grands visuels). */
const Trame = ({ color = M.bleu, opacity = 0.05, pas = 120 }: { color?: string; opacity?: number; pas?: number }) => {
  const w = pas * 0.5
  const h = w * 0.42
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${pas}' height='${pas * 0.6}'><path d='M${pas * 0.25} ${pas * 0.3 + h / 2} L${pas * 0.5} ${pas * 0.3 - h / 2} L${pas * 0.75} ${pas * 0.3 + h / 2}' fill='none' stroke='${color}' stroke-width='${pas * 0.05}'/></svg>`
  return <AbsoluteFill style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`, opacity }} />
}

const Page = ({ fond = M.creme, children }: { fond?: string; children: ReactNode }) => (
  <AbsoluteFill style={{ background: fond, overflow: 'hidden' }}>
    <style>{polices}</style>
    {children}
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------------------------------------------

/** Photo de profil : bleu plein, monogramme centré (Instagram et LinkedIn la découpent en cercle). */
export function Profil({ clair = false }: { clair?: boolean }) {
  return (
    <Page fond={clair ? M.creme : M.bleu}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Monogramme size={820} fond={null} lettre={clair ? M.bleu : M.blanc} />
      </AbsoluteFill>
    </Page>
  )
}

/** Couverture « à la une » : fond crème, disque bleu, icône blanche, toit caramel au-dessus (Instagram garde le cercle central). */
export function ALaUne({ icone }: { icone: keyof typeof icones | 'logo' }) {
  return (
    <Page>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 820, height: 820, borderRadius: 410, background: M.bleu, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 30px 80px rgba(26,50,112,0.18)' }}>
          {icone === 'logo' ? (
            <Monogramme size={600} fond={null} />
          ) : (
            <>
              <Toit w={150} t={22} style={{ marginBottom: 34 }} />
              <Icone nom={icone} size={360} trait={1.5} />
              <div style={{ height: 70 }} />
            </>
          )}
        </div>
      </AbsoluteFill>
    </Page>
  )
}

const Telephone = ({ src, h, style }: { src: string; h: number; style?: CSSProperties }) => (
  <div style={{ height: h, width: h * 0.49, borderRadius: h * 0.075, background: M.encre, padding: h * 0.014, boxShadow: `0 ${h * 0.04}px ${h * 0.09}px rgba(26,26,46,0.25)`, ...style }}>
    <div style={{ width: '100%', height: '100%', borderRadius: h * 0.062, overflow: 'hidden', background: M.creme }}>
      <Img src={staticFile(src)} style={{ width: '100%' }} />
    </div>
  </div>
)

const Puce = ({ children, size }: { children: ReactNode; size: number }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.45, background: M.blanc, border: `${Math.max(1, size * 0.06)}px solid ${M.ligne}`, borderRadius: 999, padding: `${size * 0.5}px ${size * 0.95}px`, ...texte(size, M.encre, 500), whiteSpace: 'nowrap' }}>
    <Toit w={size * 0.8} t={size * 0.16} />
    {children}
  </span>
)

/**
 * Bannière claire : logo, promesse, points forts ; à droite, un bloc bleu avec le téléphone.
 * zone : partie toujours visible (recadrage mobile, photo de profil posée par-dessus).
 */
export function Banniere({ width, height, zone, points = 3, telephone = true }: { width: number; height: number; zone: { left: number; right: number; top: number; bottom: number }; points?: number; telephone?: boolean }) {
  const h = height - zone.top - zone.bottom
  const w = width - zone.left - zone.right
  const u = Math.min(h / 7, w / 25)
  const bloc = telephone ? Math.min(w * 0.34, h * 1.4) : 0
  return (
    <Page>
      <Trame opacity={0.045} pas={Math.max(60, u * 3.2)} />
      {telephone ? (
        <div style={{ position: 'absolute', right: zone.right - u * 0.2, top: zone.top + h * 0.08, width: bloc, height: height, background: M.bleu, borderRadius: u * 1.4, overflow: 'hidden' }}>
          <Toit w={bloc * 0.5} t={u * 0.35} color={M.caramel} style={{ position: 'absolute', left: bloc * 0.08, top: u * 0.9, opacity: 0.9 }} />
          <Telephone src="ecrans/aujourdhui.png" h={h * 1.05} style={{ position: 'absolute', left: bloc * 0.5 - h * 0.26, top: h * 0.22 }} />
        </div>
      ) : null}
      <div style={{ position: 'absolute', left: zone.left, top: zone.top, bottom: zone.bottom, width: w - bloc - u * 1.2, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: u * 0.55 }}>
        <Logo height={u * 1.55} />
        <div style={{ ...titre(u * 1.18), maxWidth: w - bloc - u }}>Le bail et le suivi de votre location.</div>
        {points > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: u * 0.3 }}>
            {['Bail conforme à la loi', 'Signature en ligne', 'Quittances automatiques'].slice(0, points).map((p) => <Puce key={p} size={u * 0.46}>{p}</Puce>)}
          </div>
        ) : null}
        <div style={{ ...texte(u * 0.56, M.bleu, 700) }}>bailio.fr <span style={{ color: M.gris, fontWeight: 400 }}>· gratuit pour créer votre bail</span></div>
      </div>
    </Page>
  )
}

/** Post de bienvenue (4:5), à épingler en premier. */
export function Bienvenue() {
  return (
    <Page>
      <Trame opacity={0.05} />
      <AbsoluteFill style={{ padding: '100px 90px 90px', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Logo height={96} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <div style={{ ...titre(104) }}>
            Louer, <span style={{ color: M.bleu }}>sans prise de tête.</span>
          </div>
          <div style={{ ...texte(40, M.gris), maxWidth: 820 }}>Le bail et le suivi de votre location, pour les propriétaires particuliers.</div>
        </div>
        <div style={{ background: M.blanc, border: `2px solid ${M.ligne}`, borderRadius: 40, padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          {[
            ['file-text', 'Un bail conforme à la loi, en quelques minutes'],
            ['pen-line', 'La signature en ligne, sans papier'],
            ['receipt-euro', 'Les quittances envoyées toutes seules'],
            ['lightbulb', 'Une astuce de propriétaire chaque semaine'],
          ].map(([i, t]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
              <div style={{ width: 76, height: 76, borderRadius: 22, background: M.bleuClair, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icone nom={i as keyof typeof icones} size={42} color={M.bleu} trait={2} />
              </div>
              <span style={{ ...texte(38, M.encre, 500) }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ background: M.bleu, color: M.blanc, borderRadius: 999, padding: '26px 56px', ...titre(50, M.blanc) }}>bailio.fr</span>
          <span style={{ ...texte(32, M.gris) }}>Gratuit pour créer votre bail</span>
        </div>
      </AbsoluteFill>
    </Page>
  )
}

/** Planche de la charte : logo, couleurs, typographie, icônes, signature. */
export function Charte() {
  const couleurs: Array<[string, string, string]> = [
    ['Bleu Bailio', M.bleu, 'Couleur principale'],
    ['Encre', M.encre, 'Titres et texte'],
    ['Caramel', M.caramel, 'Le toit, les accents'],
    ['Crème', M.creme, 'Fonds'],
    ['Bleu clair', M.bleuClair, 'Pastilles, encarts'],
  ]
  const Bloc = ({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) => (
    <div style={{ background: M.blanc, border: `2px solid ${M.ligne}`, borderRadius: 32, padding: 44, display: 'flex', flexDirection: 'column', gap: 28, ...style }}>
      <div style={{ ...texte(22, M.gris, 700), letterSpacing: 3, textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  )
  return (
    <Page>
      <div style={{ position: 'absolute', inset: 80, display: 'grid', gridTemplateColumns: '1.25fr 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: 36 }}>
        <div style={{ gridColumn: '1 / 4', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...texte(24, M.caramelFonce, 700), letterSpacing: 4, textTransform: 'uppercase' }}>Charte graphique</div>
            <div style={{ ...titre(84), marginTop: 10 }}>Bailio, la marque</div>
          </div>
          <div style={{ ...texte(26, M.gris), textAlign: 'right' }}>Le toit : une maison, un abri, une location bien tenue.</div>
        </div>
        <Bloc label="Logo" style={{ gridRow: '2 / 4', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'flex-start' }}>
            <Logo height={150} />
            <div style={{ background: M.bleu, borderRadius: 24, padding: '40px 46px' }}>
              <Logo height={110} sombre />
            </div>
            <div style={{ display: 'flex', gap: 30, alignItems: 'flex-end' }}>
              <Monogramme size={170} />
              <Monogramme size={170} fond={M.creme} lettre={M.bleu} />
              <Monogramme size={86} />
              <Monogramme size={44} />
            </div>
          </div>
          <div style={{ ...texte(24, M.gris) }}>Le « b » est une maison : le toit caramel se pose sur sa panse, le fût fait cheminée. Dans « bailio », les points des i sont deux toits.</div>
        </Bloc>
        <Bloc label="Couleurs">
          {couleurs.map(([nom, hex, role]) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 86, height: 86, borderRadius: 22, background: hex, border: `2px solid ${M.ligne}`, flexShrink: 0 }} />
              <div>
                <div style={{ ...titre(30) }}>{nom} <span style={{ ...texte(24, M.gris, 500) }}>{hex.toUpperCase()}</span></div>
                <div style={{ ...texte(22, M.gris) }}>{role}</div>
              </div>
            </div>
          ))}
        </Bloc>
        <Bloc label="Typographie">
          <div style={{ ...titre(120) }}>Aa</div>
          <div style={{ ...titre(40) }}>Outfit Bold — titres</div>
          <div style={{ ...texte(30, M.encre) }}>DM Sans — texte courant, chiffres, boutons et mentions.</div>
          <div style={{ ...texte(22, M.gris) }}>Polices libres (licence OFL). Titres courts, à l'affirmative, sans point d'exclamation.</div>
        </Bloc>
        <Bloc label="Icônes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
            {(['file-text', 'pen-line', 'receipt-euro', 'clipboard-check', 'lightbulb', 'bell-ring', 'key-round', 'house'] as const).map((i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 24, background: M.bleuClair, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icone nom={i} size={56} color={M.bleu} trait={1.8} />
              </div>
            ))}
          </div>
          <div style={{ ...texte(22, M.gris) }}>Lucide (licence ISC), trait arrondi, toujours en bleu sur bleu clair ou en blanc sur bleu.</div>
        </Bloc>
        <Bloc label="Signature" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
            <Toit w={140} t={20} />
            <Toit w={90} t={13} color={M.bleu} />
            <Toit w={56} t={9} />
          </div>
          <div style={{ position: 'relative', height: 150, borderRadius: 24, overflow: 'hidden', background: M.creme, border: `2px solid ${M.ligne}` }}>
            <Trame opacity={0.12} pas={70} />
          </div>
          <div style={{ ...texte(22, M.gris) }}>Le toit sert de puce, d'accent et de trame de fond. Jamais plus d'un toit caramel par élément.</div>
        </Bloc>
      </div>
    </Page>
  )
}
