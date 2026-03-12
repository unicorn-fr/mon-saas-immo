import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Footer from '../../components/layout/Footer'

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #d2d2d7',
  borderRadius: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
}

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }
    setSending(true)
    // Simulate send
    await new Promise((r) => setTimeout(r, 1000))
    toast.success('Votre message a bien été envoyé ! Nous vous répondrons sous 24h.')
    setForm({ name: '', email: '', subject: '', message: '' })
    setSending(false)
  }

  const inputClass =
    'w-full px-3.5 py-2.5 rounded-xl border border-[#d2d2d7] bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30 focus:border-[#007AFF] transition-colors'

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      <header className="bg-white border-b border-[#d2d2d7]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-[#007AFF] rounded-xl flex items-center justify-center">
              <HomeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block">ImmoParticuliers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#007AFF] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Nous contacter</h1>
          <p className="text-slate-500">Une question ? Un problème ? Notre équipe est là pour vous aider.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div style={cardStyle} className="p-6 text-center">
            <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Mail className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Email</h3>
            <p className="text-sm text-slate-500">contact@immoparticuliers.fr</p>
          </div>
          <div style={cardStyle} className="p-6 text-center">
            <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center mx-auto mb-3">
              <Phone className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Téléphone</h3>
            <p className="text-sm text-slate-500">01 XX XX XX XX</p>
            <p className="text-xs text-slate-400 mt-0.5">Lun-Ven, 9h-18h</p>
          </div>
          <div style={cardStyle} className="p-6 text-center">
            <div className="w-11 h-11 bg-[#e8f0fe] rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-5 h-5 text-[#007AFF]" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 text-sm">Adresse</h3>
            <p className="text-sm text-slate-500">12 Rue de la Paix</p>
            <p className="text-xs text-slate-400 mt-0.5">75002 Paris, France</p>
          </div>
        </div>

        <div style={cardStyle} className="p-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Envoyez-nous un message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@exemple.fr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Sujet</label>
              <select
                className={inputClass}
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
              <textarea
                className={`${inputClass} min-h-[150px] resize-y`}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez votre demande..."
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white font-semibold text-sm hover:bg-[#0066d6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
