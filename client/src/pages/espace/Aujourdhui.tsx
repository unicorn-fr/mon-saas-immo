import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell, useSpace } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Card, Input, LoadError, Loader, Modal, Pill, Select, Tabs, TextLink, useLoad, useToast, useConfirm } from '../../components/kit'
import { Camera, Check, Euro, Home, Mail, Pencil, People, Upload } from '../../components/Icons'
import { Onboarding } from '../../components/Onboarding'
import { api, downloadPdf, pdfUrl } from '../../lib/api'
import { dayTitle, eurosCents, plural } from '../../lib/format'
import type { Task, TodayView } from '../../lib/space'
import { useAuth } from '../../lib/auth'
import type { User, ViewMode } from '../../lib/types'
import { suggestView, ViewQuestion, ViewSwitch } from '../../components/ViewPicker'
import { getSpace } from '../../lib/shared'
import { NewsCard } from './Nouveautes'

/** « Aujourd'hui » : ce qu'il y a à faire cette semaine, déjà préparé. Maquette « Aujourd'hui ». */
export default function Aujourdhui() {
  return (
    <AppShell>
      <TodayContent />
    </AppShell>
  )
}

function TodayContent() {
  const { setTaskCount } = useSpace()
  const { user } = useAuth()
  const space = getSpace()
  const { data, error, loading, reload } = useLoad(() => api<TodayView>('/today'))
  const [params, setParams] = useSearchParams()
  const tab = (['general', 'rentabilite', 'export'] as const).find((t) => t === params.get('onglet')) ?? 'general'
  const setTab = (t: string) => setParams(t === 'general' ? {} : { onglet: t }, { replace: true })
  useEffect(() => {
    if (data) setTaskCount(data.tasks.length)
  }, [data, setTaskCount])

  if (loading && !data) return <Loader />
  if (error || !data) return <LoadError message={error ?? ''} retry={reload} />
  // Serveur pas encore mis à jour (réponse à l'ancien format) : message clair plutôt qu'un plantage.
  if (!Array.isArray(data.tasks) || !data.counts || !data.stats) return <LoadError message="Le serveur de Bailio est en cours de mise à jour. Réessayez dans quelques minutes." retry={reload} />
  if ((data.counts.signedLeases ?? data.counts.leases) === 0 && data.tasks.length === 0) return <FirstSteps name={data.user.firstName} counts={data.counts} />

  const first = data.user.firstName
  // Vue selon la taille du patrimoine (components/ViewPicker.tsx) : question à la première connexion, puis sélecteur.
  const view: ViewMode = user?.viewMode ?? suggestView(data.counts.properties)
  const simple = view === 'SIMPLE'
  const large = view === 'LARGE' || view === 'AGENCY'
  return (
    <>
      <FollowUpBanner />
      {user && !user.viewMode && !space ? <ViewQuestion properties={data.counts.properties} /> : null}
      <div className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="hide-md" style={{ fontSize: 15, color: BAI.inkSoft }}>
            {dayTitle()}
          </span>
          <h1 style={display('clamp(26px, 3.2vw, 34px)')}>Bienvenue{first ? ` ${first}` : ''} !</h1>
          <span className="only-md" style={{ fontSize: 15, color: BAI.inkMid }}>
            {data.tasks.length ? `${plural(data.tasks.length, 'action')} cette semaine, déjà préparée${data.tasks.length > 1 ? 's' : ''}.` : 'Rien à faire cette semaine.'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {user?.viewMode && !space ? <ViewSwitch value={user.viewMode} /> : null}
          <Btn variant="outline" to="/espace/situations">
            Que se passe-t-il ?
          </Btn>
        </div>
      </div>

      {large ? <PortfolioBar agency={view === 'AGENCY'} /> : null}

      <Tabs label="Tableau de bord" value={tab} onChange={setTab} tabs={[{ value: 'general', label: 'Général' }, { value: 'rentabilite', label: 'Rentabilité' }, { value: 'export', label: 'Export' }]} />

      {tab === 'rentabilite' ? <Profitability /> : tab === 'export' ? <Exports /> : (<>
      <Tiles data={data} />

      <PriorityActions tasks={data.tasks} onChange={reload} simple={simple} />

      <div className="dash-grid">
        <Shortcuts leaseId={data.singleLeaseId} />
        <Agenda items={data.upcoming} properties={data.properties} onChange={reload} />
      </div>
      <NewsCard />
      </>)}
    </>
  )
}

const fmtMoney = (c: number) => eurosCents(c).replace(',00 €', ' €')

/** Onglet « Rentabilité » : l'essentiel du mois et chaque logement en une ligne (même calcul que /espace/patrimoine). */
interface PortfolioLite {
  totals: { properties: number; rented: number; monthlyRentCents: number; monthlyLoanCents: number; monthlyExpensesCents: number; monthlyNetCents: number; grossYield: number | null }
  rows: Array<{ id: string; name: string; rented: boolean; rentCents: number; chargesCents: number; netCents: number }>
}

function Profitability() {
  const { data, error, reload } = useLoad(() => api<PortfolioLite>('/portfolio'))
  if (error) return <LoadError message={error} retry={reload} />
  if (!data) return <Loader />
  const t = data.totals
  const tiles: Array<[string, string, string?]> = [
    ['Loyers et charges attendus', fmtMoney(t.monthlyRentCents), 'par mois'],
    ['Crédits et dépenses', fmtMoney(t.monthlyLoanCents + t.monthlyExpensesCents), 'par mois, en moyenne'],
    [t.monthlyNetCents >= 0 ? 'Il vous reste' : 'De votre poche', fmtMoney(Math.abs(t.monthlyNetCents)), 'par mois, avant impôt'],
    ['Rendement brut', t.grossYield !== null ? `${t.grossYield.toLocaleString('fr-FR')} %` : '—', t.grossYield !== null ? 'par an, logements loués' : 'prix d’achat à renseigner'],
  ]
  return (
    <>
      <div className="today-tiles">
        {tiles.map(([label, value, sub]) => (
          <div key={label} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>{label}</span>
            <span style={{ fontSize: 'clamp(18px, 2vw, 21px)', fontWeight: 600, letterSpacing: '-0.02em' }}>{value}</span>
            {sub ? <span style={{ fontSize: 13, color: BAI.inkMid }}>{sub}</span> : null}
          </div>
        ))}
      </div>
      <Card title="Par logement" action={<TextLink to="/espace/patrimoine" style={{ fontSize: 14 }}>Tableau de bord complet</TextLink>}>
        {data.rows.map((r) => (
          <Link key={r.id} to={`/espace/logements/${r.id}`} className="tap" style={{ textDecoration: 'none', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
            <span style={{ whiteSpace: 'nowrap', fontWeight: 600, color: !r.rented ? BAI.inkSoft : r.netCents >= 0 ? BAI.ink : BAI.error }}>{r.rented ? `${fmtMoney(r.netCents)} / mois` : 'Libre'}</span>
          </Link>
        ))}
      </Card>
    </>
  )
}

/** Onglet « Export » : ce qu'on télécharge ou prépare pour le comptable et les impôts. */
function Exports() {
  const toast = useToast()
  const year = new Date().getFullYear()
  const csv = async (y: number) => {
    try {
      downloadPdf(await pdfUrl(`/money/export?year=${y}`), `bailio-${y}.csv`)
    } catch (e) {
      toast.error(e)
    }
  }
  const items: Array<{ title: string; text: string; action: ReactNode }> = [
    { title: `Export pour le comptable ${year}`, text: 'Loyers, charges et dépenses, une ligne par opération (CSV).', action: <Btn size="sm" variant="outline" onClick={() => void csv(year)}>Télécharger</Btn> },
    { title: `Export ${year - 1}`, text: 'L’année dernière, au même format.', action: <Btn size="sm" variant="outline" onClick={() => void csv(year - 1)}>Télécharger</Btn> },
    { title: 'Bilan par logement', text: 'Loyers, dépenses, résultat et rendement.', action: <Btn size="sm" variant="outline" to="/espace/argent/bilan">Ouvrir</Btn> },
    { title: 'Déclaration des revenus', text: 'Cases à recopier et formulaires remplis.', action: <Btn size="sm" variant="outline" to="/espace/argent/declaration">Ouvrir</Btn> },
    { title: 'Quittances et courriers', text: 'Rangés avec chaque bail, à télécharger un par un.', action: <Btn size="sm" variant="outline" to="/espace/documents">Ouvrir</Btn> },
  ]
  return (
    <div className="grid-2" style={{ display: 'grid', gap: 12 }}>
      {items.map((i) => (
        <div key={i.title} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <strong style={{ fontSize: 16 }}>{i.title}</strong>
          <span style={{ fontSize: 14, color: BAI.inkMid }}>{i.text}</span>
          <span style={{ paddingTop: 4 }}>{i.action}</span>
        </div>
      ))}
    </div>
  )
}

/** Chiffres du mois : une tuile par chiffre, chacune mène à la page qui va bien. */
/** Vue « Patrimoine » ou « Gestion pour d'autres » : le patrimoine, les actions groupées et les exports d'abord. */
function PortfolioBar({ agency }: { agency: boolean }) {
  const links: Array<[string, string]> = [
    ['/espace/patrimoine', 'Tableau de bord du patrimoine'],
    ['/espace/actions', 'Actions groupées'],
    ['/espace/argent', 'Export pour le comptable'],
    ['/espace/structures', 'Structures et sociétés'],
    ['/espace/compte/acces', agency ? 'Accès par propriétaire' : 'Accès partagés'],
  ]
  return (
    <nav aria-label="Patrimoine" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {links.map(([to, label]) => (
          <Link key={to} to={to} className="tap" style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `1.5px solid ${BAI.borderStrong}`, borderRadius: 999, padding: '10px 18px', fontWeight: 600, fontSize: 15 }}>
            {label}
          </Link>
        ))}
      </div>
      {agency ? (
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>Mandats et relevés de gérance : pas encore dans Bailio. En attendant, chaque propriétaire vous donne un accès à son espace.</span>
      ) : null}
    </nav>
  )
}

function Tiles({ data }: { data: TodayView }) {
  const s = data.stats
  const lateTasks = data.tasks.filter((t) => t.type === 'LATE_RENT' && t.leaseId)
  const lateTo = lateTasks.length === 1 ? `/espace/baux/${lateTasks[0].leaseId}/parcours/UNPAID` : lateTasks.length ? '/espace/actions' : '/espace/locataires'
  const tiles: Array<{ key: string; label: string; value: ReactNode; sub?: string; to: string; tone?: 'error' | 'green' | 'warn'; icon: ReactNode }> = [
    { key: 'rented', label: 'Logements loués', value: <>{s.rented ?? 0}<small style={{ fontSize: '0.6em', fontWeight: 600, color: BAI.inkSoft }}>/{s.properties ?? data.counts.properties}</small></>, to: '/espace/logements', icon: <Home size={18} /> },
    { key: 'candidates', label: 'Candidatures', value: String(s.candidates), sub: s.candidates ? 'À regarder' : undefined, to: '/espace/candidats', icon: <People size={18} /> },
    { key: 'rents', label: 'Loyers perçus ce mois-ci', value: <>{fmtMoney(s.receivedCents)}<small style={{ fontSize: '0.6em', fontWeight: 600, color: BAI.inkSoft }}> / {fmtMoney(s.expectedCents)}</small></>, sub: 'perçus / appelés', to: '/espace/banques', tone: 'green', icon: <Euro size={18} /> },
    { key: 'late', label: 'Retards de paiement', value: String(s.lateCount), to: lateTo, tone: s.lateCount ? 'warn' : 'green', icon: <Clock /> },
    { key: 'deposit', label: 'Dépôts de garantie non reçus', value: String(s.depositCount), sub: s.depositCount ? fmtMoney(s.depositCents) : undefined, to: data.singleLeaseId ? `/espace/baux/${data.singleLeaseId}` : '/espace/locataires', icon: <Shield /> },
    { key: 'unpaid', label: 'Impayés', value: s.lateCents ? fmtMoney(s.lateCents) : '0 €', to: lateTo, tone: s.lateCents ? 'error' : 'green', icon: <Alert /> },
  ]
  const bg = (t?: string) => (t === 'error' ? BAI.errorLight : t === 'green' ? BAI.greenLight : t === 'warn' ? BAI.photoSand : BAI.ownerLight)
  const fg = (t?: string) => (t === 'error' ? BAI.error : t === 'green' ? BAI.green : t === 'warn' ? BAI.coralInk : BAI.owner)
  return (
    <nav aria-label="Chiffres du mois" className="dash-tiles">
      {tiles.map((t) => (
        <Link key={t.key} to={t.to} className="tap dash-tile">
          <span style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: BAI.ink }}>{t.label}</span>
            <span style={{ fontSize: 'clamp(24px, 2.4vw, 30px)', fontWeight: 800, letterSpacing: '-0.03em', color: t.tone === 'error' && s.lateCents ? BAI.error : BAI.ink, overflowWrap: 'anywhere', lineHeight: 1 }}>{t.value}</span>
            {t.sub ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{t.sub}</span> : null}
          </span>
          <span aria-hidden style={{ width: 38, height: 38, borderRadius: 19, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg(t.tone), color: fg(t.tone) }}>
            {t.icon}
          </span>
        </Link>
      ))}
    </nav>
  )
}

const Clock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
const Shield = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" aria-hidden>
    <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
  </svg>
)
const Alert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5h.01" />
  </svg>
)

/** Grandes catégories des actions (le détail reste sur l'étiquette de chaque carte). */
const CATEGORY: Record<string, string> = {
  LATE_RENT: 'Paiements', PARTIAL_RENT: 'Paiements', AUTO_RECEIPT: 'Paiements', REVISION: 'Paiements', CHARGES: 'Paiements', SETTLEMENT: 'Paiements',
  INSURANCE: 'Documents', BOILER: 'Documents', NOTICE_UPDATE: 'Documents', INVOICE: 'Documents',
  ISSUE: 'Logement', INVENTORY: 'Logement', INVENTORY_COMPLEMENT: 'Logement', DEPARTURE: 'Logement', LEASE_END: 'Logement',
  STEP: 'Mise en location',
  TAX_DECLARE: 'Impôts',
}
const categoryOf = (t: Task) => CATEGORY[t.type] ?? (t.tag.startsWith('Dépôt') ? 'Paiements' : 'Autres')

/** « Mes actions prioritaires » : une ligne par catégorie avec son nombre, dépliée au clic (la première ouverte). */
function PriorityActions({ tasks, onChange, simple }: { tasks: Task[]; onChange: () => void; simple: boolean }) {
  const tags = [...new Set(tasks.map(categoryOf))]
  // Ouvertes au départ : les catégories des trois actions les plus urgentes.
  const [open, setOpen] = useState<Set<string>>(() => new Set(tasks.slice(0, 3).map(categoryOf)))
  const toggle = (g: string) => setOpen((o) => { const n = new Set(o); if (n.has(g)) n.delete(g); else n.add(g); return n })
  return (
    <section className="dash-card" aria-labelledby="actions-titre">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 id="actions-titre" style={{ margin: 0, fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          Mes actions prioritaires
          <span className="dash-count">{tasks.length}</span>
        </h2>
        {(['LATE_RENT', 'INSURANCE', 'REVISION'] as const).some((k) => tasks.filter((t) => t.type === k).length >= 2) ? (
          <Link to="/espace/actions" style={{ fontSize: 14, fontWeight: 600, color: BAI.owner }}>
            Tout envoyer en une fois
          </Link>
        ) : null}
      </div>
      {tasks.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {tags.map((g) => {
            const list = tasks.filter((t) => categoryOf(t) === g)
            const on = open.has(g)
            return (
              <li key={g} style={{ borderTop: `1px solid ${BAI.divider}` }}>
                <button type="button" aria-expanded={on} onClick={() => toggle(g)} className="dash-acc">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {g}
                    <span className="dash-count">{list.length}</span>
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden style={{ transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {on ? (
                  <div className="panel-in" style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 14 }}>
                    {list.map((t, i) => (
                      <div key={t.id} style={simple && i === 0 && g === tags[0] ? { border: `2px solid ${BAI.cta}`, borderRadius: BAI.radius + 2 } : undefined}>
                        <TaskCard task={t} onChange={onChange} first={i === 0} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Rien à faire pour l’instant. Bailio surveille les loyers, les dates du bail et les attestations.</p>
      )}
    </section>
  )
}

/** « Mes raccourcis » : une action par ligne, icône à gauche, flèche à droite. */
function Shortcuts({ leaseId }: { leaseId: string | null }) {
  const items = [
    { to: '/espace/logements/nouveau', label: 'Ajouter un bien', icon: <Home size={17} /> },
    { to: '/espace/locataires/nouveau', label: 'Ajouter un locataire', icon: <People size={17} /> },
    { to: '/espace/baux/nouveau', label: 'Créer un bail', icon: <Pencil size={17} /> },
    { to: '/espace/banques', label: 'Noter un loyer reçu', icon: <Euro size={17} /> },
    { to: leaseId ? `/espace/baux/${leaseId}#paiements` : '/espace/actions', label: 'Envoyer une quittance', icon: <Mail size={17} /> },
    { to: leaseId ? `/espace/baux/${leaseId}/etat-des-lieux` : '/espace/logements', label: 'Faire un état des lieux', icon: <Camera size={17} /> },
  ]
  return (
    <section className="dash-card" aria-labelledby="raccourcis-titre">
      <h2 id="raccourcis-titre" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
        Mes raccourcis
      </h2>
      <nav aria-label="Raccourcis" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((i) => (
          <Link key={i.label} to={i.to} className="dash-row">
            <span aria-hidden className="dash-ico">
              {i.icon}
            </span>
            <span style={{ flex: 1 }}>{i.label}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M9 6l6 6-6 6" />
            </svg>
          </Link>
        ))}
      </nav>
    </section>
  )
}

const MONTHS_ABBR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Agenda : les prochains rendez-vous datés, groupés par jour (jour en gros, mois abrégé). Trois d'abord. */
type Upcoming = TodayView['upcoming'][number]

/** « Mon agenda » : échéances déduites et rendez-vous saisis (artisan, état des lieux…), groupés par jour. */
function Agenda({ items, properties, onChange }: { items: TodayView['upcoming']; properties: TodayView['properties']; onChange: () => void }) {
  const [all, setAll] = useState(false)
  const [edit, setEdit] = useState<Upcoming | 'new' | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  const shown = all ? items : items.slice(0, 4)
  const groups: Array<{ iso: string; items: Upcoming[] }> = []
  for (const it of shown) {
    const g = groups[groups.length - 1]
    if (g && g.iso === it.iso) g.items.push(it)
    else groups.push({ iso: it.iso, items: [it] })
  }
  const remove = async (it: Upcoming) => {
    if (!(await confirm({ title: 'Supprimer ce rendez-vous ?', text: it.label, confirm: 'Supprimer' }))) return
    try {
      await api(`/interventions/${it.interventionId}`, { method: 'DELETE' })
      toast.show('Rendez-vous supprimé. Il reste 30 jours dans la corbeille.')
      onChange()
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <section className="dash-card" aria-labelledby="agenda-titre">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 id="agenda-titre" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
          Mon agenda
        </h2>
        {properties.length ? (
          <button type="button" className="dash-link" onClick={() => setEdit('new')}>
            + Ajouter un rendez-vous
          </button>
        ) : null}
      </div>
      {items.length ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map((g) => (
            <li key={g.iso} className="agenda-day">
              <span className="agenda-date">
                <span style={{ fontSize: 20, fontWeight: 800 }}>{Number(g.iso.slice(8, 10))}</span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{MONTHS_ABBR[Number(g.iso.slice(5, 7)) - 1]}</span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, flex: 1 }}>
                {g.items.map((it) => (
                  <span key={`${it.label}-${it.interventionId ?? ''}`} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, fontSize: 15, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
                      <span style={{ fontWeight: it.interventionId ? 600 : 400 }}>{it.label}</span>
                      {it.start ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>{it.start}{it.end ? ` – ${it.end}` : ''}</span> : null}
                    </span>
                    {it.interventionId ? (
                      <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button type="button" className="icon-btn" aria-label={`Modifier : ${it.label}`} onClick={() => setEdit(it)}>
                          <Pencil size={16} />
                        </button>
                        <button type="button" className="icon-btn icon-btn--danger" aria-label={`Supprimer : ${it.label}`} onClick={() => remove(it)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                            <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
                          </svg>
                        </button>
                      </span>
                    ) : null}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid }}>Aucun rendez-vous à venir.</p>
      )}
      {items.length > 4 ? (
        <button type="button" onClick={() => setAll(!all)} className="dash-link" style={{ alignSelf: 'flex-start' }}>
          {all ? 'Voir moins' : `Voir les ${items.length} rendez-vous`}
        </button>
      ) : null}
      {edit ? <AppointmentModal item={edit === 'new' ? null : edit} properties={properties} onClose={() => setEdit(null)} onDone={() => { setEdit(null); onChange() }} /> : null}
    </section>
  )
}

/** Rendez-vous de l'agenda : enregistré comme intervention prévue du bien (artisan, visite, état des lieux…). */
function AppointmentModal({ item, properties, onClose, onDone }: { item: Upcoming | null; properties: TodayView['properties']; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [propertyId, setPropertyId] = useState<string | null>(item?.propertyId ?? (properties.length === 1 ? properties[0].id : null))
  const [title, setTitle] = useState(item?.title ?? '')
  const [date, setDate] = useState(item?.iso ?? new Date().toISOString().slice(0, 10))
  const [start, setStart] = useState(item?.start ?? '')
  const [end, setEnd] = useState(item?.end ?? '')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const save = async () => {
    if (!propertyId) return setErr('Choisissez le bien.')
    if (!title.trim()) return setErr('Indiquez l’objet du rendez-vous.')
    setBusy(true)
    setErr(null)
    const body = { title: title.trim(), status: 'PLANNED', date, start: start || null, end: end || null }
    try {
      if (item?.interventionId) await api(`/interventions/${item.interventionId}`, { method: 'PUT', body })
      else await api(`/properties/${propertyId}/interventions`, { method: 'POST', body })
      toast.show(item ? 'Rendez-vous modifié.' : 'Rendez-vous ajouté à l’agenda.')
      onDone()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Le rendez-vous n’a pas été enregistré.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={item ? 'Modifier le rendez-vous' : 'Ajouter un rendez-vous'} actions={<Btn onClick={save} disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</Btn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {item ? null : <Select label="Bien" value={propertyId} onChange={setPropertyId} options={properties.map((p) => ({ value: p.id, label: p.name }))} placeholder="Choisir un bien" />}
        <Input label="Objet" value={title} onChange={setTitle} placeholder="Plombier, serrurier, état des lieux de sortie…" maxLength={160} />
        <Input label="Date" type="date" value={date} onChange={setDate} />
        <div className="grid-2" style={{ gap: 12 }}>
          <Input label="Début (facultatif)" type="time" value={start} onChange={setStart} />
          <Input label="Fin (facultatif)" type="time" value={end} onChange={setEnd} />
        </div>
        {err ? (
          <p role="alert" style={{ margin: 0, color: BAI.error, fontSize: 14 }}>
            {err}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}

function TaskCard({ task: t, onChange, first }: { task: Task; onChange: () => void; first?: boolean }) {
  const toast = useToast()
  const confirm = useConfirm()
  const navigate = useNavigate()

  const run = async (fn: () => Promise<unknown>, done: string, ask?: { title: string; text?: string }) => {
    if (ask && !(await confirm(ask))) return
    try {
      await fn()
      toast.show(done)
      onChange()
    } catch (e) {
      toast.error(e)
    }
  }
  const reminder = (action: 'done' | 'snooze', done: string) => run(() => api(`/reminders/${t.reminderId}/${action}`, { method: 'POST' }), done)
  // Lien sans compte : le locataire y dépose ses attestations, enregistrées directement avec le bail.
  const askWithLink = (done: string) =>
    run(async () => {
      await api(`/leases/${t.leaseId}/tenant-link`, { method: 'POST', body: { open: true } })
      await api(`/leases/${t.leaseId}/tenant-link/send`, { method: 'POST' })
    }, done, { title: 'Envoyer le lien ?', text: 'Votre locataire reçoit par email un lien pour déposer son attestation.' })
  const letters = (type: string) => navigate(`/espace/baux/${t.leaseId}/courriers?type=${type}`)

  let actions: Array<{ label: string; onClick: () => unknown; variant?: 'primary' | 'outline' | 'ghost' }> = []
  switch (t.type) {
    case 'LATE_RENT':
      // Plusieurs mois dus : le parcours d'impayé d'abord (relance, mise en demeure, caution).
      if (t.tag === 'Loyers en retard') {
        actions = [
          { label: 'Voir les étapes', onClick: () => navigate(`/espace/baux/${t.leaseId}/parcours/UNPAID`) },
          { label: 'Relire la relance', variant: 'outline', onClick: () => letters('REMINDER') },
          { label: 'Noter un paiement reçu', variant: 'ghost', onClick: () => navigate(`/espace/baux/${t.leaseId}#paiements`) },
        ]
        break
      }
      actions = [
        { label: 'Relire la relance', onClick: () => letters('REMINDER') },
        { label: 'Que faire en cas d’impayé ?', variant: 'ghost', onClick: () => navigate(`/espace/baux/${t.leaseId}/parcours/UNPAID`) },
        { label: 'Le loyer est arrivé', variant: 'outline', onClick: () => run(() => api(`/leases/${t.leaseId}/payments`, { method: 'POST', body: { period: t.period } }), 'Loyer enregistré. La quittance est prête dans vos documents.') },
      ]
      break
    case 'AUTO_RECEIPT':
      actions = [
        { label: 'Le loyer n’est pas arrivé', onClick: () => run(() => api(`/leases/${t.leaseId}/receipt-hold`, { method: 'POST', body: { period: t.period, hold: true } }), 'La quittance ne partira pas. Vous pouvez envoyer une relance depuis le bail.') },
        { label: 'Il est arrivé : envoyer maintenant', variant: 'ghost', onClick: () => run(() => api(`/leases/${t.leaseId}/payments`, { method: 'POST', body: { period: t.period } }), 'Loyer enregistré. La quittance part à votre locataire.') },
      ]
      break
    case 'PARTIAL_RENT':
      actions = [
        { label: 'Le solde est arrivé', onClick: () => run(() => api(`/leases/${t.leaseId}/payments`, { method: 'POST', body: { period: t.period } }), 'Paiement complet enregistré. La quittance remplace le reçu.') },
        { label: 'Voir le bail', variant: 'outline', onClick: () => navigate(`/espace/baux/${t.leaseId}`) },
      ]
      break
    case 'REVISION':
      actions = [
        { label: 'Voir le calcul et la lettre', onClick: () => letters('REVISION') },
        { label: 'Ne pas réviser cette année', variant: 'outline', onClick: () => reminder('done', 'C’est noté : le loyer reste inchangé cette année.') },
      ]
      break
    case 'INSURANCE':
      actions = [
        { label: 'Demander par email, avec un lien', onClick: () => askWithLink('Votre locataire a reçu un lien pour envoyer son attestation.') },
        {
          variant: 'outline',
          label: 'Envoyer une lettre de demande',
          onClick: () =>
            run(async () => {
              const defaults = await api<{ letter: Record<string, unknown> }>(`/leases/${t.leaseId}/letters/defaults/INSURANCE`)
              const saved = await api<{ documentId: string }>(`/leases/${t.leaseId}/letters`, { method: 'POST', body: defaults.letter })
              await api(`/documents/${saved.documentId}/send`, { method: 'POST' })
            }, 'Demande envoyée à votre locataire.', { title: 'Envoyer la lettre ?', text: 'La lettre de demande part par email à votre locataire.' }),
        },
        { label: 'Me le rappeler plus tard', variant: 'ghost', onClick: () => reminder('snooze', 'Rappel reporté d’une semaine.') },
      ]
      break
    case 'INVENTORY':
      actions = [{ label: t.inventoryId ? 'Reprendre l’état des lieux' : 'Préparer l’état des lieux', onClick: () => navigate(t.inventoryId ? `/edl/${t.inventoryId}` : `/espace/baux/${t.leaseId}/etat-des-lieux`) }]
      break
    case 'LEASE_END':
      actions = [
        { label: 'Préparer un congé', onClick: () => letters('NOTICE_TO_LEAVE') },
        { label: 'Vendre ou reprendre : les étapes', variant: 'ghost', onClick: () => navigate(`/espace/baux/${t.leaseId}/parcours/SALE`) },
        { label: 'Laisser le bail se renouveler', variant: 'outline', onClick: () => reminder('done', 'C’est noté : le bail sera reconduit.') },
      ]
      break
    case 'CHARGES':
      actions = [
        { label: 'Préparer le décompte', onClick: () => letters('CHARGES') },
        { label: 'Me le rappeler plus tard', variant: 'ghost', onClick: () => reminder('snooze', 'Rappel reporté d’une semaine.') },
      ]
      break
    case 'DRAFT_LEASE':
      actions = [{ label: 'Reprendre le bail', onClick: () => navigate(`/espace/baux/${t.leaseId}`) }]
      break
    case 'DEPARTURE':
      actions = [
        { label: t.inventoryId ? 'Reprendre l’état des lieux de sortie' : 'Préparer l’état des lieux de sortie', onClick: () => navigate(t.inventoryId ? `/edl/${t.inventoryId}` : `/espace/baux/${t.leaseId}/etat-des-lieux?type=EXIT`) },
        { label: 'Voir toutes les étapes', variant: 'outline', onClick: () => navigate(`/espace/baux/${t.leaseId}/parcours/DEPARTURE`) },
      ]
      break
    case 'SETTLEMENT':
      actions = t.damages
        ? [
            { label: 'Faire le point sur les dégradations', onClick: () => navigate(`/espace/baux/${t.leaseId}/degradations`) },
            { label: 'Préparer le solde de tout compte', variant: 'ghost', onClick: () => letters('DEPOSIT_RETURN') },
          ]
        : [{ label: 'Préparer le solde de tout compte', onClick: () => letters('DEPOSIT_RETURN') }]
      break
    case 'BOILER':
      actions = [
        { label: 'Demander par email, avec un lien', onClick: () => askWithLink('Votre locataire a reçu un lien pour envoyer l’attestation d’entretien.') },
        { label: 'Préparer une lettre', variant: 'outline', onClick: () => letters('BOILER') },
        { label: 'Me le rappeler dans un mois', variant: 'ghost', onClick: () => run(() => api(`/leases/${t.leaseId}/snooze/BOILER`, { method: 'POST' }), 'Rappel reporté d’un mois.') },
      ]
      break
    case 'NOTICE_UPDATE':
      actions = [
        {
          label: 'Envoyer la nouvelle notice',
          onClick: () =>
            run(() => api(`/leases/${t.leaseId}/notice/send`, { method: 'POST' }), 'Notice envoyée à votre locataire.', { title: 'Envoyer la notice ?', text: 'La notice d’information d’octobre 2026 part par email à votre locataire, en pièce jointe.' }),
        },
        { label: 'Voir la notice', variant: 'outline', onClick: () => window.open('/api/notice-information.pdf', '_blank', 'noopener') },
      ]
      break
    case 'STEP':
      if (t.step) {
        const step = t.step
        actions = [{ label: step.label, onClick: () => navigate(step.to) }]
        if (step.optional) actions.push({ label: 'Je n’en ai pas besoin', variant: 'ghost', onClick: () => run(() => api(`/properties/${t.propertyId}/steps/${step.key}`, { method: 'POST', body: { skip: true } }), 'C’est noté. Vous pourrez changer d’avis sur la page du logement.') })
        if (t.propertyId) actions.push({ label: 'Voir toutes les étapes', variant: 'ghost', onClick: () => navigate(`/espace/logements/${t.propertyId}`) })
      }
      break
    case 'TAX_DECLARE':
      actions = [{ label: 'Déclarer aux impôts', onClick: () => navigate(`/espace/baux/${t.leaseId}/impots${t.mode ? `?mode=${t.mode}` : ''}`) }]
      break
    case 'INVENTORY_COMPLEMENT':
      actions = [{ label: 'Répondre à la demande', onClick: () => navigate(`/edl/${t.inventoryId}`) }]
      break
    case 'ISSUE':
      actions = [{ label: 'Organiser l’intervention', onClick: () => navigate(`/espace/logements/${t.propertyId}?onglet=expenses&intervention=${t.interventionId}`) }]
      break
    case 'INVOICE':
      break
  }

  if (t.type === 'INVOICE') {
    return (
      <article className="col-md" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 18, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Pill tone="green">{t.tag}</Pill>
          <span style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35 }}>{t.title}</span>
        </div>
        <Btn variant="outline" to={`/espace/argent/factures/${t.expenseId}`}>
          Vérifier
        </Btn>
      </article>
    )
  }

  // Carte compacte : étiquette et logement, titre, une ligne d'explication (dépliée au survol ou au clavier), actions.
  return (
    <article className="task" style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Pill tone={t.tone}>{t.tag}</Pill>
        <span className="hide-md" style={{ fontSize: 13, color: BAI.inkSoft }}>
          {t.place}
        </span>
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
      {t.text ? <div className="task-text" style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.45 }}>{t.text}</div> : null}
      {actions.length ? (
        // Une seule action en bouton ; les autres choix, plus discrets, à côté.
        <div style={{ display: 'flex', gap: '8px 18px', paddingTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn size="sm" variant={first ? 'primary' : 'outline'} onClick={actions[0].onClick}>
            {actions[0].label}
          </Btn>
          {actions.slice(1).map((a) => (
            <TextLink key={a.label} onClick={() => void a.onClick()} style={{ fontSize: 14 }}>
              {a.label}
            </TextLink>
          ))}
        </div>
      ) : null}
    </article>
  )
}

/**
 * Démarrage en 3 étapes : logement, locataire, bail. Chaque étape reprend ce qui est déjà saisi ;
 * un bail déjà signé peut être importé d'un coup (photo ou PDF) pour remplir les trois.
 */
function SetupSteps({ counts }: { counts: TodayView['counts'] }) {
  const steps = [
    { done: counts.properties > 0, to: '/espace/logements/nouveau', title: 'Ajouter votre logement', text: 'Adresse, surface, équipements : quelques questions simples, une à la fois.' },
    { done: counts.tenants > 0, to: '/espace/locataires/nouveau', title: 'Ajouter votre locataire', text: 'Son identité, son garant, ses coordonnées.' },
    { done: (counts.signedLeases ?? 0) > 0, to: '/espace/baux/nouveau', title: 'Créer le bail', text: 'Bailio relie le logement et le locataire, et ne vous demande que ce qu’il ne sait pas.' },
  ]
  const next = steps.findIndex((s) => !s.done)
  return (
    <div className="split-aside" style={{ gap: 20 }}>
      <section className="grow" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 22, padding: 'clamp(20px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>{steps.filter((s) => s.done).length} étape{steps.filter((s) => s.done).length > 1 ? 's' : ''} sur 3</span>
        {steps.map((s, i) => (
          <div key={s.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '14px 0', borderTop: i ? `1px solid ${BAI.dividerSoft}` : 'none' }}>
            <span style={{ width: 32, height: 32, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, ...(s.done ? { background: BAI.greenLight, color: BAI.green } : i === next ? { background: BAI.owner, color: BAI.surface } : { border: `1.5px solid ${BAI.dashed}`, color: BAI.inkSoft }) }}>{s.done ? <Check size={16} /> : i + 1}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: s.done ? BAI.inkMid : BAI.ink }}>{s.title}</span>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{s.text}</span>
              {i === next ? (
                <div style={{ paddingTop: 4 }}>
                  <Btn to={s.to}>{i === 0 ? 'Ajouter un logement' : i === 1 ? 'Ajouter un locataire' : s.title}</Btn>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </section>
      <aside className="aside">
        <Link to="/importer" style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 22, padding: 'clamp(20px, 3vw, 28px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ width: 52, height: 52, borderRadius: 14, background: BAI.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload color={BAI.accent} size={26} />
          </span>
          <span style={{ fontSize: 20, fontWeight: 700 }}>J’ai déjà un bail signé</span>
          <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Prenez-le en photo ou déposez le PDF : Bailio remplit le logement, le locataire et le bail en une fois.</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: BAI.owner }}>Importer mon bail</span>
        </Link>
      </aside>
    </div>
  )
}

/** Premier pas : l'espace est vide. Maquette « Premier pas, espace vide ». */
function FirstSteps({ name, counts }: { name: string | null; counts: TodayView['counts'] }) {
  const [later, setLater] = useState(false)
  // Compte tout neuf (seulement un email) : on fait connaissance, puis on propose la première action.
  if (!name && !counts.properties && !counts.tenants && !later) return <Onboarding onLater={() => setLater(true)} />
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 'clamp(8px, 3vw, 40px)' }}>
        <h1 style={display('clamp(26px, 3.2vw, 34px)')}>Bienvenue{name ? `, ${name}` : ''}.</h1>
        <p style={{ margin: 0, fontSize: 19, color: BAI.inkMid }}>Pour commencer, c’est simple comme 1, 2, 3.</p>
      </div>
      <SetupSteps counts={counts} />
      <div style={{ fontSize: 15, color: BAI.inkSoft }}>Tout ce que vous saisissez est enregistré au fur et à mesure : vous pouvez vous arrêter et reprendre plus tard.</div>
    </>
  )
}

/** Rappels par email désactivés : on le dit, avec un bouton pour les activer. */
function FollowUpBanner() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  if (!user || user.followUpActive) return null
  const activate = async () => {
    setUser(await api<User>('/account/follow-up', { method: 'POST' }))
    toast.show('Rappels activés : vous serez prévenu par email.')
  }
  return (
    <div style={{ background: BAI.accentLight, borderRadius: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>Les rappels par email sont désactivés.</span>
        <span style={{ fontSize: 14, color: BAI.inkMid }}>Loyer en retard, révision, attestation d’assurance, fin du bail : activez-les pour ne rien manquer.</span>
      </span>
      <Btn size="sm" onClick={() => activate().catch(toast.error)}>
        Activer les rappels
      </Btn>
    </div>
  )
}
