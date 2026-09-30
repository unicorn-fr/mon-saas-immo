import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { FicheSection, Fields, FlowHeader } from '../../components/FlowLayout'
import { Btn, Callout, Chips, Computed, Input, LoadError, Loader, Money, NumberField, Select, TextArea, TextLink, Toggle, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { openDoc } from '../../lib/docs'
import { currentPeriod, dateNum, eurosCents, periodLabel, recentPeriods, todayIso } from '../../lib/format'
import { LETTER_TITLES, type LeaseView, type LetterDefaults, type LetterType } from '../../lib/space'

type Tab = 'RECEIPT' | 'REVISION' | 'INSURANCE' | 'CHARGES' | 'NOTICE_TO_LEAVE' | 'DEPOSIT_RETURN' | 'UNPAID'

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'RECEIPT', label: 'Quittance' },
  { value: 'REVISION', label: 'Révision' },
  { value: 'INSURANCE', label: 'Assurance' },
  { value: 'CHARGES', label: 'Charges' },
  { value: 'NOTICE_TO_LEAVE', label: 'Congé' },
  { value: 'DEPOSIT_RETURN', label: 'Dépôt de garantie' },
  { value: 'UNPAID', label: 'Impayés' },
]

const fromParam = (t: string | null): Tab => (t === 'REMINDER' || t === 'FORMAL_NOTICE' ? 'UNPAID' : TABS.some((x) => x.value === t) ? (t as Tab) : 'RECEIPT')

/** Actes et courriers de la vie du bail. Maquette « Actes et courriers ». */
export default function Courriers() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const tab = fromParam(params.get('type'))
  const { data: lease, error, loading, reload } = useLoad(() => api<LeaseView>(`/leases/${id}`), [id])

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
          <nav aria-label="Courriers" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map((t, i) => (
              <button
                key={t.value}
                type="button"
                aria-current={t.value === tab ? 'page' : undefined}
                onClick={() => setParams({ type: t.value }, { replace: true })}
                style={{ textAlign: 'left', border: 'none', fontFamily: 'inherit', display: 'flex', gap: 10, alignItems: 'center', padding: '9px 10px', borderRadius: 8, fontSize: 14, cursor: 'pointer', color: BAI.ink, fontWeight: t.value === tab ? 600 : 500, background: t.value === tab ? BAI.dividerSoft : 'transparent' }}
              >
                <span style={{ width: 22, height: 22, borderRadius: 11, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, ...(t.value === tab ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkSoft }) }}>{i + 1}</span>
                {t.label}
              </button>
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
            <Unpaid lease={lease} initial={params.get('type') === 'FORMAL_NOTICE' ? 'FORMAL_NOTICE' : 'REMINDER'} />
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
    <FicheSection id="receipt" n={1} title="Quittance, reçu et avis d’échéance" reference="loi n° 89-462 du 6 juillet 1989, art. 21">
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

const INFO: Partial<Record<LetterType, { text: string; ref: string }>> = {
  REVISION: { text: 'Bailio récupère l’indice officiel de l’INSEE. La révision n’est pas rétroactive : passé un an après la date prévue, elle est perdue pour cette année.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 17-1' },
  INSURANCE: { text: 'Le locataire doit être assuré contre les risques locatifs et remettre une attestation chaque année.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 7 g' },
  CHARGES: { text: 'Envoyez le décompte par nature de charges au moins un mois avant la régularisation. Les justificatifs restent consultables six mois. Si la régularisation arrive plus d’un an en retard, le locataire peut étaler le paiement sur 12 mois.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 23' },
  NOTICE_TO_LEAVE: { text: 'Vente : le congé vaut offre de vente au locataire, avec le prix et les conditions. Reprise : joignez la notice d’information sur vos obligations. Locataire de plus de 65 ans aux ressources modestes : des protections particulières s’appliquent.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 15' },
  DEPOSIT_RETURN: { text: 'Chaque retenue doit être justifiée (devis, facture, état des lieux). En cas de retard, le locataire a droit à 10 % du loyer mensuel par mois de retard.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 22' },
  REMINDER: { text: 'Pensez à prévenir le garant. Pour aller plus loin, un commissaire de justice délivre le commandement de payer : Bailio ne remplace pas un professionnel du droit.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 24' },
  FORMAL_NOTICE: { text: 'La mise en demeure part en lettre recommandée avec accusé de réception. Le garant doit être informé dans les 15 jours d’un commandement de payer.', ref: 'loi n° 89-462 du 6 juillet 1989, art. 24 ; Code civil, art. 1344' },
}

function useLetter(leaseId: string, type: LetterType) {
  const { data, error, loading, reload } = useLoad(() => api<LetterDefaults>(`/leases/${leaseId}/letters/defaults/${type}`), [leaseId, type])
  const [letter, setLetter] = useState<Letter | null>(null)
  useEffect(() => setLetter(null), [type])
  useEffect(() => {
    if (data && data.letter.type === type) setLetter(data.letter as Letter)
  }, [data, type])
  return { defaults: data, error, loading, reload, letter, setLetter }
}

function LetterComposer({ lease, type, n }: { lease: LeaseView; type: LetterType; n: number }) {
  const { defaults, error, loading, reload, letter, setLetter } = useLetter(lease.id, type)
  if (loading && !letter) return <Loader />
  if (error || !defaults || !letter) return <LoadError message={error ?? ''} retry={reload} />
  const set = (patch: Record<string, unknown>) => setLetter({ ...letter, ...patch })
  return (
    <LetterFrame lease={lease} n={n} title={defaults.title} letter={letter} note={defaults.note} recipient={defaults.recipient}>
      <LetterFields lease={lease} letter={letter} set={set} />
    </LetterFrame>
  )
}

function LetterFrame({ lease, n, title, letter, note, recipient, children }: { lease: LeaseView; n: number; title: string; letter: Letter; note: string | null; recipient: { name: string; address: string }; children: ReactNode }) {
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
  const hasEmail = lease.tenants.some((t) => t.email)
  return (
    <FicheSection id={letter.type} n={n} title={title} reference={info?.ref}>
      {note ? <Callout tone={/interdit|pas encore|Aucun/.test(note) ? 'warn' : 'info'}>{note}</Callout> : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14 }}>
        <span style={{ color: BAI.inkSoft }}>Destinataire</span>
        <span style={{ fontWeight: 600 }}>
          {recipient.name}, {recipient.address}
        </span>
      </div>
      {children}
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
      {['NOTICE_TO_LEAVE', 'FORMAL_NOTICE', 'DEPOSIT_RETURN'].includes(letter.type) ? <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>À envoyer en lettre recommandée avec accusé de réception : imprimez le PDF, ou utilisez un service de lettre recommandée en ligne.</span> : null}
    </FicheSection>
  )
}

/** Vérifications avant l'aperçu ou l'enregistrement, avec un message clair. */
function check(l: Letter): string | null {
  const has = (v: unknown) => v !== null && v !== undefined && v !== ''
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
    case 'DEPOSIT_RETURN':
      return has(l.keysDate) ? null : 'Indiquez la date de remise des clés.'
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
    case 'DEPOSIT_RETURN':
      return <DepositFields lease={lease} letter={letter} set={set} />
    case 'REMINDER':
    case 'FORMAL_NOTICE':
      return <UnpaidFields letter={letter} set={set} />
  }
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
            <Input label={i === 0 ? 'Nature de la charge' : ''} value={l.label} onChange={(v) => setLine(i, { label: v })} placeholder="Taxe d’enlèvement des ordures ménagères" style={{ flex: '2 1 0' }} />
            <Money label={i === 0 ? 'Montant réel' : ''} cents={l.amountCents} onChange={(c) => setLine(i, { amountCents: c ?? 0 })} style={{ flex: '1 1 0' }} />
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
  const deadline = end ? new Date(Date.UTC(Number(end.slice(0, 4)), Number(end.slice(5, 7)) - 1 - months, Number(end.slice(8, 10)))) : null
  return (
    <>
      <span style={{ fontSize: 14, color: BAI.inkMid }}>Délai : {months ? `${months} mois avant la fin du bail` : 'aucun congé nécessaire pour ce type de bail'}.</span>
      <Chips
        legend="Motif"
        value={reason}
        onChange={(v) => set({ reason: v })}
        options={[
          { value: 'SALE', label: 'Vente du logement' },
          { value: 'RESUMPTION', label: 'Reprise pour y habiter' },
          { value: 'LEGITIMATE', label: 'Motif légitime et sérieux' },
        ]}
      />
      <Input label="Fin du bail" type="date" value={end} onChange={(v) => set({ leaseEnd: v })} />
      {reason === 'SALE' ? (
        <>
          <Money label="Prix de vente demandé" cents={num(letter.priceCents)} onChange={(c) => set({ priceCents: c })} />
          <TextArea label="Conditions de la vente" value={str(letter.saleConditions)} onChange={(v) => set({ saleConditions: v || null })} hint="Le locataire a deux mois pour accepter l’offre." />
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
              options={['Moi-même', 'Conjoint', 'Partenaire de PACS', 'Concubin notoire', 'Ascendant', 'Descendant', 'Ascendant du conjoint', 'Descendant du conjoint'].map((x) => ({ value: x, label: x }))}
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
      <Computed
        rows={[
          ['Dépôt versé', eurosCents(deposit)],
          ['Retenues', eurosCents(total)],
          ['À restituer', eurosCents(Math.max(0, deposit - total))],
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
      {letter.type === 'FORMAL_NOTICE' ? (
        <>
          <NumberField label="Délai accordé (jours)" value={num(letter.delayDays) ?? 8} onChange={(v) => set({ delayDays: Math.max(8, v ?? 8) })} />
          <Toggle checked={letter.guarantorInformed !== false} onChange={(v) => set({ guarantorInformed: v })} label="Le garant est informé" sub="Il reçoit une copie du courrier." />
        </>
      ) : null}
    </>
  )
}

function Unpaid({ lease, initial }: { lease: LeaseView; initial: 'REMINDER' | 'FORMAL_NOTICE' }) {
  const [step, setStep] = useState<'REMINDER' | 'FORMAL_NOTICE' | 'COMMAND'>(initial)
  const { defaults, error, loading, reload, letter, setLetter } = useLetter(lease.id, step === 'COMMAND' ? 'FORMAL_NOTICE' : step)
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
            { value: 'COMMAND', label: 'Commandement de payer' },
          ]}
        />
      </div>
      {step === 'COMMAND' ? (
        <FicheSection id="command" n={7} title="Commandement de payer" reference="loi n° 89-462 du 6 juillet 1989, art. 24">
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
        <LetterFrame key={step} lease={lease} n={7} title={LETTER_TITLES[step]} letter={letter} note={defaults.note} recipient={defaults.recipient}>
          <UnpaidFields letter={letter} set={(p) => setLetter({ ...letter, ...p })} />
        </LetterFrame>
      )}
    </>
  )
}
