import type { MouseEvent } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { btnStyle } from './kit'
import { deviceOf, MAIL_PROVIDERS, mailTarget, PHONE_APPS, providerFor, providersFor, type Device, type MailProvider } from '../lib/mail'

const device = (): Device => (typeof navigator === 'undefined' ? 'desktop' : deviceOf(navigator.userAgent, navigator.maxTouchPoints ?? 0))

/**
 * Lien vers une messagerie. Sur téléphone, son application s'ouvre (Gmail, Outlook…) ; sur iPhone, si elle n'est
 * pas installée, son site prend le relais après un court instant.
 */
function MailLink({ p, d, label, style }: { p: MailProvider; d: Device; label: string; style: ReturnType<typeof btnStyle> }) {
  const { href, fallback } = mailTarget(p, d)
  const web = href.startsWith('https://')
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!fallback) return
    e.preventDefault()
    const timer = window.setTimeout(() => {
      if (document.visibilityState === 'visible') window.location.assign(fallback)
    }, 1500)
    document.addEventListener('visibilitychange', () => window.clearTimeout(timer), { once: true })
    window.location.assign(href)
  }
  return (
    <a href={href} onClick={onClick} {...(web ? { target: '_blank', rel: 'noreferrer' } : {})} style={{ ...style, boxSizing: 'border-box' }}>
      {label}
    </a>
  )
}

/**
 * Après l'envoi d'un lien par email. Messagerie reconnue d'après l'adresse (gmail.com, outlook.fr…) : un seul bouton,
 * qui ouvre son application sur téléphone. Sinon, sur téléphone, les applications les plus courantes (une adresse
 * pro ou personnelle se lit souvent dans Gmail ou Outlook) ; sur ordinateur, les messageries en ligne.
 */
export function MailLinks({ email }: { email: string }) {
  const d = device()
  const mine = providerFor(email)
  const hint = <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Pas reçu dans quelques minutes ? Regardez dans les indésirables (spam), puis ajoutez contact@bailio.fr à vos contacts.</span>
  if (mine)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MailLink p={mine} d={d} label={`Ouvrir ${d === 'desktop' ? mine.label : appLabel(mine)}`} style={btnStyle('primary', 'lg', true)} />
        {hint}
      </div>
    )
  const list = d === 'desktop' ? providersFor(email) : PHONE_APPS.map((k) => MAIL_PROVIDERS.find((p) => p.key === k)!).filter((p) => d === 'ios' || p.app?.android)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 14, color: BAI.inkSoft }}>{d === 'desktop' ? 'Ouvrir ma messagerie :' : 'Ouvrir mon application :'}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {list.map((p) => (
          <MailLink key={p.key} p={p} d={d} label={d === 'desktop' ? p.label : appLabel(p)} style={btnStyle('outline', 'sm')} />
        ))}
      </div>
      {hint}
    </div>
  )
}

const appLabel = (p: MailProvider) => (p.key === 'icloud' ? 'Mail (Apple)' : p.key === 'outlook' ? 'Outlook' : p.label)
