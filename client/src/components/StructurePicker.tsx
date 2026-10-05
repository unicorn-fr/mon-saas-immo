import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import type { LandlordKind } from '../lib/contract'
import { effectsOf, isCompany, type StructureView } from '../lib/structures'
import { Btn, Callout, Card, ChoiceCard, Input, Modal, Select, TextLink, errorMessage } from './kit'
import { Wizard, type WizardStep } from './Wizard'

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
        <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${BAI.borderStrong}`, background: BAI.bg }}>
          <NewStructure
            onCreated={(id) => {
              setCreating(false)
              void load(id)
            }}
            onCancel={() => {
              setCreating(false)
              if (list[0]) onChange(list[0].id)
            }}
          />
        </div>
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

/** Nouvelle structure, une question par écran ; le reste (associés, SIREN, compte) se complète ensuite dans sa fiche. */
export function NewStructure({ onCreated, onCancel }: { onCreated: (id: string) => void; onCancel?: () => void }) {
  const [kind, setKind] = useState<LandlordKind | null>(null)
  const [sciFamily, setSciFamily] = useState<boolean | null>(null)
  const [name, setName] = useState('')
  const [form, setForm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const company = isCompany(kind)

  const create = async () => {
    setBusy(true)
    setError(null)
    try {
      const body = company ? { kind, sciFamily: kind === 'SCI' ? Boolean(sciFamily) : null, company: { name: name.trim(), form: form.trim() || (kind === 'SCI' ? 'SCI' : '') } } : { kind, name: name.trim() || null }
      const s = await api<StructureView>('/structures', { method: 'POST', body })
      onCreated(s.id)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const steps: WizardStep[] = [
    {
      key: 'kind',
      title: 'Qui détient le logement ?',
      note: 'C’est le propriétaire indiqué sur l’acte d’achat.',
      validate: () => (kind ? null : 'Choisissez une réponse.'),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {KIND_CHOICES.map((c) => (
            <ChoiceCard key={c.value} selected={kind === c.value} onClick={() => setKind(c.value)} title={c.label} sub={c.sub} />
          ))}
        </div>
      ),
    },
  ]
  if (kind === 'SCI')
    steps.push({
      key: 'family',
      title: 'Les associés sont-ils tous de la même famille ?',
      note: 'Parents ou alliés jusqu’au 4e degré : parents, enfants, frères et sœurs, oncles, neveux, cousins germains, et leurs conjoints.',
      validate: () => (sciFamily === null ? 'Choisissez une réponse.' : null),
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ChoiceCard selected={sciFamily === true} onClick={() => setSciFamily(true)} title="Oui, une SCI familiale" sub="Le bail vide dure 3 ans, comme pour un particulier." />
          <ChoiceCard selected={sciFamily === false} onClick={() => setSciFamily(false)} title="Non" sub="Le bail vide dure 6 ans." />
        </div>
      ),
    })
  if (company)
    steps.push({
      key: 'name',
      title: 'Comment s’appelle la société ?',
      note: 'Son nom figurera dans le bail, comme bailleur.',
      validate: () => (name.trim() ? null : 'Indiquez le nom de la société.'),
      content: (
        <>
          <Input big label="Nom de la société" value={name} onChange={setName} placeholder="Les Tilleuls" />
          <Input label="Forme (facultatif)" value={form} onChange={setForm} placeholder={kind === 'SCI' ? 'SCI' : 'SARL de famille, SAS…'} />
        </>
      ),
    })
  if (kind)
    steps.push({
      key: 'effects',
      title: 'Ce que cela change pour vos baux',
      content: (
        <>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 16, lineHeight: 1.7 }}>
            {effectsOf(kind, Boolean(sciFamily)).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          {!company ? <Input label="Un nom pour vous y retrouver (facultatif)" value={name} onChange={setName} placeholder={kind === 'COUPLE' ? 'Avec Paul' : 'En mon nom'} /> : null}
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>Vous compléterez plus tard, si besoin, les associés, le SIREN et le compte des loyers.</span>
        </>
      ),
    })

  return <Wizard steps={steps} onFinish={create} finishLabel="Créer la structure" onCancel={onCancel} busy={busy} error={error} />
}

const KIND_CHOICES: Array<{ value: LandlordKind; label: string; sub: string }> = [
  { value: 'PERSON', label: 'Moi, en mon nom', sub: 'Vous êtes seul propriétaire.' },
  { value: 'COUPLE', label: 'Moi et d’autres personnes', sub: 'En couple, avec un proche, ou en indivision après un héritage.' },
  { value: 'SCI', label: 'Une SCI', sub: 'Une société civile immobilière dont vous êtes associé.' },
  { value: 'COMPANY', label: 'Une autre société', sub: 'SARL de famille, SAS, SARL…' },
]

/** Page du logement : à qui il appartient, et le rattacher à une autre structure. */
export function OwnerCard({ propertyId, structureId, onChanged, compact }: { propertyId: string; structureId: string | null; onChanged: () => void; compact?: boolean }) {
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

  if (compact)
    return (
      <>
        <button type="button" onClick={() => { setChoice(structureId); setError(null); setOpen(true) }} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', border: 'none', borderTop: `1px solid ${BAI.dividerSoft}`, background: 'none', fontFamily: 'inherit', fontSize: 15, color: BAI.ink, cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <span style={{ fontWeight: 600 }}>Propriétaire</span>
          <span style={{ color: BAI.owner, fontWeight: 600 }}>{current ? current.name : '…'}</span>
        </button>
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
      </>
    )
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
