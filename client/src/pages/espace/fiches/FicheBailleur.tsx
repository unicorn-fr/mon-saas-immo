import { useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { FicheLayout, FicheSection, Fields } from '../../../components/FlowLayout'
import { SignaturePad } from '../../../components/media'
import { Callout, Chips, Input, LoadError, Loader, Toggle } from '../../../components/kit'
import { api } from '../../../lib/api'
import { useAuth } from '../../../lib/auth'
import type { LandlordProfile } from '../../../lib/contract'
import { useFiche } from '../../../lib/fiche'
import type { ProfileView } from '../../../lib/space'

/** Profil du bailleur, rempli une seule fois. Maquette « Profil du bailleur ». */
export default function FicheBailleur() {
  const [params] = useSearchParams()
  const back = params.get('retour') || '/espace/compte'
  const { setUser } = useAuth()
  const { file: p, set, completion, save, saveNow, loadError, reload } = useFiche<LandlordProfile>(
    () => api<ProfileView>('/profile').then((v) => ({ file: v.profile, completion: v.completion })),
    async (f) => {
      const v = await api<ProfileView>('/profile', { method: 'PUT', body: f })
      if (v.user) setUser(v.user)
      return { completion: v.completion }
    },
  )
  if (loadError) return <div style={{ padding: 24 }}><LoadError message={loadError} retry={reload} /></div>
  if (!p || !completion) return <Loader />
  const company = p.kind === 'SCI' || p.kind === 'COMPANY'
  const done = (k: string) => completion.steps.find((s) => s.key === k)?.done
  const c = p.company ?? {}
  const agent = p.agent ?? {}
  let n = 0

  return (
    <FicheLayout backTo={back} title="Profil du bailleur" subtitle="Rempli une seule fois, repris dans tous vos documents" completion={completion} save={save} onSave={saveNow}>
      <FicheSection id="kind" guides={['bail']} n={++n} title="Qui loue ?" intro="Le bail doit désigner précisément le propriétaire." reference="loi n° 89-462 du 6 juillet 1989, art. 3 et 10" done={done('kind')}>
        <Chips
          legend="Le bailleur est"
          value={p.kind ?? null}
          onChange={(v) => set({ kind: v })}
          options={[
            { value: 'PERSON', label: 'Une personne' },
            { value: 'COUPLE', label: 'Un couple ou une indivision' },
            { value: 'SCI', label: 'Une SCI' },
            { value: 'COMPANY', label: 'Une autre société' },
          ]}
        />
        {p.kind === 'SCI' ? <Toggle checked={Boolean(p.sciFamily)} onChange={(v) => set({ sciFamily: v })} label="SCI familiale" sub="Associés parents entre eux jusqu’au 4e degré : le bail vide dure alors 3 ans, comme pour un particulier." /> : null}
        <Callout tone="tip">Si c’est une société (SCI non familiale comprise), le bail vide dure 6 ans au lieu de 3. Bailio adapte la durée automatiquement.</Callout>
      </FicheSection>

      <FicheSection id="identity" n={++n} title={company ? 'Qui signe pour la société' : 'Votre identité'} intro="Repris dans le bail, les quittances et les courriers." done={done('identity')}>
        <Chips legend="Civilité" value={p.civility ?? null} onChange={(v) => set({ civility: v })} options={[{ value: 'MADAME', label: 'Madame' }, { value: 'MONSIEUR', label: 'Monsieur' }]} />
        <Fields>
          <Input label="Nom" value={p.lastName} onChange={(v) => set({ lastName: v })} />
          <Input label="Prénoms" value={p.firstNames} onChange={(v) => set({ firstNames: v })} hint="Tous les prénoms, comme sur la pièce d’identité." />
        </Fields>
        <Fields>
          <Input label="Nom d’usage (facultatif)" value={p.usageName} onChange={(v) => set({ usageName: v })} />
          <Input label="Nom de naissance (facultatif)" value={p.birthName} onChange={(v) => set({ birthName: v })} />
        </Fields>
        <Fields>
          <Input label="Date de naissance" type="date" value={p.birthDate} onChange={(v) => set({ birthDate: v || null })} />
          <Input label="Lieu de naissance" value={p.birthPlace} onChange={(v) => set({ birthPlace: v })} />
        </Fields>
        {p.kind === 'COUPLE' ? <CoOwners p={p} set={set} /> : null}
      </FicheSection>

      {company ? (
        <FicheSection id="company" n={++n} title="La société" intro="Le bail doit indiquer la dénomination et le siège de la société, et qui signe pour elle." reference="loi n° 89-462 du 6 juillet 1989, art. 3" done={done('company')}>
          <Fields>
            <Input label="Dénomination" value={c.name} onChange={(v) => set({ company: { ...c, name: v } })} />
            <Input label="Forme" value={c.form} onChange={(v) => set({ company: { ...c, form: v } })} placeholder="SCI, SARL…" />
          </Fields>
          <Fields>
            <Input label="Numéro SIREN" value={c.siren} inputMode="numeric" maxLength={9} onChange={(v) => set({ company: { ...c, siren: v.replace(/\D/g, '') } })} />
            <Input label="Siège social" value={c.seat} onChange={(v) => set({ company: { ...c, seat: v } })} />
          </Fields>
          <Fields>
            <Input label="Représentée par" value={c.representedBy} onChange={(v) => set({ company: { ...c, representedBy: v } })} />
            <Input label="En qualité de" value={c.representativeRole} onChange={(v) => set({ company: { ...c, representativeRole: v } })} placeholder="Gérant" />
          </Fields>
        </FicheSection>
      ) : null}

      <FicheSection id="address" n={++n} title="Votre adresse" reference="loi n° 89-462 du 6 juillet 1989, art. 3" done={done('address')}>
        <Input label="Adresse" value={p.address} onChange={(v) => set({ address: v })} placeholder="8 rue de l’Aiguillerie" />
        <Fields>
          <Input label="Code postal" value={p.postalCode} inputMode="numeric" maxLength={5} onChange={(v) => set({ postalCode: v })} />
          <Input label="Ville" value={p.city} onChange={(v) => set({ city: v })} />
        </Fields>
        <Callout tone="tip">Obligatoire dans le bail : c’est à cette adresse que le locataire vous écrit, par exemple pour donner son congé.</Callout>
      </FicheSection>

      <FicheSection id="contact" n={++n} title="Vous joindre" done={done('contact')}>
        <Fields>
          <Input label="Email" type="email" value={p.email} onChange={(v) => set({ email: v })} hint="Facultatif dans le bail, utile pour les échanges." />
          <Input label="Téléphone" type="tel" value={p.phone} onChange={(v) => set({ phone: v })} />
        </Fields>
      </FicheSection>

      <FicheSection id="agent" guides={['agence']} n={++n} title="Passez-vous par un professionnel ?" reference="loi n° 89-462 du 6 juillet 1989, art. 5" done={done('agent')}>
        <Chips
          legend="Un agent ou un administrateur de biens intervient"
          value={agent.enabled ?? null}
          onChange={(v) => set({ agent: { ...agent, enabled: v } })}
          options={[
            { value: false, label: p.civility === 'MONSIEUR' ? 'Non, je gère seul' : p.civility === 'MADAME' ? 'Non, je gère seule' : 'Non, je gère moi-même' },
            { value: true, label: 'Oui' },
          ]}
        />
        {agent.enabled ? (
          <>
            <Fields>
              <Input label="Nom du mandataire" value={agent.name} onChange={(v) => set({ agent: { ...agent, name: v } })} />
              <Input label="Adresse du mandataire" value={agent.address} onChange={(v) => set({ agent: { ...agent, address: v } })} />
            </Fields>
            <Fields>
              <Input label="Numéro de carte professionnelle" value={agent.cardNumber} onChange={(v) => set({ agent: { ...agent, cardNumber: v } })} />
              <Input label="Délivrée par" value={agent.cardIssuer} onChange={(v) => set({ agent: { ...agent, cardIssuer: v } })} placeholder="CCI de l’Hérault" />
            </Fields>
            <Callout tone="tip">Si un professionnel intervient, ses honoraires et leur plafond doivent figurer dans le bail.</Callout>
          </>
        ) : null}
      </FicheSection>

      <FicheSection id="payment" n={++n} title="Pour être payé" intro="Facultatif. Sert uniquement aux avis d’échéance envoyés au locataire." done={done('payment')}>
        <Fields>
          <Input label="Titulaire du compte" value={p.payment?.holder} onChange={(v) => set({ payment: { ...p.payment, holder: v } })} />
          <Input label="IBAN" value={p.payment?.iban} onChange={(v) => set({ payment: { ...p.payment, iban: v.toUpperCase() } })} hint="Affiché sur les avis d’échéance, jamais dans le bail." />
        </Fields>
      </FicheSection>

      <FicheSection id="signature" n={++n} title="Votre signature" done={done('signature')}>
        <SignaturePad value={p.signature} onChange={(v) => set({ signature: v ?? '' })} label="Signez ici avec la souris ou le doigt" />
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Apposée sur vos quittances. Jamais sur un bail sans votre accord : pour un bail, vous signez à chaque fois.</span>
      </FicheSection>
    </FicheLayout>
  )
}

function CoOwners({ p, set }: { p: LandlordProfile; set: (patch: Partial<LandlordProfile>) => void }) {
  const list = p.coOwners?.length ? p.coOwners : [{}]
  const upd = (i: number, patch: Record<string, string>) => set({ coOwners: list.map((c, j) => (j === i ? { ...c, ...patch } : c)) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Les autres bailleurs</span>
      {list.map((c, i) => (
        <Fields key={i}>
          <Input label="Prénoms" value={c.firstNames} onChange={(v) => upd(i, { firstNames: v })} />
          <Input label="Nom" value={c.lastName} onChange={(v) => upd(i, { lastName: v })} />
        </Fields>
      ))}
      {list.length < 6 ? (
        <button type="button" onClick={() => set({ coOwners: [...list, {}] })} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, color: BAI.owner, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
          + Un autre bailleur
        </button>
      ) : null}
    </div>
  )
}
