import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { CALLBACK_PROMISE } from '../content/inclus'
import { FEATURES, featurePath } from '../content/fonctionnalites'
import { MODELES, SIMULATEURS, modelePath } from '../content/modeles'
import { BAUX, PROFILS, solutionPath } from '../content/solutions'
import { Bell, Book, Camera, Close, DocIcon, EuroIcon, House, Mail, Page, Pencil, People, Signpost, Sofa, Upload } from './Icons'
import { Logo } from './Logo'

type IconName = 'doc' | 'euro' | 'bell' | 'camera' | 'people' | 'book' | 'signpost' | 'house' | 'sofa' | 'page' | 'pencil' | 'upload' | 'mail'

function MenuIcon({ name }: { name: IconName }) {
  const p = { size: 20, color: BAI.owner, strokeWidth: 1.8 }
  const icon = {
    doc: <DocIcon {...p} />,
    euro: <EuroIcon {...p} />,
    bell: <Bell {...p} />,
    camera: <Camera {...p} />,
    people: <People {...p} />,
    book: <Book {...p} />,
    signpost: <Signpost {...p} />,
    house: <House {...p} />,
    sofa: <Sofa {...p} />,
    page: <Page {...p} />,
    pencil: <Pencil {...p} />,
    upload: <Upload {...p} />,
    mail: <Mail {...p} />,
  }[name]
  return (
    <span aria-hidden style={{ width: 40, height: 40, borderRadius: 12, background: BAI.ownerLight, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </span>
  )
}

interface Item {
  to: string
  title: string
  text: string
  icon: IconName
}
interface Column {
  title: string
  items: Item[]
  /** Deux colonnes d'éléments sous le même titre (liste longue). */
  wide?: boolean
}
interface Section {
  label: string
  /** Lien direct (pas de panneau). */
  to?: string
  columns?: Column[]
  foot?: { text: string; link: { to: string; label: string } }
}

const FEATURE_TEXT: Record<string, [string, IconName]> = {
  'contrat-de-location': ['Contrat type officiel, signé en ligne', 'pencil'],
  'quittance-de-loyer': ['Envoyées dès le loyer reçu', 'euro'],
  'loyers-impayes': ['Relances J+3, J+8, J+15', 'bell'],
  'etat-des-lieux': ['Sur téléphone, sortie comparée', 'camera'],
  candidatures: ['Dossiers triés, pièces protégées', 'people'],
  'declaration-impots': ['Les cases à recopier, 2044 remplie', 'doc'],
  'rapprochement-bancaire': ['CSV ou OFX, loyers retrouvés', 'euro'],
  'plusieurs-logements': ['Reste, rendement, SCI, accès', 'house'],
}
const PROFILE_TEXT: Record<string, string> = { particulier: 'Vous louez en votre nom', sci: 'Associés, parts, déclaration 2072', lmnp: 'Location meublée, micro-BIC ou réel' }
const LEASE_TEXT: Record<string, string> = { 'location-vide': '3 ans en nom propre', 'location-meublee': '1 an, mobilier obligatoire', 'bail-etudiant': '9 mois, non reconduit', 'bail-mobilite': '1 à 10 mois, sans dépôt', colocation: 'Plusieurs locataires, solidarité', 'garage-parking': 'Contrat libre, sans DPE' }
const LEASE_ICON: Record<string, IconName> = { 'location-vide': 'house', 'location-meublee': 'sofa', 'bail-etudiant': 'book', 'bail-mobilite': 'signpost', colocation: 'people', 'garage-parking': 'house' }
const TOOL_ICON: Record<string, IconName> = { '/simulateurs/date-conge-bailleur': 'signpost', '/simulateurs/preavis-locataire': 'signpost', '/simulateurs/dpe-location': 'house', '/simulateurs/piece-autorisee': 'people', '/simulateurs/micro-foncier-ou-reel': 'doc' }
const TOP_MODELES = ['quittance-de-loyer', 'mise-en-demeure-loyer-impaye', 'lettre-revision-loyer', 'restitution-depot-de-garantie', 'conge-proprietaire-vente', 'conge-proprietaire-reprise', 'appel-a-la-caution', 'avenant-au-bail']

/** Menu du site : mêmes rubriques sur toutes les pages publiques, panneaux au survol sur ordinateur, accordéon sur téléphone. */
export const SECTIONS: Section[] = [
  {
    label: 'Produit',
    columns: [
      {
        title: 'Fonctionnalités',
        wide: true,
        items: [
          ...FEATURES.map((f) => ({ to: featurePath(f.slug), title: f.name, text: FEATURE_TEXT[f.slug]?.[0] ?? '', icon: FEATURE_TEXT[f.slug]?.[1] ?? 'doc' })),
          { to: '/changer-pour-bailio', title: 'Reprise de vos locations', text: 'Fichier Excel ou bail en photo', icon: 'upload' },
          { to: '/demo', title: 'Essayer la démo', text: 'Sans compte, en deux minutes', icon: 'signpost' },
        ],
      },
    ],
    foot: { text: 'Tout Bailio, écran par écran.', link: { to: '/fonctionnalites', label: 'Voir les fonctionnalités' } },
  },
  {
    label: 'Solutions',
    columns: [
      { title: 'Vous êtes', items: PROFILS.map((s) => ({ to: solutionPath(s), title: s.name, text: PROFILE_TEXT[s.slug] ?? '', icon: s.slug === 'lmnp' ? 'sofa' : s.slug === 'sci' ? 'people' : 'house' })) },
      { title: 'Vous louez', items: BAUX.map((s) => ({ to: solutionPath(s), title: s.name, text: LEASE_TEXT[s.slug] ?? '', icon: LEASE_ICON[s.slug] ?? 'house' })) },
    ],
    foot: { text: 'Déjà un logiciel, un tableur ou une agence ?', link: { to: '/changer-pour-bailio', label: 'Changer pour Bailio' } },
  },
  { label: 'Tarifs', to: '/tarifs' },
  {
    label: 'Ressources',
    columns: [
      {
        title: 'Guides et conseils',
        items: [
          { to: '/guides', title: 'Guides du propriétaire', text: 'Les règles, vérifiées et sourcées', icon: 'book' },
          { to: '/a-propos', title: 'À propos de Bailio', text: 'Comment Bailio est fait', icon: 'signpost' },
        ],
      },
      {
        title: 'Modèles gratuits',
        wide: true,
        items: [
          { to: '/modeles', title: 'Tous les modèles', text: `${MODELES.length} lettres prêtes à copier`, icon: 'page' },
          ...TOP_MODELES.map((slug) => MODELES.find((m) => m.slug === slug))
            .filter((m): m is (typeof MODELES)[number] => !!m)
            .map((m) => ({ to: modelePath(m), title: m.title.replace(/\s*:\s*modèle.*$/i, ''), text: '', icon: 'page' as IconName })),
        ],
      },
      { title: 'Outils gratuits', items: SIMULATEURS.map((x) => ({ to: x.path, title: x.name, text: '', icon: TOOL_ICON[x.path] ?? 'euro' })) },
    ],
    foot: { text: CALLBACK_PROMISE, link: { to: '/contact', label: 'Être rappelé' } },
  },
]

const linkReset: CSSProperties = { textDecoration: 'none', color: 'inherit' }

function ItemLink({ item, onPick }: { item: Item; onPick: () => void }) {
  return (
    <li>
      <Link to={item.to} onClick={onPick} className="mega-item" style={{ ...linkReset, display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 14, minHeight: 44 }}>
        <MenuIcon name={item.icon} />
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: BAI.ink, fontSize: 15, lineHeight: 1.3 }}>{item.title}</span>
          {item.text ? <span style={{ color: BAI.inkSoft, fontSize: 13.5, lineHeight: 1.35 }}>{item.text}</span> : null}
        </span>
      </Link>
    </li>
  )
}

function Columns({ section, onPick }: { section: Section; onPick: () => void }) {
  return (
    <div className="mega-cols">
      {section.columns!.map((c) => (
        <div key={c.title} className={c.wide ? 'mega-col mega-col--wide' : 'mega-col'}>
          <p style={{ margin: '0 0 8px', padding: '0 10px 10px', borderBottom: `1px solid ${BAI.divider}`, fontSize: 12.5, fontWeight: 700, color: BAI.owner }}>{c.title}</p>
          <ul className={c.wide ? 'mega-list mega-list--2' : 'mega-list'} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {c.items.map((it) => (
              <ItemLink key={it.to} item={it} onPick={onPick} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

function Foot({ section, onPick }: { section: Section; onPick: () => void }) {
  if (!section.foot) return null
  return (
    <div style={{ marginTop: 16, padding: '14px 10px 0', borderTop: `1px solid ${BAI.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ color: BAI.inkMid, fontSize: 14.5 }}>{section.foot.text}</span>
      <Link to={section.foot.link.to} onClick={onPick} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 18px', borderRadius: 999, background: BAI.ownerLight, color: BAI.owner, fontWeight: 600, fontSize: 14.5, textDecoration: 'none' }}>
        {section.foot.link.label}
      </Link>
    </div>
  )
}

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/**
 * Menu sur ordinateur : chaque rubrique ouvre un panneau au survol (court délai pour ne pas s'ouvrir en passant), au clic
 * et au clavier (Entrée, Échap pour fermer). Un seul panneau ouvert ; il se ferme en quittant le menu ou en changeant de
 * page. Le header qui l'accueille doit être positionné (relative ou sticky).
 */
export function MegaMenu({ linkStyle, linkClass }: { linkStyle?: CSSProperties; linkClass?: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const buttons = useRef<Array<HTMLButtonElement | null>>([])
  const root = useRef<HTMLDivElement | null>(null)
  const { pathname } = useLocation()
  const base = useId()

  useEffect(() => setOpen(null), [pathname])
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      buttons.current[open]?.focus()
      setOpen(null)
    }
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(null)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => (document.removeEventListener('keydown', onKey), document.removeEventListener('pointerdown', onDown))
  }, [open])

  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(fn, ms)
  }

  return (
    <div
      ref={root}
      className="hide-md"
      style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.2vw, 14px)' }}
      onMouseLeave={() => later(() => setOpen(null), 180)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setOpen(null)}
    >
      {SECTIONS.map((s, i) =>
        s.to ? (
          <Link key={s.label} to={s.to} className={linkClass} style={linkStyle} onMouseEnter={() => later(() => setOpen(null), 120)}>
            {s.label}
          </Link>
        ) : (
          <div key={s.label} onPointerEnter={(e) => e.pointerType === 'mouse' && later(() => setOpen(i), open === null ? 90 : 0)}>
            <button
              ref={(el) => void (buttons.current[i] = el)}
              type="button"
              className={`mega-trigger${open === i ? ' is-open' : ''}`}
              aria-expanded={open === i}
              aria-controls={`${base}-${i}`}
              onClick={() => setOpen(open === i ? null : i)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 44, padding: '0 12px', border: 'none', borderRadius: 999, background: open === i ? BAI.ownerLight : 'transparent', color: open === i ? BAI.owner : BAI.ink, font: 'inherit', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}
            >
              {s.label}
              <Chevron open={open === i} />
            </button>
            {open === i ? (
              <div
                id={`${base}-${i}`}
                className="mega-panel"
                style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, color: BAI.ink }}
                onMouseEnter={() => window.clearTimeout(timer.current)}
              >
                <Columns section={s} onPick={() => setOpen(null)} />
                <Foot section={s} onPick={() => setOpen(null)} />
              </div>
            ) : null}
          </div>
        ),
      )}
    </div>
  )
}

/**
 * Menu sur téléphone : bouton « Menu », panneau qui glisse depuis la droite par-dessus la page (assombrie derrière),
 * une rubrique dépliée à la fois, la connexion en bas. Rendu à la racine du document pour ne jamais hériter de la mise
 * en page de l'en-tête. Échap, la croix ou un toucher sur la page ferment.
 */
export function MobileMenu({ account, cta }: { account: ReactNode; cta: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [section, setSection] = useState<number | null>(null)
  const { pathname } = useLocation()
  const button = useRef<HTMLButtonElement | null>(null)
  const close = useRef<HTMLButtonElement | null>(null)
  const panel = useRef<HTMLDivElement | null>(null)
  const base = useId()

  const shut = () => {
    setOpen(false)
    button.current?.focus()
  }

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    close.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return shut()
      // Le clavier reste dans le panneau tant qu'il est ouvert.
      if (e.key !== 'Tab' || !panel.current) return
      const f = [...panel.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const drawer = open
    ? createPortal(
        <div className="drawer-root">
          <div className="drawer-backdrop" aria-hidden onClick={shut} style={{ background: `${BAI.night}73` }} />
          <div ref={panel} id={`${base}-menu`} role="dialog" aria-modal="true" aria-label="Menu" className="drawer mobile-menu" style={{ background: BAI.surface, color: BAI.ink }}>
            <div style={{ height: 'clamp(64px, 8vw, 72px)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '0 16px 0 20px', borderBottom: `1px solid ${BAI.divider}` }}>
              <Logo size={24} />
              <button ref={close} type="button" aria-label="Fermer le menu" onClick={shut} style={{ width: 44, height: 44, borderRadius: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${BAI.borderStrong}`, background: BAI.surface, color: BAI.ink, cursor: 'pointer' }}>
                <Close size={18} />
              </button>
            </div>
            <nav aria-label="Menu du site" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 16px', overscrollBehavior: 'contain' }}>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {SECTIONS.map((s, i) => (
                  <li key={s.label} style={{ borderBottom: `1px solid ${BAI.divider}` }}>
                    {s.to ? (
                      <Link to={s.to} onClick={() => setOpen(false)} style={{ ...linkReset, display: 'flex', alignItems: 'center', minHeight: 56, fontWeight: 600, fontSize: 17, color: BAI.ink }}>
                        {s.label}
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          aria-expanded={section === i}
                          aria-controls={`${base}-s${i}`}
                          onClick={() => setSection(section === i ? null : i)}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56, padding: 0, border: 'none', background: 'none', font: 'inherit', fontWeight: 600, fontSize: 17, color: section === i ? BAI.owner : BAI.ink, cursor: 'pointer', textAlign: 'left' }}
                        >
                          {s.label}
                          <Chevron open={section === i} />
                        </button>
                        {section === i ? (
                          <div id={`${base}-s${i}`} className="panel-in" style={{ paddingBottom: 12 }}>
                            <Columns section={s} onPick={() => setOpen(false)} />
                            <Foot section={s} onPick={() => setOpen(false)} />
                          </div>
                        ) : null}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 20px calc(14px + env(safe-area-inset-bottom))', borderTop: `1px solid ${BAI.divider}` }} onClick={() => setOpen(false)}>
              {account}
              {cta}
            </div>
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <>
      <button
        ref={button}
        type="button"
        className="only-md menu-btn"
        aria-expanded={open}
        aria-controls={`${base}-menu`}
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${BAI.borderStrong}`, background: BAI.surface, color: BAI.ink, font: 'inherit', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        Menu
      </button>
      {drawer}
    </>
  )
}
