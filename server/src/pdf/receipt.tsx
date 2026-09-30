import { Document, Image, Page, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { LandlordProfile, PartyName } from '../domain/contract.js'
import { formatDateFr, monthYearFr } from '../domain/lease.js'
import { eurosInWords } from '../domain/words.js'
import { landlordAddress, landlordName, personName } from './labels.js'
import { BLANK, INK, MUTED, RULE, ScriptName, s } from './theme.js'

/**
 * Quittance de loyer, reçu de paiement partiel et avis d'échéance (article 21 de la loi du 6 juillet 1989).
 * Un paiement complet donne une quittance ; un paiement partiel, un reçu, jamais une quittance.
 */
export interface ReceiptInput {
  kind: 'RECEIPT' | 'PARTIAL' | 'NOTICE'
  landlord: LandlordProfile
  tenants: PartyName[]
  propertyAddress: string
  year: number
  month: number // 1-12
  rentCents: number
  chargesCents: number
  chargesLabel: string // « Provision pour charges », « Forfait de charges »
  paidCents?: number
  paidOn?: Date | null
  dueDate?: Date | null
  /** Lieu d'émission (ville du bailleur). */
  place?: string | null
  iban?: string | null
}

const euros2 = (cents: number) =>
  `${(cents / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderTopWidth: strong ? 1.2 : 0.8, borderTopColor: strong ? INK : RULE }}>
      <Text style={{ fontSize: 10.5, fontWeight: strong ? 700 : 400 }}>{label}</Text>
      <Text style={{ fontSize: 10.5, fontWeight: strong ? 700 : 400 }}>{value}</Text>
    </View>
  )
}

export function ReceiptDocument(r: ReceiptInput) {
  const period = monthYearFr(r.year, r.month)
  const from = new Date(Date.UTC(r.year, r.month - 1, 1))
  const to = new Date(Date.UTC(r.year, r.month, 0))
  const total = r.rentCents + r.chargesCents
  const paid = r.paidCents ?? total
  const tenants = r.tenants.map((t) => personName(t)).join(' et ') || BLANK
  const landlord = landlordName(r.landlord) || BLANK
  const signer = [r.landlord.firstNames?.split(' ')[0]?.[0] ? `${r.landlord.firstNames.split(' ')[0][0]}.` : '', r.landlord.lastName].filter(Boolean).join(' ')
  const title = r.kind === 'RECEIPT' ? 'Quittance de loyer' : r.kind === 'PARTIAL' ? 'Reçu de paiement partiel' : 'Avis d’échéance'
  const periodText = `du 1er au ${to.getUTCDate()} ${monthYearFr(r.year, r.month)}`
  const place = r.place || r.landlord.city || ''
  const issued = r.kind === 'NOTICE' ? new Date() : r.paidOn ?? new Date()
  const soussigne = r.landlord.civility === 'MADAME' ? 'Je soussignée' : 'Je soussigné'

  return (
    <Document title={`${title}, ${period}`} author={landlord} creator="Bailio" language="fr-FR">
      <Page size="A4" style={s.page}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontWeight: 700 }}>{landlord}</Text>
            <Text style={{ lineHeight: 1.5, fontSize: 9.5 }}>{landlordAddress(r.landlord)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', maxWidth: '50%' }}>
            <Text style={{ fontWeight: 700, textAlign: 'right' }}>{tenants}</Text>
            <Text style={{ textAlign: 'right', lineHeight: 1.5, fontSize: 9.5 }}>{r.propertyAddress}</Text>
          </View>
        </View>

        <Text style={[s.title, { marginTop: 40, fontSize: 18 }]}>{title}</Text>
        <Text style={{ textAlign: 'center', color: MUTED, fontSize: 11, marginTop: 8, marginBottom: 26 }}>{period.replace(/^./, (c) => c.toUpperCase())}</Text>

        <View style={s.row}>
          <Text style={s.label}>Adresse du logement loué</Text>
          <Text style={s.value}>{r.propertyAddress}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.label}>Période</Text>
          <Text style={s.value}>{periodText}</Text>
        </View>
        {r.kind === 'NOTICE' ? (
          <View style={s.row}>
            <Text style={s.label}>À payer au plus tard le</Text>
            <Text style={s.value}>{r.dueDate ? formatDateFr(r.dueDate) : BLANK}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 18 }}>
          <Line label="Loyer hors charges" value={euros2(r.rentCents)} />
          <Line label={r.chargesLabel} value={euros2(r.chargesCents)} />
          {r.kind === 'PARTIAL' ? (
            <>
              <Line label="Total dû pour la période" value={euros2(total)} />
              <Line label="Montant reçu" value={euros2(paid)} strong />
              <Line label="Reste à payer" value={euros2(Math.max(0, total - paid))} />
            </>
          ) : (
            <Line label={r.kind === 'NOTICE' ? 'Total à payer' : 'Total reçu'} value={euros2(total)} strong />
          )}
        </View>

        {r.kind === 'RECEIPT' ? (
          <Text style={[s.p, { fontSize: 10.5, marginTop: 24 }]}>
            {soussigne} {landlord}, propriétaire du logement désigné ci-dessus, déclare avoir reçu de {tenants} la somme de {eurosInWords(total)} ({euros2(total)}) au titre du
            loyer et des charges pour la période {periodText}, et lui en donne quittance, sous réserve de tous mes droits.
          </Text>
        ) : r.kind === 'PARTIAL' ? (
          <Text style={[s.p, { fontSize: 10.5, marginTop: 24 }]}>
            {soussigne} {landlord}, propriétaire du logement désigné ci-dessus, déclare avoir reçu de {tenants} la somme de {eurosInWords(paid)} ({euros2(paid)}) en paiement
            partiel du loyer et des charges de la période {periodText}. Ce reçu ne vaut pas quittance : il reste {euros2(Math.max(0, total - paid))} à payer.
          </Text>
        ) : (
          <View style={{ marginTop: 24 }}>
            <Text style={[s.p, { fontSize: 10.5 }]}>
              Nous vous remercions de bien vouloir régler la somme de {euros2(total)} ({eurosInWords(total)}) pour la période {periodText}.
            </Text>
            {r.iban ? <Text style={[s.p, { fontSize: 10.5 }]}>Par virement sur le compte : {r.iban}</Text> : null}
            <Text style={[s.p, s.small]}>Cet avis ne vaut pas quittance. La quittance vous sera remise après réception du paiement.</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 }}>
          <Text style={{ fontSize: 10 }}>{r.kind === 'NOTICE' ? '' : `Paiement reçu le ${r.paidOn ? formatDateFr(r.paidOn) : BLANK}`}</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10 }}>
              Fait à {place || BLANK}, le {formatDateFr(issued)}
            </Text>
            {r.kind !== 'NOTICE' ? (
              r.landlord.signature ? <Image src={r.landlord.signature} style={{ height: 46, marginTop: 6, objectFit: 'contain' }} /> : <View style={{ marginTop: 8 }}><ScriptName>{signer || landlord}</ScriptName></View>
            ) : null}
          </View>
        </View>

        <View style={{ position: 'absolute', left: 54, right: 54, bottom: 34, borderTopWidth: 0.8, borderTopColor: RULE, paddingTop: 8 }} fixed>
          <Text style={{ fontSize: 7.8, color: MUTED, lineHeight: 1.4 }}>
            {r.kind === 'RECEIPT'
              ? 'Cette quittance annule tous les reçus qui auraient pu être établis précédemment en cas de paiement partiel du montant ci-dessus. Délivrée gratuitement (article 21 de la loi n° 89-462 du 6 juillet 1989). Document établi avec Bailio.'
              : r.kind === 'PARTIAL'
                ? 'Un paiement partiel donne lieu à un reçu ; la quittance est délivrée lorsque la totalité du loyer et des charges est payée (article 21 de la loi n° 89-462 du 6 juillet 1989). Document établi avec Bailio.'
                : 'Avis d’échéance délivré gratuitement (article 21 de la loi n° 89-462 du 6 juillet 1989). Document établi avec Bailio.'}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

export function renderReceiptPdf(input: ReceiptInput): Promise<Buffer> {
  return renderToBuffer(<ReceiptDocument {...input} />)
}
