import type { ReactNode } from 'react'
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { FURNITURE_REQUIRED, MOBILITY_REASONS, type ContractInput, type Guarantor, type LandlordProfile, type PartyName, type TenantFile } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import { contractEndDate, diagnosticsFor, firstPayment, landlordNoticeMonthsFor, leaseDurationMonths, maxDepositFor, rentRevisionAllowed } from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { quarterLabel } from '../lib/irl.js'
import { CONSTRUCTION, ENERGY, NET, TV, annexesLabel, commonAreasLabel, dateLong, dateShort, durationText, equipmentsLabel, euros, guarantorName, landlordName, originalsCount, propertyAddress } from './labels.js'
import { CertificatePage, type CertificateData } from './certificate.js'
import { NoticePages } from './notice.js'
import { BLANK, Check, Footer, INK, MUTED, SignatureBoxes, Table, orBlank, s } from './theme.js'

/**
 * Contrat de location établi selon le contrat type du décret n° 2015-587 du 29 mai 2015 (annexe 1 : logement nu ;
 * annexe 2 : logement meublé ; version en vigueur depuis le 1er janvier 2024) : mêmes rubriques I à XI, dans le même
 * ordre et avec les mêmes intitulés, remplies avec les fiches du propriétaire. Les clauses utiles et licites (assurance,
 * entretien, animaux, visites, congé…) figurent à la rubrique X « Autres conditions particulières ». Aucune clause
 * interdite par l'article 4 de la loi du 6 juillet 1989. Une information inconnue laisse une ligne à compléter.
 */

// ── Mise en page propre à l'acte ─────────────────────────────────────────────

const st = {
  p: { fontSize: 10, lineHeight: 1.5, textAlign: 'justify' as const, marginBottom: 5 },
  article: { fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  small: { fontSize: 7.8, lineHeight: 1.45, color: MUTED, textAlign: 'justify' as const, marginBottom: 6 },
  clause: { fontSize: 9.5, fontWeight: 700, marginTop: 7, marginBottom: 3 },
}

const P = ({ children }: { children: ReactNode }) => <Text style={st.p}>{children}</Text>
const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: 700 }}>{children}</Text>
/** Rubrique du contrat type : « IV. Conditions financières ». */
function Rubric({ n, title }: { n: string; title: string }) {
  return (
    <View minPresenceAhead={80} style={{ marginTop: 16, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 0.8, borderBottomColor: INK }}>
      <Text style={st.article}>
        {n}. {title}
      </Text>
    </View>
  )
}
const Sub = ({ children }: { children: ReactNode }) => (
  <Text style={st.clause} minPresenceAhead={40}>
    {children}
  </Text>
)
/** Ligne « intitulé : valeur » du contrat type. */
function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 10 }} wrap={false}>
      <Text style={{ width: 12, fontSize: 9.5 }}>–</Text>
      <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.5, textAlign: 'justify' }}>
        <Text style={{ fontWeight: 500 }}>{label} : </Text>
        {children}
      </Text>
    </View>
  )
}
function Dash({ children }: { children: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 10 }}>
      <Text style={{ width: 12, fontSize: 9.5 }}>–</Text>
      <Text style={{ flex: 1, fontSize: 9.5, lineHeight: 1.5, textAlign: 'justify' }}>{children}</Text>
    </View>
  )
}

// ── Désignation des personnes ────────────────────────────────────────────────

const civ = (c?: string | null) => (c === 'MADAME' ? 'Madame' : c === 'MONSIEUR' ? 'Monsieur' : '')
const upper = (v?: string | null) => (v ? v.toLocaleUpperCase('fr-FR') : '')
/** « Madame Claire DUBOIS » : nom de famille en capitales, comme dans un acte. */
const formal = (p: PartyName & { usageName?: string | null }) => [civ(p.civility), p.firstNames, upper(p.usageName || p.lastName)].filter(Boolean).join(' ') || BLANK
const born = (p: { civility?: string | null; birthDate?: string | null; birthPlace?: string | null; birthName?: string | null }) => {
  if (!p.birthDate && !p.birthPlace) return ''
  return `, ${p.civility === 'MADAME' ? 'née' : 'né'}${p.birthName ? ` ${upper(p.birthName)}` : ''}${p.birthDate ? ` le ${dateLong(p.birthDate)}` : ''}${p.birthPlace ? ` à ${p.birthPlace}` : ''}`
}

/** [nom en gras, suite du paragraphe] */
function landlordParagraph(l: LandlordProfile): [string, string] {
  if ((l.kind === 'SCI' || l.kind === 'COMPANY') && l.company) {
    const c = l.company
    return [
      `La société ${[c.form, c.name ? upper(c.name) : BLANK].filter(Boolean).join(' ')}`,
      [
        c.siren ? `, immatriculée sous le numéro SIREN ${c.siren}` : '',
        `, dont le siège est situé ${c.seat || BLANK}`,
        `, représentée par ${c.representedBy || BLANK}${c.representativeRole ? `, en qualité de ${c.representativeRole}` : ''}, dûment habilité(e) aux fins des présentes`,
        l.email ? ` ; adresse électronique : ${l.email}` : '',
        ' ;',
      ].join(''),
    ]
  }
  const others = (l.coOwners ?? []).map((o) => formal(o)).filter((x) => x !== BLANK)
  const name = others.length ? `${formal(l)} et ${others.join(', ')}` : formal(l)
  const address = l.address ? [l.address, [l.postalCode, l.city ? upper(l.city) : ''].filter(Boolean).join(' ')].filter(Boolean).join(', ') : BLANK
  return [name, `${others.length ? '' : born(l)}, demeurant ${address}${l.email ? ` ; adresse électronique : ${l.email}` : ''} ;`]
}

function tenantParagraph(t: TenantFile & PartyName): [string, string] {
  return [formal(t), `${born(t)}${t.currentAddress ? `, demeurant actuellement ${t.currentAddress}` : ''}${t.email ? ` ; adresse électronique : ${t.email}` : ''} ;`]
}

const Party = ({ v }: { v: [string, string] }) => (
  <Text style={[st.p, { fontWeight: 500 }]}>
    <Text style={{ fontWeight: 700, fontSize: 10.5 }}>{v[0]}</Text>
    {v[1]}
  </Text>
)

const guarantorLine = (g: Guarantor) => `${formal(g)}${born(g)}${g.address ? `, demeurant ${g.address}` : ''}`

// ── Document ─────────────────────────────────────────────────────────────────

/** Signature électronique apposée : image dessinée, mention recopiée, date. */
export interface SignatureMark {
  image: string | null
  mention: string | null
  signedAt: string
}
export interface SignedLease {
  landlord?: SignatureMark
  tenants?: (SignatureMark | undefined)[]
  certificate?: CertificateData
}

const signedHint = (m?: SignatureMark) =>
  m ? `${m.mention ? `« ${m.mention} » · ` : ''}Signé électroniquement le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(m.signedAt))}` : 'Mention manuscrite « Lu et approuvé », puis signature'

export function ContractDocument({ c, signed }: { c: ContractInput; signed?: SignedLease }) {
  const t = c.terms
  const p = c.property
  const l = c.landlord
  const kind = t.kind ?? (p.furnished ? 'MEUBLE' : 'VIDE')
  const furnished = kind !== 'VIDE'
  const mobility = kind === 'MOBILITE'
  const student = kind === 'ETUDIANT'
  const colocation = Boolean(t.colocation) || c.tenants.length > 1
  const months = leaseDurationMonths(kind, l, t)
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const rent = t.rentCents ?? null
  const charges = t.chargesCents ?? 0
  const energy = t.works?.energyContribution?.enabled ? t.works.energyContribution.monthlyCents ?? 0 : 0
  const deposit = mobility ? 0 : t.depositCents ?? (rent !== null ? maxDepositFor(kind, rent) : null)
  const dpe = p.diagnostics?.dpe?.class
  const revisionBlocked = !rentRevisionAllowed(dpe)
  const first = t.startDate && rent !== null ? firstPayment(t.startDate, rent, charges) : null
  const version = c.version ? ` · version ${c.version.number} du ${c.version.date}` : ''
  const lastNames = c.tenants.map((x) => x.lastName).filter(Boolean).join(', ')
  const paraphs = 1 + Math.max(1, c.tenants.length)
  const agent = l.agent?.enabled ? l.agent : null
  const diags = diagnosticsFor(p)
  const chargesMode = t.chargesMode ?? (mobility ? 'FORFAIT' : 'PROVISION')
  const titleLaw = kind === 'VIDE' ? 'titre Ier' : mobility ? 'titre Ier ter' : 'titre Ier bis'
  const showSolidarity = colocation && t.clauses?.solidarite !== false
  const showResolutoire = t.clauses?.resolutoire !== false
  const tenants = c.tenants.length ? c.tenants : [{} as TenantFile & PartyName]
  const plural = tenants.length > 1
  const theTenant = plural ? 'les Locataires' : 'le Locataire'
  const TheTenant = plural ? 'Les Locataires' : 'Le Locataire'
  const landlordNotice = landlordNoticeMonthsFor(kind)
  const tenantNotice = kind === 'VIDE' ? 'trois mois, réduit à un mois dans les cas prévus par l’article 15 de la loi du 6 juillet 1989 (notamment logement situé en zone tendue, premier emploi, mutation, perte d’emploi, nouvel emploi consécutif à une perte d’emploi, état de santé justifiant un changement de domicile, bénéficiaire du revenu de solidarité active ou de l’allocation aux adultes handicapés)' : 'un mois'
  const cityUpper = (p.city || '').toLocaleUpperCase('fr-FR')
  const kindTitle = { VIDE: 'logement nu', MEUBLE: 'logement meublé', ETUDIANT: 'logement meublé, location à un étudiant', MOBILITE: 'logement meublé, bail mobilité' }[kind]
  const ownerQuality =
    l.kind === 'SCI' ? `personne morale${l.sciFamily ? ', société civile constituée exclusivement entre parents et alliés jusqu’au quatrième degré inclus' : ''}` : l.kind === 'COMPANY' ? 'personne morale' : 'personne physique'
  const boiler = p.heating?.mode === 'INDIVIDUAL' && ['GAS', 'FUEL', 'WOOD'].includes(String(p.heating.energy))
  const garden = (p.annexes ?? []).includes('garden' as never)
  const dpeCost = p.diagnostics?.dpe
  const decencyText =
    'Rappel : un logement décent doit respecter les critères minimaux de performance suivants. En France métropolitaine : à compter du 1er janvier 2025, le niveau de performance minimal du logement correspond à la classe F du DPE ; à compter du 1er janvier 2028, à la classe E ; à compter du 1er janvier 2034, à la classe D. En Guadeloupe, en Martinique, en Guyane, à La Réunion et à Mayotte : à compter du 1er janvier 2028, à la classe F ; à compter du 1er janvier 2031, à la classe E. La consommation d’énergie finale et le niveau de performance du logement sont déterminés selon la méthode du diagnostic de performance énergétique mentionné à l’article L. 126-26 du code de la construction et de l’habitation.'

  return (
    <Document title={`Contrat de location, ${p.address ?? ''}`} author={landlordName(l)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        {/* En-tête : intitulé du contrat type */}
        <View style={{ borderBottomWidth: 1.5, borderColor: INK, paddingBottom: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 8, color: MUTED, letterSpacing: 1, textTransform: 'uppercase' }}>{mobility ? 'Bail mobilité' : `Contrat type – décret n° 2015-587 du 29 mai 2015, annexe ${furnished ? '2' : '1'}`}</Text>
          <Text style={{ fontSize: 16, fontWeight: 700, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Contrat de location{colocation ? ' ou de colocation' : ''}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: 600, marginTop: 2 }}>{kindTitle}</Text>
          <Text style={{ fontSize: 8.5, color: MUTED, marginTop: 6, lineHeight: 1.45 }}>
            {mobility
              ? 'Soumis au titre Ier ter de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs (articles 25-12 à 25-18).'
              : `Soumis au ${titleLaw} de la loi du 6 juillet 1989 tendant à améliorer les rapports locatifs et portant modification de la loi n° 86-1290 du 23 décembre 1986.`}
          </Text>
        </View>

        <View style={[s.box, { marginBottom: 6 }]}>
          <Text style={{ fontSize: 7.8, lineHeight: 1.45, textAlign: 'justify' }}>
            Modalités d’application : le régime de droit commun en matière de baux d’habitation est défini principalement par la loi du 6 juillet 1989 modifiée. L’ensemble de ces dispositions étant d’ordre
            public, elles s’imposent aux parties qui, en principe, ne peuvent pas y renoncer. Le présent contrat contient les clauses essentielles dont la loi impose la mention ; les autres dispositions d’ordre
            public applicables sont rappelées dans la notice d’information jointe. Les parties sont libres de prévoir d’autres clauses particulières, dans la mesure où elles sont conformes à la loi (rubrique X).
          </Text>
        </View>

        {/* I. Désignation des parties */}
        <Rubric n="I" title="Désignation des parties" />
        <P>Le présent contrat est conclu entre les soussignés :</P>
        <Sub>Le bailleur</Sub>
        <Party v={landlordParagraph(l)} />
        <P>Qualité du bailleur : {ownerQuality}. Ci-après désigné{l.kind === 'COUPLE' || (l.coOwners ?? []).length ? 's' : ''} « le bailleur ».</P>
        {agent ? (
          <P>
            Représenté par le mandataire : {[agent.name, agent.address].filter(Boolean).join(', ') || BLANK}
            {agent.cardNumber ? `, titulaire de la carte professionnelle n° ${agent.cardNumber}` : ''}
            {agent.cardIssuer ? ` délivrée par ${agent.cardIssuer}` : ''}.
          </P>
        ) : null}
        <Sub>{plural ? 'Les colocataires' : 'Le locataire'}</Sub>
        {tenants.map((tn, i) => (
          <Party key={i} v={tenantParagraph(tn)} />
        ))}
        <P>Ci-après désigné{plural ? 's ensemble' : ''} « {plural ? 'les locataires' : 'le locataire'} ».</P>
        <P>Il a été convenu ce qui suit :</P>

        {/* II. Objet du contrat */}
        <Rubric n="II" title="Objet du contrat" />
        <P>
          Le présent contrat a pour objet la location d’un logement{furnished ? ' meublé' : ''} ainsi déterminé{furnished ? ', avec les meubles et équipements décrits à l’inventaire annexé' : ''} :
        </P>
        <Sub>A. Consistance du logement</Sub>
        <Item label="Localisation du logement">
          {orBlank(propertyAddress(p))}
          {p.postalCode && !p.address?.includes(p.postalCode) ? `, ${p.postalCode}` : ''}
          {cityUpper && !p.address?.toLocaleUpperCase('fr-FR').includes(cityUpper) ? ` ${cityUpper}` : ''}
          {p.legalRegime === 'COPRO' && p.lotNumber ? `, lot de copropriété n° ${p.lotNumber}` : ''}
        </Item>
        <Item label="Identifiant fiscal du logement">{orBlank(p.fiscalId)}</Item>
        <Item label="Type d’habitat">{p.habitat === 'COLLECTIVE' ? 'immeuble collectif' : p.habitat === 'INDIVIDUAL' ? 'individuel' : BLANK}</Item>
        <Item label="Régime juridique de l’immeuble">
          {p.legalRegime === 'COPRO' ? `copropriété${p.copro?.quotePart ? ` (quote-part du lot : ${p.copro.quotePart})` : ''}` : p.legalRegime === 'MONO' ? 'mono propriété' : BLANK}
        </Item>
        <Item label="Période de construction">{p.constructionPeriod ? CONSTRUCTION[p.constructionPeriod].replace(/^Construit /, '') : BLANK}</Item>
        <Item label="Surface habitable">{p.surface ? `${String(p.surface).replace('.', ',')} m²` : BLANK}</Item>
        <Item label="Nombre de pièces principales">{orBlank(p.rooms)}</Item>
        {p.roomList?.length ? <Item label="Composition">{p.roomList.map((r) => r.name.toLowerCase()).join(', ')}</Item> : null}
        <Item label="Autres parties du logement">{annexesLabel(p) || 'néant'}</Item>
        <Item label="Éléments d’équipement du logement">{equipmentsLabel(p) || BLANK}</Item>
        <Item label="Modalité de production de chauffage">
          {p.heating?.mode ? `${p.heating.mode === 'COLLECTIVE' ? 'collectif' : 'individuel'}${p.heating.energy ? `, ${ENERGY[p.heating.energy]}` : ''}${p.heating.appliance ? ` (${p.heating.appliance})` : ''}` : BLANK}
          {p.heating?.mode === 'COLLECTIVE' ? ` ; répartition de la consommation du locataire : ${orBlank(p.heating.split)}` : ''}
        </Item>
        <Item label="Modalité de production d’eau chaude sanitaire">
          {p.hotWater?.mode ? (p.hotWater.mode === 'COLLECTIVE' ? 'collective' : 'individuelle') : BLANK}
          {p.hotWater?.mode === 'COLLECTIVE' ? ` ; répartition de la consommation du locataire : ${orBlank(p.hotWater.split)}` : ''}
        </Item>
        <Item label="Performance énergétique">
          {dpe ? `classe ${dpe}${p.diagnostics?.dpe?.ges ? `, émissions de gaz à effet de serre classe ${p.diagnostics.dpe.ges}` : ''}${p.diagnostics?.dpe?.number ? ` (diagnostic n° ${p.diagnostics.dpe.number})` : ''}` : BLANK}
        </Item>
        <Text style={[st.small, { marginTop: 4 }]}>{decencyText}</Text>
        <Sub>B. Destination des locaux</Sub>
        <P>{p.destination === 'MIXTE' ? 'Usage mixte professionnel et d’habitation.' : 'Usage d’habitation.'} Le logement constitue la résidence principale {plural ? 'des locataires' : 'du locataire'}.</P>
        <Sub>C. Locaux et équipements accessoires de l’immeuble à usage privatif du locataire</Sub>
        <P>{annexesLabel(p) ? `${annexesLabel(p)}${p.garageNumber ? ` (n° ${p.garageNumber})` : ''}.` : 'Néant.'}</P>
        <Sub>D. Locaux, parties, équipements et accessoires de l’immeuble à usage commun</Sub>
        <P>{p.habitat === 'COLLECTIVE' ? (commonAreasLabel(p) ? `${commonAreasLabel(p)}.` : 'Néant.') : 'Sans objet.'}</P>
        <Sub>E. Équipement d’accès aux technologies de l’information et de la communication</Sub>
        <P>{[p.tv ? `réception de la télévision : ${TV[p.tv].toLowerCase()}` : '', p.internet ? `raccordement internet : ${NET[p.internet]}` : ''].filter(Boolean).join(' ; ') || BLANK}.</P>
        {furnished ? (
          <>
            <Sub>F. Mobilier</Sub>
            <P>Le logement comporte au minimum les éléments de mobilier fixés par le décret n° 2015-981 du 31 juillet 2015, énumérés en annexe et détaillés dans l’inventaire établi à l’entrée dans les lieux.</P>
          </>
        ) : null}

        {/* III. Date de prise d'effet et durée */}
        <Rubric n="III" title="Date de prise d’effet et durée du contrat" />
        <Sub>A. Date de prise d’effet du contrat</Sub>
        <P>
          <B>{t.startDate ? dateLong(t.startDate) : BLANK}</B>.
        </P>
        <Sub>B. Durée du contrat</Sub>
        <P>
          <B>{durationText(months)}</B>
          {end ? `, soit jusqu’au ${formatDateFr(end)} inclus` : ''}.
        </P>
        {t.reduced?.enabled && kind === 'VIDE' ? (
          <>
            <Sub>C. Événement et raison justifiant la durée réduite du contrat</Sub>
            <P>{orBlank(t.reduced.reason)}.</P>
          </>
        ) : null}
        {mobility ? (
          <>
            <P>Motif du bail mobilité : {t.mobilityReason ? `${theTenant} justifie, à la date de prise d’effet du contrat, être en ${MOBILITY_REASONS[t.mobilityReason as keyof typeof MOBILITY_REASONS]}.` : BLANK}</P>
            <P>Le bail mobilité est conclu pour une durée d’un à dix mois. Il n’est ni renouvelable ni reconductible. Sa durée peut être modifiée une fois par avenant, sans que la durée totale du contrat dépasse dix mois.</P>
          </>
        ) : student ? (
          <P>La location étant consentie à un étudiant pour une durée de neuf mois, le contrat n’est pas reconduit tacitement et prend fin à son terme, sans qu’un congé soit nécessaire.</P>
        ) : kind === 'VIDE' ? (
          <P>
            En l’absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour {months > 36 ? '6' : '3'} ans et dans les mêmes conditions. Le locataire peut mettre fin au bail à tout
            moment, après avoir donné congé. Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit pour reprendre le logement en vue de l’occuper lui-même ou une personne
            de sa famille, soit pour le vendre, soit pour un motif sérieux et légitime.
          </P>
        ) : (
          <P>
            En l’absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour un an et dans les mêmes conditions. Le locataire peut mettre fin au bail à tout moment,
            après avoir donné congé. Le bailleur, quant à lui, peut mettre fin au bail à son échéance et après avoir donné congé, soit pour reprendre le logement en vue de l’occuper lui-même ou une personne de sa
            famille, soit pour le vendre, soit pour un motif sérieux et légitime.
          </P>
        )}

        {/* IV. Conditions financières */}
        <Rubric n="IV" title="Conditions financières" />
        <P>Les parties conviennent des conditions financières suivantes :</P>
        <Sub>A. Loyer</Sub>
        <Item label="1° a) Montant du loyer mensuel">
          <B>{rent !== null ? `${euros(rent + (t.zone?.complementCents ?? 0))} (${eurosInWords(rent + (t.zone?.complementCents ?? 0))})` : BLANK}</B>, hors charges
        </Item>
        <Item label="1° b) Loyer soumis au décret fixant annuellement le montant maximum d’évolution des loyers à la relocation">{t.zone?.tense === true ? 'oui' : t.zone?.tense === false ? 'non' : BLANK}</Item>
        <Item label="Loyer soumis au loyer de référence majoré fixé par arrêté préfectoral">{t.zone?.control === true ? 'oui' : t.zone?.control === false ? 'non' : BLANK}</Item>
        {t.zone?.control ? (
          <>
            <Item label="Loyer de référence / loyer de référence majoré">
              {t.zone.refRentCentsM2 ? `${euros(t.zone.refRentCentsM2)}/m²` : BLANK} / {t.zone.refRentMaxCentsM2 ? `${euros(t.zone.refRentMaxCentsM2)}/m²` : BLANK}
            </Item>
            <Item label="Complément de loyer">
              {t.zone.complementCents ? `loyer de base ${orBlank(euros(rent))}, complément ${euros(t.zone.complementCents)} ; caractéristiques le justifiant : ${orBlank(t.zone.complementJustification)}` : 'aucun'}
            </Item>
          </>
        ) : null}
        <Item label="1° c) Loyer du dernier locataire">
          {t.previous?.rentedWithin18Months === false
            ? 'sans objet, le précédent locataire ayant quitté le logement plus de dix-huit mois avant la signature (ou aucun locataire précédent)'
            : t.previous?.rentedWithin18Months
              ? `${orBlank(euros(t.previous.lastRentCents))}, versé le ${orBlank(dateShort(t.previous.lastPaymentDate))} ; dernière révision le ${orBlank(dateShort(t.previous.lastRevisionDate))}`
              : BLANK}
        </Item>
        <Item label="2° Modalités de révision">
          {mobility
            ? 'le loyer ne peut pas être révisé en cours de bail mobilité (article 25-16 de la loi du 6 juillet 1989)'
            : revisionBlocked
              ? `aucune : le logement étant classé ${dpe} au DPE, le loyer ne peut faire l’objet d’aucune révision ni majoration (article 17-1)`
              : t.revision?.enabled === false
                ? 'le loyer n’est pas révisable en cours de bail'
                : `a) date de révision : ${t.revision?.date ? dateLong(`2000-${t.revision.date}`).replace(' 2000', '') + ' de chaque année' : 'date anniversaire du contrat'} ; b) trimestre de référence de l’IRL : ${t.revision?.irlQuarter ? `${quarterLabel(t.revision.irlQuarter)}${t.revision.irlValue ? ` (valeur ${String(t.revision.irlValue).replace('.', ',')})` : ''}` : BLANK}. La révision ne peut excéder la variation de l’indice de référence des loyers publié par l’INSEE ; elle n’est pas rétroactive et le bailleur dispose d’un an à compter de la date de révision pour la demander`}
        </Item>
        <Sub>B. Charges récupérables</Sub>
        <Item label="1. Modalité de règlement">
          {chargesMode === 'FORFAIT'
            ? `forfait de charges${mobility ? ', fixé pour toute la durée du bail, sans complément ni régularisation (article 25-16)' : ', révisé chaque année dans les mêmes conditions que le loyer, sans régularisation'}`
            : chargesMode === 'PERIODIC'
              ? 'paiement périodique des charges sans provision, sur justificatifs'
              : 'provisions sur charges avec régularisation annuelle'}
        </Item>
        {chargesMode !== 'PERIODIC' ? (
          <Item label={`2. Montant ${chargesMode === 'FORFAIT' ? 'du forfait' : 'des provisions'} sur charges`}>
            <B>{t.chargesCents !== undefined && t.chargesCents !== null ? `${euros(charges)} par mois` : BLANK}</B>
          </Item>
        ) : null}
        <P>
          Les charges récupérables sont celles dont la liste est fixée par le décret n° 87-713 du 26 août 1987.{chargesMode === 'PROVISION' ? ' Un mois avant la régularisation annuelle, le bailleur communique le décompte par nature de charges et, en immeuble collectif, le mode de répartition entre les locataires ; les pièces justificatives sont tenues à disposition pendant six mois (article 23).' : ''}
        </P>
        {kind === 'VIDE' ? (
          <>
            <Sub>C. Contribution pour le partage des économies de charges</Sub>
            <P>{t.works?.energyContribution?.enabled ? `${euros(energy)} par mois. Travaux réalisés : ${orBlank(t.works.energyContribution.description)}.` : 'Sans objet.'}</P>
          </>
        ) : null}
        {colocation ? (
          <>
            <Sub>{furnished ? 'C' : 'D'}. Assurance souscrite par le bailleur pour le compte des colocataires</Sub>
            <P>Non : chaque colocataire justifie de sa propre assurance contre les risques locatifs.</P>
          </>
        ) : null}
        <Sub>{furnished ? 'D' : 'E'}. Modalités de paiement</Sub>
        <P>
          Le loyer et les charges sont payables mensuellement, {t.paymentTerm === 'ARREARS' ? 'à terme échu' : 'à échoir'}, au plus tard le {t.paymentDay ? (t.paymentDay === 1 ? '1er' : t.paymentDay) : BLANK} de chaque mois, par{' '}
          {{ TRANSFER: 'virement bancaire sur le compte désigné par le bailleur', CHEQUE: 'chèque', CASH: 'espèces, contre reçu', OTHER: orBlank(t.paymentPlace) }[t.paymentMethod ?? 'TRANSFER']}
          {t.paymentPlace && t.paymentMethod !== 'OTHER' ? ` ; lieu de paiement : ${t.paymentPlace}` : ''}.
        </P>
        <Table
          columns={['Montant total dû à la première échéance pour une période complète', 'Montant']}
          widths={[70, 30]}
          rows={[
            ['Loyer hors charges', rent !== null ? euros(rent + (t.zone?.complementCents ?? 0)) : ''],
            [chargesMode === 'FORFAIT' ? 'Forfait de charges' : chargesMode === 'PERIODIC' ? 'Charges (sur justificatifs)' : 'Provision sur charges', chargesMode === 'PERIODIC' ? '' : euros(charges)],
            ...(energy ? [['Contribution au partage des économies de charges', euros(energy)]] : []),
            ['Total', rent !== null ? euros(rent + (t.zone?.complementCents ?? 0) + (chargesMode === 'PERIODIC' ? 0 : charges) + energy) : ''],
          ]}
        />
        {first && !first.fullMonth ? (
          <P>
            Entrée en cours de mois : pour la première période ({first.days} jours sur {first.daysInMonth}), la somme due est de {euros(first.rentCents)} de loyer et {euros(first.chargesCents)} de charges, soit{' '}
            {euros(first.rentCents + first.chargesCents)}.
          </P>
        ) : null}
        <Sub>{furnished ? 'F' : 'G'}. Dépenses énergétiques (pour information)</Sub>
        <P>
          Montant estimé des dépenses annuelles d’énergie pour un usage standard de l’ensemble des usages énumérés dans le diagnostic de performance énergétique (chauffage, refroidissement, production d’eau chaude
          sanitaire, éclairage et auxiliaires) mentionné à l’article L. 126-26 du code de la construction et de l’habitation :{' '}
          <B>{dpeCost?.costMin || dpeCost?.costMax ? `entre ${dpeCost.costMin ?? '…'} € et ${dpeCost.costMax ?? '…'} € par an` : BLANK}</B> (estimation réalisée à partir des prix énergétiques de référence de
          l’année {dpeCost?.costYear ?? BLANK}).
        </P>

        {/* V. Travaux */}
        {!mobility ? (
          <>
            <Rubric n="V" title="Travaux" />
            <Item label="A. Travaux d’amélioration ou de mise en conformité effectués depuis la fin du dernier contrat ou le dernier renouvellement">{t.works?.sinceLast || 'néant'}</Item>
            <Item label="B. Majoration du loyer en cours de bail consécutive à des travaux d’amélioration du bailleur">{revisionBlocked ? 'sans objet (logement classé F ou G)' : t.works?.increase || 'néant'}</Item>
            <Item label="C. Diminution de loyer en cours de bail consécutive à des travaux entrepris par le locataire">{t.works?.decrease || 'néant'}</Item>
          </>
        ) : null}

        {/* VI. Garanties */}
        <Rubric n="VI" title="Garanties" />
        {mobility ? (
          <P>Aucun dépôt de garantie ne peut être exigé dans le cadre d’un bail mobilité (article 25-17). Le locataire peut bénéficier de la garantie Visale.</P>
        ) : (
          <>
            <Item label="Montant du dépôt de garantie">
              <B>{deposit !== null ? `${euros(deposit)} (${eurosInWords(deposit)})` : BLANK}</B>, au plus {kind === 'VIDE' ? 'un mois' : 'deux mois'} de loyer hors charges
            </Item>
            <P>
              Le dépôt de garantie n’est pas productif d’intérêts et ne peut être révisé en cours de bail. Il est restitué dans un délai maximal d’un mois à compter de la remise des clés lorsque l’état des lieux de
              sortie est conforme à l’état des lieux d’entrée, et de deux mois dans le cas contraire, déduction faite des sommes restant dues et dûment justifiées.
              {p.legalRegime === 'COPRO' ? ' En immeuble collectif, une provision d’au plus 20 % peut être conservée jusqu’à l’arrêté annuel des comptes de l’immeuble.' : ''} À défaut de restitution dans le délai prévu,
              le solde dû est majoré de 10 % du loyer mensuel hors charges pour chaque période mensuelle commencée en retard (article 22).
            </P>
          </>
        )}
        {c.guarantors.length ? (
          <P>
            Cautionnement : {c.guarantors.map((g) => `${guarantorLine(g)}, caution ${g.engagement === 'SIMPLE' ? 'simple' : 'solidaire'}`).join(' ; ')}, par acte séparé annexé au contrat ; un exemplaire du contrat est remis à la caution (article 22-1).
          </P>
        ) : tenants.some((x) => x.guarantee === 'VISALE') ? (
          <P>Garantie Visale (Action Logement){tenants.find((x) => x.visaleNumber)?.visaleNumber ? `, visa n° ${tenants.find((x) => x.visaleNumber)?.visaleNumber}` : ''}.</P>
        ) : (
          <P>Cautionnement : néant.</P>
        )}

        {/* VII. Clause de solidarité */}
        <Rubric n="VII" title="Clause de solidarité" />
        {showSolidarity ? (
          <P>
            Les colocataires sont tenus solidairement et indivisiblement de l’ensemble des obligations du bail, notamment du paiement du loyer et des charges. La solidarité d’un colocataire qui donne congé, et
            celle de sa caution, prennent fin à la date d’effet du congé lorsqu’un nouveau colocataire figure au bail, et au plus tard six mois après cette date (article 8-1).
          </P>
        ) : (
          <P>Sans objet{colocation ? ' : les parties ont convenu de ne pas prévoir de solidarité entre les colocataires' : ' : un seul locataire'}.</P>
        )}

        {/* VIII. Clause résolutoire */}
        <Rubric n="VIII" title="Clause résolutoire" />
        {showResolutoire ? (
          <>
            <P>Le présent contrat sera résilié de plein droit :</P>
            <Dash>
              six semaines après un commandement de payer demeuré infructueux, à défaut de paiement aux termes convenus de tout ou partie du loyer et des charges dûment justifiées{mobility ? '' : ', ou de versement du dépôt de garantie'} ;
            </Dash>
            <Dash>un mois après un commandement demeuré infructueux, à défaut de souscription d’une assurance des risques locatifs ;</Dash>
            <Dash>en cas de non-respect de l’obligation d’user paisiblement des locaux loués, résultant de troubles de voisinage constatés par une décision de justice passée en force de chose jugée.</Dash>
            <P>Le commandement est délivré par commissaire de justice et reproduit les mentions prévues à l’article 24 de la loi du 6 juillet 1989.</P>
          </>
        ) : (
          <P>Sans objet : les parties ont convenu de ne pas prévoir de clause résolutoire.</P>
        )}

        {/* IX. Honoraires */}
        <Rubric n="IX" title="Honoraires de location" />
        {agent ? (
          <>
            <P>
              Il est rappelé les dispositions du I de l’article 5 de la loi du 6 juillet 1989 : la rémunération des personnes mandatées pour la mise en location est à la charge exclusive du bailleur, à l’exception des
              honoraires liés à la visite du preneur, à la constitution de son dossier, à la rédaction du bail et à l’état des lieux, partagés entre le bailleur et le preneur. La part imputée au preneur ne peut
              excéder celle du bailleur ni les plafonds fixés par voie réglementaire.
            </P>
            <Item label="À la charge du locataire">
              {orBlank(euros(t.fees?.tenantVisitFileCents))} (visite, dossier, bail) ; {orBlank(euros(t.fees?.tenantInventoryCents))} (état des lieux d’entrée)
            </Item>
            <Item label="À la charge du bailleur">{orBlank(euros(t.fees?.landlordCents))}</Item>
          </>
        ) : (
          <P>Sans objet : le contrat est conclu directement entre le bailleur et le locataire, sans intermédiaire rémunéré.</P>
        )}

        {/* X. Autres conditions particulières */}
        <Rubric n="X" title="Autres conditions particulières" />
        <Sub>1. Assurance</Sub>
        <P>
          {TheTenant} {plural ? 'doivent' : 'doit'} s’assurer contre les risques locatifs et en justifier lors de la remise des clés, puis chaque année à la demande du bailleur (article 7, g). À défaut, un mois après une
          mise en demeure restée sans effet, le bailleur peut souscrire une assurance pour le compte du locataire et en récupérer le montant, majoré de 10 %, ou mettre en œuvre la clause résolutoire.
        </P>
        <Sub>2. Entretien et réparations</Sub>
        <P>
          {TheTenant} {plural ? 'prennent' : 'prend'} à sa charge l’entretien courant du logement et des équipements, les menues réparations et les réparations locatives définies par le décret n° 87-712 du 26 août 1987,
          sauf vétusté, malfaçon, vice de construction, cas fortuit ou force majeure.
          {boiler ? ' Il fait réaliser chaque année l’entretien de la chaudière par un professionnel et en remet l’attestation au bailleur (décret n° 2009-649 du 9 juin 2009).' : ''}
          {p.heating?.energy === 'WOOD' ? ' Il fait ramoner les conduits de fumée selon la réglementation locale.' : ''}
          {garden ? ' Il assure l’entretien courant du jardin (tonte, taille des haies et arbustes, désherbage).' : ''} Le bailleur assure les autres réparations nécessaires au maintien en état du logement.
        </P>
        <Sub>3. Détecteur de fumée</Sub>
        <P>
          Le logement est équipé de {p.smokeDetectors ? `${p.smokeDetectors} détecteur${p.smokeDetectors > 1 ? 's' : ''}` : 'au moins un détecteur'} de fumée normalisé{(p.smokeDetectors ?? 1) > 1 ? 's' : ''}.{' '}
          {furnished ? 'Le logement étant loué meublé, le bailleur en assure la vérification et l’entretien.' : 'Le locataire veille à son entretien et à son bon fonctionnement, notamment au remplacement des piles.'}
        </P>
        <Sub>4. Clés</Sub>
        <P>{p.keys ? `Remis au locataire : ${p.keys}.` : 'Le détail des clés et moyens d’accès remis est porté à l’état des lieux d’entrée.'}</P>
        <Sub>5. Animaux</Sub>
        <P>
          {TheTenant} peu{plural ? 'vent' : 't'} détenir des animaux familiers, à condition qu’ils ne causent ni dégât au logement ni trouble de jouissance aux occupants de l’immeuble. La détention de chiens de
          première catégorie (chiens d’attaque) est interdite (loi n° 70-598 du 9 juillet 1970, article 10).
        </P>
        <Sub>6. Usage des lieux, sous-location, visites</Sub>
        <P>
          {TheTenant} use{plural ? 'nt' : ''} paisiblement des lieux suivant leur destination, ne {plural ? 'les transforment' : 'les transforme'} pas sans l’accord écrit du bailleur et ne {plural ? 'peuvent' : 'peut'} ni
          sous-louer ni céder le bail sans l’accord écrit du bailleur, y compris sur le prix (article 8). En vue de la vente ou de la relocation, les visites sont permises dans la limite de deux heures par jour
          ouvrable, en dehors des jours fériés.{p.legalRegime === 'COPRO' ? ' Le locataire respecte le règlement de copropriété dont les extraits lui sont remis.' : ''}
          {furnished ? ' Le mobilier est maintenu dans les lieux et restitué en bon état, sous réserve de l’usure normale.' : ''}
        </P>
        <Sub>7. État des lieux{furnished ? ' et inventaire' : ''}</Sub>
        <P>
          Un état des lieux{furnished ? ' et un inventaire détaillé du mobilier' : ''} sont établis contradictoirement à la remise et à la restitution des clés (article 3-2 ; décret n° 2016-382 du 30 mars 2016). Le
          locataire peut demander que l’état des lieux d’entrée soit complété dans les dix jours, et pour le chauffage pendant le premier mois de la période de chauffe.
        </P>
        <Sub>8. Congé</Sub>
        {!mobility && !student ? (
          <P>
            Le congé est notifié par lettre recommandée avec avis de réception, par acte de commissaire de justice ou par remise en main propre contre récépissé ; le délai court à compter de sa réception. Le
            locataire peut donner congé à tout moment avec un préavis de {tenantNotice}. Le bailleur peut donner congé pour le terme du bail avec un préavis de {landlordNotice === 6 ? 'six' : 'trois'} mois, pour reprendre le
            logement, le vendre ou pour un motif légitime et sérieux ; le congé indique le motif à peine de nullité{kind === 'VIDE' ? ' (articles 15 et 15-1)' : ' (article 25-8)'}.
          </P>
        ) : (
          <P>
            Le locataire peut résilier le contrat à tout moment avec un préavis d’un mois, notifié par lettre recommandée avec avis de réception, par acte de commissaire de justice ou par remise en main propre contre
            récépissé. Le contrat prend fin à son terme sans que le bailleur ait à délivrer de congé.
          </P>
        )}
        <Sub>9. Quittance et domicile</Sub>
        <P>
          Le bailleur remet gratuitement une quittance au locataire qui en fait la demande ; avec son accord, elle peut lui être transmise par voie dématérialisée (article 21). Pour l’exécution du contrat, le bailleur
          fait élection de domicile à l’adresse indiquée ci-dessus{agent ? ' ou chez son mandataire' : ''}, et le locataire dans les lieux loués.
        </P>
        {t.clauses?.custom?.length ? (
          <>
            <Sub>10. Clauses convenues entre les parties</Sub>
            {t.clauses.custom.map((cl, i) => (
              <Dash key={i}>{cl}</Dash>
            ))}
          </>
        ) : null}

        {/* XI. Annexes */}
        <Rubric n="XI" title="Annexes" />
        <P>Sont annexées et jointes au contrat de location les pièces suivantes :</P>
        {p.legalRegime === 'COPRO' ? (
          <Check on={Boolean(p.copro?.extractsProvided)}>A. Extrait du règlement de copropriété concernant la destination de l’immeuble, la jouissance et l’usage des parties privatives et communes, et la quote-part afférente au lot loué dans chacune des catégories de charges</Check>
        ) : null}
        <Check on>B. Dossier de diagnostic technique :</Check>
        {diags
          .filter((d) => d.required && d.annexed)
          .map((d) => {
            const v = p.diagnostics?.[d.key]
            return (
              <Dash key={d.key}>
                {d.label.replace('(dpe)', '(DPE)')}
                {v?.date ? `, établi le ${dateShort(v.date)}` : ''} ;
              </Dash>
            )
          })}
        {diags.find((d) => d.key === 'asbestos')?.required ? <Dash>état mentionnant l’absence ou la présence d’amiante, tenu à la disposition du locataire ;</Dash> : null}
        <Check on>C. Notice d’information relative aux droits et obligations des locataires et des bailleurs (reproduite ci-après)</Check>
        <Check on>D. État des lieux{furnished ? ', inventaire et état détaillé du mobilier' : ''}</Check>
        {p.rentalPermit?.required ? <Check on={Boolean(p.rentalPermit.reference)}>E. Autorisation préalable de mise en location{p.rentalPermit.reference ? ` n° ${p.rentalPermit.reference}` : ''}{p.rentalPermit.date ? ` du ${dateShort(p.rentalPermit.date)}` : ''}</Check> : null}
        {furnished ? <Check on>Liste des éléments de mobilier (ci-après)</Check> : null}
        {c.guarantors.length ? <Check on>Acte de cautionnement</Check> : null}

        {/* Signatures */}
        <View wrap={false} style={{ marginTop: 14 }}>
          {t.signature?.mode === 'ELECTRONIC' ? (
            <P>
              Le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, par voie électronique. Chacune des parties
              {c.guarantors.length ? ', ainsi que la caution,' : ''} reçoit un exemplaire numérique signé, qui vaut original (articles 1366, 1367 et 1375 du code civil).{signed?.certificate ? ' Le certificat de signature est joint en dernière page.' : ''}
            </P>
          ) : (
            <P>
              Le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, en {originalsCount(c)} exemplaires originaux dont un remis à chacune des parties
              {c.guarantors.length ? ' et un à la caution' : ''}.
            </P>
          )}
          <SignatureBoxes
            boxes={[
              { label: agent ? 'Signature du bailleur ou de son mandataire' : 'Signature du bailleur', name: l.kind === 'SCI' || l.kind === 'COMPANY' ? landlordName(l) : formal(l), image: signed?.landlord?.image, hint: signedHint(signed?.landlord) },
              ...tenants.map((tn, i) => ({ label: plural ? `Signature du colocataire ${i + 1}` : 'Signature du locataire', name: formal(tn), image: signed?.tenants?.[i]?.image, hint: signedHint(signed?.tenants?.[i]) })),
            ]}
          />
        </View>

        {/* Annexe mobilier (meublé) */}
        {furnished ? (
          <View break>
            <Text style={[st.article, { marginBottom: 2 }]}>Annexe – Éléments de mobilier</Text>
            <Text style={st.small}>Décret n° 2015-981 du 31 juillet 2015</Text>
            <P>Éléments de mobilier présents dans le logement :</P>
            {Object.entries(FURNITURE_REQUIRED).map(([k, label]) => (
              <Check key={k} on={Boolean(p.furniture?.present?.includes(k as keyof typeof FURNITURE_REQUIRED))}>
                {label}
              </Check>
            ))}
            {p.furniture?.inventory?.length ? (
              <>
                <Text style={st.clause}>Inventaire détaillé</Text>
                <Table columns={['Pièce', 'Élément', 'Nombre', 'État']} widths={[24, 46, 12, 18]} rows={p.furniture.inventory.map((i) => [i.room, i.item, i.count, i.state])} />
              </>
            ) : (
              <P>L’inventaire détaillé et l’état de chaque élément sont établis avec l’état des lieux d’entrée.</P>
            )}
          </View>
        ) : null}

        <Footer left={`Bail ${lastNames || ''}${version}${signed?.certificate ? ` · signé électroniquement, réf. ${signed.certificate.requestId.slice(0, 8)}` : ''}`} paraphs={signed?.certificate ? 0 : paraphs} />
      </Page>
      <NoticePages footer={`Bail ${lastNames || ''} · annexe : notice d’information`} paraphs={signed?.certificate ? 0 : paraphs} />
      {signed?.certificate ? <CertificatePage data={signed.certificate} /> : null}
    </Document>
  )
}

export function renderContractPdf(c: ContractInput, signed?: SignedLease): Promise<Buffer> {
  return renderToBuffer(<ContractDocument c={c} signed={signed} />)
}

/** Libellé court du trimestre, réexporté pour les écrans. */
export { quarterLabel }
export const tenantsLabelFor = (n: number) => (n > 1 ? 'Les locataires' : 'Le locataire')
