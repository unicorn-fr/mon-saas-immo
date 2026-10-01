import type { ReactNode } from 'react'
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { FURNITURE_REQUIRED, MOBILITY_REASONS, type ContractInput, type Guarantor, type LandlordProfile, type PartyName, type TenantFile } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import { contractEndDate, diagnosticsFor, firstPayment, landlordNoticeMonthsFor, leaseDurationMonths, maxDepositFor, rentRevisionAllowed } from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { quarterLabel } from '../lib/irl.js'
import { CONSTRUCTION, ENERGY, NET, TV, annexesLabel, commonAreasLabel, dateLong, dateShort, durationText, equipmentsLabel, euros, guarantorName, landlordName, originalsCount, propertyAddress } from './labels.js'
import { CertificatePage, type CertificateData } from './certificate.js'
import { BLANK, Check, Footer, INK, MUTED, SignatureBoxes, Table, orBlank, s } from './theme.js'

/**
 * Contrat de location rédigé comme un acte : parties désignées en toutes lettres, articles numérotés,
 * clauses complètes. Le contenu suit, dans l'ordre, les rubriques du contrat type du décret n° 2015-587
 * du 29 mai 2015 (annexe 1 : logement nu ; annexe 2 : logement meublé), rappelées sous chaque article,
 * complétées des clauses qui reprennent les obligations légales des parties (loi n° 89-462 du 6 juillet 1989).
 * Aucune clause interdite par l'article 4 de la loi. Une information inconnue laisse une ligne à compléter.
 */

// ── Mise en page propre à l'acte ─────────────────────────────────────────────

const st = {
  p: { fontSize: 10, lineHeight: 1.5, textAlign: 'justify' as const, marginBottom: 5 },
  article: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.4, marginTop: 16, marginBottom: 2 },
  rubric: { fontSize: 7.5, color: MUTED, marginBottom: 7, paddingBottom: 5, borderBottomWidth: 0.8, borderBottomColor: INK },
  clause: { fontSize: 9.5, fontWeight: 700, marginTop: 7, marginBottom: 3 },
  center: { fontSize: 10, fontWeight: 700, textAlign: 'center' as const, letterSpacing: 1.2, marginVertical: 10 },
  right: { fontSize: 9.5, fontWeight: 700, textAlign: 'right' as const, marginTop: 4, marginBottom: 8 },
  role: { fontSize: 9, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.8, color: MUTED, marginBottom: 4 },
  named: { fontSize: 10, fontWeight: 500, marginTop: 2 },
}

const P = ({ children }: { children: ReactNode }) => <Text style={st.p}>{children}</Text>
const B = ({ children }: { children: ReactNode }) => <Text style={{ fontWeight: 700 }}>{children}</Text>
const Clause = ({ n, children }: { n: string; children: ReactNode }) => (
  <Text style={st.clause} minPresenceAhead={40}>
    {n}. {children}
  </Text>
)
function Article({ n, title, rubric }: { n: number; title: string; rubric?: string }) {
  return (
    <View minPresenceAhead={80}>
      <Text style={st.article}>
        Article {n} – {title}
      </Text>
      <Text style={st.rubric}>{rubric ?? ' '}</Text>
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
  let art = 0
  const next = () => ++art

  const subtitle = {
    VIDE: 'de locaux vides à usage d’habitation constituant la résidence principale du locataire',
    MEUBLE: 'de locaux meublés à usage d’habitation constituant la résidence principale du locataire',
    ETUDIANT: 'de locaux meublés à usage d’habitation, consenti à un étudiant pour une durée de neuf mois',
    MOBILITE: 'bail mobilité portant sur des locaux meublés à usage d’habitation',
  }[kind]

  return (
    <Document title={`Contrat de location, ${p.address ?? ''}`} author={landlordName(l)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        {/* En-tête encadré */}
        <View style={{ borderTopWidth: 2, borderBottomWidth: 2, borderColor: INK, paddingVertical: 12, paddingHorizontal: 10, marginBottom: 10 }}>
          <Text style={{ fontSize: 17, fontWeight: 700, letterSpacing: 2.2, textAlign: 'center', textTransform: 'uppercase' }}>Contrat de location</Text>
          <Text style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.6 }}>{subtitle}</Text>
          {colocation ? <Text style={{ fontSize: 9, textAlign: 'center', marginTop: 3 }}>Colocation</Text> : null}
        </View>
        <Text style={{ fontSize: 8, color: MUTED, textAlign: 'center', lineHeight: 1.45, marginBottom: 12 }}>
          {mobility
            ? 'Régi par le titre Ier ter de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs (articles 25-12 à 25-18).'
            : `Régi par le ${titleLaw} de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs. Établi conformément au contrat type défini par le décret n° 2015-587 du 29 mai 2015 (annexe ${furnished ? '2' : '1'}).`}
        </Text>

        <View style={[s.box, { marginBottom: 4 }]}>
          <Text style={{ fontSize: 7.8, lineHeight: 1.45, textAlign: 'justify' }}>
            Le régime de droit commun en matière de baux d’habitation est défini principalement par la loi n° 89-462 du 6 juillet 1989. L’ensemble de ces dispositions étant d’ordre public, elles
            s’imposent aux parties qui, en principe, ne peuvent pas y renoncer. Le présent contrat contient les clauses essentielles dont la loi impose la mention ; les autres dispositions d’ordre public
            applicables sont rappelées dans la notice d’information jointe au contrat.
          </Text>
        </View>

        {/* Parties */}
        <Text style={st.center}>ENTRE LES SOUSSIGNÉS</Text>
        <Text style={st.role}>Le Bailleur</Text>
        <Party v={landlordParagraph(l)} />
        {agent ? (
          <P>
            Représenté(e) par son mandataire, {[agent.name, agent.address].filter(Boolean).join(', ') || BLANK}
            {agent.cardNumber ? `, titulaire de la carte professionnelle n° ${agent.cardNumber}` : ''}
            {agent.cardIssuer ? ` délivrée par ${agent.cardIssuer}` : ''} ;
          </P>
        ) : null}
        <Text style={st.named}>Ci-après dénommé{l.kind === 'COUPLE' ? 's' : ''} « le Bailleur »,</Text>
        <Text style={st.right}>D’UNE PART,</Text>

        <Text style={st.center}>ET</Text>
        <Text style={st.role}>{plural ? 'Les Locataires' : 'Le Locataire'}</Text>
        {tenants.map((tn, i) => (
          <Party key={i} v={tenantParagraph(tn)} />
        ))}
        <Text style={st.named}>{plural ? 'Ci-après dénommés ensemble « les Locataires »,' : 'Ci-après dénommé « le Locataire »,'}</Text>
        <Text style={st.right}>D’AUTRE PART,</Text>

        <P>
          Pour la lecture des présentes : « le Bailleur » et « {plural ? 'les Locataires' : 'le Locataire'} » désignent les personnes identifiées ci-dessus, ensemble « les Parties » ; « les Locaux » désignent
          le logement loué et ses dépendances ; « le Bail » désigne le présent contrat.
        </P>
        <Text style={[st.center, { marginTop: 12 }]}>IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT</Text>
        <P>
          Le Bailleur donne en location {plural ? 'aux Locataires, qui acceptent,' : 'au Locataire, qui accepte,'} les Locaux désignés ci-après{furnished ? ', avec les meubles, équipements et objets mobiliers décrits à l’inventaire annexé' : ''}, pour la durée et
          aux conditions suivantes.
        </P>

        {/* Objet */}
        <Article n={next()} title="Désignation des Locaux" rubric="Contrat type, rubrique II – Objet du contrat" />
        <Clause n={`${art}.1`}>Adresse et situation</Clause>
        <P>
          {orBlank(propertyAddress(p))}
          {p.postalCode && !p.address?.includes(p.postalCode) ? `, ${p.postalCode}` : ''}
          {cityUpper && !p.address?.toLocaleUpperCase('fr-FR').includes(cityUpper) ? ` ${cityUpper}` : ''}.
          {p.habitat === 'COLLECTIVE' ? ' Les Locaux dépendent d’un immeuble collectif' : p.habitat === 'INDIVIDUAL' ? ' Il s’agit d’une maison individuelle' : ' Type d’habitat : ' + BLANK}
          {p.legalRegime === 'COPRO'
            ? ` soumis au régime de la copropriété${p.lotNumber ? `, lot n° ${p.lotNumber}` : ''}${p.copro?.quotePart ? `, représentant ${p.copro.quotePart} des parties communes générales` : ''}.`
            : p.legalRegime === 'MONO'
              ? ', en monopropriété.'
              : '.'}
          {p.fiscalId ? ` Identifiant fiscal du logement : ${p.fiscalId}.` : ''}
        </P>
        <Clause n={`${art}.2`}>Période de construction</Clause>
        <P>{p.constructionPeriod ? `${CONSTRUCTION[p.constructionPeriod]}.` : BLANK}</P>
        <Clause n={`${art}.3`}>Consistance</Clause>
        <P>
          Surface habitable : {p.surface ? `${String(p.surface).replace('.', ',')} m²` : BLANK}. Nombre de pièces principales : {orBlank(p.rooms)}.
          {p.roomList?.length ? ` Le logement comprend : ${p.roomList.map((r) => r.name.toLowerCase()).join(', ')}.` : ''}
        </P>
        <P>Autres parties du logement : {annexesLabel(p) || 'néant'}.</P>
        <P>{p.keys ? `Clés et moyens d’accès remis au Locataire : ${p.keys}.` : 'Les clés et moyens d’accès remis au Locataire sont détaillés dans l’état des lieux d’entrée.'}</P>
        <Clause n={`${art}.4`}>Équipements privatifs</Clause>
        <P>{equipmentsLabel(p) ? `${equipmentsLabel(p)}.` : BLANK}</P>
        <Clause n={`${art}.5`}>Chauffage et eau chaude sanitaire</Clause>
        <P>
          Chauffage : {p.heating?.mode ? `${p.heating.mode === 'COLLECTIVE' ? 'collectif' : 'individuel'}${p.heating.energy ? `, ${ENERGY[p.heating.energy]}` : ''}${p.heating.appliance ? ` (${p.heating.appliance})` : ''}` : BLANK}
          {p.heating?.mode === 'COLLECTIVE' ? `. Répartition de la consommation : ${orBlank(p.heating.split)}` : ''}. Eau chaude sanitaire : {p.hotWater?.mode ? (p.hotWater.mode === 'COLLECTIVE' ? 'collective' : 'individuelle') : BLANK}
          {p.hotWater?.mode === 'COLLECTIVE' ? `. Répartition : ${orBlank(p.hotWater.split)}` : ''}.
        </P>
        <Clause n={`${art}.6`}>Performance énergétique</Clause>
        <P>
          {dpe ? `Classe énergie ${dpe}${p.diagnostics?.dpe?.ges ? `, classe climat (émissions de gaz à effet de serre) ${p.diagnostics.dpe.ges}` : ''}${p.diagnostics?.dpe?.number ? `, diagnostic n° ${p.diagnostics.dpe.number}` : ''}.` : BLANK}
        </P>
        <Clause n={`${art}.7`}>Locaux et équipements accessoires à usage privatif</Clause>
        <P>{annexesLabel(p) ? `${annexesLabel(p)}.` : 'Néant.'}</P>
        <Clause n={`${art}.8`}>Parties et équipements à usage commun</Clause>
        <P>{p.habitat === 'COLLECTIVE' ? (commonAreasLabel(p) ? `${commonAreasLabel(p)}.` : 'Néant.') : 'Sans objet (maison individuelle).'}</P>
        <Clause n={`${art}.9`}>Accès aux technologies de l’information et de la communication</Clause>
        <P>{[p.tv ? `Réception de la télévision : ${TV[p.tv].toLowerCase()}` : '', p.internet ? `accès à internet : ${NET[p.internet]}` : ''].filter(Boolean).join(' ; ') || BLANK}.</P>
        <Clause n={`${art}.10`}>Logement décent</Clause>
        <P>
          Le Bailleur déclare que les Locaux répondent aux caractéristiques du logement décent définies par le décret n° 2002-120 du 30 janvier 2002 : ils ne laissent pas apparaître de risques
          manifestes pouvant porter atteinte à la sécurité physique ou à la santé, sont exempts de toute infestation d’espèces nuisibles et parasites, répondent au critère de performance énergétique
          minimale et sont dotés des éléments les rendant conformes à l’usage d’habitation (article 6 de la loi du 6 juillet 1989).
        </P>
        <Clause n={`${art}.11`}>Destination</Clause>
        <P>
          {p.destination === 'MIXTE'
            ? `Les Locaux sont loués à usage mixte professionnel et d’habitation, ${theTenant} y installant ${plural ? 'leur' : 'sa'} résidence principale.`
            : `Les Locaux sont loués à usage exclusif d’habitation, ${theTenant} déclarant y installer ${plural ? 'leur' : 'sa'} résidence principale.`}
        </P>
        {furnished ? (
          <>
            <Clause n={`${art}.12`}>Mobilier</Clause>
            <P>Le logement est loué meublé. Il comporte au minimum les éléments de mobilier fixés par le décret n° 2015-981 du 31 juillet 2015, énumérés en annexe et détaillés dans l’inventaire établi à l’entrée dans les lieux.</P>
          </>
        ) : null}

        {/* Durée */}
        <Article n={next()} title="Date de prise d’effet et durée" rubric="Contrat type, rubrique III" />
        <P>
          Le Bail prend effet le <B>{t.startDate ? dateLong(t.startDate) : BLANK}</B>. Il est conclu pour une durée de <B>{durationText(months)}</B>
          {end ? `, soit jusqu’au ${formatDateFr(end)} inclus` : ''}.
        </P>
        {mobility ? (
          <>
            <P>Motif du bail mobilité : {t.mobilityReason ? `${theTenant} justifie, à la date de prise d’effet du Bail, être en ${MOBILITY_REASONS[t.mobilityReason as keyof typeof MOBILITY_REASONS]}.` : BLANK}</P>
            <P>Le bail mobilité est conclu pour une durée d’un à dix mois. Il n’est ni renouvelable ni reconductible. Sa durée peut être modifiée une fois par avenant, sans que la durée totale du contrat dépasse dix mois.</P>
          </>
        ) : student ? (
          <P>{TheTenant} étant étudiant{plural ? 's' : ''}, le Bail est conclu pour neuf mois. Il n’est pas reconduit tacitement et prend fin à son terme, sans qu’un congé soit nécessaire.</P>
        ) : (
          <P>
            À défaut de congé donné dans les conditions de l’article « Congé » ci-après, le Bail est, à son terme, reconduit tacitement pour une durée de {durationText(kind === 'MEUBLE' ? 12 : months > 36 ? 72 : 36)}, aux mêmes conditions.
            Le Bailleur qui souhaite modifier les conditions du Bail à son échéance doit en faire la proposition {kind === 'MEUBLE' ? 'au moins trois mois' : 'au moins six mois'} avant le terme, dans les formes prévues par la loi.
          </P>
        )}
        {t.reduced?.enabled && kind === 'VIDE' ? <P>Durée réduite : événement précis justifiant la reprise du logement à l’échéance : {orBlank(t.reduced.reason)}.</P> : null}

        {/* Conditions financières */}
        <Article n={next()} title="Conditions financières" rubric="Contrat type, rubrique IV" />
        <Clause n={`${art}.1`}>Loyer</Clause>
        <P>
          Le loyer mensuel est fixé à la somme de <B>{rent !== null ? `${euros(rent)} (${eurosInWords(rent)})` : BLANK}</B>, hors charges.
        </P>
        <P>
          {t.zone?.tense === true
            ? 'Le logement est situé dans une zone d’urbanisation continue de plus de 50 000 habitants où existe un déséquilibre marqué entre l’offre et la demande de logements (zone tendue) : le loyer est soumis au décret fixant annuellement le montant maximum d’évolution des loyers à la relocation.'
            : t.zone?.tense === false
              ? 'Le logement n’est pas situé en zone tendue au sens de l’article 17 de la loi du 6 juillet 1989 : le loyer est fixé librement entre les Parties.'
              : `Zone tendue : ${BLANK}.`}
        </P>
        {t.zone?.control ? (
          <P>
            Le logement est soumis à l’encadrement des loyers. Loyer de référence : {t.zone.refRentCentsM2 ? `${euros(t.zone.refRentCentsM2)} par m²` : BLANK} ; loyer de référence majoré :{' '}
            {t.zone.refRentMaxCentsM2 ? `${euros(t.zone.refRentMaxCentsM2)} par m²` : BLANK}. Complément de loyer : {t.zone.complementCents ? `${euros(t.zone.complementCents)}, justifié par : ${orBlank(t.zone.complementJustification)}` : 'aucun'}.
          </P>
        ) : null}
        <P>
          Dernier loyer acquitté par le précédent locataire :{' '}
          {t.previous?.rentedWithin18Months === false
            ? 'sans objet, le logement n’ayant pas été loué dans les dix-huit mois précédant la signature.'
            : t.previous?.rentedWithin18Months
              ? `${orBlank(euros(t.previous.lastRentCents))}, versé le ${orBlank(dateShort(t.previous.lastPaymentDate))}, dernière révision le ${orBlank(dateShort(t.previous.lastRevisionDate))}.`
              : BLANK}
        </P>
        <Clause n={`${art}.2`}>Révision du loyer</Clause>
        {mobility ? (
          <P>Le loyer ne peut pas être révisé en cours de bail mobilité (article 25-16 de la loi du 6 juillet 1989).</P>
        ) : revisionBlocked ? (
          <P>Le logement étant classé {dpe} au diagnostic de performance énergétique, le loyer ne peut faire l’objet d’aucune révision ni majoration (article 17-1 de la loi du 6 juillet 1989).</P>
        ) : t.revision?.enabled === false ? (
          <P>Le loyer n’est pas révisable en cours de Bail.</P>
        ) : (
          <P>
            Le loyer est révisé chaque année {t.revision?.date ? `le ${dateLong(`2000-${t.revision.date}`).replace(' 2000', '')}` : 'à la date anniversaire du Bail'}, dans la limite de la variation de l’indice de
            référence des loyers (IRL) publié par l’INSEE. Trimestre de référence : {t.revision?.irlQuarter ? `${quarterLabel(t.revision.irlQuarter)}${t.revision.irlValue ? ` (valeur ${String(t.revision.irlValue).replace('.', ',')})` : ''}` : BLANK}. La révision
            n’est pas rétroactive : le Bailleur dispose d’un an à compter de la date de révision pour la demander (article 17-1).
          </P>
        )}
        <Clause n={`${art}.3`}>Charges récupérables</Clause>
        {chargesMode === 'FORFAIT' ? (
          <P>
            Les charges sont payées sous la forme d’un forfait mensuel de <B>{t.chargesCents !== undefined && t.chargesCents !== null ? euros(charges) : BLANK}</B>, versé avec le loyer.{' '}
            {mobility ? 'Ce forfait est fixé pour toute la durée du bail et ne donne lieu à aucun complément ni régularisation (article 25-16).' : 'Il est révisé chaque année dans les mêmes conditions que le loyer et ne donne pas lieu à régularisation.'}
          </P>
        ) : chargesMode === 'PERIODIC' ? (
          <P>Les charges récupérables, dont la liste est fixée par le décret n° 87-713 du 26 août 1987, sont payées périodiquement sur justificatifs, sans provision.</P>
        ) : (
          <>
            <P>
              En sus du loyer, {theTenant} rembourse au Bailleur les charges récupérables dont la liste est fixée par le décret n° 87-713 du 26 août 1987, par provisions mensuelles de{' '}
              <B>{t.chargesCents !== undefined && t.chargesCents !== null ? euros(charges) : BLANK}</B>, payées avec le loyer.
            </P>
            <P>
              Les provisions font l’objet d’une régularisation annuelle. Un mois avant celle-ci, le Bailleur communique le décompte par nature de charges et, en immeuble collectif, le mode de répartition
              entre les locataires ; les pièces justificatives sont tenues à disposition pendant six mois (article 23 de la loi du 6 juillet 1989).
            </P>
          </>
        )}
        {kind === 'VIDE' ? (
          <P>
            Contribution pour le partage des économies de charges :{' '}
            {t.works?.energyContribution?.enabled ? `${euros(energy)} par mois. Travaux réalisés : ${orBlank(t.works.energyContribution.description)}.` : 'sans objet.'}
          </P>
        ) : null}
        {colocation ? <P>Assurance pour compte des colocataires : sans objet, chaque colocataire justifiant de sa propre assurance contre les risques locatifs.</P> : null}
        <Clause n={`${art}.4`}>Modalités de paiement</Clause>
        <P>
          Le loyer et les charges sont payables mensuellement {t.paymentTerm === 'ARREARS' ? 'à terme échu' : 'et d’avance'}, au plus tard le {t.paymentDay ? (t.paymentDay === 1 ? '1er' : t.paymentDay) : BLANK} de chaque mois, par{' '}
          {{ TRANSFER: 'virement bancaire sur le compte désigné par le Bailleur', CHEQUE: 'chèque', CASH: 'espèces, contre reçu', OTHER: orBlank(t.paymentPlace) }[t.paymentMethod ?? 'TRANSFER']}
          {t.paymentPlace && t.paymentMethod !== 'OTHER' ? `, à ${t.paymentPlace}` : ''}.
        </P>
        <Table
          columns={['Montant dû pour une période complète', 'Montant']}
          widths={[70, 30]}
          rows={[
            ['Loyer hors charges', rent !== null ? euros(rent) : ''],
            [chargesMode === 'FORFAIT' ? 'Forfait de charges' : chargesMode === 'PERIODIC' ? 'Charges (sur justificatifs)' : 'Provision sur charges', chargesMode === 'PERIODIC' ? '' : euros(charges)],
            ...(energy ? [['Contribution au partage des économies de charges', euros(energy)]] : []),
            ['Total mensuel', rent !== null ? euros(rent + (chargesMode === 'PERIODIC' ? 0 : charges) + energy) : ''],
          ]}
        />
        {first && !first.fullMonth ? (
          <P>
            Entrée en cours de mois : pour la première période ({first.days} jours sur {first.daysInMonth}), la somme due est de {euros(first.rentCents)} de loyer et {euros(first.chargesCents)} de charges, soit{' '}
            {euros(first.rentCents + first.chargesCents)}.
          </P>
        ) : null}
        <Clause n={`${art}.5`}>Quittance</Clause>
        <P>
          Le Bailleur transmet gratuitement une quittance au Locataire qui en fait la demande, portant le détail des sommes versées en distinguant le loyer et les charges. Avec l’accord du Locataire, elle peut
          être transmise par voie dématérialisée (article 21 de la loi du 6 juillet 1989).
        </P>

        {/* Travaux */}
        {!mobility ? (
          <>
            <Article n={next()} title="Travaux" rubric="Contrat type, rubrique V" />
            <P>Travaux d’amélioration ou de mise en conformité effectués depuis la fin du dernier contrat ou le dernier renouvellement : {t.works?.sinceLast || 'néant'}.</P>
            <P>Majoration du loyer en cours de bail consécutive à des travaux du Bailleur : {revisionBlocked ? 'sans objet (logement classé F ou G)' : t.works?.increase || 'néant'}.</P>
            <P>Diminution de loyer consécutive à des travaux entrepris par le Locataire : {t.works?.decrease || 'néant'}.</P>
          </>
        ) : null}

        {/* Garanties */}
        <Article n={next()} title="Dépôt de garantie et cautionnement" rubric="Contrat type, rubrique VI – Garanties" />
        {mobility ? (
          <P>Aucun dépôt de garantie ne peut être exigé dans le cadre d’un bail mobilité (article 25-17 de la loi du 6 juillet 1989).</P>
        ) : (
          <>
            <P>
              À la signature du Bail, {theTenant} verse{plural ? 'nt' : ''} au Bailleur un dépôt de garantie de <B>{deposit !== null ? `${euros(deposit)} (${eurosInWords(deposit)})` : BLANK}</B>, destiné à garantir l’exécution de{' '}
              {plural ? 'leurs' : 'ses'} obligations. Ce montant ne peut excéder {kind === 'VIDE' ? 'un mois' : 'deux mois'} de loyer hors charges. Il n’est pas productif d’intérêts et ne peut être révisé en cours de Bail.
            </P>
            <P>
              Le dépôt de garantie est restitué dans un délai maximal d’un mois à compter de la remise des clés lorsque l’état des lieux de sortie est conforme à l’état des lieux d’entrée, et de deux mois
              dans le cas contraire, déduction faite des sommes restant dues au Bailleur et de celles dont il pourrait être tenu aux lieu et place du Locataire, sous réserve qu’elles soient dûment justifiées.
              Lors de la remise des clés, le Locataire indique au Bailleur l’adresse de son nouveau domicile.
            </P>
            {p.legalRegime === 'COPRO' ? (
              <P>Le logement étant situé dans un immeuble collectif, le Bailleur peut conserver une provision ne dépassant pas 20 % du dépôt de garantie jusqu’à l’arrêté annuel des comptes de l’immeuble ; la régularisation intervient dans le mois qui suit leur approbation.</P>
            ) : null}
            <P>À défaut de restitution dans le délai prévu, le solde dû est majoré d’une somme égale à 10 % du loyer mensuel hors charges pour chaque période mensuelle commencée en retard (article 22 de la loi du 6 juillet 1989).</P>
          </>
        )}
        {c.guarantors.length ? (
          <P>
            Par acte séparé, {c.guarantors.map((g) => `${guarantorLine(g)}, s’est porté${g.civility === 'MADAME' ? 'e' : ''} caution ${g.engagement === 'SIMPLE' ? 'simple' : 'solidaire'}`).join(' ; ')} des obligations du Locataire. L’acte de cautionnement est
            annexé au Bail et un exemplaire du Bail est remis à la caution (article 22-1 de la loi du 6 juillet 1989).
          </P>
        ) : (
          <P>Cautionnement : néant.</P>
        )}

        {showSolidarity ? (
          <>
            <Article n={next()} title="Solidarité des colocataires" rubric="Contrat type, rubrique VII – Clause de solidarité" />
            <P>
              Les colocataires sont tenus solidairement et indivisiblement de l’ensemble des obligations du Bail, notamment du paiement du loyer et des charges. La solidarité d’un colocataire qui donne congé,
              et celle de sa caution, prennent fin à la date d’effet du congé lorsqu’un nouveau colocataire figure au Bail, et au plus tard six mois après cette date (article 8-1 de la loi du 6 juillet 1989).
            </P>
          </>
        ) : null}

        {showResolutoire ? (
          <>
            <Article n={next()} title="Clause résolutoire" rubric="Contrat type, rubrique VIII" />
            <P>Le Bail sera résilié de plein droit, sans qu’il soit besoin de faire ordonner cette résiliation en justice :</P>
            <Dash>
              six semaines après un commandement de payer demeuré infructueux, à défaut de paiement aux termes convenus de tout ou partie du loyer et des charges dûment justifiées{mobility ? '' : ', ou à défaut de versement du dépôt de garantie'} ;
            </Dash>
            <Dash>un mois après un commandement demeuré infructueux, à défaut d’assurance du Locataire contre les risques locatifs ;</Dash>
            <Dash>en cas de manquement du Locataire à l’obligation d’user paisiblement des Locaux, résultant de troubles de voisinage constatés par une décision de justice passée en force de chose jugée.</Dash>
            <P>Le commandement de payer est délivré par commissaire de justice et reproduit les mentions prévues à l’article 24 de la loi du 6 juillet 1989.</P>
          </>
        ) : null}

        <Article n={next()} title="Honoraires de location" rubric="Contrat type, rubrique IX" />
        {agent ? (
          <>
            <P>
              Les honoraires de l’intermédiaire liés à la visite, à la constitution du dossier, à la rédaction du Bail et à l’état des lieux sont partagés entre le Bailleur et le Locataire. La part du Locataire ne
              peut excéder celle du Bailleur ni les plafonds fixés par le décret n° 2014-890 du 1er août 2014.
            </P>
            <P>
              À la charge du Locataire : {orBlank(euros(t.fees?.tenantVisitFileCents))} (visite, dossier, bail) et {orBlank(euros(t.fees?.tenantInventoryCents))} (état des lieux). À la charge du Bailleur :{' '}
              {orBlank(euros(t.fees?.landlordCents))}.
            </P>
          </>
        ) : (
          <P>Néant. Le Bail est conclu directement entre le Bailleur et le Locataire, sans intermédiaire.</P>
        )}

        {/* Obligations des parties (rappel de la loi) */}
        <Article n={next()} title="Obligations du Locataire" rubric="Article 7 de la loi du 6 juillet 1989" />
        <P>{TheTenant} {plural ? 'sont tenus' : 'est tenu'} notamment :</P>
        <Dash>de payer le loyer et les charges aux termes convenus ;</Dash>
        <Dash>d’user paisiblement des Locaux suivant la destination prévue au Bail ;</Dash>
        <Dash>de répondre des dégradations et pertes survenant pendant la durée du Bail dans les Locaux dont il a la jouissance exclusive, à moins qu’il ne prouve qu’elles ont eu lieu par cas de force majeure, par la faute du Bailleur ou par le fait d’un tiers qu’il n’a pas introduit dans le logement ;</Dash>
        <Dash>de prendre à sa charge l’entretien courant du logement et des équipements, les menues réparations et les réparations locatives définies par le décret n° 87-712 du 26 août 1987, sauf si elles sont occasionnées par vétusté, malfaçon, vice de construction, cas fortuit ou force majeure ;</Dash>
        <Dash>de ne pas transformer les Locaux et équipements sans l’accord écrit du Bailleur ; à défaut, le Bailleur peut exiger la remise en l’état ou conserver les transformations sans indemnité ;</Dash>
        <Dash>de laisser exécuter les travaux d’amélioration, d’entretien, de mise en décence ou de performance énergétique, après notification de leur nature et de leurs modalités ; aucun travail ne peut avoir lieu les samedis, dimanches et jours fériés sans son accord ;</Dash>
        <Dash>de permettre la visite des Locaux en vue de leur relocation ou de leur vente, dans la limite de deux heures par jour ouvrable ;</Dash>
        <Dash>de ne pas sous-louer ni céder le Bail sans l’accord écrit du Bailleur, y compris sur le prix du loyer ;</Dash>
        {furnished ? <Dash>d’utiliser le mobilier et les équipements conformément à leur destination, de les maintenir dans les Locaux et de les restituer en bon état, sous réserve de l’usure normale ;</Dash> : null}
        {p.legalRegime === 'COPRO' ? <Dash>de respecter le règlement de copropriété, dont les extraits lui sont communiqués ;</Dash> : null}
        <Dash>de signaler sans délai au Bailleur toute dégradation ou tout dysfonctionnement.</Dash>

        <Article n={next()} title="Obligations du Bailleur" rubric="Article 6 de la loi du 6 juillet 1989" />
        <P>Le Bailleur est tenu notamment :</P>
        <Dash>de remettre au Locataire un logement décent, ainsi que les équipements mentionnés au Bail en bon état d’usage et de réparation ;</Dash>
        <Dash>d’assurer au Locataire la jouissance paisible des Locaux et de le garantir des vices ou défauts de nature à y faire obstacle ;</Dash>
        <Dash>d’entretenir les Locaux en état de servir à l’usage prévu et d’y faire toutes les réparations, autres que locatives, nécessaires à leur maintien en état ;</Dash>
        <Dash>de ne pas s’opposer aux aménagements réalisés par le Locataire dès lors qu’ils ne constituent pas une transformation des Locaux ;</Dash>
        <Dash>de remettre gratuitement une quittance au Locataire qui en fait la demande.</Dash>

        <Article n={next()} title="Assurance" rubric="Article 7, g de la loi du 6 juillet 1989" />
        <P>
          {TheTenant} {plural ? 'doivent' : 'doit'} s’assurer contre les risques locatifs auprès de l’assureur de {plural ? 'leur' : 'son'} choix et en justifier lors de la remise des clés, puis chaque année à la demande du Bailleur, par la
          remise d’une attestation. Cette assurance est maintenue pendant toute la durée du Bail. À défaut, et un mois après une mise en demeure restée sans effet, le Bailleur peut souscrire une assurance
          pour le compte du Locataire et en récupérer le montant, majoré de 10 %, ou mettre en œuvre la clause résolutoire.
        </P>

        <Article n={next()} title="Détecteur de fumée" rubric="Code de la construction et de l’habitation" />
        <P>
          Le logement est équipé de {p.smokeDetectors ? `${p.smokeDetectors} détecteur${p.smokeDetectors > 1 ? 's' : ''}` : 'au moins un détecteur'} de fumée normalisé{(p.smokeDetectors ?? 1) > 1 ? 's' : ''}.{' '}
          {furnished
            ? 'Le logement étant loué meublé, le Bailleur assure la vérification du bon fonctionnement et l’entretien du dispositif.'
            : 'Le Locataire veille à l’entretien et au bon fonctionnement du dispositif, notamment au remplacement des piles, pendant toute la durée de son occupation.'}
        </P>

        <Article n={next()} title="Diagnostics" rubric="Article 3-3 de la loi du 6 juillet 1989 – Dossier de diagnostic technique" />
        <P>Le Bailleur remet au Locataire le dossier de diagnostic technique, annexé au Bail, comprenant :</P>
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
        {diags.find((d) => d.key === 'asbestos')?.required ? <P>Le repérage de l’amiante dans les parties privatives est tenu à la disposition du Locataire.</P> : null}
        {!diags.find((d) => d.key === 'lead')?.required ? <P>L’immeuble ayant été construit après le 1er janvier 1949, le constat de risque d’exposition au plomb n’est pas exigé.</P> : null}

        <Article n={next()} title={furnished ? 'État des lieux et inventaire' : 'État des lieux'} rubric="Article 3-2 de la loi du 6 juillet 1989 et décret n° 2016-382 du 30 mars 2016" />
        <P>
          Un état des lieux{furnished ? ' et un inventaire détaillé du mobilier' : ''} sont établis contradictoirement par les Parties lors de la remise et de la restitution des clés, et joints au Bail. À défaut, ils
          sont établis par un commissaire de justice à l’initiative de la Partie la plus diligente, à frais partagés par moitié.
        </P>
        <P>
          {TheTenant} peut demander que l’état des lieux d’entrée soit complété dans un délai de dix jours à compter de son établissement, et, pour les éléments de chauffage, pendant le premier mois de la période de
          chauffe.
        </P>

        {!mobility && !student ? (
          <>
            <Article n={next()} title="Congé" rubric={kind === 'VIDE' ? 'Article 15 de la loi du 6 juillet 1989' : 'Article 25-8 de la loi du 6 juillet 1989'} />
            <P>Le congé est notifié par lettre recommandée avec demande d’avis de réception, signifié par acte de commissaire de justice ou remis en main propre contre récépissé ou émargement. Le délai de préavis court à compter de sa réception.</P>
            <P>
              <B>Congé donné par le Locataire.</B> {TheTenant} peut donner congé à tout moment, avec un préavis de {tenantNotice}. Pendant le préavis, il reste redevable du loyer et des charges, sauf si le logement est
              occupé avant la fin du préavis par un autre locataire en accord avec le Bailleur.
            </P>
            <P>
              <B>Congé donné par le Bailleur.</B> Le Bailleur peut donner congé pour le terme du Bail, avec un préavis de {landlordNotice === 6 ? 'six' : 'trois'} mois, soit pour reprendre le logement afin de l’habiter ou d’y loger un proche
              désigné par la loi, soit pour le vendre, soit pour un motif légitime et sérieux, notamment l’inexécution par le Locataire de l’une de ses obligations. À peine de nullité, le congé indique le motif
              allégué{kind === 'VIDE' ? ' et, en cas de reprise, les nom et adresse du bénéficiaire et la nature de son lien avec le Bailleur ; en cas de vente, il vaut offre de vente au profit du Locataire' : ''}.
            </P>
          </>
        ) : (
          <>
            <Article n={next()} title="Congé" rubric={mobility ? 'Article 25-12 de la loi du 6 juillet 1989' : 'Articles 25-7 et 25-8 de la loi du 6 juillet 1989'} />
            <P>
              {TheTenant} peut résilier le Bail à tout moment, en respectant un préavis d’un mois, notifié par lettre recommandée avec demande d’avis de réception, par acte de commissaire de justice ou par remise en
              main propre contre récépissé. Le Bail prend fin à son terme sans que le Bailleur ait à délivrer de congé.
            </P>
          </>
        )}

        <Article n={next()} title="Autres conditions particulières" rubric="Contrat type, rubrique X" />
        {t.clauses?.custom?.length ? t.clauses.custom.map((cl, i) => <Dash key={i}>{cl}</Dash>) : <P>Néant.</P>}

        <Article n={next()} title="Élection de domicile" />
        <P>
          Pour l’exécution du Bail, le Bailleur fait élection de domicile à l’adresse indiquée en tête des présentes{agent ? ' ou chez son mandataire' : ''}, et {theTenant} dans les Locaux loués. Tout changement d’adresse du
          Bailleur est notifié au Locataire.
        </P>

        <Article n={next()} title="Annexes" rubric="Contrat type, rubrique XI" />
        <P>Sont annexées au Bail et remises au Locataire les pièces suivantes :</P>
        {p.legalRegime === 'COPRO' ? (
          <Check on={Boolean(p.copro?.extractsProvided)}>Extraits du règlement de copropriété relatifs à la destination de l’immeuble, à la jouissance et à l’usage des parties privatives et communes, et à la quote-part du lot loué dans chaque catégorie de charges</Check>
        ) : null}
        <Check on>Dossier de diagnostic technique</Check>
        <Check on>Notice d’information relative aux droits et obligations des locataires et des bailleurs (arrêté du 29 mai 2015)</Check>
        <Check on>État des lieux d’entrée{furnished ? ' et inventaire détaillé du mobilier' : ''}</Check>
        {furnished ? <Check on>Liste des éléments de mobilier (ci-après)</Check> : null}
        {c.guarantors.length ? <Check on>Acte de cautionnement</Check> : null}

        {/* Signatures */}
        <View wrap={false} style={{ marginTop: 14 }}>
          {t.signature?.mode === 'ELECTRONIC' ? (
            <P>
              Fait à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, par voie électronique. Chacune des Parties
              {c.guarantors.length ? ', ainsi que la caution,' : ''} reçoit un exemplaire numérique signé, qui vaut original (articles 1366, 1367 et 1375 du Code civil).{signed?.certificate ? ' Le certificat de signature est joint en dernière page.' : ''}
            </P>
          ) : (
            <P>
              Fait à <B>{t.signature?.place || (p.city ? upper(p.city) : BLANK)}</B>, le <B>{t.signature?.date ? dateLong(t.signature.date) : BLANK}</B>, en {originalsCount(c)} originaux dont un remis à chacune des Parties
              {c.guarantors.length ? ' et un à la caution' : ''}, qui le reconnaît.
            </P>
          )}
          <SignatureBoxes
            boxes={[
              { label: agent ? 'Le Bailleur ou son mandataire' : 'Le Bailleur', name: l.kind === 'SCI' || l.kind === 'COMPANY' ? landlordName(l) : formal(l), image: signed?.landlord?.image, hint: signedHint(signed?.landlord) },
              ...tenants.map((tn, i) => ({ label: plural ? `Le Locataire ${i + 1}` : 'Le Locataire', name: formal(tn), image: signed?.tenants?.[i]?.image, hint: signedHint(signed?.tenants?.[i]) })),
            ]}
          />
        </View>

        {/* Annexe mobilier (meublé) */}
        {furnished ? (
          <View break>
            <Text style={[st.article, { marginTop: 0 }]}>Annexe – Éléments de mobilier</Text>
            <Text style={st.rubric}>Décret n° 2015-981 du 31 juillet 2015</Text>
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
