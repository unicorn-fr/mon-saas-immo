import { BAI } from '../constants/bailio-tokens'
import { btnStyle } from './kit'
import { isApple, providerFor, providersFor } from '../lib/mail'

/**
 * Après l'envoi d'un lien par email. Messagerie reconnue d'après l'adresse (gmail.com, orange.fr…) :
 * un seul bouton vers sa boîte. Sinon : l'application Mail sur iPhone, iPad ou Mac, et les messageries courantes.
 */
export function MailLinks({ email }: { email: string }) {
  const mine = providerFor(email)
  if (mine)
    return (
      <a href={mine.url} target="_blank" rel="noreferrer" style={{ ...btnStyle('primary', 'lg', true), boxSizing: 'border-box' }}>
        Ouvrir {mine.label}
      </a>
    )
  const others = providersFor(email)
  const apple = typeof navigator !== 'undefined' && isApple(navigator.userAgent)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {apple ? (
        <a href="message://" style={{ ...btnStyle('primary', 'lg', true), boxSizing: 'border-box' }}>
          Ouvrir l’application Mail
        </a>
      ) : null}
      <span style={{ fontSize: 14, color: BAI.inkSoft }}>Ouvrir ma messagerie :</span>
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
