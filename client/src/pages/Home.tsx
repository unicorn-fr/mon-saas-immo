import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Home as HomeIcon, Search, Building2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [searchCity, setSearchCity] = useState('')
  const [searchType, setSearchType] = useState('')

  // Redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    if (user.role === 'OWNER') {
      return <Navigate to="/dashboard/owner" replace />
    }
    if (user.role === 'TENANT') {
      return <Navigate to="/dashboard/tenant" replace />
    }
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchCity) params.append('city', searchCity)
    if (searchType) params.append('type', searchType)
    navigate(`/search?${params.toString()}`)
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-8 h-8 text-primary-500" />
              <h1 className="text-2xl font-bold text-gray-900">ImmoParticuliers</h1>
            </div>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {user?.role === 'OWNER' && (
                    <Link to="/dashboard/owner" className="btn btn-primary">
                      Mon Dashboard
                    </Link>
                  )}
                  {user?.role === 'TENANT' && (
                    <Link to="/search" className="btn btn-primary">
                      Rechercher
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost">
                    Connexion
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Inscription
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Trouvez votre logement idéal
            <br />
            <span className="text-primary-500">sans frais d'agence</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Location directe entre particuliers. Propriétaires et locataires se connectent facilement,
            simplement et en toute sécurité.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto bg-white rounded-2xl shadow-card-hover p-6">
            <div className="flex gap-4 flex-col md:flex-row">
              <input
                type="text"
                placeholder="Ville, code postal..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="input flex-1"
              />
              <select
                className="input md:w-48"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                <option value="">Type de bien</option>
                <option value="APARTMENT">Appartement</option>
                <option value="HOUSE">Maison</option>
                <option value="STUDIO">Studio</option>
                <option value="DUPLEX">Duplex</option>
                <option value="LOFT">Loft</option>
              </select>
              <button type="submit" className="btn btn-primary flex items-center gap-2 justify-center">
                <Search className="w-5 h-5" />
                Rechercher
              </button>
            </div>
          </form>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pour les Propriétaires</h3>
              <p className="text-gray-600">
                Publiez vos annonces gratuitement et gérez vos locations facilement
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-secondary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pour les Locataires</h3>
              <p className="text-gray-600">
                Trouvez votre logement idéal sans payer de frais d'agence
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <HomeIcon className="w-8 h-8 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Gratuit</h3>
              <p className="text-gray-600">
                Aucun frais caché. Contact direct entre particuliers
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2026 ImmoParticuliers - Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  )
}
