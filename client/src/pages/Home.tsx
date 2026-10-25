import { ADD_PARKING_PATH } from '../lib/contract'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import './home.css'
import { Logo } from '../components/Logo'
import { BAI } from '../constants/bailio-tokens'
import { useAuth } from '../lib/auth'
import { CONTACT_EMAIL, LAUNCH_OFFER, MONTHLY_PRICE, priceLabel } from '../config'

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
  ['Et si j’arrête ?', 'Vous exportez tout en un clic, puis vous supprimez votre compte. Sans engagement.'],
  ['Je suis locataire, c’est pour moi ?', 'Bailio sert aux propriétaires. Pour monter votre dossier, utilisez DossierFacile (dossierfacile.logement.gouv.fr), le service gratuit de l’État. Si votre propriétaire utilise Bailio, il vous envoie un lien : rien à créer.'],
]

const LEGAL = [
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

export default function Home() {
  const { user } = useAuth()
  const root = useRef<HTMLDivElement>(null)
  const [kind, setKind] = useState<Kind>('VIDE')
  const [rent, setRent] = useState(780)
  const current = KINDS.find((k) => k.id === kind)!

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
      <header className="bar">
        <Logo size={28} />
        <nav aria-label="Menu">
          <Link to="/importer" className="bar-link hide-md">
            J’ai déjà un bail
          </Link>
          <a href="#tarifs" className="bar-link hide-md">
            Tarif
          </a>
          {user ? (
            <Link to="/espace" className="bar-link">
              Mon espace
            </Link>
          ) : (
            <Link to="/connexion" className="bar-link">
              Se connecter
            </Link>
          )}
          <Link to="/commencer" className="btn btn--sm hide-md">
            Créer mon bail
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero" data-section>
          <div className="hero-photo">
            <img src="/accueil/arbre-blanc.webp" alt="L’Arbre Blanc, immeuble aux balcons en porte-à-faux, au-dessus des pins, à Montpellier" width={960} height={1200} fetchPriority="high" />
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
              <Link to="/importer" className="hero-link">
                J’ai déjà un bail
              </Link>
            </div>
          </div>
        </section>

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
              {LAUNCH_OFFER}. Ensuite, quittances, révision du loyer et rappels compris, sans engagement ; un email vous prévient avant tout paiement.
            </p>
            <div className="plan-foot">
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="plan-price">{priceLabel()}</span>
                {MONTHLY_PRICE ? <span>par mois</span> : null}
              </span>
              <Link to="/commencer" className="btn btn--paper">
                Essayer
                <Arrow />
              </Link>
            </div>
          </div>
        </section>

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
                <a href="#tarifs">Tarif</a>
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
