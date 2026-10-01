/**
 * Règles de la signature électronique (Code civil, art. 1366, 1367 et 1174 ; règlement eIDAS, art. 25).
 */

/** Durée de validité du code à usage unique envoyé par email. */
export const CODE_MINUTES = 10
/** Tentatives de saisie du code avant d'en redemander un. */
export const CODE_ATTEMPTS = 5
/** Délai pour signer une fois le code vérifié. */
export const SIGN_WINDOW_MINUTES = 30
/** Durée de validité d'un lien de signature ; « Renvoyer le lien » en crée un nouveau. */
export const LINK_DAYS = 14
export const linkExpiry = (from = new Date()) => new Date(from.getTime() + LINK_DAYS * 86_400_000)

export const READ_AND_APPROVED = 'Lu et approuvé'

const words = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

/**
 * La mention recopiée correspond-elle au texte attendu ? Les accents, la ponctuation et les majuscules
 * ne comptent pas ; quelques fautes de frappe sont tolérées (95 % des mots, dans l'ordre),
 * mais tous les nombres (montant, dates) doivent être présents à l'identique.
 */
export function mentionMatches(expected: string, typed: string): boolean {
  const a = words(expected)
  const b = words(typed)
  if (!a.length || !b.length) return false
  const numbers = (w: string[]) => w.filter((x) => /\d/.test(x)).join(' ')
  if (numbers(a) !== numbers(b)) return false
  // Plus longue sous-suite commune, mot à mot.
  const prev = new Array(b.length + 1).fill(0)
  for (let i = 1; i <= a.length; i += 1) {
    let diag = 0
    for (let j = 1; j <= b.length; j += 1) {
      const up = prev[j]
      prev[j] = a[i - 1] === b[j - 1] ? diag + 1 : Math.max(prev[j], prev[j - 1])
      diag = up
    }
  }
  const common = prev[b.length]
  return common >= Math.ceil(a.length * 0.95) && b.length <= Math.ceil(a.length * 1.1)
}

/** « e•••@exemple.fr » : l'adresse est reconnaissable sans être affichée en entier. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split('@')
  if (!domain) return email
  return `${user.slice(0, 1)}${'•'.repeat(Math.max(2, Math.min(6, user.length - 1)))}@${domain}`
}
