import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell, useSpace } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Card, LoadError, Loader, Pill, TextLink, toneColor, useLoad, useToast } from '../../components/kit'
import { Check, Upload } from '../../components/Icons'
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
  if ((data.counts.signedLeases ?? data.counts.leases) === 0 && data.tasks.length === 0) return <FirstSteps name={data.user.firstName} counts={data.counts} />

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
        <Btn variant="outline" to="/espace/situations">
          Que se passe-t-il ?
        </Btn>
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
          {/* Plusieurs envois du même genre (relances, assurances, révisions) : ils se font en une fois. */}
          {(['LATE_RENT', 'INSURANCE', 'REVISION'] as const).some((k) => data.tasks.filter((t) => t.type === k).length >= 2) ? (
            <Link to="/espace/actions" style={{ fontSize: 15, fontWeight: 600, color: BAI.owner }}>
              Plusieurs envois du même genre : les faire en une fois
            </Link>
          ) : null}
          {data.tasks.length ? (
            data.tasks.map((t, i) => <TaskCard key={t.id} task={t} onChange={reload} first={i === 0} />)
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

function TaskCard({ task: t, onChange, first }: { task: Task; onChange: () => void; first?: boolean }) {
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
  // Lien sans compte : le locataire y dépose ses attestations, enregistrées directement avec le bail.
  const askWithLink = (done: string) =>
    run(async () => {
      await api(`/leases/${t.leaseId}/tenant-link`, { method: 'POST', body: { open: true } })
      await api(`/leases/${t.leaseId}/tenant-link/send`, { method: 'POST' })
    }, done)
  const letters = (type: string) => navigate(`/espace/baux/${t.leaseId}/courriers?type=${type}`)

  let actions: Array<{ label: string; onClick: () => unknown; variant?: 'primary' | 'outline' | 'ghost' }> = []
  switch (t.type) {
    case 'LATE_RENT':
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
    case 'STEP':
      if (t.step) {
        const step = t.step
        actions = [{ label: step.label, onClick: () => navigate(step.to) }]
        if (step.optional) actions.push({ label: 'Je n’en ai pas besoin', variant: 'ghost', onClick: () => run(() => api(`/properties/${t.propertyId}/steps/${step.key}`, { method: 'POST', body: { skip: true } }), 'C’est noté. Vous pourrez changer d’avis sur la page du logement.') })
        actions.push({ label: 'Voir toutes les étapes', variant: 'ghost', onClick: () => navigate(`/espace/logements/${t.propertyId}`) })
      }
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
            <Upload color={BAI.caramel} size={26} />
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
