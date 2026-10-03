import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { LAUNCH_OFFER, priceLabel } from './src/config'

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
  ['/cookies', 'yearly', '0.2'],
  ['/prix-et-remboursement', 'yearly', '0.3'],
  ['/accessibilite', 'yearly', '0.2'],
]

// Description du service pour les assistants et agents d'IA (format llms.txt) : informations publiques seulement.
const LLMS_TXT = `# Bailio

> Bailio aide les propriétaires bailleurs particuliers en France à louer leur logement (résidence principale, vide ou meublé) : bail conforme au contrat type du décret n° 2015-587, signature électronique, états des lieux, quittances, révision du loyer, courriers, aide à la déclaration des revenus fonciers et rappels des échéances. Il n'y a pas d'espace locataire.

- Premier bail gratuit, sans carte bancaire. Offre de suivi : ${priceLabel()} par mois, sans engagement (${LAUNCH_OFFER.toLowerCase()}).
- Connexion sans mot de passe, par lien envoyé par email.
- Données hébergées en Suisse (Infomaniak). Aucun cookie, aucune publicité, aucune donnée envoyée à un service d'IA.
- Règles contrôlées : loi n° 89-462 du 6 juillet 1989 (dépôt de garantie, durée, plafonds du loyer, logements interdits à la location selon le DPE, validité des diagnostics).
- Bailio n'est pas un avocat et ne donne pas de conseil juridique personnalisé.

## Pages

- [Accueil](${SITE_URL}/): présentation, tarifs et questions fréquentes
- [Créer un bail](${SITE_URL}/commencer): tunnel public, sans compte
- [Importer un bail signé](${SITE_URL}/importer)
- [Conditions d'utilisation](${SITE_URL}/conditions)
- [Confidentialité](${SITE_URL}/confidentialite)
- [Cookies](${SITE_URL}/cookies)
- [Prix et remboursement](${SITE_URL}/prix-et-remboursement)
- [Accessibilité](${SITE_URL}/accessibilite)
- [Mentions légales](${SITE_URL}/mentions-legales)
- [Contact](${SITE_URL}/contact)

## Documents officiels publics

- [Notice d'information jointe au bail (arrêté du 29 mai 2015)](${SITE_URL}/api/notice-information.pdf)
- [Réparations locatives (décret n° 87-712)](${SITE_URL}/api/reparations-locatives.pdf)
- [Charges récupérables (décret n° 87-713)](${SITE_URL}/api/charges-recuperables.pdf)

## Pour les agents

Les espaces des propriétaires et les liens remis aux locataires (/espace, /signer, /dossier, /locataire, /edl, /candidature) sont privés : ne pas les explorer ni les résumer.
`

function siteUrl(): Plugin {
  return {
    name: 'bailio-site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: ['User-agent: *', 'Allow: /', ...['/espace', '/commencer/', '/connexion', '/inscription', '/reprendre', '/bienvenue', '/signer/', '/dossier/', '/locataire/', '/edl/', '/candidature/'].map((p) => `Disallow: ${p}`), `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
      })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: LLMS_TXT })
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
  // Pages importées sans chargement différé (voir App.tsx) ; les bibliothèques sont dans des fichiers à part,
  // téléchargés en parallèle et gardés en cache d'une mise à jour à l'autre (leur nom ne change pas).
  build: {
    chunkSizeWarningLimit: 600,
    target: ['es2020', 'safari14', 'chrome87', 'firefox78', 'edge88'],
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          if (id.includes('react-router')) return 'router'
          return 'vendor'
        },
      },
    },
  },
})
