import { Link } from 'react-router-dom'
import { Home as HomeIcon, ArrowLeft } from 'lucide-react'
import Footer from '../../components/layout/Footer'

export default function MentionsLegales() {
  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      <header className="bg-white border-b border-[#d2d2d7]" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
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

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-[#d2d2d7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-8 lg:p-12">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Mentions légales</h1>
          <p className="text-sm text-slate-400 mb-8">Dernière mise à jour : Février 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">1. Éditeur du site</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Le site ImmoParticuliers est édité par la société ImmoParticuliers SAS,
                au capital de 10 000 euros, immatriculée au Registre du Commerce et des Sociétés
                de Paris sous le numéro RCS Paris XXX XXX XXX.
              </p>
              <ul className="mt-3 space-y-1.5 text-slate-600 text-sm leading-relaxed">
                <li><strong className="text-slate-800">Siège social :</strong> 12 Rue de la Paix, 75002 Paris, France</li>
                <li><strong className="text-slate-800">Directeur de la publication :</strong> [Nom du directeur]</li>
                <li><strong className="text-slate-800">Email :</strong> contact@immoparticuliers.fr</li>
                <li><strong className="text-slate-800">Téléphone :</strong> 01 XX XX XX XX</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">2. Hébergement</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Le site est hébergé par OVH SAS, 2 Rue Kellermann, 59100 Roubaix, France.
                Téléphone : 1007.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">3. Propriété intellectuelle</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, etc.)
                est la propriété exclusive d'ImmoParticuliers SAS ou de ses partenaires.
                Toute reproduction, représentation, modification, publication ou adaptation
                de tout ou partie des éléments du site est interdite sans autorisation écrite préalable.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">4. Responsabilité</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                ImmoParticuliers s'efforce de fournir des informations aussi précises que possible.
                Toutefois, elle ne pourra être tenue responsable des omissions, des inexactitudes
                et des carences dans la mise à jour. ImmoParticuliers se réserve le droit de modifier
                le contenu du site à tout moment et sans préavis.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">5. Droit applicable</h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                Les présentes mentions légales sont soumises au droit français. En cas de litige,
                les tribunaux français seront seuls compétents.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
