import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { StepNav, TunnelLayout } from '../../components/TunnelLayout'
import { TextField, display, inputStyle } from '../../components/ui'
import { useDraft } from '../../lib/draft'
import { centsToInput, dateFr, durationLabel, endDate, euros, maxDepositCents, maxDepositLabel, parseEuros } from '../../lib/lease'

function CalcRow({ label, value, note }: { label: string; value: ReactNode; note: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0', borderTop: `1px solid ${BAI.nightLine}`, gap: 16 }}>
      <span style={{ fontSize: 15, color: BAI.onDarkMuted }}>{label}</span>
      <span className="stack" style={{ alignItems: 'flex-end', gap: 2, textAlign: 'right' }}>
        <span style={{ fontSize: 17, fontWeight: 600, color: BAI.surface }}>{value}</span>
        <span style={{ fontSize: 13, color: BAI.onDarkMuted }}>{note}</span>
      </span>
    </div>
  )
}

const small = { ...inputStyle(), height: 44, fontSize: 16, width: 120, padding: '0 12px' }
const editLink = { background: 'none', border: 'none', padding: 0, color: BAI.caramel, fontWeight: 600, fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 } as const

export default function LoyerStep() {
  const { data, update, flush } = useDraft()
  const navigate = useNavigate()
  const type = data.type ?? 'UNFURNISHED'
  const r = data.rent ?? {}
  const [rent, setRent] = useState(centsToInput(r.rentCents))
  const [charges, setCharges] = useState(centsToInput(r.chargesCents))
  const [startDate, setStartDate] = useState(r.startDate ?? '')
  const [paymentDay, setPaymentDay] = useState(r.paymentDay ?? 5)
  const [deposit, setDeposit] = useState<string>(r.depositCents !== undefined ? centsToInput(r.depositCents) : '')
  const [editDeposit, setEditDeposit] = useState(false)
  const [editDay, setEditDay] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data.type) navigate('/commencer', { replace: true })
  }, [data.type, navigate])

  const rentCents = parseEuros(rent)
  const chargesCents = parseEuros(charges) ?? 0
  const maxDeposit = rentCents ? maxDepositCents(type, rentCents) : undefined
  const depositCents = deposit.trim() ? parseEuros(deposit) : maxDeposit
  const depositTooHigh = depositCents !== undefined && maxDeposit !== undefined && depositCents > maxDeposit

  // Enregistrement automatique des montants saisis (pas au premier affichage).
  const mounted = useRef(false)
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    update((prev) => ({
      rent: { ...prev.rent, rentCents, chargesCents, startDate: startDate || undefined, paymentDay, depositCents: deposit.trim() ? parseEuros(deposit) : undefined },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rent, charges, startDate, paymentDay, deposit])

  async function next() {
    const e: Record<string, string> = {}
    if (!rentCents) e.rent = 'Indiquez le loyer hors charges.'
    if (parseEuros(charges) === undefined && charges.trim()) e.charges = 'Montant invalide.'
    if (!startDate) e.startDate = "Indiquez la date d'entrée du locataire."
    if (depositTooHigh) e.deposit = `Le dépôt de garantie ne peut pas dépasser ${euros(maxDeposit)}.`
    setErrors(e)
    if (Object.keys(e).length) return
    update((prev) => ({ rent: { ...prev.rent, rentCents, chargesCents, startDate, paymentDay } }), 'relecture')
    await flush()
    navigate('/commencer/relecture')
  }

  return (
    <TunnelLayout step="loyer">
      <h1 style={display('clamp(40px, 5vw, 56px)')}>Quel est le loyer ?</h1>
      <div className="col-md" style={{ display: 'flex', gap: 16 }}>
        <TextField label="Loyer hors charges" name="rent" inputMode="decimal" suffix="€" value={rent} error={errors.rent} onChange={(e) => setRent(e.target.value.replace(/[^\d,.\s]/g, ''))} />
        <TextField label="Charges" name="charges" inputMode="decimal" suffix="€" value={charges} error={errors.charges} placeholder="0" onChange={(e) => setCharges(e.target.value.replace(/[^\d,.\s]/g, ''))} />
      </div>
      <TextField label="Date d'entrée du locataire" name="startDate" type="date" value={startDate} error={errors.startDate} onChange={(e) => setStartDate(e.target.value)} />

      <div className="stack" style={{ background: BAI.night, borderRadius: 20, padding: '24px 26px 10px' }} aria-live="polite">
        <span style={{ fontSize: 15, fontWeight: 700, color: BAI.caramel, paddingBottom: 12 }}>Calculé pour vous</span>
        <CalcRow label="Total par mois" value={rentCents ? euros(rentCents + chargesCents) : '—'} note="Loyer et charges" />
        <CalcRow
          label="Dépôt de garantie"
          value={
            editDeposit ? (
              <input
                aria-label="Montant du dépôt de garantie"
                inputMode="decimal"
                autoFocus
                value={deposit}
                placeholder={centsToInput(maxDeposit)}
                onChange={(e) => setDeposit(e.target.value.replace(/[^\d,.\s]/g, ''))}
                onBlur={() => setEditDeposit(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setEditDeposit(false)
                }}
                style={small}
              />
            ) : depositCents !== undefined ? (
              euros(depositCents)
            ) : (
              '—'
            )
          }
          note={
            <>
              {depositTooHigh ? (
                <span style={{ color: BAI.caramel }}>Au-dessus du maximum légal ({euros(maxDeposit)})</span>
              ) : deposit.trim() && depositCents !== maxDeposit ? (
                `Maximum légal : ${euros(maxDeposit)}`
              ) : (
                `Le maximum légal : ${maxDepositLabel(type)}`
              )}
              {' · '}
              <button
                type="button"
                style={editLink}
                onClick={() => {
                  // On repart du montant affiché, modifiable autant de fois que nécessaire.
                  if (!deposit.trim() && depositCents !== undefined) setDeposit(centsToInput(depositCents))
                  setEditDeposit(true)
                }}
              >
                Modifier
              </button>
              {deposit.trim() && depositCents !== maxDeposit ? (
                <>
                  {' · '}
                  <button
                    type="button"
                    style={editLink}
                    onClick={() => {
                      setDeposit('')
                      setEditDeposit(false)
                      setErrors(({ deposit: _removed, ...rest }) => rest)
                    }}
                  >
                    Revenir au maximum
                  </button>
                </>
              ) : null}
            </>
          }
        />
        <CalcRow label="Fin du bail" value={startDate ? dateFr(endDate(startDate, type)) : '—'} note={`${durationLabel(type)}, puis renouvelé tout seul`} />
        <CalcRow
          label="Paiement"
          value={
            editDay ? (
              <select aria-label="Jour de paiement" autoFocus value={paymentDay} onChange={(e) => { setPaymentDay(Number(e.target.value)); setEditDay(false) }} onBlur={() => setEditDay(false)} style={{ ...small, appearance: 'auto' }}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Le {d}
                  </option>
                ))}
              </select>
            ) : (
              `Le ${paymentDay} de chaque mois`
            )
          }
          note={
            <button type="button" style={editLink} onClick={() => setEditDay(true)}>
              Modifier
            </button>
          }
        />
      </div>
      {editDeposit || depositTooHigh ? (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: BAI.inkMid }}>
          Le dépôt de garantie est la somme versée à l'entrée et rendue à la sortie. La loi le limite à 1 mois de loyer hors
          charges pour un logement vide, 2 mois pour un meublé.
        </p>
      ) : null}
      {errors.deposit ? (
        <span role="alert" style={{ color: BAI.error, fontSize: 14 }}>
          {errors.deposit}
        </span>
      ) : null}

      <StepNav back="/commencer/personnes" next={next} />
    </TunnelLayout>
  )
}
