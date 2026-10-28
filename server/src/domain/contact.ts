/**
 * Demande de contact en deux questions (« De quoi avez-vous besoin ? », « À quel numéro vous rappeler ? ») : le besoin
 * choisi en un clic, le numéro lu tel qu'on le tape (espaces, points, tirets, +33).
 */

// Repris tels quels par le formulaire (NEEDS, client/src/components/ContactForm.tsx) : changer les deux ensemble.
export const CONTACT_NEEDS = {
  LEASE: 'Faire mon bail',
  QUESTION: 'Une question sur Bailio',
  PROBLEM: 'Un souci avec un document',
  OTHER: 'Autre chose',
} as const
export type ContactNeed = keyof typeof CONTACT_NEEDS

/**
 * Numéro de téléphone lisible et appelable : « 06 12 34 56 78 » et « tel:+33612345678 » pour un numéro français,
 * « +44 7700 900123 » gardé tel quel (chiffres seulement) pour un numéro étranger. null si ce n'est pas un numéro.
 */
export function readPhone(input: string): { display: string; tel: string } | null {
  const raw = input.trim()
  if (!/^[+\d][\d\s().-]*$/.test(raw)) return null
  const digits = raw.replace(/\D/g, '')
  const plus = raw.startsWith('+') || raw.startsWith('00')
  let national: string | null = null
  if (!plus && /^0[1-9]\d{8}$/.test(digits)) national = digits.slice(1)
  // « +33 6… », « 0033 6… », et aussi « +33 (0)6… » ou « 0033 06… » : le 0 national après l'indicatif est retiré.
  else if (plus && /^(00)?330?[1-9]\d{8}$/.test(digits)) national = digits.replace(/^(00)?330?/, '')
  if (national) return { display: `0${national}`.replace(/(\d{2})(?=\d)/g, '$1 '), tel: `tel:+33${national}` }
  const intl = digits.replace(/^00/, '')
  if (plus && intl.length >= 8 && intl.length <= 15) return { display: `+${intl}`, tel: `tel:+${intl}` }
  return null
}
