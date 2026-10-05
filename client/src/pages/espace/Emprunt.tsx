import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { Btn, Callout, Card, Crumbs, Input, Line, LoadError, Loader, Money, NumberField, TextLink, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { dateNum, eurosCents } from '../../lib/format'
import type { Loan, LoansView } from '../../lib/loans'
import type { PropertyView } from '../../lib/space'

const EMPTY: Partial<Loan> = { label: '', ratePercent: undefined, months: undefined, firstPaymentDate: '' }

/**
 * Emprunt du logement : tableau d'amortissement estimé (taux fixe, mensualités constantes), ce qui se déclare
 * ligne 250 chaque année, et ce que le logement rapporte ou coûte chaque mois.
 */
export default function Emprunt() {
  const { id = '' } = useParams()
  const toast = useToast()
  const property = useLoad(() => api<PropertyView>(`/properties/${id}`), [id])
  const view = useLoad(() => api<LoansView>(`/properties/${id}/loans`), [id])
  const [edit, setEdit] = useState<{ index: number | null; loan: Partial<Loan> } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  if (property.error || view.error) return <AppShell><LoadError message={property.error ?? view.error ?? ''} retry={() => { property.reload(); view.reload() }} /></AppShell>
  if (!property.data || !view.data) return <AppShell><Loader /></AppShell>
  const p = property.data
  const v = view.data
  const loans = v.loans.map((l) => l.loan)

  const saveLoans = async (next: Loan[]) => {
    setBusy(true)
    try {
      await api(`/properties/${id}`, { method: 'PUT', body: { loans: next } })
      setEdit(null)
      setError(null)
      view.reload()
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return false
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!edit) return
    const l = edit.loan
    if (!l.principalCents || l.principalCents <= 0) return setError('Indiquez le montant emprunté.')
    if (l.ratePercent === undefined || l.ratePercent === null) return setError('Indiquez le taux annuel (0 pour un prêt à taux zéro).')
    if (!l.months || l.months < 1) return setError('Indiquez la durée du prêt, en mois.')
    if (!l.firstPaymentDate) return setError('Indiquez la date de la première mensualité.')
    const loan: Loan = { label: l.label?.trim() || null, principalCents: l.principalCents, ratePercent: l.ratePercent, months: Math.round(l.months), firstPaymentDate: l.firstPaymentDate, insuranceMonthlyCents: l.insuranceMonthlyCents ?? null, feesCents: l.feesCents ?? null, signedAt: l.signedAt || null }
    const next = edit.index === null ? [...loans, loan] : loans.map((x, i) => (i === edit.index ? loan : x))
    if (await saveLoans(next)) toast.show('Emprunt enregistré.')
  }

  const remove = async (index: number) => {
    if (!window.confirm('Retirer cet emprunt du logement ?')) return
    if (await saveLoans(loans.filter((_, i) => i !== index))) toast.show('Emprunt retiré.')
  }

  const cf = v.cashflow
  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: p.name, to: `/espace/logements/${id}` }, { label: 'Emprunt' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Emprunt et trésorerie</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Votre crédit mois par mois, ce que vous déclarez chaque année, et ce que le logement vous rapporte ou vous coûte chaque mois.</span>
      </div>

      {loans.length ? (
        <Card dark title="Chaque mois" style={{ gap: 12 }}>
          <Line dark label={cf.rented ? 'Loyer et charges reçus' : 'Loyer et charges prévus'} value={eurosCents(cf.rentCents + cf.chargesCents)} />
          <Line dark label="Mensualité du crédit" value={`- ${eurosCents(cf.loanPaymentCents)}`} />
          {cf.loanInsuranceCents ? <Line dark label="Assurance du crédit" value={`- ${eurosCents(cf.loanInsuranceCents)}`} /> : null}
          <Line dark label="Dépenses (moyenne des 12 derniers mois)" value={`- ${eurosCents(cf.averageExpensesCents)}`} />
          <Line dark strong border label={cf.netCents >= 0 ? 'Il vous reste' : 'Effort d’épargne'} value={eurosCents(Math.abs(cf.netCents))} />
          <span style={{ fontSize: 13, color: BAI.surface, lineHeight: 1.5 }}>Avant impôt. Capital restant dû : {eurosCents(v.now.remainingCents)}.</span>
        </Card>
      ) : null}

      {v.loans.map((l) => (
        <Card
          key={l.index}
          title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{l.loan.label || `Prêt de ${eurosCents(l.loan.principalCents)}`}</h2>}
          action={
            <span style={{ display: 'flex', gap: 16 }}>
              <TextLink onClick={() => { setError(null); setEdit({ index: l.index, loan: l.loan }) }}>Modifier</TextLink>
              <TextLink onClick={() => void remove(l.index)} style={{ color: BAI.error }}>Retirer</TextLink>
            </span>
          }
        >
          <div className="grid-2" style={{ gap: '4px 24px' }}>
            <Line label="Montant emprunté" value={eurosCents(l.loan.principalCents)} />
            <Line label="Taux hors assurance" value={`${l.loan.ratePercent.toLocaleString('fr-FR')} %`} />
            <Line label="Mensualité hors assurance" value={eurosCents(l.monthlyCents)} />
            <Line label="Assurance par mois" value={eurosCents(l.loan.insuranceMonthlyCents ?? 0)} />
            <Line label="Durée" value={`${l.loan.months} mois, du ${dateNum(l.loan.firstPaymentDate)} au ${dateNum(l.endDate)}`} />
            <Line label="Coût total des intérêts" value={eurosCents(l.totalInterestCents)} />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 }}>
              <caption style={{ textAlign: 'left', fontSize: 15, fontWeight: 700, padding: '8px 0' }}>Par année</caption>
              <thead>
                <tr style={{ textAlign: 'right', color: BAI.inkSoft }}>
                  <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Année</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Intérêts</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Assurance</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Frais</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Ligne 250</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Capital remboursé</th>
                  <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Reste dû au 31/12</th>
                </tr>
              </thead>
              <tbody>
                {l.years.map((y) => {
                  const key = `${l.index}-${y.year}`
                  const months = l.rows.filter((r) => r.date.startsWith(`${y.year}-`))
                  return [
                    <tr key={key} style={{ textAlign: 'right', borderTop: `1px solid ${BAI.dividerSoft}`, background: y.year === v.thisYear.year ? BAI.bg : undefined }}>
                      <th scope="row" style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>
                        {months.length ? (
                          <button type="button" aria-expanded={open === key} onClick={() => setOpen(open === key ? null : key)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 600, color: BAI.owner, cursor: 'pointer' }}>
                            {y.year}
                          </button>
                        ) : (
                          y.year
                        )}
                      </th>
                      <td style={{ padding: '6px 8px' }}>{eurosCents(y.interestCents)}</td>
                      <td style={{ padding: '6px 8px' }}>{eurosCents(y.insuranceCents)}</td>
                      <td style={{ padding: '6px 8px' }}>{eurosCents(y.feesCents)}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{eurosCents(y.deductibleCents)}</td>
                      <td style={{ padding: '6px 8px' }}>{eurosCents(y.principalCents)}</td>
                      <td style={{ padding: '6px 8px' }}>{eurosCents(y.remainingCents)}</td>
                    </tr>,
                    ...(open === key
                      ? months.map((r) => (
                          <tr key={`${key}-${r.n}`} style={{ textAlign: 'right', color: BAI.inkMid, fontSize: 13 }}>
                            <td style={{ textAlign: 'left', padding: '4px 8px 4px 20px' }}>{dateNum(r.date)}</td>
                            <td style={{ padding: '4px 8px' }}>{eurosCents(r.interestCents)}</td>
                            <td style={{ padding: '4px 8px' }}>{eurosCents(r.insuranceCents)}</td>
                            <td style={{ padding: '4px 8px' }}>{''}</td>
                            <td style={{ padding: '4px 8px' }}>{''}</td>
                            <td style={{ padding: '4px 8px' }}>{eurosCents(r.principalCents)}</td>
                            <td style={{ padding: '4px 8px' }}>{eurosCents(r.remainingCents)}</td>
                          </tr>
                        ))
                      : []),
                  ]
                })}
              </tbody>
            </table>
          </div>
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>Cliquez sur une année pour voir ses mensualités. Estimation à taux fixe : le tableau d’amortissement de votre banque fait foi.</span>
        </Card>
      ))}

      {edit ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{edit.index === null ? 'Nouvel emprunt' : 'Modifier l’emprunt'}</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Tout figure sur votre offre de prêt ou votre tableau d’amortissement.</span>
          <Input label="Nom (facultatif)" value={edit.loan.label ?? ''} onChange={(x) => setEdit({ ...edit, loan: { ...edit.loan, label: x } })} placeholder="Prêt principal, prêt à taux zéro…" />
          <Fields>
            <Money label="Montant emprunté" cents={edit.loan.principalCents ?? null} onChange={(c) => setEdit({ ...edit, loan: { ...edit.loan, principalCents: c ?? undefined } })} />
            <NumberField label="Taux annuel, hors assurance" value={edit.loan.ratePercent ?? null} onChange={(n) => setEdit({ ...edit, loan: { ...edit.loan, ratePercent: n ?? undefined } })} suffix="%" step="decimal" hint="0 pour un prêt à taux zéro." />
          </Fields>
          <Fields>
            <NumberField label="Durée, en mois" value={edit.loan.months ?? null} onChange={(n) => setEdit({ ...edit, loan: { ...edit.loan, months: n ?? undefined } })} step="int" hint="20 ans = 240 mois, 25 ans = 300 mois." />
            <Input label="Date de la première mensualité" type="date" value={edit.loan.firstPaymentDate ?? ''} onChange={(x) => setEdit({ ...edit, loan: { ...edit.loan, firstPaymentDate: x } })} />
          </Fields>
          <Fields>
            <Money label="Assurance emprunteur par mois (facultatif)" cents={edit.loan.insuranceMonthlyCents ?? null} onChange={(c) => setEdit({ ...edit, loan: { ...edit.loan, insuranceMonthlyCents: c } })} />
            <Money label="Frais de dossier et de garantie (facultatif)" cents={edit.loan.feesCents ?? null} onChange={(c) => setEdit({ ...edit, loan: { ...edit.loan, feesCents: c } })} hint="Dossier, caution ou hypothèque, courtage." />
          </Fields>
          <Input label="Date de signature du prêt (facultatif)" type="date" value={edit.loan.signedAt ?? ''} onChange={(x) => setEdit({ ...edit, loan: { ...edit.loan, signedAt: x || null } })} hint="Les frais se déclarent l’année où ils sont payés. Sans date, Bailio retient un mois avant la première mensualité." />
          {error ? <Callout tone="warn">{error}</Callout> : null}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <Btn onClick={() => void submit()} loading={busy} disabled={busy}>
              Enregistrer l’emprunt
            </Btn>
            <TextLink onClick={() => setEdit(null)}>Annuler</TextLink>
          </div>
        </Card>
      ) : loans.length < 5 ? (
        <div>
          <Btn variant={loans.length ? 'outline' : 'primary'} onClick={() => { setError(null); setEdit({ index: null, loan: { ...EMPTY } }) }}>
            {loans.length ? 'Ajouter un autre emprunt' : 'Ajouter un emprunt'}
          </Btn>
        </div>
      ) : null}

      <Callout tone="tip" title="Pour la déclaration">
        En location vide au régime réel, les intérêts, l’assurance emprunteur et les frais de dossier ou de garantie payés dans l’année se déduisent ligne 250 de la déclaration 2044. Bailio les reprend dans l’aide à la déclaration{v.thisYear.deductibleCents ? ` (${eurosCents(v.thisYear.deductibleCents)} pour ${v.thisYear.year})` : ''}, sauf si vous saisissez vous-même le montant de votre banque. Au micro-foncier, rien ne se déduit : l’abattement de 30 % couvre tout. En meublé au régime réel, ces sommes comptent dans les charges de l’estimation.
      </Callout>
    </AppShell>
  )
}
