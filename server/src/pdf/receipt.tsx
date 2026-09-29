import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import { formatDateFr, formatEuros, fullName, monthYearFr, type LeaseInput } from '../domain/lease.js'
import { BLANK, Field, Footer, H2, P, styles } from './components.js'

export interface ReceiptInput {
  lease: LeaseInput
  year: number
  month: number // 1-12
  paidOn: Date | null
}

/** Quittance de loyer (article 21 de la loi n° 89-462 du 6 juillet 1989). */
export function ReceiptDocument({ lease, year, month, paidOn }: ReceiptInput) {
  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 0))
  const total = lease.rent.rentCents + lease.rent.chargesCents
  const tenants = lease.tenants.map(fullName).join(', ')
  const period = monthYearFr(year, month)

  return (
    <Document title={`Quittance de loyer — ${period}`} author={fullName(lease.landlord)} creator="Bailio" language="fr-FR">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>QUITTANCE DE LOYER</Text>
        <Text style={[styles.subtitle, { marginBottom: 20 }]}>Période : {period}</Text>

        <View style={{ flexDirection: 'row', gap: 24, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <H2>Bailleur</H2>
            <P>{fullName(lease.landlord)}{'\n'}{lease.landlord.address}</P>
          </View>
          <View style={{ flex: 1 }}>
            <H2>Locataire{lease.tenants.length > 1 ? 's' : ''}</H2>
            <P>{tenants}{'\n'}{lease.property.address}</P>
          </View>
        </View>

        <Field label="Adresse du logement loué" value={lease.property.address} />
        <Field label="Période" value={`du ${formatDateFr(from)} au ${formatDateFr(to)}`} />

        <View style={[styles.box, { marginTop: 14 }]}>
          <Field label="Loyer hors charges" value={formatEuros(lease.rent.rentCents)} />
          <Field label="Provisions sur charges" value={formatEuros(lease.rent.chargesCents)} />
          <Field label="Total reçu" value={formatEuros(total)} />
        </View>

        <P>
          {'\n'}Je soussigné(e) {fullName(lease.landlord)}, bailleur du logement désigné ci-dessus, déclare avoir reçu
          de {tenants} la somme de {formatEuros(total)} au titre du paiement du loyer et des charges pour la période du
          {' '}{formatDateFr(from)} au {formatDateFr(to)}, et lui en donne quittance, sous réserve de tous mes droits.
        </P>
        <Field label="Date du paiement" value={paidOn ? formatDateFr(paidOn) : BLANK} />

        <P>
          {'\n'}Fait à {BLANK}, le {BLANK}.
        </P>
        <View style={[styles.signatureBox, { width: '50%', height: 90 }]}>
          <Text style={{ fontFamily: 'Helvetica-Bold' }}>Signature du bailleur</Text>
        </View>

        <Text style={{ fontSize: 8, color: '#555555', marginTop: 24, textAlign: 'justify' }}>
          Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du
          montant du présent terme. Elle est délivrée gratuitement au locataire (article 21 de la loi n° 89-462 du
          6 juillet 1989).
        </Text>

        <Footer left={`Quittance · ${period} · ${lease.property.address}`} />
      </Page>
    </Document>
  )
}

export function renderReceiptPdf(input: ReceiptInput): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument {...input} />)
}
