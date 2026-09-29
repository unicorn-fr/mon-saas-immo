import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { EspaceLayout } from '../../components/EspaceLayout'
import { Check } from '../../components/Icons'
import { Button, Notice, Spinner, display, overline } from '../../components/ui'
import { api, ApiError, downloadPdf, pdfUrl } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { useDraft } from '../../lib/draft'
import { addMonths, dateFr, euros, parseIso } from '../../lib/lease'
import type { Reminder, Today, User } from '../../lib/types'

const TAGS: Record<Reminder['type'], { label: string; color: string; bg: string }> = {
  RENT_RECEIPT: { label: 'Loyer', color: BAI.green, bg: BAI.greenLight },
  RENT_REVISION: { label: 'Révision du loyer', color: BAI.owner, bg: BAI.ownerTint },
  INSURANCE: { label: 'Assurance', color: BAI.caramelDark, bg: BAI.caramelLight },
  LEASE_END: { label: 'Fin du bail', color: BAI.error, bg: BAI.errorLight },
  INVENTORY_ENTRY: { label: 'État des lieux', color: BAI.owner, bg: BAI.ownerTint },
}

function monthOf(iso: string) {
  const d = parseIso(iso)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }
}

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** « d'octobre 2026 », « de novembre 2026 ». */
function monthOfFr(iso: string) {
  const { year, month } = monthOf(iso)
  const name = MONTHS[month - 1]
  return `${/^[aeiou]/.test(name) ? "d'" : 'de '}${name} ${year}`
}

function mailto(to: string | null, subject: string, body: string) {
  return `mailto:${to ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

function describe(r: Reminder): { title: string; text: ReactNode } {
  const total = euros(r.rentCents + r.chargesCents)
  switch (r.type) {
    case 'RENT_RECEIPT':
      return r.status === 'DONE'
        ? { title: `Quittance de ${r.tenantName} prête`, text: `Loyer ${monthOfFr(r.dueDate)} reçu · ${total}` }
        : { title: `Loyer de ${r.tenantName} attendu le ${dateFr(r.dueDate, false)}`, text: `${total} · ${r.address}` }
    case 'INSURANCE':
      return { title: `Attestation d'assurance à demander à ${r.tenantName}`, text: "Le locataire doit être assuré. Il vous remet son attestation à l'entrée, puis chaque année." }
    case 'RENT_REVISION':
      return { title: `Révision du loyer le ${dateFr(r.dueDate)}`, text: r.revision?.message ?? "Le loyer peut être révisé une fois par an, selon l'indice de l'INSEE." }
    case 'LEASE_END':
      return {
        title: `Fin du bail : décidez avant le ${dateFr(addMonths(parseIso(r.dueDate), 1))}`,
        text: 'Sans rien faire, le bail continue tout seul. Pour vendre, reprendre le logement ou pour un motif sérieux, le congé doit être donné à temps.',
      }
    case 'INVENTORY_ENTRY':
      return { title: `État des lieux d'entrée le ${dateFr(r.dueDate, false)}`, text: `À faire avec ${r.tenantName}, pièce par pièce, le jour de la remise des clés.` }
  }
}

function ReminderCard({ r, landlord, onChange }: { r: Reminder; landlord: string; onChange: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tag = TAGS[r.type]
  const { title, text } = describe(r)
  const done = r.status === 'DONE'

  async function mark(action: 'done' | 'undo') {
    setBusy(true)
    try {
      await api(`/reminders/${r.id}/${action}`, { method: 'POST' })
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action impossible.')
    } finally {
      setBusy(false)
    }
  }

  async function receipt() {
    setBusy(true)
    try {
      const { year, month } = monthOf(r.dueDate)
      downloadPdf(await pdfUrl(`/leases/${r.leaseId}/receipts/${year}/${month}.pdf`), `quittance-${year}-${String(month).padStart(2, '0')}.pdf`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Quittance indisponible.')
    } finally {
      setBusy(false)
    }
  }

  const actions: ReactNode[] = []
  if (r.type === 'RENT_RECEIPT' && !done) {
    actions.push(<Button key="paid" height={44} loading={busy} onClick={() => void mark('done')}>Loyer reçu</Button>)
  } else if (r.type === 'RENT_RECEIPT' && done) {
    actions.push(<Button key="pdf" height={44} loading={busy} onClick={() => void receipt()}>Télécharger la quittance</Button>)
    if (r.tenantEmail)
      actions.push(
        <a key="send" href={mailto(r.tenantEmail, `Quittance de loyer ${monthOfFr(r.dueDate)}`, `Bonjour,\n\nVous trouverez ci-joint la quittance de loyer pour le logement situé ${r.address}.\n\nBien cordialement,\n${landlord}`)} style={{ fontSize: 15, fontWeight: 600, textDecoration: 'none', alignSelf: 'center' }}>
          Préparer l'email
        </a>,
      )
  } else if (r.type === 'INSURANCE' && !done) {
    actions.push(
      <a key="ask" href={mailto(r.tenantEmail, "Attestation d'assurance habitation", `Bonjour,\n\nPourriez-vous m'envoyer votre attestation d'assurance habitation pour le logement situé ${r.address} ? La loi prévoit qu'elle soit remise chaque année au propriétaire.\n\nMerci beaucoup,\n${landlord}`)} style={{ ...btnLink }}>
        Demander
      </a>,
    )
  }
  if (!done && !(r.type === 'RENT_RECEIPT')) {
    actions.push(<Button key="done" height={44} variant="light" loading={busy} onClick={() => void mark('done')}>C'est fait</Button>)
  }
  if (done) {
    actions.push(
      <button key="undo" type="button" onClick={() => void mark('undo')} style={{ background: 'none', border: 'none', color: BAI.inkSoft, fontSize: 14, textDecoration: 'underline', alignSelf: 'center' }}>
        Annuler
      </button>,
    )
  }

  return (
    <li style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 18, padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, opacity: done && r.type !== 'RENT_RECEIPT' ? 0.6 : 1 }} className="col-md">
      <div className="stack" style={{ gap: 6, minWidth: 0 }}>
        <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 700, color: tag.color, background: tag.bg, padding: '5px 10px', borderRadius: 999, display: 'flex', gap: 6, alignItems: 'center' }}>
          {done ? <Check size={12} color={tag.color} /> : null}
          {tag.label}
        </span>
        <span style={{ fontSize: 17, fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.45 }}>{text}</span>
        {error ? <span role="alert" style={{ fontSize: 14, color: BAI.error }}>{error}</span> : null}
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>{actions}</div>
    </li>
  )
}

const btnLink = { textDecoration: 'none', background: BAI.owner, color: BAI.surface, height: 44, padding: '0 22px', borderRadius: 14, fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center' } as const

export default function Aujourdhui() {
  const { user, setUser } = useAuth()
  const { reset } = useDraft()
  const navigate = useNavigate()
  const [today, setToday] = useState<Today | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    api<Today>('/today')
      .then(setToday)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Chargement impossible.'))
  }, [])
  useEffect(load, [load])

  async function activate() {
    setUser(await api<User>('/account/follow-up', { method: 'POST' }))
  }

  if (error) return <EspaceLayout><Notice tone="warning">{error}</Notice></EspaceLayout>
  if (!today) return <EspaceLayout><Spinner size={28} /></EspaceLayout>

  const landlord = today.leases[0] ? `${today.leases[0].landlord.firstName} ${today.leases[0].landlord.lastName}` : [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  const todo = today.reminders.filter((r) => r.status === 'TODO')
  const recentlyDone = today.reminders.filter((r) => r.status === 'DONE')
  const s = today.summary

  return (
    <EspaceLayout>
      <div className="stack" style={{ gap: 40 }}>
        <div className="stack" style={{ gap: 10 }}>
          <h1 style={display('clamp(40px, 5vw, 56px)')}>Bonjour{user?.firstName ? ` ${user.firstName}` : ''}.</h1>
          <p style={{ margin: 0, fontSize: 18, color: BAI.inkMid }}>
            {today.leases.length === 0
              ? 'Ajoutez votre premier logement pour que Bailio prépare vos documents.'
              : s.rentsExpected
                ? `Ce mois : ${s.rentsExpected} loyer${s.rentsExpected > 1 ? 's' : ''} attendu${s.rentsExpected > 1 ? 's' : ''}, ${s.rentsReceived} reçu${s.rentsReceived > 1 ? 's' : ''}.`
                : `${today.leases.length} logement${today.leases.length > 1 ? 's' : ''} suivi${today.leases.length > 1 ? 's' : ''}.`}
          </p>
        </div>

        {!user?.followUpActive && today.leases.length > 0 ? (
          <div className="col-md" style={{ background: BAI.caramelLight, border: `1px solid ${BAI.caramel}`, borderRadius: 18, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 16 }}>Recevez un email avant chaque échéance : activez le suivi.</span>
            <Button variant="dark" height={44} onClick={() => void activate()}>Activer le suivi</Button>
          </div>
        ) : null}

        <section className="stack" style={{ gap: 16 }} aria-labelledby="todo-title">
          <h2 id="todo-title" style={{ ...overline, margin: 0 }}>À faire</h2>
          {todo.length === 0 ? (
            <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 18, padding: '22px 24px' }}>
              Rien à faire pour l'instant. Bailio vous préviendra à l'approche de la prochaine échéance.
            </p>
          ) : (
            <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
              {todo.map((r) => <ReminderCard key={r.id} r={r} landlord={landlord} onChange={load} />)}
            </ul>
          )}
          {recentlyDone.length ? (
            <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }} aria-label="Fait récemment">
              {recentlyDone.map((r) => <ReminderCard key={r.id} r={r} landlord={landlord} onChange={load} />)}
            </ul>
          ) : null}
        </section>

        <section className="stack" style={{ gap: 16 }} aria-labelledby="homes-title">
          <h2 id="homes-title" style={{ ...overline, margin: 0 }}>Vos logements</h2>
          <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 12 }}>
            {today.leases.map((l) => (
              <li key={l.id}>
                <Link to={`/espace/baux/${l.id}`} style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 18, padding: '20px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                  <span className="stack" style={{ gap: 4, minWidth: 0 }}>
                    <span style={{ fontSize: 17, fontWeight: 700 }}>{l.property.address}</span>
                    <span style={{ fontSize: 15, color: BAI.inkMid }}>
                      {l.tenants.map((t) => `${t.firstName} ${t.lastName}`).join(', ')} · {euros(l.rentCents + l.chargesCents)} par mois
                    </span>
                  </span>
                  <span aria-hidden style={{ fontSize: 22, color: BAI.owner }}>→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Button variant="outline" height={52} onClick={() => { reset(); navigate('/commencer') }}>+ Créer un bail</Button>
            <Button variant="ghost" height={52} onClick={() => { reset(); navigate('/importer') }}>Importer un bail signé</Button>
          </div>
        </section>

        {today.upcoming.length ? (
          <section className="stack" style={{ gap: 12 }} aria-labelledby="later-title">
            <h2 id="later-title" style={{ ...overline, margin: 0 }}>Plus tard</h2>
            <ul className="stack" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {today.upcoming.map((r) => (
                <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: `1px solid ${BAI.dividerSoft}`, fontSize: 15 }}>
                  <span>{TAGS[r.type].label} · {r.tenantName}</span>
                  <span style={{ color: BAI.inkSoft, whiteSpace: 'nowrap' }}>{dateFr(r.dueDate)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </EspaceLayout>
  )
}
