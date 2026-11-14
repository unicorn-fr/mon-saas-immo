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
import { CONTACT_EMAIL, LAUNCH_OFFER, MONTHLY_PRICE, MONTHLY_PRICE_CENTS, YEARLY_PRICE_CENTS, PARKING_PRICE, priceText } from '../config'
import { HeroProduct } from '../components/HeroProduct'
import { AUTOMATIONS, COMPARE, GUARANTEES, TRUST } from '../content/accueil'
import { AVIS } from '../content/avis'
import { MODELES, SIMULATEURS } from '../content/modeles'
import { CALLBACK_PROMISE, INCLUS } from '../content/inclus'

/**
 * Accueil, direction « Feuille et stylo » (docs/design/direction-artistique.md), fait pour être survolé : la vraie
 * interface et le fil de ce que Bailio vient de faire (HeroProduct), le temps rendu (démarches par an), la visite des vrais
 * écrans, les automatismes, la loi appliquée à votre bail, le prix calculé selon vos logements, puis les questions.
 * Photos de Montpellier fournies par l'éditeur (public/accueil/credits.json).
 */

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
  '--green-light': BAI.greenLight,
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
  { id: 'jour', tab: 'Aujourd’hui', img: 'today', alt: 'Écran « Bonjour Claire » : loyers du mois, un loyer en retard avec la relance prête, les raccourcis et l’agenda', spot: { x: 20.6, y: 40.8, w: 48.1, h: 17.5, label: 'Chaque matin, ce qui compte est en haut' } },
  { id: 'logements', tab: 'Logements', img: 'logements', alt: 'Liste des logements : loués, libres, loyer en retard, avec le loyer de chacun', spot: { x: 20.6, y: 18, w: 76.7, h: 12, label: 'Vos logements, leur état d’un coup d’œil' } },
  { id: 'bail', tab: 'Bail', img: 'bail', alt: 'Page d’un bail signé : locataire, adresse, dates, loyers reçus avec leurs quittances', spot: { x: 20.6, y: 6.5, w: 40, h: 9, label: 'Le contrat type officiel, signé en ligne' } },
  { id: 'loyers', tab: 'Loyers', img: 'quittances', alt: 'Bail avec la quittance par email activée dès que le loyer est noté reçu', spot: { x: 22.3, y: 37.4, w: 45.1, h: 8.6, label: 'Le loyer arrive, la quittance part' } },
  { id: 'banque', tab: 'Banque', img: 'releve', alt: 'Dépôt du relevé bancaire : CSV ou OFX, les loyers sont reconnus', spot: { x: 20.6, y: 41.1, w: 76.7, h: 21.3, label: 'Votre relevé, les loyers reconnus seuls' } },
  { id: 'relances', tab: 'Relances', img: 'relances', alt: 'Relance automatique d’un loyer impayé activée sur le bail', spot: { x: 22.3, y: 60, w: 45.1, h: 10.8, label: 'J+3, J+8, J+15, à vos dates' } },
  { id: 'candidats', tab: 'Candidats', img: 'candidats', alt: 'Liste des candidats : dossier solide ou à compléter, avec les raisons', spot: { x: 20.6, y: 13.3, w: 52.1, h: 39.5, label: 'Classés sur des critères permis, jamais à votre place' } },
  { id: 'impots', tab: 'Impôts', img: 'impots', alt: 'Déclaration des revenus locatifs : régime, cases à recopier, date limite', spot: { x: 20.6, y: 26, w: 76.7, h: 36, label: 'Les cases à recopier, déjà calculées' } },
  { id: 'patrimoine', tab: 'Patrimoine', img: 'patrimoine', alt: 'Tableau de bord : loyers attendus chaque mois, ce qu’il reste, logements à surveiller', spot: { x: 20.6, y: 36.5, w: 76.7, h: 16.6, label: 'Ce qui demande votre attention, en tête' } },
]

/**
 * Avant / après (une année, d'après le nombre de logements) : chaque démarche est une case. Sans Bailio, tout se fait à
 * la main ; avec Bailio, il ne reste que les décisions à valider (révision, régularisation, déclaration). Les relances ne
 * sont pas comptées : elles dépendent des retards.
 */
const BY_HAND = [
  { what: 'Quittances', each: 12 },
  { what: 'Avis d’échéance', each: 12 },
  { what: 'Révision du loyer', each: 1 },
  { what: 'Attestation d’assurance', each: 1 },
  { what: 'Régularisation des charges', each: 1 },
] as const
const TO_VALIDATE = [
  { what: 'Révision du loyer', each: 1 },
  { what: 'Régularisation des charges', each: 1 },
] as const
const COUNTS = [1, 2, 3, 5] as const

function Tour() {
  return (
    <section className="tour" data-section aria-labelledby="tour-title">
      <div className="tour-intro">
        <p className="eyebrow" aria-hidden>Le produit</p>
        <h2 id="tour-title" data-in>
          Bailio <em>en action.</em>
        </h2>
        <p data-in style={{ ['--i' as string]: 1 }}>
          Captures réelles d’un compte d’exemple.
        </p>
      </div>
      <div className="tour-panel" data-in style={{ ['--i' as string]: 2 }}>
        <ProductTour steps={TOUR} label="Étapes de la visite" />
      </div>
    </section>
  )
}

function Yearly() {
  const [n, setN] = useState<number>(3)
  const before = BY_HAND.reduce((a, r) => a + r.each * n, 0) + 1
  const after = TO_VALIDATE.reduce((a, r) => a + r.each * n, 0) + 1
  return (
    <section className="ba" data-section aria-labelledby="ba-title">
      <div className="ba-head">
        <p className="eyebrow" aria-hidden>Votre année</p>
        <h2 id="ba-title" data-in>
          Votre année de propriétaire, <em>avant et après.</em>
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
      <div className="ba-grid" aria-live="polite">
        <div className="ba-col ba-col--before" data-in>
          <p className="ba-label">À la main</p>
          <p className="ba-num">
            <CountUp value={before} /> démarches
          </p>
          <div className="ba-cells" aria-hidden>
            {Array.from({ length: Math.min(before, 160) }, (_, i) => (
              <span key={i} style={{ ['--k' as string]: i }} />
            ))}
          </div>
          <ul className="ba-list">
            {BY_HAND.map((r) => (
              <li key={r.what}>
                {r.what} <strong>{r.each * n}</strong>
              </li>
            ))}
            <li>
              Déclaration des revenus <strong>1</strong>
            </li>
          </ul>
        </div>
        <div className="ba-col ba-col--after" data-in style={{ ['--i' as string]: 1 }}>
          <p className="ba-label">Avec Bailio</p>
          <p className="ba-num">
            <CountUp value={after} /> décisions
          </p>
          <div className="ba-cells" aria-hidden>
            {Array.from({ length: after }, (_, i) => (
              <span key={i} style={{ ['--k' as string]: i * 6 }} />
            ))}
          </div>
          <ul className="ba-list">
            {TO_VALIDATE.map((r) => (
              <li key={r.what}>
                {r.what}, à valider <strong>{r.each * n}</strong>
              </li>
            ))}
            <li>
              Déclaration, cases à recopier <strong>1</strong>
            </li>
            <li className="ba-free">Quittances, avis, assurance : envoyés seuls</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

/** Prix selon le nombre de logements, comparé à une agence (7 % d'un loyer de 750 €, hypothèse affichée). */
const AGENCY_RATE = 0.07
const SAMPLE_RENT = 750
const eur = (cents: number) => (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 }) + ' €'

/** Montant qui glisse jusqu'à sa nouvelle valeur (affichage) ; le vrai montant est lu par les lecteurs d'écran. */
function Money({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents)
  const from = useRef(cents)
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return void (setShown(cents), (from.current = cents))
    const a = from.current
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 600)
      const v = Math.round(a + (cents - a) * (1 - Math.pow(1 - p, 3)))
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = cents
    }
    raf = requestAnimationFrame(step)
    return () => (cancelAnimationFrame(raf), void (from.current = cents))
  }, [cents])
  return (
    <>
      <span aria-hidden>{eur(shown)}</span>
      <span className="sr-only">{eur(cents)}</span>
    </>
  )
}

function PriceCalc() {
  const [n, setN] = useState(3)
  const [yearly, setYearly] = useState(true)
  const agency = Math.round(n * SAMPLE_RENT * AGENCY_RATE * 12 * 100)
  const bailio = yearly ? n * YEARLY_PRICE_CENTS : n * MONTHLY_PRICE_CENTS * 12
  const keep = Math.max(0, agency - bailio)
  const share = agency ? Math.max(0.02, bailio / agency) : 0
  const set = (k: number) => setN(Math.min(30, Math.max(1, k)))
  return (
    <section id="tarifs" className="calc2" data-section aria-labelledby="calc-title">
      <div className="calc2-head">
        <p className="eyebrow" aria-hidden>Tarif</p>
        <h2 id="calc-title" data-in>
          Votre prix, <em>en un geste.</em>
        </h2>
        <p className="calc2-lead" data-in style={{ ['--i' as string]: 1 }}>
          {LAUNCH_OFFER}, sans carte bancaire. Tout est compris.
        </p>
      </div>
      <div className="calc2-card" data-in style={{ ['--i' as string]: 2 }}>
        <div className="calc2-controls">
          <div className="calc-switch" role="group" aria-label="Paiement">
            <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>
              Au mois
            </button>
            <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>
              À l’année <span>2 mois offerts</span>
            </button>
          </div>
          <div className="calc2-count">
            <label htmlFor="calc-n">Logements loués</label>
            <div className="calc2-stepper">
              <button type="button" onClick={() => set(n - 1)} aria-label="Un logement de moins" disabled={n <= 1}>
                −
              </button>
              <output htmlFor="calc-n" aria-live="polite">{n}</output>
              <button type="button" onClick={() => set(n + 1)} aria-label="Un logement de plus" disabled={n >= 30}>
                +
              </button>
            </div>
          </div>
          <input id="calc-n" className="calc2-range" type="range" min={1} max={30} value={n} onChange={(e) => set(Number(e.target.value))} aria-valuetext={`${n} logement${n > 1 ? 's' : ''}`} style={{ ['--p' as string]: `${((n - 1) / 29) * 100}%` }} />
          <ul className="calc2-incl">
            {INCLUS.slice(0, 6).map((x) => (
              <li key={x}>
                <Check />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="calc2-result">
          <p className="calc2-label">Bailio, {yearly ? 'à l’année' : 'au mois'}</p>
          <p className="calc2-price">
            <Money cents={yearly ? bailio : n * MONTHLY_PRICE_CENTS} />
          </p>
          <p className="calc2-sub">{yearly ? `soit ${eur(Math.round(bailio / 12))} par mois` : `soit ${eur(bailio)} par an`}, garage seul {PARKING_PRICE} par mois</p>
          <div className="calc2-bars" aria-hidden>
            <div className="calc2-bar">
              <span>Une agence</span>
              <i style={{ transform: 'scaleX(1)' }} />
              <b>{eur(agency)}</b>
            </div>
            <div className="calc2-bar calc2-bar--me">
              <span>Bailio</span>
              <i style={{ transform: `scaleX(${share})` }} />
              <b>{eur(bailio)}</b>
            </div>
          </div>
          <p className="calc2-keep">
            Vous gardez{' '}
            <strong>
              <Money cents={keep} />
            </strong>{' '}
            par an
          </p>
          <p className="calc2-fine">Agence : 7 % d’un loyer de {SAMPLE_RENT} €, par an.</p>
          <Link to="/commencer" className="btn btn--paper calc2-cta">
            Commencer gratuitement
            <Arrow />
          </Link>
        </div>
      </div>
      <ul className="calc-guar calc2-guar">
        {GUARANTEES.map((g) => (
          <li key={g}>
            <Check />
            {g}
          </li>
        ))}
      </ul>
    </section>
  )
}

const monthFr = (d: string) => new Date(`${d}-01T00:00:00Z`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Outils gratuits, sans compte : la porte d'entrée de ceux qui arrivent par Google. */
function FreeTools() {
  return (
    <section className="tools" data-section aria-labelledby="tools-title">
      <p className="eyebrow" aria-hidden>Gratuit</p>
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

/**
 * Mini-écrans des six automatismes : chacun montre en une image ce que fait l'automatisme, avec des données
 * visiblement fictives. Animation douce en boucle (CSS), arrêtée si l'appareil demande moins d'animations.
 */
function AutoMini({ i }: { i: number }) {
  if (i === 0)
    return (
      <div className="mini" aria-hidden>
        <div className="mini-row mini-in"><span>VIR M. EXEMPLE</span><b>+780 €</b><i className="mini-ok">Loyer</i></div>
        <div className="mini-row mini-in" style={{ animationDelay: '.5s' }}><span>PRLV ASSURANCE</span><b>−46 €</b><i>Dépense</i></div>
        <div className="mini-row mini-in" style={{ animationDelay: '1s' }}><span>VIR MME FICTIVE</span><b>+520 €</b><i className="mini-ok">Loyer</i></div>
      </div>
    )
  if (i === 1)
    return (
      <div className="mini mini-paper" aria-hidden>
        <p className="mini-title">Quittance · novembre</p>
        <p className="mini-line" />
        <p className="mini-line mini-line--short" />
        <span className="mini-stamp">Payé</span>
      </div>
    )
  if (i === 2)
    return (
      <div className="mini" aria-hidden>
        <div className="mini-steps">
          {['J+3', 'J+8', 'J+15'].map((d, k) => (
            <span key={d} className="mini-step" style={{ animationDelay: `${k * 0.6}s` }}>
              <b>{d}</b>
              <small>{k === 0 ? 'Relance' : k === 1 ? 'Rappel' : 'Mise en demeure'}</small>
            </span>
          ))}
        </div>
        <p className="mini-note">Arrêt dès le paiement</p>
      </div>
    )
  if (i === 3)
    return (
      <div className="mini mini-paper" aria-hidden>
        <p className="mini-title">Bail · location vide</p>
        <p className="mini-check mini-in">Durée 3 ans</p>
        <p className="mini-check mini-in" style={{ animationDelay: '.4s' }}>Dépôt 1 mois</p>
        <p className="mini-check mini-in" style={{ animationDelay: '.8s' }}>DPE valable</p>
        <p className="mini-sign mini-in" style={{ animationDelay: '1.2s' }}>Signé en ligne</p>
      </div>
    )
  if (i === 4)
    return (
      <div className="mini" aria-hidden>
        {['Séjour', 'Cuisine', 'Chambre'].map((r, k) => (
          <div key={r} className="mini-row mini-in" style={{ animationDelay: `${k * 0.5}s` }}>
            <span>{r}</span>
            <i className="mini-ok">Bon état</i>
            <em className="mini-photo" />
          </div>
        ))}
      </div>
    )
  return (
    <div className="mini" aria-hidden>
      {[['5 déc.', 'Révision du loyer'], ['15 déc.', 'CFE du meublé'], ['Mai', 'Déclaration']].map(([d, t], k) => (
        <div key={t} className="mini-row mini-in" style={{ animationDelay: `${k * 0.5}s` }}>
          <b className="mini-date">{d}</b>
          <span>{t}</span>
        </div>
      ))}
    </div>
  )
}

/** Six automatismes : ce qui tourne sans vous. */
function Automations() {
  return (
    <section className="autos" data-section aria-labelledby="autos-title">
      <p className="eyebrow" aria-hidden>Automatismes</p>
      <h2 id="autos-title" data-in>
        Six tâches qui <em>se font seules.</em>
      </h2>
      <div className="autos-grid">
        {AUTOMATIONS.map((a, j) => (
          <article key={a.title} className="auto" data-in style={stagger(j % 3)}>
            <AutoMini i={j} />
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


/** Tableur, agence ou Bailio : vrai tableau, colonne Bailio mise en avant, défilement horizontal sur téléphone. */
function Compare() {
  const cell = (v: string) => (v === 'PRICE' ? priceText() : v)
  return (
    <section className="cmp" data-section aria-labelledby="cmp-title">
      <p className="eyebrow" aria-hidden>Comparatif</p>
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

/** Bande bleu nuit des chiffres : seulement des faits vérifiables (prix, contenus gratuits), aucun avis ni nombre d'utilisateurs. */
function Stats() {
  const items: Array<{ value: string; unit?: string; label: string }> = [
    { value: (MONTHLY_PRICE ?? '').replace(' €', ''), unit: '€', label: 'par logement et par mois' },
    { value: '0', label: 'option payante' },
    { value: String(MODELES.length), label: 'modèles de lettres gratuits' },
    { value: String(SIMULATEURS.length), label: 'outils gratuits, sans compte' },
  ]
  return (
    <section className="stats" aria-label="Bailio en chiffres">
      <ul>
        {items.map((it) => (
          <li key={it.label}>
            <strong>
              {/^\d+$/.test(it.value) ? <CountUp value={Number(it.value)} ms={1400} /> : it.value}
              {it.unit ? <small>{it.unit}</small> : null}
            </strong>
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
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
        <section className="hero3" data-section aria-labelledby="hero-title">
          <span className="hero-streak" aria-hidden />
          <span className="hero-streak hero-streak--2" aria-hidden />
          <p className="hero3-badge">{LAUNCH_OFFER} · sans carte bancaire</p>
          <h1 id="hero-title">
            La gestion locative des propriétaires, <em>sans agence.</em>
          </h1>
          <p className="hero-lead">Bail, quittances, relances, impôts : tout est prêt, selon la loi.</p>
          <div className="hero-actions">
            <Link to="/commencer" className="btn">
              Créer mon bail gratuit
              <Arrow />
            </Link>
            <VideoButton className="btn btn--line hero-video">
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
                <path d="M9 7v10l8-5z" fill="currentColor" />
              </svg>
              Voir la vidéo, 1 min
            </VideoButton>
          </div>
          <p className="hero3-facts">
            {priceText()}, sans engagement. <Link to="/demo">Essayer la démo</Link> <Link to="/importer">J’ai déjà un bail</Link>
          </p>
          <HeroProduct />
        </section>

        <Stats />

        <Yearly />

        <Tour />

        <Automations />

        <Reviews />

        <PriceCalc />

        <Compare />

        <FreeTools />

        <section className="faq" data-section aria-labelledby="faq-title">
          <p className="eyebrow" aria-hidden>Vos questions</p>
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
              Cinq minutes de questions. Bailio vous dit ce qu’il manque avant la signature.
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
