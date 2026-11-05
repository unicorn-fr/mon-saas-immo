import { HttpError } from '../lib/http.js'

/** Message clair pour le propriétaire quand le service d'email refuse un envoi. */
export function mailError(err: unknown, to: string): HttpError {
  const e = err as { code?: string; responseCode?: number; response?: string }
  const response = `${e.response ?? ''}`.toLowerCase()
  // Refus lié à l'expéditeur (Bailio) : jamais la faute de l'adresse du locataire.
  if (/sender|from address|envelope from|authenticat|relay/.test(response)) {
    return new HttpError(503, 'L’email n’est pas parti : le service d’envoi de Bailio l’a refusé. Réessayez dans quelques minutes ; si cela continue, écrivez à contact@bailio.fr.')
  }
  if (/recipient|user unknown|no such user|mailbox unavailable|mailbox not found|does not exist|5\.1\.1|5\.1\.2|5\.1\.3/.test(response) || (e.code === 'EENVELOPE' && !response)) {
    return new HttpError(422, `L’adresse ${to} est refusée : elle n’existe pas ou contient une faute. Corrigez-la dans la fiche, puis renvoyez.`)
  }
  if (e.responseCode === 552 || /size|too large|trop/.test(response)) {
    return new HttpError(422, 'La pièce jointe est trop lourde pour partir par email. Téléchargez le document et envoyez-le autrement.')
  }
  return new HttpError(503, 'L’email n’est pas parti : le service d’envoi ne répond pas. Réessayez dans quelques minutes.')
}
