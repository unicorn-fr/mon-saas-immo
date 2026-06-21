/**
 * PM2 Ecosystem — Bailio API
 *
 * Utilisé en production (Railway) via :
 *   pm2-runtime ecosystem.config.cjs
 *
 * Cluster mode : chaque worker tourne sur un vCPU disponible.
 * Les événements SSE cross-worker sont synchronisés via Redis pub/sub
 * (voir server/src/lib/sseManager.ts → initPubSub).
 *
 * Si REDIS_URL n'est pas défini, le SSE fonctionne en mode single-worker
 * (les workers ignorent les événements des autres → configurer Redis recommandé).
 */
module.exports = {
  apps: [
    {
      name: 'bailio-api',
      script: 'dist/server.js',

      // ── Cluster mode ─────────────────────────────────────────────────────
      instances: process.env.WEB_CONCURRENCY || 'max', // 'max' = tous les vCPUs
      exec_mode: 'cluster',

      // ── Mémoire & Node.js ─────────────────────────────────────────────────
      // --max-old-space-size=2048 : limite le heap V8 à 2 GB (evite OOM brutal)
      node_args: '--max-old-space-size=2048',
      max_memory_restart: '1900M', // redémarre un worker si >1,9 GB RSS

      // ── Comportement container ────────────────────────────────────────────
      // autorestart doit être true pour relancer les workers crashés
      autorestart: true,
      // Pas de watch en prod (inutile et coûteux)
      watch: false,
      // Combine stdout+stderr dans le même flux (visible dans Railway logs)
      merge_logs: true,
      // Temps minimum de vie avant de compter comme "stable" (ms)
      min_uptime: '10s',
      // Max tentatives de restart avant de marquer le worker "errored"
      max_restarts: 10,

      // ── Variables d'environnement production ──────────────────────────────
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
}
