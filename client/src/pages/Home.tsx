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
import { CONTACT_EMAIL, LAUNCH_OFFER, MONTHLY_PRICE, PARKING_PRICE, PRICE_UNIT, YEARLY_PRICE, priceLabel, priceText } from '../config'
import { AppWindow } from '../components/AppWindow'
import { ALL_FEATURES, AUTOMATIONS, CHOOSE, COMPARE, EXPERTISE, GUARANTEES, MANUAL, REASONS, START, TRUST } from '../content/accueil'
import { AVIS } from '../content/avis'
import { SIMULATEURS } from '../content/modeles'
import { CALLBACK_PROMISE, INCLUS } from '../content/inclus'

/**
 * Accueil, direction « Midi » (docs/design/direction-artistique.md) : système de modules « page de bail »
 * (grands coins arrondis, un coin replié), photos de Montpellier dans des modules arrondis et blocs de
 * couleur unie posés en bas, par-dessus. « Tout le dossier » montre des aperçus de l'application (HTML,
 * pas d'image). Photos fournies par l'éditeur (public/accueil/credits.json).
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

const ROWS = [
  { title: 'L’annonce', mock: 'ad', items: ['Texte prêt à coller', 'Leboncoin, SeLoger, PAP', 'Mentions obligatoires incluses', 'Un lien pour les candidatures'] },
  { title: 'Le bail signé', mock: 'lease', items: ['Contrat type d’octobre 2026', 'Vide, meublé ou garage', 'Signature en ligne, sans compte', 'Locataire et garant'] },
  { title: 'Chaque mois', mock: 'month', items: ['Quittance (le reçu du loyer) envoyée seule', 'Loyer révisé chaque année selon l’indice officiel (IRL)', 'Rappel d’assurance', 'Relance si le loyer manque'] },
] as const

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
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/conditions', label: 'Conditions' },
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/prix-et-remboursement', label: 'Prix et remboursement' },
  { to: '/accessibilite', label: 'Accessibilité' },
  { to: '/securite', label: 'Sécurité' },
]

/** Aperçus de l'application, dessinés en HTML : ce que le propriétaire verra vraiment. */
function MockAd() {
  return (
    <div className="mock" data-ui role="img" aria-label="Aperçu d’une annonce prête à publier sur Leboncoin, SeLoger et PAP">
      <div className="mock-bar">
        <span>Annonce</span>
        <span className="mock-ok">Prête</span>
      </div>
      <p className="mock-title">T2 lumineux, quartier Écusson</p>
      <p className="mock-price">
        780 € <small>charges comprises, par mois</small>
      </p>
      <div className="mock-facts">
        <span>42 m²</span>
        <span>DPE C</span>
        <span>Dépôt 700 €</span>
      </div>
      <div className="mock-sites">
        <span>Leboncoin</span>
        <span>SeLoger</span>
        <span>PAP</span>
      </div>
      <p className="mock-link">bailio.fr/candidature/t2-ecusson</p>
    </div>
  )
}

function MockLease() {
  return (
    <div className="mock mock--paper" data-ui role="img" aria-label="Aperçu d’un bail signé en ligne par le bailleur, le locataire et le garant">
      <p className="mock-doc">Contrat de location</p>
      <p className="mock-sub">Logement vide · contrat type, octobre 2026</p>
      <div className="mock-lines" aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className="mock-signs">
        {[
          ['Bailleur', '2 oct.'],
          ['Locataire', '2 oct.'],
          ['Garant', '3 oct.'],
        ].map(([who, when]) => (
          <div key={who}>
            <span className="mock-check" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6.5 5 9.2 10 3" />
              </svg>
            </span>
            <strong>{who}</strong>
            <span>signé le {when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockMonth() {
  const rows: Array<[string, string, string]> = [
    ['1 nov.', 'Quittance d’octobre', 'Envoyée à Léa'],
    ['15 nov.', 'Loyer révisé (IRL)', '780 € → 791 €'],
    ['20 nov.', 'Attestation d’assurance', 'Demandée'],
    ['6 déc.', 'Loyer de décembre', 'Relance prête'],
  ]
  return (
    <div className="mock" data-ui role="img" aria-label="Aperçu du suivi mensuel : quittance envoyée, loyer révisé, assurance demandée, relance prête">
      <div className="mock-bar">
        <span>Aujourd’hui</span>
        <span>T2 Écusson</span>
      </div>
      <ul className="mock-feed">
        {rows.map(([d, what, state]) => (
          <li key={what}>
            <span className="mock-date">{d}</span>
            <span className="mock-what">{what}</span>
            <span className="mock-state">{state}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

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

const FIELDS = ['peach', 'sky', 'night'] as const

/** Visite animée du produit : vraies captures de l'application sur ordinateur (compte d'exemple), qui défilent seules. */
const TOUR: TourStep[] = [
  { id: 'decrire', tab: 'Décrire', img: 'tunnel', path: 'bailio.fr/commencer', alt: 'Écran « Votre logement est… » avec deux choix, Vide ou Meublé, étape 1 sur 5', spot: { x: 25, y: 28, w: 50, h: 26, label: 'Une question à la fois : Bailio remplit le reste' } },
  { id: 'bail', tab: 'Le bail', img: 'bail', alt: 'Page d’un bail signé : locataire, adresse, dates, loyers reçus avec leurs quittances, et les actions du bail', spot: { x: 22.5, y: 8, w: 40, h: 14, label: 'Le contrat type officiel, signé en ligne' } },
  { id: 'jour', tab: 'Aujourd’hui', img: 'today', alt: 'Écran « Bonjour Claire » : un loyer en retard avec la relance déjà rédigée, une fin de bail, l’état des lieux à faire et les prochaines échéances', spot: { x: 21.9, y: 22.7, w: 49, h: 18, label: 'Un loyer en retard : la relance est déjà rédigée' } },
  { id: 'mois', tab: 'Chaque mois', img: 'relances', alt: 'Bail avec un loyer en retard : quittance par email et relance automatique d’un loyer impayé activées', spot: { x: 22.8, y: 64.3, w: 41, h: 4, label: 'Relance à J+3, second rappel à J+8, mise en demeure à J+15' } },
  { id: 'candidats', tab: 'Candidats', img: 'candidats', alt: 'Liste des candidats : dossier solide ou à compléter, avec les raisons', spot: { x: 22.8, y: 20.7, w: 30, h: 13, label: 'Classés sur les ressources, la garantie et les pièces' } },
  { id: 'bord', tab: 'Tableau de bord', img: 'patrimoine', alt: 'Tableau de bord : loyers attendus chaque mois, ce qu’il reste, logements à surveiller', spot: { x: 23, y: 45, w: 72, h: 19, label: 'Le loyer en retard et le bail à renouveler, en tête' } },
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

/** Croix des conseils repliés (devient un « moins » à l'ouverture, comme les questions). */
function Plus() {
  return (
    <svg className="faq-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden focusable="false">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

const stagger = (i: number) => ({ ['--i' as string]: i }) as CSSProperties

/** « Tout ce que vous faisiez à la main » : liste de points cliquables, la capture de l'écran à côté (onglets, flèches). */
function Manual() {
  const [i, setI] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const s = MANUAL[i]
  const go = (n: number) => {
    const k = (n + MANUAL.length) % MANUAL.length
    setI(k)
    tabs.current[k]?.focus()
  }
  return (
    <section className="manual" data-section aria-labelledby="manual-title">
      <h2 id="manual-title" data-in>
        Tout ce que vous faisiez à la main, <em>Bailio le fait.</em>
      </h2>
      <div className="manual-tabs" role="tablist" aria-label="Ce que Bailio fait pour vous" data-in style={stagger(1)}>
        {MANUAL.map((m, j) => (
          <button
            key={m.img}
            ref={(el) => void (tabs.current[j] = el)}
            type="button"
            role="tab"
            id={`manual-tab-${j}`}
            aria-selected={i === j}
            aria-controls="manual-panel"
            tabIndex={i === j ? 0 : -1}
            onClick={() => setI(j)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight' || e.key === 'ArrowDown') (e.preventDefault(), go(j + 1))
              else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') (e.preventDefault(), go(j - 1))
              else if (e.key === 'Home') (e.preventDefault(), go(0))
              else if (e.key === 'End') (e.preventDefault(), go(MANUAL.length - 1))
            }}
          >
            <span className="manual-n" aria-hidden>
              {j + 1}
            </span>
            {m.title}
          </button>
        ))}
      </div>
      <div id="manual-panel" className="manual-panel fold fold--ear" role="tabpanel" aria-labelledby={`manual-tab-${i}`} data-in style={stagger(2)}>
        <div className="panel-in" key={s.img}>
          <p className="manual-text">{s.text}</p>
          <AppWindow img={s.img} alt={s.alt} />
        </div>
      </div>
    </section>
  )
}

/** Six automatismes : ce qui tourne sans vous. */
function Automations() {
  return (
    <section className="autos" data-section aria-labelledby="autos-title">
      <h2 id="autos-title" data-in>
        Six <em>automatismes.</em>
      </h2>
      <div className="autos-grid">
        {AUTOMATIONS.map((a, j) => (
          <article key={a.title} className="auto" data-in style={stagger(j % 3)}>
            <span className="auto-n" aria-hidden>
              {String(j + 1).padStart(2, '0')}
            </span>
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

/** Six raisons de choisir Bailio. */
function Reasons() {
  return (
    <section className="why" data-section aria-labelledby="why-title">
      <h2 id="why-title" data-in>
        Six raisons de <em>choisir Bailio.</em>
      </h2>
      <div className="why-grid">
        {REASONS.map((r, j) => (
          <article key={r.title} className="why-card" data-in style={stagger(j % 3)}>
            <Check />
            <h3>{r.title}</h3>
            <p>{r.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/** Derrière chaque règle, une source officielle : bloc sombre, texte clair. */
function Expertise() {
  const [head, tail] = EXPERTISE.title.split(', ')
  return (
    <section className="expert fold fold--lg fold--ear" data-section aria-labelledby="expert-title">
      <div className="expert-intro">
        <h2 id="expert-title" data-in>
          {head}, <em>{tail}</em>
        </h2>
        <div className="expert-links" data-in style={stagger(1)}>
          <Link to="/guides" className="btn btn--paper">
            Lire les guides
            <Arrow />
          </Link>
          <Link to="/modeles" className="btn btn--paper">
            Modèles de lettres
            <Arrow />
          </Link>
        </div>
      </div>
      <ul className="expert-list" data-in style={stagger(2)}>
        {EXPERTISE.points.map((p) => (
          <li key={p}>
            <Check />
            {p}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Vos garanties : une ligne, juste sous les offres. */
function Guarantees() {
  return (
    <section className="guar" data-section aria-labelledby="guar-title">
      <h2 id="guar-title" data-in>
        Vos <em>garanties.</em>
      </h2>
      <ul data-in style={stagger(1)}>
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

/** Opérationnel en quelques minutes : trois étapes, et l'import par fichier. */
function Start() {
  return (
    <section className="start" data-section aria-labelledby="start-title">
      <h2 id="start-title" data-in>
        Opérationnel <em>en quelques minutes.</em>
      </h2>
      <ol className="start-list">
        {START.map((s, j) => (
          <li key={s.title} data-in style={stagger(j + 1)}>
            <span className="start-n" aria-hidden>
              {j + 1}
            </span>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
      <div data-in style={stagger(4)}>
        <Link to="/espace/logements/importer" className="btn btn--paper">
          Ajouter mes logements depuis un fichier
          <Arrow />
        </Link>
      </div>
    </section>
  )
}

/** Comment choisir son logiciel : six critères, conseils repliés sur leur titre. */
function Choose() {
  return (
    <section className="faq choose" data-section aria-labelledby="choose-title">
      <h2 id="choose-title" data-in>
        Comment choisir son logiciel de gestion locative <em>en 2026 ?</em>
      </h2>
      <div className="faq-list" data-in style={stagger(1)}>
        {CHOOSE.map((c) => (
          <details key={c.title}>
            <summary>
              <span>{c.title}</span>
              <Plus />
            </summary>
            <p>{c.text}</p>
          </details>
        ))}
      </div>
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
        <section className="hero" data-section>
          <div className="hero-photo">
            {/* Photo élargie à gauche (son propre ciel en miroir, caché par le bloc) : l’Arbre Blanc entier, à droite du bloc. */}
            <img src="/accueil/arbre-blanc-large.webp" alt="L’Arbre Blanc, immeuble aux balcons en porte-à-faux, au-dessus des pins, à Montpellier" width={3000} height={1000} fetchPriority="high" />
            <small className="hero-credit">© Ludwig Deguffroy/Getty Images</small>
          </div>
          <div className="hero-block fold fold--lg fold--ear">
            <h1 data-in style={{ ['--i' as string]: 0 }}>
              Le bail juste,
              <br />
              <em>du premier coup.</em>
            </h1>
            <p className="hero-lead" data-in style={{ ['--i' as string]: 1 }}>
              Pour les propriétaires qui louent eux-mêmes. Annonce, bail, signature, quittances : Bailio prépare chaque papier de votre location, selon la loi.
            </p>
            <div className="hero-actions" data-in style={{ ['--i' as string]: 2 }}>
              <Link to="/commencer" className="btn">
                Créer mon bail gratuit
                <Arrow />
              </Link>
              <VideoButton className="hero-link hero-video">
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden focusable="false">
                  <circle cx="12" cy="12" r="11" fill="currentColor" opacity=".25" />
                  <path d="M10 8.5v7l6-3.5z" fill="currentColor" />
                </svg>
                Voir la vidéo · 1 min
              </VideoButton>
              <Link to="/demo" className="hero-link">
                Essayer la démo
              </Link>
              <Link to="/importer" className="hero-link">
                J’ai déjà un bail
              </Link>
            </div>
          </div>
        </section>

        <Tour />

        <Manual />

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

        <Reasons />

        <Expertise />

        <section className="dossier" data-section aria-labelledby="dossier-title">
          <h2 id="dossier-title" data-in>
            Tout le dossier, <em>au même endroit.</em>
          </h2>
          <div className="dossier-grid">
            {ROWS.map((r, i) => (
              <article key={r.title} className={`drow drow--${FIELDS[i]}${i === 2 ? ' fold fold--ear' : ''}`} data-in style={{ ['--i' as string]: i + 1 }}>
                <h3>{r.title}</h3>
                <div className="mock-wrap">{r.mock === 'ad' ? <MockAd /> : r.mock === 'lease' ? <MockLease /> : <MockMonth />}</div>
                <ul>
                  {r.items.map((it) => (
                    <li key={it}>
                      <Check />
                      {it}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <div className="ribbon" data-section role="region" aria-label="Montpellier en images" tabIndex={0}>
          {[
            ['arc', 'L’arc de triomphe de Montpellier, une statue au premier plan'],
            ['ruelle', 'Ruelle pavée bordée de façades en pierre et de balcons en fer forgé'],
            ['rue-coloree', 'Rue étroite aux façades colorées et aux balcons fleuris'],
          ].map(([f, alt], i) => (
            <img key={f} data-in style={{ ['--i' as string]: i }} src={`/accueil/${f}.webp`} alt={alt} width={960} height={1200} loading="lazy" decoding="async" />
          ))}
        </div>

        <section className="itin" data-section aria-labelledby="itin-title">
          <div className="itin-intro">
            <h2 id="itin-title" data-in>
              Louer, <em>montre en main.</em>
            </h2>
            <p data-in style={{ ['--i' as string]: 1 }}>
              Ce que vous faites, et le temps que ça vous prend.
            </p>
          </div>
          <div className="slip fold fold--ear" data-in style={{ ['--i' as string]: 2 }}>
            {[
              ['Avant l’entrée', [['Décrire le logement', '5 min'], ['Publier l’annonce', '2 min'], ['Choisir un candidat', 'à votre rythme']]],
              ['Le jour de l’entrée', [['Signer le bail en ligne', '3 min'], ['État des lieux en photos', '30 min']]],
              ['Chaque mois', [['Quittance envoyée', 'automatique'], ['Rappels avant échéance', 'automatique']]],
            ].map(([when, rows]) => (
              <div key={when as string}>
                <h3>{when as string}</h3>
                {(rows as string[][]).map(([what, time]) => (
                  <div key={what} className="slip-row">
                    <span>{what}</span>
                    <span className="dots" aria-hidden />
                    <span>{time}</span>
                  </div>
                ))}
              </div>
            ))}
            <div className="slip-total">
              <span>Un logement loué, un dossier complet</span>
              <span>40 min</span>
            </div>
          </div>
        </section>

        <Yearly />

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

        <Guarantees />

        <Compare />

        <Start />

        <FreeTools />

        <Choose />

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
