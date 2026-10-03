/**
 * Messageries les plus utilisées en France : un clic après l'envoi du lien de connexion pour ouvrir sa boîte.
 * Celle qui correspond à l'adresse saisie passe en premier. Adresses vérifiées en octobre 2026.
 */
export interface MailProvider {
  key: string
  label: string
  url: string
  domains: string[]
}

export const MAIL_PROVIDERS: MailProvider[] = [
  { key: 'gmail', label: 'Gmail', url: 'https://mail.google.com/mail/u/0/#search/Bailio+in%3Aanywhere', domains: ['gmail.com', 'googlemail.com'] },
  { key: 'outlook', label: 'Outlook, Hotmail', url: 'https://outlook.live.com/mail/0/', domains: ['outlook.com', 'outlook.fr', 'hotmail.com', 'hotmail.fr', 'live.com', 'live.fr', 'msn.com'] },
  { key: 'icloud', label: 'Apple (iCloud Mail)', url: 'https://www.icloud.com/mail/', domains: ['icloud.com', 'me.com', 'mac.com'] },
  { key: 'orange', label: 'Orange', url: 'https://messagerie.orange.fr/', domains: ['orange.fr', 'wanadoo.fr'] },
  { key: 'yahoo', label: 'Yahoo', url: 'https://mail.yahoo.com/', domains: ['yahoo.fr', 'yahoo.com', 'ymail.com'] },
  { key: 'free', label: 'Free', url: 'https://webmail.free.fr/', domains: ['free.fr', 'aliceadsl.fr'] },
  { key: 'sfr', label: 'SFR', url: 'https://webmail.sfr.fr/', domains: ['sfr.fr', 'neuf.fr', 'cegetel.net', 'club-internet.fr'] },
  { key: 'laposte', label: 'La Poste', url: 'https://www.laposte.net/accueil', domains: ['laposte.net'] },
  { key: 'bbox', label: 'Bouygues (Bbox)', url: 'https://webmail.bbox.fr/', domains: ['bbox.fr'] },
  { key: 'proton', label: 'Proton Mail', url: 'https://mail.proton.me/', domains: ['proton.me', 'protonmail.com', 'pm.me'] },
  { key: 'gmx', label: 'GMX', url: 'https://www.gmx.fr/', domains: ['gmx.fr', 'gmx.com', 'gmx.net'] },
]

/** La messagerie de l'adresse saisie, s'il s'agit d'une messagerie connue. */
export function providerFor(email: string): MailProvider | null {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return MAIL_PROVIDERS.find((p) => p.domains.includes(domain)) ?? null
}

/** Ordre d'affichage : celle de l'adresse d'abord, puis les autres. */
export function providersFor(email: string): MailProvider[] {
  const mine = providerFor(email)
  return mine ? [mine, ...MAIL_PROVIDERS.filter((p) => p !== mine)] : MAIL_PROVIDERS
}

/** iPhone, iPad ou Mac : l'application Mail s'ouvre avec « message:// ». */
export const isApple = (ua: string) => /iPhone|iPad|iPod|Macintosh/.test(ua)
