import { useEffect, useState } from 'react'
import { Cite } from '../../../components/Sources'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { StepFlow, StepNote, StepTitle, Fields } from '../../../components/FlowLayout'
import { uploadPhotos } from '../../../components/media'
import { Btn, Callout, Chips, ChoiceCard, Input, Known, Loader, Pill, TextLink, errorMessage, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { api } from '../../../lib/api'
import { TENANT_DOCUMENTS, fullName, type TenantDocKey, type TenantFile } from '../../../lib/contract'
import type { PropertySummary, TenantView } from '../../../lib/space'

const LABELS = ['Identité', 'Naissance', 'Contact', 'Logement', 'Garant', 'Justificatifs', 'Terminé']

/** Ajouter un locataire, une question à la fois (maquette « Ajouter un locataire, 7 étapes »). */
export default function AjoutLocataire() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const id = params.get('id')
  const step = Math.min(7, Math.max(1, Number(params.get('etape') ?? 1)))
  const [f, setF] = useState<TenantFile>({})
  const [propertyId, setPropertyId] = useState<string | null>(params.get('logement'))
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<TenantFile>) => setF((x) => ({ ...x, ...patch }))

  useEffect(() => {
    api<PropertySummary[]>('/properties').then(setProperties).catch(() => undefined)
    if (!id) return
    api<TenantView>(`/tenants/${id}`)
      .then((t) => {
        setF(t.file)
        setPropertyId(t.propertyId)
      })
      .catch((e) => toast.error(e))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const goto = (n: number, newId = id) => {
    const next = new URLSearchParams(params)
    if (newId) next.set('id', newId)
    next.set('etape', String(n))
    setParams(next)
    setError(null)
  }

  const next = async () => {
    const problem = validate(step, f)
    if (problem) return setError(problem)
    if (step === 7) {
      navigate(`/espace/baux/nouveau?locataire=${id}${propertyId ? `&logement=${propertyId}` : ''}`)
      return
    }
    setBusy(true)
    try {
      const patch = patchFor(step, f)
      let newId = id
      if (!id) newId = (await api<{ id: string }>('/tenants', { method: 'POST', body: { ...f, ...patch, propertyId } })).id
      else await api(`/tenants/${id}`, { method: 'PUT', body: { ...patch, ...(step === 4 ? { propertyId } : {}) } })
      goto(step + 1, newId)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader />
  const who = f.civility === 'MADAME' ? 'Elle' : f.civility === 'MONSIEUR' ? 'Il' : 'Il ou elle'
  const name = fullName(f) || 'Votre locataire'
  const property = properties.find((p) => p.id === propertyId)

  return (
    <StepFlow
      title="Ajouter un locataire"
      closeTo={id ? `/espace/locataires/${id}` : '/espace/locataires'}
      label={LABELS[step - 1]}
      step={step}
      total={7}
      onBack={step > 1 ? () => goto(step - 1) : undefined}
      onNext={next}
      busy={busy}
      nextLabel={step === 7 ? 'Créer son bail maintenant' : 'Continuer'}
      extra={
        step === 7 ? (
          <Btn variant="ghost" to={`/espace/locataires/${id}`}>
            Voir sa fiche
          </Btn>
        ) : undefined
      }
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      {step === 1 ? (
        <>
          <StepTitle>Comment s’appelle votre locataire ?</StepTitle>
          <Chips big value={f.civility ?? null} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
          <Fields>
            <Input big label="Prénom" value={f.firstNames ?? ''} onChange={(v) => set({ firstNames: v })} autoComplete="off" />
            <Input big label="Nom" value={f.lastName ?? ''} onChange={(v) => set({ lastName: v })} autoComplete="off" />
          </Fields>
          <StepNote>Écrits comme sur sa pièce d’identité, ils figureront dans le bail.</StepNote>
        </>
      ) : null}
      {step === 2 ? (
        <>
          <StepTitle>Sa date et son lieu de naissance</StepTitle>
          <Fields>
            <Input big label="Date de naissance" type="date" value={f.birthDate ?? ''} onChange={(v) => set({ birthDate: v || null })} />
            <Input big label="Ville de naissance" value={f.birthPlace ?? ''} onChange={(v) => set({ birthPlace: v })} />
          </Fields>
          <StepNote>Ils permettent d’identifier précisément le locataire dans le bail.</StepNote>
        </>
      ) : null}
      {step === 3 ? (
        <>
          <StepTitle>Comment le joindre ?</StepTitle>
          <Input big label="Email" type="email" inputMode="email" value={f.email ?? ''} onChange={(v) => set({ email: v })} hint="Pour ses quittances et ses documents. Rien n’est envoyé sans votre accord." />
          <Input big label="Téléphone" type="tel" inputMode="tel" value={f.phone ?? ''} onChange={(v) => set({ phone: v })} />
        </>
      ) : null}
      {step === 4 ? (
        <>
          <StepTitle>Dans quel logement ?</StepTitle>
          {properties.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {properties.map((p) => (
                <ChoiceCard key={p.id} selected={propertyId === p.id} onClick={() => setPropertyId(propertyId === p.id ? null : p.id)} title={p.name} sub={`${p.city ?? ''}${p.city ? ' · ' : ''}${p.status === 'RENTED' ? `loué${p.lease?.tenantName ? ` à ${p.lease.tenantName}` : ''}` : 'disponible'}`} />
              ))}
            </div>
          ) : (
            <StepNote>Vous n’avez pas encore de logement. Vous pourrez le rattacher plus tard.</StepNote>
          )}
          <TextLink to="/espace/logements/nouveau">+ Un autre logement</TextLink>
          <Chips big legend={`${who} loue`} value={f.living ?? null} onChange={(v) => set({ living: v })} options={[{ value: 'ALONE', label: f.civility === 'MONSIEUR' ? 'Seul' : f.civility === 'MADAME' ? 'Seule' : 'Seul(e)' }, { value: 'COUPLE', label: 'En couple' }, { value: 'COLOCATION', label: 'En colocation' }]} />
          {f.living === 'COUPLE' || f.living === 'COLOCATION' ? <CoTenants f={f} set={set} /> : null}
        </>
      ) : null}
      {step === 5 ? <Guarantee f={f} set={set} /> : null}
      {step === 6 ? <Documents f={f} set={set} /> : null}
      {step === 7 ? (
        <>
          <StepTitle>{name} est ajouté{f.civility === 'MADAME' ? 'e' : ''}.</StepTitle>
          <Known items={['Identité et coordonnées', ...(property ? [`Logement : ${property.name}`] : []), ...(f.guarantee === 'CAUTION' && f.guarantor ? [`Garant : ${fullName(f.guarantor)}`] : f.guarantee === 'VISALE' ? ['Garantie Visale'] : []), ...((f.documents ?? []).filter((d) => d.received).length ? [`${(f.documents ?? []).filter((d) => d.received).length} justificatif(s)`] : [])]} />
          <StepNote>Il ne reste que le loyer et la date d’entrée pour créer son bail.</StepNote>
        </>
      ) : null}
    </StepFlow>
  )
}

function validate(step: number, f: TenantFile): string | null {
  if (step === 1 && (!f.lastName?.trim() || !f.firstNames?.trim())) return 'Indiquez le prénom et le nom.'
  if (step === 3 && f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Cette adresse email ne semble pas valide.'
  if (step === 5 && f.guarantee === 'CAUTION' && !f.guarantor?.lastName) return 'Indiquez le nom du garant.'
  return null
}

function patchFor(step: number, f: TenantFile): Partial<TenantFile> {
  switch (step) {
    case 1:
      return { civility: f.civility, firstNames: f.firstNames?.trim(), lastName: f.lastName?.trim() }
    case 2:
      return { birthDate: f.birthDate || null, birthPlace: f.birthPlace }
    case 3:
      return { email: f.email?.trim() ?? '', phone: f.phone }
    case 4:
      return { living: f.living, coTenants: f.living === 'ALONE' ? [] : (f.coTenants ?? []).filter((c) => c.lastName || c.firstNames) }
    case 5:
      return { guarantee: f.guarantee, guarantor: f.guarantee === 'CAUTION' ? { engagement: 'SOLIDAIRE', duration: 'OPEN', signMode: 'PAPER', ...f.guarantor } : f.guarantor, visaleNumber: f.visaleNumber }
    default:
      return { documents: f.documents ?? [] }
  }
}

function CoTenants({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  const list = f.coTenants?.length ? f.coTenants : [{ firstNames: '', lastName: '' }]
  const update = (i: number, patch: Record<string, string>) => set({ coTenants: list.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 15, fontWeight: 600 }}>{f.living === 'COUPLE' ? 'Son ou sa partenaire, qui signe aussi le bail' : 'Les autres colocataires'}</span>
      {list.map((c, i) => (
        <Fields key={i}>
          <Input label="Prénom" value={c.firstNames ?? ''} onChange={(v) => update(i, { firstNames: v })} />
          <Input label="Nom" value={c.lastName ?? ''} onChange={(v) => update(i, { lastName: v })} />
        </Fields>
      ))}
      {f.living === 'COLOCATION' && list.length < 5 ? <TextLink onClick={() => set({ coTenants: [...list, { firstNames: '', lastName: '' }] })}>+ Un autre colocataire</TextLink> : null}
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>Vous pourrez compléter leur fiche ensuite : chaque locataire signataire a sa propre fiche.</span>
    </div>
  )
}

function Guarantee({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  const g = f.guarantor ?? {}
  const full = [g.firstNames, g.lastName].filter(Boolean).join(' ')
  const insurance = f.situation === 'STUDENT' || f.situation === 'APPRENTICE'
  return (
    <>
      <StepTitle>Y a-t-il un garant ?</StepTitle>
      <div className="grid-2" style={{ gap: 14 }}>
        <ChoiceCard column selected={f.guarantee === 'CAUTION'} onClick={() => set({ guarantee: 'CAUTION' })} title="Oui" sub="Une personne se porte caution" />
        <ChoiceCard column selected={f.guarantee === 'NONE'} onClick={() => set({ guarantee: 'NONE' })} title="Non" sub="Pas de garant" />
        <ChoiceCard column selected={f.guarantee === 'VISALE'} onClick={() => set({ guarantee: 'VISALE' })} title="Visale" sub="La garantie gratuite d’Action Logement" />
        <ChoiceCard column selected={f.guarantee === 'GLI'} onClick={() => set({ guarantee: 'GLI' })} title="Assurance" sub="Vous avez une assurance loyers impayés" />
      </div>
      {f.guarantee === 'CAUTION' ? (
        <>
          <Input
            big
            label="Prénom et nom du garant"
            value={full}
            onChange={(v) => {
              const parts = v.trim().split(/\s+/)
              set({ guarantor: { ...g, firstNames: parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '', lastName: parts.length > 1 ? parts[parts.length - 1] : '' } })
            }}
            hint="Le prénom d’abord, puis le nom."
          />
          <Fields>
            <Input big label="Son lien" value={g.link ?? ''} onChange={(v) => set({ guarantor: { ...g, link: v } })} placeholder="Père, mère, ami…" />
            <Input big label="Email du garant" type="email" value={g.email ?? ''} onChange={(v) => set({ guarantor: { ...g, email: v } })} />
          </Fields>
          <Input big label="Adresse du garant" value={g.address ?? ''} onChange={(v) => set({ guarantor: { ...g, address: v } })} />
          <StepNote>Bailio préparera l’acte de caution avec le bail.</StepNote>
        </>
      ) : null}
      {f.guarantee === 'VISALE' ? <Input big label="Numéro de visa Visale" value={f.visaleNumber ?? ''} onChange={(v) => set({ visaleNumber: v })} hint="Il figure sur le visa délivré au locataire." /> : null}
      {f.guarantee === 'GLI' ? <Callout tone="info">Avec une assurance loyers impayés, vous ne pouvez pas demander en plus un garant{insurance ? ', sauf pour un étudiant ou un apprenti' : ', sauf si le locataire est étudiant ou apprenti'} (article 22-1 de la loi du 6 juillet 1989).</Callout> : null}
    </>
  )
}

function Documents({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const docs = f.documents ?? []
  const keys = Object.keys(TENANT_DOCUMENTS) as TenantDocKey[]
  return (
    <>
      <StepTitle>Ses justificatifs</StepTitle>
      <StepNote>Facultatif. Seules les pièces que la loi autorise à demander sont proposées (<Cite reference="décret n° 2015-1437" />).</StepNote>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {keys.map((k) => {
          const d = docs.find((x) => x.category === k)
          return (
            <div key={k} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{TENANT_DOCUMENTS[k]}</span>
              {d?.received ? (
                <Pill tone="green">Reçu</Pill>
              ) : (
                <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  {busy === k ? <Spinner size={14} /> : null}
                  Ajouter
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      if (!file) return
                      setBusy(k)
                      try {
                        const [fileId] = await uploadPhotos([file])
                        set({ documents: [...docs.filter((x) => x.category !== k), { category: k, received: true, fileId, label: file.name.slice(0, 150) }] })
                      } catch (err) {
                        toast.error(err)
                      } finally {
                        setBusy(null)
                      }
                    }}
                  />
                </label>
              )}
            </div>
          )
        })}
      </div>
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Interdit de demander : relevés bancaires, carte vitale, photo d’identité, attestation de bonne tenue de compte, chèque de réservation.</span>
    </>
  )
}
