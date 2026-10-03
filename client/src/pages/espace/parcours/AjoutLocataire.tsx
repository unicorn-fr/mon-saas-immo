import { useEffect, useState } from 'react'
import { Cite } from '../../../components/Sources'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { StepFlow, StepNote, StepTitle, Fields } from '../../../components/FlowLayout'
import { uploadPhotos } from '../../../components/media'
import { Btn, Callout, Chips, ChoiceCard, Input, Known, Loader, Money, Pill, TextLink, errorMessage, useLoad, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { api } from '../../../lib/api'
import { SITUATION_LABEL, TENANT_DOCUMENTS, fullName, type DocEntry, type Situation, type TenantDocKey, type TenantFile } from '../../../lib/contract'
import { openDoc } from '../../../lib/docs'
import { dateNum } from '../../../lib/format'
import type { PropertySummary, TenantView } from '../../../lib/space'

type StepId = 'identity' | 'birth' | 'contact' | 'situation' | 'home' | 'guarantee' | 'guarantor' | 'documents' | 'done'
const LABELS: Record<StepId, string> = {
  identity: 'Identité',
  birth: 'Naissance',
  contact: 'Coordonnées',
  situation: 'Situation et revenus',
  home: 'Logement et occupants',
  guarantee: 'Garantie',
  guarantor: 'Le garant',
  documents: 'Justificatifs',
  done: 'Ce qui manque',
}
const stepsFor = (f: TenantFile): StepId[] => (['identity', 'birth', 'contact', 'situation', 'home', 'guarantee', f.guarantee === 'CAUTION' ? 'guarantor' : null, 'documents', 'done'] as const).filter((x): x is StepId => Boolean(x))

interface FileMissing {
  key: string
  label: string
  who: 'TENANT' | 'GUARANTOR'
  kind: 'INFO' | 'DOCUMENT'
}

/**
 * Ajouter un locataire, une question à la fois : identité, coordonnées, situation et revenus, garant, justificatifs.
 * Ce que vous ne savez pas, vous le demandez au locataire à la fin, par email ou par courrier : il complète
 * lui-même son dossier, sans compte, et tout arrive dans sa fiche.
 */
export default function AjoutLocataire() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const id = params.get('id')
  const [f, setF] = useState<TenantFile>({})
  const [propertyId, setPropertyId] = useState<string | null>(params.get('logement'))
  const [properties, setProperties] = useState<PropertySummary[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Qui remplit le dossier : le propriétaire, ou le locataire lui-même avec un lien (rien à ressaisir ensuite).
  const [mode, setMode] = useState<'SELF' | 'LINK'>('SELF')
  const set = (patch: Partial<TenantFile>) => setF((x) => ({ ...x, ...patch }))
  const steps = stepsFor(f)
  const asked = params.get('etape') as StepId | null
  const current: StepId = asked && steps.includes(asked) ? asked : 'identity'
  const index = steps.indexOf(current)

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

  const goto = (step: StepId, newId = id) => {
    const next = new URLSearchParams(params)
    if (newId) next.set('id', newId)
    next.set('etape', step)
    setParams(next)
    setError(null)
    window.scrollTo(0, 0)
  }

  const invite = async () => {
    if (!f.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return setError('Indiquez l’adresse email de votre locataire : le lien lui sera envoyé.')
    setBusy(true)
    try {
      const created = await api<{ id: string }>('/tenants', { method: 'POST', body: { civility: f.civility, firstNames: f.firstNames, lastName: f.lastName, email: f.email.trim(), propertyId } })
      await api(`/tenants/${created.id}/request`, { method: 'POST' })
      toast.show('Lien envoyé. Votre locataire remplit son dossier lui-même : vous serez prévenu, et vous vérifierez ce qu’il envoie.')
      navigate(`/espace/locataires/${created.id}`, { replace: true })
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const next = async () => {
    if (!id && current === 'identity' && mode === 'LINK') return invite()
    const problem = validate(current, f)
    if (problem) return setError(problem)
    if (current === 'done') {
      navigate(`/espace/baux/nouveau?locataire=${id}${propertyId ? `&logement=${propertyId}` : ''}`)
      return
    }
    setBusy(true)
    try {
      const patch = patchFor(current, f)
      let newId = id
      if (!id) newId = (await api<{ id: string }>('/tenants', { method: 'POST', body: { ...f, ...patch, propertyId } })).id
      else await api(`/tenants/${id}`, { method: 'PUT', body: { ...patch, ...(current === 'home' ? { propertyId } : {}) } })
      const after = stepsFor(f)
      goto(after[after.indexOf(current) + 1], newId)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader />
  const who = f.civility === 'MADAME' ? 'Elle' : f.civility === 'MONSIEUR' ? 'Il' : 'Il ou elle'

  return (
    <StepFlow
      title="Ajouter un locataire"
      closeTo={id ? `/espace/locataires/${id}` : '/espace/locataires'}
      label={LABELS[current]}
      step={index + 1}
      total={steps.length}
      onBack={index > 0 ? () => goto(steps[index - 1]) : undefined}
      onNext={next}
      busy={busy}
      nextLabel={current === 'done' ? 'Préparer son bail' : !id && current === 'identity' && mode === 'LINK' ? 'Envoyer le lien au locataire' : 'Continuer'}
      extra={
        current === 'done' ? (
          <Btn variant="ghost" to={`/espace/locataires/${id}`}>
            Voir sa fiche
          </Btn>
        ) : undefined
      }
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      {current === 'identity' && !id ? (
        <div className="grid-2" style={{ gap: 14 }}>
          <ChoiceCard column selected={mode === 'SELF'} onClick={() => setMode('SELF')} title="Je remplis son dossier" sub="Identité, situation, garant, justificatifs : une question à la fois." />
          <ChoiceCard column selected={mode === 'LINK'} onClick={() => setMode('LINK')} title="Mon locataire le remplit lui-même" sub="Il reçoit un lien par email, sans compte. Vous vérifiez ensuite ce qu’il envoie." />
        </div>
      ) : null}
      {current === 'identity' && !id && mode === 'LINK' ? (
        <>
          <StepTitle>À qui envoyer le lien ?</StepTitle>
          <Input big label="Email du locataire" type="email" inputMode="email" value={f.email ?? ''} onChange={(v) => set({ email: v })} autoFocus />
          <Fields>
            <Input label="Prénom (facultatif)" value={f.firstNames ?? ''} onChange={(v) => set({ firstNames: v })} />
            <Input label="Nom (facultatif)" value={f.lastName ?? ''} onChange={(v) => set({ lastName: v })} />
          </Fields>
          <StepNote>Il remplira exactement les mêmes informations que vous : identité, naissance, coordonnées, situation, foyer, garant et justificatifs. Le lien est valable 30 jours.</StepNote>
        </>
      ) : null}
      {current === 'identity' && (id || mode === 'SELF') ? (
        <>
          <StepTitle>Comment s’appelle votre locataire ?</StepTitle>
          <Chips big value={f.civility ?? null} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
          <Fields>
            <Input big label="Prénom(s)" value={f.firstNames ?? ''} onChange={(v) => set({ firstNames: v })} autoComplete="off" />
            <Input big label="Nom de naissance" value={f.lastName ?? ''} onChange={(v) => set({ lastName: v })} autoComplete="off" />
          </Fields>
          <Input label="Nom d’usage (facultatif)" value={f.usageName ?? ''} onChange={(v) => set({ usageName: v })} hint="Par exemple le nom d’époux ou d’épouse, s’il l’utilise." />
          <StepNote>Écrits comme sur sa pièce d’identité, ils figureront dans le bail.</StepNote>
        </>
      ) : null}
      {current === 'birth' ? (
        <>
          <StepTitle>Sa date et son lieu de naissance</StepTitle>
          <Fields>
            <Input big label="Date de naissance" type="date" value={f.birthDate ?? ''} onChange={(v) => set({ birthDate: v || null })} />
            <Input big label="Lieu de naissance" value={f.birthPlace ?? ''} onChange={(v) => set({ birthPlace: v })} placeholder="Ville (et pays si à l’étranger)" />
          </Fields>
          <StepNote>Ils identifient précisément le locataire dans le bail. Vous ne les avez pas ? Continuez : vous pourrez les lui demander à la fin.</StepNote>
        </>
      ) : null}
      {current === 'contact' ? (
        <>
          <StepTitle>Comment le joindre ?</StepTitle>
          <Input big label="Email" type="email" inputMode="email" value={f.email ?? ''} onChange={(v) => set({ email: v })} hint="Pour lui demander ce qui manque, puis pour ses quittances (avec son accord)." />
          <Input big label="Téléphone" type="tel" inputMode="tel" value={f.phone ?? ''} onChange={(v) => set({ phone: v })} />
          <Input big label="Adresse actuelle" value={f.currentAddress ?? ''} onChange={(v) => set({ currentAddress: v })} hint="Avant son entrée dans le logement. Elle sert pour lui écrire par courrier." />
        </>
      ) : null}
      {current === 'situation' ? (
        <>
          <StepTitle>Sa situation</StepTitle>
          <Chips big legend="Situation professionnelle" value={f.situation ?? null} onChange={(v) => set({ situation: v })} options={(Object.keys(SITUATION_LABEL) as Situation[]).map((k) => ({ value: k, label: SITUATION_LABEL[k] }))} />
          <Fields>
            <Input label={f.situation === 'STUDENT' ? 'Établissement' : 'Employeur ou activité'} value={f.employer ?? ''} onChange={(v) => set({ employer: v })} />
            <Input label="Métier ou formation" value={f.occupation ?? ''} onChange={(v) => set({ occupation: v })} />
          </Fields>
          <Money label="Revenus nets par mois" cents={f.monthlyIncomeCents ?? null} onChange={(c) => set({ monthlyIncomeCents: c })} hint="Salaires, bourses, allocations… Bailio calcule la part du loyer dans ses revenus." />
          <StepNote>Ces informations restent dans votre espace. Elles ne figurent pas dans le bail.</StepNote>
        </>
      ) : null}
      {current === 'home' ? (
        <>
          <StepTitle>Dans quel logement ?</StepTitle>
          {properties.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {properties.map((p) => (
                <ChoiceCard key={p.id} selected={propertyId === p.id} onClick={() => setPropertyId(propertyId === p.id ? null : p.id)} title={p.name} sub={`${p.city ?? ''}${p.city ? ' · ' : ''}${p.status === 'RENTED' ? `loué${p.lease?.tenantName ? ` à ${p.lease.tenantName}` : ''}` : 'disponible'}`} />
              ))}
            </div>
          ) : (
            <StepNote>Vous n’avez pas encore de logement. Ajoutez-le d’abord : le bail a besoin de toutes ses informations.</StepNote>
          )}
          <TextLink to={`/espace/logements/nouveau?retour=locataire`}>+ Un autre logement</TextLink>
          <Chips big legend={`${who} loue`} value={f.living ?? null} onChange={(v) => set({ living: v })} options={[{ value: 'ALONE', label: f.civility === 'MONSIEUR' ? 'Seul' : f.civility === 'MADAME' ? 'Seule' : 'Seul(e)' }, { value: 'COUPLE', label: 'En couple' }, { value: 'COLOCATION', label: 'En colocation' }]} />
          {f.living === 'COUPLE' || f.living === 'COLOCATION' ? <CoTenants f={f} set={set} /> : null}
        </>
      ) : null}
      {current === 'guarantee' ? <Guarantee f={f} set={set} /> : null}
      {current === 'guarantor' ? <GuarantorStep f={f} set={set} /> : null}
      {current === 'documents' ? <Documents f={f} set={set} /> : null}
      {current === 'done' && id ? <Missing tenantId={id} f={f} /> : null}
    </StepFlow>
  )
}

function validate(step: StepId, f: TenantFile): string | null {
  if (step === 'identity' && (!f.lastName?.trim() || !f.firstNames?.trim())) return 'Indiquez le prénom et le nom.'
  if (step === 'contact' && f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Cette adresse email ne semble pas valide.'
  if (step === 'guarantee' && !f.guarantee) return 'Indiquez s’il y a un garant.'
  if (step === 'guarantor' && (!f.guarantor?.lastName?.trim() || !f.guarantor.firstNames?.trim())) return 'Indiquez le prénom et le nom du garant.'
  return null
}

function patchFor(step: StepId, f: TenantFile): Partial<TenantFile> {
  switch (step) {
    case 'identity':
      return { civility: f.civility, firstNames: f.firstNames?.trim(), lastName: f.lastName?.trim(), usageName: f.usageName }
    case 'birth':
      return { birthDate: f.birthDate || null, birthPlace: f.birthPlace }
    case 'contact':
      return { email: f.email?.trim() ?? '', phone: f.phone, currentAddress: f.currentAddress }
    case 'situation':
      return { situation: f.situation, employer: f.employer, occupation: f.occupation, monthlyIncomeCents: f.monthlyIncomeCents }
    case 'home':
      return { living: f.living, coTenants: f.living === 'ALONE' ? [] : (f.coTenants ?? []).filter((c) => c.lastName || c.firstNames) }
    case 'guarantee':
      return { guarantee: f.guarantee, visaleNumber: f.visaleNumber, ...(f.guarantee === 'CAUTION' ? { guarantor: { engagement: 'SOLIDAIRE' as const, duration: 'FIXED' as const, signMode: 'PAPER' as const, ...f.guarantor } } : {}) }
    case 'guarantor':
      return { guarantor: f.guarantor }
    default:
      return { documents: f.documents ?? [], guarantor: f.guarantor }
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
      {f.guarantee === 'CAUTION' ? <StepNote>À l’étape suivante : l’identité du garant et son engagement. Bailio prépare l’acte de caution avec le bail.</StepNote> : null}
      {f.guarantee === 'VISALE' ? <Input big label="Numéro de visa Visale" value={f.visaleNumber ?? ''} onChange={(v) => set({ visaleNumber: v })} hint="Il figure sur le visa délivré au locataire." /> : null}
      {f.guarantee === 'GLI' ? <Callout tone="info">Avec une assurance loyers impayés, vous ne pouvez pas demander en plus un garant{insurance ? ', sauf pour un étudiant ou un apprenti' : ', sauf si le locataire est étudiant ou apprenti'} (article 22-1 de la loi du 6 juillet 1989).</Callout> : null}
    </>
  )
}

function GuarantorStep({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  const g = f.guarantor ?? {}
  const sg = (patch: Partial<NonNullable<TenantFile['guarantor']>>) => set({ guarantor: { ...g, ...patch } })
  return (
    <>
      <StepTitle>Le garant</StepTitle>
      <Chips value={g.civility ?? null} onChange={(v) => sg({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
      <Fields>
        <Input label="Prénom(s)" value={g.firstNames ?? ''} onChange={(v) => sg({ firstNames: v })} />
        <Input label="Nom" value={g.lastName ?? ''} onChange={(v) => sg({ lastName: v })} />
      </Fields>
      <Fields>
        <Input label="Date de naissance" type="date" value={g.birthDate ?? ''} onChange={(v) => sg({ birthDate: v || null })} />
        <Input label="Lieu de naissance" value={g.birthPlace ?? ''} onChange={(v) => sg({ birthPlace: v })} />
      </Fields>
      <Input label="Adresse" value={g.address ?? ''} onChange={(v) => sg({ address: v })} />
      <Fields>
        <Input label="Email" type="email" value={g.email ?? ''} onChange={(v) => sg({ email: v })} hint="Pour signer l’acte de caution en ligne." />
        <Input label="Téléphone" type="tel" value={g.phone ?? ''} onChange={(v) => sg({ phone: v })} />
      </Fields>
      <Fields>
        <Input label="Lien avec le locataire" value={g.link ?? ''} onChange={(v) => sg({ link: v })} placeholder="Père, mère, ami…" />
        <Money label="Revenus nets par mois" cents={g.monthlyIncomeCents ?? null} onChange={(c) => sg({ monthlyIncomeCents: c })} />
      </Fields>
      <span style={{ fontSize: 15, fontWeight: 600, marginTop: 6 }}>Son engagement</span>
      <Chips legend="Type de caution" value={g.engagement ?? 'SOLIDAIRE'} onChange={(v) => sg({ engagement: v })} options={[{ value: 'SOLIDAIRE', label: 'Solidaire' }, { value: 'SIMPLE', label: 'Simple' }]} hint="Solidaire : vous pouvez lui demander de payer dès le premier impayé. Simple : seulement après avoir poursuivi le locataire." />
      <Money label="Montant maximum garanti" cents={g.maxCents ?? null} onChange={(c) => sg({ maxCents: c })} hint="Mention obligatoire de l’acte de caution. Par exemple : loyer et charges sur la durée du bail." />
      <Chips legend="Durée de l’engagement" value={g.duration ?? 'FIXED'} onChange={(v) => sg({ duration: v })} options={[{ value: 'FIXED', label: 'Jusqu’à une date' }, { value: 'OPEN', label: 'Sans date de fin' }]} hint="Sans date de fin, le garant peut résilier à tout moment ; la résiliation prend effet à la fin du bail en cours." />
      {g.duration !== 'OPEN' ? <Input label="Engagement jusqu’au" type="date" value={g.until ?? ''} onChange={(v) => sg({ until: v || null })} /> : null}
      <StepNote>Ce que vous ne savez pas, le garant pourra le compléter lui-même avec le lien envoyé au locataire.</StepNote>
    </>
  )
}

/** Dernière étape : ce qui manque encore, à demander au locataire par email ou par courrier. */
function Missing({ tenantId, f }: { tenantId: string; f: TenantFile }) {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<{ missing: FileMissing[]; link: { url: string; sentAt: string } | null }>(`/tenants/${tenantId}/missing`), [tenantId])
  const [busy, setBusy] = useState(false)
  if (!data) return <Loader />
  const name = fullName(f) || 'Votre locataire'
  if (!data.missing.length)
    return (
      <>
        <StepTitle>Le dossier de {name} est complet.</StepTitle>
        <Known items={['Identité, naissance et coordonnées', 'Situation et revenus', ...(f.guarantee === 'CAUTION' ? ['Garant et justificatifs du garant'] : []), 'Les 5 justificatifs autorisés']} />
      </>
    )
  const send = async () => {
    setBusy(true)
    try {
      await api(`/tenants/${tenantId}/request`, { method: 'POST', body: { send: true } })
      toast.show(`Demande envoyée à ${f.email}.`)
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const infos = data.missing.filter((m) => m.kind === 'INFO')
  const docs = data.missing.filter((m) => m.kind === 'DOCUMENT')
  return (
    <>
      <StepTitle>Il manque encore quelques éléments</StepTitle>
      <StepNote>Demandez-les à {name} : il ou elle les complète en ligne, sans compte, et tout arrive dans sa fiche.</StepNote>
      <div style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {infos.map((m) => (
          <span key={m.key} style={{ fontSize: 15 }}>
            – {m.label}
          </span>
        ))}
        {docs.length ? <span style={{ fontSize: 14, fontWeight: 600, marginTop: 6 }}>Justificatifs</span> : null}
        {docs.map((m) => (
          <span key={m.key} style={{ fontSize: 15 }}>
            – {m.label}
          </span>
        ))}
      </div>
      {data.link ? <Callout tone="info">Demande envoyée le {dateNum(data.link.sentAt)}. Le lien reste valable 30 jours.</Callout> : null}
      <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {f.email ? (
          <Btn variant="outline" onClick={() => void send()} loading={busy}>
            {data.link ? 'Renvoyer la demande par email' : 'Demander par email'}
          </Btn>
        ) : null}
        <Btn variant="outline" onClick={() => void openDoc(`/tenants/${tenantId}/request.pdf`).then(reload).catch(toast.error)}>
          Courrier à imprimer
        </Btn>
      </div>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>Vous pouvez préparer le bail en attendant : il ne sera signé qu’une fois les mentions obligatoires remplies.</span>
    </>
  )
}

const DOC_HINTS: Record<TenantDocKey, string> = {
  identity: 'Carte d’identité, passeport ou titre de séjour',
  home: 'Quittances de loyer, attestation d’hébergement ou taxe foncière',
  activity: 'Contrat de travail, carte d’étudiant, extrait Kbis…',
  taxNotice: 'Dernier ou avant-dernier avis d’imposition ou de non-imposition',
  income: 'Trois derniers bulletins de salaire, bourse, pension, allocations…',
}

function DocList({ docs, onChange }: { docs: DocEntry[]; onChange: (d: DocEntry[]) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState<string | null>(null)
  const keys = Object.keys(TENANT_DOCUMENTS) as TenantDocKey[]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {keys.map((k) => {
        const d = docs.find((x) => x.category === k)
        return (
          <div key={k} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 600 }}>{TENANT_DOCUMENTS[k]}</span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>{DOC_HINTS[k]}</span>
            </span>
            {d?.received ? (
              <Pill tone="green">Reçu</Pill>
            ) : (
              <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
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
                      onChange([...docs.filter((x) => x.category !== k), { category: k, received: true, fileId, label: file.name.slice(0, 150) }])
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
  )
}

function Documents({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  return (
    <>
      <StepTitle>Les justificatifs</StepTitle>
      <StepNote>
        Seules les pièces que la loi autorise à demander sont proposées (<Cite reference="décret n° 2015-1437" />). Vous ne les avez pas encore ? Continuez : vous pourrez les demander au locataire.
      </StepNote>
      <DocList docs={f.documents ?? []} onChange={(documents) => set({ documents })} />
      {f.guarantee === 'CAUTION' ? (
        <>
          <span style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Justificatifs du garant</span>
          <DocList docs={f.guarantor?.documents ?? []} onChange={(documents) => set({ guarantor: { ...f.guarantor, documents } })} />
        </>
      ) : null}
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Interdit de demander : relevés bancaires, carte vitale, photo d’identité, attestation de bonne tenue de compte, chèque de réservation, dossier médical, extrait de casier judiciaire.</span>
    </>
  )
}
