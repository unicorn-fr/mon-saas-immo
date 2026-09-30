import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import type { PropertySummary } from '../lib/space'
import { Btn, Callout, Input, Modal, Select, useToast } from './kit'

type Kind = 'DIAGNOSTIC' | 'INVOICE' | 'OTHER' | 'LEASE_IMPORTED'

const KINDS: Array<{ value: Kind; label: string }> = [
  { value: 'OTHER', label: 'Autre document' },
  { value: 'DIAGNOSTIC', label: 'Diagnostic' },
  { value: 'INVOICE', label: 'Facture' },
]

const DIAGS = [
  { value: 'dpe', label: 'Performance énergétique (DPE)' },
  { value: 'erp', label: 'État des risques (ERP)' },
  { value: 'electricity', label: 'Électricité' },
  { value: 'gas', label: 'Gaz' },
  { value: 'lead', label: 'Plomb (CREP)' },
  { value: 'asbestos', label: 'Amiante' },
  { value: 'noise', label: 'Bruit (aérodrome)' },
]

/** Ajout d'un document (photo ou PDF) rangé dans un logement, un bail ou la fiche d'un locataire. */
export function UploadModal({ open, onClose, onSaved, propertyId, leaseId, tenantId, kind: initialKind = 'OTHER', diagnostic }: { open: boolean; onClose: () => void; onSaved: () => void; propertyId?: string; leaseId?: string; tenantId?: string; kind?: Kind; diagnostic?: string }) {
  const toast = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<Kind>(initialKind)
  const [diag, setDiag] = useState(diagnostic ?? '')
  const [prop, setProp] = useState(propertyId ?? '')
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setFile(null)
    setTitle('')
    setKind(initialKind)
    setDiag(diagnostic ?? '')
    setProp(propertyId ?? '')
    setError(null)
    if (!propertyId && !leaseId && !tenantId) api<PropertySummary[]>('/properties').then(setProperties).catch(() => undefined)
  }, [open, initialKind, diagnostic, propertyId, leaseId, tenantId])

  const save = async () => {
    if (!file) return setError('Choisissez une photo ou un PDF.')
    if (file.size > 15 * 1024 * 1024) return setError('Le fichier dépasse 15 Mo.')
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)
    const label = title.trim() || (kind === 'DIAGNOSTIC' ? DIAGS.find((d) => d.value === diag)?.label : '') || file.name
    form.append('title', label)
    if (prop) form.append('propertyId', prop)
    if (leaseId) form.append('leaseId', leaseId)
    if (tenantId) form.append('tenantId', tenantId)
    if (kind === 'DIAGNOSTIC' && diag) form.append('diagnostic', diag)
    try {
      await api('/documents', { method: 'POST', form, timeout: 90_000 })
      toast.show('Document ajouté.')
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
      title="Ajouter un document"
      actions={
        <>
          <Btn variant="outline" onClick={onClose}>
            Annuler
          </Btn>
          <Btn onClick={save}>Ajouter</Btn>
        </>
      }
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      <label style={{ border: `1.5px dashed ${BAI.dashed}`, borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', background: BAI.bg }}>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{file ? file.name : 'Choisir une photo ou un PDF'}</span>
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>{file ? `${Math.round(file.size / 1024)} Ko` : 'JPEG, PNG ou PDF, 15 Mo au maximum.'}</span>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
      </label>
      {initialKind === 'LEASE_IMPORTED' ? null : <Select label="Type de document" value={kind} onChange={setKind} options={KINDS} />}
      {kind === 'DIAGNOSTIC' ? <Select label="Diagnostic" value={diag} onChange={setDiag} options={DIAGS} placeholder="Choisir" /> : null}
      <Input label="Nom du document" value={title} onChange={setTitle} placeholder="Attestation d’assurance 2026" />
      {!propertyId && !leaseId && !tenantId ? <Select label="Logement" value={prop} onChange={setProp} options={properties.map((p) => ({ value: p.id, label: p.name }))} placeholder="Aucun logement en particulier" /> : null}
    </Modal>
  )
}
