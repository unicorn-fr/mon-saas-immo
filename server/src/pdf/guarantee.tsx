import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { ContractInput, Guarantor } from '../domain/contract.js'
import { formatDateFr } from '../domain/lease.js'
import { contractEndDate, leaseDurationMonths, rentRevisionAllowed } from '../domain/rules.js'
import { eurosInWords } from '../domain/words.js'
import { quarterLabel } from '../lib/irl.js'
import { dateLong, durationText, euros, guarantorName, landlordAddress, landlordName, personName, personWithBirth, propertyAddress } from './labels.js'
import { CertificatePage, type CertificateData } from './certificate.js'
import type { SignatureMark } from './contract.js'
import { BLANK, Footer, P, RULE, Row, Section, SignatureBoxes, Title, orBlank, s } from './theme.js'

/**
 * Acte de cautionnement d'un bail d'habitation (article 22-1 de la loi n° 89-462 du 6 juillet 1989
 * et article 2297 du Code civil). À peine de nullité : montant du loyer et conditions de révision,
 * mention apposée par la caution elle-même, reproduction de l'avant-dernier alinéa de l'article 22-1,
 * remise d'un exemplaire du bail à la caution.
 */
/** Mention de l'article 2297 du Code civil, que la caution recopie elle-même. */
export function cautionMention(c: ContractInput, g: Guarantor): string {
  const tenants = c.tenants.map((x) => personName(x)).join(' et ') || BLANK
  const landlord = landlordName(c.landlord) || BLANK
  const solidaire = g.engagement !== 'SIMPLE'
  const cap = g.maxCents ?? null
  const durationLabel = g.duration === 'OPEN' ? 'une durée indéterminée' : g.until ? `une durée déterminée, jusqu’au ${dateLong(g.until)}` : BLANK
  return `Je m’engage, en qualité de caution${solidaire ? ' solidaire' : ''}, à payer à ${landlord} ce que lui doit ${tenants} en cas de défaillance de celui-ci, au titre du bail du logement situé ${propertyAddress(c.property) || BLANK} (loyers, charges, réparations locatives, indemnités d’occupation et frais), dans la limite de la somme de ${cap !== null ? `${eurosInWords(cap)} (${euros(cap)})` : BLANK} couvrant le paiement du principal et des accessoires, pour ${durationLabel}.${solidaire ? ' Je reconnais ne pouvoir exiger du bailleur qu’il poursuive d’abord le locataire ou qu’il divise ses poursuites entre les cautions.' : ''}`
}

export function GuaranteeDocument({ c, g, signed }: { c: ContractInput; g: Guarantor; signed?: { guarantor?: SignatureMark; landlord?: SignatureMark; certificate?: CertificateData } }) {
  const t = c.terms
  const kind = t.kind ?? 'VIDE'
  const months = leaseDurationMonths(kind, c.landlord, t)
  const end = t.startDate ? contractEndDate(t.startDate, months) : null
  const tenants = c.tenants.map((x) => personName(x)).join(' et ') || BLANK
  const landlord = landlordName(c.landlord) || BLANK
  const solidaire = g.engagement !== 'SIMPLE'
  const revisable = kind !== 'MOBILITE' && t.revision?.enabled !== false && rentRevisionAllowed(c.property.diagnostics?.dpe?.class)
  const cap = g.maxCents ?? null
  const durationLabel = g.duration === 'OPEN' ? 'une durée indéterminée' : g.until ? `une durée déterminée, jusqu’au ${dateLong(g.until)}` : BLANK
  const mention = cautionMention(c, g)

  return (
    <Document title={`Acte de cautionnement, ${guarantorName(g)}`} author={landlord} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <Title subtitle={`${solidaire ? 'Caution solidaire' : 'Caution simple'} d’un bail d’habitation`} intro="Article 22-1 de la loi n° 89-462 du 6 juillet 1989 et article 2297 du Code civil">
          Acte de cautionnement
        </Title>

        <Section>La caution</Section>
        <Row label="Identité">{orBlank(personWithBirth(g))}</Row>
        <Row label="Adresse">{orBlank(g.address)}</Row>
        {g.link ? <Row label="Lien avec le locataire">{g.link}</Row> : null}
        {g.email ? <Row label="Adresse électronique">{g.email}</Row> : null}

        <Section>Le bail garanti</Section>
        <Row label="Bailleur">{`${landlord}, ${landlordAddress(c.landlord) || BLANK}`}</Row>
        <Row label={c.tenants.length > 1 ? 'Locataires' : 'Locataire'}>{tenants}</Row>
        <Row label="Logement">{orBlank(propertyAddress(c.property))}</Row>
        <Row label="Prise d’effet et durée">{t.startDate ? `${dateLong(t.startDate)}, pour ${durationText(months)}${end ? ` (jusqu’au ${formatDateFr(end)})` : ''}` : BLANK}</Row>
        <Row label="Montant du loyer">
          {t.rentCents !== undefined && t.rentCents !== null ? `${euros(t.rentCents)} par mois hors charges (${eurosInWords(t.rentCents)}), plus ${euros(t.chargesCents ?? 0)} de charges` : BLANK}
        </Row>
        <Row label="Conditions de révision du loyer">
          {revisable
            ? `Révisé chaque année ${t.revision?.date ? `le ${dateLong(`2000-${t.revision.date}`).replace(' 2000', '')}` : 'à la date anniversaire du bail'}, selon la variation de l’indice de référence des loyers publié par l’INSEE (trimestre de référence : ${t.revision?.irlQuarter ? quarterLabel(t.revision.irlQuarter) : BLANK}).`
            : 'Le loyer n’est pas révisable en cours de bail.'}
        </Row>

        <Section>L’engagement</Section>
        <Row label="Nature">{solidaire ? 'Caution solidaire : le bailleur peut réclamer à la caution dès le premier impayé, sans poursuivre d’abord le locataire.' : 'Caution simple : le bailleur doit d’abord poursuivre le locataire.'}</Row>
        <Row label="Durée">{g.duration === 'OPEN' ? 'Indéterminée' : g.until ? `Jusqu’au ${dateLong(g.until)}` : BLANK}</Row>
        <Row label="Montant maximum garanti">{cap !== null ? `${euros(cap)} (${eurosInWords(cap)}), principal et accessoires` : BLANK}</Row>

        <Section>Mention apposée par la caution</Section>
        <P>La caution appose elle-même, à la main ou électroniquement, la mention suivante (article 2297 du Code civil) :</P>
        <View style={[s.box, { backgroundColor: '#ffffff' }]}>
          <Text style={{ fontSize: 9.5, lineHeight: 1.5, fontStyle: 'italic', textAlign: 'justify' }}>« {mention} »</Text>
        </View>
        {signed?.guarantor?.mention ? (
          <>
            <P small>Mention recopiée par la caution lors de la signature électronique :</P>
            <View style={[s.box, { backgroundColor: '#ffffff' }]}>
              <Text style={{ fontSize: 9.5, lineHeight: 1.5, textAlign: 'justify' }}>{signed.guarantor.mention}</Text>
            </View>
          </>
        ) : (
          <>
            <P small>Espace réservé à la mention écrite par la caution :</P>
            {Array.from({ length: 6 }, (_, i) => (
              <View key={i} style={{ height: 20, borderBottomWidth: 0.8, borderBottomColor: RULE }} />
            ))}
          </>
        )}

        <Section>Reproduction de l’avant-dernier alinéa de l’article 22-1</Section>
        <View style={s.box}>
          <Text style={{ fontSize: 8.8, lineHeight: 1.5, textAlign: 'justify' }}>
            « Lorsque le cautionnement d’obligations résultant d’un contrat de location conclu en application du présent titre ne comporte aucune indication de durée ou
            lorsque la durée du cautionnement est stipulée indéterminée, la caution peut le résilier unilatéralement. La résiliation prend effet au terme du contrat de
            location, qu’il s’agisse du contrat initial ou d’un contrat reconduit ou renouvelé, au cours duquel le bailleur reçoit notification de la résiliation. »
          </Text>
        </View>

        <P>La caution reconnaît avoir reçu un exemplaire du contrat de location.</P>
        <View wrap={false}>
          <P>
            Fait à {t.signature?.place || BLANK}, le {t.signature?.date ? dateLong(t.signature.date) : BLANK}, en deux exemplaires.
          </P>
          <SignatureBoxes
            boxes={[
              { label: 'Signature de la caution', name: guarantorName(g), image: signed?.guarantor?.image, hint: signed?.guarantor ? `Signé électroniquement le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Europe/Paris' }).format(new Date(signed.guarantor.signedAt))}` : 'Après la mention ci-dessus' },
              { label: 'Signature du bailleur', name: landlord, image: signed?.landlord?.image },
            ]}
          />
        </View>
        <Footer left={`Bailio · Acte de caution ${g.lastName ?? ''}${signed?.certificate ? ` · signé électroniquement, réf. ${signed.certificate.requestId.slice(0, 8)}` : ''}`} />
      </Page>
      {signed?.certificate ? <CertificatePage data={signed.certificate} /> : null}
    </Document>
  )
}

export function renderGuaranteePdf(c: ContractInput, g: Guarantor, signed?: { guarantor?: SignatureMark; landlord?: SignatureMark; certificate?: CertificateData }): Promise<Buffer> {
  return renderToBuffer(<GuaranteeDocument c={c} g={g} signed={signed} />)
}
