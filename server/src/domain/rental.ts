/**
 * Mise en location d'un logement, dans l'ordre : fiche du logement, annonce et candidats (facultatif),
 * locataire, bail, relecture, signature, état des lieux d'entrée, dépôt de garantie, assurance, premier loyer.
 * L'état de chaque étape est déduit de ce que Bailio sait déjà : rien ne se coche à la main, sauf la relecture
 * du bail et « je n'en ai pas besoin » pour l'annonce et les candidats.
 */

export type StepKey = 'PROPERTY' | 'AD' | 'CANDIDATES' | 'TENANT' | 'LEASE' | 'CHECK' | 'SIGN' | 'INVENTORY' | 'DEPOSIT' | 'INSURANCE' | 'RENT'
export type StepState = 'DONE' | 'TODO' | 'WAITING' | 'LOCKED' | 'SKIPPED'
export const SKIPPABLE: StepKey[] = ['AD', 'CANDIDATES']

export interface RentalStep {
  key: StepKey
  title: string
  text: string
  state: StepState
  optional?: boolean
  /** Bouton de l'étape : page à ouvrir. */
  action?: { label: string; to: string }
}

export interface RentalFacts {
  propertyId: string
  /** Ce qui manque à la fiche du logement pour le bail, avec son niveau. */
  propertyMissing: Array<{ label: string; level?: 'ESSENTIAL' | 'RECOMMENDED'; section?: string }>
  skipped: string[]
  adWritten: boolean
  applyOpen: boolean
  candidates: number
  tenant: null | { id: string; name: string; essentialMissing: string[]; formSent: boolean; toReview: number }
  lease: null | {
    id: string
    status: 'DRAFT' | 'ACTIVE' | 'IMPORTED' | 'ENDED'
    ready: boolean
    checked: boolean
    esign: 'NONE' | 'PENDING' | 'COMPLETED'
    entryInventory: 'NONE' | 'DRAFT' | 'SIGNED'
    depositCents: number
    depositReceived: boolean
    insurance: boolean
    paid: boolean
    /** Bail importé ou commencé depuis plus de deux mois : l'entrée s'est faite hors de Bailio. */
    settled?: boolean
    startDate: string
  }
  today: string
  /** Logement interdit à la location (DPE) : motif, ou null. */
  forbidden?: string | null
}

const list = (labels: string[], max = 3) => {
  const l = labels.map((x) => x.charAt(0).toLowerCase() + x.slice(1))
  return `${l.slice(0, max).join(', ')}${l.length > max ? '…' : ''}`
}
const dateFr = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][m - 1]} ${y}`
}

export function rentalSteps(f: RentalFacts): RentalStep[] {
  const p = `/espace/logements/${f.propertyId}`
  const essentials = f.propertyMissing.filter((m) => m.level !== 'RECOMMENDED')
  const recommended = f.propertyMissing.filter((m) => m.level === 'RECOMMENDED')
  const l = f.lease
  const signed = l ? l.status === 'ACTIVE' || l.status === 'IMPORTED' : false
  const t = f.tenant
  const found = Boolean(t || l)
  const steps: RentalStep[] = []
  const firstSection = (essentials[0] ?? recommended[0])?.section

  steps.push({
    key: 'PROPERTY',
    title: 'Compléter la fiche du logement',
    state: f.propertyMissing.length ? 'TODO' : 'DONE',
    text: essentials.length
      ? `Il manque : ${list(essentials.map((m) => m.label))}. Sans ces informations, le bail ne peut pas être fait.`
      : recommended.length
        ? `Le bail peut se faire. À compléter si possible : ${list(recommended.map((m) => m.label))}.`
        : 'Tout ce que le bail, les diagnostics et l’annonce demandent est renseigné.',
    action: f.propertyMissing.length ? { label: 'Compléter la fiche', to: `${p}/fiche${firstSection ? `#${firstSection}` : ''}` } : undefined,
  })

  const optional = (key: StepKey, done: boolean, waiting: boolean, step: Omit<RentalStep, 'key' | 'state' | 'optional'>) =>
    steps.push({ key, optional: true, ...step, state: done ? 'DONE' : f.skipped.includes(key) ? 'SKIPPED' : waiting ? 'WAITING' : 'TODO' })
  optional('AD', f.adWritten || found, false, {
    title: 'Publier une annonce',
    text: found ? 'Votre locataire est trouvé.' : 'Bailio rédige l’annonce avec les mentions obligatoires. Vous la copiez sur Leboncoin, SeLoger ou PAP.',
    action: found ? undefined : { label: 'Rédiger l’annonce', to: `${p}/annonce` },
  })
  optional('CANDIDATES', found, f.applyOpen, {
    title: 'Recevoir les candidatures',
    text: found
      ? 'Votre locataire est trouvé.'
      : f.applyOpen
        ? `Votre lien de candidature est ouvert : ${f.candidates ? `${f.candidates} candidature${f.candidates > 1 ? 's' : ''} reçue${f.candidates > 1 ? 's' : ''}` : 'aucune candidature pour l’instant'}.`
        : 'Un lien à envoyer aux personnes intéressées : elles remplissent leur dossier et déposent leurs justificatifs, sans compte.',
    action: found ? undefined : { label: f.applyOpen ? 'Voir les candidatures' : 'Créer le lien de candidature', to: `${p}/candidats` },
  })

  // Locataire : fiche complète, ou lien envoyé pour qu'il la complète lui-même, puis vérification.
  let tenant: RentalStep
  if (!t && l) tenant = { key: 'TENANT', title: 'Le locataire', state: 'DONE', text: 'Le locataire est indiqué dans le bail.' }
  else if (!t) tenant = { key: 'TENANT', title: 'Ajouter le locataire', state: 'TODO', text: 'Saisissez ce que vous savez. Pour le reste, Bailio lui envoie un lien : il complète lui-même son dossier.', action: { label: 'Ajouter le locataire', to: `/espace/locataires/nouveau?logement=${f.propertyId}` } }
  else if (t.toReview) tenant = { key: 'TENANT', title: `Vérifier le dossier de ${t.name}`, state: 'TODO', text: `${t.toReview} élément${t.toReview > 1 ? 's' : ''} envoyé${t.toReview > 1 ? 's' : ''} par le locataire à vérifier avant le bail.`, action: { label: 'Vérifier', to: `/espace/locataires/${t.id}` } }
  else if (t.essentialMissing.length && t.formSent) tenant = { key: 'TENANT', title: `${t.name} complète son dossier`, state: 'WAITING', text: `Il manque encore : ${list(t.essentialMissing)}. Vous serez prévenu quand il aura terminé.`, action: { label: 'Voir sa fiche', to: `/espace/locataires/${t.id}` } }
  else if (t.essentialMissing.length) tenant = { key: 'TENANT', title: `Compléter le dossier de ${t.name}`, state: 'TODO', text: `Il manque : ${list(t.essentialMissing)}. Complétez sa fiche ou envoyez-lui le lien pour qu’il le fasse.`, action: { label: 'Compléter ou envoyer le lien', to: `/espace/locataires/${t.id}` } }
  else tenant = { key: 'TENANT', title: `Le locataire : ${t.name}`, state: 'DONE', text: 'Son dossier est complet.' }
  steps.push(tenant)

  const canLease = !essentials.length && tenant.state === 'DONE' && !f.forbidden
  steps.push(
    l
      ? l.status === 'DRAFT' && !l.ready
        ? { key: 'LEASE', title: 'Terminer le bail', state: 'TODO', text: 'Le bail est en préparation : il reste quelques conditions à indiquer.', action: { label: 'Reprendre le bail', to: `/espace/baux/${l.id}/contrat` } }
        : { key: 'LEASE', title: 'Créer le bail', state: 'DONE', text: 'Le bail reprend la fiche du logement et celle du locataire, sur le modèle officiel.' }
      : {
          key: 'LEASE',
          title: 'Créer le bail',
          state: canLease ? 'TODO' : 'LOCKED',
          text: f.forbidden ? f.forbidden : canLease ? 'Bailio réunit la fiche du logement et celle du locataire et ne vous demande que les conditions : loyer, charges, dépôt, date d’entrée.' : 'Possible dès que la fiche du logement et le dossier du locataire ont l’essentiel.',
          action: canLease ? { label: 'Créer le bail', to: `/espace/baux/nouveau?logement=${f.propertyId}${t ? `&locataire=${t.id}` : ''}` } : undefined,
        },
  )

  const ready = Boolean(l && (l.status !== 'DRAFT' || l.ready))
  const checked = Boolean(l && (l.checked || l.esign !== 'NONE' || signed))
  steps.push({
    key: 'CHECK',
    title: 'Relire le bail',
    state: checked ? 'DONE' : ready ? 'TODO' : 'LOCKED',
    text: checked ? 'Vous avez relu le bail.' : 'Ouvrez le PDF et vérifiez les noms, l’adresse, le loyer et les dates. Une erreur ? Corrigez la fiche : le bail se met à jour.',
    action: ready && !checked ? { label: 'Relire le bail', to: `/espace/baux/${l!.id}` } : undefined,
  })
  steps.push({
    key: 'SIGN',
    title: 'Faire signer le bail',
    state: signed ? 'DONE' : l?.esign === 'PENDING' ? 'WAITING' : checked ? 'TODO' : 'LOCKED',
    text: signed
      ? 'Le bail est signé.'
      : l?.esign === 'PENDING'
        ? 'Le lien de signature est envoyé. Vous serez prévenu dès que chacun aura signé.'
        : 'Chacun reçoit un lien, confirme son identité par un code, se prend en photo et signe sur son téléphone. Le bail signé et le certificat de preuve sont envoyés à tous.',
    action: checked && !signed ? { label: l?.esign === 'PENDING' ? 'Suivre les signatures' : 'Envoyer pour signature', to: `/espace/baux/${l!.id}#signature` } : undefined,
  })

  const after = (key: StepKey, title: string, done: boolean, text: string, action: RentalStep['action'], waiting = false) =>
    steps.push({ key, title, text, state: done ? 'DONE' : !signed ? 'LOCKED' : waiting ? 'WAITING' : 'TODO', action: signed && !done ? action : undefined })
  const started = Boolean(l && l.startDate <= f.today)
  if (l) {
    after('INVENTORY', 'Faire l’état des lieux d’entrée', l.entryInventory === 'SIGNED', l.entryInventory === 'SIGNED' ? 'État des lieux signé.' : `Le jour de la remise des clés${started ? '' : `, le ${dateFr(l.startDate)}`}, pièce par pièce sur votre téléphone, avec photos et signatures.`, { label: l.entryInventory === 'DRAFT' ? 'Reprendre l’état des lieux' : 'Préparer l’état des lieux', to: `/espace/baux/${l.id}/etat-des-lieux` })
    if (l.depositCents > 0) after('DEPOSIT', 'Encaisser le dépôt de garantie', l.depositReceived, l.depositReceived ? 'Dépôt reçu, le reçu est enregistré.' : 'À la signature : Bailio prépare le reçu à remettre au locataire.', { label: 'Préparer le reçu', to: `/espace/baux/${l.id}/courriers?type=DEPOSIT_RECEIPT` })
    after('INSURANCE', 'Recevoir l’attestation d’assurance', l.insurance, l.insurance ? 'Attestation reçue : Bailio la redemandera avant sa date de fin.' : 'Obligatoire pour le locataire dès l’entrée. Il l’envoie depuis son lien, sans compte.', { label: 'Demander l’attestation', to: `/espace/baux/${l.id}#locataire` })
    after('RENT', 'Premier loyer et quittance', l.paid, l.paid ? 'Loyer reçu, quittance prête.' : started ? 'Indiquez le loyer reçu : la quittance est faite et peut être envoyée.' : `À partir du ${dateFr(l.startDate)}.`, { label: 'Indiquer le loyer reçu', to: `/espace/baux/${l.id}#paiements` }, !started)
  } else {
    for (const [key, title] of [['INVENTORY', 'Faire l’état des lieux d’entrée'], ['DEPOSIT', 'Encaisser le dépôt de garantie'], ['INSURANCE', 'Recevoir l’attestation d’assurance'], ['RENT', 'Premier loyer et quittance']] as const)
      steps.push({ key, title, state: 'LOCKED', text: 'Après la signature du bail.' })
  }
  return steps
}

/** Location en place : toutes les étapes faites (ou écartées). */
export const rentalDone = (steps: RentalStep[]) => steps.every((s) => s.state === 'DONE' || s.state === 'SKIPPED')
