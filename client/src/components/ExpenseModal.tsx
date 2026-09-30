import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { todayIso } from '../lib/format'
import type { Expense, PropertySummary } from '../lib/space'
import { Btn, Callout, Input, Modal, Money, Radio, Select, useToast } from './kit'

export const CATEGORY_OPTIONS: Array<{ value: Expense['category']; label: string }> = [
  { value: 'REPAIR', label: 'Réparation, travaux' },
  { value: 'MAINTENANCE', label: 'Entretien' },
  { value: 'TAX', label: 'Impôt, taxe foncière' },
  { value: 'COPRO', label: 'Copropriété' },
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'OTHER', label: 'Autre' },
]

type Draft = Pick<Expense, 'vendor' | 'category' | 'amountCents' | 'recoverableCents' | 'chargeTo' | 'date'> & { description: string; propertyId: string | null }

/** Ajout ou modification d'une dépense (Argent, fiche du logement). */
export function ExpenseModal({ open, onClose, onSaved, expense, propertyId }: { open: boolean; onClose: () => void; onSaved: () => void; expense?: Expense | null; propertyId?: string | null }) {
  const toast = useToast()
  const [d, setD] = useState<Draft>(() => blank(propertyId))
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setD(expense ? { vendor: expense.vendor, description: expense.description ?? '', category: expense.category, amountCents: expense.amountCents, recoverableCents: expense.recoverableCents, chargeTo: expense.chargeTo, date: expense.date, propertyId: expense.propertyId } : blank(propertyId))
    api<PropertySummary[]>('/properties').then(setProperties).catch(() => undefined)
  }, [open, expense, propertyId])

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  const save = async () => {
    if (!d.vendor.trim()) return setError('Indiquez l’artisan ou le fournisseur.')
    if (!d.amountCents) return setError('Indiquez le montant.')
    try {
      const body = { ...d, description: d.description || null, status: 'OK' }
      if (expense) await api(`/expenses/${expense.id}`, { method: 'PUT', body })
      else await api('/expenses', { method: 'POST', body })
      toast.show(expense ? 'Dépense modifiée.' : 'Dépense ajoutée.')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e)
    }
  }

  const remove = async () => {
    if (!expense || !window.confirm('Supprimer cette dépense ?')) return
    try {
      await api(`/expenses/${expense.id}`, { method: 'DELETE' })
      toast.show('Dépense supprimée.')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={expense ? 'Modifier la dépense' : 'Ajouter une dépense'}
      actions={
        <>
          {expense ? (
            <Btn variant="danger" onClick={remove} style={{ marginRight: 'auto' }}>
              Supprimer
            </Btn>
          ) : null}
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={save}>{expense ? 'Enregistrer' : 'Ajouter la dépense'}</Btn>
        </>
      }
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      <div className="col-md" style={{ display: 'flex', gap: 14 }}>
        <Input label="Artisan ou fournisseur" value={d.vendor} onChange={(v) => set('vendor', v)} />
        <Money label="Montant TTC" cents={d.amountCents} onChange={(c) => set('amountCents', c ?? 0)} />
      </div>
      <Input label="Description" value={d.description} onChange={(v) => set('description', v)} placeholder="Réparation d’une fuite sous l’évier" />
      <div className="col-md" style={{ display: 'flex', gap: 14 }}>
        <Input label="Date" type="date" value={d.date} onChange={(v) => set('date', v)} />
        <Select label="Catégorie" value={d.category} onChange={(v) => set('category', v)} options={CATEGORY_OPTIONS} />
      </div>
      <Select label="Logement" value={d.propertyId ?? ''} onChange={(v) => set('propertyId', v || null)} options={properties.map((p) => ({ value: p.id, label: p.name }))} placeholder="Aucun logement en particulier" />
      <Money label="Dont charges récupérables" hint="La part que vous pourrez demander au locataire lors de la régularisation des charges (eau, ordures ménagères, entretien des parties communes…)." cents={d.recoverableCents} onChange={(c) => set('recoverableCents', c ?? 0)} />
      <fieldset style={{ border: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <legend style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Qui paie cette dépense ?</legend>
        <div className="col-md" style={{ display: 'flex', gap: 24 }}>
          <Radio name="chargeTo" checked={d.chargeTo === 'OWNER'} onChange={() => set('chargeTo', 'OWNER')} label="À ma charge" />
          <Radio name="chargeTo" checked={d.chargeTo === 'TENANT'} onChange={() => set('chargeTo', 'TENANT')} label="À refacturer au locataire" />
        </div>
      </fieldset>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>La dépense apparaît dans l’onglet Argent et dans l’historique du logement.</span>
    </Modal>
  )
}

function blank(propertyId?: string | null): Draft {
  return { vendor: '', description: '', category: 'REPAIR', amountCents: 0, recoverableCents: 0, chargeTo: 'OWNER', date: todayIso(), propertyId: propertyId ?? null }
}
