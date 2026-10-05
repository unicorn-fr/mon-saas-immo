import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Fields } from './FlowLayout'
import { Btn, Callout, Card, Check, Chips, Input, Modal, Money, Pill, Select, TextArea, TextLink, useLoad, useToast } from './kit'
import { api, pdfUrl } from '../lib/api'
import { dateNum, eurosCents } from '../lib/format'
import { INTERVENTION_STATUS, type Contact, type Intervention } from '../lib/contacts'

interface Draft {
  id?: string
  title: string
  description: string
  status: Intervention['status']
  date: string
  contactId: string | null
  newContact: { name: string; trade: string; phone: string }
  costCents: number | null
  expenseCategory: 'REPAIR' | 'MAINTENANCE'
  /** Signalement du locataire : ce qu'il a envoyé, et s'il faut le prévenir. */
  issue: Intervention['issue']
  notifyTenant: boolean
}
const EMPTY: Draft = { title: '', description: '', status: 'TODO', date: '', contactId: null, newContact: { name: '', trade: '', phone: '' }, costCents: null, expenseCategory: 'REPAIR', issue: null, notifyTenant: true }

/**
 * Interventions d'un logement : à organiser, prévue, terminée. L'artisan vient du carnet (ou y est ajouté) ;
 * terminée avec un coût, l'intervention devient la dépense correspondante dans l'onglet Argent.
 */
export function Interventions({ propertyId }: { propertyId: string }) {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<Intervention[]>(`/properties/${propertyId}/interventions`), [propertyId])
  const { data: contacts, reload: reloadContacts } = useLoad(() => api<Contact[]>('/contacts'))
  const [draft, setDraft] = useState<Draft | null>(null)
  const [params, setParams] = useSearchParams()
  const target = params.get('intervention')
  const opened = useRef<string | null>(null)

  const open = (i?: Intervention) =>
    setDraft(
      i
        ? { id: i.id, title: i.title, description: i.description ?? '', status: i.status, date: i.date ?? '', contactId: i.contact?.id ?? null, newContact: { name: '', trade: '', phone: '' }, costCents: i.costCents, expenseCategory: 'REPAIR', issue: i.source === 'TENANT' ? i.issue : null, notifyTenant: true }
        : { ...EMPTY },
    )
  // Arrivée depuis « Aujourd'hui » ou l'email du signalement : la fiche s'ouvre directement.
  useEffect(() => {
    if (!target || !data || opened.current === target) return
    opened.current = target
    const i = data.find((x) => x.id === target)
    if (i) open(i)
    const next = new URLSearchParams(params)
    next.delete('intervention')
    setParams(next, { replace: true })
  }, [target, data]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    if (!draft?.title.trim()) return toast.show('Indiquez l’objet de l’intervention.', 'error')
    try {
      const body = {
        title: draft.title,
        description: draft.description || null,
        status: draft.status,
        date: draft.date || null,
        contactId: draft.contactId,
        newContact: !draft.contactId && draft.newContact.name.trim() ? draft.newContact : null,
        costCents: draft.costCents,
        expenseCategory: draft.status === 'DONE' && draft.costCents ? draft.expenseCategory : null,
        ...(draft.issue ? { notifyTenant: draft.notifyTenant } : {}),
      }
      const saved = await api<Intervention>(draft.id ? `/interventions/${draft.id}` : `/properties/${propertyId}/interventions`, { method: draft.id ? 'PUT' : 'POST', body })
      const told = saved.notified?.length ? ' Votre locataire est prévenu par email.' : ''
      toast.show(draft.status === 'DONE' && draft.costCents ? `Intervention terminée : la dépense est enregistrée dans Argent.${told}` : `Intervention enregistrée.${told}`)
      setDraft(null)
      reload()
      reloadContacts()
    } catch (e) {
      toast.error(e)
    }
  }
  const remove = async () => {
    if (!draft?.id || !window.confirm('Supprimer cette intervention ?')) return
    try {
      await api(`/interventions/${draft.id}`, { method: 'DELETE' })
      setDraft(null)
      reload()
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <Card title="Interventions" action={<TextLink style={{ fontSize: 14 }} onClick={() => open()}>+ Nouvelle</TextLink>}>
      {data?.length ? (
        data.map((i) => (
          <button key={i.id} type="button" onClick={() => open(i)} style={{ textAlign: 'left', fontFamily: 'inherit', background: 'none', border: 'none', borderTop: `1px solid ${BAI.dividerSoft}`, padding: '10px 0 0', cursor: 'pointer', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{i.title}</span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                {[i.issue ? `Signalé par le locataire le ${dateNum(i.issue.reportedAt)}` : null, i.contact?.name, i.date ? dateNum(i.date) : null, i.costCents ? eurosCents(i.costCents) : null].filter(Boolean).join(' · ') || 'À organiser'}
              </span>
            </span>
            <Pill tone={i.status === 'DONE' ? 'green' : i.status === 'PLANNED' ? 'owner' : i.issue?.urgent ? 'error' : 'caramel'}>{i.status === 'TODO' && i.issue?.urgent ? 'Urgent' : INTERVENTION_STATUS[i.status]}</Pill>
          </button>
        ))
      ) : (
        <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Une fuite, une panne, un entretien : notez-le ici, avec l’artisan et le coût.</span>
      )}
      <Modal
        open={Boolean(draft)}
        onClose={() => setDraft(null)}
        title={draft?.id ? 'Intervention' : 'Nouvelle intervention'}
        actions={
          <>
            {draft?.id ? (
              <Btn variant="ghost" onClick={() => void remove()}>
                Supprimer
              </Btn>
            ) : null}
            <Btn onClick={() => void save()}>Enregistrer</Btn>
          </>
        }
      >
        {draft ? (
          <>
            {draft.issue ? <Reported issue={draft.issue} /> : null}
            <Input label="Objet" value={draft.title} onChange={(v) => setDraft({ ...draft, title: v })} placeholder="Fuite sous l’évier" />
            <Chips legend="Où en est-on ?" value={draft.status} onChange={(v) => setDraft({ ...draft, status: v })} options={(Object.keys(INTERVENTION_STATUS) as Intervention['status'][]).map((k) => ({ value: k, label: INTERVENTION_STATUS[k] }))} />
            <Fields>
              <Select label="Artisan" value={draft.contactId ?? ''} onChange={(v) => setDraft({ ...draft, contactId: v || null })} options={[{ value: '', label: 'Nouveau contact' }, ...(contacts ?? []).map((c) => ({ value: c.id, label: c.trade ? `${c.name} (${c.trade})` : c.name }))]} />
              <Input label={draft.status === 'DONE' ? 'Date de l’intervention' : 'Date prévue'} type="date" value={draft.date} onChange={(v) => setDraft({ ...draft, date: v })} />
            </Fields>
            {!draft.contactId ? (
              <Fields>
                <Input label="Nom de l’artisan" value={draft.newContact.name} onChange={(v) => setDraft({ ...draft, newContact: { ...draft.newContact, name: v } })} hint="Ajouté à votre carnet." />
                <Input label="Téléphone" value={draft.newContact.phone} onChange={(v) => setDraft({ ...draft, newContact: { ...draft.newContact, phone: v } })} inputMode="tel" />
              </Fields>
            ) : null}
            <TextArea label={draft.issue ? 'Ce que dit le locataire' : 'Détails'} value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
            {draft.issue && draft.status !== 'TODO' ? (
              <Check checked={draft.notifyTenant} onChange={(v) => setDraft({ ...draft, notifyTenant: v })} label={draft.status === 'DONE' ? 'Prévenir mon locataire que c’est réglé' : 'Prévenir mon locataire de la date prévue'} sub="Par email. Il voit seulement la date, ni l’artisan ni le coût." />
            ) : null}
            {draft.status === 'DONE' ? (
              <>
                <Money label="Coût" cents={draft.costCents} onChange={(c) => setDraft({ ...draft, costCents: c })} hint="Enregistré comme dépense du logement, pour le bilan et la déclaration." />
                <Chips legend="C’était" value={draft.expenseCategory} onChange={(v) => setDraft({ ...draft, expenseCategory: v })} options={[{ value: 'REPAIR', label: 'Une réparation' }, { value: 'MAINTENANCE', label: 'De l’entretien' }]} />
              </>
            ) : null}
          </>
        ) : null}
      </Modal>
    </Card>
  )
}

/** Ce que le locataire a envoyé : type, lieu, date et photos (fichiers protégés, chargés à l'ouverture). */
function Reported({ issue }: { issue: NonNullable<Intervention['issue']> }) {
  const [photos, setPhotos] = useState<string[]>([])
  useEffect(() => {
    let urls: string[] = []
    let live = true
    Promise.all(issue.photoIds.map((id) => pdfUrl(`/documents/${id}/file`).catch(() => null))).then((list) => {
      urls = list.filter((u): u is string => Boolean(u))
      if (live) setPhotos(urls)
      else urls.forEach((u) => URL.revokeObjectURL(u))
    })
    return () => {
      live = false
      urls.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [issue.photoIds])
  return (
    <Callout tone={issue.urgent ? 'warn' : 'info'} title={`${issue.urgent ? 'Urgent : signalé' : 'Signalé'} par votre locataire le ${dateNum(issue.reportedAt)}`}>
      <span>
        {issue.label}
        {issue.where ? `, ${issue.where}` : ''}.
      </span>
      {photos.length ? (
        <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {photos.map((u, n) => (
            <a key={u} href={u} target="_blank" rel="noreferrer">
              <img src={u} alt={`Photo ${n + 1} envoyée par le locataire`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 10, border: `1px solid ${BAI.divider}` }} />
            </a>
          ))}
        </span>
      ) : null}
    </Callout>
  )
}
