import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { ExpenseModal } from '../../components/ExpenseModal'
import { FlowHeader } from '../../components/FlowLayout'
import { Btn, Callout, Input, LoadError, Loader, Money, Pill, Select, errorMessage, fieldStyle, useLoad, useToast } from '../../components/kit'
import { Spinner, display } from '../../components/ui'
import { Camera } from '../../components/Icons'
import { ApiError, api, pdfUrl } from '../../lib/api'
import { compressImage } from '../../lib/compressImage'
import { documentPath } from '../../lib/docs'
import { dateShort } from '../../lib/format'
import type { Expense, ExpenseDetails, PropertySummary } from '../../lib/space'

/** Ajouter une facture en photo : lue sur le serveur de Bailio, jamais envoyée ailleurs. */
export function FactureAjout() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState(false)
  const propertyId = params.get('logement')

  const send = async () => {
    if (!files.length) return setError('Ajoutez une photo ou le PDF de la facture.')
    setBusy(true)
    setError(null)
    try {
      const form = new FormData()
      for (const f of files) form.append('files', f.type.startsWith('image/') ? await compressImage(f) : f)
      const e = await api<Expense & { matchedProperty: { id: string } | null }>('/expenses/scan', { method: 'POST', form, timeout: 180_000 })
      if (propertyId && !e.matchedProperty) await api(`/expenses/${e.id}`, { method: 'PUT', body: { propertyId } }).catch(() => undefined)
      navigate(`/espace/argent/factures/${e.id}`, { replace: true })
    } catch (e) {
      setError(errorMessage(e))
      if (e instanceof ApiError && e.status === 503) setManual(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <FlowHeader left={<button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, cursor: 'pointer', padding: 0 }}>Retour</button>} center={<span style={{ fontSize: 16, fontWeight: 700 }}>Ajouter une facture</span>} right={<Link to="/espace/argent" style={{ textDecoration: 'none', fontSize: 15, color: BAI.inkMid }}>Fermer</Link>} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: 'clamp(28px, 5vw, 56px) 16px 64px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <h1 style={display('clamp(38px, 5vw, 52px)')}>Une photo suffit.</h1>
        <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, lineHeight: 1.5 }}>Bailio lit la facture sur son propre serveur : fournisseur, montant, date et adresse du chantier. Vous vérifiez, puis elle est rangée dans le bon logement.</p>
        <label style={{ border: `1.5px dashed ${BAI.dashed}`, background: BAI.surface, borderRadius: 20, padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center', cursor: 'pointer' }}>
          <Camera size={40} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>{files.length ? `${files.length} fichier${files.length > 1 ? 's' : ''} choisi${files.length > 1 ? 's' : ''}` : 'Prendre une photo ou choisir un fichier'}</span>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>{files.length ? files.map((f) => f.name).join(', ') : 'Photo (JPEG, PNG) ou PDF. Plusieurs pages possibles.'}</span>
          <input type="file" multiple accept="image/*,application/pdf" className="sr-only" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 10))} />
        </label>
        {error ? <Callout tone="warn">{error}</Callout> : null}
        <div className="col-md" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Btn size="lg" onClick={send} loading={busy} disabled={!files.length}>
            {busy ? 'Lecture en cours' : 'Lire la facture'}
          </Btn>
          <Btn variant="ghost" onClick={() => setManual(true)}>
            Saisir à la main
          </Btn>
        </div>
        {busy ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>La lecture prend en général moins d’une minute.</span> : null}
      </main>
      <ExpenseModal open={manual} onClose={() => setManual(false)} onSaved={() => navigate('/espace/argent')} propertyId={propertyId} />
    </div>
  )
}

/** Vérifier une facture lue par Bailio. Maquette « Facture lue ». */
export function FactureVerifier() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<ExpenseDetails>(`/expenses/${id}`), [id])
  if (loading && !data) return <Loader />
  if (error || !data) return <div style={{ padding: 24 }}><LoadError message={error ?? ''} retry={reload} /></div>
  return <Verify e={data} />
}

function Verify({ e }: { e: ExpenseDetails }) {
  const navigate = useNavigate()
  const toast = useToast()
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [vendor, setVendor] = useState(e.vendor)
  const [amount, setAmount] = useState<number | null>(e.amountCents)
  const [date, setDate] = useState(e.date)
  const [propertyId, setPropertyId] = useState(e.propertyId ?? '')
  const [description, setDescription] = useState(e.description ?? '')
  const [chargeTo, setChargeTo] = useState(e.chargeTo)
  const [category, setCategory] = useState(e.category)
  const reading = e.document?.meta?.reading
  const matched = e.document?.meta?.matchedBy === 'address' && propertyId === e.propertyId

  useEffect(() => {
    api<PropertySummary[]>('/properties').then(setProperties).catch(() => undefined)
  }, [])

  const validate = async () => {
    if (!vendor.trim() || !amount) return toast.show('Indiquez le fournisseur et le montant.', 'error')
    try {
      await api(`/expenses/${e.id}`, { method: 'PUT', body: { vendor, amountCents: amount, date, propertyId: propertyId || null, description: description || null, chargeTo, category, status: 'OK' } })
      toast.show('Facture rangée.')
      navigate(propertyId ? `/espace/logements/${propertyId}?onglet=expenses` : '/espace/argent', { replace: true })
    } catch (err) {
      toast.error(err)
    }
  }

  const notInvoice = async () => {
    try {
      await api(`/expenses/${e.id}?withDocument=1`, { method: 'DELETE' })
      toast.show('Document retiré.')
      navigate('/espace', { replace: true })
    } catch (err) {
      toast.error(err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <FlowHeader
        height={80}
        left={
          <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, cursor: 'pointer', padding: 0 }}>
            Retour
          </button>
        }
        center={<span className="hide-md" style={{ fontSize: 15, color: BAI.inkMid }}>Document ajouté{e.document?.mimeType === 'application/pdf' ? '' : ' par photo'}, le {dateShort(e.document?.createdAt ?? e.date)}</span>}
        right={
          <Link to="/espace" style={{ textDecoration: 'none', fontSize: 15, color: BAI.inkMid }}>
            Fermer
          </Link>
        }
      />
      <main className="split-aside" style={{ padding: 'clamp(16px, 3vw, 36px) clamp(16px, 4vw, 56px) 64px', gap: 40, maxWidth: 1440, margin: '0 auto' }}>
        <div className="aside-wide" style={{ background: BAI.photoSand, borderRadius: 24, padding: 'clamp(16px, 3vw, 36px)', minHeight: 360, alignItems: 'center', justifyContent: 'center', width: 560 }}>
          {e.document ? <Preview docId={e.document.id} mime={e.document.mimeType} /> : <span style={{ color: BAI.inkSoft }}>Aucun document joint.</span>}
        </div>
        <form
          className="grow"
          onSubmit={(ev) => {
            ev.preventDefault()
            void validate()
          }}
          style={{ gap: 22 }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Pill tone="green">Lu par Bailio</Pill>
            <h1 style={display('clamp(36px, 4.5vw, 46px)')}>Vérifiez cette facture</h1>
            <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>{reading ? 'Bailio a lu votre document et rempli les informations ci-dessous. Corrigez si besoin, puis validez.' : 'Complétez les informations ci-dessous, puis validez.'}</p>
          </div>
          <div className="grid-2" style={{ gap: 16 }}>
            <Input label="Artisan ou fournisseur" value={vendor} onChange={setVendor} />
            <Money label="Montant TTC" cents={amount} onChange={setAmount} />
            <Input label="Date" type="date" value={date} onChange={setDate} />
            <Select label="Logement" value={propertyId} onChange={setPropertyId} options={properties.map((p) => ({ value: p.id, label: p.name }))} placeholder="Aucun logement" hint={matched ? 'Reconnu grâce à l’adresse du chantier.' : undefined} />
          </div>
          <Input label="Description" value={description} onChange={setDescription} />
          <Select
            label="Catégorie"
            value={category}
            onChange={setCategory}
            options={[
              { value: 'REPAIR', label: 'Réparation, travaux' },
              { value: 'MAINTENANCE', label: 'Entretien' },
              { value: 'TAX', label: 'Impôt, taxe foncière' },
              { value: 'COPRO', label: 'Copropriété' },
              { value: 'INSURANCE', label: 'Assurance' },
              { value: 'OTHER', label: 'Autre' },
            ]}
          />
          <fieldset style={{ margin: 0, border: `1px solid ${reading?.tenantRepairHint ? BAI.caramel : BAI.border}`, background: reading?.tenantRepairHint ? BAI.errorLight : BAI.surface, borderRadius: 16, padding: '14px 20px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <legend style={{ fontSize: 14, fontWeight: 700, color: reading?.tenantRepairHint ? BAI.error : BAI.ink, padding: '0 6px' }}>{reading?.tenantRepairHint ? 'À vérifier : qui paie cette dépense ?' : 'Qui paie cette dépense ?'}</legend>
            {reading?.tenantRepairHint ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.55 }}>{reading.tenantRepairHint} Suggestion de Bailio, à confirmer selon la situation.</span> : null}
            <div className="grid-2" style={{ gap: 10 }}>
              {(['OWNER', 'TENANT'] as const).map((v) => (
                <label key={v} style={{ ...fieldStyle(), display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', border: chargeTo === v ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, height: 48 }}>
                  <input type="radio" name="chargeTo" checked={chargeTo === v} onChange={() => setChargeTo(v)} style={{ accentColor: BAI.owner }} />
                  {v === 'OWNER' ? 'À ma charge' : 'À refacturer au locataire'}
                </label>
              ))}
            </div>
          </fieldset>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>En validant : la dépense apparaît dans l’onglet Argent, et l’intervention dans l’historique du logement.</span>
          <div className="col-md" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Btn type="submit" size="lg" style={{ height: 52, padding: '0 28px' }}>
              Valider et ranger
            </Btn>
            <Btn variant="ghost" onClick={notInvoice} style={{ color: BAI.ink }}>
              Ce n’est pas une facture
            </Btn>
          </div>
        </form>
      </main>
    </div>
  )
}

function Preview({ docId, mime }: { docId: string; mime: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let u: string | null = null
    pdfUrl(documentPath(docId), { timeout: 60_000 })
      .then((x) => {
        u = x
        setUrl(x)
      })
      .catch(() => setFailed(true))
    return () => {
      if (u) URL.revokeObjectURL(u)
    }
  }, [docId])
  if (failed) return <span style={{ color: BAI.inkSoft }}>Aperçu indisponible.</span>
  if (!url) return <Spinner size={28} />
  if (mime === 'application/pdf') return <iframe title="Facture" src={url} style={{ width: '100%', height: 640, border: 'none', borderRadius: 8, background: BAI.surface }} />
  return <img src={url} alt="Facture" style={{ maxWidth: '100%', maxHeight: 780, borderRadius: 6, background: BAI.surface, transform: 'rotate(-1deg)' }} />
}
