import type { CSSProperties, ReactNode } from 'react'
import { AbsoluteFill, random, staticFile } from 'remotion'
import logo from './logo.json'

/**
 * Identité de Bailio pour les réseaux sociaux (charte : marque/CHARTE.md), reprise du compte Instagram et de la
 * page LinkedIn : « Bailio. » en Cormorant Garamond italique, point caramel ; fonds blanc ou crème ; façades
 * haussmanniennes beige pâle ; icônes pleines bleu nuit avec un seul détail caramel. Sobre, éditorial.
 * Rendu par scripts/marque.mjs dans marque/.
 */

export const M = {
  encre: '#1a1a2e',
  bleu: '#1a3270',
  gris: '#5a5a6e',
  caramel: '#c4976a',
  caramelFonce: '#8a5f36',
  creme: '#f8f5ef',
  blanc: '#ffffff',
  facade: '#f2ede4',
  fenetre: '#e6dfd2',
  ligne: '#e6e0d5',
}

export const polices = `
@font-face { font-family: 'Cormorant Garamond'; font-style: italic; font-weight: 700; src: url('${staticFile('fonts/cormorant-garamond-latin-700-italic.woff2')}') format('woff2'); }
@font-face { font-family: 'Cormorant Garamond'; font-style: italic; font-weight: 500; src: url('${staticFile('fonts/cormorant-garamond-latin-500-italic.woff2')}') format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 400; src: url('${staticFile('fonts/dm-sans-latin-400-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 500; src: url('${staticFile('fonts/dm-sans-latin-500-normal.woff2')}') format('woff2'); }
@font-face { font-family: 'DM Sans'; font-weight: 700; src: url('${staticFile('fonts/dm-sans-latin-700-normal.woff2')}') format('woff2'); }
`

export const serif = (size: number, color: string = M.encre, weight = 500): CSSProperties => ({ fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontWeight: weight, fontSize: size, lineHeight: 1.1, color })
export const sans = (size: number, color: string = M.gris, weight = 400): CSSProperties => ({ fontFamily: 'DM Sans', fontWeight: weight, fontSize: size, lineHeight: 1.4, color })
/** Petites capitales espacées (ligne de mentions, comme sur la bannière LinkedIn). */
export const capitales = (size: number, color: string = M.caramelFonce): CSSProperties => ({ ...sans(size, color, 500), letterSpacing: size * 0.18, textTransform: 'uppercase' })

/** Logo « Bailio. » en vecteurs (scripts/logo.mjs). */
export const Logo = ({ height, color = M.encre }: { height: number; color?: string }) => {
  const [x, y, w, h] = logo.mot.box
  return (
    <svg height={height} width={(height * w) / h} viewBox={`${x} ${y} ${w} ${h}`} style={{ display: 'block' }}>
      <path d={logo.mot.lettres} fill={color} />
      <path d={logo.mot.point} fill={M.caramel} />
    </svg>
  )
}

/** Filet caramel (au-dessus du logo sur la bannière). */
const Filet = ({ w, h = 3 }: { w: number; h?: number }) => <div style={{ width: w, height: h, background: M.caramel, borderRadius: h }} />

/**
 * Icônes de la marque : formes pleines bleu nuit, un seul détail caramel (comme les stories à la une actuelles).
 * Grille de 120, dessinées à la main pour rester homogènes.
 */
const B = M.bleu
const K = M.caramel
export const ICONES = {
  'a-propos': (
    <>
      <path d="M60 14 L107 54 C110 57 108 61 104 61 L100 61 L100 99 C100 104 96 108 91 108 L29 108 C24 108 20 104 20 99 L20 61 L16 61 C12 61 10 57 13 54 Z" fill={B} />
      <rect x="49" y="70" width="22" height="38" rx="4" fill={K} />
      <circle cx="65" cy="90" r="2.4" fill={B} />
    </>
  ),
  'le-bail': (
    <>
      <path d="M32 10 H72 L96 34 V102 C96 107 92 111 87 111 H32 C27 111 23 107 23 102 V19 C23 14 27 10 32 10 Z" fill={B} />
      <path d="M72 10 V27 C72 31 75 34 79 34 H96 Z" fill="#3b5390" />
      <rect x="35" y="50" width="38" height="6" rx="3" fill={M.blanc} />
      <rect x="35" y="63" width="48" height="6" rx="3" fill={M.blanc} />
      <rect x="35" y="76" width="30" height="6" rx="3" fill={M.blanc} />
      <circle cx="80" cy="94" r="11" fill={K} />
    </>
  ),
  signature: (
    <>
      <path d="M84 12 C87 9 92 9 95 12 L108 25 C111 28 111 33 108 36 L58 86 L30 94 L38 66 Z" fill={B} />
      <path d="M44 72 L52 80" stroke={M.blanc} strokeWidth="5" strokeLinecap="round" />
      <path d="M12 108 C20 100 28 100 34 106 C40 112 48 112 56 104 C62 98 68 98 74 104" fill="none" stroke={K} strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  quittances: (
    <>
      <path d="M28 10 H92 V110 L84 104 L76 110 L68 104 L60 110 L52 104 L44 110 L36 104 L28 110 Z" fill={B} />
      <path d="M72 38 C68 33 63 31 58 31 C48 31 41 39 41 50 C41 61 48 69 58 69 C63 69 68 67 72 62" fill="none" stroke={K} strokeWidth="7" strokeLinecap="round" />
      <path d="M36 45 H60 M36 55 H58" stroke={K} strokeWidth="6" strokeLinecap="round" />
      <rect x="38" y="82" width="44" height="6" rx="3" fill={M.blanc} opacity="0.85" />
    </>
  ),
  'etat-des-lieux': (
    <>
      <rect x="22" y="18" width="76" height="94" rx="12" fill={B} />
      <rect x="40" y="9" width="40" height="20" rx="7" fill={K} />
      <path d="M41 65 L54 78 L80 50" fill="none" stroke={M.blanc} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  guide: (
    <>
      <path d="M60 10 C38 10 24 26 24 45 C24 57 30 66 37 73 C41 78 44 82 44 88 V89 H76 V88 C76 82 79 78 83 73 C90 66 96 57 96 45 C96 26 82 10 60 10 Z" fill={B} />
      <path d="M41 44 C42 34 49 27 58 25" fill="none" stroke={M.blanc} strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <rect x="44" y="94" width="32" height="8" rx="4" fill={K} />
      <rect x="48" y="106" width="24" height="8" rx="4" fill={K} />
    </>
  ),
  faq: (
    <>
      <path d="M38 40 C38 26 48 17 61 17 C74 17 83 26 83 38 C83 49 76 54 68 59 C63 62 61 66 61 72 V76" fill="none" stroke={B} strokeWidth="15" strokeLinecap="round" />
      <circle cx="61" cy="101" r="10" fill={K} />
    </>
  ),
  actu: (
    <>
      <path d="M60 10 C63 10 66 13 66 16 V20 C81 23 91 37 91 54 V72 L100 85 C102 88 100 92 96 92 H24 C20 92 18 88 20 85 L29 72 V54 C29 37 39 23 54 20 V16 C54 13 57 10 60 10 Z" fill={B} />
      <circle cx="60" cy="103" r="10" fill={K} />
    </>
  ),
  avis: (
    <>
      <path d="M22 16 H98 C104 16 108 20 108 26 V74 C108 80 104 84 98 84 H54 L34 102 V84 H22 C16 84 12 80 12 74 V26 C12 20 16 16 22 16 Z" fill={B} />
      <path d="M60 30 L65.5 42 L78 43.5 L68.5 52 L71.5 65 L60 58 L48.5 65 L51.5 52 L42 43.5 L54.5 42 Z" fill={K} />
    </>
  ),
} as const
export type IconeMarque = keyof typeof ICONES

export const IconeMarque = ({ nom, size }: { nom: IconeMarque; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{ display: 'block' }}>
    {ICONES[nom]}
  </svg>
)

/**
 * Façades haussmanniennes beige pâle (comme la bannière LinkedIn) : immeubles de hauteurs voisines,
 * fenêtres en grille, toit mansardé. Tirage fixe (seed) : la même rue à chaque rendu.
 */
export const Rue = ({ width, height, seed = 'rue' }: { width: number; height: number; seed?: string }) => {
  const u = height / 10
  const blocs: ReactNode[] = []
  let x = -u
  let i = 0
  while (x < width + u) {
    const w = u * (5 + Math.floor(random(`${seed}w${i}`) * 4))
    const etages = 6 + Math.floor(random(`${seed}e${i}`) * 3)
    const hh = Math.min(height, u * (etages + 1.6))
    const top = height - hh
    const cols = Math.max(3, Math.round(w / (u * 1.35)))
    const fen: ReactNode[] = []
    for (let r = 0; r < etages; r++) {
      for (let c = 0; c < cols; c++) {
        const fw = (w / cols) * 0.42
        fen.push(<rect key={`${r}-${c}`} x={x + (w / cols) * (c + 0.29)} y={top + u * 1.9 + r * u * 0.98} width={fw} height={u * 0.58} rx={fw * 0.12} fill={M.fenetre} />)
      }
    }
    blocs.push(
      <g key={i}>
        <path d={`M${x} ${top + u * 1.2} L${x + u * 0.5} ${top} L${x + w - u * 0.5} ${top} L${x + w} ${top + u * 1.2} V${height} H${x} Z`} fill={M.facade} />
        <rect x={x} y={top + u * 1.2} width={w} height={u * 0.18} fill={M.fenetre} />
        {fen}
      </g>,
    )
    x += w + u * 0.25
    i++
  }
  return (
    <svg width={width} height={height} style={{ position: 'absolute', left: 0, bottom: 0, display: 'block' }}>
      {blocs}
    </svg>
  )
}

const Page = ({ fond = M.creme, children }: { fond?: string; children: ReactNode }) => (
  <AbsoluteFill style={{ background: fond, overflow: 'hidden' }}>
    <style>{polices}</style>
    {children}
  </AbsoluteFill>
)

// ---------------------------------------------------------------------------------------------------------------

/** Photo de profil : « Bailio. » centré sur blanc (Instagram et LinkedIn la découpent en cercle). */
export function Profil({ clair = true }: { clair?: boolean }) {
  return (
    <Page fond={clair ? M.blanc : M.encre}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ marginTop: 18 }}>
          <Logo height={300} color={clair ? M.encre : M.blanc} />
        </div>
      </AbsoluteFill>
    </Page>
  )
}

/** Couverture « à la une » : fond blanc, icône pleine centrée (Instagram n'en garde que le cercle central). */
export function ALaUne({ icone }: { icone: IconeMarque }) {
  return (
    <Page fond={M.blanc}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <IconeMarque nom={icone} size={560} />
      </AbsoluteFill>
    </Page>
  )
}

/**
 * Bannière : la rue haussmannienne en bas, au centre le filet caramel, le logo, la promesse en italique et la
 * ligne de mentions. zone : partie toujours visible (recadrage mobile, photo de profil posée par-dessus).
 */
export function Banniere({ width, height, zone, rue = true }: { width: number; height: number; zone: { left: number; right: number; top: number; bottom: number }; rue?: boolean }) {
  const h = height - zone.top - zone.bottom
  const w = width - zone.left - zone.right
  const u = Math.min(h / 5.2, w / 16)
  return (
    <Page fond={M.blanc}>
      {rue ? <Rue width={width} height={height * 0.44} /> : null}
      <div style={{ position: 'absolute', left: zone.left, right: zone.right, top: zone.top, bottom: zone.bottom, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: u * 0.32 }}>
        <Filet w={u * 1.5} h={Math.max(2, u * 0.05)} />
        <Logo height={u * 1.55} />
        <div style={{ ...serif(u * 0.5, M.gris) }}>La location entre particuliers, réinventée.</div>
        <div style={{ ...capitales(u * 0.22) }}>Sans agence · Sans commission · Sans paperasse</div>
      </div>
    </Page>
  )
}

/** Post de bienvenue (4:5), à épingler en premier. */
export function Bienvenue() {
  return (
    <Page fond={M.blanc}>
      <Rue width={1080} height={430} seed="post" />
      <AbsoluteFill style={{ padding: '120px 100px', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 44 }}>
        <Filet w={120} />
        <Logo height={170} />
        <div style={{ ...serif(64, M.encre) }}>La location entre particuliers, réinventée.</div>
        <div style={{ ...capitales(21) }}>Sans agence · Sans commission · Sans paperasse</div>
        <div style={{ display: 'flex', gap: 54, marginTop: 30 }}>
          {([['le-bail', 'Bail conforme'], ['signature', 'Signé en ligne'], ['quittances', 'Quittances auto']] as const).map(([i, t]) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: 230 }}>
              <IconeMarque nom={i} size={120} />
              <div style={{ ...sans(30, M.encre, 500) }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', ...sans(34, M.encre, 500) }}>
          <span style={{ borderBottom: `3px solid ${M.caramel}`, paddingBottom: 6 }}>bailio.fr</span>
        </div>
      </AbsoluteFill>
    </Page>
  )
}

/** Planche de la charte. */
export function Charte() {
  const couleurs: Array<[string, string, string]> = [
    ['Encre', M.encre, 'Logo, titres, texte'],
    ['Caramel', M.caramel, 'Le point, les filets, un détail par icône'],
    ['Bleu nuit', M.bleu, 'Icônes, boutons'],
    ['Crème', M.creme, 'Fonds'],
    ['Pierre', M.facade, 'Façades, décors'],
  ]
  const Bloc = ({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) => (
    <div style={{ background: M.blanc, border: `2px solid ${M.ligne}`, borderRadius: 28, padding: 46, display: 'flex', flexDirection: 'column', gap: 28, ...style }}>
      <div style={{ ...capitales(20, M.gris) }}>{label}</div>
      {children}
    </div>
  )
  return (
    <Page fond={M.creme}>
      <div style={{ position: 'absolute', inset: 80, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', gap: 34 }}>
        <div style={{ gridColumn: '1 / 4', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ ...capitales(22) }}>Charte graphique</div>
            <div style={{ ...serif(88, M.encre, 700), marginTop: 6 }}>Bailio, la marque</div>
          </div>
          <div style={{ ...serif(36, M.gris) }}>La location entre particuliers, réinventée.</div>
        </div>
        <Bloc label="Logo" style={{ gridRow: '2 / 4', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 44, alignItems: 'flex-start' }}>
            <Logo height={190} />
            <div style={{ background: M.encre, borderRadius: 20, padding: '34px 46px' }}>
              <Logo height={120} color={M.blanc} />
            </div>
            <div style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
              <div style={{ width: 170, height: 170, borderRadius: 85, background: M.blanc, border: `2px solid ${M.ligne}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Logo height={50} />
              </div>
              <Logo height={70} color={M.bleu} />
            </div>
          </div>
          <div style={{ ...sans(24) }}>« Bailio. » en Cormorant Garamond italique, le point final toujours en caramel. Laissez autour du logo un espace égal à la hauteur du « B ».</div>
        </Bloc>
        <Bloc label="Couleurs">
          {couleurs.map(([nom, hex, role]) => (
            <div key={nom} style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, background: hex, border: `2px solid ${M.ligne}`, flexShrink: 0 }} />
              <div>
                <div style={{ ...sans(28, M.encre, 700) }}>{nom} <span style={{ ...sans(22, M.gris, 500) }}>{hex.toUpperCase()}</span></div>
                <div style={{ ...sans(21) }}>{role}</div>
              </div>
            </div>
          ))}
        </Bloc>
        <Bloc label="Typographie">
          <div style={{ ...serif(110, M.encre, 700) }}>Aa</div>
          <div style={{ ...serif(42, M.encre, 700) }}>Cormorant Garamond italique</div>
          <div style={{ ...sans(28, M.encre) }}>DM Sans pour le texte, les chiffres et les boutons.</div>
          <div style={{ ...capitales(18) }}>Mentions en petites capitales</div>
        </Bloc>
        <Bloc label="Icônes">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14 }}>
            {(['a-propos', 'le-bail', 'signature', 'quittances', 'etat-des-lieux', 'guide', 'faq', 'actu', 'avis'] as const).map((i) => (
              <div key={i} style={{ aspectRatio: '1', borderRadius: 999, background: M.creme, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconeMarque nom={i} size={58} />
              </div>
            ))}
          </div>
          <div style={{ ...sans(21) }}>Formes pleines bleu nuit, un seul détail caramel.</div>
        </Bloc>
        <Bloc label="Décor" style={{ position: 'relative', overflow: 'hidden', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', height: 240, borderRadius: 18, overflow: 'hidden', background: M.blanc, border: `2px solid ${M.ligne}` }}>
            <Rue width={560} height={220} seed="charte" />
          </div>
          <div style={{ ...sans(21) }}>Façades haussmanniennes ton pierre, toujours en arrière-plan, jamais plus foncées que le texte.</div>
        </Bloc>
      </div>
    </Page>
  )
}

// ---------------------------------------------------------------------------------------------------------------

/** Une story par « à la une » : le sujet, une promesse, trois points, le lien. */
export interface StoryDef {
  icone: IconeMarque
  kicker: string
  titre: string
  intro?: string
  /** Réponse courte en très grand (FAQ). */
  reponse?: string
  /** Deux chiffres côte à côte (guide). */
  chiffres?: Array<[string, string]>
  points: Array<[string, string]>
  fin: string
}

export const STORIES: Record<string, StoryDef> = {
  '1-a-propos': {
    icone: 'a-propos',
    kicker: 'À propos',
    titre: 'Le bail et le suivi de votre location.',
    intro: 'Pour les propriétaires qui louent eux-mêmes, sans agence.',
    points: [
      ['Un bail conforme', 'vide, meublé ou garage, en quelques minutes'],
      ['Signé en ligne', 'par le locataire, le garant et vous'],
      ['Le suivi au quotidien', 'quittances, rappels et courriers prêts'],
    ],
    fin: 'Créez votre bail sur bailio.fr',
  },
  '2-le-bail': {
    icone: 'le-bail',
    kicker: 'Le bail',
    titre: 'Un bail conforme, sans y passer la soirée.',
    intro: 'Le contrat type officiel, à jour du décret du 6 juillet 2026.',
    points: [
      ['Une question à la fois', 'le logement, le locataire, le loyer'],
      ['Les règles vérifiées', 'durée, dépôt maximum, DPE, plafonds de loyer'],
      ['Prêt à signer', 'avec la notice d’information jointe'],
    ],
    fin: 'Votre bail sur bailio.fr',
  },
  '3-signature': {
    icone: 'signature',
    kicker: 'Signature',
    titre: 'Tout le monde signe en ligne.',
    intro: 'Sans imprimer une seule page, depuis un téléphone.',
    points: [
      ['Chacun son lien', 'le locataire, le garant et vous'],
      ['Un code par email', 'pour confirmer qui signe'],
      ['Un certificat', 'horodaté, joint au bail signé'],
    ],
    fin: 'Faites signer sur bailio.fr',
  },
  '4-quittances': {
    icone: 'quittances',
    kicker: 'Quittances',
    titre: 'Les quittances partent toutes seules.',
    intro: 'Vous n’agissez que si le loyer n’arrive pas.',
    points: [
      ['7 jours après l’échéance', 'la quittance part par email'],
      ['Prévenu 3 jours avant', 'un clic si le loyer n’est pas arrivé'],
      ['Toujours gratuite', 'la loi interdit de la faire payer'],
    ],
    fin: 'Plus d’oubli sur bailio.fr',
  },
  '5-etat-des-lieux': {
    icone: 'etat-des-lieux',
    kicker: 'État des lieux',
    titre: 'L’état des lieux sur votre téléphone.',
    intro: 'Pièce par pièce, avec des photos datées.',
    points: [
      ['Signé sur place', 'par vous et le locataire'],
      ['La sortie comparée à l’entrée', 'élément par élément'],
      ['Les retenues justifiées', 'usure normale ou dégradation'],
    ],
    fin: 'À essayer sur bailio.fr',
  },
  '6-guide': {
    icone: 'guide',
    kicker: 'Guide',
    titre: 'Dépôt de garantie : combien au maximum ?',
    chiffres: [
      ['1 mois', 'location vide'],
      ['2 mois', 'location meublée'],
    ],
    intro: 'De loyer hors charges (loi du 6 juillet 1989).',
    points: [
      ['Rendu sous 1 mois', 'si l’état des lieux de sortie est conforme'],
      ['Sinon sous 2 mois', 'avec les retenues justifiées'],
    ],
    fin: 'Un conseil par semaine sur bailio.fr',
  },
  '7-faq': {
    icone: 'faq',
    kicker: 'FAQ',
    titre: 'Mon locataire doit-il créer un compte ?',
    reponse: 'Non.',
    points: [
      ['Son dossier', 'il le complète depuis un lien reçu par email'],
      ['Sa signature', 'depuis son téléphone'],
      ['Son assurance', 'il l’envoie depuis le même lien'],
    ],
    fin: 'Vos questions en message privé',
  },
  '8-actu': {
    icone: 'actu',
    kicker: 'Actu',
    titre: 'Nouveau bail type depuis le 1er octobre 2026.',
    intro: 'Décret n° 2026-596 du 6 juillet 2026.',
    points: [
      ['Clause résolutoire', 'six semaines après le commandement de payer'],
      ['Téléphone portable', 'facultatif pour les deux parties'],
      ['Résidence principale', 'la servitude d’urbanisme, quand elle existe'],
    ],
    fin: 'Les baux Bailio sont déjà à jour',
  },
  '9-avis': {
    icone: 'avis',
    kicker: 'Avis',
    titre: 'Votre avis compte.',
    intro: 'Bailio se construit avec les propriétaires qui l’utilisent.',
    points: [
      ['Une idée ?', 'dites-la-nous en message privé'],
      ['Un souci ?', 'écrivez-nous, on regarde tout'],
      ['Contents de Bailio ?', 'vos avis seront partagés ici'],
    ],
    fin: 'Répondez à cette story',
  },
}

/**
 * Story (1080 × 1920) à publier dans chaque « à la une ». Le texte reste entre 250 et 1 620 px de haut :
 * Instagram pose le nom du compte en haut et le champ de réponse en bas.
 */
export function Story({ s }: { s: StoryDef }) {
  return (
    <Page fond={M.blanc}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.85 }}>
        <Rue width={1080} height={300} seed={s.kicker} />
      </div>
      <AbsoluteFill style={{ padding: '250px 90px 300px', flexDirection: 'column', gap: 44 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo height={64} />
          <span style={{ ...capitales(24) }}>{s.kicker}</span>
        </div>
        <Filet w={110} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ width: 190, height: 190, borderRadius: 95, background: M.creme, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IconeMarque nom={s.icone} size={120} />
          </div>
          {s.reponse ? <div style={{ ...serif(190, M.bleu, 700), lineHeight: 1 }}>{s.reponse}</div> : null}
        </div>
        <div style={{ ...serif(88, M.encre, 700), lineHeight: 1.04 }}>{s.titre}</div>
        {s.intro ? <div style={{ ...sans(38, M.gris), lineHeight: 1.35 }}>{s.intro}</div> : null}
        {s.chiffres ? (
          <div style={{ display: 'flex', gap: 28 }}>
            {s.chiffres.map(([v, l], k) => (
              <div key={v} style={{ flex: 1, borderRadius: 30, padding: '34px 30px', background: k ? M.caramel : M.bleu, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ ...serif(96, k ? M.encre : M.blanc, 700), lineHeight: 1 }}>{v}</span>
                <span style={{ ...sans(30, k ? M.encre : M.blanc, 500) }}>{l}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {s.points.map(([t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 26, alignItems: 'flex-start', background: M.creme, borderRadius: 26, padding: '26px 30px' }}>
              <span style={{ width: 18, height: 18, borderRadius: 9, background: M.caramel, flexShrink: 0, marginTop: 16 }} />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...sans(38, M.encre, 700), lineHeight: 1.25 }}>{t}</span>
                <span style={{ ...sans(32, M.gris), lineHeight: 1.3 }}>{d}</span>
              </span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', ...sans(34, M.encre, 500) }}>
          <span style={{ borderBottom: `3px solid ${M.caramel}`, paddingBottom: 6 }}>{s.fin}</span>
        </div>
      </AbsoluteFill>
    </Page>
  )
}
