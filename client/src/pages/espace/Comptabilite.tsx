import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Crumbs, Input, LoadError, Loader, Modal, Pill, Select, TextArea, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { eurosCents, monthName } from '../../lib/format'

interface Ledger {
  year: number
  propertyId: string
  propertyName: string
  incomeCents: number
  expensesCents: number
  balanceCents: number
  ops: Array<{ id: string; kind: 'RENT' | 'EXPENSE'; date: string; label: string; sub: string; amountCents: number; category: string; leaseId: string | null; documentId: string | null }>
}

/** Catégories fiscales d'une dépense, avec leur ligne de la déclaration 2044 (revenus fonciers). */
type Cat = 'REPAIR' | 'MAINTENANCE' | 'ENERGY_RENOVATION' | 'EXTENSION' | 'TAX' | 'COPRO' | 'INSURANCE' | 'OTHER'
const CATS: Array<{ value: Cat; label: string }> = [
  { value: 'REPAIR', label: 'Travaux de réparation ou d’amélioration (ligne 224)' },
  { value: 'MAINTENANCE', label: 'Entretien (ligne 224)' },
  { value: 'ENERGY_RENOVATION', label: 'Rénovation énergétique (ligne 224)' },
  { value: 'TAX', label: 'Impôts et taxes, dont taxe foncière (ligne 227)' },
  { value: 'COPRO', label: 'Charges de copropriété (ligne 229)' },
  { value: 'INSURANCE', label: 'Assurances (ligne 223)' },
  { value: 'OTHER', label: 'Autre dépense (pas reprise dans la déclaration)' },
  { value: 'EXTENSION', label: 'Construction ou agrandissement (non déductible)' },
]

const eur = (c: number) => eurosCents(Math.abs(c))

/** /espace/logements/:id/comptabilite : recettes et dépenses du bien, mois par mois, avec le solde et les justificatifs. */
export default function Comptabilite() {
  const { id = '' } = useParams()
  const [year, setYear] = useState(new Date().getFullYear())
  const [adding, setAdding] = useState(false)
  const [q, setQ] = useState('')
  const { data, error, loading, reload } = useLoad(() => api<Ledger>(`/properties/${id}/ledger?year=${year}`), [id, year])

  const months = useMemo(() => {
    if (!data) return []
    // Solde après chaque opération, de la plus ancienne à la plus récente, puis affiché du plus récent au plus ancien.
    const chrono = [...data.ops].reverse()
    let run = 0
    const withBal = chrono.map((o) => ({ ...o, balance: (run += o.amountCents) })).reverse()
    const shown = q ? withBal.filter((o) => `${o.label} ${o.sub}`.toLowerCase().includes(q.toLowerCase())) : withBal
    const groups: Array<{ key: string; label: string; ops: typeof shown }> = []
    for (const o of shown) {
      const key = o.date.slice(0, 7)
      const g = groups[groups.length - 1]
      if (g && g.key === key) g.ops.push(o)
      else groups.push({ key, label: `${monthName(Number(key.slice(5)))} ${key.slice(0, 4)}`, ops: [o] })
    }
    return groups
  }, [data, q])

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Biens', to: '/espace/logements' }, { label: data?.propertyName ?? 'Bien', to: `/espace/logements/${id}` }, { label: 'Comptabilité' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={display('clamp(26px, 3.2vw, 34px)')}>Comptabilité</h1>
        <div role="group" aria-label="Année" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" className="ledger-nav" aria-label="Année précédente" onClick={() => setYear(year - 1)}>
            ‹
          </button>
          <span style={{ minWidth: 64, textAlign: 'center', fontWeight: 700, fontSize: 17 }} aria-live="polite">
            {year}
          </span>
          <button type="button" className="ledger-nav" aria-label="Année suivante" onClick={() => setYear(year + 1)} disabled={year >= new Date().getFullYear()}>
            ›
          </button>
        </div>
      </div>
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <>
          <div className="dash-tiles">
            <div className="dash-tile" style={{ cursor: 'default' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Solde comptable du bien</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 'clamp(24px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em' }}>
                    {data.balanceCents < 0 ? '−' : ''}
                    {eur(data.balanceCents)}
                  </span>
                  <Pill tone={data.balanceCents >= 0 ? 'green' : 'error'}>{data.balanceCents >= 0 ? 'Positif' : 'Négatif'}</Pill>
                </span>
              </span>
            </div>
            <div className="dash-tile" style={{ cursor: 'default' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Total des recettes</span>
                <span style={{ fontSize: 'clamp(24px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', color: BAI.green }}>{eur(data.incomeCents)}</span>
              </span>
            </div>
            <div className="dash-tile" style={{ cursor: 'default' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Total des dépenses</span>
                <span style={{ fontSize: 'clamp(24px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em' }}>{eur(data.expensesCents)}</span>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn onClick={() => setAdding(true)}>+ Ajouter une opération</Btn>
              <Btn variant="outline" to="/espace/banques">
                Noter un loyer reçu
              </Btn>
            </div>
            <div style={{ width: 'min(320px, 100%)' }}>
              <Input label="Rechercher une opération" hideLabel placeholder="Rechercher une opération" value={q} onChange={setQ} />
            </div>
          </div>

          {months.length ? (
            <div className="dash-card" style={{ gap: 4 }}>
              {months.map((m) => (
                <section key={m.key} aria-label={m.label}>
                  <h2 style={{ margin: '14px 0 8px', fontSize: 15, fontWeight: 700, color: BAI.inkMid, textTransform: 'none' }}>{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</h2>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {m.ops.map((o) => (
                      <li key={o.id} className="ledger-row">
                        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                          <span style={{ fontWeight: 600, color: BAI.ink, overflowWrap: 'anywhere' }}>{o.label}</span>
                          <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                            {new Date(`${o.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · {o.sub}
                            {o.documentId ? ' · justificatif joint' : ''}
                          </span>
                        </span>
                        <span className={o.amountCents >= 0 ? 'ledger-amt ledger-amt--in' : 'ledger-amt'}>
                          {o.amountCents >= 0 ? '+' : '−'}
                          {eur(o.amountCents)}
                        </span>
                        <span className="ledger-bal hide-md">Solde {o.balance < 0 ? '−' : ''}{eur(o.balance)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ) : (
            <div className="dash-card">
              <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid }}>Aucune opération en {year}. Les loyers notés reçus et les dépenses du bien apparaissent ici.</p>
            </div>
          )}
          <p style={{ margin: 0, fontSize: 14, color: BAI.inkSoft }}>
            Ces chiffres alimentent votre <Link to="/espace/fiscalite" style={{ color: BAI.owner, fontWeight: 600 }}>déclaration de revenus</Link>.
          </p>
          <AddOperation open={adding} onClose={() => setAdding(false)} propertyId={id} onDone={reload} />
        </>
      )}
    </AppShell>
  )
}

function AddOperation({ open, onClose, propertyId, onDone }: { open: boolean; onClose: () => void; propertyId: string; onDone: () => void }) {
  const toast = useToast()
  const [cat, setCat] = useState<Cat | null>(null)
  const [vendor, setVendor] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [comment, setComment] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const cents = Math.round(Number(amount.replace(/\s/g, '').replace(',', '.')) * 100)

  const save = async () => {
    if (!cat) return setErr('Choisissez une catégorie.')
    if (!vendor.trim()) return setErr('Indiquez le fournisseur ou l’objet.')
    if (!(cents > 0)) return setErr('Indiquez le montant.')
    setBusy(true)
    setErr(null)
    try {
      let documentId: string | null = null
      if (file) {
        const form = new FormData()
        form.append('file', file)
        form.append('kind', 'INVOICE')
        form.append('propertyId', propertyId)
        form.append('title', `Justificatif, ${vendor.trim()}`)
        documentId = (await api<{ id: string }>('/documents', { method: 'POST', form })).id
      }
      await api('/expenses', { method: 'POST', body: { propertyId, vendor: vendor.trim(), description: comment.trim() || null, category: cat, amountCents: cents, date, documentId } })
      toast.show('Opération ajoutée.')
      setCat(null)
      setVendor('')
      setAmount('')
      setComment('')
      setFile(null)
      onClose()
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'L’opération n’a pas été enregistrée.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter une opération"
      actions={
        <Btn onClick={save} disabled={busy}>
          {busy ? 'Enregistrement…' : 'Valider'}
        </Btn>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Select label="Catégorie d’opération" value={cat} onChange={setCat} options={CATS} placeholder="Choisir une catégorie" />
        <Input label="Fournisseur ou objet" value={vendor} onChange={setVendor} placeholder="Plombier, taxe foncière…" maxLength={160} />
        <div className="grid-2" style={{ gap: 12 }}>
          <Input label="Montant" value={amount} onChange={setAmount} inputMode="decimal" suffix="€" />
          <Input label="Date" type="date" value={date} onChange={setDate} />
        </div>
        <TextArea label="Commentaire (facultatif)" value={comment} onChange={setComment} maxLength={300} rows={2} />
        <label className="ledger-drop">
          <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
          <span style={{ fontWeight: 600 }}>{file ? file.name : 'Déposez votre justificatif'}</span>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>Facultatif · PNG, JPG ou PDF</span>
        </label>
        {err ? (
          <p role="alert" style={{ margin: 0, color: BAI.error, fontSize: 14 }}>
            {err}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
