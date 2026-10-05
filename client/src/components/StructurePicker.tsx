import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import type { LandlordKind } from '../lib/contract'
import { KIND_OPTIONS, isCompany, type StructureView } from '../lib/structures'
import { Btn, Callout, Card, Chips, Input, Modal, Select, TextLink, Toggle, errorMessage } from './kit'

const NEW = '__new'

/**
 * « À qui appartient ce logement ? » : liste des structures du compte, ou création d'une nouvelle sur place.
 * La structure choisie désigne le bailleur du bail (durée, congé pour reprise).
 */
export function StructurePicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const [list, setList] = useState<StructureView[] | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async (select?: string) => {
    try {
      const rows = await api<StructureView[]>('/structures')
      setList(rows)
      if (select) onChange(select)
      else if (!value && rows[0]) onChange(rows[0].id)
    } catch (e) {
      setError(errorMessage(e))
    }
  }
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) return <Callout tone="warn">{error}</Callout>
  if (!list) return null
  const current = list.find((s) => s.id === value)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Select
        label="À qui appartient ce logement ?"
        hint="Le bail désigne ce propriétaire : sa durée et les congés possibles en dépendent."
        value={creating ? NEW : value}
        onChange={(v) => {
          if (v === NEW) {
            setCreating(true)
            return onChange('')
          }
          setCreating(false)
          onChange(v)
        }}
        options={[...list.map((s) => ({ value: s.id, label: s.name })), { value: NEW, label: 'Créer une nouvelle structure' }]}
      />
      {creating ? (
        <NewStructure
          onCreated={(id) => {
            setCreating(false)
            void load(id)
          }}
        />
      ) : current ? (
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
          {current.effects.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Nouvelle structure : l'essentiel pour le bail ; le reste (associés, SIREN, compte) se complète dans sa fiche. */
export function NewStructure({ onCreated }: { onCreated: (id: string) => void }) {
  const [kind, setKind] = useState<LandlordKind | null>(null)
  const [sciFamily, setSciFamily] = useState(false)
  const [name, setName] = useState('')
  const [form, setForm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const company = isCompany(kind)

  const create = async () => {
    if (!kind) return setError('Indiquez qui détient le logement.')
    if (company && !name.trim()) return setError('Indiquez le nom de la société.')
    setBusy(true)
    setError(null)
    try {
      const body = company ? { kind, sciFamily: kind === 'SCI' ? sciFamily : null, company: { name: name.trim(), form: form.trim() || (kind === 'SCI' ? 'SCI' : '') } } : { kind, name: name.trim() || null }
      const s = await api<StructureView>('/structures', { method: 'POST', body })
      onCreated(s.id)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 18, borderRadius: 16, border: `1px solid ${BAI.borderStrong}`, background: BAI.bg }}>
      <Chips legend="Le logement est détenu" value={kind} onChange={(v) => setKind(v)} options={KIND_OPTIONS} />
      {kind === 'SCI' ? <Toggle checked={sciFamily} onChange={setSciFamily} label="SCI familiale" sub="Associés tous parents ou alliés jusqu’au 4e degré (frères, cousins, oncles…) : le bail vide dure 3 ans, comme pour un particulier." /> : null}
      {company ? (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input label="Nom de la société" value={name} onChange={setName} style={{ flex: '2 1 220px' }} />
          <Input label="Forme (facultatif)" value={form} onChange={setForm} placeholder={kind === 'SCI' ? 'SCI' : 'SARL de famille, SAS…'} style={{ flex: '1 1 160px' }} />
        </div>
      ) : kind ? (
        <Input label="Nom pour vous y retrouver (facultatif)" value={name} onChange={setName} placeholder={kind === 'COUPLE' ? 'Avec Paul' : 'En mon nom'} />
      ) : null}
      {error ? <Callout tone="warn">{error}</Callout> : null}
      <div>
        <Btn variant="outline" onClick={() => void create()} loading={busy} disabled={busy}>
          Créer cette structure
        </Btn>
      </div>
    </div>
  )
}

/** Page du logement : à qui il appartient, et le rattacher à une autre structure. */
export function OwnerCard({ propertyId, structureId, onChanged }: { propertyId: string; structureId: string | null; onChanged: () => void }) {
  const [list, setList] = useState<StructureView[] | null>(null)
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState<string | null>(structureId)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    api<StructureView[]>('/structures').then(setList).catch(() => setList([]))
  }, [structureId, open])
  const current = list?.find((s) => s.id === structureId) ?? null

  const save = async () => {
    if (!choice) return setError('Choisissez une structure, ou terminez sa création.')
    setBusy(true)
    try {
      await api(`/properties/${propertyId}/structure`, { method: 'PUT', body: { structureId: choice } })
      setOpen(false)
      onChanged()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="Propriétaire" action={<TextLink onClick={() => { setChoice(structureId); setError(null); setOpen(true) }} style={{ fontSize: 14 }}>Changer</TextLink>}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{current ? current.name : '…'}</span>
      {current ? <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>{current.effects[0]}</span> : null}
      {current ? <TextLink to={`/espace/structures/${current.id}`} style={{ fontSize: 14 }}>Voir la structure</TextLink> : null}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Changer de propriétaire"
        actions={
          <Btn onClick={() => void save()} loading={busy} disabled={busy}>
            Enregistrer
          </Btn>
        }
      >
        <StructurePicker value={choice} onChange={(v) => setChoice(v || null)} />
        <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Un bail déjà signé garde le bailleur indiqué à la signature. Les baux en préparation et les suivants prennent ce choix.</span>
        {error ? <Callout tone="warn">{error}</Callout> : null}
      </Modal>
    </Card>
  )
}
