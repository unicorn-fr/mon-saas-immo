import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'
import type { Plugin } from 'vite'

/**
 * Plugin qui ajoute le support des HTTP Range Requests pour les fichiers vidéo.
 * Sans ça, Vite ne peut pas streamer les MP4 — le navigateur attend le
 * fichier entier avant de démarrer la lecture.
 */
function videoStreamPlugin(): Plugin {
  return {
    name: 'video-stream',
    configureServer(server) {
      server.middlewares.use('/videos', (req, res, next) => {
        const fileName = (req.url ?? '').replace(/^\//, '').split('?')[0]
        if (!fileName.endsWith('.mp4')) { next(); return }

        const filePath = path.join(__dirname, 'public', 'videos', fileName)
        if (!fs.existsSync(filePath)) { next(); return }

        const stat  = fs.statSync(filePath)
        const total = stat.size
        const range = req.headers['range']

        if (range) {
          const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
          const start = parseInt(startStr, 10)
          const end   = endStr ? parseInt(endStr, 10) : Math.min(start + 1024 * 1024 - 1, total - 1)
          const chunk = end - start + 1

          res.writeHead(206, {
            'Content-Range':  `bytes ${start}-${end}/${total}`,
            'Accept-Ranges':  'bytes',
            'Content-Length': chunk,
            'Content-Type':   'video/mp4',
            'Cache-Control':  'no-cache',
          })
          fs.createReadStream(filePath, { start, end }).pipe(res)
        } else {
          res.writeHead(200, {
            'Content-Length': total,
            'Content-Type':   'video/mp4',
            'Accept-Ranges':  'bytes',
          })
          fs.createReadStream(filePath).pipe(res)
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/tests/**/*.test.ts'],
  },
  plugins: [
    videoStreamPlugin(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      selfDestroying: true,
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'ImmoParticuliers - Gestion Locative',
        short_name: 'ImmoParticuliers',
        description: 'Plateforme de gestion locative entre particuliers',
        theme_color: '#00BCD4',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: true,
        navigateFallback: null,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Force jscanify to resolve to its browser-compatible UMD build.
      // The default package entry ("main") points to jscanify-node.js which
      // requires `canvas` and `jsdom` and crashes in the browser. The browser
      // build is jscanify.js — we redirect ALL imports of "jscanify" here so
      // Vite/esbuild pre-bundles the correct file instead of the Node version.
      'jscanify': path.resolve(__dirname, './node_modules/jscanify/src/jscanify.js'),
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/pages': path.resolve(__dirname, './src/pages'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/store': path.resolve(__dirname, './src/store'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/config': path.resolve(__dirname, './src/config'),
      '@/styles': path.resolve(__dirname, './src/styles')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/main-[hash].js',
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'pdf-vendor': ['pdfjs-dist'],
          'ocr-vendor': ['tesseract.js', 'jsqr']
        }
      }
    }
  }
})
