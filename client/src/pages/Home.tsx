import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '@fontsource/young-serif/latin-400.css'
import '@fontsource/source-serif-4/latin-400.css'
import '@fontsource/source-serif-4/latin-600.css'
import './home.css'
import { Logo } from '../components/Logo'
import { useAuth } from '../lib/auth'
import { CONTACT_EMAIL, LAUNCH_OFFER, MONTHLY_PRICE, priceLabel } from '../config'

/**
 * Accueil. Direction « split stage » (taste-skill) : la carte et le bail en direct défilent à gauche,
 * les grands lieux de Montpellier restent à droite et changent quand la section change. « Tout le dossier »
 * montre des aperçus de l'application (HTML, pas d'image). Photos : Wikimedia Commons, créditées en pied de page
 * (public/accueil/credits.json).
 */

type Kind = 'VIDE' | 'MEUBLE' | 'GARAGE'

const KINDS: Array<{ id: Kind; label: string; title: string }> = [
  { id: 'VIDE', label: 'Vide', title: 'Bail vide' },
  { id: 'MEUBLE', label: 'Meublé', title: 'Bail meublé' },
  { id: 'GARAGE', label: 'Garage', title: 'Garage ou parking' },
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
  { title: 'Chaque mois', mock: 'month', items: ['Quittance envoyée seule', 'Loyer révisé à l’IRL', 'Rappel d’assurance', 'Relance si le loyer manque'] },
] as const

const FAQ: Array<[string, string]> = [
  ['Le bail est-il valable ?', 'Oui. Il suit, rubrique par rubrique, le contrat type officiel dans sa version du 1er octobre 2026.'],
  ['J’ai déjà un locataire.', 'Prenez votre bail signé en photo : Bailio le lit, vous vérifiez, et le suivi démarre.'],
  ['Mon locataire doit-il s’inscrire ?', 'Non. Il reçoit ses quittances par email et un lien pour envoyer son attestation d’assurance.'],
  ['Et la signature ?', 'En ligne, avec un code envoyé par email, ou sur papier si vous préférez. Le PDF signé garde sa preuve.'],
  ['Un garage, une SCI ?', 'Les deux. Garage loué seul, location à plusieurs, SCI familiale : la durée et les règles suivent.'],
  ['Qui touche le loyer ?', 'Vous, directement. Bailio ne passe jamais par votre argent ni par le dépôt de garantie.'],
  ['Où sont mes données ?', 'Sur un serveur en Suisse. Elles ne sont ni revendues, ni confiées à une intelligence artificielle.'],
  ['Et si j’arrête ?', 'Vous exportez tout en un clic, puis vous supprimez votre compte. Sans engagement.'],
]

const LEGAL = [
  { to: '/mentions-legales', label: 'Mentions légales' },
  { to: '/conditions', label: 'Conditions' },
  { to: '/confidentialite', label: 'Confidentialité' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/prix-et-remboursement', label: 'Prix et remboursement' },
  { to: '/accessibilite', label: 'Accessibilité' },
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

const STAGE_PHOTOS = [
  { src: '/accueil/peyrou.webp', place: 'Château d’eau du Peyrou', alt: 'Le château d’eau du Peyrou, à Montpellier, reflété dans son bassin' },
  { src: '/accueil/arc.webp', place: 'Arc de triomphe, rue Foch', alt: 'L’arc de triomphe de Montpellier au soleil couchant, un réverbère au premier plan' },
]

export default function Home() {
  const { user } = useAuth()
  const root = useRef<HTMLDivElement>(null)
  const [kind, setKind] = useState<Kind>('VIDE')
  const [rent, setRent] = useState(780)
  const [photo, setPhoto] = useState(0)
  const current = KINDS.find((k) => k.id === kind)!

  // Entrées des sections et photo de la scène qui change avec la section.
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    el.classList.add('hm-js')
    const previous = document.body.style.background
    document.body.style.background = '#e8e8e3'
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), reveal.unobserve(e.target))),
      { threshold: 0.15 },
    )
    el.querySelectorAll('[data-section]').forEach((s) => reveal.observe(s))
    const stage = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setPhoto(Number((e.target as HTMLElement).dataset.photo ?? 0))), { threshold: 0.5 })
    el.querySelectorAll('[data-photo]').forEach((s) => stage.observe(s))
    return () => {
      document.body.style.background = previous
      reveal.disconnect()
      stage.disconnect()
    }
  }, [])

  return (
    <div className="hm" ref={root}>
      <main>
        <div className="stage">
          <div className="stage-col">
            <section className="card" data-photo="0" data-section>
              <div className="card-body">
                <span data-in style={{ ['--i' as string]: 0 }}>
                  <Logo size={28} color="var(--ink)" to={null} />
                </span>
                <h1 data-in style={{ ['--i' as string]: 1 }}>Le bail juste, du premier coup.</h1>
                <p className="card-lead" data-in style={{ ['--i' as string]: 2 }}>
                  Annonce, bail, signature, quittances : Bailio prépare chaque papier de votre location, selon la loi.
                </p>
                <span>
                  <Link to="/commencer" className="btn">
                    Créer mon bail gratuit
                  </Link>
                </span>
              </div>
              <nav aria-label="Menu" className="card-foot">
                <Link to="/importer">J’ai déjà un bail</Link>
                <a href="#tarifs">Tarif</a>
                {user ? <Link to="/espace">Mon espace</Link> : <Link to="/connexion">Se connecter</Link>}
              </nav>
            </section>

            <section className="live" data-photo="1" data-section aria-labelledby="live-title">
              <div className="tabs-live" role="group" aria-label="Type de location" data-in style={{ ['--i' as string]: 0 }}>
                {KINDS.map((k) => (
                  <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
                    {k.label}
                  </button>
                ))}
              </div>
              <h2 id="live-title" data-in style={{ ['--i' as string]: 1 }}>
                {current.title}, déjà calculé.
              </h2>
              <div className="rent" data-in style={{ ['--i' as string]: 2 }}>
                <label htmlFor="live-rent">Loyer hors charges</label>
                <input
                  id="live-rent"
                  inputMode="numeric"
                  value={rent ? String(rent) : ''}
                  onChange={(e) => setRent(Math.min(99999, Number(e.target.value.replace(/\D/g, '')) || 0))}
                  aria-describedby="live-terms"
                />
                <span aria-hidden>€ par mois</span>
              </div>
              <dl className="terms" id="live-terms" aria-live="polite" data-in style={{ ['--i' as string]: 3 }}>
                {termsFor(kind, rent).map(([k, v]) => (
                  <div key={k} style={{ display: 'contents' }}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="live-actions">
                <Link to="/commencer" className="btn btn--ink">
                  Créer ce bail
                </Link>
                <Link to="/importer" className="btn btn--paper">
                  Importer le mien
                </Link>
              </div>
            </section>
          </div>

          <div className="stage-photo">
            {STAGE_PHOTOS.map((p, i) => (
              <img key={p.src} src={p.src} alt={i === photo ? p.alt : ''} aria-hidden={i !== photo} className={i === photo ? 'is-on' : undefined} width={960} height={1200} />
            ))}
            <p className="stage-place">{STAGE_PHOTOS[photo].place}, Montpellier</p>
          </div>
        </div>

        <section className="dossier" data-section aria-labelledby="dossier-title">
          <h2 id="dossier-title">Tout le dossier.</h2>
          <div className="dossier-rows">
            {ROWS.map((r) => (
              <article key={r.title} className="drow" data-section>
                <h3 data-in>{r.title}</h3>
                <div className="drow-body">
                  <div data-in style={{ ['--i' as string]: 1 }} className="mock-wrap">
                    {r.mock === 'ad' ? <MockAd /> : r.mock === 'lease' ? <MockLease /> : <MockMonth />}
                  </div>
                  <ul data-in style={{ ['--i' as string]: 2 }}>
                    {r.items.map((it) => (
                      <li key={it}>{it}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="itin" data-section aria-labelledby="itin-title">
          <div className="itin-intro">
            <h2 id="itin-title" data-in>
              Louer, montre en main.
            </h2>
            <p data-in style={{ ['--i' as string]: 1 }}>
              Ce que vous faites, et le temps que ça vous prend.
            </p>
          </div>
          <div className="slip" data-in style={{ ['--i' as string]: 2 }}>
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
          <div className="plan plan--free">
            <h2>Premier bail</h2>
            <p className="plan-for">Pour louer un logement, une fois.</p>
            <div className="plan-foot">
              <span className="plan-price">0 €</span>
              <Link to="/commencer" className="btn btn--ink">
                Créer mon bail
              </Link>
            </div>
          </div>
          <div className="plan plan--full">
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
              <Link to="/commencer" className="btn">
                Essayer
              </Link>
            </div>
          </div>
        </section>

        <section className="faq" data-section aria-labelledby="faq-title">
          <h2 id="faq-title" data-in>
            Questions
          </h2>
          <div className="faq-text" data-in style={{ ['--i' as string]: 1 }}>
            {FAQ.map(([q, a]) => (
              <p key={q}>
                <strong>{q}</strong> {a}
              </p>
            ))}
          </div>
        </section>

        <section className="last" data-section aria-labelledby="last-title">
          <img src="/accueil/antigone.webp" alt="Le quartier Antigone et l’hôtel de Région au bord du Lez, à la tombée du jour" width={1920} height={1080} loading="lazy" decoding="async" />
          <div className="last-text">
            <h2 id="last-title" data-in>
              Votre premier bail est offert.
            </h2>
            <p data-in style={{ ['--i' as string]: 1 }}>
              Cinq minutes de questions, et vous repartez avec un bail prêt à signer.
            </p>
            <span>
              <Link to="/commencer" className="btn btn--paper">
                Créer mon bail
              </Link>
            </span>
          </div>
        </section>
      </main>

      <footer className="foot">
        <img src="/accueil/comedie.webp" alt="" width={960} height={1200} loading="lazy" decoding="async" />
        <div className="foot-menu">
          <Logo size={28} color="var(--ink)" />
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
            <p>
              Photos : Christian Ferrer (CC BY 4.0), château d’eau du Peyrou ; Elisaveta Abazova (CC BY-SA 4.0), arc de triomphe ; Mike (CC BY 2.0), Antigone ; Benoît Prieur (CC0), place de la Comédie ; via Wikimedia Commons, recadrées.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
