import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell, useSpace } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Card, LoadError, Loader, Pill, TextLink, toneColor, useLoad, useToast, useConfirm } from '../../components/kit'
import { Camera, Check, Euro, Home, Mail, Pencil, Plus, Upload } from '../../components/Icons'
import { Onboarding } from '../../components/Onboarding'
import { api } from '../../lib/api'
import { dayTitle, eurosCents, monthName, plural } from '../../lib/format'
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
  // Trois actions à la fois : les plus urgentes d'abord, le reste sur demande (pas de longue liste à faire défiler).
  const [allTasks, setAllTasks] = useState(false)
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
  const visibleTasks = allTasks ? data.tasks : data.tasks.slice(0, 3)
  return (
    <>
      <FollowUpBanner />
      {user && !user.viewMode && !space ? <ViewQuestion properties={data.counts.properties} /> : null}
      <div className="col-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span className="hide-md" style={{ fontSize: 15, color: BAI.inkSoft }}>
            {dayTitle()}
          </span>
          <h1 style={display('clamp(38px, 5vw, 52px)')}>Bonjour{first ? ` ${first}` : ''}.</h1>
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

      <Tiles data={data} />

      <div className="today-grid">
        <section className="today-main" style={{ gap: 14 }}>
          <div className="hide-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>À faire cette semaine</h2>
            {data.tasks.length ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>Tout est préparé, il vous reste à valider</span> : null}
          </div>
          {/* Plusieurs envois du même genre (relances, assurances, révisions) : ils se font en une fois. */}
          {(['LATE_RENT', 'INSURANCE', 'REVISION'] as const).some((k) => data.tasks.filter((t) => t.type === k).length >= 2) ? (
            <Link to="/espace/actions" style={{ fontSize: 15, fontWeight: 600, color: BAI.owner }}>
              Plusieurs envois du même genre : les faire en une fois
            </Link>
          ) : null}
          {data.tasks.length ? (
            <>
              {visibleTasks.map((t, i) => (
                <div key={t.id} style={simple && i === 0 ? { border: `2px solid ${BAI.cta}`, borderRadius: BAI.radius + 2 } : undefined}>
                  {simple && i === 0 ? <span style={{ display: 'block', padding: '10px 18px 0', fontSize: 14, fontWeight: 700, color: BAI.accentInk }}>À faire maintenant</span> : null}
                  <TaskCard task={t} onChange={reload} first={i === 0} />
                </div>
              ))}
              {data.tasks.length > visibleTasks.length || allTasks ? (
                <Btn variant="outline" onClick={() => setAllTasks(!allTasks)}>
                  {allTasks ? 'Voir moins' : (() => { const rest = data.tasks.length - visibleTasks.length; return `Voir ${rest > 1 ? `les ${rest} autres actions` : 'l’autre action'}` })()}
                </Btn>
              ) : null}
            </>
          ) : (
            <Card>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Rien à faire cette semaine.</span>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Bailio surveille les loyers, les dates du bail et les attestations. Vous serez prévenu dès qu’il y a quelque chose à valider.</span>
            </Card>
          )}
        </section>

        <aside className="today-side">
          <Shortcuts leaseId={data.singleLeaseId} />
          <Agenda items={data.upcoming} />
          <NewsCard />
          <Card title="Vos logements" action={<TextLink to="/espace/logements" style={{ fontSize: 14 }}>Tout voir</TextLink>}>
            {data.properties.length ? (
              data.properties.slice(0, large ? 5 : undefined).map((p) => (
                <Link key={p.id} to={`/espace/logements/${p.id}`} className="tap" style={{ textDecoration: 'none', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
                  <span style={{ color: toneColor(p.status.tone), fontWeight: 600, whiteSpace: 'nowrap' }}>{p.status.label}</span>
                </Link>
              ))
            ) : (
              <TextLink to="/espace/logements/nouveau">Ajouter un logement</TextLink>
            )}
          </Card>
        </aside>
      </div>
    </>
  )
}

const fmtMoney = (c: number) => eurosCents(c).replace(',00 €', ' €')

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
  const month = monthName(Number(s.month.slice(5)))
  const lateTasks = data.tasks.filter((t) => t.type === 'LATE_RENT' && t.leaseId)
  const tiles: Array<{ key: string; label: string; value: string; sub?: string; to: string; tone?: 'error' | 'green' }> = []
  if (s.rentsExpected) {
    tiles.push({ key: 'rents', label: `Loyers ${/^[aeiouyhâàéèê]/i.test(month) ? 'd’' : 'de '}${month}`, value: `${fmtMoney(s.receivedCents)} sur ${fmtMoney(s.expectedCents)}`, sub: `${s.rentsReceived} reçu${s.rentsReceived > 1 ? 's' : ''} sur ${s.rentsExpected}`, to: '/espace/argent' })
    tiles.push(
      s.lateCount
        ? { key: 'late', label: 'Loyers en retard', value: fmtMoney(s.lateCents), sub: plural(s.lateCount, 'bail'), tone: 'error', to: lateTasks.length === 1 ? `/espace/baux/${lateTasks[0].leaseId}/parcours/UNPAID` : lateTasks.length ? '/espace/actions' : '/espace/logements' }
        : { key: 'late', label: 'Loyers en retard', value: 'Aucun', sub: 'Tout est à jour', tone: 'green', to: '/espace/argent' },
    )
  }
  if (s.depositCount) tiles.push({ key: 'deposit', label: 'Dépôts à noter reçus', value: fmtMoney(s.depositCents), sub: plural(s.depositCount, 'bail', 'baux'), to: data.singleLeaseId ? `/espace/baux/${data.singleLeaseId}` : '/espace/logements' })
  if (s.candidates) tiles.push({ key: 'candidates', label: 'Candidatures en attente', value: String(s.candidates), sub: 'À regarder', to: s.candidatesPropertyId ? `/espace/logements/${s.candidatesPropertyId}/candidats` : '/espace/logements' })
  if (!tiles.length) return null
  return (
    <nav aria-label="Chiffres du mois" className="today-tiles">
      {tiles.map((t) => (
        <Link key={t.key} to={t.to} className="tap today-tile" style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 18, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>{t.label}</span>
          <span style={{ fontSize: 'clamp(19px, 2.4vw, 24px)', fontWeight: 700, color: t.tone ? toneColor(t.tone) : BAI.ink, overflowWrap: 'anywhere' }}>{t.value}</span>
          {t.sub ? <span style={{ fontSize: 13, color: BAI.inkMid }}>{t.sub}</span> : null}
        </Link>
      ))}
    </nav>
  )
}

/** Six actions courantes. Quand il faut choisir un bail, on passe par la liste qui convient. */
function Shortcuts({ leaseId }: { leaseId: string | null }) {
  const items = [
    { to: '/espace/argent/releve', label: 'Noter un loyer reçu', icon: <Euro size={22} /> },
    { to: leaseId ? `/espace/baux/${leaseId}#paiements` : '/espace/actions', label: 'Envoyer une quittance', icon: <Mail size={22} /> },
    { to: leaseId ? `/espace/baux/${leaseId}/courriers` : '/espace/logements', label: 'Écrire un courrier', icon: <Pencil size={22} /> },
    { to: leaseId ? `/espace/baux/${leaseId}/etat-des-lieux` : '/espace/logements', label: 'Faire un état des lieux', icon: <Camera size={22} /> },
    { to: '/espace/argent?ajouter=1', label: 'Ajouter une dépense', icon: <Plus size={22} /> },
    { to: '/espace/logements/nouveau', label: 'Ajouter un logement', icon: <Home size={22} /> },
  ]
  return (
    <Card title="Raccourcis">
      <nav aria-label="Raccourcis" className="today-shortcuts">
        {items.map((i) => (
          <Link key={i.label} to={i.to} className="today-shortcut" style={{ textDecoration: 'none', color: BAI.owner, background: BAI.surface, border: `1.5px solid ${BAI.borderStrong}`, borderRadius: 16, padding: '14px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, fontSize: 15, fontWeight: 600, lineHeight: 1.25, minWidth: 0 }}>
            {i.icon}
            {i.label}
          </Link>
        ))}
      </nav>
    </Card>
  )
}

const MONTHS_ABBR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

/** Agenda : les prochains rendez-vous datés, groupés par jour (jour en gros, mois abrégé). Trois d'abord. */
function Agenda({ items }: { items: TodayView['upcoming'] }) {
  const [all, setAll] = useState(false)
  if (!items.length) return null
  const shown = all ? items : items.slice(0, 3)
  const groups: Array<{ iso: string; labels: string[] }> = []
  for (const it of shown) {
    const g = groups[groups.length - 1]
    if (g && g.iso === it.iso) g.labels.push(it.label)
    else groups.push({ iso: it.iso, labels: [it.label] })
  }
  return (
    <Card title="Agenda" style={{ gap: 16 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((g) => (
          <li key={g.iso} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: BAI.sky, color: BAI.owner, borderRadius: 12, padding: '6px 0', lineHeight: 1.1 }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>{Number(g.iso.slice(8, 10))}</span>
              <span style={{ fontSize: 12, fontWeight: 600 }}>{MONTHS_ABBR[Number(g.iso.slice(5, 7)) - 1]}</span>
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, fontSize: 15, lineHeight: 1.4, overflowWrap: 'anywhere' }}>
              {g.labels.map((l) => (
                <span key={l}>{l}</span>
              ))}
            </span>
          </li>
        ))}
      </ul>
      {items.length > 3 ? (
        <button type="button" onClick={() => setAll(!all)} className="tap" style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, textAlign: 'left', cursor: 'pointer' }}>
          {all ? 'Voir moins' : `Voir les ${items.length} rendez-vous`}
        </button>
      ) : null}
    </Card>
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

  return (
    <article style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 18, padding: 'clamp(18px, 3vw, 22px) clamp(18px, 3vw, 24px)', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Pill tone={t.tone}>{t.tag}</Pill>
        <span className="hide-md" style={{ fontSize: 13, color: BAI.inkSoft }}>
          {t.place}
        </span>
      </div>
      <div style={{ fontSize: 'clamp(16px, 2vw, 18px)', fontWeight: 600, lineHeight: 1.35 }}>{t.title}</div>
      {t.text ? <div style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{t.text}</div> : null}
      {actions.length ? (
        // Une seule action en bouton ; les autres choix, plus discrets, à côté.
        <div style={{ display: 'flex', gap: '10px 20px', paddingTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn variant={first ? 'primary' : 'outline'} onClick={actions[0].onClick}>
            {actions[0].label}
          </Btn>
          {actions.slice(1).map((a) => (
            <TextLink key={a.label} onClick={() => void a.onClick()} style={{ fontSize: 15 }}>
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
        <h1 style={display('clamp(42px, 6vw, 60px)')}>Bienvenue{name ? `, ${name}` : ''}.</h1>
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
