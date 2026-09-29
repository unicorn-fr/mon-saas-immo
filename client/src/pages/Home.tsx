import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { SiteFooter, SiteHeader } from '../components/SiteChrome'
import { Bell, Camera, Check, Cross, DocIcon, EuroIcon, Pin } from '../components/Icons'
import { display } from '../components/ui'
import { MONTHLY_PRICE, priceLabel } from '../config'

const FEATURES = [
  { icon: <DocIcon />, text: 'Un bail conforme en 5 minutes' },
  { icon: <EuroIcon />, text: 'Des quittances envoyées toutes seules' },
  { icon: <Bell />, text: 'Un rappel avant chaque échéance' },
  { icon: <Camera />, text: 'Vos factures rangées en une photo' },
]

const STEPS = [
  { title: 'Répondez à 4 questions', text: 'Le logement, les personnes, le loyer.' },
  { title: 'Téléchargez votre bail', text: 'Prêt à imprimer et à signer.' },
  { title: 'Bailio prend le relais', text: 'Quittances, rappels, courriers.' },
]

const TASKS = [
  { tag: 'Loyer reçu', tagColor: BAI.green, tagBg: BAI.greenLight, text: 'Quittance de Thomas prête', cta: 'Envoyer' },
  { tag: 'Révision du loyer', tagColor: BAI.owner, tagBg: BAI.ownerTint, text: 'Nouveau loyer calculé, lettre prête', cta: 'Relire' },
  { tag: 'Assurance', tagColor: BAI.caramelDark, tagBg: BAI.caramelLight, text: 'Attestation à demander', cta: 'Demander' },
]

const DOES = [
  'Des documents conformes au modèle officiel',
  'Le suivi de toutes vos dates importantes',
  'Le rangement de vos factures et de vos preuves',
  'Un historique clair si un jour il y a un litige',
]
const DOES_NOT = [
  'Il ne remplace pas un avocat. Quand il en faut un, on vous le dit.',
  'Il ne touche jamais à votre argent ni au dépôt de garantie.',
  "Il n'envoie rien à votre locataire sans votre accord.",
  'Il ne revend pas vos données.',
]

const FAQ = [
  { q: 'Mon bail est-il valable ?', a: 'Oui. Il suit le modèle officiel imposé par la loi.' },
  { q: "J'ai déjà un locataire. Ça marche ?", a: 'Oui. Prenez votre bail en photo, Bailio fait le reste.' },
  { q: "Mon locataire doit-il s'inscrire ?", a: 'Non. Il reçoit simplement ses documents par email.' },
  { q: 'Je peux tout imprimer ?', a: 'Oui. Tous les documents sont prévus pour le papier.' },
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
            Bail, quittances, rappels, factures. Bailio fait l'administratif, vous validez.
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
          <div className="wrap-md" style={{ display: 'flex', gap: '12px 28px', fontSize: 15, color: BAI.inkMid, justifyContent: 'center' }}>
            {['5 minutes', 'Sans inscription pour commencer', 'Conforme à la loi'].map((t) => (
              <span key={t} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Check />
                {t}
              </span>
            ))}
          </div>
          <Link to="/importer" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            Vous avez déjà un bail signé ? Importez-le en photo
          </Link>
        </section>

        <section style={{ background: BAI.surface, borderTop: `1px solid ${BAI.divider}`, borderBottom: `1px solid ${BAI.divider}` }}>
          <div className="container grid-4" style={{ paddingTop: 72, paddingBottom: 72 }}>
            {FEATURES.map((f) => (
              <div key={f.text} className="stack" style={{ gap: 14 }}>
                {f.icon}
                <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.3 }}>{f.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container stack" style={{ ...section, alignItems: 'center', gap: 56 }}>
          <h2 style={display('clamp(40px, 5vw, 60px)', { textAlign: 'center' })}>Comment ça marche</h2>
          <ol className="grid-3" style={{ width: '100%', maxWidth: 1120, listStyle: 'none', margin: 0, padding: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="stack" style={{ gap: 16, alignItems: 'center', textAlign: 'center' }}>
                <div aria-hidden style={{ width: 64, height: 64, borderRadius: 32, background: BAI.night, color: BAI.caramel, display: 'flex', alignItems: 'center', justifyContent: 'center', ...display(32, { color: BAI.caramel }) }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{s.title}</div>
                <div style={{ fontSize: 17, color: BAI.inkMid }}>{s.text}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="container" style={{ paddingBottom: 'clamp(72px, 8vw, 120px)' }}>
          <div className="split" style={{ background: BAI.night, borderRadius: 32, padding: 'clamp(32px, 5.5vw, 80px)', alignItems: 'center', gap: 'clamp(32px, 5vw, 72px)' }}>
            <div className="stack" style={{ maxWidth: 480, gap: 20 }}>
              <h2 style={display('clamp(40px, 5vw, 60px)', { lineHeight: 1, color: BAI.surface })}>Chaque lundi, votre liste est prête.</h2>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.55, color: BAI.onDark }}>Bailio vous dit quoi faire, et le prépare pour vous. Un clic pour valider.</p>
            </div>
            <div className="stack" style={{ flex: 1, gap: 14, width: '100%' }} aria-label="Exemple de liste de la semaine">
              {TASKS.map((t) => (
                <div key={t.text} style={{ background: BAI.surface, borderRadius: 18, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <div className="stack" style={{ gap: 6 }}>
                    <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: t.tagColor, background: t.tagBg, padding: '5px 10px', borderRadius: 999 }}>{t.tag}</span>
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{t.text}</span>
                  </div>
                  <span aria-hidden style={{ flexShrink: 0, background: BAI.owner, color: BAI.surface, fontSize: 14, fontWeight: 600, padding: '11px 16px', borderRadius: 10 }}>{t.cta}</span>
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
              <div style={{ fontSize: 16, color: BAI.onDark }}>Quittances, rappels, états des lieux, factures. Sans engagement.</div>
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
            <h2 style={display('clamp(40px, 5.5vw, 64px)', { color: BAI.surface })}>Votre bail dans 5 minutes.</h2>
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
