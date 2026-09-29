import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AddressField } from '../../components/AddressField'
import { StepNav, TunnelLayout } from '../../components/TunnelLayout'
import { Button, Notice, TextField, display } from '../../components/ui'
import { ApiError, openPdfFrom, pdfUrl } from '../../lib/api'
import { useDraft } from '../../lib/draft'
import { centsToInput, dateFr, durationLabel, euros, maxDepositCents, parseEuros, typeLabel } from '../../lib/lease'
import type { DraftData, LeaseType } from '../../lib/types'
import { DpeWarning } from './LogementStep'

type Key = 'type' | 'logement' | 'bailleur' | 'locataire' | 'loyer' | 'debut'

const fullName = (p?: { firstName?: string; lastName?: string } | null) => [p?.firstName, p?.lastName].filter(Boolean).join(' ')
const TODO = <span style={{ color: BAI.error }}>À compléter</span>

/** Ce qui manque encore pour générer le bail. */
export function missingFields(d: DraftData): string[] {
  const m: string[] = []
  if (!d.type) m.push('le type de location')
  if (!d.property?.address || !d.property.surface || !d.property.rooms) m.push('le logement')
  if (!d.landlord?.firstName || !d.landlord.lastName || !d.landlord.address) m.push('vos coordonnées')
  if (!d.tenants?.length || d.tenants.some((t) => !t.firstName || !t.lastName)) m.push('le locataire')
  if (!d.rent?.rentCents) m.push('le loyer')
  if (!d.rent?.startDate) m.push("la date d'entrée")
  return m
}

function Row({ label, value, editing, onEdit, children }: { label: string; value: ReactNode; editing: boolean; onEdit: () => void; children: ReactNode }) {
  return (
    <div style={{ padding: '16px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div className="stack" style={{ gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>{label}</span>
          <span style={{ fontSize: 17, fontWeight: 600, overflowWrap: 'anywhere' }}>{value}</span>
        </div>
        {!editing ? (
          <button type="button" onClick={onEdit} style={{ background: 'none', border: 'none', color: BAI.owner, fontSize: 14, fontWeight: 600, padding: 8, flexShrink: 0 }} aria-label={`Modifier : ${label}`}>
            Modifier
          </button>
        ) : null}
      </div>
      {editing ? <div className="stack" style={{ gap: 14, marginTop: 14 }}>{children}</div> : null}
    </div>
  )
}

function EditActions({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <Button height={48} onClick={onSave}>
        Enregistrer
      </Button>
      <Button height={48} variant="ghost" onClick={onCancel}>
        Annuler
      </Button>
    </div>
  )
}

export default function RelectureStep() {
  const { data, update, flush, ready } = useDraft()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Key | null>(null)
  const [form, setForm] = useState<DraftData>(data)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ready && !data.type && data.source !== 'import') navigate('/commencer', { replace: true })
  }, [ready, data.type, data.source, navigate])

  const edit = (k: Key) => {
    setForm(data)
    setEditing(k)
  }
  const commit = (patch: Partial<DraftData>) => {
    update(patch)
    setEditing(null)
  }

  const type: LeaseType = data.type ?? 'UNFURNISHED'
  const p = data.property ?? {}
  const r = data.rent ?? {}
  const tenants = data.tenants ?? []
  const missing = missingFields(data)
  const imported = data.source === 'import'
  const maxDeposit = r.rentCents ? maxDepositCents(type, r.rentCents) : undefined
  const depositTooHigh = r.depositCents !== undefined && maxDeposit !== undefined && r.depositCents > maxDeposit

  async function preview() {
    setError(null)
    setPdfLoading(true)
    try {
      await openPdfFrom(async () => {
        await flush()
        return pdfUrl('/drafts/current/preview.pdf', { draft: true })
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Aperçu indisponible.')
    } finally {
      setPdfLoading(false)
    }
  }

  async function confirm() {
    if (missing.length) {
      setError(`Il manque encore ${missing.join(', ')}.`)
      return
    }
    await flush()
    navigate('/commencer/recevoir')
  }

  const setF = (patch: Partial<DraftData>) => setForm((f) => ({ ...f, ...patch }))
  const fp = form.property ?? {}
  const fr = form.rent ?? {}

  return (
    <TunnelLayout step="relecture" width={1100}>
      <div className="split" style={{ alignItems: 'flex-start' }}>
        <div className="stack" style={{ flex: 1, gap: 24, minWidth: 0, width: '100%' }}>
          <h1 style={display('clamp(40px, 5vw, 56px)')}>Tout est bon ?</h1>
          <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid }}>
            {imported ? 'Voici ce que nous avons lu dans votre bail. Vérifiez chaque ligne.' : "Un dernier coup d'œil. Vous pourrez encore modifier après."}
          </p>
          {imported && depositTooHigh ? (
            <Notice tone="warning">Le dépôt de garantie indiqué ({euros(r.depositCents)}) dépasse le maximum légal ({euros(maxDeposit)}). Le surplus devra être rendu au locataire.</Notice>
          ) : null}
          <DpeWarning dpeClass={p.dpeClass} />

          <div className="stack">
            <Row label="Type" value={data.type ? typeLabel(type) : TODO} editing={editing === 'type'} onEdit={() => edit('type')}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {(['UNFURNISHED', 'FURNISHED'] as LeaseType[]).map((t) => (
                  <Button key={t} height={48} variant={t === (form.type ?? type) ? 'primary' : 'light'} onClick={() => setF({ type: t })}>
                    {typeLabel(t)}
                  </Button>
                ))}
              </div>
              <EditActions onSave={() => commit({ type: form.type ?? type })} onCancel={() => setEditing(null)} />
            </Row>

            <Row
              label="Logement"
              value={p.address ? `${p.address}${p.surface ? ` · ${String(p.surface).replace('.', ',')} m²` : ''}${p.rooms ? ` · ${p.rooms} pièce${p.rooms > 1 ? 's' : ''}` : ''}` : TODO}
              editing={editing === 'logement'}
              onEdit={() => edit('logement')}
            >
              <AddressField
                label="Adresse"
                value={fp.address ?? ''}
                onChange={(v) => setF({ property: { ...fp, address: v, banId: undefined } })}
                onSelect={(s) => setF({ property: { ...fp, address: s.label, postalCode: s.postalCode, city: s.city, inseeCode: s.inseeCode, banId: s.banId } })}
              />
              <div style={{ display: 'flex', gap: 16 }}>
                <TextField label="Surface" name="e-surface" inputMode="decimal" suffix="m²" value={fp.surface ? String(fp.surface).replace('.', ',') : ''} onChange={(e) => setF({ property: { ...fp, surface: Number(e.target.value.replace(',', '.')) || undefined } })} />
                <TextField label="Pièces principales" name="e-rooms" inputMode="numeric" value={fp.rooms ? String(fp.rooms) : ''} onChange={(e) => setF({ property: { ...fp, rooms: Number(e.target.value.replace(/\D/g, '')) || undefined } })} />
              </div>
              <EditActions onSave={() => commit({ property: fp })} onCancel={() => setEditing(null)} />
            </Row>

            <Row label="Propriétaire" value={data.landlord?.firstName ? `${fullName(data.landlord)}${data.landlord.address ? ` · ${data.landlord.address}` : ''}` : TODO} editing={editing === 'bailleur'} onEdit={() => edit('bailleur')}>
              <div style={{ display: 'flex', gap: 16 }}>
                <TextField label="Prénom" name="e-lfirst" value={form.landlord?.firstName ?? ''} onChange={(e) => setF({ landlord: { ...form.landlord, firstName: e.target.value } })} />
                <TextField label="Nom" name="e-llast" value={form.landlord?.lastName ?? ''} onChange={(e) => setF({ landlord: { ...form.landlord, lastName: e.target.value } })} />
              </div>
              <AddressField label="Votre adresse" value={form.landlord?.address ?? ''} onChange={(v) => setF({ landlord: { ...form.landlord, address: v } })} onSelect={(s) => setF({ landlord: { ...form.landlord, address: s.label } })} />
              <EditActions onSave={() => commit({ landlord: form.landlord })} onCancel={() => setEditing(null)} />
            </Row>

            <Row
              label={tenants.length > 1 ? 'Locataires' : 'Locataire'}
              value={tenants.length && tenants[0].firstName ? `${tenants.map(fullName).join(', ')}${data.guarantor ? ` · garant : ${fullName(data.guarantor)}` : ''}` : TODO}
              editing={editing === 'locataire'}
              onEdit={() => edit('locataire')}
            >
              {(form.tenants?.length ? form.tenants : [{}]).map((t, i) => (
                <div key={i} className="col-md" style={{ display: 'flex', gap: 12 }}>
                  <TextField label={i === 0 ? 'Prénom' : `Prénom (colocataire ${i + 1})`} name={`e-t${i}f`} value={t.firstName ?? ''} onChange={(e) => setF({ tenants: (form.tenants?.length ? form.tenants : [{}]).map((x, j) => (j === i ? { ...x, firstName: e.target.value } : x)) })} />
                  <TextField label="Nom" name={`e-t${i}l`} value={t.lastName ?? ''} onChange={(e) => setF({ tenants: (form.tenants?.length ? form.tenants : [{}]).map((x, j) => (j === i ? { ...x, lastName: e.target.value } : x)) })} />
                  <TextField label="Email" name={`e-t${i}e`} type="email" value={t.email ?? ''} onChange={(e) => setF({ tenants: (form.tenants?.length ? form.tenants : [{}]).map((x, j) => (j === i ? { ...x, email: e.target.value } : x)) })} />
                </div>
              ))}
              <Link to="/commencer/personnes" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                Ajouter ou retirer un colocataire, un garant
              </Link>
              <EditActions onSave={() => commit({ tenants: form.tenants })} onCancel={() => setEditing(null)} />
            </Row>

            <Row
              label="Loyer"
              value={r.rentCents ? `${euros(r.rentCents)} + ${euros(r.chargesCents ?? 0)} de charges · dépôt ${euros(r.depositCents ?? maxDeposit)}` : TODO}
              editing={editing === 'loyer'}
              onEdit={() => edit('loyer')}
            >
              <div className="col-md" style={{ display: 'flex', gap: 12 }}>
                <TextField label="Loyer hors charges" name="e-rent" inputMode="decimal" suffix="€" value={centsToInput(fr.rentCents)} onChange={(e) => setF({ rent: { ...fr, rentCents: parseEuros(e.target.value) } })} />
                <TextField label="Charges" name="e-charges" inputMode="decimal" suffix="€" value={centsToInput(fr.chargesCents)} onChange={(e) => setF({ rent: { ...fr, chargesCents: parseEuros(e.target.value) ?? 0 } })} />
                <TextField label="Dépôt de garantie" name="e-deposit" inputMode="decimal" suffix="€" value={centsToInput(fr.depositCents)} placeholder={centsToInput(fr.rentCents ? maxDepositCents(form.type ?? type, fr.rentCents) : undefined)} onChange={(e) => setF({ rent: { ...fr, depositCents: parseEuros(e.target.value) } })} />
              </div>
              <EditActions onSave={() => commit({ rent: fr })} onCancel={() => setEditing(null)} />
            </Row>

            <Row
              label="Début"
              value={r.startDate ? `${dateFr(r.startDate)}, pour ${durationLabel(type)} · paiement le ${r.paymentDay ?? 5}` : TODO}
              editing={editing === 'debut'}
              onEdit={() => edit('debut')}
            >
              <div style={{ display: 'flex', gap: 12 }}>
                <TextField label="Date d'entrée" name="e-start" type="date" value={fr.startDate ?? ''} onChange={(e) => setF({ rent: { ...fr, startDate: e.target.value } })} />
                <TextField label="Jour de paiement" name="e-day" inputMode="numeric" value={String(fr.paymentDay ?? 5)} onChange={(e) => setF({ rent: { ...fr, paymentDay: Math.min(28, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)) } })} />
              </div>
              <EditActions onSave={() => commit({ rent: fr })} onCancel={() => setEditing(null)} />
            </Row>
          </div>

          {error ? <Notice tone="warning">{error}</Notice> : null}
          <StepNav back={imported ? '/importer' : '/commencer/loyer'} next={confirm} nextLabel={imported ? 'Tout est correct' : 'Mon bail est correct'} />
        </div>

        {!imported ? (
          <aside className="stack full-md" style={{ width: 420, flexShrink: 0, background: BAI.surface, borderRadius: 6, padding: '40px 36px', gap: 12, boxShadow: '0 16px 40px rgba(26,26,46,0.10)' }} aria-label="Aperçu du bail">
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: BAI.inkSoft, textAlign: 'center' }}>Contrat de location</div>
            <div style={{ fontFamily: BAI.fontDisplay, fontWeight: 700, fontSize: 24, textAlign: 'center', lineHeight: 1.1 }}>
              Logement {type === 'FURNISHED' ? 'meublé' : 'vide'} à usage de résidence principale
            </div>
            <div style={{ height: 1, background: BAI.rule, margin: '6px 0' }} />
            {[
              ['I. Les parties', `Le bailleur : ${fullName(data.landlord) || '…'}. ${tenants.length > 1 ? 'Les locataires' : 'Le locataire'} : ${tenants.map(fullName).filter(Boolean).join(', ') || '…'}.`],
              ['II. Le logement', `${p.address ?? '…'}. ${p.rooms ? `${p.rooms} pièce${p.rooms > 1 ? 's' : ''}` : ''}${p.surface ? `, ${String(p.surface).replace('.', ',')} m²` : ''}.`],
              ['III. Durée', r.startDate ? `${durationLabel(type)} à compter du ${dateFr(r.startDate)}.` : '…'],
              ['IV. Conditions financières', r.rentCents ? `Loyer de ${euros(r.rentCents)} et ${euros(r.chargesCents ?? 0)} de charges par mois.` : '…'],
            ].map(([t, v]) => (
              <div key={t} className="stack" style={{ gap: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{t}</div>
                <div style={{ fontSize: 12, color: BAI.inkMid, lineHeight: 1.5 }}>{v}</div>
              </div>
            ))}
            <div style={{ height: 8, background: BAI.skeleton, borderRadius: 2 }} />
            <div style={{ height: 8, background: BAI.skeleton, borderRadius: 2, width: '80%' }} />
            <Button variant="outline" height={48} loading={pdfLoading} disabled={missing.length > 0} onClick={preview} style={{ marginTop: 12 }}>
              Voir le bail complet
            </Button>
          </aside>
        ) : null}
      </div>
    </TunnelLayout>
  )
}
