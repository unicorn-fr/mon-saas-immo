import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft, Mail, Phone, MapPin, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Footer from '../../components/layout/Footer'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <HomeIcon className="w-7 h-7 text-primary-600" />
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ImmoParticuliers</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Nous contacter</h1>
          <p className="text-gray-500">Une question ? Un problème ? Notre équipe est là pour vous aider.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="card text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Mail className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
            <p className="text-sm text-gray-600">contact@immoparticuliers.fr</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Phone className="w-6 h-6 text-secondary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Téléphone</h3>
            <p className="text-sm text-gray-600">01 XX XX XX XX</p>
            <p className="text-xs text-gray-400">Lun-Ven, 9h-18h</p>
          </div>
          <div className="card text-center">
            <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-success-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Adresse</h3>
            <p className="text-sm text-gray-600">12 Rue de la Paix</p>
            <p className="text-xs text-gray-400">75002 Paris, France</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Envoyez-nous un message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@exemple.fr"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <select
                className="input"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                className="input min-h-[150px] resize-y"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Décrivez votre demande..."
              />
            </div>
            <button type="submit" disabled={sending} className="btn btn-primary flex items-center gap-2">
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
