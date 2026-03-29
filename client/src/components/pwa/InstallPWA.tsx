import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Don't show again for 7 days after dismissal
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay (better UX)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('[PWA] App was installed')
      setIsInstalled(true)
      setShowPrompt(false)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`[PWA] User response: ${outcome}`)

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt')
    } else {
      console.log('[PWA] User dismissed the install prompt')
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (isInstalled || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-fade-in-up">
      <div className="relative rounded-xl p-6" style={{
        background: '#1a1a2e',
        boxShadow: '0 8px 40px rgba(13,12,10,0.28)',
        color: '#ffffff',
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-xl transition-opacity hover:opacity-70"
          style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#eaf0fb', border: '1px solid #b8ccf0' }}>
            <Smartphone className="w-8 h-8" style={{ color: '#1a3270' }} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>Installer l'application</h3>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Accédez rapidement à Bailio
            </p>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 mb-4 text-sm">
          {['Accès rapide depuis votre écran d\'accueil', 'Fonctionne hors ligne', 'Notifications en temps réel'].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c4976a' }}></div>
              <span style={{ color: 'rgba(255,255,255,0.75)' }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Install Button */}
        <button
          onClick={handleInstallClick}
          className="w-full px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
          style={{ background: '#c4976a', color: '#ffffff', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14 }}
        >
          <Download className="w-5 h-5" />
          Installer maintenant
        </button>
      </div>
    </div>
  )
}
