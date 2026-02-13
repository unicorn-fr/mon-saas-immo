import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/index.css'
import { registerServiceWorker, requestPersistentStorage } from './utils/registerServiceWorker'

// Register Service Worker for PWA
if (import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    await registerServiceWorker()
    await requestPersistentStorage()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
