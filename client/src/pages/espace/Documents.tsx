import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { UploadModal } from '../../components/UploadModal'
import { Btn, Card, Filters, LoadError, Loader, Modal, PageHead, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { documentPath, downloadDoc, openDoc, printDoc, slug } from '../../lib/docs'
import { dateNum, euros } from '../../lib/format'
import type { DocumentItem, LeaseListItem } from '../../lib/space'

type Group = 'ALL' | DocumentItem['group']
const FILTERS: Array<{ value: Group; label: string }> = [
  { value: 'ALL', label: 'Tous' },
  { value: 'LEASES', label: 'Baux' },
  { value: 'RECEIPTS', label: 'Quittances' },
  { value: 'INVENTORIES', label: 'États des lieux' },
  { value: 'INVOICES', label: 'Factures' },
  { value: 'DIAGNOSTICS', label: 'Diagnostics' },
  { value: 'LETTERS', label: 'Courriers' },
  { value: 'OTHER', label: 'Autres' },
]

/** Tous les documents. Maquette « Documents ». */
export default function Documents() {
  const [params, setParams] = useSearchParams()
  const group = (params.get('type') as Group) || 'ALL'
  const { data, error, loading, reload } = useLoad(() => api<DocumentItem[]>('/documents'))
  const [pick, setPick] = useState<null | 'RECEIPT' | 'LETTER' | 'INVENTORY'>(null)
  const upload = params.get('ajouter') === '1'
  const setUpload = (v: boolean) => {
    const next = new URLSearchParams(params)
    if (v) next.set('ajouter', '1')
    else next.delete('ajouter')
    setParams(next, { replace: true })
  }

  const creators = [
    { title: 'Bail', text: 'Vide, meublé, étudiant ou mobilité, conforme au contrat type', to: '/espace/baux/nouveau' },
    { title: 'Quittance', text: 'Pour un mois, envoyée par email si vous le souhaitez', pick: 'RECEIPT' as const },
    { title: 'État des lieux', text: 'D’entrée ou de sortie, sur téléphone', pick: 'INVENTORY' as const },
    { title: 'Courrier', text: 'Relance, révision, congé, dépôt de garantie', pick: 'LETTER' as const },
  ]
  const navigate = useNavigate()

  return (
    <AppShell>
      <PageHead title="Documents" sub="Tous vos documents, générés par Bailio ou ajoutés par vous." actions={<Btn variant="outline" onClick={() => setUpload(true)}>Ajouter un document</Btn>} />
      <Card title="Créer un document">
        <div className="grid-4" style={{ gap: 12 }}>
          {creators.map((c) => (
            <button key={c.title} type="button" onClick={() => (c.to ? navigate(c.to) : setPick(c.pick!))} style={{ textAlign: 'left', border: `1px solid ${BAI.divider}`, background: BAI.bg, borderRadius: 16, padding: 18, fontFamily: 'inherit', color: BAI.ink, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{c.title}</span>
              <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.45 }}>{c.text}</span>
            </button>
          ))}
        </div>
      </Card>
      <Filters items={FILTERS} value={group} onChange={(v) => setParams(v === 'ALL' ? {} : { type: v }, { replace: true })} />
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <DocTable docs={group === 'ALL' ? data : data.filter((d) => d.group === group)} reload={reload} />}
      <UploadModal open={upload} onClose={() => setUpload(false)} onSaved={reload} />
      <PickLease what={pick} onClose={() => setPick(null)} />
    </AppShell>
  )
}

const ORIGIN = (d: DocumentItem) => (d.origin === 'UPLOADED' ? (d.kind === 'INVOICE' ? 'Ajouté par photo' : 'Ajouté par vous') : 'Par Bailio')

function DocTable({ docs, reload }: { docs: DocumentItem[]; reload: () => void }) {
  const toast = useToast()
  const grid = { gridTemplateColumns: 'minmax(0, 2.4fr) minmax(0, 1.4fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.6fr)' }
  if (!docs.length) return <Card><span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun document dans cette catégorie.</span></Card>
  const act = (fn: () => Promise<unknown>) => () => fn().catch(toast.error)
  const send = (d: DocumentItem) =>
    act(async () => {
      const r = await api<{ sentTo: string[] }>(`/documents/${d.id}/send`, { method: 'POST' })
      toast.show(`Envoyé à ${r.sentTo.join(', ')}.`)
    })
  const remove = (d: DocumentItem) =>
    act(async () => {
      if (!window.confirm(`Supprimer « ${d.title} » ?`)) return
      await api(`/documents/${d.id}`, { method: 'DELETE' })
      toast.show('Document supprimé.')
      reload()
    })
  const linkStyle = { fontSize: 14 }
  return (
    <Card pad={8} style={{ gap: 0, padding: 8 }}>
      <div className="table-row hide-sm" style={{ ...grid, padding: '12px 18px', fontSize: 13, fontWeight: 600, color: BAI.inkSoft }}>
        <span>Document</span>
        <span>Logement</span>
        <span>Date</span>
        <span>Origine</span>
        <span>Actions</span>
      </div>
      {docs.map((d) => {
        const path = documentPath(d.id)
        const pdf = d.mimeType === 'application/pdf'
        return (
          <div key={d.id} className="table-row" style={{ ...grid, padding: '14px 18px', borderTop: `1px solid ${BAI.dividerSoft}`, fontSize: 15 }}>
            <span style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
              {d.title}
              {d.kind === 'LEASE' && d.version > 1 ? <span style={{ fontWeight: 400, color: BAI.inkSoft }}> · version {d.version}</span> : null}
            </span>
            <span style={{ color: BAI.inkMid }}>{d.propertyName ?? ''}</span>
            <span style={{ color: BAI.inkMid }}>{dateNum(d.date)}</span>
            <span style={{ color: BAI.inkMid }}>{ORIGIN(d)}</span>
            <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextLink style={linkStyle} onClick={act(() => openDoc(path))}>
                Ouvrir
              </TextLink>
              {pdf ? (
                <>
                  <TextLink style={linkStyle} onClick={act(() => downloadDoc(path, `${slug(d.title)}.pdf`))}>
                    Télécharger
                  </TextLink>
                  <TextLink style={linkStyle} onClick={act(() => printDoc(path))}>
                    Imprimer
                  </TextLink>
                </>
              ) : null}
              {d.leaseId && d.origin !== 'UPLOADED' ? (
                <TextLink style={linkStyle} onClick={send(d)}>
                  Envoyer
                </TextLink>
              ) : null}
              {d.origin === 'UPLOADED' || d.kind === 'LETTER' ? (
                <TextLink style={{ ...linkStyle, color: BAI.error }} onClick={remove(d)}>
                  Supprimer
                </TextLink>
              ) : null}
            </span>
          </div>
        )
      })}
    </Card>
  )
}

/** Choix du bail pour une quittance, un courrier ou un état des lieux. */
export function PickLease({ what, onClose }: { what: null | 'RECEIPT' | 'LETTER' | 'INVENTORY'; onClose: () => void }) {
  const navigate = useNavigate()
  const { data, loading } = useLoad(() => (what ? api<LeaseListItem[]>('/leases') : Promise.resolve([] as LeaseListItem[])), [what])
  const leases = (data ?? []).filter((l) => l.status !== 'DRAFT')
  const title = what === 'RECEIPT' ? 'Quittance : pour quel bail ?' : what === 'INVENTORY' ? 'État des lieux : pour quel bail ?' : 'Courrier : pour quel bail ?'
  const go = (id: string) => {
    onClose()
    navigate(what === 'INVENTORY' ? `/espace/baux/${id}/etat-des-lieux` : `/espace/baux/${id}/courriers${what === 'RECEIPT' ? '?type=RECEIPT' : ''}`)
  }
  return (
    <Modal open={what !== null} onClose={onClose} title={title}>
      {loading ? (
        <Loader />
      ) : leases.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leases.map((l) => (
            <button key={l.id} type="button" onClick={() => go(l.id)} style={{ textAlign: 'left', border: `1px solid ${BAI.divider}`, background: BAI.surface, borderRadius: 14, padding: '14px 16px', fontFamily: 'inherit', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, cursor: 'pointer' }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{l.tenantName || 'Locataire'}</span>
                <span style={{ fontSize: 14, color: BAI.inkMid }}>{l.property.name}</span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: BAI.inkMid }}>{euros(l.rentCents + l.chargesCents)}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Aucun bail signé pour l’instant. Créez d’abord un bail : quittances, courriers et états des lieux en découlent.</span>
          <div>
            <Btn
              onClick={() => {
                onClose()
                navigate('/espace/baux/nouveau')
              }}
            >
              Créer un bail
            </Btn>
          </div>
        </>
      )}
    </Modal>
  )
}
