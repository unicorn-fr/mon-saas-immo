import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { recoverOnce, reportError } from './lib/recover'
// Polices servies par le site lui-même : aucune requête vers Google (adresse IP des visiteurs).
// Fraunces (titres, axe « SOFT » pour des empattements arrondis) et Figtree (texte, boutons, champs).
import '@fontsource-variable/fraunces/soft.css'
import '@fontsource-variable/fraunces/soft-italic.css'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-500.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import './styles.css'

// Un ancien service worker (version précédente du site) peut encore servir de vieux fichiers
// et afficher une page vide : on le désinstalle et on vide ses caches.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => {
      if (!regs.length) return
      return Promise.all(regs.map((r) => r.unregister())).then(() => (window.caches ? caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) : undefined))
    })
    .catch(() => undefined)
}

window.addEventListener('error', (e) => reportError(e.error ?? e.message, 'window'))
window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'promise'))

createRoot(document.getElementById('root')!, {
  // Erreur hors de toute page : sans cela React viderait l'écran (page beige). On recharge une fois.
  onUncaughtError: (error) => {
    reportError(error, 'racine')
    recoverOnce()
  },
}).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
