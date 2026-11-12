import { ADD_PARKING_PATH } from '../lib/contract'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ProductTour, type TourStep } from '../components/ProductTour'
import { CountUp } from '../components/CountUp'
import { Link } from 'react-router-dom'
import './home.css'
import { Logo } from '../components/Logo'
import { MegaMenu, MobileMenu } from '../components/SiteMenu'
import { VideoButton } from '../components/VideoDialog'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../lib/auth'
import { CONTACT_EMAIL, LAUNCH_OFFER, MONTHLY_PRICE, MONTHLY_PRICE_CENTS, YEARLY_PRICE_CENTS, PARKING_PRICE, PRICE_UNIT, YEARLY_PRICE, priceLabel, priceText } from '../config'
import { HeroProduct } from '../components/HeroProduct'
import { ALL_FEATURES, AUTOMATIONS, COMPARE, TRUST } from '../content/accueil'
import { AVIS } from '../content/avis'
import { SIMULATEURS } from '../content/modeles'
import { CALLBACK_PROMISE, INCLUS } from '../content/inclus'

/**
 * Accueil, direction « Feuille et stylo » (docs/design/direction-artistique.md), fait pour être survolé : la vraie
 * interface et le fil de ce que Bailio vient de faire (HeroProduct), le temps rendu (démarches par an), la visite des vrais
 * écrans, les automatismes, la loi appliquée à votre bail, le prix calculé selon vos logements, puis les questions.
 * Photos de Montpellier fournies par l'éditeur (public/accueil/credits.json).
 */

type Kind = 'VIDE' | 'MEUBLE' | 'GARAGE'

const KINDS: Array<{ id: Kind; label: string; title: string }> = [
  { id: 'VIDE', label: 'Un logement vide', title: 'Logement vide' },
  { id: 'MEUBLE', label: 'Un logement meublé', title: 'Logement meublé' },
  { id: 'GARAGE', label: 'Un garage ou une place', title: 'Garage ou place' },
]

const euros = (n: number) => `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`

/** Ce que la loi fixe pour chaque type de location (loi du 6 juillet 1989 ; Code civil pour un garage). */
function termsFor(kind: Kind, rent: number): Array<[string, string]> {
  if (kind === 'MEUBLE')
    return [
      ['Durée', 'Un an, renouvelé'],
      ['Dépôt de garantie', `${euros(rent * 2)} au plus`],
      ['Votre préavis', 'Trois mois avant la fin'],
      ['Préavis du locataire', 'Un mois'],
    ]
  if (kind === 'GARAGE')
    return [
      ['Durée', 'Libre, un an par défaut'],
      ['Dépôt de garantie', `Libre, ${euros(rent)} proposé`],
      ['Votre préavis', 'Celui du contrat, un mois'],
      ['Préavis du locataire', 'Le même, un mois'],
    ]
  return [
    ['Durée', 'Trois ans, renouvelé'],
    ['Dépôt de garantie', `${euros(rent)} au plus`],
    ['Votre préavis', 'Six mois avant la fin'],
    ['Préavis du locataire', 'Trois mois, un en zone tendue'],
  ]
}

const FAQ: Array<[string, string]> = [
  ['Le bail est-il valable ?', 'Oui, une fois complet et signé. Il suit, rubrique par rubrique, le contrat type officiel dans sa version du 1er octobre 2026, et Bailio vous dit ce qu’il manque avant la signature.'],
  ['J’ai déjà un locataire.', 'Prenez votre bail signé en photo : Bailio le lit, vous vérifiez, et le suivi démarre.'],
  ['Mon locataire doit-il s’inscrire ?', 'Non. Il reçoit ses quittances par email et un lien pour envoyer son attestation d’assurance.'],
  ['Et la signature ?', 'En ligne, avec un code envoyé par email, ou sur papier si vous préférez. Le PDF signé garde sa preuve.'],
  ['Un garage, une SCI ?', 'Les deux. Garage loué seul, location à plusieurs, SCI familiale : la durée et les règles suivent.'],
  ['Qui touche le loyer ?', 'Vous, directement. Bailio ne passe jamais par votre argent ni par le dépôt de garantie.'],
  ['Où sont mes données ?', 'Sur un serveur en Suisse. Elles ne sont ni revendues, ni confiées à une intelligence artificielle.'],
  ['J’utilise déjà un autre logiciel.', `Prenez vos baux en photo : Bailio reprend loyers, dates et locataires, et le suivi repart. ${CALLBACK_PROMISE} Nous faisons la reprise avec vous.`],
  ['Y a-t-il des options payantes ?', 'Non. Signature électronique, états des lieux, relances, révision du loyer et aide à la déclaration des revenus sont compris dans le même prix.'],
  ['Et si j’arrête ?', 'Vous exportez tout en un clic, puis vous supprimez votre compte. Sans engagement.'],
  ['Je suis locataire, c’est pour moi ?', 'Bailio sert aux propriétaires. Pour monter votre dossier, utilisez DossierFacile (dossierfacile.logement.gouv.fr), le service gratuit de l’État. Si votre propriétaire utilise Bailio, il vous envoie un lien : rien à créer.'],
]

const LEGAL = [
  { to: '/guides', label: 'Guides' },
  { to: '/modeles', label: 'Modèles gratuits' },
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/demo', label: 'Essayer la démo' },
  { to: '/changer-pour-bailio', label: 'Changer pour Bailio' },
  { to: '/avis', label: 'Avis' },
  { to: '/espace-locataire', label: 'Espace locataire' },
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/conditions', label: 'Conditions' },
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/prix-et-remboursement', label: 'Prix et remboursement' },
  { to: '/cgv', label: 'CGV' },
  { to: '/accessibilite', label: 'Accessibilité' },
  { to: '/securite', label: 'Sécurité' },
]

/** Les couleurs de la page viennent des tokens BAI (une seule source), passées au CSS en variables. */
const VARS = {
  '--bg': BAI.surface,
  '--stone': BAI.bg,
  '--ink': BAI.ink,
  '--muted': BAI.inkSoft,
  '--owner': BAI.owner,
  '--owner-hover': BAI.ownerHover,
  '--owner-light': BAI.ownerLight,
  '--night': BAI.night,
  '--on-dark': BAI.onDark,
  '--accent-light': BAI.accentLight,
  '--green': BAI.green,
  '--accent': BAI.accent,
  '--accent-ink': BAI.accentInk,
  '--sky': BAI.sky,
  '--peach': BAI.peach,
  '--cta': BAI.cta,
  '--cta-hover': BAI.ctaHover,
  '--cta-ink': BAI.ctaInk,
  '--accent-soft': BAI.accentSoft,
  '--paper': BAI.surface,
  '--line': BAI.divider,
  '--display': BAI.fontDisplay,
  '--text': BAI.fontBody,
} as CSSProperties

/** Flèche des boutons d'action (trait fin, bouts arrondis). */
function Arrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/** Coche dans une pastille, à la place des puces. */
function Check() {
  return (
    <span className="tick" aria-hidden>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5 10 17 19 7" />
      </svg>
    </span>
  )
}

/** Visite animée du produit : vraies captures de l'application sur ordinateur (compte d'exemple), qui défilent seules. */
const TOUR: TourStep[] = [
  { id: 'decrire', tab: 'Décrire', img: 'tunnel', path: 'bailio.fr/commencer', alt: 'Écran « Votre logement est… » avec deux choix, Vide ou Meublé, étape 1 sur 5', spot: { x: 37.9, y: 28.3, w: 50, h: 26.1, label: 'Une question à la fois : Bailio remplit le reste' } },
  { id: 'bail', tab: 'Le bail', img: 'bail', alt: 'Page d’un bail signé : locataire, adresse, dates, loyers reçus avec leurs quittances, et les actions du bail', spot: { x: 21.1, y: 8.5, w: 40, h: 11, label: 'Le contrat type officiel, signé en ligne' } },
  { id: 'jour', tab: 'Aujourd’hui', img: 'today', alt: 'Écran « Bonjour Claire » : un loyer en retard avec la relance déjà rédigée, une fin de bail, l’état des lieux à faire et les prochaines échéances', spot: { x: 21.1, y: 36.8, w: 46.4, h: 22.2, label: 'Un loyer en retard : la relance est déjà rédigée' } },
  { id: 'mois', tab: 'Chaque mois', img: 'relances', alt: 'Bail avec un loyer en retard : quittance par email et relance automatique d’un loyer impayé activées', spot: { x: 22.8, y: 66.2, w: 43.5, h: 11, label: 'Relance à J+3, second rappel à J+8, mise en demeure à J+15' } },
  { id: 'candidats', tab: 'Candidats', img: 'candidats', alt: 'Liste des candidats : dossier solide ou à compléter, avec les raisons', spot: { x: 21.1, y: 13.3, w: 50.4, h: 39.7, label: 'Classés sur les ressources, la garantie et les pièces' } },
  { id: 'bord', tab: 'Tableau de bord', img: 'patrimoine', alt: 'Tableau de bord : loyers attendus chaque mois, ce qu’il reste, logements à surveiller', spot: { x: 21.1, y: 42.8, w: 75, h: 16.9, label: 'Le loyer en retard et le bail à renouveler, en tête' } },
]

/** Démarches d'un logement loué sur une année, que Bailio prépare ; la déclaration des revenus compte une fois. */
const YEARLY = [
  { what: 'Quittances de loyer', each: 12 },
  { what: 'Révision du loyer (IRL)', each: 1 },
  { what: 'Attestation d’assurance du locataire', each: 1 },
  { what: 'Régularisation des charges', each: 1 },
] as const
const COUNTS = [1, 2, 3, 5] as const

function Tour() {
  return (
    <section className="tour" data-section aria-labelledby="tour-title">
      <div className="tour-intro">
        <h2 id="tour-title" data-in>
          Bailio <em>en action.</em>
        </h2>
        <p data-in style={{ ['--i' as string]: 1 }}>
          Captures de l’application sur ordinateur, compte d’exemple. Survolez pour mettre en pause.
        </p>
      </div>
      <div className="tour-panel" data-in style={{ ['--i' as string]: 2 }}>
        <ProductTour steps={TOUR} label="Étapes de la visite" />
      </div>
    </section>
  )
}

function Yearly() {
  const [n, setN] = useState<number>(1)
  const total = YEARLY.reduce((a, r) => a + r.each * n, 0) + 1
  return (
    <section className="year" data-section aria-labelledby="year-title">
      <div className="year-intro">
        <h2 id="year-title" data-in>
          <span className="year-count" aria-live="polite">
            <CountUp value={total} /> démarches
          </span>{' '}
          par an, <em>préparées pour vous.</em>
        </h2>
        <div className="year-pick" data-in style={{ ['--i' as string]: 1 }}>
          <span id="year-n" className="live-label">
            Logements loués
          </span>
          <div className="year-buttons" role="group" aria-labelledby="year-n">
            {COUNTS.map((c) => (
              <button key={c} type="button" aria-pressed={n === c} onClick={() => setN(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
      <dl className="year-list" data-in style={{ ['--i' as string]: 2 }}>
        {YEARLY.map((r) => (
          <div key={r.what}>
            <dt>{r.what}</dt>
            <dd>{r.each * n}</dd>
          </div>
        ))}
        <div>
          <dt>Déclaration des revenus, cases à recopier</dt>
          <dd>1</dd>
        </div>
        <div className="year-plus">
          <dt>Relances si un loyer manque</dt>
          <dd>à vos dates</dd>
        </div>
      </dl>
    </section>
  )
}

/** Prix selon le nombre de logements, comparé à une agence (7 % d'un loyer de 750 €, hypothèse affichée). */
const AGENCY_RATE = 0.07
const SAMPLE_RENT = 750
const eur = (cents: number) => (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'

function PriceCalc() {
  const [n, setN] = useState(3)
  const agency = Math.round(n * SAMPLE_RENT * AGENCY_RATE * 12 * 100)
  const year = n * YEARLY_PRICE_CENTS
  return (
    <section className="calc" data-section aria-labelledby="calc-title">
      <div className="calc-head">
        <h2 id="calc-title" data-in>
          Votre prix, <em>en un geste.</em>
        </h2>
        <label htmlFor="calc-n" className="live-label">
          Logements loués : <strong className="calc-n">{n}</strong>
        </label>
        <input id="calc-n" type="range" min={1} max={30} value={n} onChange={(e) => setN(Number(e.target.value))} aria-valuetext={`${n} logement${n > 1 ? 's' : ''}`} />
      </div>
      <dl className="calc-out" aria-live="polite">
        <div className="calc-me">
          <dt>Bailio, à l’année</dt>
          <dd>{eur(year)}</dd>
          <dd className="calc-sub">soit {eur(Math.round(year / 12))} par mois</dd>
        </div>
        <div>
          <dt>Bailio, au mois</dt>
          <dd>{eur(n * MONTHLY_PRICE_CENTS * 12)}</dd>
          <dd className="calc-sub">par an</dd>
        </div>
        <div>
          <dt>Une agence</dt>
          <dd>{eur(agency)}</dd>
          <dd className="calc-sub">par an, à 7 % d’un loyer de {SAMPLE_RENT} €</dd>
        </div>
      </dl>
    </section>
  )
}

const monthFr = (d: string) => new Date(`${d}-01T00:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Outils gratuits, sans compte : la porte d'entrée de ceux qui arrivent par Google. */
function FreeTools() {
  return (
    <section className="tools" data-section aria-labelledby="tools-title">
      <h2 id="tools-title" data-in>
        Outils gratuits, <em>sans compte.</em>
      </h2>
      <ul className="tools-list" data-in style={{ ['--i' as string]: 1 }}>
        {SIMULATEURS.map((x) => (
          <li key={x.path}>
            <Link to={x.path}>
              <strong>{x.name}</strong>
              <span>{x.lead}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/modeles" className="tools-more" data-in>
        Tous les outils et modèles de lettres
      </Link>
    </section>
  )
}

const stagger = (i: number) => ({ ['--i' as string]: i }) as CSSProperties

/** Six automatismes : ce qui tourne sans vous. */
function Automations() {
  return (
    <section className="autos" data-section aria-labelledby="autos-title">
      <h2 id="autos-title" data-in>
        Six tâches qui <em>se font seules.</em>
      </h2>
      <div className="autos-grid">
        {AUTOMATIONS.map((a, j) => (
          <article key={a.title} className="auto" data-in style={stagger(j % 3)}>
            <span className="auto-n" aria-hidden />
            <h3>{a.title}</h3>
            <p>{a.text}</p>
            <Link to={a.to} className="auto-more">
              En savoir plus
              <span className="sr-only"> sur : {a.title}</span>
              <Arrow />
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

/** Toutes les fonctionnalités, toutes comprises dans le prix. */
function AllFeatures() {
  return (
    <section className="feats" data-section aria-labelledby="feats-title">
      <div className="feats-head">
        <h2 id="feats-title" data-in>
          Toutes les fonctionnalités. <em>Toutes incluses.</em>
        </h2>
        <Link to="/fonctionnalites" className="btn btn--paper" data-in style={stagger(1)}>
          Voir les fonctionnalités
          <Arrow />
        </Link>
      </div>
      <ul className="feats-list" data-in style={stagger(1)}>
        {ALL_FEATURES.map((f) => (
          <li key={f}>
            <Check />
            {f}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Tableur, agence ou Bailio : vrai tableau, colonne Bailio mise en avant, défilement horizontal sur téléphone. */
function Compare() {
  const cell = (v: string) => (v === 'PRICE' ? priceText() : v)
  return (
    <section className="cmp" data-section aria-labelledby="cmp-title">
      <h2 id="cmp-title" data-in>
        Tableur, agence ou <em>Bailio</em> : que choisir ?
      </h2>
      <div className="cmp-scroll" role="region" aria-labelledby="cmp-title" tabIndex={0} data-in style={stagger(1)}>
        <table>
          <caption className="sr-only">Comparaison du tableur, de l’agence et de Bailio</caption>
          <thead>
            <tr>
              <th scope="col">Ce qui compte</th>
              {COMPARE.columns.map((c) => (
                <th key={c} scope="col" className={c === 'Bailio' ? 'cmp-me' : undefined}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.values.map((v, j) => (
                  <td key={j} className={COMPARE.columns[j] === 'Bailio' ? 'cmp-me' : undefined}>
                    {cell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="cmp-hint" data-in style={stagger(1)}>
        Faites glisser le tableau pour voir toutes les colonnes.
      </p>
    </section>
  )
}

/** Bandeau de confiance, avant le pied de page. */
function Trust() {
  return (
    <section className="trust" aria-label="Nos engagements">
      <ul>
        {TRUST.map((t) => (
          <li key={t.title}>
            <strong>{t.title}</strong>
            <span>{t.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Avis de vrais propriétaires (content/avis.ts) ; rien tant qu'il n'y en a pas. */
function Reviews() {
  if (!AVIS.length) return null
  return (
    <section className="reviews" data-section aria-labelledby="reviews-title">
      <h2 id="reviews-title" data-in>
        Ils louent <em>avec Bailio.</em>
      </h2>
      <div className="reviews-list">
        {AVIS.slice(0, 3).map((a, j) => (
          <figure key={a.name + a.date} className="review" data-in style={{ ['--i' as string]: j + 1 }}>
            <blockquote>{a.text}</blockquote>
            <figcaption>
              {a.url ? (
                <a href={a.url} rel="noopener noreferrer" target="_blank">
                  {a.name}
                </a>
              ) : (
                <strong>{a.name}</strong>
              )}
              <span>
                {a.role} · {monthFr(a.date)}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const { user } = useAuth()
  const root = useRef<HTMLDivElement>(null)
  const [kind, setKind] = useState<Kind>('VIDE')
  const [rent, setRent] = useState(780)
  const current = KINDS.find((k) => k.id === kind)!
  const [bar, setBar] = useState({ scrolled: false, cta: false })

  // En-tête collant : un trait dès qu'on descend, et le bouton « Créer mon bail » (aussi sur téléphone) une fois celui du
  // haut de page sorti de l'écran. Un seul bouton orange visible à la fois.
  useEffect(() => {
    const update = () => {
      const hero = root.current?.querySelector('.hero-actions')
      const r = hero?.getBoundingClientRect()
      const next = { scrolled: window.scrollY > 12, cta: !r || r.bottom < 72 }
      setBar((b) => (b.scrolled === next.scrolled && b.cta === next.cta ? b : next))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  // Entrées des sections : seulement quand le script tourne, jamais de contenu caché sinon.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const previous = document.body.style.background
    document.body.style.background = BAI.surface
    if (typeof IntersectionObserver === 'undefined') return () => void (document.body.style.background = previous)
    el.classList.add('hm-js')
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), reveal.unobserve(e.target))),
      { threshold: 0.15 },
    )
    el.querySelectorAll('[data-section]').forEach((s) => reveal.observe(s))
    return () => {
      document.body.style.background = previous
      reveal.disconnect()
    }
  }, [])

  return (
    <div className="hm" ref={root} style={VARS}>
      <header className={`bar${bar.scrolled ? ' bar--sc' : ''}${bar.cta ? ' bar--cta' : ''}`}>
        <Logo size={28} />
        <nav aria-label="Menu">
          <MegaMenu linkClass="bar-link" />
          {user ? (
            <Link to="/espace" className="bar-link bar-login hide-md">
              Mon espace
            </Link>
          ) : (
            <Link to="/connexion" className="bar-link bar-login hide-md">
              Se connecter
            </Link>
          )}
          <MobileMenu
            account={
              <Link to={user ? '/espace' : '/connexion'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 52, borderRadius: 999, border: `1.5px solid ${BAI.borderStrong}`, color: BAI.ink, fontWeight: 600, textDecoration: 'none' }}>
                {user ? 'Mon espace' : 'Se connecter'}
              </Link>
            }
            cta={null}
          />
          <Link to="/commencer" className="btn btn--sm bar-cta" tabIndex={bar.cta ? 0 : -1} aria-hidden={!bar.cta}>
            Créer mon bail
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero2" data-section aria-labelledby="hero-title">
          <div className="hero2-text">
            <h1 id="hero-title">
              La gestion locative des propriétaires, <em>sans agence.</em>
            </h1>
            <p className="hero-lead">Quittances envoyées seules, impayés relancés, déclaration réduite aux cases à recopier.</p>
            <div className="hero-actions">
              <Link to="/commencer" className="btn">
                Créer mon bail gratuit
                <Arrow />
              </Link>
              <VideoButton className="hero-link hero-video">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
                  <circle cx="12" cy="12" r="11" fill="currentColor" opacity=".18" />
                  <path d="M10 8.5v7l6-3.5z" fill="currentColor" />
                </svg>
                Voir la vidéo, 1 min
              </VideoButton>
            </div>
            <p className="hero2-more">
              <Link to="/demo">Essayer la démo sans compte</Link>
              <Link to="/importer">J’ai déjà un bail</Link>
            </p>
            <ul className="hero2-proof">
              <li>Contrat type officiel</li>
              <li>Loi de 1989 vérifiée</li>
              <li>{priceText()}</li>
            </ul>
          </div>
          <HeroProduct />
        </section>

        <Yearly />

        <Tour />

        <Automations />

        <section className="live" data-section aria-labelledby="live-title">
          <div className="live-form">
            <h2 id="live-title" data-in style={{ ['--i' as string]: 0 }}>
              Ce que la loi impose <em>à votre bail.</em>
            </h2>
            <p className="live-lead" data-in style={{ ['--i' as string]: 1 }}>
              Dites-nous ce que vous louez et à quel prix : vous voyez tout de suite la durée du bail, le dépôt de garantie maximum et les préavis. Bailio les reprend ensuite dans votre bail.
            </p>
            <div className="live-step" data-in style={{ ['--i' as string]: 2 }}>
              <span className="live-label" id="live-kind">
                Vous louez
              </span>
              <div className="tabs-live" role="group" aria-labelledby="live-kind">
                {KINDS.map((k) => (
                  <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rent" data-in style={{ ['--i' as string]: 2 }}>
              <label htmlFor="live-rent" className="live-label">
                Votre loyer, sans les charges
              </label>
              <span className="rent-field">
                <input
                  id="live-rent"
                  inputMode="numeric"
                  value={rent ? String(rent) : ''}
                  onChange={(e) => setRent(Math.min(99999, Number(e.target.value.replace(/\D/g, '')) || 0))}
                  aria-describedby="live-terms"
                />
                <span aria-hidden>€ par mois</span>
              </span>
            </div>
            <div className="live-actions" data-in style={{ ['--i' as string]: 3 }}>
              <Link to={kind === 'GARAGE' ? '/inscription' : '/commencer'} state={kind === 'GARAGE' ? { from: ADD_PARKING_PATH } : undefined} className="btn">
                Créer ce bail
                <Arrow />
              </Link>
              <Link to="/importer" className="btn btn--line">
                J’ai déjà un bail signé
              </Link>
            </div>
          </div>
          <div className="live-visual">
            <div className="live-photo">
              <img src="/accueil/comedie.webp" alt="La fontaine des Trois Grâces devant l’opéra Comédie, à Montpellier" width={960} height={1200} loading="lazy" decoding="async" />
            </div>
            <div className="terms-block fold fold--ear" data-in style={{ ['--i' as string]: 2 }}>
              <p className="terms-title">{current.title} : ce que dit la loi</p>
              <dl className="terms" id="live-terms" aria-live="polite">
                {termsFor(kind, rent).map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="terms-note">
                Dépôt de garantie : somme versée à l’entrée, rendue à la sortie. Préavis : délai pour prévenir avant la fin du bail.
                {kind === 'VIDE' ? ' Zone tendue : grande ville où les logements manquent.' : ''}
              </p>
            </div>
          </div>
        </section>

        <AllFeatures />

        <Reviews />

        <section id="tarifs" className="plans" aria-label="Tarif">
          <div className="plan plan--free" data-section>
            <h2>Premier bail</h2>
            <p className="plan-for">Pour louer un logement, une fois.</p>
            <div className="plan-foot">
              <span className="plan-price">0 €</span>
              <Link to="/commencer" className="btn">
                Créer mon bail
                <Arrow />
              </Link>
            </div>
          </div>
          <div className="plan plan--full fold fold--lg fold--ear" data-section>
            <h2>Tout inclus</h2>
            <p className="plan-for">Pour suivre la location, mois après mois.</p>
            <p className="plan-note">
              {LAUNCH_OFFER}. Ensuite {YEARLY_PRICE} par an et par logement ({PARKING_PRICE} par mois pour un garage), sans engagement ni option payante ; un email vous prévient avant tout paiement.
            </p>
            <ul className="plan-list">
              {INCLUS.map((x) => (
                <li key={x}>
                  <Check />
                  {x}
                </li>
              ))}
            </ul>
            <div className="plan-foot">
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="plan-price">{priceLabel()}</span>
                {MONTHLY_PRICE ? <span>{PRICE_UNIT}</span> : null}
              </span>
              <Link to="/commencer" className="btn btn--paper">
                Essayer
                <Arrow />
              </Link>
            </div>
          </div>
        </section>

        <PriceCalc />

        <Compare />

        <FreeTools />

        <section className="faq" data-section aria-labelledby="faq-title">
          <h2 id="faq-title" data-in>
            Questions
          </h2>
          <div className="faq-list" data-in style={{ ['--i' as string]: 1 }}>
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>
                  <span>{q}</span>
                  <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden focusable="false">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="last" data-section aria-labelledby="last-title">
          <div className="last-photo">
            <img src="/accueil/peyrou.webp" alt="La promenade du Peyrou, la statue de Louis XIV et le château d’eau, à Montpellier" width={1920} height={1080} loading="lazy" decoding="async" />
          </div>
          <div className="last-block fold fold--lg fold--ear">
            <h2 id="last-title" data-in>
              Votre premier bail <em>est offert.</em>
            </h2>
            <p data-in style={{ ['--i' as string]: 1 }}>
              Cinq minutes de questions pour le préparer. Bailio vous dit ensuite ce qu’il manque (diagnostics, équipements) avant de le faire signer.
            </p>
            <span data-in style={{ ['--i' as string]: 2 }}>
              <Link to="/commencer" className="btn">
                Créer mon bail
                <Arrow />
              </Link>
            </span>
          </div>
        </section>

        <Trust />
      </main>

      <footer className="foot">
        <div className="foot-menu">
          <Logo size={28} onDark />
          <nav aria-label="Pied de page">
            <ul>
              <li>
                <Link to="/commencer">Créer mon bail</Link>
              </li>
              <li>
                <Link to="/importer">Importer un bail</Link>
              </li>
              <li>
                <Link to="/tarifs">Tarifs</Link>
              </li>
              <li>
                <Link to="/connexion">Se connecter</Link>
              </li>
              <li>
                <Link to="/contact">Contact</Link>
              </li>
            </ul>
          </nav>
          <div className="foot-info">
            <p>
              Une question ?<br />
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </p>
            <p>
              Serveur en Suisse.
              <br />
              Aucune donnée revendue.
            </p>
          </div>
          <div className="foot-legal">
            <ul>
              {LEGAL.map((l) => (
                <li key={l.to}>
                  <Link to={l.to}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="foot-photo">
          <img src="/accueil/rue-foch.webp" alt="" width={960} height={1200} loading="lazy" decoding="async" />
        </div>
      </footer>
    </div>
  )
}
