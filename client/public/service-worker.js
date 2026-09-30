// Ancien service worker de Bailio : il n'est plus utilisé.
// Un navigateur qui l'a encore installé récupère ce fichier, qui se désinstalle,
// vide tous les caches et recharge les pages ouvertes avec la version actuelle du site.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((c) => c.navigate(c.url))),
  )
})
