import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { Check, Cross, Pin } from '../components/Icons'
import { display } from '../components/ui'
import { LAUNCH_OFFER, MONTHLY_PRICE, priceLabel } from '../config'

// Ce que Bailio fait réellement, dit simplement. Chaque ligne correspond à une fonction du produit.
const FEATURES = [
  {
    title: 'Le bail',
    text: "Le contrat type du décret de 2015, vide ou meublé, rempli avec vos réponses. La durée, le dépôt maximum et le préavis sont calculés d'après la loi de 1989.",
  },
  {
    title: 'Les quittances',
    text: 'Chaque mois, la quittance au nom de votre locataire, prête à télécharger, imprimer ou joindre à un email.',
  },
  {
    title: 'La révision du loyer',
    text: "À la date anniversaire, le nouveau loyer est calculé avec l'indice publié par l'Insee (IRL). Rien n'augmente si le logement est classé F ou G.",
  },
  {
    title: 'Les dates à ne pas oublier',
    text: "Assurance du locataire, révision, date limite pour donner congé : vous recevez un email une semaine avant.",
  },
]

const STEPS = [
  { when: 'Environ 5 minutes', title: 'Vous répondez aux questions', text: "Le logement, vous et votre locataire, le loyer. Rien n'est demandé deux fois." },
  { when: 'Ensuite', title: 'Vous le faites signer', text: 'Bailio vérifie chaque mention obligatoire. Signature en ligne ou sur papier.' },
  { when: 'Pendant toute la location', title: 'Bailio garde les dates', text: 'Quittances, révision, fin du bail : vous êtes prévenu à temps.' },
]

const TASKS = [
  { tag: 'Loyer du 5 octobre', tagColor: BAI.green, tagBg: BAI.greenLight, text: 'Quittance de Thomas Martin prête', cta: 'Télécharger' },
  { tag: 'Révision du loyer', tagColor: BAI.owner, tagBg: BAI.ownerTint, text: 'Nouveau loyer : 812,40 € au 1er novembre', cta: 'Relire' },
  { tag: 'Assurance', tagColor: BAI.caramelDark, tagBg: BAI.caramelLight, text: 'Attestation à demander à votre locataire', cta: 'Demander' },
]

const DOES = [
  'Des documents conformes au modèle officiel',
  'Le suivi de toutes vos dates importantes',
  'Vos baux et quittances rangés au même endroit',
  "Chaque version d'un document conservée, en cas de litige",
]
const DOES_NOT = [
  'Il ne remplace pas un avocat. Quand il en faut un, on vous le dit.',
  'Il ne touche jamais à votre argent ni au dépôt de garantie.',
  "Il n'envoie rien à votre locataire sans votre accord.",
  'Il ne revend pas vos données.',
]

const FAQ = [
  { q: 'Mon bail est-il valable ?', a: "Oui. Il reprend le contrat type fixé par le décret n° 2015-587, que tout bail d'habitation doit suivre." },
  { q: "J'ai déjà un locataire. Ça marche ?", a: 'Oui. Envoyez une photo ou le PDF de votre bail signé, vérifiez les informations, et le suivi démarre.' },
  { q: "Mon locataire doit-il s'inscrire ?", a: "Non. C'est vous qui lui envoyez ses quittances, depuis votre propre adresse email." },
  { q: 'Je peux tout imprimer ?', a: 'Oui. Tous les documents sont prévus pour le papier, au format A4.' },
]

const section = { paddingTop: 'clamp(72px, 8vw, 120px)', paddingBottom: 'clamp(72px, 8vw, 120px)' }

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
        <section className="container stack" style={{ padding: 'clamp(56px, 7.8vw, 112px) 0 clamp(72px, 8.3vw, 120px)', alignItems: 'center', textAlign: 'center', gap: 32 }}>
          <h1 style={display('clamp(44px, 10vw, 104px)', { lineHeight: 0.95, maxWidth: 1000 })}>Vos locations, sans la paperasse.</h1>
          <p style={{ margin: 0, fontSize: 'clamp(18px, 2.2vw, 22px)', lineHeight: 1.5, color: BAI.inkMid, maxWidth: 680 }}>
            Bail, quittances, révision du loyer, fin de bail. Bailio prépare les papiers et vous rappelle les dates. Vous gardez la main.
          </p>
          <form
            onSubmit={start}
            className="col-md"
            style={{ marginTop: 12, width: '100%', maxWidth: 760, background: BAI.surface, border: `1.5px solid ${BAI.border}`, borderRadius: 20, padding: 10, display: 'flex', gap: 10, alignItems: 'center', boxShadow: '0 12px 40px rgba(26,26,46,0.08)' }}
          >
            <label htmlFor="home-address" className="sr-only">
              Adresse du logement
            </label>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, width: '100%' }}>
              <span style={{ marginLeft: 14, display: 'flex' }}>
                <Pin />
              </span>
              <input
                id="home-address"
                placeholder="Adresse du logement à louer"
                autoComplete="street-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ flex: 1, minWidth: 0, height: 56, border: 'none', outline: 'none', fontSize: 18, background: 'transparent', padding: '0 12px' }}
              />
            </div>
            <button type="submit" className="full-md" style={{ flexShrink: 0, background: BAI.owner, color: BAI.surface, height: 60, padding: '0 28px', borderRadius: 14, fontWeight: 600, fontSize: 17, border: 'none' }}>
              Créer mon bail gratuit
            </button>
          </form>
          <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid }}>Gratuit pour votre premier bail. Pas besoin de créer un compte pour commencer.</p>
          <Link to="/importer" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Vous avez déjà un bail signé ? Importez-le en photo
          </Link>
        </section>

        <section style={{ background: BAI.surface, borderTop: `1px solid ${BAI.divider}`, borderBottom: `1px solid ${BAI.divider}` }}>
          <div className="container split" style={{ ...section, gap: 'clamp(32px, 6vw, 96px)' }}>
            <div className="stack" style={{ flexShrink: 0, width: 'min(100%, 340px)', gap: 16 }}>
              <h2 style={display('clamp(40px, 4.5vw, 56px)', { lineHeight: 1 })}>Ce que vous obtenez</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.55, color: BAI.inkMid }}>Quatre choses, faites correctement. Pas de tableau de bord à apprendre.</p>
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
          <h2 style={display('clamp(40px, 5vw, 60px)')}>Comment ça marche</h2>
          <ol className="grid-3" style={{ width: '100%', listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((s) => (
              <li key={s.title} className="stack" style={{ gap: 10, borderTop: `2px solid ${BAI.ink}`, paddingTop: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: BAI.caramelInk }}>{s.when}</span>
                <span style={{ fontSize: 22, fontWeight: 600 }}>{s.title}</span>
                <span style={{ fontSize: 17, lineHeight: 1.5, color: BAI.inkMid }}>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)' }}>
          <div className="split" style={{ background: BAI.night, borderRadius: 32, padding: 'clamp(32px, 5.5vw, 80px)', alignItems: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
            <div className="stack" style={{ maxWidth: 480, gap: 20 }}>
              <h2 style={display('clamp(40px, 5vw, 60px)', { lineHeight: 1, color: BAI.surface })}>Une liste, pas un tableau de bord.</h2>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: BAI.onDark }}>Dans votre espace, seulement ce qui est à faire dans les prochains jours, avec le document déjà prêt. Rien ne part sans vous.</p>
            </div>
            <div className="stack" style={{ flex: 1, gap: 14, width: '100%' }} aria-label="Exemple de liste">
              {TASKS.map((t) => (
                <div key={t.text} className="col-md" style={{ background: BAI.surface, borderRadius: 18, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
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

        <section className="container stack" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', alignItems: 'center', gap: 48 }}>
          <h2 style={display('clamp(40px, 5vw, 60px)', { textAlign: 'center' })}>Franchement.</h2>
          <div className="grid-2" style={{ width: '100%', maxWidth: 1120 }}>
            {[
              { title: 'Ce que Bailio fait', items: DOES, icon: <Check size={18} /> },
              { title: 'Ce que Bailio ne fait pas', items: DOES_NOT, icon: <Cross /> },
            ].map((col) => (
              <div key={col.title} className="stack" style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, padding: 'clamp(24px, 3vw, 36px)', gap: 18 }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{col.title}</h3>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} className="stack">
                  {col.items.map((it) => (
                    <li key={it} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 17, lineHeight: 1.45, marginBottom: 18 }}>
                      <span style={{ marginTop: 4, display: 'flex' }}>{col.icon}</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="tarifs" className="container stack" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', alignItems: 'center', gap: 40, scrollMarginTop: 24 }}>
          <h2 style={display('clamp(40px, 5vw, 60px)', { textAlign: 'center' })}>Un seul tarif</h2>
          <div className="col-md" style={{ display: 'flex', gap: 24, width: '100%', justifyContent: 'center' }}>
            <div className="stack full-md" style={{ width: 400, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 24, padding: 40, gap: 18 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>Votre premier bail</div>
              <div style={display(64, { lineHeight: 1 })}>Gratuit</div>
              <div style={{ fontSize: 16, color: BAI.inkMid }}>Sans carte bancaire.</div>
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
              <div style={{ fontSize: 16, color: BAI.onDark }}>Quittances chaque mois, révision du loyer, rappels par email avant chaque échéance. Sans engagement. Vous serez prévenu par email avant tout paiement.</div>
              <Link to="/commencer" style={{ textDecoration: 'none', background: BAI.caramel, color: BAI.night, height: 56, borderRadius: 14, fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto' }}>
                Essayer
              </Link>
            </div>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)', display: 'flex', justifyContent: 'center' }}>
          <dl style={{ width: '100%', maxWidth: 800, margin: 0 }}>
            {FAQ.map((f, i) => (
              <div key={f.q} className="stack" style={{ borderTop: `1px solid ${BAI.rule}`, borderBottom: i === FAQ.length - 1 ? `1px solid ${BAI.rule}` : undefined, padding: '24px 0', gap: 6 }}>
                <dt style={{ fontSize: 19, fontWeight: 600 }}>{f.q}</dt>
                <dd style={{ margin: 0, fontSize: 17, color: BAI.inkMid }}>{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)' }}>
          <div className="stack" style={{ background: BAI.owner, borderRadius: 32, padding: 'clamp(40px, 5.5vw, 80px) 24px', alignItems: 'center', gap: 28, textAlign: 'center' }}>
            <h2 style={display('clamp(40px, 5.5vw, 64px)', { color: BAI.surface })}>Votre bail, sans rien oublier.</h2>
            <Link to="/commencer" style={{ textDecoration: 'none', background: BAI.surface, color: BAI.owner, height: 64, padding: '0 36px', borderRadius: 16, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center' }}>
              Créer mon bail gratuit
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
