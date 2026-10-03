import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { FicheLayout, FicheSection, Fields } from '../../../components/FlowLayout'
import { uploadPhotos } from '../../../components/media'
import { Btn, Callout, Chips, Input, LoadError, Loader, Money, Pill, TextLink, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { api } from '../../../lib/api'
import { SITUATION_LABEL, TENANT_DOCUMENTS, fullName, type TenantDocKey, type TenantFile } from '../../../lib/contract'
import { openDoc } from '../../../lib/docs'
import { useFiche } from '../../../lib/fiche'
import type { TenantView } from '../../../lib/space'

/** Fiche complète du locataire. Maquette « Fiche du locataire ». */
export default function FicheLocataire() {
  const { id = '' } = useParams()
  const [view, setView] = useState<TenantView | null>(null)
  const { file: f, set, completion, save, saveNow, loadError, reload } = useFiche<TenantFile>(
    () =>
      api<TenantView>(`/tenants/${id}`).then((v) => {
        setView(v)
        return { file: v.file, completion: v.completion }
      }),
    (file) => api<{ completion: TenantView['completion'] }>(`/tenants/${id}`, { method: 'PUT', body: file }),
    [id],
  )
  if (loadError) return <div style={{ padding: 24 }}><LoadError message={loadError} retry={reload} /></div>
  if (!f || !completion || !view) return <Loader />
  const done = (k: string) => completion.steps.find((s) => s.key === k)?.done
  const fem = f.civility === 'MADAME'
  const e = (m: string, w: string) => (fem ? w : m)
  let n = 0

  return (
    <FicheLayout backTo={`/espace/locataires/${id}`} title="Fiche du locataire" subtitle={fullName(f) || undefined} completion={completion} save={save} onSave={saveNow}>
      <FicheSection id="identity" n={++n} title="Identité" intro="Comme sur sa pièce d’identité : c’est ce qui figurera dans le bail." done={done('identity')}>
        <Chips legend="Civilité" value={f.civility ?? null} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
        <Fields>
          <Input label="Nom" value={f.lastName} onChange={(v) => set({ lastName: v })} />
          <Input label="Prénoms" value={f.firstNames} onChange={(v) => set({ firstNames: v })} />
        </Fields>
        <Fields>
          <Input label="Nom d’usage (facultatif)" value={f.usageName} onChange={(v) => set({ usageName: v })} />
          <Input label="Date de naissance" type="date" value={f.birthDate} onChange={(v) => set({ birthDate: v || null })} />
        </Fields>
        <Input label="Lieu de naissance" value={f.birthPlace} onChange={(v) => set({ birthPlace: v })} />
      </FicheSection>

      <FicheSection id="contact" n={++n} title="Coordonnées" done={done('contact')}>
        <Fields>
          <Input label="Email" type="email" value={f.email} onChange={(v) => set({ email: v })} />
          <Input label="Téléphone" type="tel" value={f.phone} onChange={(v) => set({ phone: v })} />
        </Fields>
        <Input label="Adresse actuelle" value={f.currentAddress} onChange={(v) => set({ currentAddress: v })} hint="Jusqu’à son entrée dans les lieux." />
      </FicheSection>

      <FicheSection id="situation" n={++n} title="Situation" intro="Sert à vous proposer le bon type de bail et à vérifier la part du loyer dans les revenus. Rien de cela ne figure dans le bail." done={done('situation')}>
        <Chips
          legend="Situation"
          value={f.situation ?? null}
          onChange={(v) => set({ situation: v })}
          options={(Object.keys(SITUATION_LABEL) as Array<keyof typeof SITUATION_LABEL>).map((k) => ({ value: k, label: fem ? SITUATION_LABEL[k].replace(/é$/, 'ée').replace(/Indépendant$/, 'Indépendante').replace(/Étudiant$/, 'Étudiante').replace(/Apprenti$/, 'Apprentie') : SITUATION_LABEL[k] }))}
        />
        <Fields>
          <Input label={f.situation === 'STUDENT' ? 'Établissement' : 'Employeur ou activité'} value={f.employer} onChange={(v) => set({ employer: v })} />
          <Input label="Métier ou formation" value={f.occupation} onChange={(v) => set({ occupation: v })} />
        </Fields>
        <Money label="Revenus nets par mois" cents={f.monthlyIncomeCents ?? null} onChange={(c) => set({ monthlyIncomeCents: c })} hint="Ne figure pas dans le bail." />
        <Callout tone="tip">{e('Étudiant', 'Étudiante')} : un bail meublé de 9 mois non reconduit est possible. Formation, stage, mission temporaire : le bail mobilité de 1 à 10 mois devient possible.</Callout>
      </FicheSection>

      <FicheSection id="colocation" guides={['colocation']} n={++n} title="Colocation" reference="loi n° 89-462 du 6 juillet 1989, art. 8-1" done={done('colocation')}>
        <Chips legend={`${e('Il', 'Elle')} loue`} value={f.living ?? null} onChange={(v) => set({ living: v })} options={[{ value: 'ALONE', label: e('Seul', 'Seule') }, { value: 'COUPLE', label: 'En couple' }, { value: 'COLOCATION', label: 'En colocation' }]} />
        {f.living === 'COUPLE' || f.living === 'COLOCATION' ? (
          <>
            {(f.coTenants?.length ? f.coTenants : [{}]).map((c, i, list) => (
              <Fields key={i}>
                <Input label={`${f.living === 'COUPLE' ? 'Co-titulaire' : `Colocataire ${i + 2}`} : prénom`} value={c.firstNames} onChange={(v) => set({ coTenants: list.map((x, j) => (j === i ? { ...x, firstNames: v } : x)) })} />
                <Input label="Nom" value={c.lastName} onChange={(v) => set({ coTenants: list.map((x, j) => (j === i ? { ...x, lastName: v } : x)) })} />
                <Input label="Email" type="email" value={c.email} onChange={(v) => set({ coTenants: list.map((x, j) => (j === i ? { ...x, email: v } : x)) })} />
              </Fields>
            ))}
            {f.living === 'COLOCATION' && (f.coTenants?.length ?? 1) < 5 ? <TextLink onClick={() => set({ coTenants: [...(f.coTenants?.length ? f.coTenants : [{}]), {}] })}>+ Un autre colocataire</TextLink> : null}
            <Callout tone="tip">Colocation en bail unique : Bailio ajoute la clause de solidarité et limite sa durée en cas de départ d’un colocataire, comme la loi le prévoit.</Callout>
          </>
        ) : null}
      </FicheSection>

      <FicheSection id="guarantee" guides={['caution', 'visale']} n={++n} title="Garantie" reference="loi n° 89-462 du 6 juillet 1989, art. 22-1" done={done('guarantee')}>
        <Chips
          legend="Quelle garantie ?"
          value={f.guarantee ?? null}
          onChange={(v) => set({ guarantee: v, ...(v === 'CAUTION' && !f.guarantor ? { guarantor: { engagement: 'SOLIDAIRE', duration: 'OPEN', signMode: 'PAPER' } } : {}) })}
          options={[
            { value: 'CAUTION', label: 'Une personne se porte caution' },
            { value: 'VISALE', label: 'Garantie Visale' },
            { value: 'GLI', label: 'Assurance loyers impayés (propriétaire)' },
            { value: 'NONE', label: 'Aucune' },
          ]}
        />
        {f.guarantee === 'VISALE' ? <Input label="Numéro de visa Visale" value={f.visaleNumber} onChange={(v) => set({ visaleNumber: v })} /> : null}
        <Input label="Lien DossierFacile (facultatif)" value={f.dossierFacileUrl ?? ''} onChange={(v) => set({ dossierFacileUrl: v.trim() || null })} placeholder="https://locataire.dossierfacile.logement.gouv.fr/…" hint="Le dossier gratuit de l’État, avec des pièces déjà vérifiées." />
        {f.guarantee === 'CAUTION' ? (
          <Fields>
            <Input label="Prénoms du garant" value={f.guarantor?.firstNames} onChange={(v) => set({ guarantor: { ...f.guarantor, firstNames: v } })} />
            <Input label="Nom du garant" value={f.guarantor?.lastName} onChange={(v) => set({ guarantor: { ...f.guarantor, lastName: v } })} />
          </Fields>
        ) : null}
        <Callout tone="tip">Si vous avez souscrit une assurance loyers impayés, vous ne pouvez pas exiger en plus une caution, sauf si le locataire est étudiant ou apprenti.</Callout>
        {f.guarantee === 'CAUTION' ? (
          <div>
            <Btn variant="outline" to={`/espace/locataires/${id}/caution`}>
              Compléter l’acte de caution{f.guarantor?.lastName ? ` de ${fullName(f.guarantor)}` : ''}
            </Btn>
          </div>
        ) : null}
      </FicheSection>

      <FicheSection id="documents" guides={['justificatifs']} n={++n} title="Justificatifs" intro="Uniquement les documents que la loi vous autorise à demander." reference="Décret n° 2015-1437 du 5 novembre 2015" done={done('documents')}>
        <DocList f={f} set={set} />
        <Callout tone="warn">Interdit de demander : photo d’identité, carte Vitale, relevés de compte, attestation de bonne tenue de compte, dossier médical, extrait de casier judiciaire, chèque de réservation.</Callout>
      </FicheSection>

      <FicheSection id="insurance" guides={['assurance']} n={++n} title="Assurance habitation" reference="loi n° 89-462 du 6 juillet 1989, art. 7" done={done('insurance')}>
        <Fields>
          <Input label="Assureur" value={f.insurance?.insurer} onChange={(v) => set({ insurance: { ...f.insurance, insurer: v } })} />
          <Input label="Échéance de l’attestation" type="date" value={f.insurance?.expiresAt} onChange={(v) => set({ insurance: { ...f.insurance, expiresAt: v || null } })} />
        </Fields>
        <FileSlot label="Attestation d’assurance" sub="À fournir à la remise des clés, puis chaque année" fileId={f.insurance?.fileId} onFile={(fileId) => set({ insurance: { ...f.insurance, fileId } })} />
        <Callout tone="tip">Bailio la redemande chaque année. Sans attestation un mois après une relance, vous pouvez assurer le logement pour son compte et lui refacturer le coût.</Callout>
      </FicheSection>

      <FicheSection id="departure" n={++n} title="Après son départ" done={done('departure')}>
        <Input label="Nouvelle adresse" value={f.newAddress} onChange={(v) => set({ newAddress: v })} hint="Demandée à l’état des lieux de sortie. Obligatoire pour lui restituer le dépôt de garantie." />
      </FicheSection>
    </FicheLayout>
  )
}

function DocList({ f, set }: { f: TenantFile; set: (p: Partial<TenantFile>) => void }) {
  const docs = f.documents ?? []
  const keys = Object.keys(TENANT_DOCUMENTS) as TenantDocKey[]
  const upd = (k: TenantDocKey, patch: Partial<{ label: string; received: boolean; fileId: string | null }>) => {
    const cur = docs.find((d) => d.category === k) ?? { category: k, received: false }
    set({ documents: [...docs.filter((d) => d.category !== k), { ...cur, ...patch }] })
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {keys.map((k) => {
        const d = docs.find((x) => x.category === k)
        return (
          <div key={k} className="col-md" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
            <span style={{ fontSize: 15, fontWeight: 600, width: 220, flexShrink: 0 }}>{TENANT_DOCUMENTS[k]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input label="Document fourni" value={d?.label} onChange={(v) => upd(k, { label: v })} placeholder={k === 'income' ? '3 derniers bulletins de salaire' : k === 'identity' ? 'Carte d’identité' : ''} />
            </div>
            <FileSlot compact label="" fileId={d?.fileId} onFile={(fileId) => upd(k, { fileId, received: true })} />
            <button type="button" aria-pressed={Boolean(d?.received)} onClick={() => upd(k, { received: !d?.received })} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <Pill tone={d?.received ? 'green' : 'muted'}>{d?.received ? 'Reçu' : 'À recevoir'}</Pill>
            </button>
          </div>
        )
      })}
    </div>
  )
}

/** Dépôt d'un fichier (photo ou PDF) rattaché à la fiche ; « Voir » l'ouvre. */
function FileSlot({ label, sub, fileId, onFile, compact }: { label: string; sub?: string; fileId?: string | null; onFile: (id: string) => void; compact?: boolean }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, ...(compact ? {} : { background: BAI.bg, border: `1px solid ${BAI.divider}`, borderRadius: 14, padding: '12px 14px' }) }}>
      {label ? (
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
          {sub ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{sub}</span> : null}
        </span>
      ) : null}
      <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {fileId ? (
          <TextLink style={{ fontSize: 14 }} onClick={() => openDoc(`/files/${fileId}`).catch(toast.error)}>
            Voir
          </TextLink>
        ) : null}
        <label style={{ color: BAI.owner, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          {busy ? <Spinner size={14} /> : null}
          {fileId ? 'Remplacer' : 'Ajouter'}
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              setBusy(true)
              try {
                const [id] = await uploadPhotos([file])
                onFile(id)
              } catch (err) {
                toast.error(err)
              } finally {
                setBusy(false)
              }
            }}
          />
        </label>
      </span>
    </div>
  )
}
