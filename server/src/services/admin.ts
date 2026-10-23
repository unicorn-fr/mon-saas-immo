import { env } from '../env.js'

/** Adresses autorisées à voir le pilotage (ADMIN_EMAILS), en minuscules. */
const admins = new Set(
  env.ADMIN_EMAILS.split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
)

export const isAdmin = (email: string | null | undefined) => Boolean(email) && admins.has(email!.toLowerCase())
