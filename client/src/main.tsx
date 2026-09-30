import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
// Polices servies par le site lui-même : aucune requête vers Google (adresse IP des visiteurs).
import '@fontsource/cormorant-garamond/latin-600-italic.css'
import '@fontsource/cormorant-garamond/latin-700-italic.css'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
