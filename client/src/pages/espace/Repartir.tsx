import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { CATEGORY_OPTIONS } from '../../components/ExpenseModal'
import { Wizard } from '../../components/Wizard'
import { Btn, Callout, Card, Check, Chips, Crumbs, Input, Line, LoadError, Loader, Money, NumberField, Select, errorMessage, useLoad } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { eurosCents, todayIso } from '../../lib/format'
import type { Expense, PropertySummary } from '../../lib/space'

type Key = 'SURFACE' | 'TANTIEMES' | 'EQUAL'
interface Share {
  propertyId: string
  name: string
  amountCents: number
  recoverableCents: number
  basis: string
}

const KEYS: Array<{ value: Key; label: string }> = [
  { value: 'SURFACE', label: 'Selon la surface' },
  { value: 'TANTIEMES', label: 'Selon les tantièmes' },
  { value: 'EQUAL', label: 'Parts égales' },
]

/**
 * Dépense de tout l'immeuble (parties communes, ménage, ordures ménagères…) répartie entre ses logements
 * (server/src/domain/split.ts) : la dépense, puis les logements et la clé, puis la vérification. Une dépense par
 * logement ; la part récupérable passe dans la régularisation des charges de chaque locataire.
 */
export default function Repartir() {
  const [params] = useSearchParams()
  const { data: properties, error, reload } = useLoad(() => api<PropertySummary[]>('/properties'))
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Expense['category']>('MAINTENANCE')
  const [date, setDate] = useState(todayIso())
  const [amount, setAmount] = useState<number | null>(null)
  const [recoverable, setRecoverable] = useState<number | null>(null)
  const [key, setKey] = useState<Key>('SURFACE')
  const [chosen, setChosen] = useState<string[] | null>(null)
  const [tantiemes, setTantiemes] = useState<Record<string, number | null>>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [done, setDone] = useState<Share[] | null>(null)

  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (!properties) return <AppShell><Loader /></AppShell>
  // Logements de l'immeuble choisis d'avance (lien depuis « Logements »).
  const selected = chosen ?? (params.get('logements') ?? '').split(',').filter((id) => properties.some((p) => p.id === id))
  const body = () => ({ vendor, description: description || null, category, date, amountCents: amount ?? 0, recoverableCents: recoverable ?? 0, key, units: selected.map((id) => ({ propertyId: id, tantiemes: key === 'TANTIEMES' ? tantiemes[id] ?? null : null })) })

  const save = async () => {
    setBusy(true)
    setMessage(null)
    try {
      const r = await api<{ shares: Share[] }>('/expenses/split', { method: 'POST', body: body() })
      setDone(r.shares)
      window.scrollTo(0, 0)
    } catch (e) {
      setMessage(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Argent', to: '/espace/argent' }, { label: 'Répartir une dépense' }]} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={display('clamp(34px, 5vw, 48px)')}>Répartir une dépense de l’immeuble</h1>
        <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>Électricité des parties communes, ménage, entretien, ordures ménagères : chaque logement reçoit sa part.</span>
      </div>
      <Card pad={28}>
        {done ? (
          <>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>C’est enregistré : {done.length} dépenses.</h2>
            {done.map((s) => (
              <Line key={s.propertyId} label={`${s.name} (${s.basis})`} value={eurosCents(s.amountCents)} />
            ))}
            <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>La part récupérable de chaque logement sera reprise dans la régularisation des charges de son locataire.</span>
            <div>
              <Btn to="/espace/argent">Retour à Argent</Btn>
            </div>
          </>
        ) : (
          <Wizard
            busy={busy}
            error={message}
            finishLabel={`Enregistrer ${selected.length} dépenses`}
            onFinish={() => void save()}
            steps={[
              {
                key: 'expense',
                title: 'Quelle dépense ?',
                content: (
                  <>
                    <Input label="Fournisseur" value={vendor} onChange={setVendor} placeholder="Entreprise de ménage, EDF…" />
                    <Input label="Description (facultatif)" value={description} onChange={setDescription} placeholder="Ménage des parties communes, 3e trimestre" />
                    <Select label="Nature" value={category} onChange={(v) => setCategory(v as Expense['category'])} options={CATEGORY_OPTIONS} />
                    <Input label="Date" type="date" value={date} onChange={setDate} />
                    <Money label="Montant total" cents={amount} onChange={setAmount} />
                    <Money label="Dont part récupérable sur les locataires (facultatif)" cents={recoverable} onChange={setRecoverable} hint="Ce que vous refacturez dans les charges : électricité et ménage des parties communes, ordures ménagères… (décret n° 87-713)." />
                  </>
                ),
                validate: () => (!vendor.trim() ? 'Indiquez le fournisseur.' : !amount ? 'Indiquez le montant total.' : (recoverable ?? 0) > amount ? 'La part récupérable ne peut pas dépasser le montant.' : !date ? 'Indiquez la date.' : null),
              },
              {
                key: 'units',
                title: 'Entre quels logements ?',
                content: (
                  <>
                    <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <legend style={{ fontSize: 15, fontWeight: 600, padding: 0, marginBottom: 8 }}>Logements concernés</legend>
                      {properties.map((p) => (
                        <Check key={p.id} checked={selected.includes(p.id)} onChange={(v) => setChosen(v ? [...selected, p.id] : selected.filter((x) => x !== p.id))} label={p.name} sub={[p.address, p.surface ? `${p.surface} m²` : 'surface non indiquée'].filter(Boolean).join(' · ')} />
                      ))}
                    </fieldset>
                    <Chips legend="Comment répartir ?" value={key} onChange={setKey} options={KEYS} hint="La surface vient de la fiche de chaque logement. Les tantièmes figurent dans le règlement de copropriété ou l’état descriptif de division." />
                    {key === 'TANTIEMES'
                      ? selected.map((id) => (
                          <NumberField key={id} label={`Tantièmes : ${properties.find((p) => p.id === id)?.name ?? ''}`} value={tantiemes[id] ?? null} onChange={(n) => setTantiemes({ ...tantiemes, [id]: n })} step="int" />
                        ))
                      : null}
                  </>
                ),
                validate: () => (selected.length < 2 ? 'Choisissez au moins deux logements.' : key === 'TANTIEMES' && selected.some((id) => !tantiemes[id]) ? 'Indiquez les tantièmes de chaque logement.' : null),
              },
              {
                key: 'check',
                title: 'Vérifiez la répartition',
                content: <Preview body={body()} />,
              },
            ]}
          />
        )}
      </Card>
    </AppShell>
  )
}

function Preview({ body }: { body: Record<string, unknown> }) {
  const [shares, setShares] = useState<Share[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const json = JSON.stringify(body)
  useEffect(() => {
    let live = true
    api<{ shares: Share[] }>('/expenses/split/preview', { method: 'POST', body: JSON.parse(json) })
      .then((r) => live && setShares(r.shares))
      .catch((e) => live && setError(errorMessage(e)))
    return () => {
      live = false
    }
  }, [json])
  if (error) return <Callout tone="warn">{error}</Callout>
  if (!shares) return <Loader />
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {shares.map((s) => (
        <Line key={s.propertyId} label={`${s.name} (${s.basis})`} value={`${eurosCents(s.amountCents)}${s.recoverableCents ? `, dont ${eurosCents(s.recoverableCents)} récupérables` : ''}`} />
      ))}
      <Line strong border label="Total" value={eurosCents(shares.reduce((a, s) => a + s.amountCents, 0))} />
    </div>
  )
}
