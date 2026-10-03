import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { CONTACT_EMAIL } from '../config'

/**
 * Information des personnes au moment où leurs données sont demandées (RGPD, art. 13) : qui est responsable,
 * pour quoi, combien de temps, et comment exercer ses droits. Courte, avec le lien vers la page complète.
 */
const box = { fontSize: 13, color: BAI.inkSoft, lineHeight: 1.55, margin: 0 } as const

/** Création d'un espace propriétaire : acceptation des conditions et usage de l'email. */
export function AccountNotice({ action }: { action: string }) {
  return (
    <p style={box}>
      En cliquant sur « {action} », vous acceptez les <Link to="/conditions">conditions d’utilisation</Link>. Votre email sert uniquement à
      vous connecter et à recevoir les documents et rappels de Bailio : jamais de publicité, jamais revendu. Voir la page{' '}
      <Link to="/confidentialite">Confidentialité</Link>.
    </p>
  )
}

/**
 * Formulaire rempli par un locataire, un candidat ou un signataire : le propriétaire est responsable,
 * Bailio héberge pour son compte.
 */
export function ThirdPartyNotice({ landlord, purpose, keep }: { landlord?: string | null; purpose: string; keep: ReactNode }) {
  return (
    <p style={box}>
      Ces informations sont transmises à {landlord || 'votre propriétaire'}, responsable de leur usage, pour {purpose}. Bailio les héberge pour son
      compte, en Suisse, sans les utiliser à d’autres fins ni les transmettre à quiconque. {keep} Vous pouvez demander à les consulter, les
      corriger ou les effacer auprès du propriétaire ou à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, et saisir la CNIL. Voir la
      page <Link to="/confidentialite">Confidentialité</Link>.
    </p>
  )
}
