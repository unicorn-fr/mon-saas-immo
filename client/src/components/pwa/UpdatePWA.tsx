import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export const UpdatePWA = () => {
  const [showUpdate, setShowUpdate] = useState(false)

  useEffect(() => {
    // Listen for service worker update available event
    const handleUpdateAvailable = () => {
      setShowUpdate(true)
    }

    window.addEventListener('sw-update-available', handleUpdateAvailable)

    return () => {
      window.removeEventListener('sw-update-available', handleUpdateAvailable)
    }
  }, [])

  const handleUpdate = () => {
    // Reload the page to activate the new service worker
    window.location.reload()
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  if (!showUpdate) {
    return null
  }

  return (
    <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 border-2 border-primary-200">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Content */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <RefreshCw className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              Nouvelle version disponible
            </h3>
            <p className="text-sm text-gray-600">
              Une nouvelle version de l'application est prête à être installée.
            </p>
          </div>
        </div>

        {/* Update Button */}
        <button
          onClick={handleUpdate}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Mettre à jour maintenant
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          La page sera rechargée automatiquement
        </p>
      </div>
    </div>
  )
}
