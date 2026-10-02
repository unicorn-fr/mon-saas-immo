import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { Fields, StepFlow, StepNote, StepTitle } from '../../../components/FlowLayout'
import { Btn, Callout, Chips, ChoiceCard, Input, Known, Loader, Money, Pill, Select, TextArea, TextLink, Toggle, errorMessage, useToast } from '../../../components/kit'
import { api } from '../../../lib/api'
import { KIND_LABEL, MOBILITY_REASONS, fullName, type LeaseKind, type LeaseTerms } from '../../../lib/contract'
import { openDoc, printDoc } from '../../../lib/docs'
import { dateFr, euros } from '../../../lib/format'
import type { LeaseBlocker, LeaseView, ProfileView, PropertySummary, PropertyView, TenantSummary } from '../../../lib/space'

const LABELS = ['Logement', 'Locataire', 'Déjà prêt', 'Date', 'Loyer', 'Avant', 'Clauses', 'Prêt']

/**
 * Créer un bail (maquette « Créer un bail, 8 étapes ») : Bailio reprend les fiches du logement,
 * du locataire et du bailleur, et ne demande que ce qu'il ne sait pas. Le bail est créé en brouillon
 * dès que le logement et le locataire sont choisis, puis complété à chaque étape.
 */
export default function CreationBail() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const id = params.get('id')
  const step = Math.min(8, Math.max(1, Number(params.get('etape') ?? 1)))
  const [properties, setProperties] = useState<PropertySummary[] | null>(null)
  const [tenants, setTenants] = useState<TenantSummary[] | null>(null)
  const [propertyId, setPropertyId] = useState<string | null>(params.get('logement'))
  const [tenantIds, setTenantIds] = useState<string[]>(params.get('locataire') ? [params.get('locataire')!] : [])
  const [lease, setLease] = useState<LeaseView | null>(null)
  const [terms, setTerms] = useState<LeaseTerms>({})
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setT = (patch: Partial<LeaseTerms>) => setTerms((t) => ({ ...t, ...patch }))
  // L'ordre est imposé : logement complet, puis locataire, puis le bail.
  const [propertyBlockers, setPropertyBlockers] = useState<LeaseBlocker[] | null>(null)
  const [tenantBlockers, setTenantBlockers] = useState<Record<string, TenantBlocker[]>>({})
  useEffect(() => {
    setPropertyBlockers(null)
    if (!propertyId) return
    api<PropertyView>(`/properties/${propertyId}`)
      .then((p) => setPropertyBlockers(p.leaseMissing ?? []))
      .catch(() => setPropertyBlockers([]))
  }, [propertyId])
  const tenantKey = tenantIds.join(',')
  useEffect(() => {
    Promise.all(tenantIds.map((t) => api<{ forLease: TenantBlocker[] }>(`/tenants/${t}/missing`).then((r) => [t, r.forLease] as const)))
      .then((rows) => setTenantBlockers(Object.fromEntries(rows)))
      .catch(() => setTenantBlockers({}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKey])

  useEffect(() => {
    api<PropertySummary[]>('/properties').then(setProperties).catch((e) => toast.error(e))
    api<TenantSummary[]>('/tenants').then(setTenants).catch((e) => toast.error(e))
    api<ProfileView>('/profile').then(setProfile).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Un seul logement, ou un seul locataire pour ce logement : il est déjà choisi, rien à refaire.
  useEffect(() => {
    if (id) return
    if (!propertyId && properties?.length === 1) setPropertyId(properties[0].id)
  }, [id, properties, propertyId])
  useEffect(() => {
    if (id || tenantIds.length || !tenants) return
    const forProperty = tenants.filter((t) => !t.leaseId && t.property?.id === propertyId)
    const free = tenants.filter((t) => !t.leaseId)
    const candidates = forProperty.length ? forProperty : free.length === 1 ? free : []
    if (candidates.length === 1) setTenantIds([candidates[0].id])
  }, [id, tenants, propertyId, tenantIds.length])

  useEffect(() => {
    if (!id) return
    api<LeaseView>(`/leases/${id}`)
      .then((l) => {
        setLease(l)
        setTerms(l.terms)
        setPropertyId(l.property.id)
        setTenantIds(l.tenantIds)
      })
      .catch((e) => toast.error(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const goto = (n: number, newId = id) => {
    const next = new URLSearchParams(params)
    if (newId) next.set('id', newId)
    next.set('etape', String(n))
    setParams(next)
    setError(null)
  }

  const putTerms = async (patch: Partial<LeaseTerms> & { tenantIds?: string[] }) => {
    const v = await api<LeaseView>(`/leases/${id}/terms`, { method: 'PUT', body: patch })
    setLease(v)
    setTerms(v.terms)
    return v
  }

  const next = async () => {
    setError(null)
    try {
      setBusy(true)
      switch (step) {
        case 1:
          if (!propertyId) throw new Error('Choisissez le logement.')
          if (propertyBlockers?.length) throw new Error('Complétez d’abord le logement : le bail reprend toutes ses informations.')
          if (id && lease && lease.property.id !== propertyId) throw new Error('Le logement d’un bail en préparation ne peut pas changer. Créez un autre bail.')
          goto(2)
          return
        case 2: {
          if (!tenantIds.length) throw new Error('Choisissez au moins un locataire.')
          if (tenantIds.some((t) => tenantBlockers[t]?.length)) throw new Error('Complétez d’abord ce qui manque au locataire pour le bail, ou demandez-le-lui.')
          if (!id) {
            const p = properties?.find((x) => x.id === propertyId)
            const created = await api<{ id: string }>('/leases', { method: 'POST', body: { propertyId, tenantIds, terms: { kind: p?.furnished ? 'MEUBLE' : 'VIDE' } } })
            goto(3, created.id)
          } else {
            await putTerms({ tenantIds })
            goto(3)
          }
          return
        }
        case 3:
          await putTerms({ kind: terms.kind })
          goto(4)
          return
        case 4:
          if (!terms.startDate) throw new Error('Indiquez la date d’entrée.')
          if (terms.kind === 'MOBILITE' && (!terms.durationMonths || !terms.mobilityReason)) throw new Error('Indiquez la durée et le motif du bail mobilité.')
          await putTerms({ startDate: terms.startDate, durationMonths: terms.durationMonths, mobilityReason: terms.mobilityReason, revision: { ...terms.revision, date: terms.revision?.date ?? terms.startDate.slice(5) } })
          goto(5)
          return
        case 5:
          if (!terms.rentCents) throw new Error('Indiquez le loyer hors charges.')
          if (terms.zone?.tense === null || terms.zone?.tense === undefined) throw new Error('Indiquez si la commune est en zone tendue.')
          if (terms.zone?.control && (!terms.zone.refRentCentsM2 || !terms.zone.refRentMaxCentsM2)) throw new Error('Encadrement des loyers : indiquez le loyer de référence et le loyer de référence majoré.')
          if (terms.zone?.complementCents && !terms.zone.complementJustification?.trim()) throw new Error('Justifiez le complément de loyer par les caractéristiques du logement.')
          await putTerms({ rentCents: terms.rentCents, chargesCents: terms.chargesCents ?? 0, chargesMode: terms.chargesMode ?? 'PROVISION', paymentDay: terms.paymentDay ?? 5, paymentTerm: terms.paymentTerm ?? 'ADVANCE', paymentMethod: terms.paymentMethod ?? 'TRANSFER', paymentPlace: terms.paymentPlace, depositCents: terms.kind === 'MOBILITE' ? 0 : terms.depositCents ?? maxDeposit(terms.kind ?? 'VIDE', terms.rentCents), zone: terms.zone })
          goto(6)
          return
        case 6:
          if (terms.previous?.rentedWithin18Months === undefined || terms.previous?.rentedWithin18Months === null) throw new Error('Indiquez s’il y avait un locataire avant.')
          if (terms.previous.rentedWithin18Months && !terms.previous.lastRentCents) throw new Error('Indiquez le dernier loyer du locataire précédent.')
          await putTerms({ previous: terms.previous, works: terms.works ?? {} })
          goto(7)
          return
        case 7:
          await putTerms({ revision: terms.revision, clauses: { ...terms.clauses, custom: (terms.clauses?.custom ?? []).map((c) => c.trim()).filter(Boolean) }, signature: { ...terms.signature, place: terms.signature?.place || property?.city || lease?.contract.property.city || null, mode: terms.signature?.mode ?? 'PAPER' } })
          goto(8)
          return
        case 8:
          navigate(`/espace/baux/${id}`, { replace: true })
          return
      }
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (!properties || !tenants || (id && !lease)) return <Loader />
  const tenantName = lease?.tenants[0]?.name.split(' ')[0] ?? tenants.find((t) => t.id === tenantIds[0])?.name.split(' ')[0] ?? 'votre locataire'
  const property = properties.find((p) => p.id === propertyId)
  const c = lease?.computed

  return (
    <StepFlow
      title="Créer un bail"
      closeTo={id ? `/espace/baux/${id}` : '/espace'}
      label={LABELS[step - 1]}
      step={step}
      total={8}
      onBack={step > 1 ? () => goto(step - 1) : undefined}
      onNext={next}
      busy={busy}
      nextLabel={step === 8 ? 'Terminer' : 'Continuer'}
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}

      {step === 1 ? (
        <>
          <StepTitle>Pour quel logement ?</StepTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {properties.map((p) => (
              <ChoiceCard
                key={p.id}
                selected={propertyId === p.id}
                onClick={() => setPropertyId(p.id)}
                title={p.name}
                sub={[p.city, p.furnished === true ? 'meublé' : p.furnished === false ? 'location vide' : null, p.surface ? `${String(p.surface).replace('.', ',')} m²` : null, p.status === 'RENTED' ? `loué à ${p.lease?.tenantName}` : null].filter(Boolean).join(' · ')}
                badge={p.completion >= 100 ? <Pill tone="green">Fiche complète</Pill> : <Pill tone="error">Fiche à {p.completion} %</Pill>}
              />
            ))}
          </div>
          <TextLink to="/espace/logements/nouveau?retour=bail">+ Un autre logement</TextLink>
          {propertyId && propertyBlockers?.length ? (
            <Callout tone="warn" title="Le logement doit être complet avant le bail">
              Il manque : {propertyBlockers.map((b) => b.label.toLowerCase()).join(', ')}.{' '}
              <TextLink to={`/espace/logements/nouveau?id=${propertyId}&etape=${PROPERTY_STEP[propertyBlockers[0].section] ?? 'type'}&retour=bail`} style={{ fontSize: 13 }}>
                Compléter le logement
              </TextLink>
            </Callout>
          ) : null}
        </>
      ) : null}

      {step === 2 ? (
        <>
          <StepTitle>Avec quel locataire ?</StepTitle>
          {tenants.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {tenants.map((t) => (
                <ChoiceCard
                  key={t.id}
                  selected={tenantIds.includes(t.id)}
                  onClick={() => setTenantIds(tenantIds.includes(t.id) ? tenantIds.filter((x) => x !== t.id) : [...tenantIds, t.id])}
                  title={t.name}
                  sub={t.property ? `Rattaché à ${t.property.name}` : t.email ?? undefined}
                  badge={t.completion >= 100 ? <Pill tone="green">Fiche complète</Pill> : <Pill tone="caramel">Fiche à {t.completion} %</Pill>}
                />
              ))}
            </div>
          ) : null}
          <TextLink to={`/espace/locataires/nouveau${propertyId ? `?logement=${propertyId}` : ''}`}>+ Ajouter un locataire</TextLink>
          {tenantIds.map((t) => <TenantCheck key={t} tenantId={t} name={tenants.find((x) => x.id === t)?.name ?? 'Locataire'} email={tenants.find((x) => x.id === t)?.email ?? null} blockers={tenantBlockers[t] ?? []} propertyId={propertyId} />)}
          <StepNote>{tenantIds.length > 1 ? 'Plusieurs locataires : ils signent tous le bail (colocation ou couple).' : 'Un nouveau locataire ? Bailio vous pose les questions nécessaires, une par une.'}</StepNote>
        </>
      ) : null}

      {step === 3 && lease ? (
        <>
          <StepTitle>Bailio a presque tout.</StepTitle>
          <Known
            items={[
              lease.contract.landlord.lastName || lease.contract.landlord.company?.name ? `Vous : ${fullName(lease.contract.landlord) || lease.contract.landlord.company?.name}${lease.contract.landlord.address ? `, ${lease.contract.landlord.address}` : ''}` : null,
              `Le logement : ${[lease.contract.property.surface ? `${lease.contract.property.surface} m²` : null, lease.contract.property.rooms ? `${lease.contract.property.rooms} pièce${lease.contract.property.rooms > 1 ? 's' : ''}` : null, lease.contract.property.heating?.mode ? `chauffage ${lease.contract.property.heating.mode === 'COLLECTIVE' ? 'collectif' : 'individuel'}` : null].filter(Boolean).join(', ')}`,
              lease.computed.diagnostics.filter((d) => d.required).length ? `Les diagnostics : ${lease.computed.diagnostics.filter((d) => d.required).map((d) => d.label.split(' (')[0].toLowerCase()).join(', ')}` : null,
              `${lease.tenants.length > 1 ? 'Les locataires' : 'Le locataire'}${lease.guarantors.length ? ' et son garant' : ''}`,
            ].filter((x): x is string => Boolean(x))}
          />
          {!(profile?.profile.lastName || profile?.profile.company?.name) || !profile?.profile.address ? (
            <Callout tone="warn" title="Votre profil de bailleur est incomplet">
              Votre nom et votre adresse doivent figurer dans le bail. <TextLink to={`/espace/compte/profil?retour=${encodeURIComponent(`/espace/baux/nouveau?id=${id}&etape=3`)}`} style={{ fontSize: 13 }}>Compléter mon profil</TextLink>
            </Callout>
          ) : null}
          <KindChoice furnished={property?.furnished ?? lease.kind !== 'VIDE'} kind={terms.kind ?? lease.kind} onChange={(k) => setT({ kind: k })} />
          <div style={{ background: BAI.night, borderRadius: 18, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, color: BAI.surface }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramel }}>Il reste quelques questions</span>
            <span style={{ fontSize: 15, color: BAI.onDark }}>La date d’entrée, le loyer, le loyer du locataire précédent et les options du bail.</span>
          </div>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <StepTitle>Quand {tenantName} entre-t-{lease?.contract.tenants[0]?.civility === 'MADAME' ? 'elle' : 'il'} ?</StepTitle>
          <Input big label="Date d’entrée" type="date" value={terms.startDate ?? ''} onChange={(v) => setT({ startDate: v || null })} />
          {terms.kind === 'MOBILITE' ? (
            <>
              <Chips big legend="Durée du bail mobilité" value={terms.durationMonths ?? null} onChange={(v) => setT({ durationMonths: v })} options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => ({ value: n, label: `${n} mois` }))} hint="De 1 à 10 mois, non renouvelable." />
              <Chips legend="Le locataire est en" value={terms.mobilityReason ?? null} onChange={(v) => setT({ mobilityReason: v })} options={(Object.keys(MOBILITY_REASONS) as Array<keyof typeof MOBILITY_REASONS>).map((k) => ({ value: k, label: MOBILITY_REASONS[k] }))} />
            </>
          ) : null}
          {c ? <Known items={[`Durée : ${durationText(c.durationMonths)}${terms.startDate && c.endDate ? `, jusqu’au ${dateFr(c.endDate)}` : ''}`, c.renewal]} /> : null}
        </>
      ) : null}

      {step === 5 && c ? (
        <>
          <StepTitle>Quel est le loyer ?</StepTitle>
          <Fields>
            <Money
              big
              label="Loyer hors charges"
              cents={terms.rentCents}
              onChange={(v) => {
                const kind = terms.kind ?? 'VIDE'
                const max = maxDeposit(kind, v ?? 0)
                // Le dépôt suit le loyer tant qu'il est au maximum légal (ou pas encore choisi).
                const followMax = terms.depositCents === null || terms.depositCents === undefined || terms.depositCents === maxDeposit(kind, terms.rentCents ?? 0) || terms.depositCents > max
                setT({ rentCents: v, depositCents: followMax ? max : terms.depositCents })
              }}
            />
            <Money big label="Charges" cents={terms.chargesCents} onChange={(v) => setT({ chargesCents: v })} />
          </Fields>
          <Chips
            big
            legend="Les charges sont"
            value={terms.chargesMode ?? null}
            onChange={(v) => setT({ chargesMode: v })}
            options={c.chargesModes.map((m) => ({ value: m, label: m === 'PROVISION' ? 'Provision' : m === 'FORFAIT' ? 'Forfait' : 'Paiement périodique' }))}
            hint={terms.chargesMode === 'FORFAIT' ? 'Forfait : un montant fixe, sans régularisation.' : 'Provision : une avance, régularisée une fois par an avec les dépenses réelles.'}
          />
          <Fields>
            <Select label="Payé au plus tard le" value={String(terms.paymentDay ?? 5)} onChange={(v) => setT({ paymentDay: Number(v) })} options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i === 0 ? '1er' : i + 1} du mois` }))} />
            <Select label="Moyen de paiement" value={terms.paymentMethod ?? 'TRANSFER'} onChange={(v) => setT({ paymentMethod: v })} options={[{ value: 'TRANSFER', label: 'Virement' }, { value: 'CHEQUE', label: 'Chèque' }, { value: 'CASH', label: 'Espèces (contre reçu)' }, { value: 'OTHER', label: 'Autre' }]} />
          </Fields>
          <Chips legend="Le loyer se paie" value={terms.paymentTerm ?? 'ADVANCE'} onChange={(v) => setT({ paymentTerm: v })} options={[{ value: 'ADVANCE', label: 'D’avance (à échoir)' }, { value: 'ARREARS', label: 'À la fin du mois (à terme échu)' }]} hint="D’avance : le loyer d’octobre est payé début octobre. C’est l’usage." />
          {terms.paymentMethod === 'OTHER' ? <Input label="Précisez le moyen et le lieu de paiement" value={terms.paymentPlace ?? ''} onChange={(v) => setT({ paymentPlace: v })} /> : null}
          <StepNote>Le prélèvement automatique ne peut pas être imposé au locataire (article 4 de la loi du 6 juillet 1989).</StepNote>
          {terms.kind !== 'MOBILITE' ? <Money big label="Dépôt de garantie" cents={terms.depositCents} onChange={(v) => setT({ depositCents: v })} hint={terms.rentCents ? `Au maximum ${euros(maxDeposit(terms.kind ?? 'VIDE', terms.rentCents))} : ${terms.kind === 'VIDE' ? 'un mois' : 'deux mois'} de loyer hors charges.` : undefined} error={terms.rentCents && terms.depositCents && terms.depositCents > maxDeposit(terms.kind ?? 'VIDE', terms.rentCents) ? 'Au-dessus du maximum légal.' : null} /> : <Callout tone="info">En bail mobilité, aucun dépôt de garantie ne peut être demandé.</Callout>}
          <Chips legend="La commune est-elle en zone tendue ?" value={terms.zone?.tense ?? null} onChange={(v) => setT({ zone: { ...terms.zone, tense: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint={<>En zone tendue, le loyer à la relocation est encadré. <a href="https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues" target="_blank" rel="noreferrer">Vérifier ma commune</a></>} />
          <Chips legend="Le logement est soumis à l’encadrement des loyers ?" value={terms.zone?.control ?? (c.rentControlLikely ? true : null)} onChange={(v) => setT({ zone: { ...terms.zone, control: v } })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]} hint={c.rentControlLikely ? 'Cette commune applique l’encadrement : le loyer ne peut pas dépasser le loyer de référence majoré.' : 'Paris, Lille, Lyon, Montpellier, Bordeaux et quelques communes d’Île-de-France l’appliquent.'} />
          {terms.zone?.control ?? c.rentControlLikely ? (
            <>
              <Fields>
                <Money label="Loyer de référence (€/m²)" cents={terms.zone?.refRentCentsM2 ?? null} onChange={(v) => setT({ zone: { ...terms.zone, control: true, refRentCentsM2: v } })} />
                <Money label="Loyer de référence majoré (€/m²)" cents={terms.zone?.refRentMaxCentsM2 ?? null} onChange={(v) => setT({ zone: { ...terms.zone, control: true, refRentMaxCentsM2: v } })} />
              </Fields>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>Sur le site de la préfecture ou de la métropole, selon l’adresse, le nombre de pièces, l’époque de construction et le type de location.</span>
              <Money label="Complément de loyer (facultatif)" cents={terms.zone?.complementCents ?? null} onChange={(v) => setT({ zone: { ...terms.zone, complementCents: v } })} hint="Seulement si le logement a des caractéristiques exceptionnelles (terrasse, vue…). Le loyer de base est alors égal au loyer de référence majoré." />
              {terms.zone?.complementCents ? <TextArea label="Ce qui justifie le complément de loyer" value={terms.zone?.complementJustification ?? ''} onChange={(v) => setT({ zone: { ...terms.zone, complementJustification: v } })} rows={2} /> : null}
            </>
          ) : null}
          <Known items={[terms.kind === 'MOBILITE' ? 'Pas de révision du loyer en bail mobilité' : c.revisionAllowed ? 'Révision chaque année avec l’indice officiel' : 'Logement classé F ou G : le loyer ne peut pas être révisé']} />
        </>
      ) : null}

      {step === 6 ? (
        <>
          <StepTitle>Y avait-il un locataire avant ?</StepTitle>
          <div className="grid-2" style={{ gap: 14 }}>
            <ChoiceCard column selected={terms.previous?.rentedWithin18Months === true} onClick={() => setT({ previous: { ...terms.previous, rentedWithin18Months: true } })} title="Oui" sub="Parti il y a moins de 18 mois" />
            <ChoiceCard column selected={terms.previous?.rentedWithin18Months === false} onClick={() => setT({ previous: { rentedWithin18Months: false } })} title="Non" sub="Premier locataire ou logement vide depuis longtemps" />
          </div>
          {terms.previous?.rentedWithin18Months ? (
            <Fields>
              <Money big label="Son dernier loyer" cents={terms.previous.lastRentCents} onChange={(v) => setT({ previous: { ...terms.previous, lastRentCents: v } })} />
              <Input big label="Date de son dernier loyer" type="date" value={terms.previous.lastPaymentDate ?? ''} onChange={(v) => setT({ previous: { ...terms.previous, lastPaymentDate: v || null } })} />
            </Fields>
          ) : null}
          {terms.previous?.rentedWithin18Months ? <Input label="Date de la dernière révision de son loyer" type="date" value={terms.previous.lastRevisionDate ?? ''} onChange={(v) => setT({ previous: { ...terms.previous, lastRevisionDate: v || null } })} hint="Mention obligatoire du bail. Laissez vide s’il n’a jamais été révisé." /> : null}
          <TextArea label="Travaux faits depuis le dernier bail" value={terms.works?.sinceLast ?? ''} onChange={(v) => setT({ works: { ...terms.works, sinceLast: v || null } })} placeholder="Aucun" rows={2} />
          {terms.kind !== 'MOBILITE' ? (
            <>
              <TextArea label="Travaux d’amélioration prévus pendant le bail, avec hausse de loyer (facultatif)" value={terms.works?.increase ?? ''} onChange={(v) => setT({ works: { ...terms.works, increase: v || null } })} placeholder="Nature des travaux, délai, montant de la hausse" rows={2} />
              <TextArea label="Travaux faits par le locataire en échange d’une baisse de loyer (facultatif)" value={terms.works?.decrease ?? ''} onChange={(v) => setT({ works: { ...terms.works, decrease: v || null } })} placeholder="Durée de la baisse, remboursement en cas de départ anticipé" rows={2} />
            </>
          ) : null}
          <StepNote>La loi impose d’indiquer ces informations dans le bail.</StepNote>
        </>
      ) : null}

      {step === 7 && c ? (
        <>
          <StepTitle>Les options du bail</StepTitle>
          <div>
            <Toggle
              checked={terms.kind !== 'MOBILITE' && c.revisionAllowed && terms.revision?.enabled !== false}
              disabled={terms.kind === 'MOBILITE' || !c.revisionAllowed}
              onChange={(v) => setT({ revision: { ...terms.revision, enabled: v } })}
              label="Révision annuelle du loyer"
              sub={terms.kind === 'MOBILITE' ? 'Impossible en bail mobilité.' : !c.revisionAllowed ? 'Interdite pour un logement classé F ou G.' : `Le loyer suit l’indice officiel chaque ${terms.startDate ? dateFr(terms.startDate, false) : 'année'}. Conseillé.`}
            />
            <Toggle checked={terms.clauses?.resolutoire !== false} onChange={(v) => setT({ clauses: { ...terms.clauses, resolutoire: v } })} label="Clause de fin de bail en cas d’impayé" sub="Permet de résilier plus simplement en cas de loyers impayés. Conseillé." />
            <Toggle checked={Boolean(terms.clauses?.solidarite)} disabled={(lease?.tenants.length ?? 1) < 2 && !terms.colocation} onChange={(v) => setT({ clauses: { ...terms.clauses, solidarite: v } })} label="Solidarité entre colocataires" sub="Chacun peut être tenu de payer tout le loyer. Seulement pour plusieurs locataires." />
          </div>
          <CustomClauses clauses={terms.clauses?.custom ?? []} warnings={c.clauseWarnings} onChange={(custom) => setT({ clauses: { ...terms.clauses, custom } })} />
          <Fields>
            <Input big label="Fait à" value={terms.signature?.place ?? ''} onChange={(v) => setT({ signature: { ...terms.signature, place: v } })} placeholder={property?.city ?? 'Montpellier'} />
          </Fields>
          <Chips legend="Signature" value={terms.signature?.mode ?? 'PAPER'} onChange={(v) => setT({ signature: { ...terms.signature, mode: v } })} options={[{ value: 'PAPER', label: 'Sur papier' }, { value: 'ELECTRONIC', label: 'Électronique' }]} />
        </>
      ) : null}

      {step === 8 && lease ? (
        <>
          <StepTitle>{lease.ready ? `Le bail de ${tenantName} est prêt.` : `Le bail de ${tenantName} est presque prêt.`}</StepTitle>
          <Known items={[`Contrat de location ${KIND_LABEL[lease.kind].toLowerCase().replace('location ', '')}, conforme au contrat type`, 'Notice d’information', ...lease.annexes.filter((a) => a.done && a.key !== 'notice').map((a) => a.label)]} />
          {!lease.ready ? (
            <Callout tone="tip" title="Avant la signature">
              Il manque : {lease.completion.steps.filter((s) => s.applicable && !s.done).map((s) => s.label.toLowerCase()).join(', ')}. <TextLink to={`/espace/baux/${lease.id}/contrat`} style={{ fontSize: 13 }}>Compléter le contrat</TextLink>
            </Callout>
          ) : null}
          {lease.annexes.some((a) => !a.done && a.key !== 'inventory') ? <Callout tone="warn">À joindre encore : {lease.annexes.filter((a) => !a.done && a.key !== 'inventory').map((a) => a.label.toLowerCase()).join(', ')}.</Callout> : null}
          <div className="col-md" style={{ display: 'flex', gap: 12 }}>
            <Btn variant="outline" size="lg" onClick={() => openDoc(`/leases/${lease.id}/lease.pdf`).catch(toast.error)}>
              Voir l’aperçu
            </Btn>
            <Btn variant="outline" size="lg" onClick={() => printDoc(`/leases/${lease.id}/lease.pdf`).catch(toast.error)}>
              Imprimer
            </Btn>
          </div>
        </>
      ) : null}
    </StepFlow>
  )
}

const maxDeposit = (kind: LeaseKind, rent: number) => (kind === 'MOBILITE' ? 0 : kind === 'VIDE' ? rent : rent * 2)
const durationText = (m: number) => (m % 12 === 0 ? `${m / 12} an${m > 12 ? 's' : ''}` : `${m} mois`)

function KindChoice({ furnished, kind, onChange }: { furnished: boolean; kind: LeaseKind; onChange: (k: LeaseKind) => void }) {
  const options: Array<{ value: LeaseKind; label: string; sub: string }> = furnished
    ? [
        { value: 'MEUBLE', label: 'Meublé', sub: '1 an, reconduit chaque année' },
        { value: 'ETUDIANT', label: 'Étudiant', sub: '9 mois, sans reconduction' },
        { value: 'MOBILITE', label: 'Mobilité', sub: '1 à 10 mois, sans dépôt de garantie' },
      ]
    : [{ value: 'VIDE', label: 'Location vide', sub: '3 ans, reconduit ensuite' }]
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <legend style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Le bail sera</legend>
      <div className={options.length > 1 ? 'grid-3' : undefined} style={{ gap: 12 }}>
        {options.map((o) => (
          <ChoiceCard key={o.value} column selected={kind === o.value} onClick={() => onChange(o.value)} title={o.label} sub={o.sub} />
        ))}
      </div>
      {!furnished ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pour un bail meublé, étudiant ou mobilité, indiquez « meublé » dans la fiche du logement.</span> : null}
    </fieldset>
  )
}

function CustomClauses({ clauses, warnings, onChange }: { clauses: string[]; warnings: Array<{ clause: string; reasons: string[] }>; onChange: (c: string[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {clauses.map((cl, i) => {
        const w = warnings.find((x) => x.clause.trim() === cl.trim())
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TextArea label={`Clause ${i + 1}`} value={cl} onChange={(v) => onChange(clauses.map((x, j) => (j === i ? v : x)))} rows={2} />
            {w ? <Callout tone="warn">{w.reasons.join(' ')}</Callout> : null}
            <TextLink style={{ fontSize: 14, color: BAI.error }} onClick={() => onChange(clauses.filter((_, j) => j !== i))}>
              Retirer cette clause
            </TextLink>
          </div>
        )
      })}
      <TextLink onClick={() => onChange([...clauses, ''])}>+ Ajouter une clause à vous</TextLink>
      <StepNote>Bailio vous prévient si une clause que vous écrivez est interdite par la loi (article 4 de la loi du 6 juillet 1989).</StepNote>
    </div>
  )
}

/** Étape du parcours « Ajouter un logement » où compléter chaque mention manquante. */
const PROPERTY_STEP: Record<string, string> = { address: 'type', type: 'type', size: 'size', heating: 'heating', equipments: 'equipments', tv: 'equipments', diagnostics: 'diagnostics', furniture: 'furniture' }
const TENANT_STEP: Record<string, string> = { name: 'identity', birthDate: 'birth', birthPlace: 'birth', guarantee: 'guarantee', visaleNumber: 'guarantee' }

interface TenantBlocker {
  key: string
  label: string
  ask: boolean
}

/** Ce qu'il manque au locataire pour le bail : à compléter soi-même, ou à lui demander. */
function TenantCheck({ tenantId, name, email, blockers, propertyId }: { tenantId: string; name: string; email: string | null; blockers: TenantBlocker[]; propertyId: string | null }) {
  const toast = useToast()
  const [sent, setSent] = useState(false)
  if (!blockers.length) return null
  const step = blockers[0].key.startsWith('guarantor') ? 'guarantor' : TENANT_STEP[blockers[0].key] ?? 'identity'
  const askable = blockers.some((b) => b.ask)
  const ask = async () => {
    try {
      await api(`/tenants/${tenantId}/request`, { method: 'POST', body: { send: true } })
      setSent(true)
      toast.show(`Demande envoyée à ${email}.`)
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <Callout tone="warn" title={`Pour le bail, il manque pour ${name}`}>
      {blockers.map((b) => b.label.toLowerCase()).join(', ')}.{' '}
      <TextLink to={`/espace/locataires/nouveau?id=${tenantId}&etape=${step}${propertyId ? `&logement=${propertyId}` : ''}`} style={{ fontSize: 13 }}>
        Compléter
      </TextLink>
      {askable && email && !sent ? (
        <>
          {' · '}
          <TextLink onClick={() => void ask()} style={{ fontSize: 13 }}>
            Le demander par email
          </TextLink>
        </>
      ) : null}
      {askable && !email ? (
        <>
          {' · '}
          <TextLink onClick={() => void openDoc(`/tenants/${tenantId}/request.pdf`).catch(toast.error)} style={{ fontSize: 13 }}>
            Courrier à imprimer
          </TextLink>
        </>
      ) : null}
    </Callout>
  )
}
