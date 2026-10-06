import { useState } from 'react'
import { Binder } from '../../components/Binder'
import { Journey } from '../../components/Journey'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { Interventions } from '../../components/Interventions'
import { OwnerCard } from '../../components/StructurePicker'
import { LoanCard } from '../../components/LoanCard'
import { AppShell } from '../../components/AppShell'
import { ExpenseModal } from '../../components/ExpenseModal'
import { UploadModal } from '../../components/UploadModal'
import { Btn, Callout, Card, Crumbs, Empty, Line, LoadError, Loader, Modal, PageHead, Pill, Tabs, TextLink, useLoad, useToast, type Tone } from '../../components/kit'
import { api } from '../../lib/api'
import { KIND_LABEL, type DiagnosticRule, type PropertyFile } from '../../lib/contract'
import { documentPath, openDoc } from '../../lib/docs'
import { dateNum, dateShort, eurosCents } from '../../lib/format'
import type { Expense, PropertyView } from '../../lib/space'

type Tab = 'overview' | 'binder' | 'lease' | 'expenses' | 'diagnostics' | 'inventories'
const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'overview', label: 'Vue d’ensemble' },
  { value: 'binder', label: 'Dossier du logement' },
  { value: 'lease', label: 'Bail et locataire' },
  { value: 'expenses', label: 'Travaux et dépenses' },
  { value: 'diagnostics', label: 'Diagnostics' },
  { value: 'inventories', label: 'États des lieux' },
]

/** Page d'un logement. Maquette « Fiche logement ». */
export default function Logement() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<PropertyView>(`/properties/${id}`), [id])
  return (
    <AppShell>
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <PropertyPage p={data} reload={reload} />}
    </AppShell>
  )
}

function PropertyPage({ p, reload }: { p: PropertyView; reload: () => void }) {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('onglet') as Tab) || 'overview'
  const [createOpen, setCreateOpen] = useState(false)
  const facts = [p.kindLabel, p.surface ? `${String(p.surface).replace('.', ',')} m²` : null, p.floor, p.city].filter(Boolean).join(' · ')
  return (
    <>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: p.name }]} />
      <PageHead
        title={p.name}
        sub={facts}
        actions={
          <Btn variant="outline" onClick={() => setCreateOpen(true)}>
            Créer un document
          </Btn>
        }
      />
      {p.journey?.length && !p.journey.every((s) => s.state === 'DONE' || s.state === 'SKIPPED') && tab === 'overview' ? <Journey key={JSON.stringify(p.journey)} propertyId={p.id} steps={p.journey} /> : null}
      <Tabs label="Sections du logement" tabs={p.nature === 'PARKING' ? TABS.filter((t) => t.value !== 'diagnostics').map((t) => (t.value === 'binder' ? { ...t, label: 'Dossier du garage' } : t.value === 'lease' ? { ...t, label: 'Contrat et locataire' } : t)) : TABS} value={tab} onChange={(v) => setParams(v === 'overview' ? {} : { onglet: v }, { replace: true })} />
      {tab === 'overview' ? <Overview p={p} reload={reload} /> : null}
      {tab === 'binder' ? <Binder propertyId={p.id} /> : null}
      {tab === 'lease' ? <LeaseTab p={p} /> : null}
      {tab === 'expenses' ? <ExpensesTab p={p} reload={reload} /> : null}
      {tab === 'diagnostics' ? <DiagnosticsTab p={p} reload={reload} /> : null}
      {tab === 'inventories' ? <InventoriesTab p={p} /> : null}
      <CreateDocument open={createOpen} onClose={() => setCreateOpen(false)} p={p} onSaved={reload} />
    </>
  )
}

const currentLease = (p: PropertyView) => p.leases.find((l) => l.status === 'ACTIVE' || l.status === 'IMPORTED') ?? p.leases.find((l) => l.status === 'DRAFT') ?? null

/** « Ce logement » : chaque sujet tient en une ligne (où on en est), un clic pour y aller. */
function PropertyLinks({ p, reload }: { p: PropertyView; reload: () => void }) {
  const required = p.diagnostics.filter((d) => d.required)
  const expired = required.filter((d) => diagnosticStatus(d, p.file).tone === 'error').length
  const parking = p.nature === 'PARKING'
  const rows: Array<{ label: string; value: string; to: string; tone?: 'caramel' }> = parking ? [
    { label: 'Fiche du garage', value: p.completion.percent < 100 ? `${p.completion.percent} %, à compléter` : 'Complète', to: `/espace/logements/${p.id}/fiche`, tone: p.completion.percent < 100 ? 'caramel' : undefined },
    { label: 'Annonce et candidats', value: 'Ouvrir', to: `/espace/logements/${p.id}/annonce` },
    { label: 'Travaux et interventions', value: 'Ouvrir', to: `/espace/logements/${p.id}?onglet=expenses` },
  ] : [
    { label: 'Fiche du logement', value: p.completion.percent < 100 ? `${p.completion.percent} %, à compléter` : 'Complète', to: `/espace/logements/${p.id}/fiche`, tone: p.completion.percent < 100 ? 'caramel' : undefined },
    { label: 'Diagnostics', value: expired ? `${expired} à refaire` : 'À jour', to: `/espace/logements/${p.id}?onglet=diagnostics`, tone: expired ? 'caramel' : undefined },
    { label: 'Annonce et candidats', value: 'Ouvrir', to: `/espace/logements/${p.id}/annonce` },
    { label: 'Travaux et interventions', value: 'Ouvrir', to: `/espace/logements/${p.id}?onglet=expenses` },
    { label: 'Aides et dispositifs', value: 'Voir', to: `/espace/logements/${p.id}/aides` },
  ]
  return (
    <Card title={parking ? 'Ce garage' : 'Ce logement'} style={{ gap: 0 }}>
      {rows.map((r) => (
        <Link key={r.label} to={r.to} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '13px 0', borderTop: `1px solid ${BAI.dividerSoft}`, textDecoration: 'none', color: BAI.ink, fontSize: 15 }}>
          <span style={{ fontWeight: 600 }}>{r.label}</span>
          <span style={{ color: r.tone === 'caramel' ? BAI.caramelInk : BAI.owner, fontWeight: 600 }}>{r.value}</span>
        </Link>
      ))}
      <OwnerCard propertyId={p.id} structureId={p.structureId} onChanged={reload} compact />
      <LoanCard propertyId={p.id} compact />
      {p.energyWarning ? <Callout tone="warn">{p.energyWarning}</Callout> : null}
    </Card>
  )
}

function Overview({ p, reload }: { p: PropertyView; reload: () => void }) {
  const lease = currentLease(p)
  const [all, setAll] = useState(false)
  const events = all ? p.events : p.events.slice(0, 6)
  return (
    <div className="split-aside" style={{ gap: 28 }}>
      <div className="aside-wide">
        <Card title="La location">
          {lease ? (
            <>
              <Line label="Locataire" value={lease.tenantName || 'À compléter'} />
              <Line label="Loyer par mois" value={`${eurosCents(lease.rentCents + lease.chargesCents)} charges comprises`} />
              <Line label="Bail" value={`Du ${dateNum(lease.startDate)} au ${dateNum(lease.endDate)}`} />
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>{lease.status === 'DRAFT' ? 'Bail en préparation : il n’est pas encore signé.' : KIND_LABEL[lease.kind]}</span>
              <div>
                <Btn variant="outline" size="sm" to={`/espace/baux/${lease.id}`}>
                  Voir le bail
                </Btn>
              </div>
            </>
          ) : (
            <>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Pas de locataire pour l’instant.</span>
              <div>
                <Btn size="sm" to={`/espace/baux/nouveau?logement=${p.id}`}>
                  Créer un bail
                </Btn>
              </div>
            </>
          )}
        </Card>
        <PropertyLinks p={p} reload={reload} />
        <Card dark title={`En ${p.year.year}, ce ${p.nature === 'PARKING' ? 'garage' : 'logement'}`} style={{ gap: 12 }}>
          <Line dark label="a rapporté" value={eurosCents(p.year.incomeCents)} />
          <Line dark label="a coûté" value={eurosCents(p.year.expensesCents)} />
          <Line dark border label="reste" value={<span style={{ color: BAI.caramel, fontWeight: 700 }}>{eurosCents(p.year.incomeCents - p.year.expensesCents)}</span>} />
        </Card>
      </div>
      <Card pad={28} style={{ flex: '1 1 0', gap: 4 }} title={<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, width: '100%', flexWrap: 'wrap', paddingBottom: 12 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Chronologie</h2><span style={{ fontSize: 14, color: BAI.inkSoft }}>Tout ce qui s’est passé dans ce {p.nature === 'PARKING' ? 'garage' : 'logement'}</span></div>}>
        {events.length ? (
          events.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 18, padding: '14px 0', borderTop: `1px solid ${BAI.timeline}` }}>
              <span style={{ width: 72, flexShrink: 0, fontSize: 14, fontWeight: 700, color: BAI.caramelInk }}>{dateShort(e.date)}</span>
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{e.title}</span>
                <span style={{ fontSize: 14, color: BAI.inkMid }}>{e.detail}</span>
              </div>
              <Pill tone={EVENT_TONE[e.kind] ?? 'ink'}>{e.kind}</Pill>
            </div>
          ))
        ) : (
          <span style={{ fontSize: 15, color: BAI.inkMid, padding: '14px 0', borderTop: `1px solid ${BAI.timeline}` }}>Les loyers, les travaux et les documents de ce {p.nature === 'PARKING' ? 'garage' : 'logement'} apparaîtront ici.</span>
        )}
        {p.events.length > 6 ? (
          <div style={{ paddingTop: 10 }}>
            <TextLink onClick={() => setAll(!all)} style={{ fontSize: 14 }}>
              {all ? 'Voir moins' : 'Voir tout l’historique'}
            </TextLink>
          </div>
        ) : null}
      </Card>
    </div>
  )
}

const EVENT_TONE: Record<string, Tone> = { Travaux: 'caramel', Loyer: 'green', Impôt: 'owner', Bail: 'ink', Dépense: 'caramel' }

const addYears = (iso: string, years: number) => {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCMonth(d.getUTCMonth() + Math.round(years * 12))
  return d
}

/** Validité d'un diagnostic, d'après sa date. */
export function diagnosticStatus(d: DiagnosticRule, f: PropertyFile): { label: string; tone: 'ok' | 'error' | 'muted' } {
  const diag = f.diagnostics?.[d.key] as { date?: string | null; class?: string | null; fileId?: string | null } | null | undefined
  if (!d.required) return { label: 'Non exigé', tone: 'muted' }
  if (d.key === 'dpe' && diag?.class) {
    if (diag.date) {
      const until = addYears(diag.date, 10)
      return until < new Date() ? { label: `Classe ${diag.class}, à refaire`, tone: 'error' } : { label: `Classe ${diag.class}, valable`, tone: 'ok' }
    }
    return { label: `Classe ${diag.class}`, tone: 'ok' }
  }
  if (!diag?.date && !diag?.fileId) return { label: 'À ajouter', tone: 'error' }
  if (!diag.date) return { label: 'Joint', tone: 'ok' }
  const years: Record<string, number | null> = { dpe: 10, erp: 0.5, electricity: 6, gas: 6, lead: 6, asbestos: null, noise: null }
  const y = years[d.key]
  if (!y) return { label: `Fait le ${dateNum(diag.date)}`, tone: 'ok' }
  const until = addYears(diag.date, y)
  if (until < new Date()) return { label: d.key === 'erp' ? 'À refaire avant le prochain bail' : 'À refaire', tone: 'error' }
  return { label: `Valable jusqu’en ${until.getUTCFullYear()}`, tone: 'ok' }
}

function LeaseTab({ p }: { p: PropertyView }) {
  const navigate = useNavigate()
  const hasCurrent = p.leases.some((l) => l.status === 'ACTIVE' || l.status === 'DRAFT' || l.status === 'IMPORTED')
  return (
    <div className="split-aside">
      <div className="grow">
        {p.leases.length ? (
          p.leases.map((l) => (
            <Card key={l.id} title={l.tenantName || 'Locataire à compléter'} action={<Pill tone={l.status === 'ACTIVE' || l.status === 'IMPORTED' ? 'green' : l.status === 'DRAFT' ? 'caramel' : 'muted'}>{l.status === 'DRAFT' ? 'En préparation' : l.status === 'ENDED' ? 'Terminé' : 'En cours'}</Pill>}>
              <Line label="Type" value={KIND_LABEL[l.kind]} />
              <Line label="Période" value={`${dateNum(l.startDate)} au ${dateNum(l.endDate)}`} />
              <Line label="Loyer" value={`${eurosCents(l.rentCents)} + ${eurosCents(l.chargesCents)} de charges`} />
              {l.status !== 'DRAFT' && l.status !== 'ENDED' ? <Line label="Ce mois-ci" value={l.rent.label} tone={l.rent.key === 'PAID' ? 'green' : l.rent.key === 'LATE' ? 'error' : undefined} /> : null}
              <div className="col-md" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Btn size="sm" onClick={() => navigate(`/espace/baux/${l.id}`)}>
                  Voir le bail
                </Btn>
                {l.status !== 'DRAFT' ? (
                  <Btn size="sm" variant="outline" to={`/espace/baux/${l.id}/courriers`}>
                    Quittances et courriers
                  </Btn>
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <Empty title="Aucun bail pour ce logement." text="Bailio reprend la fiche du logement et celle du locataire : il ne vous reste que la date d’entrée, le loyer et quelques options." action={<Btn to={`/espace/baux/nouveau?logement=${p.id}`}>Créer un bail</Btn>} />
        )}
      </div>
      <aside className="aside">
        <Card title="Locataires rattachés">
          {p.tenants.length ? (
            p.tenants.map((t) => (
              <Link key={t.id} to={`/espace/locataires/${t.id}`} style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                {t.name || 'Locataire sans nom'}
              </Link>
            ))
          ) : (
            <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun locataire.</span>
          )}
          <TextLink to={`/espace/locataires/nouveau?logement=${p.id}`}>+ Ajouter un locataire</TextLink>
        </Card>
        {p.leases.length && !hasCurrent ? (
          <Card>
            <Btn to={`/espace/baux/nouveau?logement=${p.id}`}>Créer un nouveau bail</Btn>
          </Card>
        ) : null}
      </aside>
    </div>
  )
}

function ExpensesTab({ p, reload }: { p: PropertyView; reload: () => void }) {
  const navigate = useNavigate()
  const [edit, setEdit] = useState<Expense | null>(null)
  const [open, setOpen] = useState(false)
  const load = async (id: string) => {
    const e = await api<Expense>(`/expenses/${id}`)
    setEdit(e)
    setOpen(true)
  }
  return (
    <>
      <div className="col-md" style={{ display: 'flex', gap: 10 }}>
        <Btn to={`/espace/argent/facture?logement=${p.id}`}>Ajouter une facture en photo</Btn>
        <Btn
          variant="outline"
          onClick={() => {
            setEdit(null)
            setOpen(true)
          }}
        >
          Saisir une dépense
        </Btn>
      </div>
      <Interventions propertyId={p.id} />
      <Card title={`Dépenses de ${p.name}`}>
        {p.expenses.length ? (
          <div className="rows" style={{ ['--line' as string]: BAI.dividerSoft }}>
            {p.expenses.map((e) => (
              <button key={e.id} type="button" onClick={() => (e.status === 'TO_VERIFY' ? navigate(`/espace/argent/factures/${e.id}`) : load(e.id))} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', color: BAI.ink }}>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{e.description || e.vendor}</span>
                  <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                    {dateNum(e.date)} · {e.vendor}
                    {e.chargeTo === 'TENANT' ? ' · à refacturer au locataire' : ''}
                  </span>
                </span>
                <span style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                  {e.status === 'TO_VERIFY' ? <Pill tone="green">À vérifier</Pill> : null}
                  <span style={{ fontWeight: 700 }}>{eurosCents(e.amountCents)}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucune dépense enregistrée pour ce logement.</span>
        )}
      </Card>
      <ExpenseModal open={open} onClose={() => setOpen(false)} onSaved={reload} expense={edit} propertyId={p.id} />
    </>
  )
}

function DiagnosticsTab({ p, reload }: { p: PropertyView; reload: () => void }) {
  const [upload, setUpload] = useState<string | null>(null)
  const docs = p.documents.filter((d) => d.kind === 'DIAGNOSTIC')
  const toast = useToast()
  return (
    <div className="split-aside">
      <div className="grow">
        <Card title="Dossier de diagnostic technique" action={<TextLink to={`/espace/logements/${p.id}/fiche#diagnostics`} style={{ fontSize: 14 }}>Renseigner dans la fiche</TextLink>}>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>Les diagnostics exigés dépendent de l’année de construction et des installations du logement. Ils sont joints au bail.</span>
          <div className="rows" style={{ ['--line' as string]: BAI.dividerSoft }}>
            {p.diagnostics.map((d) => {
              const st = diagnosticStatus(d, p.file)
              return (
                <div key={d.key} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '16px 0', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{d.label}</span>
                    <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>
                      {d.reason}
                      {d.required ? ` Validité : ${d.validity}` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                    <Pill tone={st.tone === 'ok' ? 'green' : st.tone === 'error' ? 'error' : 'muted'}>{st.label}</Pill>
                    {d.required ? (
                      <Btn size="sm" variant="outline" onClick={() => setUpload(d.key)}>
                        Joindre
                      </Btn>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      <aside className="aside">
        <Card title="Documents joints">
          {docs.length ? (
            docs.map((d) => (
              <button key={d.id} type="button" onClick={() => openDoc(documentPath(d.id)).catch(toast.error)} style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, cursor: 'pointer' }}>
                {d.title}
              </button>
            ))
          ) : (
            <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucun diagnostic joint.</span>
          )}
        </Card>
        {p.energyWarning ? <Callout tone="warn">{p.energyWarning}</Callout> : null}
      </aside>
      <UploadModal open={upload !== null} onClose={() => setUpload(null)} onSaved={reload} propertyId={p.id} kind="DIAGNOSTIC" diagnostic={upload ?? undefined} />
    </div>
  )
}

function InventoriesTab({ p }: { p: PropertyView }) {
  const toast = useToast()
  const lease = currentLease(p)
  return (
    <div className="split-aside">
      <div className="grow">
        {p.inventories.length ? (
          <Card title="États des lieux">
            <div className="rows" style={{ ['--line' as string]: BAI.dividerSoft }}>
              {p.inventories.map((i) => (
                <div key={i.id} className="col-md" style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '14px 0', alignItems: 'center' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>État des lieux {i.kind === 'ENTRY' ? 'd’entrée' : 'de sortie'}</span>
                    <span style={{ fontSize: 13, color: BAI.inkSoft }}>{i.status === 'SIGNED' ? `Signé${i.date ? ` le ${dateNum(i.date)}` : ''}` : 'En cours'}</span>
                  </span>
                  {i.status === 'SIGNED' ? (
                    <Btn size="sm" variant="outline" onClick={() => openDoc(`/inventories/${i.id}/pdf`).catch(toast.error)}>
                      Ouvrir le PDF
                    </Btn>
                  ) : (
                    <Btn size="sm" to={`/edl/${i.id}`}>
                      Reprendre
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Empty title="Aucun état des lieux." text="Les pièces, les compteurs et les clés sont préparés à partir de la fiche du logement. Vous le faites sur votre téléphone, photos comprises." />
        )}
      </div>
      <aside className="aside">
        <Card title="Faire un état des lieux">
          {lease && lease.status !== 'ENDED' ? (
            <Btn to={`/espace/baux/${lease.id}/etat-des-lieux`}>Lancer un état des lieux</Btn>
          ) : (
            <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Un état des lieux se fait avec un bail. Créez d’abord le bail de ce logement.</span>
          )}
        </Card>
      </aside>
    </div>
  )
}

function CreateDocument({ open, onClose, p, onSaved }: { open: boolean; onClose: () => void; p: PropertyView; onSaved: () => void }) {
  const navigate = useNavigate()
  const lease = currentLease(p)
  const [upload, setUpload] = useState(false)
  const go = (to: string) => {
    onClose()
    navigate(to)
  }
  const items = [
    { title: 'Bail', text: 'Vide ou meublé, conforme au contrat type', onClick: () => go(lease?.status === 'DRAFT' ? `/espace/baux/${lease.id}` : `/espace/baux/nouveau?logement=${p.id}`) },
    ...(lease && lease.status !== 'DRAFT'
      ? [
          { title: 'Quittance ou avis d’échéance', text: 'Pour un mois, envoyée par email si vous le souhaitez', onClick: () => go(`/espace/baux/${lease.id}/courriers?type=RECEIPT`) },
          { title: 'Courrier', text: 'Relance, révision, congé, dépôt de garantie', onClick: () => go(`/espace/baux/${lease.id}/courriers`) },
          { title: 'État des lieux', text: 'D’entrée ou de sortie, sur téléphone', onClick: () => go(`/espace/baux/${lease.id}/etat-des-lieux`) },
        ]
      : []),
    {
      title: 'Ajouter un document',
      text: 'Diagnostic, attestation, courrier reçu',
      onClick: () => {
        onClose()
        setUpload(true)
      },
    },
  ]
  return (
    <>
      <Modal open={open} onClose={onClose} title="Créer un document" width={620}>
        {!lease ? <Callout tone="info">Quittances, courriers et états des lieux se préparent une fois le bail créé.</Callout> : null}
        <div className="grid-2" style={{ gap: 12 }}>
          {items.map((it) => (
            <button key={it.title} type="button" onClick={it.onClick} style={{ textAlign: 'left', border: `1px solid ${BAI.divider}`, background: BAI.surface, borderRadius: 16, padding: 18, fontFamily: 'inherit', color: BAI.ink, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{it.title}</span>
              <span style={{ fontSize: 14, color: BAI.inkMid }}>{it.text}</span>
            </button>
          ))}
        </div>
      </Modal>
      <UploadModal open={upload} onClose={() => setUpload(false)} onSaved={onSaved} propertyId={p.id} />
    </>
  )
}
