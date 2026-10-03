import { BAI } from '../constants/bailio-tokens'
import { btnStyle } from './kit'
import { isApple, providerFor, providersFor } from '../lib/mail'

/**
 * Après l'envoi d'un lien par email : un bouton vers la messagerie de l'adresse saisie (si on la reconnaît),
 * puis les autres messageries courantes, et l'application Mail sur iPhone, iPad ou Mac.
 */
export function MailLinks({ email }: { email: string }) {
  const mine = providerFor(email)
  const others = providersFor(email).filter((p) => p !== mine)
  const apple = typeof navigator !== 'undefined' && isApple(navigator.userAgent)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {mine ? (
        <a href={mine.url} target="_blank" rel="noreferrer" style={{ ...btnStyle('primary', 'lg', true), boxSizing: 'border-box' }}>
          Ouvrir {mine.label}
        </a>
      ) : null}
      {apple ? (
        <a href="message://" style={{ ...btnStyle(mine ? 'outline' : 'primary', 'lg', true), boxSizing: 'border-box' }}>
          Ouvrir l’application Mail
        </a>
      ) : null}
      <span style={{ fontSize: 14, color: BAI.inkSoft }}>{mine ? 'Autre messagerie :' : 'Ouvrir ma messagerie :'}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {others.map((p) => (
          <a key={p.key} href={p.url} target="_blank" rel="noreferrer" style={btnStyle('outline', 'sm')}>
            {p.label}
          </a>
        ))}
      </div>
    </div>
  )
}
