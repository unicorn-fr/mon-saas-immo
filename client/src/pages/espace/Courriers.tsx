import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { GuideKey } from '../../lib/sources'
import { BAI } from '../../constants/bailio-tokens'
import { FicheSection, Fields, FlowHeader } from '../../components/FlowLayout'
import { Btn, Callout, Chips, Computed, Input, LoadError, Loader, Money, NumberField, Select, TextArea, TextLink, Toggle, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { openDoc } from '../../lib/docs'
import { currentPeriod, dateNum, eurosCents, periodLabel, recentPeriods, todayIso } from '../../lib/format'
import { LETTER_TITLES, type LeaseView, type LetterDefaults, type LetterType } from '../../lib/space'
import type { Contact } from '../../lib/contacts'

type Tab =
  | 'RECEIPT'
  | 'REVISION'
  | 'CHARGES'
  | 'RENT_CERTIFICATE'
  | 'E_RECEIPT_CONSENT'
  | 'UNPAID'
  | 'INSURANCE'
  | 'BOILER'
  | 'DAMAGE_REPAIR'
  | 'NUISANCE'
  | 'SMOKE_DETECTOR'
  | 'DEPOSIT_RECEIPT'
  | 'OWNER_CHANGE'
  | 'NOTICE_TO_LEAVE'
  | 'TENANT_NOTICE'
  | 'SHORT_NOTICE_PROOF'
  | 'DEPOSIT_RETURN'
  | 'INSURANCE_CLAIM'
  | 'CONTRACTOR_CLAIM'

/** Courriers rangés par moment de la location : on trouve vite celui qu'il faut. */
const GROUPS: Array<{ title: string; tabs: Array<{ value: Tab; label: string }> }> = [
  {
    title: 'Loyer',
    tabs: [
      { value: 'RECEIPT', label: 'Quittance' },
      { value: 'REVISION', label: 'Révision' },
      { value: 'CHARGES', label: 'Charges' },
      { value: 'RENT_CERTIFICATE', label: 'Attestation de loyer' },
      { value: 'E_RECEIPT_CONSENT', label: 'Quittance par email' },
      { value: 'UNPAID', label: 'Impayés' },
    ],
  },
  {
    title: 'Pendant la location',
    tabs: [
      { value: 'INSURANCE', label: 'Assurance' },
      { value: 'BOILER', label: 'Entretien chaudière' },
      { value: 'DAMAGE_REPAIR', label: 'Dégradations' },
      { value: 'NUISANCE', label: 'Trouble de voisinage' },
      { value: 'SMOKE_DETECTOR', label: 'Détecteurs de fumée' },
      { value: 'DEPOSIT_RECEIPT', label: 'Reçu du dépôt' },
      { value: 'OWNER_CHANGE', label: 'Vente du logement loué' },
    ],
  },
  {
    title: 'Fin de location',
    tabs: [
      { value: 'NOTICE_TO_LEAVE', label: 'Donner congé' },
      { value: 'TENANT_NOTICE', label: 'Congé du locataire' },
      { value: 'SHORT_NOTICE_PROOF', label: 'Préavis d’un mois' },
      { value: 'DEPOSIT_RETURN', label: 'Solde de tout compte' },
    ],
  },
  {
    title: 'Autres courriers',
    tabs: [
      { value: 'INSURANCE_CLAIM', label: 'Sinistre : votre assureur' },
      { value: 'CONTRACTOR_CLAIM', label: 'Réclamation à un artisan' },
    ],
  },
]
/** Garage loué seul : courriers qui ont un sens hors de la loi de 1989 (domain/letters.ts, PARKING_LETTERS). */
const PARKING_TABS: Tab[] = ['RECEIPT', 'REVISION', 'CHARGES', 'UNPAID', 'INSURANCE', 'DAMAGE_REPAIR', 'DEPOSIT_RECEIPT', 'NOTICE_TO_LEAVE', 'TENANT_NOTICE', 'DEPOSIT_RETURN', 'INSURANCE_CLAIM', 'CONTRACTOR_CLAIM']
const groupsFor = (kind?: string) => (kind === 'PARKING' ? GROUPS.map((g) => ({ ...g, tabs: g.tabs.filter((t) => PARKING_TABS.includes(t.value)) })).filter((g) => g.tabs.length) : GROUPS)
/** Courriers adressés à un tiers : le destinataire se choisit dans le carnet. */
const THIRD_PARTY: LetterType[] = ['INSURANCE_CLAIM', 'CONTRACTOR_CLAIM']
const TABS = GROUPS.flatMap((g) => g.tabs)
const UNPAID_TYPES = ['REMINDER', 'FORMAL_NOTICE', 'GUARANTOR_CALL']
/** Rubrique affichée au-dessus du titre de chaque courrier. */
const kickerOf = (type: string) => GROUPS.find((g) => g.tabs.some((t) => t.value === type || (t.value === 'UNPAID' && UNPAID_TYPES.includes(type))))?.title

const fromParam = (t: string | null): Tab => (t === 'REMINDER' || t === 'FORMAL_NOTICE' || t === 'GUARANTOR_CALL' ? 'UNPAID' : TABS.some((x) => x.value === t) ? (t as Tab) : 'RECEIPT')

/** Actes et courriers de la vie du bail. Maquette « Actes et courriers ». */
export default function Courriers() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = fromParam(params.get('type'))
  const { data: lease, error, loading, reload } = useLoad(() => api<LeaseView>(`/leases/${id}`), [id])
  const groups = groupsFor(lease?.kind)

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <FlowHeader
        height={80}
        left={
          <Link to={`/espace/baux/${id}`} style={{ textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>
            Retour
          </Link>
        }
        center={
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>Actes et courriers</span>
            <span className="hide-md" style={{ fontSize: 13, color: BAI.inkSoft }}>
              {lease ? `${lease.tenantName}, ${lease.property.name}` : 'Tous les documents de la vie du bail'}
            </span>
          </div>
        }
        right={
          <Link to="/espace/documents" className="hide-md" style={{ textDecoration: 'none', fontSize: 15, color: BAI.inkMid }}>
            Documents
          </Link>
        }
      />
      <div className="fiche">
        <aside>
          <div className="only-md">
            <Select label="Courrier" value={tab} onChange={(v) => setParams({ type: v }, { replace: true })} options={groups.flatMap((g) => g.tabs.map((t) => ({ value: t.value, label: `${g.title} · ${t.label}` })))} />
          </div>
          <nav className="hide-md" aria-label="Courriers" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {groups.map((g) => (
              <div key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: BAI.inkSoft, padding: '10px 10px 4px' }}>{g.title}</span>
                {g.tabs.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    aria-current={t.value === tab ? 'page' : undefined}
                    onClick={() => setParams({ type: t.value }, { replace: true })}
                    style={{ textAlign: 'left', border: 'none', fontFamily: 'inherit', padding: '9px 10px', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: BAI.ink, fontWeight: t.value === tab ? 600 : 500, background: t.value === tab ? BAI.dividerSoft : 'transparent' }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <main>
          {loading && !lease ? (
            <Loader />
          ) : error || !lease ? (
            <LoadError message={error ?? ''} retry={reload} />
          ) : lease.status === 'DRAFT' ? (
            <Callout tone="tip" title="Ce bail n’est pas encore signé">
              Les quittances et les courriers se préparent une fois le bail signé. <TextLink to={`/espace/baux/${lease.id}`} style={{ fontSize: 13 }}>Retour au bail</TextLink>
            </Callout>
          ) : tab === 'RECEIPT' ? (
            <Receipt lease={lease} onChange={reload} />
          ) : tab === 'UNPAID' ? (
            <Unpaid lease={lease} initial={params.get('type') === 'FORMAL_NOTICE' || params.get('type') === 'GUARANTOR_CALL' ? (params.get('type') as 'FORMAL_NOTICE' | 'GUARANTOR_CALL') : 'REMINDER'} />
          ) : (
            <LetterComposer key={tab} lease={lease} type={tab} n={TABS.findIndex((t) => t.value === tab) + 1} />
          )}
        </main>
      </div>
    </div>
  )
}

// ── Quittance, reçu, avis d'échéance ─────────────────────────────────────────

function Receipt({ lease, onChange }: { lease: LeaseView; onChange: () => void }) {
  const toast = useToast()
  const due = lease.columns.rentCents + lease.columns.chargesCents
  const [doc, setDoc] = useState<'RECEIPT' | 'PARTIAL' | 'NOTICE'>('RECEIPT')
  const [period, setPeriod] = useState(currentPeriod())
  const [amount, setAmount] = useState<number | null>(due)
  const [date, setDate] = useState(todayIso())
  const paid = lease.payments.find((p) => p.period === period)
  const kind = doc === 'NOTICE' ? 'NOTICE' : amount !== null && amount < due ? 'PARTIAL' : 'RECEIPT'
  const periods = doc === 'NOTICE' ? [...recentPeriods(3).reverse(), ...[1, 2].map((i) => currentPeriod(new Date(new Date().getFullYear(), new Date().getMonth() + i, 1)))].filter((v, i, a) => a.indexOf(v) === i) : recentPeriods(13)

  useEffect(() => {
    if (paid && doc !== 'NOTICE') {
      setAmount(paid.amountCents)
      setDate(paid.receivedAt)
    }
  }, [paid, doc])

  const guard = (fn: () => Promise<unknown>) => () => fn().catch(toast.error)
  const pdfPath = doc === 'NOTICE' ? `/leases/${lease.id}/notice/${period}.pdf` : `/leases/${lease.id}/receipts/${period}.pdf`

  const record = async (send: boolean) => {
    if (!amount) return toast.show('Indiquez le montant reçu.', 'error')
    await api(`/leases/${lease.id}/payments`, { method: 'POST', body: { period, amountCents: amount, receivedAt: date } })
    if (send) {
      const r = await api<{ sentTo: string[] }>(`/leases/${lease.id}/receipts/${period}/send`, { method: 'POST' })
      toast.show(`${kind === 'PARTIAL' ? 'Reçu' : 'Quittance'} envoyé${kind === 'PARTIAL' ? '' : 'e'} à ${r.sentTo.join(', ')}.`)
    } else toast.show(`Paiement enregistré. ${kind === 'PARTIAL' ? 'Le reçu' : 'La quittance'} est dans vos documents.`)
    onChange()
  }

  return (
    <FicheSection id="receipt" guides={['quittance']} kicker="Loyer" title="Quittance, reçu et avis d’échéance" reference="loi n° 89-462 du 6 juillet 1989, art. 21">
      <Chips
        legend="Document"
        value={doc}
        onChange={(v) => {
          setDoc(v)
          if (v === 'RECEIPT') setAmount(paid?.amountCents ?? due)
          if (v === 'PARTIAL' && (amount ?? 0) >= due) setAmount(null)
        }}
        options={[
          { value: 'RECEIPT', label: 'Quittance' },
          { value: 'PARTIAL', label: 'Reçu de paiement partiel' },
          { value: 'NOTICE', label: 'Avis d’échéance' },
        ]}
      />
      <Fields>
        <Input label="Locataire" value={lease.tenantName} onChange={() => undefined} disabled />
        <Select label="Période" value={period} onChange={setPeriod} options={periods.map((p) => ({ value: p, label: periodLabel(p, true) }))} />
      </Fields>
      {doc !== 'NOTICE' ? (
        <Fields>
          <Money label="Montant reçu" cents={amount} onChange={setAmount} />
          <Input label="Date de réception" type="date" value={date} onChange={setDate} />
        </Fields>
      ) : null}
      <Computed
        rows={[
          ['Loyer', eurosCents(lease.columns.rentCents)],
          ['Charges', eurosCents(lease.columns.chargesCents)],
          ...(doc === 'NOTICE' ? ([['Total à payer', eurosCents(due)]] as Array<[string, string]>) : ([['Document émis', kind === 'PARTIAL' ? `Reçu, car ${eurosCents(due - (amount ?? 0))} restent dus` : 'Quittance, car le paiement est complet']] as Array<[string, string]>)),
        ]}
      />
      <Callout tone="tip">La quittance est gratuite et due au locataire qui la demande. Un paiement partiel donne un reçu, jamais une quittance.</Callout>
      {paid && doc !== 'NOTICE' ? <span style={{ fontSize: 14, color: BAI.green, fontWeight: 600 }}>Loyer de {periodLabel(period)} déjà enregistré : {eurosCents(paid.amountCents)} reçus le {dateNum(paid.receivedAt)}.</span> : null}
      <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {doc === 'NOTICE' ? (
          <Btn onClick={guard(() => openDoc(pdfPath))}>Ouvrir l’avis d’échéance</Btn>
        ) : (
          <>
            <Btn onClick={guard(() => record(true))} disabled={!lease.tenants.some((t) => t.email)}>
              Enregistrer et envoyer
            </Btn>
            <Btn variant="outline" onClick={guard(() => record(false))}>
              Enregistrer le paiement
            </Btn>
            {paid ? (
              <Btn variant="outline" onClick={guard(() => openDoc(pdfPath))}>
                Voir {paid.full ? 'la quittance' : 'le reçu'}
              </Btn>
            ) : null}
          </>
        )}
      </div>
      {!lease.tenants.some((t) => t.email) && doc !== 'NOTICE' ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pour l’envoyer par email, ajoutez l’adresse du locataire dans sa fiche.</span> : null}
    </FicheSection>
  )
}

// ── Courriers ────────────────────────────────────────────────────────────────

type Letter = Record<string, unknown> & { type: LetterType }

/** Attestations et formulaires : pas de destinataire affiché. */
const ATTESTATIONS: LetterType[] = ['RENT_CERTIFICATE', 'DEPOSIT_RECEIPT', 'SMOKE_DETECTOR', 'E_RECEIPT_CONSENT']

const INFO: Partial<Record<LetterType, { text: string; ref: string; guides?: GuideKey[] }>> = {
  REVISION: { text: 'Bailio récupère l’indice officiel de l’INSEE. La révision n’est pas rétroactive : passé un an après la date prévue, elle est perdue pour cette année.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 17-1', guides: ['revision', 'irl'] },
  INSURANCE: { text: 'Le locataire doit être assuré contre les risques locatifs et remettre une attestation chaque année.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 7 g', guides: ['assurance'] },
  CHARGES: { text: 'Envoyez le décompte par nature de charges au moins un mois avant la régularisation. Les justificatifs restent consultables six mois. Si la régularisation arrive plus d’un an en retard, le locataire peut étaler le paiement sur 12 mois.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 23', guides: ['charges'] },
  NOTICE_TO_LEAVE: { text: 'Vente d’un logement vide : le congé vaut offre de vente au locataire, avec le prix et les conditions ; Bailio y recopie l’article de loi obligatoire. Vente ou reprise d’un logement vide : la notice officielle est jointe automatiquement. Locataire de plus de 65 ans aux ressources modestes : des protections particulières s’appliquent.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 15', guides: ['conge'] },
  TENANT_NOTICE: { text: 'Le préavis court à partir du jour où vous recevez la lettre du locataire. Le motif d’un préavis réduit doit être justifié par le locataire dans sa lettre de congé.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 15 et 25-8', guides: ['congeLocataire'] },
  DEPOSIT_RETURN: { text: 'Le solde de tout compte part du dépôt de garantie : retenues justifiées (devis, facture, état des lieux), loyers impayés et régularisation des charges. En cas de retard de restitution, le locataire a droit à 10 % du loyer mensuel par mois de retard.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 22', guides: ['depot', 'edlSortie'] },
  GUARANTOR_CALL: { text: 'Une caution solidaire peut être appelée dès le premier impayé. Une caution simple seulement après que le locataire a été poursuivi. Si un commandement de payer est délivré, il doit aussi être signifié au garant par commissaire de justice dans les 15 jours.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 22-1 et 24 ; Code civil, art. 2297', guides: ['caution', 'impayes'] },
  NUISANCE: { text: 'Le propriétaire doit agir quand son locataire trouble le voisinage, après une mise en demeure motivée. Gardez les témoignages et les plaintes reçues.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 6-1 et 7' },
  DAMAGE_REPAIR: { text: 'Le locataire répond des dégradations pendant la location, sauf vétusté, malfaçon ou force majeure. Joignez si possible des photos datées.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 7 ; décret n° 87-712', guides: ['reparations'] },
  BOILER: { text: 'L’entretien annuel de la chaudière (gaz, fioul, bois) est à la charge du locataire. L’attestation sert en cas de sinistre.', ref: 'décret n° 2009-649 du 9 juin 2009 ; décret n° 87-712' },
  SHORT_NOTICE_PROOF: { text: 'Le motif du préavis d’un mois doit être justifié dans la lettre de congé. Sans justificatif, le préavis est de trois mois. Pour la zone tendue, aucun justificatif n’est à demander.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 15', guides: ['congeLocataire'] },
  RENT_CERTIFICATE: { text: 'Demandée par la CAF, une banque ou un employeur. Elle reprend le loyer et la date d’entrée enregistrés dans le bail.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 21' },
  DEPOSIT_RECEIPT: { text: 'À remettre au locataire quand il verse le dépôt de garantie. Le montant ne peut dépasser un mois de loyer en vide, deux en meublé.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 22', guides: ['depot'] },
  OWNER_CHANGE: { text: 'En cas de vente du logement loué, le bail continue avec le nouveau propriétaire. Il reprend aussi la restitution du dépôt de garantie.', ref: 'Code civil, art. 1743 ; loi n° 89-462 du 6 juillet 1989, art. 22' },
  SMOKE_DETECTOR: { text: 'Au moins un détecteur de fumée est obligatoire dans chaque logement. Le propriétaire l’installe, le locataire en assure l’entretien.', ref: 'loi n° 2010-238 du 9 mars 2010' },
  E_RECEIPT_CONSENT: { text: 'Envoyer la quittance par email demande l’accord écrit du locataire. Faites-lui signer ce formulaire une fois, puis gardez-le dans vos documents.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 21', guides: ['quittance'] },
  REMINDER: { text: 'Pensez à prévenir le garant. Pour aller plus loin, un commissaire de justice délivre le commandement de payer : Bailio ne remplace pas un professionnel du droit.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 24', guides: ['impayes'] },
  INSURANCE_CLAIM: { text: 'Déclarez le sinistre à l’assurance du logement (assurance propriétaire non occupant ou de copropriété) dans le délai du contrat : 5 jours ouvrés au moins, 2 pour un vol. Si le locataire est concerné, il déclare aussi le sinistre à son propre assureur.', ref: 'Code des assurances, art. L. 113-2' },
  CONTRACTOR_CLAIM: { text: 'Après une mise en demeure restée sans effet, vous pouvez faire reprendre les travaux par une autre entreprise, à un coût raisonnable, et en demander le remboursement à l’artisan. Gardez la facture, les photos et les échanges.', ref: 'Code civil, art. 1222 et 1344' },
  FORMAL_NOTICE: { text: 'La mise en demeure part en lettre recommandée avec accusé de réception. Le garant doit être informé dans les 15 jours d’un commandement de payer.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 24 ; Code civil, art. 1344', guides: ['impayes'] },
}

/**
 * Courrier en cours : valeurs proposées par Bailio, puis chaque modification est enregistrée
 * automatiquement (brouillon gardé avec le bail), pour la retrouver plus tard telle quelle.
 */
function useLetter(leaseId: string, type: LetterType) {
  const { data, error, loading, reload } = useLoad(() => api<LetterDefaults>(`/leases/${leaseId}/letters/defaults/${type}`), [leaseId, type])
  const [letter, setState] = useState<Letter | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    setState(null)
    setDirty(false)
  }, [type])
  useEffect(() => {
    if (data && data.letter.type === type) {
      setState(data.letter as Letter)
      setSavedAt(data.draftSavedAt)
      setDirty(false)
    }
  }, [data, type])
  useEffect(() => {
    if (!dirty || !letter) return
    const t = setTimeout(() => {
      api<{ savedAt: string }>(`/leases/${leaseId}/letters/draft/${type}`, { method: 'PUT', body: letter })
        .then((r) => setSavedAt(r.savedAt))
        .catch(() => undefined)
    }, 700)
    return () => clearTimeout(t)
  }, [letter, dirty, leaseId, type])
  const setLetter = (l: Letter) => {
    setState(l)
    setDirty(true)
  }
  const resetDraft = async () => {
    await api(`/leases/${leaseId}/letters/draft/${type}`, { method: 'DELETE' })
    reload()
  }
  return { defaults: data, error, loading, reload, letter, setLetter, savedAt, resetDraft }
}

function LetterComposer({ lease, type, n }: { lease: LeaseView; type: LetterType; n: number }) {
  const { defaults, error, loading, reload, letter, setLetter, savedAt, resetDraft } = useLetter(lease.id, type)
  if (loading && !letter) return <Loader />
  if (error || !defaults || !letter) return <LoadError message={error ?? ''} retry={reload} />
  const set = (patch: Record<string, unknown>) => setLetter({ ...letter, ...patch })
  return (
    <LetterFrame lease={lease} n={n} title={defaults.title} letter={letter} note={defaults.note} recipient={defaults.recipient} savedAt={savedAt} onReset={resetDraft}>
      <LetterFields lease={lease} letter={letter} set={set} />
    </LetterFrame>
  )
}

function LetterFrame({ lease, n, title, letter, note, recipient, savedAt, onReset, children }: { lease: LeaseView; n: number; title: string; letter: Letter; note: string | null; recipient: { name: string; address: string }; savedAt?: string | null; onReset?: () => Promise<void>; children: ReactNode }) {
  const toast = useToast()
  const [saved, setSaved] = useState<string | null>(null)
  const info = INFO[letter.type]
  const guard = (fn: () => Promise<unknown>) => () => {
    const problem = check(letter)
    if (problem) return toast.show(problem, 'error')
    return fn().catch(toast.error)
  }
  const save = async () => {
    const r = await api<{ documentId: string }>(`/leases/${lease.id}/letters`, { method: 'POST', body: letter })
    setSaved(r.documentId)
    return r.documentId
  }
  const thirdParty = THIRD_PARTY.includes(letter.type)
  const hasEmail = thirdParty ? Boolean((letter.recipient as { email?: string } | undefined)?.email) : lease.tenants.some((t) => t.email)
  return (
    <FicheSection id={letter.type} n={n} kicker={kickerOf(letter.type)} title={title} reference={info?.ref} guides={info?.guides}>
      {note ? <Callout tone={/interdit|pas encore|Aucun/.test(note) ? 'warn' : 'info'}>{note}</Callout> : null}
      {ATTESTATIONS.includes(letter.type) || thirdParty ? null : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
          <span style={{ color: BAI.inkSoft }}>Destinataire</span>
          <span style={{ fontWeight: 600 }}>
            {recipient.name}
            {recipient.address ? `, ${recipient.address}` : ''}
          </span>
        </div>
      )}
      {children}
      {savedAt ? (
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>
          Votre saisie est enregistrée automatiquement ({dateNum(savedAt)}).{' '}
          {onReset ? (
            <TextLink style={{ fontSize: 13 }} onClick={() => void onReset().catch(toast.error)}>
              Repartir des valeurs proposées par Bailio
            </TextLink>
          ) : null}
        </span>
      ) : null}
      {info ? <Callout tone="tip">{info.text}</Callout> : null}
      <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Btn variant="outline" onClick={guard(() => openDoc(`/leases/${lease.id}/letters/preview`, { method: 'POST', body: letter }))}>
          Aperçu
        </Btn>
        <Btn
          variant={hasEmail ? 'outline' : 'primary'}
          onClick={guard(async () => {
            await save()
            toast.show(letter.type === 'REVISION' ? 'Courrier enregistré. Le nouveau loyer s’applique au bail.' : 'Courrier enregistré dans vos documents.')
          })}
        >
          Enregistrer {hasEmail ? '' : 'le courrier'}
        </Btn>
        {hasEmail ? (
          <Btn
            onClick={guard(async () => {
              const id = saved ?? (await save())
              const r = await api<{ sentTo: string[] }>(`/documents/${id}/send`, { method: 'POST' })
              toast.show(`Courrier envoyé à ${r.sentTo.join(', ')}.`)
            })}
          >
            Enregistrer et envoyer par email
          </Btn>
        ) : null}
      </div>
      {saved ? (
        <span style={{ fontSize: 14, color: BAI.green, fontWeight: 600 }}>
          Enregistré.{' '}
          <TextLink style={{ fontSize: 14 }} onClick={guard(() => openDoc(`/documents/${saved}/file`))}>
            Ouvrir le PDF
          </TextLink>
        </span>
      ) : null}
      {['NOTICE_TO_LEAVE', 'FORMAL_NOTICE', 'GUARANTOR_CALL', 'NUISANCE', 'DAMAGE_REPAIR', 'SHORT_NOTICE_PROOF', 'OWNER_CHANGE', 'INSURANCE_CLAIM', 'CONTRACTOR_CLAIM'].includes(letter.type) ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>À envoyer en lettre recommandée avec accusé de réception : imprimez le PDF, ou utilisez un service de lettre recommandée en ligne.</span> : null}
    </FicheSection>
  )
}

/** Vérifications avant l'aperçu ou l'enregistrement, avec un message clair. */
function check(l: Letter): string | null {
  const has = (v: unknown) => v !== null && v !== undefined && v !== ''
  const str = (v: unknown) => (typeof v === 'string' ? v : '')
  switch (l.type) {
    case 'REVISION': {
      const ref = l.irlRef as { value?: number } | null
      const next = l.irlNew as { value?: number } | null
      if (!ref?.value || !next?.value) return 'Indiquez l’indice de référence et le nouvel indice.'
      return has(l.effectiveDate) ? null : 'Indiquez la date de révision.'
    }
    case 'REMINDER':
    case 'FORMAL_NOTICE':
      if (!l.amountCents) return 'Indiquez le montant dû.'
      return (l.periods as string[] | undefined)?.length ? null : 'Indiquez les échéances concernées.'
    case 'CHARGES':
      return (l.lines as Array<{ label: string }> | undefined)?.some((x) => x.label.trim()) ? null : 'Ajoutez au moins une charge récupérable.'
    case 'NOTICE_TO_LEAVE':
      return has(l.leaseEnd) ? null : 'Indiquez la date de fin du bail.'
    case 'TENANT_NOTICE':
      return has(l.receivedDate) ? null : 'Indiquez la date de réception du congé.'
    case 'GUARANTOR_CALL':
      if (!l.amountCents) return 'Indiquez le montant dû.'
      return (l.periods as string[] | undefined)?.length ? null : 'Indiquez les échéances concernées.'
    case 'NUISANCE':
      return str(l.facts).trim() ? null : 'Décrivez les troubles constatés.'
    case 'DAMAGE_REPAIR':
      return (l.items as Array<{ label: string }> | undefined)?.some((x) => x.label.trim()) ? null : 'Indiquez au moins une dégradation.'
    case 'SHORT_NOTICE_PROOF':
      return has(l.receivedDate) && str(l.reason).trim() ? null : 'Indiquez la date du congé et le motif invoqué.'
    case 'OWNER_CHANGE':
      return str(l.newOwnerName).trim() && str(l.newOwnerAddress).trim() && has(l.effectiveDate) ? null : 'Indiquez le nom, l’adresse du nouveau propriétaire et la date de la vente.'
    case 'E_RECEIPT_CONSENT':
      return /.+@.+\..+/.test(str(l.email)) ? null : 'Indiquez l’email du locataire.'
    case 'DEPOSIT_RECEIPT':
      return has(l.receivedDate) && l.amountCents ? null : 'Indiquez le montant et la date du versement.'
    case 'DEPOSIT_RETURN':
      return has(l.keysDate) ? null : 'Indiquez la date de remise des clés.'
    case 'INSURANCE_CLAIM':
      if (!str((l.recipient as { name?: string } | undefined)?.name).trim()) return 'Indiquez votre assureur.'
      return has(l.eventDate) && str(l.circumstances).trim() && str(l.damages).trim() ? null : 'Indiquez la date, les circonstances et les dommages.'
    case 'CONTRACTOR_CLAIM':
      if (!str((l.recipient as { name?: string } | undefined)?.name).trim()) return 'Indiquez l’artisan.'
      return str(l.work).trim() && str(l.problems).trim() ? null : 'Indiquez les travaux et les problèmes constatés.'
  }
  return null
}

const num = (v: unknown) => (typeof v === 'number' ? v : null)
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function LetterFields({ lease, letter, set }: { lease: LeaseView; letter: Letter; set: (p: Record<string, unknown>) => void }) {
  switch (letter.type) {
    case 'REVISION':
      return <RevisionFields lease={lease} letter={letter} set={set} />
    case 'INSURANCE':
      return <Input label="Date d’expiration de l’attestation actuelle" type="date" value={str(letter.expiresAt)} onChange={(v) => set({ expiresAt: v || null })} hint="Laissez vide si vous n’avez jamais reçu d’attestation." />
    case 'CHARGES':
      return <ChargesFields letter={letter} set={set} />
    case 'NOTICE_TO_LEAVE':
      return <NoticeFields lease={lease} letter={letter} set={set} />
    case 'TENANT_NOTICE':
      return (
        <>
          <Input label="Date de réception de la lettre de congé" type="date" value={str(letter.receivedDate)} onChange={(v) => set({ receivedDate: v || null })} hint="Date de remise de la lettre recommandée, de l’acte du commissaire de justice ou de la remise en main propre." />
          {lease.kind === 'VIDE' ? (
            <>
              <Toggle checked={Boolean(letter.reduced)} onChange={(v) => set({ reduced: v })} label="Préavis réduit à un mois" sub="Zone tendue, premier emploi, mutation, perte d’emploi, santé, RSA, AAH ou logement social attribué." />
              {letter.reduced ? <Input label="Motif indiqué par le locataire" value={str(letter.reducedReason)} onChange={(v) => set({ reducedReason: v || null })} placeholder="mutation professionnelle" /> : null}
            </>
          ) : null}
        </>
      )
    case 'DEPOSIT_RETURN':
      return <DepositFields lease={lease} letter={letter} set={set} />
    case 'REMINDER':
    case 'FORMAL_NOTICE':
    case 'GUARANTOR_CALL':
      return <UnpaidFields letter={letter} set={set} />
    case 'NUISANCE':
      return (
        <>
          <TextArea label="Troubles constatés" value={str(letter.facts)} onChange={(v) => set({ facts: v })} rows={4} placeholder="bruits importants la nuit, musique forte après 22 heures" hint="Décrivez les faits, sans jugement. Ils sont repris tels quels dans le courrier." />
          <Fields>
            <Input label="Dates ou période" value={str(letter.dates)} onChange={(v) => set({ dates: v || null })} placeholder="les 12, 14 et 19 septembre" />
            <NumberField label="Délai pour faire cesser (jours)" value={num(letter.delayDays) ?? 8} onChange={(v) => set({ delayDays: Math.max(1, v ?? 8) })} />
          </Fields>
        </>
      )
    case 'DAMAGE_REPAIR':
      return <DamageFields letter={letter} set={set} />
    case 'INSURANCE_CLAIM':
      return (
        <>
          <RecipientFields kind="INSURER" letter={letter} set={set} />
          <Fields>
            <Input label="Numéro de contrat" value={str(letter.policyNumber)} onChange={(v) => set({ policyNumber: v || null })} hint="Gardé avec le logement pour la prochaine fois." />
            <Input label="Date du sinistre" type="date" value={str(letter.eventDate)} onChange={(v) => set({ eventDate: v })} />
          </Fields>
          <Select label="Nature du sinistre" value={str(letter.cause) as Cause} onChange={(v) => set({ cause: v })} options={CAUSES} />
          <TextArea label="Circonstances" value={str(letter.circumstances)} onChange={(v) => set({ circumstances: v })} rows={3} placeholder="fuite du ballon d’eau chaude, constatée par le locataire le matin" />
          <TextArea label="Dommages constatés" value={str(letter.damages)} onChange={(v) => set({ damages: v })} rows={3} placeholder="plafond de la salle de bains taché, parquet du couloir gonflé" />
        </>
      )
    case 'CONTRACTOR_CLAIM':
      return (
        <>
          <RecipientFields kind="ARTISAN" letter={letter} set={set} />
          <Fields>
            <Input label="Travaux réalisés" value={str(letter.work)} onChange={(v) => set({ work: v })} placeholder="remplacement du mitigeur de la cuisine" />
            <Input label="Date de l’intervention" type="date" value={str(letter.workDate)} onChange={(v) => set({ workDate: v || null })} />
          </Fields>
          <Input label="Numéro de facture ou de devis" value={str(letter.invoiceRef)} onChange={(v) => set({ invoiceRef: v || null })} />
          <TextArea label="Problèmes constatés" value={str(letter.problems)} onChange={(v) => set({ problems: v })} rows={3} placeholder="fuite au raccord depuis l’intervention" />
          <NumberField label="Délai pour reprendre les travaux (jours)" value={num(letter.delayDays) ?? 15} onChange={(v) => set({ delayDays: Math.max(8, v ?? 15) })} />
        </>
      )
    case 'BOILER':
      return <Input label="Date du dernier entretien connu" type="date" value={str(letter.lastServiceDate)} onChange={(v) => set({ lastServiceDate: v || null })} hint="Laissez vide si vous n’avez jamais reçu d’attestation. Bailio s’en souviendra pour l’an prochain." />
    case 'SHORT_NOTICE_PROOF':
      return (
        <Fields>
          <Input label="Date de réception du congé" type="date" value={str(letter.receivedDate)} onChange={(v) => set({ receivedDate: v })} />
          <Input label="Motif invoqué par le locataire" value={str(letter.reason)} onChange={(v) => set({ reason: v })} placeholder="mutation professionnelle" />
        </Fields>
      )
    case 'RENT_CERTIFICATE':
      return (
        <>
          <Fields>
            <Input label="Locataire depuis le" type="date" value={str(letter.since)} onChange={(v) => set({ since: v })} />
            <Money label="Loyer hors charges" cents={num(letter.rentCents)} onChange={(c) => set({ rentCents: c ?? 0 })} />
          </Fields>
          <Money label="Charges" cents={num(letter.chargesCents)} onChange={(c) => set({ chargesCents: c ?? 0 })} />
          <Toggle checked={letter.upToDate !== false} onChange={(v) => set({ upToDate: v })} label="Le locataire est à jour de ses loyers" sub="Bailio le déduit des loyers enregistrés. Vous pouvez le corriger." />
        </>
      )
    case 'DEPOSIT_RECEIPT':
      return (
        <>
          <Fields>
            <Money label="Montant reçu" cents={num(letter.amountCents)} onChange={(c) => set({ amountCents: c ?? 0 })} />
            <Input label="Date du versement" type="date" value={str(letter.receivedDate)} onChange={(v) => set({ receivedDate: v })} />
          </Fields>
          <Input label="Moyen de paiement" value={str(letter.method)} onChange={(v) => set({ method: v || null })} placeholder="virement bancaire" />
        </>
      )
    case 'OWNER_CHANGE':
      return (
        <>
          <Fields>
            <Input label="Nouveau propriétaire" value={str(letter.newOwnerName)} onChange={(v) => set({ newOwnerName: v })} placeholder="Monsieur Paul Martin" />
            <Input label="Date de la vente" type="date" value={str(letter.effectiveDate)} onChange={(v) => set({ effectiveDate: v })} />
          </Fields>
          <Input label="Adresse du nouveau propriétaire" value={str(letter.newOwnerAddress)} onChange={(v) => set({ newOwnerAddress: v })} />
          <TextArea label="Comment payer le loyer désormais" value={str(letter.paymentInfo)} onChange={(v) => set({ paymentInfo: v || null })} hint="Facultatif : IBAN ou coordonnées du nouveau propriétaire." />
        </>
      )
    case 'SMOKE_DETECTOR':
      return (
        <Fields>
          <NumberField label="Nombre de détecteurs" value={num(letter.count) ?? 1} onChange={(v) => set({ count: Math.max(1, v ?? 1) })} />
          <Input label="Installés le" type="date" value={str(letter.installedDate)} onChange={(v) => set({ installedDate: v || null })} hint="Facultatif." />
        </Fields>
      )
    case 'E_RECEIPT_CONSENT':
      return <Input label="Email du locataire" type="email" value={str(letter.email)} onChange={(v) => set({ email: v })} hint="Repris de la fiche du locataire. Le formulaire est à faire signer par lui." />
  }
}

type Cause = 'WATER' | 'FIRE' | 'THEFT' | 'STORM' | 'BREAKAGE' | 'OTHER'
const CAUSES: Array<{ value: Cause; label: string }> = [
  { value: 'WATER', label: 'Dégât des eaux' },
  { value: 'FIRE', label: 'Incendie' },
  { value: 'THEFT', label: 'Vol ou cambriolage' },
  { value: 'STORM', label: 'Tempête ou intempéries' },
  { value: 'BREAKAGE', label: 'Bris de glace' },
  { value: 'OTHER', label: 'Autre' },
]

/** Destinataire repris du carnet ; un nouveau contact y est ajouté à l'enregistrement du courrier. */
function RecipientFields({ kind, letter, set }: { kind: 'INSURER' | 'ARTISAN'; letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const { data: contacts } = useLoad(() => api<Contact[]>('/contacts'))
  const r = (letter.recipient as { name: string; address: string; email: string; contactId: string | null } | undefined) ?? { name: '', address: '', email: '', contactId: null }
  const mine = (contacts ?? []).filter((c) => c.kind === kind)
  const pick = (id: string) => {
    const c = mine.find((x) => x.id === id)
    set({ recipient: c ? { name: c.name, address: c.address ?? '', email: c.email ?? '', contactId: c.id } : { name: '', address: '', email: '', contactId: null } })
  }
  const edit = (patch: Partial<typeof r>) => set({ recipient: { ...r, ...patch } })
  return (
    <>
      {mine.length ? <Select label={kind === 'INSURER' ? 'Assureur' : 'Artisan'} value={r.contactId ?? ''} onChange={pick} options={[...mine.map((c) => ({ value: c.id, label: c.trade ? `${c.name} (${c.trade})` : c.name })), { value: '', label: 'Un autre contact' }]} hint="Repris de votre carnet." /> : null}
      <Fields>
        <Input label={kind === 'INSURER' ? 'Nom de l’assureur' : 'Nom de l’artisan ou de l’entreprise'} value={r.name} onChange={(v) => edit({ name: v })} hint={r.contactId ? undefined : 'Ajouté à votre carnet.'} />
        <Input label="Email" type="email" value={r.email} onChange={(v) => edit({ email: v })} inputMode="email" />
      </Fields>
      <Input label="Adresse postale" value={r.address} onChange={(v) => edit({ address: v })} />
    </>
  )
}

function DamageFields({ letter, set }: { letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const items = (letter.items as Array<{ label: string }>) ?? []
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Dégradations constatées</span>
        {items.map((it, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <Input label="" value={it.label} onChange={(v) => set({ items: items.map((x, j) => (j === i ? { label: v } : x)) })} placeholder="porte de la salle de bain fendue" style={{ flex: '1 1 0' }} />
            {items.length > 1 ? (
              <Btn variant="ghost" size="sm" onClick={() => set({ items: items.filter((_, j) => j !== i) })} style={{ height: 50 }}>
                Retirer
              </Btn>
            ) : null}
          </div>
        ))}
        <TextLink onClick={() => set({ items: [...items, { label: '' }] })}>+ Ajouter une dégradation</TextLink>
      </div>
      <NumberField label="Délai pour réparer (jours)" value={num(letter.delayDays) ?? 30} onChange={(v) => set({ delayDays: Math.max(8, v ?? 30) })} />
    </>
  )
}

function RevisionFields({ lease, letter, set }: { lease: LeaseView; letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const ref = (letter.irlRef as { quarter: string; value: number } | null) ?? { quarter: '', value: 0 }
  const next = (letter.irlNew as { quarter: string; value: number } | null) ?? { quarter: '', value: 0 }
  const old = num(letter.oldRentCents) ?? lease.columns.rentCents
  const revised = ref.value && next.value ? Math.round((old * next.value) / ref.value) : null
  const dpe = lease.contract.property.diagnostics?.dpe?.class
  return (
    <>
      <Fields>
        <Input label="Date de révision" type="date" value={str(letter.effectiveDate)} onChange={(v) => set({ effectiveDate: v })} />
        <Money label="Loyer actuel hors charges" cents={old} onChange={(c) => set({ oldRentCents: c ?? 0 })} />
      </Fields>
      <Fields>
        <Input label="Trimestre de référence" value={ref.quarter} onChange={(v) => set({ irlRef: { ...ref, quarter: v } })} placeholder="2025-Q2" hint="Celui indiqué dans le bail." />
        <NumberField label="IRL de référence" step="decimal" value={ref.value || null} onChange={(v) => set({ irlRef: { ...ref, value: v ?? 0 } })} />
      </Fields>
      <Fields>
        <Input label="Trimestre publié un an après" value={next.quarter} onChange={(v) => set({ irlNew: { ...next, quarter: v } })} placeholder="2026-Q2" />
        <NumberField label="Nouvel IRL publié par l’INSEE" step="decimal" value={next.value || null} onChange={(v) => set({ irlNew: { ...next, value: v ?? 0 } })} />
      </Fields>
      <Computed
        rows={[
          ['Loyer actuel', eurosCents(old)],
          ['Nouveau loyer', revised ? eurosCents(revised) : 'Indices à compléter'],
          ['Classe DPE', dpe ? `${dpe}, ${dpe === 'F' || dpe === 'G' ? 'révision interdite' : 'révision autorisée'}` : 'Non renseignée'],
        ]}
      />
    </>
  )
}

function ChargesFields({ letter, set }: { letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const lines = (letter.lines as Array<{ label: string; amountCents: number }>) ?? []
  const provisions = num(letter.provisionsCents) ?? 0
  const real = lines.reduce((a, l) => a + (l.amountCents || 0), 0)
  const setLine = (i: number, patch: Partial<{ label: string; amountCents: number }>) => set({ lines: lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) })
  return (
    <>
      <Fields>
        <NumberField label="Année" value={num(letter.year)} onChange={(v) => set({ year: v ?? new Date().getFullYear() - 1 })} />
        <Money label="Provisions versées sur l’année" cents={provisions} onChange={(c) => set({ provisionsCents: c ?? 0 })} />
      </Fields>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Charges récupérables réelles</span>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <Input label="Nature de la charge" hideLabel={i > 0} value={l.label} onChange={(v) => setLine(i, { label: v })} placeholder="Taxe d’enlèvement des ordures ménagères" style={{ flex: '2 1 0' }} />
            <Money label="Montant réel" hideLabel={i > 0} cents={l.amountCents} onChange={(c) => setLine(i, { amountCents: c ?? 0 })} style={{ flex: '1 1 0' }} />
            <Btn variant="ghost" size="sm" onClick={() => set({ lines: lines.filter((_, j) => j !== i) })} title="Retirer" style={{ height: 50 }}>
              Retirer
            </Btn>
          </div>
        ))}
        <TextLink onClick={() => set({ lines: [...lines, { label: '', amountCents: 0 }] })}>+ Ajouter une charge</TextLink>
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Les dépenses marquées « récupérables » dans l’onglet Argent sont reprises ici automatiquement.</span>
      </div>
      <Computed
        rows={[
          ['Charges réelles', eurosCents(real)],
          ['Provisions versées', eurosCents(provisions)],
          [real >= provisions ? 'Reste à payer par le locataire' : 'À rembourser au locataire', eurosCents(Math.abs(real - provisions))],
        ]}
      />
    </>
  )
}

function NoticeFields({ lease, letter, set }: { lease: LeaseView; letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const reason = str(letter.reason) as 'SALE' | 'RESUMPTION' | 'LEGITIMATE'
  const b = (letter.beneficiary as { name: string; link: string; address: string } | null) ?? { name: '', link: '', address: '' }
  const end = str(letter.leaseEnd)
  const months = lease.computed.noticeMonths
  // Une société (sauf SCI familiale, pour un associé) ne peut pas reprendre le logement.
  const resumption = lease.computed.resumptionAllowed !== false
  const sci = lease.computed.landlordKind === 'SCI'
  const deadline = end ? new Date(Date.UTC(Number(end.slice(0, 4)), Number(end.slice(5, 7)) - 1 - months, Number(end.slice(8, 10)))) : null
  // Garage loué seul : le congé n'a pas à être motivé, seul le préavis du contrat compte.
  if (lease.kind === 'PARKING')
    return (
      <>
        <span style={{ fontSize: 14, color: BAI.inkMid }}>Préavis du contrat : {months} mois avant la fin. Aucun motif n’est nécessaire.</span>
        <Input label="Fin du contrat" type="date" value={end} onChange={(v) => set({ leaseEnd: v })} />
      </>
    )
  return (
    <>
      <span style={{ fontSize: 14, color: BAI.inkMid }}>Délai : {months ? `${months} mois avant la fin du bail` : 'aucun congé nécessaire pour ce type de bail'}.</span>
      <Chips
        legend="Motif"
        value={reason}
        onChange={(v) => set({ reason: v })}
        options={[
          { value: 'SALE' as const, label: 'Vente du logement' },
          ...(resumption || reason === 'RESUMPTION' ? [{ value: 'RESUMPTION' as const, label: 'Reprise pour y habiter' }] : []),
          { value: 'LEGITIMATE' as const, label: 'Motif légitime et sérieux' },
        ]}
      />
      {!resumption ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Le logement appartient à une société : elle ne peut pas donner congé pour reprendre le logement (loi du 6 juillet 1989, art. 13 et 15).</span> : null}
      {sci && reason === 'RESUMPTION' ? <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>SCI familiale : la reprise n’est possible qu’au profit d’un associé.</span> : null}
      <Input label="Fin du bail" type="date" value={end} onChange={(v) => set({ leaseEnd: v })} />
      {reason === 'SALE' ? (
        <>
          <Money label="Prix de vente demandé" cents={num(letter.priceCents)} onChange={(c) => set({ priceCents: c })} />
          <TextArea label="Conditions de la vente" value={str(letter.saleConditions)} onChange={(v) => set({ saleConditions: v || null })} hint="Facultatif. Sans précision, le congé indique un paiement comptant à la signature chez le notaire. Le locataire a deux mois pour accepter l’offre." />
        </>
      ) : null}
      {reason === 'RESUMPTION' ? (
        <>
          <Fields>
            <Input label="Bénéficiaire de la reprise" value={b.name} onChange={(v) => set({ beneficiary: { ...b, name: v } })} />
            <Select
              label="Lien avec vous"
              value={b.link}
              onChange={(v) => set({ beneficiary: { ...b, link: v } })}
              options={(sci ? ['Associé de la SCI'] : ['Moi-même', 'Conjoint', 'Partenaire de PACS', 'Concubin notoire', 'Ascendant', 'Descendant', 'Ascendant du conjoint', 'Descendant du conjoint']).map((x) => ({ value: x, label: x }))}
            />
          </Fields>
          <Input label="Adresse du bénéficiaire" value={b.address} onChange={(v) => set({ beneficiary: { ...b, address: v } })} />
          <TextArea label="Caractère réel et sérieux de la reprise" value={str(letter.justification)} onChange={(v) => set({ justification: v || null })} />
        </>
      ) : null}
      {reason === 'LEGITIMATE' ? <TextArea label="Motif (par exemple : manquements répétés du locataire)" value={str(letter.justification)} onChange={(v) => set({ justification: v || null })} rows={4} /> : null}
      <Computed
        rows={[
          ['Fin du bail', end ? dateNum(end) : 'À indiquer'],
          ['Date limite d’envoi', deadline ? dateNum(deadline) : 'À indiquer'],
          ['Envoi', 'Lettre recommandée, commissaire de justice ou remise contre signature'],
        ]}
      />
    </>
  )
}

function DepositFields({ lease, letter, set }: { lease: LeaseView; letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const deductions = (letter.deductions as Array<{ label: string; justification: string; amountCents: number }>) ?? []
  const deposit = num(letter.depositCents) ?? lease.columns.depositCents
  const keys = str(letter.keysDate)
  const conform = letter.conform !== false
  const total = deductions.reduce((a, d) => a + (d.amountCents || 0), 0)
  const unpaidCents = num(letter.unpaidCents) ?? 0
  const chargesBalance = num(letter.chargesBalanceCents) ?? 0
  const held = num(letter.heldCents) ?? 0
  const balance = deposit - total - unpaidCents - chargesBalance - held
  const deadline = keys ? new Date(Date.UTC(Number(keys.slice(0, 4)), Number(keys.slice(5, 7)) - 1 + (conform ? 1 : 2), Number(keys.slice(8, 10)))) : null
  const setD = (i: number, patch: Partial<{ label: string; justification: string; amountCents: number }>) => set({ deductions: deductions.map((d, j) => (j === i ? { ...d, ...patch } : d)) })
  const newAddress = lease.contract.tenants[0]?.newAddress
  return (
    <>
      <Fields>
        <Money label="Dépôt versé" cents={deposit} onChange={(c) => set({ depositCents: c ?? 0 })} />
        <Input label="Date de remise des clés" type="date" value={keys} onChange={(v) => set({ keysDate: v })} />
      </Fields>
      {!newAddress ? <Callout tone="warn">La nouvelle adresse du locataire n’est pas connue. Indiquez-la dans sa fiche ou lors de l’enregistrement du départ.</Callout> : null}
      <Toggle checked={conform} onChange={(v) => set({ conform: v })} label="L’état des lieux de sortie est conforme à l’entrée" sub="Sinon, le délai de restitution passe à deux mois." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Retenues</span>
        {deductions.map((d, i) => (
          <div key={i} className="col-md" style={{ display: 'flex', gap: 10, alignItems: 'flex-end', paddingBottom: 6 }}>
            <Input label="Motif" value={d.label} onChange={(v) => setD(i, { label: v })} placeholder="Trous dans les murs du séjour, après vétusté" style={{ flex: '2 1 0' }} />
            <Input label="Justificatif" value={d.justification} onChange={(v) => setD(i, { justification: v })} placeholder="Devis peintre" />
            <Money label="Montant" cents={d.amountCents} onChange={(c) => setD(i, { amountCents: c ?? 0 })} />
            <Btn variant="ghost" size="sm" onClick={() => set({ deductions: deductions.filter((_, j) => j !== i) })} style={{ height: 50 }}>
              Retirer
            </Btn>
          </div>
        ))}
        <TextLink onClick={() => set({ deductions: [...deductions, { label: '', justification: '', amountCents: 0 }] })}>+ Ajouter une retenue</TextLink>
      </div>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Solde de tout compte</span>
      <Fields>
        <Money label="Loyers et charges restant dus" cents={unpaidCents} onChange={(c) => set({ unpaidCents: c ?? 0 })} hint="Repris des loyers non enregistrés comme payés." />
        <Money label="Charges à régulariser (au prorata)" cents={Math.abs(chargesBalance)} onChange={(c) => set({ chargesBalanceCents: (c ?? 0) * (chargesBalance < 0 ? -1 : 1) })} />
      </Fields>
      {chargesBalance !== 0 ? (
        <Chips
          legend="Ces charges sont"
          value={chargesBalance < 0 ? 'TENANT' : 'LANDLORD'}
          onChange={(v) => set({ chargesBalanceCents: Math.abs(chargesBalance) * (v === 'TENANT' ? -1 : 1) })}
          options={[
            { value: 'LANDLORD', label: 'Dues par le locataire' },
            { value: 'TENANT', label: 'À rembourser au locataire' },
          ]}
        />
      ) : null}
      {lease.contract.property.habitat === 'COLLECTIVE' ? <Money label="Provision gardée jusqu’à l’approbation des comptes de l’immeuble" cents={held} onChange={(c) => set({ heldCents: Math.min(c ?? 0, Math.round(deposit * 0.2)) })} hint={`20 % du dépôt au plus, soit ${eurosCents(Math.round(deposit * 0.2))}.`} /> : null}
      <Computed
        rows={[
          ['Dépôt versé', eurosCents(deposit)],
          ['Retenues', eurosCents(total)],
          ...(unpaidCents ? [['Loyers restant dus', eurosCents(unpaidCents)] as [string, string]] : []),
          ...(chargesBalance ? [[chargesBalance > 0 ? 'Charges dues' : 'Charges remboursées', eurosCents(Math.abs(chargesBalance))] as [string, string]] : []),
          ...(held ? [['Provision gardée', eurosCents(held)] as [string, string]] : []),
          [balance >= 0 ? 'À restituer' : 'Reste dû par le locataire', eurosCents(Math.abs(balance))],
          ['Avant le', deadline ? `${dateNum(deadline)}, ${conform ? '1 mois' : '2 mois car différences'}` : 'À calculer'],
        ]}
      />
    </>
  )
}

function UnpaidFields({ letter, set }: { letter: Letter; set: (p: Record<string, unknown>) => void }) {
  const periods = (letter.periods as string[]) ?? []
  return (
    <>
      <Fields>
        <Money label="Montant dû" cents={num(letter.amountCents)} onChange={(c) => set({ amountCents: c ?? 0 })} />
        <Input label="Échéances concernées" value={periods.join(', ')} onChange={(v) => set({ periods: v.split(',').map((x) => x.trim()).filter(Boolean) })} placeholder="septembre 2026" hint="Séparées par des virgules." />
      </Fields>
      {letter.type === 'GUARANTOR_CALL' ? (
        <Fields>
          <NumberField label="Délai accordé au garant (jours)" value={num(letter.delayDays) ?? 15} onChange={(v) => set({ delayDays: Math.max(8, v ?? 15) })} />
          <Input label="Commandement de payer délivré le" type="date" value={str(letter.commandDate)} onChange={(v) => set({ commandDate: v || null })} hint="Facultatif." />
        </Fields>
      ) : null}
      {letter.type === 'FORMAL_NOTICE' ? (
        <>
          <NumberField label="Délai accordé (jours)" value={num(letter.delayDays) ?? 8} onChange={(v) => set({ delayDays: Math.max(8, v ?? 8) })} />
          <Toggle checked={letter.guarantorInformed !== false} onChange={(v) => set({ guarantorInformed: v })} label="Le garant est informé" sub="Il reçoit une copie du courrier." />
        </>
      ) : null}
    </>
  )
}

function Unpaid({ lease, initial }: { lease: LeaseView; initial: 'REMINDER' | 'FORMAL_NOTICE' | 'GUARANTOR_CALL' }) {
  const [step, setStep] = useState<'REMINDER' | 'FORMAL_NOTICE' | 'GUARANTOR_CALL' | 'COMMAND'>(initial)
  const { defaults, error, loading, reload, letter, setLetter, savedAt, resetDraft } = useLetter(lease.id, step === 'COMMAND' ? 'FORMAL_NOTICE' : step)
  return (
    <>
      <div style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 20, padding: 'clamp(18px, 3vw, 28px)' }}>
        <Chips
          legend="Étape"
          value={step}
          onChange={setStep}
          options={[
            { value: 'REMINDER', label: 'Relance amiable' },
            { value: 'FORMAL_NOTICE', label: 'Mise en demeure' },
            { value: 'GUARANTOR_CALL', label: 'Appel à la caution' },
            { value: 'COMMAND', label: 'Commandement de payer' },
          ]}
        />
      </div>
      {step === 'COMMAND' ? (
        <FicheSection id="command" guides={['impayes']} kicker="Loyer" title="Commandement de payer" reference="loi n° 89-462 du 6 juillet 1989, art. 24">
          <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>Le commandement de payer est délivré par un commissaire de justice (anciennement huissier). Il laisse six semaines au locataire pour régler sa dette, et déclenche la clause résolutoire du bail. Le garant doit en recevoir une copie dans les 15 jours.</p>
          <Callout tone="tip">Contactez un commissaire de justice près du logement. Bailio prépare pour lui le bail, le décompte des sommes dues et les relances déjà envoyées : tout est dans vos documents.</Callout>
          <div>
            <Btn variant="outline" to={`/espace/documents?type=LETTERS`}>
              Voir les courriers envoyés
            </Btn>
          </div>
        </FicheSection>
      ) : loading && !letter ? (
        <Loader />
      ) : error || !defaults || !letter ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <LetterFrame key={step} lease={lease} n={7} title={LETTER_TITLES[step]} letter={letter} note={defaults.note} recipient={defaults.recipient} savedAt={savedAt} onReset={resetDraft}>
          <UnpaidFields letter={letter} set={(p) => setLetter({ ...letter, ...p })} />
        </LetterFrame>
      )}
    </>
  )
}
