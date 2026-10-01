import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell, useSpace } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Card, LoadError, Loader, Pill, TextLink, toneColor, useLoad, useToast } from '../../components/kit'
import { Home, Page, Upload } from '../../components/Icons'
import { api } from '../../lib/api'
import { dayTitle, eurosCents, monthName, plural } from '../../lib/format'
import type { Task, TodayView } from '../../lib/space'
import { useAuth } from '../../lib/auth'
import type { User } from '../../lib/types'

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
  const { data, error, loading, reload } = useLoad(() => api<TodayView>('/today'))
  useEffect(() => {
    if (data) setTaskCount(data.tasks.length)
  }, [data, setTaskCount])

  if (loading && !data) return <Loader />
  if (error || !data) return <LoadError message={error ?? ''} retry={reload} />
  // Serveur pas encore mis à jour (réponse à l'ancien format) : message clair plutôt qu'un plantage.
  if (!Array.isArray(data.tasks) || !data.counts || !data.stats) return <LoadError message="Le serveur de Bailio est en cours de mise à jour. Réessayez dans quelques minutes." retry={reload} />
  if (data.counts.properties === 0 && data.counts.leases === 0) return <FirstSteps name={data.user.firstName} />

  const month = monthName(Number(data.stats.month.slice(5)))
  const first = data.user.firstName
  return (
    <>
      <FollowUpBanner />
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
        {data.stats.rentsExpected ? (
          <div className="hide-md" style={{ display: 'flex', gap: 12 }}>
            <MiniStat label={`Loyers de ${month}`} value={`${data.stats.rentsReceived} reçu${data.stats.rentsReceived > 1 ? 's' : ''} sur ${data.stats.rentsExpected}`} />
            <MiniStat label="Encaissé ce mois" value={eurosCents(data.stats.cashedCents)} />
          </div>
        ) : null}
      </div>

      <div className="split-aside">
        <section className="grow" style={{ gap: 14 }}>
          <div className="hide-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>À faire cette semaine</h2>
            {data.tasks.length ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>Tout est préparé, il vous reste à valider</span> : null}
          </div>
          {data.tasks.length ? (
            data.tasks.map((t) => <TaskCard key={t.id} task={t} onChange={reload} />)
          ) : (
            <Card>
              <span style={{ fontSize: 17, fontWeight: 600 }}>Rien à faire cette semaine.</span>
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>Bailio surveille les loyers, les dates du bail et les attestations. Vous serez prévenu dès qu’il y a quelque chose à valider.</span>
            </Card>
          )}
        </section>

        <aside className="aside">
          {data.upcoming.length ? (
            <Card dark title="Prochaines échéances" style={{ gap: 16 }}>
              {data.upcoming.map((u, i) => (
                <div key={i} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ width: 56, flexShrink: 0, color: BAI.caramel, fontWeight: 700, fontSize: 14 }}>{u.date}</span>
                  <span style={{ fontSize: 14, lineHeight: 1.45 }}>{u.label}</span>
                </div>
              ))}
            </Card>
          ) : null}
          <Card title="Vos logements" action={<TextLink to="/espace/logements" style={{ fontSize: 14 }}>Tout voir</TextLink>}>
            {data.properties.length ? (
              data.properties.map((p) => (
                <Link key={p.id} to={`/espace/logements/${p.id}`} style={{ textDecoration: 'none', color: BAI.ink, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 15 }}>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 14, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{value}</span>
    </div>
  )
}

function TaskCard({ task: t, onChange }: { task: Task; onChange: () => void }) {
  const toast = useToast()
  const navigate = useNavigate()

  const run = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn()
      toast.show(done)
      onChange()
    } catch (e) {
      toast.error(e)
    }
  }
  const reminder = (action: 'done' | 'snooze', done: string) => run(() => api(`/reminders/${t.reminderId}/${action}`, { method: 'POST' }), done)
  const letters = (type: string) => navigate(`/espace/baux/${t.leaseId}/courriers?type=${type}`)

  let actions: Array<{ label: string; onClick: () => unknown; variant?: 'primary' | 'outline' | 'ghost' }> = []
  switch (t.type) {
    case 'LATE_RENT':
      actions = [
        { label: 'Relire la relance', onClick: () => letters('REMINDER') },
        { label: 'Le loyer est arrivé', variant: 'outline', onClick: () => run(() => api(`/leases/${t.leaseId}/payments`, { method: 'POST', body: { period: t.period } }), 'Loyer enregistré. La quittance est prête dans vos documents.') },
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
        {
          label: 'Envoyer la demande par email',
          onClick: () =>
            run(async () => {
              const defaults = await api<{ letter: Record<string, unknown> }>(`/leases/${t.leaseId}/letters/defaults/INSURANCE`)
              const saved = await api<{ documentId: string }>(`/leases/${t.leaseId}/letters`, { method: 'POST', body: defaults.letter })
              await api(`/documents/${saved.documentId}/send`, { method: 'POST' })
            }, 'Demande envoyée à votre locataire.'),
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
        <div className="col-md" style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
          {actions.map((a) => (
            <Btn key={a.label} variant={a.variant ?? 'primary'} onClick={a.onClick}>
              {a.label}
            </Btn>
          ))}
        </div>
      ) : null}
    </article>
  )
}

/** Premier pas : l'espace est vide. Maquette « Premier pas, espace vide ». */
function FirstSteps({ name }: { name: string | null }) {
  const cards = [
    { to: '/espace/logements/nouveau', icon: <Home color={BAI.caramel} size={26} />, title: 'Ajouter un logement', text: 'Quelques questions simples, une à la fois.', main: true },
    { to: '/importer', icon: <Upload color={BAI.caramel} size={26} />, title: 'Importer un bail signé', text: 'Une photo suffit. Bailio remplit tout.' },
    { to: '/espace/baux/nouveau', icon: <Page color={BAI.caramel} size={26} />, title: 'Créer un bail', text: 'Bailio vous demande seulement ce qu’il ne sait pas.' },
  ]
  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 'clamp(8px, 3vw, 40px)' }}>
        <h1 style={display('clamp(42px, 6vw, 60px)')}>Bienvenue{name ? `, ${name}` : ''}.</h1>
        <p style={{ margin: 0, fontSize: 19, color: BAI.inkMid }}>Par quoi commence-t-on ?</p>
      </div>
      <div className="cards-3" style={{ gap: 20 }}>
        {cards.map((c) => (
          <Link key={c.to} to={c.to} style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: c.main ? `2px solid ${BAI.owner}` : `1px solid ${BAI.divider}`, borderRadius: 22, padding: 'clamp(22px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ width: 52, height: 52, borderRadius: 14, background: BAI.night, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</span>
            <span style={{ fontSize: 22, fontWeight: 700 }}>{c.title}</span>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>{c.text}</span>
          </Link>
        ))}
      </div>
      <div style={{ fontSize: 15, color: BAI.inkSoft }}>Vous pourrez faire le reste plus tard, rien ne presse.</div>
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
    <div style={{ background: BAI.caramelLight, borderRadius: 16, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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
