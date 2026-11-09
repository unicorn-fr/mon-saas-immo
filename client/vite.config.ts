import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { LAUNCH_OFFER, priceDetail } from './src/config'
import { GUIDES, guidePath, type Guide } from './src/content/guides'
import { MODELES, SIMULATEURS, modelePath, type Modele } from './src/content/modeles'
import { FEATURES, featurePath } from './src/content/fonctionnalites'

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
  ['/securite', 'yearly', '0.3'],
  ['/guides', 'weekly', '0.7'],
  ...GUIDES.map((g): [string, string, string] => [guidePath(g), 'monthly', '0.6']),
  ['/changer-pour-bailio', 'monthly', '0.7'],
  ['/tarifs', 'monthly', '0.8'],
  ['/demo', 'monthly', '0.7'],
  ['/fonctionnalites', 'monthly', '0.8'],
  ...FEATURES.map((f): [string, string, string] => [featurePath(f.slug), 'monthly', '0.8']),
  ['/modeles', 'monthly', '0.7'],
  ...MODELES.map((m): [string, string, string] => [modelePath(m), 'monthly', '0.7']),
  ...SIMULATEURS.map((x): [string, string, string] => [x.path, 'monthly', '0.7']),
]

// Description du service pour les assistants et agents d'IA (format llms.txt) : informations publiques seulement.
const LLMS_TXT = `# Bailio

> Bailio aide les propriétaires bailleurs particuliers en France à louer leur logement (résidence principale, vide ou meublé) : bail conforme au contrat type du décret n° 2015-587, signature électronique, états des lieux, quittances, révision du loyer, courriers, aide à la déclaration des revenus fonciers et rappels des échéances. Il n'y a pas d'espace locataire.

- Premier bail gratuit, sans carte bancaire. Offre de suivi : ${priceDetail()}, tout compris, sans engagement (${LAUNCH_OFFER.toLowerCase()}).
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
- [Sécurité des données](${SITE_URL}/securite)
- [Mentions légales](${SITE_URL}/mentions-legales)
- [Contact](${SITE_URL}/contact)
- [Guides du propriétaire](${SITE_URL}/guides): règles de la location expliquées, sources officielles
${GUIDES.map((g) => `- [${g.title}](${SITE_URL}${guidePath(g)}): ${g.description}`).join('\n')}
- [Tarifs](${SITE_URL}/tarifs): un seul prix tout compris par logement, calculé selon le nombre de logements et de garages, comparé à une agence
- [Changer pour Bailio](${SITE_URL}/changer-pour-bailio): reprendre ses locations depuis un autre outil, un bail en photo, rappel le jour même
- [Essayer Bailio sans compte](${SITE_URL}/demo): espace d'exemple à manipuler en une minute, données fictives, rien d'enregistré
- [Fonctionnalités](${SITE_URL}/fonctionnalites): ce que fait Bailio, avec des captures de l'application
${FEATURES.map((f) => `- [${f.name}](${SITE_URL}${featurePath(f.slug)}): ${f.description}`).join('\n')}
- [Modèles de lettres gratuits](${SITE_URL}/modeles): lettres du propriétaire à copier, règles vérifiées
${MODELES.map((m) => `- [${m.title}](${SITE_URL}${modelePath(m)}): ${m.description}`).join('\n')}
${SIMULATEURS.map((x) => `- [${x.name}](${SITE_URL}${x.path}): ${x.description}`).join('\n')}

## Documents officiels publics

- [Notice d'information jointe au bail (arrêté du 29 mai 2015)](${SITE_URL}/api/notice-information.pdf)
- [Réparations locatives (décret n° 87-712)](${SITE_URL}/api/reparations-locatives.pdf)
- [Charges récupérables (décret n° 87-713)](${SITE_URL}/api/charges-recuperables.pdf)

## Pour les agents

Les espaces des propriétaires et les liens remis aux locataires (/espace, /signer, /dossier, /locataire, /edl, /candidature) sont privés : ne pas les explorer ni les résumer.
`

/** Titre, description et contenu propres à chaque page publique (sinon Google ne voit que l'accueil). */
const PAGE_META: Record<string, { title: string; description: string }> = {
  '/importer': { title: 'Importer un bail signé', description: 'Vous avez déjà un bail signé ? Reprenez-le dans Bailio en quelques minutes : quittances, révision du loyer et rappels des échéances suivent seuls.' },
  '/mentions-legales': { title: 'Mentions légales', description: 'Éditeur, hébergeur et contact du site Bailio.' },
  '/conditions': { title: 'Conditions d’utilisation', description: 'Les conditions générales d’utilisation de Bailio, le bail et le suivi locatif des propriétaires bailleurs particuliers.' },
  '/confidentialite': { title: 'Confidentialité', description: 'Les données que Bailio collecte, pourquoi, combien de temps, chez quels prestataires, et vos droits.' },
  '/contact': { title: 'Contact', description: 'Une question sur votre bail ou sur Bailio ? Laissez votre numéro ou votre email : nous vous rappelons.' },
  '/cookies': { title: 'Cookies', description: 'Bailio n’utilise aucun cookie ni traceur : seulement le stockage indispensable au fonctionnement du site.' },
  '/prix-et-remboursement': { title: 'Prix et remboursement', description: 'Premier bail gratuit, sans carte bancaire. Le suivi de la location, sans engagement : prix, rétractation et remboursement.' },
  '/accessibilite': { title: 'Accessibilité', description: 'Déclaration d’accessibilité de Bailio (RGAA 4.1).' },
  '/securite': { title: 'Sécurité de vos données', description: 'Hébergement en Suisse, sauvegardes, connexion par lien, appareils connectés : ce que Bailio met réellement en place.' },
  '/tarifs': { title: 'Tarifs : un prix, tout compris', description: 'Bailio coûte un seul prix par logement et par mois, signature électronique, quittances, relances et aide à la déclaration compris. Premier mois offert, sans engagement. Calculez votre prix.' },
  '/changer-pour-bailio': { title: 'Changer pour Bailio', description: 'Vous gérez déjà vos locations avec un autre logiciel ? Passez à Bailio en 10 minutes par logement : votre bail en photo, le suivi repart seul, un seul prix tout compris.' },
  '/demo': { title: 'Essayez Bailio sans compte', description: 'Manipulez un espace d’exemple en une minute : noter un loyer reçu, relancer un impayé, créer un bail, préparer la déclaration. Données fictives, rien n’est enregistré.' },
  '/modeles': { title: 'Modèles de lettres gratuits pour propriétaires', description: 'Modèles de lettres gratuits pour les propriétaires bailleurs : mise en demeure de payer, révision du loyer, congé pour vendre. Règles vérifiées sur les sources officielles.' },
  ...Object.fromEntries(SIMULATEURS.map((x) => [x.path, { title: x.title, description: x.description }])),
  '/fonctionnalites': { title: 'Fonctionnalités de Bailio', description: 'Bail conforme signé en ligne, quittances automatiques, relances d’impayés, état des lieux sur téléphone, candidatures et déclaration d’impôts : tout Bailio en captures.' },
  ...Object.fromEntries(FEATURES.map((f) => [featurePath(f.slug), { title: f.title.replace(/[[\]]/g, ''), description: f.description }])),
  '/guides': { title: 'Guides du propriétaire bailleur', description: 'Guides gratuits pour les propriétaires bailleurs : bail, dépôt de garantie, congé, révision du loyer, DPE, quittances. Règles vérifiées sur les sources officielles.' },
}

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const jsonLd = (o: unknown) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`
const frDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toISOString().slice(0, 10)

/** Texte de l'article en HTML simple, pour les robots qui n'exécutent pas JavaScript (dans <noscript>). */
function guideHtml(g: Guide) {
  const body = g.blocks
    .map((b) => ('h' in b ? `<h2>${esc(b.h)}</h2>` : 'p' in b ? `<p>${esc(b.p)}</p>` : 'list' in b ? `<ul>${b.list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p><strong>À retenir :</strong> ${esc(b.note)}</p>`))
    .join('')
  const sources = g.sources.map((x) => `<li><a href="${esc(x.url)}">${esc(x.label)}</a> (vérifié le ${esc(x.checked)})</li>`).join('')
  return `<article><h1>${esc(g.title)}</h1><p>${esc(g.description)}</p>${body}<h2>Sources</h2><ul>${sources}</ul></article><p><a href="/guides">Tous les guides du propriétaire</a> · <a href="/">Bailio</a></p>`
}

/** Modèle de lettre en HTML simple pour les robots (dans <noscript>) : règles, lettre complète, envoi, sources. */
function modeleHtml(m: Modele) {
  const list = (xs: string[]) => `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`
  const letter = [`<p><strong>Objet : ${esc(m.letter.subject)}</strong></p>`, ...m.letter.paragraphs.map((p) => `<p>${esc(p)}</p>`)].join('')
  const sources = m.sources.map((x) => `<li><a href="${esc(x.url)}">${esc(x.label)}</a> (vérifié le ${esc(x.checked)})</li>`).join('')
  return `<article><h1>${esc(m.title)}</h1><p>${esc(m.lead)}</p><h2>Avant d’envoyer</h2>${list(m.rules)}<h2>La lettre</h2>${letter}${m.letter.annexes ? `<h2>À joindre</h2>${list(m.letter.annexes)}` : ''}<h2>Comment l’envoyer</h2><p>${esc(m.send)}</p><h2>Sources</h2><ul>${sources}</ul></article><p><a href="/modeles">Tous les modèles</a> · <a href="/">Bailio</a></p>`
}

const guideText = (g: Guide) => g.blocks.map((b) => ('h' in b ? b.h : 'p' in b ? b.p : 'list' in b ? b.list.join(' ') : b.note)).join('\n')

/** Une page HTML par page publique : titre, description, adresse canonique, partage et données structurées propres. */
function pageHtml(base: string, path: string) {
  const url = `${SITE_URL}${path}`
  const guide = GUIDES.find((g) => guidePath(g) === path)
  const modele = MODELES.find((m) => modelePath(m) === path)
  const meta = guide ? { title: guide.title, description: guide.description } : modele ? { title: modele.title, description: modele.description } : PAGE_META[path]
  if (!meta) return null
  const title = `${meta.title} · Bailio`
  const section = path.startsWith('/guides') ? { name: 'Guides du propriétaire', url: `${SITE_URL}/guides` } : modele || SIMULATEURS.some((x) => x.path === path) || path === '/modeles' ? { name: 'Modèles gratuits', url: `${SITE_URL}/modeles` } : null
  const crumbs = [{ name: 'Bailio', url: `${SITE_URL}/` }, ...(section ? [section] : []), ...(section?.url !== url ? [{ name: meta.title, url }] : [])]
  const ld = [
    jsonLd({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) }),
    guide
      ? jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: guide.title,
          description: guide.description,
          inLanguage: 'fr-FR',
          datePublished: frDate(guide.date),
          dateModified: frDate(guide.date),
          mainEntityOfPage: url,
          url,
          image: `${SITE_URL}/apple-touch-icon.png`,
          author: { '@id': `${SITE_URL}/#organization` },
          publisher: { '@id': `${SITE_URL}/#organization` },
          isAccessibleForFree: true,
          articleBody: guideText(guide),
          citation: guide.sources.map((x) => x.url),
        })
      : path === '/guides'
        ? jsonLd({ '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: GUIDES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}${guidePath(g)}`, name: g.title })) })
        : '',
  ].join('')
  const noscript = guide
    ? guideHtml(guide)
    : modele
      ? modeleHtml(modele)
      : path === '/modeles'
        ? `<h1>Modèles de lettres gratuits</h1><ul>${SIMULATEURS.map((x) => `<li><a href="${x.path}">${esc(x.name)}</a> : ${esc(x.lead)}</li>`).join('')}${MODELES.map((m) => `<li><a href="${modelePath(m)}">${esc(m.title)}</a> : ${esc(m.lead)}</li>`).join('')}</ul>`
        : path === '/guides'
      ? `<h1>Guides du propriétaire bailleur</h1><ul>${GUIDES.map((g) => `<li><a href="${guidePath(g)}">${esc(g.title)}</a> : ${esc(g.description)}</li>`).join('')}</ul>`
      : `<h1>${esc(meta.title)}</h1><p>${esc(meta.description)}</p>`
  return base
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${esc(meta.description)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:type" content=")[^"]*"/, `$1${guide ? 'article' : 'website'}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${esc(meta.title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${esc(meta.description)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace('</head>', `${ld}\n  </head>`)
    .replace(/<noscript>[\s\S]*?<\/noscript>/, `<noscript><main style="max-width:720px;margin:0 auto;padding:24px;font-family:'Figtree',system-ui,sans-serif;color:#16233f">${noscript}</main></noscript>`)
}

/** Pages publiques préparées à la construction (dist/guides/….html), servies par Caddy avant index.html. */
function staticPages(): Plugin {
  return {
    name: 'bailio-static-pages',
    enforce: 'post',
    generateBundle(_, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') return
      const base = String(index.source)
      for (const [path] of PUBLIC_PAGES) {
        if (path === '/') continue
        const html = pageHtml(base, path)
        if (html) this.emitFile({ type: 'asset', fileName: `${path.slice(1)}.html`, source: html })
      }
    },
  }
}

function siteUrl(): Plugin {
  return {
    name: 'bailio-site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: ['User-agent: *', 'Allow: /', ...['/espace', '/commencer/', '/connexion', '/inscription', '/reprendre', '/bienvenue', '/signer/', '/signature/', '/dossier/', '/locataire/', '/edl/', '/candidature/', '/suivi-candidature/', '/invitation/'].map((p) => `Disallow: ${p}`), `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n'),
      })
      this.emitFile({ type: 'asset', fileName: 'llms.txt', source: LLMS_TXT })
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...PUBLIC_PAGES.map(([p, f, pr]) => {
            const g = GUIDES.find((x) => guidePath(x) === p)
            return `  <url><loc>${SITE_URL}${p}</loc>${g ? `<lastmod>${g.date}</lastmod>` : ''}<changefreq>${f}</changefreq><priority>${pr}</priority></url>`
          }),
          '</urlset>',
          '',
        ].join('\n'),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), siteUrl(), staticPages()],
  server: {
    port: 5173,
    // En développement, /api est relayé vers l'API locale.
    proxy: { '/api': 'http://localhost:5000' },
  },
  // Mêmes en-têtes de sécurité qu'en ligne (deploy/vps/Caddyfile), pour les vérifier en local.
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
