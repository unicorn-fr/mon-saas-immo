import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Clock, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { Header } from '../../components/layout/Header'

const T = {
  bgBase:    '#fafaf8',
  bgSurface: '#ffffff',
  bgMuted:   '#f4f2ee',
  ink:       '#0d0c0a',
  inkMid:    '#5a5754',
  inkFaint:  '#9e9b96',
  night:     '#1a1a2e',
  caramel:   '#c4976a',
  caramelLight: '#fdf5ec',
  border:    '#e4e1db',
  success:   '#1b5e3b',
  fontDisplay: "'Cormorant Garamond', Georgia, serif",
  fontBody:    "'DM Sans', system-ui, sans-serif",
} as const

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: `1px solid ${T.border}`,
  background: T.bgMuted,
  color: T.ink,
  fontFamily: T.fontBody,
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.15s',
  boxSizing: 'border-box',
}

const CONTACT_ITEMS = [
  {
    Icon: Mail,
    label: 'bonjour@bailio.fr',
    sub: 'Réponse en moins de 4 h ouvrées',
  },
  {
    Icon: Clock,
    label: 'Lundi – Vendredi · 9h–18h',
    sub: 'Pas de bot, pas de ticket numéroté',
  },
]

export default function Contact() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    role: '', subject: '', message: '',
  })
  const [sending, setSending] = useState(false)
  const [focused, setFocused] = useState('')
  const [sent, setSent] = useState(false)

  const inp = (field: string): React.CSSProperties => ({
    ...inputBase,
    borderColor: focused === field ? T.night : T.border,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.email || !form.message) {
      toast.error('Remplis les champs obligatoires')
      return
    }
    setSending(true)
    await new Promise(r => setTimeout(r, 900))
    toast.success('Message envoyé — on te répond dans les 4 h ouvrées.')
    setSent(true)
    setSending(false)
  }

  return (
    <div style={{ backgroundColor: T.bgBase, fontFamily: T.fontBody, color: T.ink, minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      <Header />

      <section style={{ padding: 'clamp(64px,10vh,100px) 0 clamp(64px,10vh,100px)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'start' }}>

            {/* ── Colonne gauche ── */}
            <div>
              <p style={{ fontFamily: T.fontBody, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.caramel, margin: '0 0 14px' }}>
                Contact
              </p>
              <h1 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 'clamp(36px,5vw,56px)', lineHeight: 1.05, margin: '0 0 18px' }}>
                On t'écoute.{' '}
                <em style={{ color: T.caramel }}>Vraiment.</em>
              </h1>
              <p style={{ fontSize: 16, color: T.inkMid, lineHeight: 1.65, margin: '0 0 36px', maxWidth: '38ch' }}>
                Une question, un retour, un bug à signaler — on répond en moins de 4 heures ouvrées. Pas de bot, pas de ticket numéroté.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {CONTACT_ITEMS.map(({ Icon, label, sub }) => (
                  <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: T.caramelLight, color: T.caramel, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: T.ink }}>{label}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: T.inkFaint }}>{sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ teaser */}
              <div style={{ marginTop: 48, padding: '20px 24px', background: T.bgMuted, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                <p style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 18, margin: '0 0 6px', color: T.ink }}>Tu cherches une réponse rapide ?</p>
                <p style={{ fontSize: 13, color: T.inkMid, margin: '0 0 14px' }}>La FAQ couvre 90 % des questions courantes.</p>
                <Link to="/faq" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: T.night, textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Voir la FAQ <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* ── Colonne droite — formulaire ── */}
            <div style={{ background: T.bgSurface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#edf7f2', border: '1px solid #9fd4ba', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <path d="M6 14l5 5 11-11" stroke={T.success} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 style={{ fontFamily: T.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: T.ink, margin: '0 0 10px' }}>Message envoyé ✓</h2>
                  <p style={{ fontSize: 15, color: T.inkMid, margin: '0 0 28px' }}>On te répond dans les 4 heures ouvrées.</p>
                  <button
                    onClick={() => { setSent(false); setForm({ firstName: '', lastName: '', email: '', role: '', subject: '', message: '' }) }}
                    style={{ fontSize: 14, color: T.caramel, background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.fontBody, fontWeight: 600, textDecoration: 'underline' }}
                  >
                    Envoyer un autre message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Prénom / Nom */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Prénom *</label>
                      <input
                        type="text" placeholder="Camille"
                        value={form.firstName}
                        onChange={e => setForm({ ...form, firstName: e.target.value })}
                        onFocus={() => setFocused('firstName')}
                        onBlur={() => setFocused('')}
                        style={inp('firstName')}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Nom</label>
                      <input
                        type="text" placeholder="Dupont"
                        value={form.lastName}
                        onChange={e => setForm({ ...form, lastName: e.target.value })}
                        onFocus={() => setFocused('lastName')}
                        onBlur={() => setFocused('')}
                        style={inp('lastName')}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Email *</label>
                    <input
                      type="email" placeholder="ton@email.fr"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      onFocus={() => setFocused('email')}
                      onBlur={() => setFocused('')}
                      style={inp('email')}
                    />
                  </div>

                  {/* Rôle */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Tu es</label>
                    <select
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      onFocus={() => setFocused('role')}
                      onBlur={() => setFocused('')}
                      style={inp('role')}
                    >
                      <option value="">— Sélectionne</option>
                      <option value="owner">Propriétaire</option>
                      <option value="tenant">Locataire</option>
                      <option value="curious">Curieux / curieuse</option>
                      <option value="press">Journaliste / Presse</option>
                    </select>
                  </div>

                  {/* Sujet */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Sujet</label>
                    <input
                      type="text" placeholder="Pourquoi Bailio ?"
                      value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      onFocus={() => setFocused('subject')}
                      onBlur={() => setFocused('')}
                      style={inp('subject')}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T.ink, marginBottom: 6 }}>Message *</label>
                    <textarea
                      placeholder="Dis-nous tout."
                      rows={5}
                      value={form.message}
                      onChange={e => setForm({ ...form, message: e.target.value })}
                      onFocus={() => setFocused('message')}
                      onBlur={() => setFocused('')}
                      style={{ ...inp('message'), resize: 'vertical' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    style={{
                      width: '100%', padding: '14px', marginTop: 6,
                      background: sending ? '#4a4a6a' : T.night,
                      color: '#fff', border: 'none', borderRadius: 10,
                      fontSize: 14, fontWeight: 600, fontFamily: T.fontBody,
                      cursor: sending ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={e => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = '#2a2a4a' }}
                    onMouseLeave={e => { if (!sending) (e.currentTarget as HTMLButtonElement).style.background = T.night }}
                  >
                    {sending ? 'Envoi en cours…' : 'Envoyer'}
                  </button>

                  <p style={{ fontSize: 12, color: T.inkFaint, margin: 0, textAlign: 'center' }}>
                    En envoyant ce message, tu acceptes notre{' '}
                    <Link to="/confidentialite" style={{ color: T.caramel, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      politique de confidentialité
                    </Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background: T.night, padding: '32px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px,5vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontFamily: T.fontBody, fontSize: 13, color: 'rgba(255,255,255,0.28)', margin: 0 }}>© {new Date().getFullYear()} Bailio. Tous droits réservés.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[{ to: '/cgu', label: 'CGU' }, { to: '/confidentialite', label: 'Confidentialité' }, { to: '/mentions-legales', label: 'Mentions légales' }].map(l => (
              <Link key={l.to} to={l.to} style={{ fontFamily: T.fontBody, fontSize: 12, color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}>{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
