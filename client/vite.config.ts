import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

declare const process: { env: Record<string, string | undefined> }

// Adresse publique du site : balises canoniques, partage, robots.txt et plan du site.
const SITE_URL = (process.env.VITE_SITE_URL || 'https://bailio.fr').replace(/\/$/, '')

const PUBLIC_PAGES: [path: string, freq: string, priority: string][] = [
  ['/', 'weekly', '1.0'],
  ['/importer', 'monthly', '0.6'],
  ['/mentions-legales', 'yearly', '0.2'],
  ['/conditions', 'yearly', '0.2'],
  ['/confidentialite', 'yearly', '0.2'],
  ['/contact', 'yearly', '0.3'],
]

function siteUrl(): Plugin {
  return {
    name: 'bailio-site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: ['User-agent: *', 'Allow: /', ...['/espace', '/commencer', '/connexion', '/reprendre', '/bienvenue'].map((p) => `Disallow: ${p}`), `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
      })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...PUBLIC_PAGES.map(([p, f, pr]) => `  <url><loc>${SITE_URL}${p}</loc><changefreq>${f}</changefreq><priority>${pr}</priority></url>`),
          '</urlset>',
          '',
        ].join('\n'),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), siteUrl()],
  server: {
    port: 5173,
    // En développement, /api est relayé vers l'API locale.
    proxy: { '/api': 'http://localhost:5000' },
  },
  // Mêmes en-têtes de sécurité qu'en ligne (vercel.json), pour les vérifier en local.
  preview: { proxy: { '/api': 'http://localhost:5000' }, headers: { 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob:; connect-src 'self'; frame-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests" } },
  // Un seul fichier pour tout le site (voir App.tsx) : environ 190 Ko compressés.
  build: { chunkSizeWarningLimit: 900 },
})
