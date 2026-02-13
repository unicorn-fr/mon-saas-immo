// Register Service Worker for PWA functionality

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
      })

      console.log('[PWA] Service Worker registered successfully:', registration)

      // Check for updates periodically
      setInterval(() => {
        registration.update()
      }, 60000) // Check every minute

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, prompt user to refresh
              console.log('[PWA] New version available! Please refresh.')
              
              // Dispatch custom event that can be caught by UI
              window.dispatchEvent(new CustomEvent('sw-update-available'))
            }
          })
        }
      })

      return registration
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error)
      return null
    }
  } else {
    console.warn('[PWA] Service Workers are not supported in this browser')
    return null
  }
}

// Unregister service worker (for development/testing)
export async function unregisterServiceWorker(): Promise<boolean> {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready
    return registration.unregister()
  }
  return false
}

// Check if app is running in standalone mode (installed as PWA)
export function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  )
}

// Request persistent storage (for offline data)
export async function requestPersistentStorage(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist()
    console.log(`[PWA] Persistent storage: ${isPersisted ? 'granted' : 'denied'}`)
    return isPersisted
  }
  return false
}
