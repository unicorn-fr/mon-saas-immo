import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { eurosCents } from '../lib/format'
import type { LoansView } from '../lib/loans'
import { Card, Line, TextLink, useLoad } from './kit'

/** Page du logement : le crédit en cours et ce que le logement rapporte ou coûte chaque mois. */
export function LoanCard({ propertyId }: { propertyId: string }) {
  const { data } = useLoad(() => api<LoansView>(`/properties/${propertyId}/loans`), [propertyId])
  const to = `/espace/logements/${propertyId}/emprunt`
  if (!data) return null
  if (!data.loans.length)
    return (
      <Card title="Emprunt" action={<TextLink to={to} style={{ fontSize: 14 }}>Ajouter</TextLink>}>
        <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Un crédit pour ce logement ? Bailio calcule son tableau, ce que vous déclarez chaque année et ce qu’il vous reste chaque mois.</span>
      </Card>
    )
  const cf = data.cashflow
  return (
    <Card title="Emprunt et trésorerie" action={<TextLink to={to} style={{ fontSize: 14 }}>Détail</TextLink>}>
      <Line label="Mensualité et assurance" value={eurosCents(data.now.paymentCents + data.now.insuranceCents)} />
      <Line label="Capital restant dû" value={eurosCents(data.now.remainingCents)} />
      <Line label={cf.netCents >= 0 ? 'Il vous reste chaque mois' : 'Effort d’épargne par mois'} value={eurosCents(Math.abs(cf.netCents))} tone={cf.netCents >= 0 ? 'green' : 'caramel'} strong border />
    </Card>
  )
}
