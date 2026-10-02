import cron from 'node-cron'
import { createApp } from './app.js'
import { env } from './env.js'
import { runDailyReminders } from './jobs/reminderEmails.js'
import { purgeOldCandidates } from './routes/candidates.js'
import { purgeTrash } from './services/trash.js'

const app = createApp()
app.listen(env.PORT, () => console.info(`[bailio] API prête sur le port ${env.PORT}`))

// Tous les jours à 8 h (heure de Paris).
cron.schedule('0 8 * * *', () => {
  runDailyReminders().catch((err) => console.error('[rappels]', err))
  // Candidatures de plus de trois mois : effacées.
  purgeOldCandidates().catch((err) => console.error('[candidatures]', err))
  // Corbeille : éléments supprimés depuis plus de 30 jours, effacés pour de bon.
  purgeTrash().catch((err) => console.error('[corbeille]', err))
}, { timezone: 'Europe/Paris' })
