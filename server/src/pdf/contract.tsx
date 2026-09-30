import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { FURNITURE_REQUIRED, MOBILITY_REASONS, type ContractInput } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import {
  contractEndDate,
  diagnosticsFor,
  firstPayment,
  landlordNoticeMonthsFor,
  leaseDurationMonths,
  maxDepositFor,
  rentRevisionAllowed,
} from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { quarterLabel } from '../lib/irl.js'
import {
  CONSTRUCTION,
  ENERGY,
  NET,
  TV,
  annexesLabel,
  commonAreasLabel,
  dateLong,
  dateShort,
  durationText,
  equipmentsLabel,
  euros,
  guarantorName,
  kindTitle,
  landlordAddress,
  landlordName,
  landlordQuality,
  originalsCount,
  personName,
  personWithBirth,
  propertyAddress,
} from './labels.js'
import { BLANK, Bullet, Check, Footer, P, Row, Section, SignatureBoxes, Sub, Table, Title, orBlank, s } from './theme.js'

/**
 * Contrat de location conforme aux contrats types du décret n° 2015-587 du 29 mai 2015
 * (annexe 1 : logement nu ; annexe 2 : logement meublé), et, pour le bail mobilité, aux mentions
 * de l'article 25-13 de la loi n° 89-462 du 6 juillet 1989. Rubriques I à XI, dans l'ordre du contrat type.
 * Une information inconnue laisse une ligne à compléter à la main.
 */
export function ContractDocument({ c }: { c: ContractInput }) {
  const t = c.terms
  const p = c.property
  const l = c.landlord
  const kind = t.kind ?? (p.furnished ? 'MEUBLE' : 'VIDE')
  const furnished = kind !== 'VIDE'
  const mobility = kind === 'MOBILITE'
  const colocation = Boolean(t.colocation) || c.tenants.length > 1
  const months = leaseDurationMonths(kind, l, t)
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const rent = t.rentCents ?? null
  const charges = t.chargesCents ?? 0
  const deposit = mobility ? 0 : t.depositCents ?? (rent !== null ? maxDepositFor(kind, rent) : null)
  const dpe = p.diagnostics?.dpe?.class
  const revisionBlocked = !rentRevisionAllowed(dpe)
  const first = t.startDate && rent !== null ? firstPayment(t.startDate, rent, charges) : null
  const version = c.version ? ` · version ${c.version.number} du ${c.version.date}` : ''
  const lastNames = c.tenants.map((x) => x.lastName).filter(Boolean).join(', ')
  const footerLeft = `Bailio · Bail ${lastNames || ''}${version}`
  const paraphs = 1 + Math.max(1, c.tenants.length)
  const agent = l.agent?.enabled ? l.agent : null
  const diags = diagnosticsFor(p)
  const chargesMode = t.chargesMode ?? (mobility ? 'FORFAIT' : 'PROVISION')
  const titleLaw = kind === 'VIDE' ? 'titre Ier' : kind === 'MOBILITE' ? 'titre Ier ter' : 'titre Ier bis'
  const showSolidarity = colocation && t.clauses?.solidarite !== false
  const showResolutoire = t.clauses?.resolutoire !== false
  // Numérotation des rubriques dans l'ordre du contrat type, sans trou quand une rubrique est sans objet.
  const order = ['parties', 'objet', 'duree', 'finance', ...(mobility ? [] : ['travaux']), 'garanties', ...(showSolidarity ? ['solidarite'] : []), ...(showResolutoire ? ['resolutoire'] : []), 'honoraires', 'conditions', 'annexes']
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
  const n = (key: string) => ROMAN[order.indexOf(key)]

  return (
    <Document title={`Contrat de location, ${p.address ?? ''}`} author={landlordName(l)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <Title
          subtitle={kindTitle(kind, colocation)}
          intro={
            mobility
              ? 'Le présent contrat de location est un bail mobilité régi par les dispositions du titre Ier ter de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs.'
              : `Soumis au ${titleLaw} de la loi n° 89-462 du 6 juillet 1989 tendant à améliorer les rapports locatifs et portant modification de la loi n° 86-1290 du 23 décembre 1986. Établi conformément au contrat type défini par le décret n° 2015-587 du 29 mai 2015 (annexe ${furnished ? '2' : '1'}).`
          }
        >
          Contrat de location
        </Title>

        <View style={s.box}>
          <Text style={{ fontSize: 7.8, textAlign: 'justify' }}>
            Le régime de droit commun en matière de baux d’habitation est défini principalement par la loi n° 89-462 du 6 juillet 1989. L’ensemble de ces
            dispositions étant d’ordre public, elles s’imposent aux parties qui, en principe, ne peuvent pas y renoncer. Le présent contrat contient les clauses
            essentielles dont la loi impose la mention ; les autres dispositions d’ordre public applicables aux baux d’habitation sont rappelées dans la notice
            d’information jointe au contrat.
          </Text>
        </View>

        {/* I. Parties */}
        <Section>{n('parties')}. Désignation des parties</Section>
        <Row label="Le bailleur">{orBlank(landlordName(l))}</Row>
        <Row label="Qualité">{landlordQuality(l)}</Row>
        {(l.kind === 'SCI' || l.kind === 'COMPANY') && l.company ? (
          <>
            {l.company.siren ? <Row label="SIREN">{l.company.siren}</Row> : null}
            <Row label="Représentée par">{orBlank([l.company.representedBy, l.company.representativeRole ? `en qualité de ${l.company.representativeRole}` : ''].filter(Boolean).join(', '))}</Row>
          </>
        ) : l.birthDate || l.birthPlace ? (
          <Row label="Né(e)">{[l.birthDate ? `le ${dateShort(l.birthDate)}` : '', l.birthPlace ? `à ${l.birthPlace}` : ''].filter(Boolean).join(' ')}</Row>
        ) : null}
        <Row label={l.kind === 'SCI' || l.kind === 'COMPANY' ? 'Siège social' : 'Domicile du bailleur'}>{orBlank(landlordAddress(l))}</Row>
        {l.email ? <Row label="Adresse électronique">{l.email}</Row> : null}
        {agent ? (
          <Row label="Représenté par le mandataire">
            {[agent.name, agent.address, agent.cardNumber ? `carte professionnelle n° ${agent.cardNumber}` : '', agent.cardIssuer ? `délivrée par ${agent.cardIssuer}` : ''].filter(Boolean).join(', ') || BLANK}
          </Row>
        ) : (
          <Row label="Mandataire">Le bailleur n’est pas représenté par un mandataire.</Row>
        )}
        <P small>désigné ci-après « le bailleur » ;</P>
        {(c.tenants.length ? c.tenants : [{}]).map((tn, i) => (
          <View key={i}>
            <Row label={c.tenants.length > 1 ? `Locataire ${i + 1}` : 'Le locataire'}>{orBlank(personWithBirth(tn))}</Row>
            {tn.email ? <Row label="Adresse électronique">{tn.email}</Row> : null}
          </View>
        ))}
        <P small>{c.tenants.length > 1 ? 'désignés ci-après « les locataires ».' : 'désigné ci-après « le locataire ».'} Il a été convenu ce qui suit :</P>

        {/* II. Objet */}
        <Section>{n('objet')}. Objet du contrat</Section>
        <P>Le présent contrat a pour objet la location d’un logement ainsi déterminé :</P>
        <Sub>A. Consistance du logement</Sub>
        <Row label="Localisation">{orBlank(propertyAddress(p))}</Row>
        {p.fiscalId ? <Row label="Identifiant fiscal">{p.fiscalId}</Row> : null}
        <Row label="Type d’habitat">{p.habitat === 'COLLECTIVE' ? 'Immeuble collectif' : p.habitat === 'INDIVIDUAL' ? 'Maison individuelle' : BLANK}</Row>
        <Row label="Régime juridique">{p.legalRegime === 'COPRO' ? `Copropriété${p.lotNumber ? `, lot n° ${p.lotNumber}` : ''}` : p.legalRegime === 'MONO' ? 'Monopropriété' : BLANK}</Row>
        <Row label="Période de construction">{p.constructionPeriod ? CONSTRUCTION[p.constructionPeriod] : BLANK}</Row>
        <Row label="Surface habitable">{p.surface ? `${String(p.surface).replace('.', ',')} m²` : BLANK}</Row>
        <Row label="Nombre de pièces principales">{orBlank(p.rooms)}</Row>
        {p.roomList?.length ? <Row label="Pièces du logement">{p.roomList.map((r) => r.name).join(', ')}</Row> : null}
        <Row label="Autres parties du logement">{annexesLabel(p) || 'Aucune'}</Row>
        <Row label="Éléments d’équipement">{equipmentsLabel(p) || BLANK}</Row>
        <Row label="Chauffage">
          {p.heating?.mode ? `${p.heating.mode === 'COLLECTIVE' ? 'Collectif' : 'Individuel'}${p.heating.energy ? `, ${ENERGY[p.heating.energy]}` : ''}${p.heating.appliance ? ` (${p.heating.appliance})` : ''}` : BLANK}
        </Row>
        {p.heating?.mode === 'COLLECTIVE' ? <Row label="Répartition du chauffage">{orBlank(p.heating.split)}</Row> : null}
        <Row label="Eau chaude sanitaire">{p.hotWater?.mode ? (p.hotWater.mode === 'COLLECTIVE' ? 'Collective' : 'Individuelle') : BLANK}</Row>
        {p.hotWater?.mode === 'COLLECTIVE' ? <Row label="Répartition de l’eau chaude">{orBlank(p.hotWater.split)}</Row> : null}
        <Row label="Performance énergétique">{dpe ? `Classe ${dpe}${p.diagnostics?.dpe?.ges ? `, émissions de gaz à effet de serre classe ${p.diagnostics.dpe.ges}` : ''}` : BLANK}</Row>
        {furnished ? <P>Le logement est loué meublé : il comporte au minimum les éléments de mobilier fixés par le décret n° 2015-981 du 31 juillet 2015, détaillés dans l’inventaire annexé au présent contrat.</P> : null}

        <Sub>B. Destination des locaux</Sub>
        <P>{p.destination === 'MIXTE' ? 'Usage mixte professionnel et d’habitation principale du locataire.' : 'Usage d’habitation exclusivement, à titre de résidence principale du locataire.'}</P>
        <Sub>C. Locaux et équipements accessoires à usage privatif du locataire</Sub>
        <P>{annexesLabel(p) || 'Néant.'}</P>
        <Sub>D. Locaux, parties, équipements et accessoires de l’immeuble à usage commun</Sub>
        <P>{p.habitat === 'COLLECTIVE' ? commonAreasLabel(p) || 'Néant.' : 'Sans objet (maison individuelle).'}</P>
        <Sub>E. Équipement d’accès aux technologies de l’information et de la communication</Sub>
        <P>{[p.tv ? `Réception de la télévision : ${TV[p.tv].toLowerCase()}` : '', p.internet ? `accès à internet : ${NET[p.internet]}` : ''].filter(Boolean).join(' ; ') || BLANK}</P>

        {/* III. Durée */}
        <Section>{n('duree')}. Date de prise d’effet et durée du contrat</Section>
        <Row label="Date de prise d’effet">{t.startDate ? dateLong(t.startDate) : BLANK}</Row>
        <Row label="Durée du contrat">{`${durationText(months)}${end ? `, soit jusqu’au ${formatDateFr(end)}` : ''}`}</Row>
        {mobility ? (
          <>
            <Row label="Motif du bail mobilité">{t.mobilityReason ? `Le locataire justifie, à la date de prise d’effet du bail, être en ${MOBILITY_REASONS[t.mobilityReason as keyof typeof MOBILITY_REASONS]}.` : BLANK}</Row>
            <P>Le bail mobilité est conclu pour une durée minimale d’un mois et maximale de dix mois, non renouvelable et non reconductible. La durée peut être modifiée une fois par avenant, sans que la durée totale n’excède dix mois. Le locataire peut résilier le contrat à tout moment, en respectant un délai de préavis d’un mois.</P>
          </>
        ) : kind === 'ETUDIANT' ? (
          <P>Le locataire étant étudiant, le bail est conclu pour une durée de neuf mois. Il n’est pas reconduit tacitement : à défaut d’accord des parties pour le reconduire, il prend fin à son terme.</P>
        ) : (
          <P>
            En l’absence de proposition de renouvellement du contrat, celui-ci est, à son terme, reconduit tacitement pour une durée de {durationText(kind === 'MEUBLE' ? 12 : months > 36 ? 72 : 36)} et dans les mêmes conditions.
            Le locataire peut mettre fin au bail à tout moment, après avoir donné congé dans les conditions de forme et de délai prévues par la loi. Le bailleur peut mettre fin
            au bail à son échéance, en donnant congé {landlordNoticeMonthsFor(kind)} mois avant, soit pour reprendre le logement en vue de l’occuper lui-même ou une personne de sa
            famille, soit pour le vendre, soit pour un motif sérieux et légitime.
          </P>
        )}
        {t.reduced?.enabled && kind === 'VIDE' ? (
          <Row label="Durée réduite : événement et raisons">{orBlank(t.reduced.reason)}</Row>
        ) : null}

        {/* IV. Conditions financières */}
        <Section>{n('finance')}. Conditions financières</Section>
        <Text style={s.p}>Les parties conviennent des conditions financières suivantes :</Text>
        <Sub>A. Loyer</Sub>
        <Text style={[s.p, { fontWeight: 600 }]}>1° Fixation du loyer initial</Text>
        <Row label="a) Montant du loyer mensuel">{rent !== null ? `${euros(rent)} hors charges (${eurosInWords(rent)})` : BLANK}</Row>
        <Row label="b) Zone de tension du marché locatif">
          {t.zone?.tense === true ? 'Oui : le loyer est soumis au décret fixant annuellement le montant maximum d’évolution des loyers à la relocation.' : t.zone?.tense === false ? 'Non : le logement n’est pas situé en zone tendue.' : BLANK}
        </Row>
        <Row label="Encadrement des loyers (loyer de référence majoré)">{t.zone?.control ? 'Oui' : t.zone?.control === false ? 'Non' : BLANK}</Row>
        {t.zone?.control ? (
          <>
            <Row label="Loyer de référence">{t.zone.refRentCentsM2 ? `${euros(t.zone.refRentCentsM2)} par m²` : BLANK}</Row>
            <Row label="Loyer de référence majoré">{t.zone.refRentMaxCentsM2 ? `${euros(t.zone.refRentMaxCentsM2)} par m²` : BLANK}</Row>
            <Row label="Complément de loyer">{t.zone.complementCents ? `${euros(t.zone.complementCents)} : ${orBlank(t.zone.complementJustification)}` : 'Aucun'}</Row>
          </>
        ) : null}
        <Row label="c) Loyer du dernier locataire">
          {t.previous?.rentedWithin18Months === false
            ? 'Sans objet : le logement n’a pas été loué dans les dix-huit mois précédant la signature du contrat.'
            : t.previous?.rentedWithin18Months
              ? `Dernier loyer acquitté : ${orBlank(euros(t.previous.lastRentCents))}, versé le ${orBlank(dateShort(t.previous.lastPaymentDate))}, dernière révision le ${orBlank(dateShort(t.previous.lastRevisionDate))}`
              : BLANK}
        </Row>
        <Text style={[s.p, { fontWeight: 600, marginTop: 6 }]}>2° Modalités de révision</Text>
        {mobility ? (
          <P>Le loyer ne peut pas être révisé en cours de bail (article 25-16 de la loi du 6 juillet 1989).</P>
        ) : revisionBlocked ? (
          <P>Le logement étant classé {dpe} au diagnostic de performance énergétique, le loyer ne peut pas être révisé (article 17-1 de la loi du 6 juillet 1989).</P>
        ) : t.revision?.enabled === false ? (
          <P>Le loyer n’est pas révisable en cours de bail.</P>
        ) : (
          <>
            <Row label="a) Date de révision">{t.revision?.date ? `Chaque année le ${dateLong(`2000-${t.revision.date}`).replace(' 2000', '')}` : 'À la date anniversaire du contrat'}</Row>
            <Row label="b) Trimestre de référence de l’IRL">{t.revision?.irlQuarter ? `${quarterLabel(t.revision.irlQuarter)}${t.revision.irlValue ? ` (valeur ${String(t.revision.irlValue).replace('.', ',')})` : ''}` : BLANK}</Row>
            <P small>Le loyer est révisé une fois par an, dans la limite de la variation de l’indice de référence des loyers publié par l’INSEE (article 17-1).</P>
          </>
        )}

        <Sub>B. Charges récupérables</Sub>
        <Row label="1. Modalité de règlement">
          {chargesMode === 'FORFAIT' ? 'Forfait de charges' : chargesMode === 'PERIODIC' ? 'Paiement périodique des charges sans provision' : 'Provisions sur charges avec régularisation annuelle'}
        </Row>
        <Row label={chargesMode === 'FORFAIT' ? '2. Montant du forfait mensuel' : '2. Montant des provisions mensuelles'}>{t.chargesCents !== undefined && t.chargesCents !== null ? euros(charges) : BLANK}</Row>
        {chargesMode === 'FORFAIT' ? (
          <P small>
            {mobility
              ? 'Le forfait de charges est fixé pour toute la durée du bail et ne donne lieu à aucun complément ni régularisation (article 25-16).'
              : 'Le forfait est révisé chaque année dans les mêmes conditions que le loyer ; il ne donne pas lieu à régularisation.'}
          </P>
        ) : null}

        {kind === 'VIDE' ? (
          <>
            <Sub>C. Contribution pour le partage des économies de charges</Sub>
            <P>{t.works?.energyContribution?.enabled ? `${euros(t.works.energyContribution.monthlyCents)} par mois. Travaux : ${orBlank(t.works.energyContribution.description)}.` : 'Sans objet.'}</P>
          </>
        ) : null}
        {colocation ? (
          <>
            <Sub>{kind === 'VIDE' ? 'D' : 'C'}. Assurance souscrite par le bailleur pour le compte des colocataires</Sub>
            <P>Sans objet : chaque colocataire justifie de sa propre assurance contre les risques locatifs.</P>
          </>
        ) : null}

        <Sub>{kind === 'VIDE' ? (colocation ? 'E' : 'D') : colocation ? 'D' : 'C'}. Modalités de paiement</Sub>
        <Row label="Périodicité">Mensuelle</Row>
        <Row label="Paiement">{t.paymentTerm === 'ARREARS' ? 'À terme échu (en fin de période)' : 'À échoir (en début de période)'}</Row>
        <Row label="Date de paiement">{t.paymentDay ? `Le ${t.paymentDay === 1 ? '1er' : t.paymentDay} de chaque mois` : BLANK}</Row>
        <Row label="Mode de paiement">{{ TRANSFER: 'Virement bancaire', CHEQUE: 'Chèque', CASH: 'Espèces, contre reçu', OTHER: orBlank(t.paymentPlace) }[t.paymentMethod ?? 'TRANSFER']}</Row>
        {t.paymentPlace && t.paymentMethod !== 'OTHER' ? <Row label="Lieu de paiement">{t.paymentPlace}</Row> : null}
        <Text style={[s.p, { marginTop: 6 }]}>Montant total dû à la première échéance de paiement pour une période complète de location :</Text>
        <Table
          columns={['Détail', 'Montant']}
          widths={[70, 30]}
          rows={[
            ['Loyer hors charges', rent !== null ? euros(rent) : ''],
            [chargesMode === 'FORFAIT' ? 'Forfait de charges' : 'Provisions sur charges', euros(charges)],
            ...(t.works?.energyContribution?.enabled ? [['Contribution au partage des économies de charges', euros(t.works.energyContribution.monthlyCents)]] : []),
            ['Total', rent !== null ? euros(rent + charges + (t.works?.energyContribution?.enabled ? t.works.energyContribution.monthlyCents ?? 0 : 0)) : ''],
          ]}
        />
        {first && !first.fullMonth ? (
          <P small>
            Entrée en cours de mois : pour la première période ({first.days} jours sur {first.daysInMonth}), le montant dû est de {euros(first.rentCents)} de loyer et {euros(first.chargesCents)} de charges, soit {euros(first.rentCents + first.chargesCents)}.
          </P>
        ) : null}

        {/* V. Travaux */}
        {!mobility ? (
          <>
            <Section>{n('travaux')}. Travaux</Section>
            <Row label="A. Travaux d’amélioration ou de mise en conformité depuis le dernier contrat">{t.works?.sinceLast || 'Néant.'}</Row>
            <Row label="B. Majoration du loyer consécutive à des travaux du bailleur">{revisionBlocked ? 'Sans objet : logement classé F ou G.' : t.works?.increase || 'Néant.'}</Row>
            <Row label="C. Diminution du loyer consécutive à des travaux du locataire">{t.works?.decrease || 'Néant.'}</Row>
          </>
        ) : null}

        {/* VI. Garanties */}
        <Section>{n('garanties')}. Garanties</Section>
        {mobility ? (
          <P>Aucun dépôt de garantie ne peut être exigé dans le cadre d’un bail mobilité (article 25-17 de la loi du 6 juillet 1989).</P>
        ) : (
          <>
            <Row label="Dépôt de garantie">{deposit !== null ? `${euros(deposit)} (${eurosInWords(deposit)})` : BLANK}</Row>
            <P>
              Le dépôt de garantie ne peut excéder {kind === 'VIDE' ? 'un mois' : 'deux mois'} de loyer en principal, hors charges. Il est restitué dans un délai maximal d’un mois à compter de la remise des
              clés par le locataire lorsque l’état des lieux de sortie est conforme à l’état des lieux d’entrée, et de deux mois dans le cas contraire, déduction faite, le cas
              échéant, des sommes restant dues au bailleur et des sommes dont celui-ci pourrait être tenu en lieu et place du locataire, sous réserve qu’elles soient dûment justifiées.
            </P>
          </>
        )}
        {c.guarantors.length ? (
          <P>
            Cautionnement : {c.guarantors.map((g) => `${guarantorName(g) || BLANK}, caution ${g.engagement === 'SIMPLE' ? 'simple' : 'solidaire'}`).join(' ; ')}. L’acte de cautionnement est annexé au présent contrat et un exemplaire de ce
            contrat est remis à la caution.
          </P>
        ) : null}

        {/* VII. Solidarité */}
        {showSolidarity ? (
          <>
            <Section>{n('solidarite')}. Clause de solidarité</Section>
            <P>
              Les colocataires sont tenus solidairement et indivisiblement de l’ensemble des obligations résultant du présent contrat, notamment du paiement du loyer et des charges.
              La solidarité d’un colocataire qui donne congé prend fin à la date d’effet de son congé lorsqu’un nouveau colocataire figure au bail, et au plus tard à l’expiration
              d’un délai de six mois après la date d’effet de ce congé ; il en va de même pour la personne qui s’est portée caution pour lui (article 8-1 de la loi du 6 juillet 1989).
            </P>
          </>
        ) : null}

        {/* VIII. Clause résolutoire */}
        {showResolutoire ? (
          <>
            <Section>{n('resolutoire')}. Clause résolutoire</Section>
            <P>Le présent contrat sera résilié immédiatement et de plein droit, sans qu’il soit besoin de faire ordonner cette résolution en justice :</P>
            <Bullet>six semaines après un commandement de payer demeuré infructueux, à défaut de paiement aux termes convenus de tout ou partie du loyer et des charges dûment justifiées{mobility ? '' : ', ou en cas de non-versement du dépôt de garantie'} ;</Bullet>
            <Bullet>un mois après un commandement demeuré infructueux, à défaut d’assurance du locataire contre les risques locatifs ;</Bullet>
            <Bullet>en cas de manquement du locataire à l’obligation d’user paisiblement des locaux loués, résultant de troubles de voisinage constatés par une décision de justice passée en force de chose jugée.</Bullet>
          </>
        ) : null}

        {/* IX. Honoraires */}
        <Section>{n('honoraires')}. Honoraires de location</Section>
        {agent ? (
          <>
            <P>
              Les honoraires de l’intermédiaire liés à la visite, à la constitution du dossier et à la rédaction du bail, ainsi qu’à l’établissement de l’état des lieux, sont
              partagés entre le bailleur et le locataire. La part du locataire ne peut excéder celle du bailleur ni les plafonds fixés par le décret n° 2014-890 du 1er août 2014.
            </P>
            <Row label="À la charge du locataire">{`${orBlank(euros(t.fees?.tenantVisitFileCents))} (visite, dossier, bail) et ${orBlank(euros(t.fees?.tenantInventoryCents))} (état des lieux)`}</Row>
            <Row label="À la charge du bailleur">{orBlank(euros(t.fees?.landlordCents))}</Row>
          </>
        ) : (
          <P>Néant. Le présent contrat est conclu directement entre le bailleur et le locataire, sans intermédiaire.</P>
        )}

        {/* X. Conditions particulières */}
        <Section>{n('conditions')}. Autres conditions particulières</Section>
        {t.clauses?.custom?.length ? t.clauses.custom.map((cl, i) => <Bullet key={i}>{cl}</Bullet>) : <P>Néant.</P>}

        {/* XI. Annexes */}
        <Section>{n('annexes')}. Annexes</Section>
        <P>Sont annexées et jointes au contrat de location les pièces suivantes :</P>
        {p.legalRegime === 'COPRO' ? <Check on={Boolean(p.copro?.extractsProvided)}>Extraits du règlement de copropriété relatifs à la destination de l’immeuble, à la jouissance et à l’usage des parties privatives et communes, et à la quote-part afférente au lot loué dans chacune des catégories de charges</Check> : null}
        <Check on>
          Dossier de diagnostic technique : {diags.filter((d) => d.required && d.annexed).map((d) => d.label.replace(/^./, (x) => x.toLowerCase()).replace('(dpe)', '(DPE)').replace('(crep)', '(CREP)')).join(', ')}
          {diags.find((d) => d.key === 'asbestos')?.required ? ' ; le repérage de l’amiante dans les parties privatives est tenu à la disposition du locataire' : ''}
        </Check>
        <Check on>Notice d’information relative aux droits et obligations des locataires et des bailleurs (arrêté du 29 mai 2015 modifié)</Check>
        <Check on>État des lieux d’entrée{furnished ? ' et inventaire détaillé du mobilier' : ''}, établi lors de la remise des clés</Check>
        {c.guarantors.length ? <Check on>Acte de cautionnement</Check> : null}
        {furnished ? <Check on>Liste des éléments de mobilier (ci-après)</Check> : null}

        {/* Signatures */}
        <View wrap={false}>
          <P>
            Fait à {t.signature?.place || BLANK}, le {t.signature?.date ? dateLong(t.signature.date) : BLANK}, en {originalsCount(c)} originaux dont un remis à chaque signataire
            {c.guarantors.length ? ' et un à la caution' : ''}.
          </P>
          <SignatureBoxes
            boxes={[
              { label: agent ? 'Signature du bailleur ou de son mandataire' : 'Signature du bailleur', name: landlordName(l), hint: 'Précédée de la mention « lu et approuvé »' },
              ...(c.tenants.length ? c.tenants : [{}]).map((tn, i) => ({ label: c.tenants.length > 1 ? `Signature du locataire ${i + 1}` : 'Signature du locataire', name: personName(tn), hint: 'Précédée de la mention « lu et approuvé »' })),
            ]}
          />
        </View>

        {/* Annexe mobilier (meublé) */}
        {furnished ? (
          <View break>
            <Section>Annexe : éléments de mobilier du logement</Section>
            <P>Éléments exigés par le décret n° 2015-981 du 31 juillet 2015, présents dans le logement :</P>
            {Object.entries(FURNITURE_REQUIRED).map(([k, label]) => (
              <Check key={k} on={Boolean(p.furniture?.present?.includes(k as keyof typeof FURNITURE_REQUIRED))}>
                {label}
              </Check>
            ))}
            {p.furniture?.inventory?.length ? (
              <>
                <Sub>Inventaire détaillé</Sub>
                <Table columns={['Pièce', 'Élément', 'Nombre', 'État']} widths={[24, 46, 12, 18]} rows={p.furniture.inventory.map((i) => [i.room, i.item, i.count, i.state])} />
              </>
            ) : (
              <P small>L’inventaire détaillé et l’état de chaque élément sont établis avec l’état des lieux d’entrée.</P>
            )}
          </View>
        ) : null}

        <Footer left={footerLeft} paraphs={paraphs} />
      </Page>
    </Document>
  )
}

export function renderContractPdf(c: ContractInput): Promise<Buffer> {
  return renderToBuffer(<ContractDocument c={c} />)
}

/** Libellé court du trimestre, réexporté pour les écrans. */
export { quarterLabel }
export const tenantsLabelFor = (n: number) => (n > 1 ? 'Les locataires' : 'Le locataire')
