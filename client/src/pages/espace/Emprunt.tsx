import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Wizard } from '../../components/Wizard'
import { Btn, Callout, Card, ChipButton, Crumbs, Input, Line, LoadError, Loader, Money, NumberField, TextLink, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { dateNum, eurosCents } from '../../lib/format'
import { monthlyPaymentCents, type Loan, type LoansView } from '../../lib/loans'
import type { PropertyView } from '../../lib/space'

type Draft = Partial<Loan>

/**
 * Emprunt du logement. L'essentiel d'abord (ce qu'il reste chaque mois, la mensualité, ce qui se déclare cette année),
 * le tableau d'amortissement sur demande. Un emprunt s'ajoute en quatre questions.
 */
export default function Emprunt() {
  const { id = '' } = useParams()
  const toast = useToast()
  const property = useLoad(() => api<PropertyView>(`/properties/${id}`), [id])
  const view = useLoad(() => api<LoansView>(`/properties/${id}/loans`), [id])
  const [edit, setEdit] = useState<{ index: number | null; loan: Draft } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (property.error || view.error) return <AppShell><LoadError message={property.error ?? view.error ?? ''} retry={() => { property.reload(); view.reload() }} /></AppShell>
  if (!property.data || !view.data) return <AppShell><Loader /></AppShell>
  const p = property.data
  const v = view.data
  const loans = v.loans.map((l) => l.loan)

  const saveLoans = async (next: Loan[], done: string) => {
    setBusy(true)
    setError(null)
    try {
      await api(`/properties/${id}`, { method: 'PUT', body: { loans: next } })
      setEdit(null)
      toast.show(done)
      view.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  const finish = () => {
    if (!edit) return
    const l = edit.loan
    const loan: Loan = { label: l.label?.trim() || null, principalCents: l.principalCents!, ratePercent: l.ratePercent!, months: Math.round(l.months!), firstPaymentDate: l.firstPaymentDate!, insuranceMonthlyCents: l.insuranceMonthlyCents ?? null, feesCents: l.feesCents ?? null, signedAt: l.signedAt || null }
    return saveLoans(edit.index === null ? [...loans, loan] : loans.map((x, i) => (i === edit.index ? loan : x)), 'Emprunt enregistré.')
  }
  const remove = (index: number) => {
    if (!window.confirm('Retirer cet emprunt du logement ?')) return
    return saveLoans(loans.filter((_, i) => i !== index), 'Emprunt retiré.')
  }
  const start = (index: number | null, loan: Draft) => {
    setError(null)
    setEdit({ index, loan })
    window.scrollTo(0, 0)
  }

  const cf = v.cashflow
  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: p.name, to: `/espace/logements/${id}` }, { label: 'Emprunt' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Emprunt et trésorerie</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Ce que le logement vous rapporte ou vous coûte chaque mois, et ce que vous déclarez chaque année.</span>
      </div>

      {edit ? (
        <Card pad={28}>
          <LoanWizard loan={edit.loan} onChange={(loan) => setEdit({ ...edit, loan })} onFinish={finish} onCancel={() => setEdit(null)} busy={busy} error={error} editing={edit.index !== null} />
        </Card>
      ) : !loans.length ? (
        <Card pad={28}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Vous avez un crédit pour ce logement ?</h2>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, color: BAI.inkMid, lineHeight: 1.6 }}>
            <li>Bailio calcule votre mensualité et son tableau de remboursement.</li>
            <li>Il vous dit ce qu’il vous reste chaque mois, une fois le crédit payé.</li>
            <li>Il reprend les intérêts dans votre aide à la déclaration.</li>
          </ul>
          <span style={{ fontSize: 15, color: BAI.inkSoft }}>Quatre questions, avec votre offre de prêt sous la main.</span>
          <div>
            <Btn onClick={() => start(null, {})}>Ajouter mon emprunt</Btn>
          </div>
        </Card>
      ) : (
        <>
          <Card dark title="Chaque mois" style={{ gap: 12 }}>
            <Line dark label={cf.rented ? 'Loyer et charges reçus' : 'Loyer et charges prévus'} value={eurosCents(cf.rentCents + cf.chargesCents)} />
            <Line dark label="Crédit et assurance" value={`- ${eurosCents(cf.loanPaymentCents + cf.loanInsuranceCents)}`} />
            <Line dark label="Dépenses (moyenne sur 12 mois)" value={`- ${eurosCents(cf.averageExpensesCents)}`} />
            <Line dark strong border label={cf.netCents >= 0 ? 'Il vous reste' : 'Vous ajoutez de votre poche'} value={eurosCents(Math.abs(cf.netCents))} />
            <span style={{ fontSize: 13, color: BAI.surface, lineHeight: 1.5 }}>Avant impôt. Capital restant à rembourser : {eurosCents(v.now.remainingCents)}.</span>
          </Card>

          {v.loans.map((l) => (
            <LoanSummary key={l.index} l={l} year={v.thisYear.year} onEdit={() => start(l.index, l.loan)} onRemove={() => remove(l.index)} />
          ))}

          {loans.length < 5 ? (
            <div>
              <Btn variant="outline" onClick={() => start(null, {})}>
                Ajouter un autre emprunt
              </Btn>
            </div>
          ) : null}

          <Callout tone="tip" title="Pour la déclaration">
            Location vide au régime réel : les intérêts, l’assurance et les frais du prêt payés dans l’année se déclarent ligne 250 de la 2044. Bailio les reprend tout seul dans l’aide à la déclaration{v.thisYear.deductibleCents ? ` (${eurosCents(v.thisYear.deductibleCents)} pour ${v.thisYear.year})` : ''}. Au micro-foncier, rien ne se déduit : l’abattement de 30 % couvre tout.
          </Callout>
        </>
      )}
    </AppShell>
  )
}

/** Un emprunt : quatre chiffres, puis le tableau par année sur demande. */
function LoanSummary({ l, year, onEdit, onRemove }: { l: LoansView['loans'][number]; year: number; onEdit: () => void; onRemove: () => void }) {
  const [table, setTable] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const now = l.years.find((y) => y.year === year)
  return (
    <Card
      title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{l.loan.label || `Prêt de ${eurosCents(l.loan.principalCents)}`}</h2>}
      action={
        <span style={{ display: 'flex', gap: 16 }}>
          <TextLink onClick={onEdit}>Modifier</TextLink>
          <TextLink onClick={onRemove} style={{ color: BAI.error }}>
            Retirer
          </TextLink>
        </span>
      }
    >
      <div className="grid-2" style={{ gap: 12 }}>
        <Figure label="Mensualité" value={eurosCents(l.monthlyCents + (l.loan.insuranceMonthlyCents ?? 0))} sub={l.loan.insuranceMonthlyCents ? `dont ${eurosCents(l.loan.insuranceMonthlyCents)} d’assurance` : 'sans assurance indiquée'} />
        <Figure label="Dernière mensualité" value={dateNum(l.endDate)} sub={`${l.loan.months} mois à ${l.loan.ratePercent.toLocaleString('fr-FR')} %`} />
        <Figure label={`À déclarer pour ${year}`} value={eurosCents(now?.deductibleCents ?? 0)} sub="Ligne 250 de la 2044" />
        <Figure label="Coût total des intérêts" value={eurosCents(l.totalInterestCents)} sub={`pour ${eurosCents(l.loan.principalCents)} empruntés`} />
      </div>
      <div>
        <TextLink onClick={() => setTable(!table)}>{table ? 'Masquer le tableau de remboursement' : 'Voir le tableau de remboursement'}</TextLink>
      </div>
      {table ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <caption style={{ textAlign: 'left', fontSize: 14, color: BAI.inkMid, padding: '4px 0 8px' }}>Par année. Cliquez sur une année pour voir ses mensualités. Le tableau de votre banque fait foi.</caption>
            <thead>
              <tr style={{ textAlign: 'right', color: BAI.inkSoft }}>
                <th scope="col" style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>Année</th>
                <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Intérêts</th>
                <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>À déclarer</th>
                <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Capital remboursé</th>
                <th scope="col" style={{ padding: '6px 8px', fontWeight: 600 }}>Reste à rembourser</th>
              </tr>
            </thead>
            <tbody>
              {l.years.map((y) => {
                const months = l.rows.filter((r) => r.date.startsWith(`${y.year}-`))
                return [
                  <tr key={y.year} style={{ textAlign: 'right', borderTop: `1px solid ${BAI.dividerSoft}`, background: y.year === year ? BAI.bg : undefined }}>
                    <th scope="row" style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>
                      {months.length ? (
                        <button type="button" aria-expanded={open === y.year} onClick={() => setOpen(open === y.year ? null : y.year)} style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 600, color: BAI.owner, cursor: 'pointer' }}>
                          {y.year}
                        </button>
                      ) : (
                        y.year
                      )}
                    </th>
                    <td style={{ padding: '6px 8px' }}>{eurosCents(y.interestCents)}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 700 }}>{eurosCents(y.deductibleCents)}</td>
                    <td style={{ padding: '6px 8px' }}>{eurosCents(y.principalCents)}</td>
                    <td style={{ padding: '6px 8px' }}>{eurosCents(y.remainingCents)}</td>
                  </tr>,
                  ...(open === y.year
                    ? months.map((r) => (
                        <tr key={`${y.year}-${r.n}`} style={{ textAlign: 'right', color: BAI.inkMid, fontSize: 13 }}>
                          <td style={{ textAlign: 'left', padding: '4px 8px 4px 20px' }}>{dateNum(r.date)}</td>
                          <td style={{ padding: '4px 8px' }}>{eurosCents(r.interestCents)}</td>
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
      ) : null}
    </Card>
  )
}

function Figure({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: BAI.bg, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 14, color: BAI.inkMid }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>{sub}</span>
    </div>
  )
}

const YEARS = [10, 15, 20, 25]

/** Ajouter ou modifier un emprunt, une question à la fois. */
function LoanWizard({ loan, onChange, onFinish, onCancel, busy, error, editing }: { loan: Draft; onChange: (l: Draft) => void; onFinish: () => unknown; onCancel: () => void; busy: boolean; error: string | null; editing: boolean }) {
  const set = (patch: Draft) => onChange({ ...loan, ...patch })
  const monthly = loan.principalCents && loan.months && loan.ratePercent !== undefined && loan.ratePercent !== null ? monthlyPaymentCents(loan.principalCents, loan.ratePercent, loan.months) : null
  const custom = loan.months !== undefined && loan.months !== null && !YEARS.includes(loan.months / 12)
  const [other, setOther] = useState(custom)
  return (
    <Wizard
      onFinish={onFinish}
      onCancel={onCancel}
      busy={busy}
      error={error}
      finishLabel={editing ? 'Enregistrer les changements' : 'Enregistrer l’emprunt'}
      steps={[
        {
          key: 'amount',
          title: 'Combien avez-vous emprunté ?',
          note: 'Le montant et le taux figurent en première page de votre offre de prêt.',
          validate: () => (!loan.principalCents ? 'Indiquez le montant emprunté.' : loan.ratePercent === undefined || loan.ratePercent === null ? 'Indiquez le taux (0 pour un prêt à taux zéro).' : null),
          content: (
            <>
              <Money big label="Montant emprunté" cents={loan.principalCents ?? null} onChange={(c) => set({ principalCents: c ?? undefined })} />
              <NumberField big label="Taux annuel, hors assurance" value={loan.ratePercent ?? null} onChange={(n) => set({ ratePercent: n ?? undefined })} suffix="%" step="decimal" hint="Par exemple 3,45. Mettez 0 pour un prêt à taux zéro." />
            </>
          ),
        },
        {
          key: 'duration',
          title: 'Sur combien de temps ?',
          validate: () => (!loan.months ? 'Choisissez la durée du prêt.' : !loan.firstPaymentDate ? 'Indiquez la date de la première mensualité.' : null),
          content: (
            <>
              <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <legend style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, padding: 0 }}>Durée</legend>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {YEARS.map((y) => (
                    <ChipButton key={y} big pressed={!other && loan.months === y * 12} onClick={() => { setOther(false); set({ months: y * 12 }) }}>
                      {y} ans
                    </ChipButton>
                  ))}
                  <ChipButton big pressed={other} onClick={() => setOther(true)}>
                    Autre
                  </ChipButton>
                </div>
              </fieldset>
              {other ? <NumberField big label="Durée, en mois" value={loan.months ?? null} onChange={(n) => set({ months: n ?? undefined })} step="int" /> : null}
              <Input big label="Date de la première mensualité" type="date" value={loan.firstPaymentDate ?? ''} onChange={(x) => set({ firstPaymentDate: x })} hint="Sur votre tableau d’amortissement, première ligne." />
            </>
          ),
        },
        {
          key: 'extras',
          title: 'Assurance et frais du prêt',
          note: 'Facultatif, mais ils se déclarent aussi : ils baissent vos impôts au régime réel.',
          optional: true,
          content: (
            <>
              <Money big label="Assurance emprunteur, par mois (facultatif)" cents={loan.insuranceMonthlyCents ?? null} onChange={(c) => set({ insuranceMonthlyCents: c })} />
              <Money big label="Frais de dossier et de garantie (facultatif)" cents={loan.feesCents ?? null} onChange={(c) => set({ feesCents: c })} hint="Frais de dossier, caution ou hypothèque, courtier." />
            </>
          ),
        },
        {
          key: 'check',
          title: 'Vérifiez votre mensualité',
          content: (
            <>
              <div style={{ background: BAI.bg, borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 15, color: BAI.inkMid }}>Votre mensualité, hors assurance</span>
                <span style={{ fontSize: 34, fontWeight: 700 }}>{monthly !== null ? eurosCents(monthly) : '—'}</span>
                <span style={{ fontSize: 14, color: BAI.inkSoft }}>
                  {eurosCents(loan.principalCents ?? 0)} sur {loan.months} mois à {(loan.ratePercent ?? 0).toLocaleString('fr-FR')} %
                  {loan.insuranceMonthlyCents ? `, plus ${eurosCents(loan.insuranceMonthlyCents)} d’assurance` : ''}.
                </span>
              </div>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Si elle diffère de quelques centimes de celle de votre banque, c’est normal (arrondis). Si l’écart est plus grand, vérifiez le taux et la durée.</span>
              <Input label="Un nom pour ce prêt (facultatif)" value={loan.label ?? ''} onChange={(x) => set({ label: x })} placeholder="Prêt principal, prêt à taux zéro…" />
            </>
          ),
        },
      ]}
    />
  )
}
