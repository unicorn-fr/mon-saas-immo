import { useState } from 'react'
import { MissingList } from '../../../components/Missing'
import { useParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { FicheLayout, FicheSection, Fields } from '../../../components/FlowLayout'
import { Btn, Callout, Check, Chips, Computed, Input, LoadError, Loader, Money, NumberField, Pill, Select, TextArea, TextLink, useToast } from '../../../components/kit'
import { api } from '../../../lib/api'
import { KIND_LABEL, MOBILITY_REASONS, fullName, type LeaseKind, type LeaseTerms } from '../../../lib/contract'
import { openDoc } from '../../../lib/docs'
import { dateFr, dateNum, euros, eurosCents } from '../../../lib/format'
import { useFiche } from '../../../lib/fiche'
import type { LeaseView } from '../../../lib/space'

/** Contrat de location complet, rubrique par rubrique. Maquette « Contrat de location ». */
export default function Contrat() {
  const { id = '' } = useParams()
  const toast = useToast()
  const [view, setView] = useState<LeaseView | null>(null)
  const { file: t, set, completion, save, saveNow, flush, loadError, reload } = useFiche<LeaseTerms>(
    () =>
      api<LeaseView>(`/leases/${id}`).then((v) => {
        setView(v)
        return { file: v.terms, completion: v.completion }
      }),
    async (terms) => {
      const v = await api<LeaseView>(`/leases/${id}/terms`, { method: 'PUT', body: terms })
      setView(v)
      return { completion: v.completion }
    },
    [id],
  )
  if (loadError) return <div style={{ padding: 24 }}><LoadError message={loadError} retry={reload} /></div>
  if (!t || !completion || !view) return <Loader />
  if (view.status === 'IMPORTED' || view.status === 'ENDED') {
    return (
      <div style={{ padding: 24, maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Callout tone="info" title={view.status === 'IMPORTED' ? 'Bail importé' : 'Bail terminé'}>
          {view.status === 'IMPORTED' ? 'Ses conditions figurent dans le document signé que vous avez importé.' : 'Un bail terminé ne peut plus être modifié.'}
        </Callout>
        <div>
          <Btn to={`/espace/baux/${id}`}>Retour au bail</Btn>
        </div>
      </div>
    )
  }
  const c = view.computed
  const L = view.contract.landlord
  const P = view.contract.property
  const done = (k: string) => completion.steps.find((s) => s.key === k)?.done
  const kind = (t.kind ?? 'VIDE') as LeaseKind
  const mobility = kind === 'MOBILITE'
  const furnished = P.furnished === true
  let n = 0

  const preview = async () => {
    try {
      await flush()
      await openDoc(`/leases/${id}/lease.pdf`)
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <FicheLayout
      backTo={`/espace/baux/${id}`}
      title="Contrat de location"
      subtitle={`${view.property.name}, ${view.tenantName}`}
      completion={completion}
      save={save}
      onSave={saveNow}
      extraAction={
        <Btn size="sm" variant="outline" onClick={preview} style={{ height: 44 }}>
          Aperçu du bail
        </Btn>
      }
    >
      {view.status === 'DRAFT' ? (
        view.checklist.length ? (
          <MissingList items={view.checklist} title={`Pour un bail complet, il manque ${view.checklist.length} information${view.checklist.length > 1 ? 's' : ''} :`} />
        ) : (
          <Callout tone="ok" title="Dossier complet">Toutes les mentions exigées par la loi sont renseignées. Vérifiez l’aperçu, puis passez à la signature.</Callout>
        )
      ) : null}
      {view.status === 'ACTIVE' ? <Callout tone="warn" title="Ce bail est signé">Toute modification crée une nouvelle version, à faire signer par les deux parties (avenant). La version signée reste conservée.</Callout> : null}

      <FicheSection id="type" guides={['meuble', 'mobilite']} n={++n} title="Type de bail" intro="Chaque type a ses règles de durée, de dépôt et de charges. Bailio les applique." reference="loi n° 89-462 du 6 juillet 1989, titres Ier, Ier bis et Ier ter" done={done('type')}>
        <Chips
          legend="Quel contrat ?"
          value={kind}
          onChange={(v) => set({ kind: v, ...(v === 'MOBILITE' ? { chargesMode: 'FORFAIT', depositCents: 0 } : {}) })}
          options={[
            { value: 'VIDE' as LeaseKind, label: 'Location vide' },
            { value: 'MEUBLE' as LeaseKind, label: 'Location meublée' },
            { value: 'ETUDIANT' as LeaseKind, label: 'Meublé étudiant 9 mois' },
            { value: 'MOBILITE' as LeaseKind, label: 'Bail mobilité' },
          ].filter((o) => (furnished ? o.value !== 'VIDE' : o.value === 'VIDE'))}
          hint={furnished ? 'Le logement est meublé : bail meublé, étudiant ou mobilité.' : 'Le logement est loué vide. Pour un meublé, modifiez la fiche du logement.'}
        />
        <Chips legend="Colocation" value={Boolean(t.colocation)} onChange={(v) => set({ colocation: v, clauses: { ...t.clauses, solidarite: v ? (t.clauses?.solidarite ?? true) : false } })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui, bail unique' }]} />
        {mobility ? <Callout tone="tip">Bail mobilité : de 1 à 10 mois, meublé, pour un locataire en formation, études, apprentissage, stage, service civique ou mission temporaire. Pas de dépôt de garantie, charges au forfait uniquement.</Callout> : null}
      </FicheSection>

      <FicheSection id="parties" guides={['bail']} n={++n} title="Les parties" intro="Repris des fiches déjà remplies. Rien à ressaisir." reference="Contrat type, rubrique I" done={done('parties')}>
        <Computed
          rows={[
            ['Bailleur', [fullName(L) || L.company?.name || 'À compléter', L.address].filter(Boolean).join(', ')],
            ...view.tenants.map((x) => ['Locataire', x.name] as [string, string]),
            ...view.guarantors.map((g) => ['Garant', g.name] as [string, string]),
            ['Mandataire', L.agent?.enabled ? L.agent.name || 'À compléter' : 'Aucun'],
          ]}
        />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <TextLink to={`/espace/compte/profil?retour=/espace/baux/${id}/contrat`}>Modifier le profil du bailleur</TextLink>
          {view.tenants.map((x) => (
            <TextLink key={x.id} to={`/espace/locataires/${x.id}/fiche`}>
              Fiche de {x.name.split(' ')[0]}
            </TextLink>
          ))}
        </div>
        {L.agent?.enabled ? (
          <Fields>
            <Money label="Honoraires du locataire (visite, dossier, bail)" cents={t.fees?.tenantVisitFileCents} onChange={(v) => set({ fees: { ...t.fees, tenantVisitFileCents: v } })} hint="Plafonnés par m² selon la zone." />
            <Money label="Honoraires de l’état des lieux" cents={t.fees?.tenantInventoryCents} onChange={(v) => set({ fees: { ...t.fees, tenantInventoryCents: v } })} hint="3 € par m² au maximum." />
          </Fields>
        ) : null}
      </FicheSection>

      <FicheSection id="property" n={++n} title="Le logement" reference="Contrat type, rubrique II" done={done('property')}>
        <Computed
          rows={[
            ['Adresse', view.property.address],
            ['Type', [P.habitat === 'INDIVIDUAL' ? 'Maison individuelle' : P.habitat === 'COLLECTIVE' ? 'Immeuble collectif' : null, P.legalRegime === 'COPRO' ? 'copropriété' : P.legalRegime === 'MONO' ? 'monopropriété' : null].filter(Boolean).join(', ') || 'À compléter'],
            ['Surface et pièces', P.surface ? `${String(P.surface).replace('.', ',')} m², ${P.rooms ?? '?'} pièce${(P.rooms ?? 0) > 1 ? 's' : ''} principale${(P.rooms ?? 0) > 1 ? 's' : ''}` : 'À compléter'],
            ['Performance énergétique', P.diagnostics?.dpe?.class ? `Classe ${P.diagnostics.dpe.class}` : 'À compléter'],
          ]}
        />
        <TextLink to={`/espace/logements/${view.property.id}/fiche`}>Modifier la fiche du logement</TextLink>
        {c.energyWarning ? <Callout tone="warn">{c.energyWarning}</Callout> : null}
      </FicheSection>

      <FicheSection id="dates" guides={['bail']} n={++n} title="Date et durée" reference="loi n° 89-462 du 6 juillet 1989, art. 10 et 11" done={done('dates')}>
        <Fields>
          <Input label="Date de prise d’effet" type="date" value={t.startDate} onChange={(v) => set({ startDate: v || null })} />
          {mobility ? <Select label="Durée" value={String(t.durationMonths ?? '')} onChange={(v) => set({ durationMonths: Number(v) || null })} options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => ({ value: String(m), label: `${m} mois` }))} /> : <Input label="Durée" value={durationText(c.durationMonths)} onChange={() => undefined} disabled />}
        </Fields>
        {mobility ? <Select label="Motif du bail mobilité" value={t.mobilityReason ?? ''} onChange={(v) => set({ mobilityReason: (v || null) as LeaseTerms['mobilityReason'] })} options={(Object.keys(MOBILITY_REASONS) as Array<keyof typeof MOBILITY_REASONS>).map((k) => ({ value: k, label: MOBILITY_REASONS[k] }))} /> : null}
        {kind === 'VIDE' && c.reducedAllowed ? (
          <>
            <Chips legend="Durée réduite (1 an minimum) pour raison familiale ou professionnelle ?" value={Boolean(t.reduced?.enabled)} onChange={(v) => set({ reduced: { ...t.reduced, enabled: v }, durationMonths: v ? (t.durationMonths && t.durationMonths < 36 ? t.durationMonths : 12) : null })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]} />
            {t.reduced?.enabled ? (
              <>
                <NumberField label="Durée en mois (12 à 35)" value={t.durationMonths} onChange={(v) => set({ durationMonths: v === null ? null : Math.max(12, Math.min(35, v)) })} />
                <TextArea label="Événement précis qui justifie la durée réduite" value={t.reduced.reason} onChange={(v) => set({ reduced: { ...t.reduced, reason: v } })} placeholder="Mutation professionnelle prévue en septembre 2027" />
              </>
            ) : null}
          </>
        ) : null}
        <Computed
          rows={[
            ['Fin du bail', c.endDate ? dateNum(c.endDate) : 'Date d’effet à indiquer'],
            ['Ensuite', c.renewal],
            ['Préavis du bailleur', c.noticeMonths ? `${c.noticeMonths} mois avant l’échéance` : 'Aucun congé à donner'],
          ]}
        />
        {kind === 'VIDE' ? <Callout tone="tip">Un bail de durée réduite n’est possible que pour un bailleur personne physique, avec l’événement précis qui le justifie écrit dans le bail.</Callout> : null}
      </FicheSection>

      <FicheSection id="rent" guides={['loyer', 'paiement']} n={++n} title="Le loyer" reference="Contrat type, rubrique IV.A et IV.E" done={done('rent')}>
        <Money label="Loyer mensuel hors charges" cents={t.rentCents} onChange={(v) => set({ rentCents: v })} />
        <Fields>
          <Select label="Paiement" value={t.paymentTerm ?? 'ADVANCE'} onChange={(v) => set({ paymentTerm: v })} options={[{ value: 'ADVANCE', label: 'À échoir (en début de mois)' }, { value: 'ARREARS', label: 'À terme échu (en fin de mois)' }]} />
          <Select label="Le" value={String(t.paymentDay ?? 5)} onChange={(v) => set({ paymentDay: Number(v) })} options={Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i === 0 ? '1er' : i + 1} du mois` }))} />
        </Fields>
        <Fields>
          <Select label="Mode de paiement" value={t.paymentMethod ?? 'TRANSFER'} onChange={(v) => set({ paymentMethod: v })} options={[{ value: 'TRANSFER', label: 'Virement' }, { value: 'CHEQUE', label: 'Chèque' }, { value: 'CASH', label: 'Espèces' }, { value: 'OTHER', label: 'Autre' }]} />
          <Input label="Lieu de paiement" value={t.paymentPlace} onChange={(v) => set({ paymentPlace: v })} hint="Facultatif." />
        </Fields>
        <Callout tone="warn">Imposer le prélèvement automatique ou le paiement par retenue sur salaire est interdit.</Callout>
      </FicheSection>

      <FicheSection id="zone" guides={['encadrement', 'complement']} n={++n} title="Encadrement et zone tendue" reference="loi n° 89-462 du 6 juillet 1989, art. 17 et 18" done={done('zone')}>
        <Chips legend="Zone tendue" value={t.zone?.tense ?? null} onChange={(v) => set({ zone: { ...t.zone, tense: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint={<><a href="https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues" target="_blank" rel="noreferrer">Vérifier ma commune</a> sur le simulateur officiel.</>} />
        <Chips legend="Encadrement des loyers" value={t.zone?.control ?? c.rentControlLikely} onChange={(v) => set({ zone: { ...t.zone, control: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
        {t.zone?.control ?? c.rentControlLikely ? (
          <>
            <Fields>
              <NumberField label="Loyer de référence (€/m²)" step="decimal" value={t.zone?.refRentCentsM2 ? t.zone.refRentCentsM2 / 100 : null} onChange={(v) => set({ zone: { ...t.zone, refRentCentsM2: v === null ? null : Math.round(v * 100) } })} />
              <NumberField label="Loyer de référence majoré (€/m²)" step="decimal" value={t.zone?.refRentMaxCentsM2 ? t.zone.refRentMaxCentsM2 / 100 : null} onChange={(v) => set({ zone: { ...t.zone, refRentMaxCentsM2: v === null ? null : Math.round(v * 100) } })} />
            </Fields>
            {t.zone?.refRentMaxCentsM2 && P.surface && t.rentCents && t.rentCents > t.zone.refRentMaxCentsM2 * P.surface ? <Callout tone="warn">Le loyer dépasse le loyer de référence majoré ({eurosCents(Math.round(t.zone.refRentMaxCentsM2 * P.surface))} pour {P.surface} m²). Seul un complément de loyer justifié le permet.</Callout> : null}
            <Money label="Complément de loyer" cents={t.zone?.complementCents} onChange={(v) => set({ zone: { ...t.zone, complementCents: v } })} hint="Seulement pour des caractéristiques exceptionnelles, justifiées dans le bail." />
            {t.zone?.complementCents ? <TextArea label="Justification du complément" value={t.zone?.complementJustification} onChange={(v) => set({ zone: { ...t.zone, complementJustification: v } })} /> : null}
          </>
        ) : null}
        <Callout tone="tip">En zone tendue, le loyer d’un nouveau bail ne peut pas dépasser celui du locataire précédent, sauf exceptions (travaux importants, loyer sous-évalué, logement vacant depuis plus de 18 mois).</Callout>
      </FicheSection>

      <FicheSection id="previous" guides={['encadrement']} n={++n} title="Le locataire précédent" reference="Contrat type, rubrique IV.A.1" done={done('previous')}>
        <Chips legend="Le logement était-il loué dans les 18 derniers mois ?" value={t.previous?.rentedWithin18Months ?? null} onChange={(v) => set({ previous: { ...t.previous, rentedWithin18Months: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
        {t.previous?.rentedWithin18Months ? (
          <>
            <Money label="Dernier loyer versé" cents={t.previous.lastRentCents} onChange={(v) => set({ previous: { ...t.previous, lastRentCents: v } })} />
            <Fields>
              <Input label="Date du dernier versement" type="date" value={t.previous.lastPaymentDate} onChange={(v) => set({ previous: { ...t.previous, lastPaymentDate: v || null } })} />
              <Input label="Date de la dernière révision" type="date" value={t.previous.lastRevisionDate} onChange={(v) => set({ previous: { ...t.previous, lastRevisionDate: v || null } })} />
            </Fields>
            <Callout tone="tip">Ces trois informations sont obligatoires. Leur absence peut permettre au locataire de contester le loyer.</Callout>
          </>
        ) : null}
      </FicheSection>

      {!mobility ? (
        <FicheSection id="revision" guides={['revision', 'irl']} n={++n} title="Révision annuelle" reference="loi n° 89-462 du 6 juillet 1989, art. 17-1" done={done('revision')}>
          <Chips legend="Réviser le loyer chaque année ?" value={c.revisionAllowed ? t.revision?.enabled !== false : false} onChange={(v) => set({ revision: { ...t.revision, enabled: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
          {c.revisionAllowed && t.revision?.enabled !== false ? (
            <Fields>
              <Input label="Date de révision (jour et mois)" type="date" value={t.revision?.date ? `2000-${t.revision.date}` : ''} onChange={(v) => set({ revision: { ...t.revision, date: v ? v.slice(5) : null } })} hint={t.revision?.date ? `Chaque ${dateFr(`2000-${t.revision.date}`, false)}` : 'Par défaut, la date anniversaire du bail.'} />
              <Select
                label="Indice de référence"
                value={t.revision?.irlQuarter?.slice(5) ?? ''}
                onChange={(q) => set({ revision: { ...t.revision, irlQuarter: q ? `${t.revision?.irlQuarter?.slice(0, 4) ?? new Date().getFullYear()}-${q}` : null } })}
                options={[{ value: 'Q1', label: 'IRL du 1er trimestre' }, { value: 'Q2', label: 'IRL du 2e trimestre' }, { value: 'Q3', label: 'IRL du 3e trimestre' }, { value: 'Q4', label: 'IRL du 4e trimestre' }]}
                hint={t.revision?.irlValue ? `Valeur de référence : ${String(t.revision.irlValue).replace('.', ',')} (${t.revision.irlQuarter}).` : undefined}
              />
            </Fields>
          ) : null}
          <Computed rows={[['Formule', 'Loyer × nouvel IRL ÷ IRL de référence'], ['Délai pour l’appliquer', '1 an après la date, jamais rétroactif']]} />
          {!c.revisionAllowed ? <Callout tone="warn">Logement classé F ou G : la révision est interdite. Bailio la bloque.</Callout> : null}
        </FicheSection>
      ) : null}

      <FicheSection id="charges" guides={['charges']} n={++n} title="Les charges" reference="loi n° 89-462 du 6 juillet 1989, art. 23 et décret n° 87-713" done={done('charges')}>
        <Chips
          legend="Mode de paiement des charges"
          value={t.chargesMode ?? null}
          onChange={(v) => set({ chargesMode: v })}
          options={[
            { value: 'PROVISION' as const, label: 'Provisions avec régularisation annuelle' },
            { value: 'PERIODIC' as const, label: 'Paiement périodique sans provision' },
            { value: 'FORFAIT' as const, label: 'Forfait' },
          ].filter((o) => c.chargesModes.includes(o.value))}
        />
        <Money label="Montant mensuel" cents={t.chargesCents} onChange={(v) => set({ chargesCents: v ?? 0 })} hint="Taxe d’enlèvement des ordures ménagères, entretien des parties communes, eau si commune." />
        <Callout tone="tip">Location vide : le forfait n’est permis qu’en colocation. En meublé, forfait ou provisions au choix. Bail mobilité : forfait uniquement.</Callout>
        <a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F947" target="_blank" rel="noreferrer" style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          Voir la liste des charges récupérables
        </a>
      </FicheSection>

      <FicheSection id="first" n={++n} title="Première échéance" reference="Contrat type, rubrique IV.E" done={done('first')}>
        {c.firstPayment ? (
          <Computed
            rows={[
              ['Entrée', t.startDate ? `${dateFr(t.startDate, false)}, ${c.firstPayment.fullMonth ? 'mois complet' : `${c.firstPayment.days} jours sur ${c.firstPayment.daysInMonth}`}` : ''],
              ['Loyer', eurosCents(c.firstPayment.rentCents)],
              ['Charges', eurosCents(c.firstPayment.chargesCents)],
              ['Total à payer à l’entrée', eurosCents(c.firstPayment.rentCents + c.firstPayment.chargesCents)],
              ...(mobility ? [] : ([['Dépôt de garantie', eurosCents(t.depositCents ?? 0)]] as Array<[string, string]>)),
            ]}
          />
        ) : (
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Indiquez la date d’effet et le loyer : Bailio calcule la première échéance.</span>
        )}
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>En cas d’entrée en cours de mois, le montant est calculé au prorata des jours.</span>
      </FicheSection>

      {!mobility ? (
        <FicheSection id="works" guides={['travaux']} n={++n} title="Travaux" reference="Contrat type, rubriques IV.C et V" done={done('works')}>
          <TextArea label="Travaux réalisés depuis le dernier bail" value={t.works?.sinceLast} onChange={(v) => set({ works: { ...t.works, sinceLast: v } })} hint="Nature et montant, obligatoires si des travaux ont eu lieu." />
          <TextArea label="Majoration de loyer pour travaux d’amélioration" value={t.works?.increase} onChange={(v) => set({ works: { ...t.works, increase: v } })} hint="Nature, montant, délai de réalisation." />
          <TextArea label="Diminution de loyer pour travaux du locataire" value={t.works?.decrease} onChange={(v) => set({ works: { ...t.works, decrease: v } })} hint="Durée et montant." />
          <Chips legend="Contribution du locataire aux économies d’énergie ?" value={Boolean(t.works?.energyContribution?.enabled)} onChange={(v) => set({ works: { ...t.works, energyContribution: { ...t.works?.energyContribution, enabled: v } } })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui, après travaux d’économie d’énergie' }]} />
          {t.works?.energyContribution?.enabled ? (
            <Fields>
              <Money label="Montant mensuel" cents={t.works.energyContribution.monthlyCents} onChange={(v) => set({ works: { ...t.works, energyContribution: { ...t.works?.energyContribution, monthlyCents: v } } })} />
              <Input label="Travaux réalisés" value={t.works.energyContribution.description} onChange={(v) => set({ works: { ...t.works, energyContribution: { ...t.works?.energyContribution, description: v } } })} />
            </Fields>
          ) : null}
          {t.works === null || t.works === undefined ? (
            <div>
              <Btn size="sm" variant="outline" onClick={() => set({ works: {} })}>
                Aucuns travaux
              </Btn>
            </div>
          ) : null}
        </FicheSection>
      ) : null}

      {!mobility ? (
        <FicheSection id="deposit" guides={['depot']} n={++n} title="Dépôt de garantie" reference="loi n° 89-462 du 6 juillet 1989, art. 22" done={done('deposit')}>
          <Computed
            rows={[
              ['Maximum légal', kind === 'VIDE' ? '1 mois de loyer hors charges' : '2 mois de loyer hors charges'],
              ['Montant maximum', c.maxDepositCents !== null ? eurosCents(c.maxDepositCents) : 'Loyer à indiquer'],
              ['À restituer', '1 mois après la sortie si l’état des lieux est conforme, 2 mois sinon'],
            ]}
          />
          <Money label="Montant demandé" cents={t.depositCents} onChange={(v) => set({ depositCents: v ?? 0 })} error={c.maxDepositCents !== null && (t.depositCents ?? 0) > c.maxDepositCents ? `Au-dessus du maximum légal (${euros(c.maxDepositCents)}).` : null} hint="Il peut être inférieur au maximum, ou nul." />
        </FicheSection>
      ) : null}

      <FicheSection id="clauses" guides={['clauses']} n={++n} title="Clauses" reference="loi n° 89-462 du 6 juillet 1989, art. 4" done={done('clauses')}>
        <Check checked={t.clauses?.resolutoire !== false} onChange={(v) => set({ clauses: { ...t.clauses, resolutoire: v } })} label="Clause résolutoire" sub="Défaut de paiement, dépôt de garantie non versé, défaut d’assurance, troubles de voisinage constatés par le juge." />
        <Check checked={Boolean(t.clauses?.solidarite)} onChange={(v) => set({ clauses: { ...t.clauses, solidarite: v } })} label="Clause de solidarité entre colocataires" sub={view.tenants.length > 1 || t.colocation ? 'Chacun peut être tenu de payer la totalité du loyer.' : 'Seulement s’il y a plusieurs locataires.'} />
        <Custom clauses={t.clauses?.custom ?? []} warnings={c.clauseWarnings} onChange={(custom) => set({ clauses: { ...t.clauses, custom } })} />
        <Callout tone="tip">Clauses interdites que Bailio signale : interdire tout animal domestique, imposer un assureur, facturer l’état des lieux, prévoir des pénalités de retard, interdire d’héberger ses proches, rendre le locataire responsable des dégradations collectives.</Callout>
        {t.clauses === null || t.clauses === undefined ? (
          <div>
            <Btn size="sm" variant="outline" onClick={() => set({ clauses: { resolutoire: true, solidarite: view.tenants.length > 1 } })}>
              Garder les clauses conseillées
            </Btn>
          </div>
        ) : null}
      </FicheSection>

      <FicheSection id="annexes" guides={['documents', 'diagnostics']} n={++n} title="Annexes" reference="Contrat type, rubrique XI" done={done('annexes')}>
        {view.annexes.map((a) => (
          <div key={a.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
            <span>{a.label}</span>
            <Pill tone={a.done ? 'green' : 'caramel'}>{a.status}</Pill>
          </div>
        ))}
      </FicheSection>

      <FicheSection id="signature" guides={['signature']} n={++n} title="Signature" reference="Code civil, art. 1366 ; Code civil, art. 1367" done={done('signature')}>
        <Fields>
          <Input label="Fait à" value={t.signature?.place} onChange={(v) => set({ signature: { ...t.signature, place: v } })} />
          <Input label="Le" type="date" value={t.signature?.date} onChange={(v) => set({ signature: { ...t.signature, date: v || null } })} hint="Laissez vide pour l’écrire à la main." />
        </Fields>
        <Chips legend="Signature" value={t.signature?.mode ?? null} onChange={(v) => set({ signature: { ...t.signature, mode: v } })} options={[{ value: 'PAPER', label: 'Sur papier' }, { value: 'ELECTRONIC', label: 'Électronique' }]} />
        {t.signature?.mode === 'ELECTRONIC' ? (
          <Callout tone="tip">
            En ligne : chaque signataire reçoit un lien et un code par email, puis signe sur son téléphone. Il faut donc l’adresse email de chacun{view.guarantors.length ? ', garant compris' : ''}. La signature se lance depuis la page du bail.
          </Callout>
        ) : (
          <Callout tone="tip">Sur papier : un exemplaire original par partie{view.guarantors.length ? ', plus un pour le garant' : ''}. Bailio imprime le bail avec les cases de paraphe.</Callout>
        )}
        <div>
          <Btn variant="outline" onClick={preview}>
            Voir le bail complet
          </Btn>
        </div>
      </FicheSection>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>{KIND_LABEL[kind]} · {view.tenantName}</span>
    </FicheLayout>
  )
}

const durationText = (m: number) => (m % 12 === 0 ? `${m / 12} an${m > 12 ? 's' : ''}` : `${m} mois`)

function Custom({ clauses, warnings, onChange }: { clauses: string[]; warnings: Array<{ clause: string; reasons: string[] }>; onChange: (c: string[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Conditions particulières</span>
      {clauses.map((cl, i) => {
        const w = warnings.find((x) => x.clause.trim() === cl.trim())
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <TextArea label={`Clause ${i + 1}`} value={cl} onChange={(v) => onChange(clauses.map((x, j) => (j === i ? v : x)))} rows={2} />
            {w ? <Callout tone="warn">{w.reasons.join(' ')}</Callout> : null}
            <TextLink style={{ fontSize: 14, color: BAI.error }} onClick={() => onChange(clauses.filter((_, j) => j !== i))}>
              Retirer
            </TextLink>
          </div>
        )
      })}
      <TextLink onClick={() => onChange([...clauses, ''])}>+ Ajouter une clause</TextLink>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>Bailio vérifie chaque clause que vous écrivez.</span>
    </div>
  )
}
