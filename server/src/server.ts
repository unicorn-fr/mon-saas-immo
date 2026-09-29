import cron from 'node-cron'
import { createApp } from './app.js'
import { env } from './env.js'
import { runDailyReminders } from './jobs/reminderEmails.js'

const app = createApp()
app.listen(env.PORT, () => console.info(`[bailio] API prête sur le port ${env.PORT}`))

// Tous les jours à 8 h (heure de Paris).
cron.schedule('0 8 * * *', () => {
  runDailyReminders().catch((err) => console.error('[rappels]', err))
}, { timezone: 'Europe/Paris' })
