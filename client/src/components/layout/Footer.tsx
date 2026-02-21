import { Link } from 'react-router-dom'
import { Home as HomeIcon } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <HomeIcon className="w-7 h-7 text-primary-400" />
              <span className="text-xl font-bold text-white">ImmoParticuliers</span>
            </div>
            <p className="text-sm">
              La plateforme n°1 en France de l'immobilier entre particuliers.
              Simplifiez vos démarches de location.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">Accueil</Link></li>
              <li><Link to="/search" className="hover:text-primary-400 transition-colors">Trouver un bien</Link></li>
              <li><Link to="/faq" className="hover:text-primary-400 transition-colors">FAQ</Link></li>
              <li><Link to="/support" className="hover:text-primary-400 transition-colors">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/mentions-legales" className="hover:text-primary-400 transition-colors">Mentions légales</Link></li>
              <li><Link to="/cgu" className="hover:text-primary-400 transition-colors">CGU</Link></li>
              <li><Link to="/confidentialite" className="hover:text-primary-400 transition-colors">Politique de confidentialité</Link></li>
              <li><Link to="/cookies" className="hover:text-primary-400 transition-colors">Cookies</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">Nous contacter</Link></li>
              <li><Link to="/presse" className="hover:text-primary-400 transition-colors">Presse</Link></li>
              <li><a href="mailto:support@immoparticuliers.fr" className="hover:text-primary-400 transition-colors">support@immoparticuliers.fr</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>© 2026 ImmoParticuliers. Tous droits réservés. Réalisé en France.</p>
        </div>
      </div>
    </footer>
  )
}
