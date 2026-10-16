import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { Pin } from '../components/Icons'
import { display } from '../components/ui'
import { LAUNCH_OFFER, MONTHLY_PRICE, priceLabel } from '../config'

// Ce que Bailio prépare, dit simplement. Chaque entrée correspond à une fonction du produit.
const FEATURES = [
  {
    title: 'Le bail',
    text: 'Vide ou meublé, sur le contrat type officiel. Durée, dépôt maximum, préavis : ce que la loi fixe est rempli d’office, le reste vous est demandé une seule fois.',
  },
  {
    title: 'Les quittances',
    text: 'Une par mois, au nom de votre locataire. Elle part par email s’il est d’accord, sinon vous l’imprimez.',
  },
  {
    title: 'La révision du loyer',
    text: 'Le nouveau montant est calculé avec l’indice de l’Insee, à la date anniversaire. Pour un logement classé F ou G, la loi l’interdit : Bailio ne le propose pas.',
  },
  {
    title: 'Les rappels',
    text: 'Attestation d’assurance, révision, date limite pour donner congé : un email une semaine avant, pas la veille.',
  },
]

const STEPS = [
  { when: 'Environ 5 minutes', title: 'Vous décrivez le logement et le locataire', text: 'Une question à la fois. Ce que vous avez déjà dit ne vous est jamais redemandé.' },
  { when: 'Le jour de la signature', title: 'Chacun signe, en ligne ou sur papier', text: 'Avant, Bailio relit le bail : s’il manque une mention obligatoire, vous le savez tout de suite.' },
  { when: 'Les années suivantes', title: 'Le bon papier arrive au bon moment', text: 'La quittance le mois venu, le nouveau loyer à sa date, le préavis rappelé à temps.' },
]

const TASKS = [
  { tag: 'Loyer du 5 octobre', tagColor: BAI.green, tagBg: BAI.greenLight, text: 'La quittance de Thomas Martin est prête', cta: 'Télécharger' },
  { tag: 'Révision du loyer', tagColor: BAI.owner, tagBg: BAI.ownerTint, text: 'Nouveau loyer : 812,40 € au 1er novembre', cta: 'Relire' },
  { tag: 'Assurance', tagColor: BAI.caramelDark, tagBg: BAI.caramelLight, text: 'Attestation à demander à votre locataire', cta: 'Demander' },
]

const FAQ = [
  {
    q: 'Mon bail est-il valable ?',
    a: 'Il suit, rubrique par rubrique, le contrat type officiel (décret n° 2015-587) qu’un bail de résidence principale doit respecter. Une fois signé par chacun, il a la même valeur qu’un bail d’agence.',
  },
  {
    q: 'Le modèle a changé en octobre 2026. Bailio est à jour ?',
    a: 'Oui. Le décret du 6 juillet 2026 a modifié le contrat type pour les baux signés depuis le 1er octobre : clause des six semaines, téléphone facultatif, servitude de résidence principale. Bailio suit déjà cette version.',
  },
  { q: 'J’ai déjà un locataire. Ça marche ?', a: 'Oui. Prenez votre bail signé en photo ou déposez le PDF, vérifiez ce que Bailio y a lu, et le suivi démarre.' },
  { q: 'Mon locataire doit-il s’inscrire ?', a: 'Non. Il reçoit ses quittances par email et, si besoin, un lien pour envoyer son attestation d’assurance. Pas de compte à créer.' },
  { q: 'Je peux tout imprimer ?', a: 'Oui. Chaque document est mis en page pour une feuille A4.' },
]

const section = { paddingTop: 'clamp(72px, 8vw, 120px)', paddingBottom: 'clamp(72px, 8vw, 120px)' }
const hand = (size: number, color: string = BAI.caramelInk) => ({ fontFamily: BAI.fontHand, fontWeight: 600, fontSize: size, lineHeight: 1.1, color })

/** Petite flèche tracée à la main, de la note vers la ligne du bail. */
const Arrow = () => (
  <svg className="home-arrow" aria-hidden width="34" height="18" viewBox="0 0 34 18" fill="none" style={{ position: 'absolute', left: -38, top: 6 }}>
    <path d="M33 4C24 2 12 3 4 11" stroke={BAI.caramelInk} strokeWidth="1.6" strokeLinecap="round" />
    <path d="M3 5.5L3.5 11.5L9.5 12" stroke={BAI.caramelInk} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Une ligne de l'extrait : intitulé de la rubrique, texte du bail, et la note de Bailio dans la marge. */
function Clause({ rubric, children, note }: { rubric: string; children: ReactNode; note?: string }) {
  return (
    <div style={{ position: 'relative', padding: '12px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: BAI.ink, marginBottom: 3 }}>{rubric}</div>
      <div style={{ fontFamily: BAI.fontDisplay, fontSize: 17, lineHeight: 1.35, color: BAI.inkMid }}>{children}</div>
      {note ? (
        <p className="home-note" style={{ margin: 0, ...hand(21) }}>
          <Arrow />
          {note}
        </p>
      ) : null}
    </div>
  )
}

/** L'extrait de bail de l'accueil : une vraie page, posée sur la table, annotée. */
function LeaseSheet() {
  return (
    <div className="home-sheet-wrap">
      <figure
        className="home-sheet"
        aria-label="Extrait d’un bail préparé par Bailio, annoté"
        style={{
          margin: 0,
          position: 'relative',
          background: BAI.surface,
          border: `1px solid ${BAI.border}`,
          borderRadius: 4,
          padding: 'clamp(22px, 3vw, 34px) clamp(18px, 3vw, 36px) 26px',
          boxShadow: '0 1px 0 rgba(26,26,46,0.04), 0 18px 40px -18px rgba(26,26,46,0.28)',
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={display(26, { lineHeight: 1 })}>Contrat de location</div>
          <div style={{ fontSize: 12, color: BAI.inkSoft, marginTop: 6 }}>Logement nu, page 1 sur 9</div>
        </div>
        <Clause rubric="I. Désignation des parties">Madame Claire Dubois, bailleresse, et Monsieur Thomas Martin, locataire.</Clause>
        <Clause rubric="III. Durée du contrat" note="Location vide : 3 ans. Calculé pour vous.">
          Trois (3) ans, à compter du 1er novembre 2026.
        </Clause>
        <Clause rubric="IV. Loyer">780 € par mois hors charges, révisé chaque 1er novembre selon l’IRL.</Clause>
        <Clause rubric="VI. Dépôt de garantie" note="Jamais plus d’un mois de loyer en vide.">
          780 €, restitué dans le mois qui suit la remise des clés.
        </Clause>
        <Clause rubric="VIII. Clause résolutoire" note="À jour du décret du 6 juillet 2026.">
          Résiliation six semaines après un commandement de payer resté sans effet.
        </Clause>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: BAI.inkSoft }}>Lu et approuvé, le bailleur</div>
            <svg aria-hidden width="118" height="34" viewBox="0 0 118 34" fill="none" style={{ display: 'block', marginTop: 4 }}>
              <path d="M4 24C10 8 16 6 18 14C20 22 14 30 22 22C30 14 34 10 36 18C38 26 46 12 52 16C58 20 60 24 70 14C76 8 80 20 88 18C96 16 104 10 114 12" stroke={BAI.ink} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div
            className="home-stamp"
            style={{ flexShrink: 0, border: `2px solid ${BAI.green}`, color: BAI.green, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 700, lineHeight: 1.25, textAlign: 'center', transform: 'rotate(-8deg)' }}
          >
            Mentions obligatoires
            <br />
            vérifiées
          </div>
        </div>
      </figure>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [address, setAddress] = useState('')

  function start(e: FormEvent) {
    e.preventDefault()
    navigate('/commencer', { state: { address: address.trim() || undefined } })
  }

  return (
    <div style={{ background: BAI.bg, color: BAI.ink }}>
      <SiteHeader />

      <main>
        <section className="container home-hero" style={{ paddingTop: 'clamp(32px, 6vw, 88px)', paddingBottom: 'clamp(72px, 8vw, 112px)' }}>
          <div className="stack" style={{ gap: 26 }}>
            <h1 style={display('clamp(44px, 6.4vw, 84px)', { lineHeight: 0.98 })}>Un bail bien écrit, du premier coup.</h1>
            <p style={{ margin: 0, fontSize: 'clamp(18px, 1.9vw, 20px)', lineHeight: 1.55, color: BAI.inkMid, maxWidth: 520 }}>
              Vous répondez à quelques questions sur le logement et le locataire. Bailio rédige le bail sur le modèle officiel, puis prépare chaque quittance et vous prévient avant chaque échéance.
            </p>
            <form
              onSubmit={start}
              className="col-md"
              style={{ width: '100%', maxWidth: 560, background: BAI.surface, border: `1.5px solid ${BAI.borderStrong}`, borderRadius: 18, padding: 8, display: 'flex', gap: 8, alignItems: 'center' }}
            >
              <label htmlFor="home-address" className="sr-only">
                Adresse du logement
              </label>
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, width: '100%' }}>
                <span style={{ marginLeft: 12, display: 'flex' }}>
                  <Pin />
                </span>
                <input
                  id="home-address"
                  placeholder="Adresse du logement"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{ flex: 1, minWidth: 0, height: 56, border: 'none', outline: 'none', fontSize: 17, background: 'transparent', padding: '0 10px' }}
                />
              </div>
              <button type="submit" className="full-md" style={{ flexShrink: 0, background: BAI.owner, color: BAI.surface, height: 56, padding: '0 24px', borderRadius: 12, fontWeight: 600, fontSize: 16, border: 'none' }}>
                Créer mon bail gratuit
              </button>
            </form>
            <div className="stack" style={{ gap: 8 }}>
              <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid }}>Le premier bail est gratuit, sans compte à créer pour commencer.</p>
              <Link to="/importer" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none', alignSelf: 'flex-start' }}>
                Votre bail est déjà signé ? Importez-le en photo
              </Link>
            </div>
          </div>
          <LeaseSheet />
        </section>

        <section style={{ background: BAI.surface, borderTop: `1px solid ${BAI.divider}`, borderBottom: `1px solid ${BAI.divider}` }}>
          <div className="container split" style={{ ...section, gap: 'clamp(32px, 6vw, 96px)' }}>
            <div className="stack" style={{ flexShrink: 0, width: 'min(100%, 340px)', gap: 16 }}>
              <h2 style={display('clamp(40px, 4.5vw, 56px)', { lineHeight: 1 })}>Ce qu’il y a dans le dossier</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: BAI.inkMid }}>Quatre papiers que la loi vous demande, préparés pour vous et rangés au même endroit.</p>
            </div>
            <dl style={{ flex: 1, margin: 0 }}>
              {FEATURES.map((f, i) => (
                <div key={f.title} className="defs" style={{ padding: '26px 0', borderTop: i ? `1px solid ${BAI.divider}` : 'none', paddingTop: i ? 26 : 0 }}>
                  <dt style={{ fontSize: 19, fontWeight: 700 }}>{f.title}</dt>
                  <dd style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: BAI.inkMid }}>{f.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="container stack" style={{ ...section, gap: 48 }}>
          <h2 style={display('clamp(40px, 5vw, 60px)')}>Comment ça se passe</h2>
          <ol className="grid-3" style={{ width: '100%', listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((s) => (
              <li key={s.title} className="stack" style={{ gap: 10, borderTop: `2px solid ${BAI.ink}`, paddingTop: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: BAI.caramelInk }}>{s.when}</span>
                <span style={{ fontSize: 22, fontWeight: 600, lineHeight: 1.25 }}>{s.title}</span>
                <span style={{ fontSize: 17, lineHeight: 1.5, color: BAI.inkMid }}>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)' }}>
          <div className="split" style={{ background: BAI.night, borderRadius: 28, padding: 'clamp(32px, 5.5vw, 80px)', alignItems: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
            <div className="stack" style={{ maxWidth: 480, gap: 20 }}>
              <h2 style={display('clamp(40px, 5vw, 60px)', { lineHeight: 1, color: BAI.surface })}>Le lundi matin, une liste courte.</h2>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: BAI.onDark }}>Votre espace montre seulement ce qui est à faire cette semaine, avec le document déjà prêt. Rien ne part sans que vous l’ayez relu.</p>
            </div>
            <div className="stack" style={{ flex: 1, gap: 12, width: '100%' }} aria-label="Exemple de liste">
              {TASKS.map((t) => (
                <div key={t.text} className="col-md" style={{ background: BAI.surface, borderRadius: 16, padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: t.tagColor, background: t.tagBg, padding: '5px 10px', borderRadius: 999 }}>{t.tag}</span>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{t.text}</span>
                  </div>
                  <span aria-hidden style={{ flexShrink: 0, textAlign: 'center', background: BAI.owner, color: BAI.surface, fontSize: 14, fontWeight: 600, padding: '11px 16px', borderRadius: 10 }}>{t.cta}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', display: 'flex', justifyContent: 'center' }}>
          <article
            className="home-letter"
            style={{ width: '100%', maxWidth: 720, boxSizing: 'border-box', background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 4, padding: 'clamp(28px, 5vw, 56px)', boxShadow: '0 18px 40px -22px rgba(26,26,46,0.25)' }}
          >
            <h2 style={display('clamp(34px, 4vw, 46px)', { lineHeight: 1.05, marginBottom: 20 })}>Ce que Bailio ne fera pas</h2>
            <div className="stack" style={{ gap: 14, fontSize: 17, lineHeight: 1.6, color: BAI.inkMid }}>
              <p style={{ margin: 0 }}>Il ne remplace pas un avocat. Quand une situation en demande un, l’application vous le dit au lieu d’improviser.</p>
              <p style={{ margin: 0 }}>Il ne touche jamais à votre argent ni au dépôt de garantie : les loyers vont de votre locataire à vous, directement.</p>
              <p style={{ margin: 0 }}>Il n’envoie rien à votre locataire sans votre accord.</p>
              <p style={{ margin: 0 }}>Et vos données ne sont ni revendues, ni confiées à une intelligence artificielle. Elles restent sur un serveur en Suisse.</p>
            </div>
            <div style={{ marginTop: 26 }}>
              <div style={hand(34, BAI.ink)}>Enzo</div>
              <div style={{ fontSize: 14, color: BAI.inkSoft }}>fondateur de Bailio</div>
            </div>
          </article>
        </section>

        <section id="tarifs" className="container stack" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', alignItems: 'center', gap: 40, scrollMarginTop: 24 }}>
          <h2 style={display('clamp(40px, 5vw, 60px)', { textAlign: 'center' })}>Combien ça coûte</h2>
          <div className="col-md" style={{ display: 'flex', gap: 24, width: '100%', justifyContent: 'center' }}>
            <div className="stack full-md" style={{ width: 400, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, padding: 40, gap: 18 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Votre premier bail</div>
              <div style={display(64, { lineHeight: 1 })}>Gratuit</div>
              <div style={{ fontSize: 16, color: BAI.inkMid }}>Sans carte bancaire. Vous le téléchargez et il est à vous.</div>
              <Link to="/commencer" style={{ textDecoration: 'none', border: `1.5px solid ${BAI.owner}`, color: BAI.owner, height: 56, borderRadius: 14, fontWeight: 600, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
                Créer mon bail
              </Link>
            </div>
            <div className="stack full-md" style={{ width: 400, background: BAI.night, borderRadius: 24, padding: 40, gap: 18, color: BAI.surface }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Bailio, tout inclus</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={display(MONTHLY_PRICE ? 64 : 44, { lineHeight: 1, color: BAI.caramel })}>{priceLabel()}</span>
                {MONTHLY_PRICE ? <span style={{ fontSize: 16, color: BAI.onDarkMuted }}>par mois</span> : null}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: BAI.caramel }}>{LAUNCH_OFFER} : rien à payer aujourd’hui.</div>
              <div style={{ fontSize: 16, color: BAI.onDark }}>Les quittances chaque mois, la révision du loyer et les rappels avant chaque échéance. Sans engagement, et un email vous prévient avant tout paiement.</div>
              <Link to="/commencer" style={{ textDecoration: 'none', background: BAI.caramel, color: BAI.night, height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
                Essayer
              </Link>
            </div>
          </div>
        </section>

        <section className="container stack" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', alignItems: 'center', gap: 28 }}>
          <h2 style={display('clamp(34px, 4vw, 46px)', { textAlign: 'center' })}>Les questions qu’on nous pose</h2>
          <dl style={{ width: '100%', maxWidth: 800, margin: 0 }}>
            {FAQ.map((f, i) => (
              <div key={f.q} className="stack" style={{ borderTop: `1px solid ${BAI.rule}`, borderBottom: i === FAQ.length - 1 ? `1px solid ${BAI.rule}` : undefined, padding: '24px 0', gap: 6 }}>
                <dt style={{ fontSize: 19, fontWeight: 600 }}>{f.q}</dt>
                <dd style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: BAI.inkMid }}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)' }}>
          <div className="col-md" style={{ background: BAI.owner, borderRadius: 28, padding: 'clamp(36px, 5vw, 64px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28 }}>
            <div className="stack" style={{ gap: 10 }}>
              <h2 style={display('clamp(36px, 4.6vw, 56px)', { color: BAI.surface, lineHeight: 1 })}>Le premier bail est offert.</h2>
              <p style={{ margin: 0, fontSize: 17, color: BAI.ownerLight }}>Cinq minutes, et vous repartez avec un bail prêt à signer.</p>
            </div>
            <Link to="/commencer" className="full-md" style={{ flexShrink: 0, textDecoration: 'none', background: BAI.surface, color: BAI.owner, height: 60, padding: '0 32px', borderRadius: 14, fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              Créer mon bail
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
