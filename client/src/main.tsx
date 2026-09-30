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

// Fichier d'une ancienne version introuvable après une mise en ligne : voir lib/lazyPage.ts (nouvel essai, puis rechargement).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
