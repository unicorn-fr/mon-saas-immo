import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { registerServiceWorker } from './utils/registerServiceWorker'

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    await registerServiceWorker()
    // Disabled: requestPersistentStorage() was causing unnecessary permission prompts
    // The browser can manage cache without explicit persistent storage permission
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
