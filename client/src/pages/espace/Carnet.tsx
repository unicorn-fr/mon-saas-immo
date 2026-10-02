import { useState } from 'react'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { Btn, Card, Chips, Input, LoadError, Loader, Modal, PageHead, TextArea, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { CONTACT_KIND, type Contact, type ContactKind } from '../../lib/contacts'

const EMPTY: Omit<Contact, 'id'> = { kind: 'ARTISAN', name: '', trade: '', phone: '', email: '', address: '', note: '' }

/** Carnet : artisans, syndic, assureur… Un contact saisi une fois se retrouve dans les interventions. */
export default function Carnet() {
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<Contact[]>('/contacts'))
  const [edit, setEdit] = useState<(Omit<Contact, 'id'> & { id?: string }) | null>(null)

  const save = async () => {
    if (!edit?.name.trim()) return toast.show('Indiquez le nom.', 'error')
    try {
      const { id, interventions: _n, ...body } = edit
      await api(id ? `/contacts/${id}` : '/contacts', { method: id ? 'PUT' : 'POST', body })
      setEdit(null)
      toast.show('Contact enregistré.')
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const remove = async (c: Contact) => {
    if (!window.confirm(`Retirer ${c.name} du carnet ?`)) return
    try {
      await api(`/contacts/${c.id}`, { method: 'DELETE' })
      setEdit(null)
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const groups = (Object.keys(CONTACT_KIND) as ContactKind[]).map((k) => ({ kind: k, rows: (data ?? []).filter((c) => c.kind === k) })).filter((g) => g.rows.length)

  return (
    <AppShell>
      <PageHead title="Carnet" sub="Vos artisans, votre syndic, votre assureur : à portée de main, et repris dans les interventions." actions={<Btn onClick={() => setEdit({ ...EMPTY })}>Ajouter un contact</Btn>} />
      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : !groups.length ? (
        <Card>
          <span style={{ fontSize: 17, fontWeight: 600 }}>Votre carnet est vide.</span>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Ajoutez un contact ici, ou directement en créant une intervention dans un logement.</span>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.kind} title={CONTACT_KIND[g.kind]}>
            {g.rows.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>
                    {c.name}
                    {c.trade ? <span style={{ fontWeight: 400, color: BAI.inkSoft }}> · {c.trade}</span> : null}
                  </span>
                  <span style={{ fontSize: 14, color: BAI.inkSoft }}>
                    {[c.phone, c.email].filter(Boolean).join(' · ') || 'Pas de coordonnées'}
                    {c.interventions ? ` · ${c.interventions} intervention${c.interventions > 1 ? 's' : ''}` : ''}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  {c.phone ? (
                    <a href={`tel:${c.phone.replace(/\s/g, '')}`} style={{ fontSize: 14, fontWeight: 600, color: BAI.owner }}>
                      Appeler
                    </a>
                  ) : null}
                  <TextLink style={{ fontSize: 14 }} onClick={() => setEdit({ ...c })}>
                    Modifier
                  </TextLink>
                </span>
              </div>
            ))}
          </Card>
        ))
      )}
      <Modal
        open={Boolean(edit)}
        onClose={() => setEdit(null)}
        title={edit?.id ? 'Modifier le contact' : 'Nouveau contact'}
        actions={
          <>
            {edit?.id ? (
              <Btn variant="ghost" onClick={() => void remove(edit as Contact)}>
                Retirer
              </Btn>
            ) : null}
            <Btn onClick={() => void save()}>Enregistrer</Btn>
          </>
        }
      >
        {edit ? (
          <>
            <Chips legend="Type" value={edit.kind} onChange={(v) => setEdit({ ...edit, kind: v })} options={(Object.keys(CONTACT_KIND) as ContactKind[]).map((k) => ({ value: k, label: CONTACT_KIND[k] }))} />
            <Fields>
              <Input label="Nom" value={edit.name} onChange={(v) => setEdit({ ...edit, name: v })} />
              <Input label="Métier" value={edit.trade} onChange={(v) => setEdit({ ...edit, trade: v })} placeholder="plombier" />
            </Fields>
            <Fields>
              <Input label="Téléphone" value={edit.phone} onChange={(v) => setEdit({ ...edit, phone: v })} inputMode="tel" />
              <Input label="Email" type="email" value={edit.email} onChange={(v) => setEdit({ ...edit, email: v })} />
            </Fields>
            <Input label="Adresse" value={edit.address} onChange={(v) => setEdit({ ...edit, address: v })} />
            <TextArea label="Note" value={edit.note} onChange={(v) => setEdit({ ...edit, note: v })} />
          </>
        ) : null}
      </Modal>
    </AppShell>
  )
}
