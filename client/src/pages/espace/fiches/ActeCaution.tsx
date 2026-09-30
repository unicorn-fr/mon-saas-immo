import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { FicheLayout, FicheSection, Fields } from '../../../components/FlowLayout'
import { Btn, Callout, Chips, Computed, Input, LoadError, Loader, Money, useToast } from '../../../components/kit'
import { api } from '../../../lib/api'
import { fullName, type Guarantor, type TenantFile } from '../../../lib/contract'
import { openDoc } from '../../../lib/docs'
import { dateFr, euros } from '../../../lib/format'
import { useFiche } from '../../../lib/fiche'
import type { LeaseView, TenantView } from '../../../lib/space'

/** Acte de caution du garant d'un locataire. Maquette « Acte de caution ». */
export default function ActeCaution() {
  const { id = '' } = useParams()
  const toast = useToast()
  const [view, setView] = useState<TenantView | null>(null)
  const [lease, setLease] = useState<LeaseView | null>(null)
  const { file: g, set, completion, save, saveNow, flush, loadError, reload } = useFiche<Guarantor>(
    async () => {
      const v = await api<TenantView>(`/tenants/${id}`)
      setView(v)
      if (v.lease) api<LeaseView>(`/leases/${v.lease.id}`).then(setLease).catch(() => undefined)
      const guarantor: Guarantor = v.file.guarantor ?? { engagement: 'SOLIDAIRE', duration: 'OPEN', signMode: 'PAPER' }
      return { file: guarantor, completion: v.guarantorCompletion ?? { steps: [], percent: 0 } }
    },
    async (guarantor) => {
      const body: Partial<TenantFile> = { guarantor, guarantee: 'CAUTION' }
      const r = await api<{ guarantorCompletion: TenantView['guarantorCompletion'] }>(`/tenants/${id}`, { method: 'PUT', body })
      return { completion: r.guarantorCompletion ?? { steps: [], percent: 0 } }
    },
    [id],
  )
  if (loadError) return <div style={{ padding: 24 }}><LoadError message={loadError} retry={reload} /></div>
  if (!g || !completion || !view) return <Loader />
  const done = (k: string) => completion.steps.find((s) => s.key === k)?.done
  const tenant = view.name
  const l = lease
  const rev = l?.terms.revision
  let n = 0

  const preview = async () => {
    if (!view.lease) return toast.show('L’acte de caution s’imprime avec le bail : créez d’abord le bail.', 'error')
    try {
      await flush()
      await openDoc(`/leases/${view.lease.id}/guarantee/${id}.pdf`)
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <FicheLayout
      backTo={`/espace/locataires/${id}`}
      title="Acte de caution"
      subtitle={`${fullName(g) || 'Le garant'} pour ${tenant}`}
      completion={completion}
      save={save}
      onSave={saveNow}
      extraAction={
        <Btn size="sm" variant="outline" onClick={preview} style={{ height: 44 }}>
          Aperçu de l’acte
        </Btn>
      }
    >
      <FicheSection id="guarantor" n={++n} title="Qui se porte caution ?" done={done('guarantor')}>
        <Chips legend="Civilité" value={g.civility ?? null} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
        <Fields>
          <Input label="Nom" value={g.lastName} onChange={(v) => set({ lastName: v })} />
          <Input label="Prénoms" value={g.firstNames} onChange={(v) => set({ firstNames: v })} />
        </Fields>
        <Fields>
          <Input label="Date de naissance" type="date" value={g.birthDate} onChange={(v) => set({ birthDate: v || null })} />
          <Input label="Lieu de naissance" value={g.birthPlace} onChange={(v) => set({ birthPlace: v })} />
        </Fields>
        <Fields>
          <Input label="Lien avec le locataire" value={g.link} onChange={(v) => set({ link: v })} placeholder="Père, mère, ami…" />
          <Input label="Email" type="email" value={g.email} onChange={(v) => set({ email: v })} />
        </Fields>
        <Input label="Adresse" value={g.address} onChange={(v) => set({ address: v })} />
      </FicheSection>

      <FicheSection id="engagement" n={++n} title="Type d’engagement" done={done('engagement')}>
        <Chips legend="Caution" value={g.engagement ?? null} onChange={(v) => set({ engagement: v })} options={[{ value: 'SOLIDAIRE', label: 'Solidaire' }, { value: 'SIMPLE', label: 'Simple' }]} />
        <Callout tone="tip">Solidaire : vous pouvez réclamer au garant dès le premier impayé. Simple : vous devez d’abord poursuivre le locataire.</Callout>
      </FicheSection>

      <FicheSection id="duration" n={++n} title="Durée et plafond" reference="loi n° 89-462 du 6 juillet 1989, art. 22-1" done={done('duration')}>
        <Chips legend="Durée de l’engagement" value={g.duration ?? null} onChange={(v) => set({ duration: v })} options={[{ value: 'FIXED', label: 'Durée déterminée' }, { value: 'OPEN', label: 'Durée indéterminée' }]} />
        {g.duration === 'FIXED' ? <Input label="Jusqu’au" type="date" value={g.until} onChange={(v) => set({ until: v || null })} hint="Par exemple : la fin du bail et un renouvellement." /> : null}
        <Money
          label="Montant maximum garanti"
          cents={g.maxCents}
          onChange={(c) => set({ maxCents: c })}
          hint={l ? `Loyer, charges, révisions et frais sur la durée. Pour 3 ans de loyer et charges : ${euros((l.columns.rentCents + l.columns.chargesCents) * 36)}.` : 'Loyer, charges, révisions et frais sur la durée.'}
        />
        {g.duration === 'OPEN' ? <Callout tone="tip">À durée indéterminée, le garant peut résilier à tout moment ; la résiliation prend effet à la fin du bail en cours.</Callout> : null}
      </FicheSection>

      <FicheSection id="mentions" n={++n} title="Ce que Bailio écrit pour vous" reference="loi n° 89-462 du 6 juillet 1989, art. 22-1 ; Code civil, art. 2297" done={done('mentions')}>
        <Computed
          rows={[
            ['Montant du loyer', l ? `${euros(l.columns.rentCents)} + ${euros(l.columns.chargesCents)} de charges` : 'Repris du bail'],
            ['Conditions de révision', l ? (rev?.enabled === false || !l.computed.revisionAllowed ? 'Pas de révision' : `Chaque ${dateFr(`2000-${rev?.date ?? l.columns.startDate.slice(5)}`, false)}, indice de référence des loyers`) : 'Reprises du bail'],
            ['Mention sur l’étendue de l’engagement', 'Ajoutée'],
            ['Reproduction de l’article 22-1', 'Ajoutée'],
          ]}
        />
        <Callout tone="tip">Le garant écrit lui-même la mention de l’article 2297 du Code civil (montant et durée de son engagement), à la main ou dans la signature électronique. Un exemplaire du bail doit lui être remis.</Callout>
      </FicheSection>

      <FicheSection id="signature" n={++n} title="Signature" done={done('signature')}>
        <Chips legend="Le garant signe" value={g.signMode ?? null} onChange={(v) => set({ signMode: v })} options={[{ value: 'PAPER', label: 'Sur papier, avec le bail' }, { value: 'ELECTRONIC', label: 'Électroniquement' }]} />
        <Input label="Date de signature (une fois signé)" type="date" value={g.signedAt} onChange={(v) => set({ signedAt: v || null })} />
        {!view.lease ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>L’acte s’imprime avec le bail : il sera prêt dès que le bail de {tenant} sera créé.</span> : null}
      </FicheSection>
    </FicheLayout>
  )
}
