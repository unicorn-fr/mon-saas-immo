import { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { Layout } from '../../components/layout/Layout'
import Footer from '../../components/layout/Footer'

const M = {
  bg: '#fafaf8',
  surface: '#ffffff',
  muted: '#f4f2ee',
  inputBg: '#f8f7f4',
  ink: '#0d0c0a',
  inkMid: '#5a5754',
  inkFaint: '#9e9b96',
  night: '#1a1a2e',
  caramel: '#c4976a',
  caramelLight: '#fdf5ec',
  border: '#e4e1db',
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
}

const CONTACT_INFO = [
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@bailio.fr',
    sub: null,
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '01 XX XX XX XX',
    sub: 'Lun-Ven, 9h-18h',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: '12 Rue de la Paix',
    sub: '75002 Paris, France',
  },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: '8px',
  border: `1px solid ${M.border}`,
  background: M.inputBg,
  color: M.ink,
  fontFamily: M.body,
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box',
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setSending(true)
    await new Promise((r) => setTimeout(r, 1000))
    toast.success('Votre message a bien été envoyé ! Nous vous répondrons sous 24h.')
    setForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  const getInputStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === field ? M.night : M.border,
  })

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen" style={{ background: M.bg, fontFamily: M.body }}>
        {/* Hero */}
        <section
          className="py-20 px-4 text-center"
          style={{ background: M.night }}
        >
          <div className="max-w-3xl mx-auto">
            <h1
              style={{
                fontFamily: M.display,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '52px',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '16px',
              }}
            >
              Nous contacter
            </h1>
            <p
              style={{
                fontFamily: M.body,
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.6,
              }}
            >
              Une question ? Un problème ? Notre équipe est là pour vous aider.
            </p>
          </div>
        </section>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Contact info cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {CONTACT_INFO.map((info) => {
              const Icon = info.icon
              return (
                <div
                  key={info.label}
                  className="text-center"
                  style={{
                    background: M.surface,
                    border: `1px solid ${M.border}`,
                    borderRadius: '12px',
                    padding: '28px 20px',
                  }}
                >
                  <div
                    className="flex items-center justify-center mx-auto mb-4"
                    style={{
                      width: '44px',
                      height: '44px',
                      background: M.muted,
                      borderRadius: '10px',
                    }}
                  >
                    <Icon style={{ width: '20px', height: '20px', color: M.night }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: M.body,
                      fontWeight: 600,
                      fontSize: '14px',
                      color: M.ink,
                      marginBottom: '6px',
                    }}
                  >
                    {info.label}
                  </h3>
                  <p style={{ fontFamily: M.body, fontSize: '14px', color: M.inkMid, margin: 0 }}>
                    {info.value}
                  </p>
                  {info.sub && (
                    <p style={{ fontFamily: M.body, fontSize: '12px', color: M.inkFaint, margin: '2px 0 0' }}>
                      {info.sub}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* Form card */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: '12px',
              padding: '40px',
            }}
          >
            <h2
              style={{
                fontFamily: M.display,
                fontWeight: 700,
                fontStyle: 'italic',
                fontSize: '32px',
                color: M.ink,
                marginBottom: '28px',
              }}
            >
              Envoyez-nous un message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: M.body,
                      fontWeight: 500,
                      fontSize: '13px',
                      color: M.ink,
                      marginBottom: '6px',
                    }}
                  >
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    style={getInputStyle('name')}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontFamily: M.body,
                      fontWeight: 500,
                      fontSize: '13px',
                      color: M.ink,
                      marginBottom: '6px',
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    style={getInputStyle('email')}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="jean@exemple.fr"
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: M.body,
                    fontWeight: 500,
                    fontSize: '13px',
                    color: M.ink,
                    marginBottom: '6px',
                  }}
                >
                  Sujet
                </label>
                <select
                  style={getInputStyle('subject')}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  onFocus={() => setFocused('subject')}
                  onBlur={() => setFocused(null)}
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="general">Question générale</option>
                  <option value="bug">Signaler un problème</option>
                  <option value="partnership">Partenariat</option>
                  <option value="press">Presse</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontFamily: M.body,
                    fontWeight: 500,
                    fontSize: '13px',
                    color: M.ink,
                    marginBottom: '6px',
                  }}
                >
                  Message *
                </label>
                <textarea
                  style={{
                    ...getInputStyle('message'),
                    minHeight: '150px',
                    resize: 'vertical',
                  }}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  placeholder="Décrivez votre demande..."
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: sending ? M.inkFaint : M.night,
                  color: '#ffffff',
                  fontFamily: M.body,
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '11px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.15s ease',
                  opacity: sending ? 0.7 : 1,
                }}
              >
                <Send style={{ width: '15px', height: '15px' }} />
                {sending ? 'Envoi en cours...' : 'Envoyer le message'}
              </button>
            </form>
          </div>
        </main>

        <Footer />
      </div>
    </Layout>
  )
}
