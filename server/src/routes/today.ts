import { Router } from 'express'
import { upcomingAutoReceipt, warnDateOf } from '../domain/autoReceipt.js'
import { z } from 'zod'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { irlOneYearLater } from '../lib/irl.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { upgradeLegacyLeases } from '../services/upgrade.js'
import { leaseKindOf, propertyName, readTenant, readTerms, tenantName } from '../services/contract.js'
import { formatEuros, monthYearFr } from '../domain/lease.js'
import { revisedRent } from '../domain/letters.js'
import { landlordNoticeMonthsFor, rentRevisionAllowed } from '../domain/rules.js'
import { iso } from './helpers.js'
import { leaseTenantLabel, rentStatus } from './space.js'
import { publicUser } from './auth.js'
import { upcomingInterventions } from './contacts.js'
import { declarationDeadline, occupancyDeclarationDue } from '../domain/fiscalCalendar.js'
import { readProfile } from '../services/contract.js'
import { rentalJourneys } from '../services/rental.js'

/**
 * « Aujourd'hui » : ce qu'il y a à faire cette semaine, déjà préparé, et les prochaines échéances.
 * Chaque tâche porte ses actions (relire la relance, loyer arrivé, lettre de révision…).
 */
const router = Router()
// Session exigée sur les adresses de ce routeur seulement : une adresse inconnue reçoit « Page introuvable ».
router.use(['/reminders', '/today'], requireUser)

const DAY = 86_400_000
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const short = (d: Date) => `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`

export interface Task {
  id: string
  type: 'LATE_RENT' | 'PARTIAL_RENT' | 'REVISION' | 'INSURANCE' | 'INVOICE' | 'INVENTORY' | 'LEASE_END' | 'CHARGES' | 'DRAFT_LEASE' | 'DEPARTURE' | 'SETTLEMENT' | 'BOILER' | 'STEP' | 'AUTO_RECEIPT'
  tag: string
  tone: 'error' | 'owner' | 'caramel' | 'green'
  place: string
  title: string
  text?: string
  leaseId?: string
  propertyId?: string
  reminderId?: string
  expenseId?: string
  inventoryId?: string
  amountCents?: number
  period?: string
  /** Étape de la mise en location (type STEP) : bouton vers la bonne page, et « je n'en ai pas besoin » si facultative. */
  step?: { key: string; label: string; to: string; optional: boolean }
}

router.get('/today', async (req, res) => {
  const user = req.user!
  await upgradeLegacyLeases(user)
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const [leases, tenants, properties, toVerify, inventories, letterDocs] = await Promise.all([
    prisma.lease.findMany({ where: { userId: user.id }, include: { property: true, payments: true } }),
    prisma.tenant.findMany({ where: { userId: user.id } }),
    prisma.property.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.expense.findMany({ where: { userId: user.id, status: 'TO_VERIFY' }, include: { property: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inventory.findMany({ where: { userId: user.id } }),
    prisma.document.findMany({ where: { userId: user.id, kind: 'LETTER' }, select: { leaseId: true, meta: true, createdAt: true } }),
  ])
  /** Dernier courrier d'un type pour un bail. */
  const lastLetter = (leaseId: string, type: string) =>
    letterDocs.filter((d) => d.leaseId === leaseId && (d.meta as { type?: string } | null)?.type === type).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt ?? null
  for (const l of leases) await ensureReminders(l)
  const names = Object.fromEntries(tenants.map((t) => [t.id, tenantName(readTenant(t))]))
  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id, status: 'TODO', OR: [{ snoozedUntil: null }, { snoozedUntil: { lte: now } }] },
    orderBy: { dueDate: 'asc' },
  })
  const leaseById = new Map(leases.map((l) => [l.id, l]))
  const tasks: Task[] = []

  // Loyers en retard ou partiels.
  const running = leases.filter((l) => (l.status === 'ACTIVE' || l.status === 'IMPORTED') && l.startDate <= now)
  for (const l of running) {
    const st = rentStatus(l, l.payments, now)
    const who = leaseTenantLabel(l, names) || 'votre locataire'
    const dueDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), l.paymentDay))
    // Quittance automatique prévue : le propriétaire confirme que le loyer est arrivé, ou annule l'envoi.
    const facts = (l.data ?? {}) as { receiptAuto?: boolean; receiptHold?: Record<string, string> }
    const auto = facts.receiptAuto ? upcomingAutoReceipt({ today: now.toISOString().slice(0, 10), paymentDay: l.paymentDay, startDate: l.startDate.toISOString().slice(0, 10), paid: new Set(l.payments.map((p) => p.period)), held: facts.receiptHold ?? {} }) : null
    if (auto && !auto.held && now.toISOString().slice(0, 10) >= warnDateOf(auto.period, l.paymentDay)) {
      const [ay, am] = auto.period.split('-').map(Number)
      tasks.push({ id: `auto-${l.id}-${auto.period}`, type: 'AUTO_RECEIPT', tag: 'Quittance automatique', tone: 'owner', place: propertyName(l.property), title: `La quittance de ${monthYearFr(ay, am)} part le ${short(new Date(`${auto.sendOn}T00:00:00Z`))} : le loyer de ${who} est-il arrivé ?`, text: 'Si oui, il n’y a rien à faire. Sinon, annulez l’envoi : une quittance prouve que le loyer est payé.', leaseId: l.id, period: auto.period })
      if (auto.period === period) continue
    }
    if (st.key === 'LATE') {
      tasks.push({ id: `late-${l.id}`, type: 'LATE_RENT', tag: 'Loyer en retard', tone: 'error', place: propertyName(l.property), title: `Le loyer de ${who} n’est pas arrivé (attendu le ${short(dueDate)})`, text: 'Une relance amiable, polie et courte, est rédigée. Vous pouvez la relire avant l’envoi.', leaseId: l.id, amountCents: l.rentCents + l.chargesCents, period })
    } else if (st.key === 'PARTIAL') {
      const paid = l.payments.find((p) => p.period === period)?.amountCents ?? 0
      tasks.push({ id: `partial-${l.id}`, type: 'PARTIAL_RENT', tag: 'Paiement partiel', tone: 'caramel', place: propertyName(l.property), title: `${who} a payé ${formatEuros(paid)} sur ${formatEuros(l.rentCents + l.chargesCents)}`, text: 'Un reçu a été établi. Il reste à recevoir le solde.', leaseId: l.id, period })
    }
  }

  const in30 = new Date(today.getTime() + 30 * DAY)
  for (const r of reminders) {
    const l = leaseById.get(r.leaseId)
    if (!l || l.status === 'DRAFT' || l.status === 'ENDED') continue
    const place = propertyName(l.property)
    const who = leaseTenantLabel(l, names) || 'votre locataire'
    if (r.type === 'RENT_REVISION' && r.dueDate <= in30) {
      const terms = readTerms(l)
      const dpe = l.property.dpeClass
      let text = 'Le nouveau loyer sera calculé avec le dernier indice de référence des loyers.'
      if (!rentRevisionAllowed(dpe)) continue
      if (terms.revision?.irlQuarter && terms.revision.irlValue) {
        const next = await irlOneYearLater(terms.revision.irlQuarter)
        if (next) text = `Nouveau loyer hors charges calculé avec le dernier indice de référence des loyers : ${formatEuros(revisedRent(l.rentCents, terms.revision.irlValue, next.value))} au lieu de ${formatEuros(l.rentCents)}. La lettre au locataire est prête.`
      }
      tasks.push({ id: r.id, type: 'REVISION', tag: 'Révision du loyer', tone: 'owner', place, title: `Le bail a un an le ${short(r.dueDate)} : le loyer peut être révisé`, text, leaseId: l.id, reminderId: r.id })
    } else if (r.type === 'INSURANCE' && r.dueDate <= in30) {
      const t = l.tenantIds[0] ? tenants.find((x) => x.id === l.tenantIds[0]) : null
      const expires = t ? readTenant(t).insurance?.expiresAt : null
      // Attestation reçue et encore valable plus d'un mois : rien à demander.
      if (expires && new Date(`${expires}T00:00:00Z`) > new Date(r.dueDate.getTime() + 30 * DAY)) continue
      tasks.push({ id: r.id, type: 'INSURANCE', tag: 'Assurance', tone: 'caramel', place, title: expires ? `L’attestation d’assurance de ${who} expire le ${short(new Date(`${expires}T00:00:00Z`))}` : `Demander l’attestation d’assurance de ${who}`, leaseId: l.id, reminderId: r.id })
    } else if (r.type === 'INVENTORY_ENTRY' && r.dueDate <= new Date(today.getTime() + 10 * DAY)) {
      const inv = inventories.find((i) => i.leaseId === l.id && i.kind === 'ENTRY')
      if (inv?.status === 'SIGNED') continue
      tasks.push({ id: r.id, type: 'INVENTORY', tag: 'État des lieux', tone: 'owner', place, title: `État des lieux d’entrée avec ${who} le ${short(r.dueDate)}`, text: 'Les pièces, les compteurs et les clés sont déjà prêts : il suffit de le faire sur votre téléphone.', leaseId: l.id, reminderId: r.id, inventoryId: inv?.id })
    } else if (r.type === 'LEASE_END' && r.dueDate <= in30) {
      const notice = landlordNoticeMonthsFor(leaseKindOf(l))
      tasks.push({ id: r.id, type: 'LEASE_END', tag: 'Fin du bail', tone: 'caramel', place, title: `Le bail de ${who} arrive à échéance le ${short(l.endDate)}`, text: notice ? `Pour donner congé, il faut l’envoyer au moins ${notice} mois avant. Sans rien faire, le bail est reconduit.` : 'Le bail prendra fin à cette date.', leaseId: l.id, reminderId: r.id })
    } else if (r.type === 'CHARGES_REGULARIZATION' && r.dueDate <= in30) {
      tasks.push({ id: r.id, type: 'CHARGES', tag: 'Charges', tone: 'owner', place, title: 'Régularisation annuelle des charges', text: 'Comparez les provisions versées aux charges réelles de l’année : Bailio prépare le décompte.', leaseId: l.id, reminderId: r.id })
    }
  }

  // Échéances déduites de ce que Bailio sait déjà (congé reçu, état des lieux, courriers, fiche du logement).
  for (const l of leases) {
    if (l.status !== 'ACTIVE' && l.status !== 'ENDED') continue
    const facts = (l.data ?? {}) as { tenantNotice?: { receivedDate: string; endDate: string }; keysDate?: string; boilerServiceDate?: string; snoozed?: Record<string, string> }
    const snoozed = (key: string) => Boolean(facts.snoozed?.[key] && facts.snoozed[key] > iso(today)!)
    const place = propertyName(l.property)
    const who = leaseTenantLabel(l, names) || 'votre locataire'
    const exit = inventories.find((i) => i.leaseId === l.id && i.kind === 'EXIT')
    const notice = facts.tenantNotice
    // Départ annoncé : l'état des lieux de sortie à prévoir dans les trois semaines.
    if (notice && l.status === 'ACTIVE' && exit?.status !== 'SIGNED') {
      const end = new Date(`${notice.endDate}T00:00:00Z`)
      if (end.getTime() - today.getTime() <= 21 * DAY)
        tasks.push({ id: `departure-${l.id}`, type: 'DEPARTURE', tag: 'Départ du locataire', tone: 'owner', place, title: `${who} part le ${short(end)} : prévoir l’état des lieux de sortie`, text: 'Bailio reprend l’état des lieux d’entrée pour comparer, pièce par pièce, et prépare ensuite le solde de tout compte.', leaseId: l.id, inventoryId: exit?.id })
    }
    // Clés rendues : le solde de tout compte et la restitution du dépôt, avec la date limite.
    const keys = facts.keysDate ?? (exit?.status === 'SIGNED' && exit.date ? iso(exit.date) : null)
    if (keys && !lastLetter(l.id, 'DEPOSIT_RETURN')) {
      const limit = new Date(`${keys}T00:00:00Z`)
      limit.setUTCMonth(limit.getUTCMonth() + 1)
      tasks.push({ id: `settle-${l.id}`, type: 'SETTLEMENT', tag: 'Dépôt de garantie', tone: limit < today ? 'error' : 'caramel', place, title: `Envoyer le solde de tout compte à ${who}${limit < today ? ' : la date limite est passée' : ` avant le ${short(limit)}`}`, text: limit < today ? 'La date limite est passée : la somme à rendre est majorée de 10 % du loyer mensuel par mois de retard commencé (article 22). Le solde de tout compte la calcule.' : 'Dépôt de garantie, retenues justifiées, loyers restant dus et charges : le document est déjà rempli.', leaseId: l.id })
    }
    // Chaudière individuelle : attestation d'entretien chaque année.
    const heating = (l.property.data as { heating?: { mode?: string; energy?: string; lastMaintenance?: string } } | null)?.heating
    if (l.status === 'ACTIVE' && heating?.mode === 'INDIVIDUAL' && ['GAS', 'FUEL', 'WOOD'].includes(String(heating.energy)) && !snoozed('BOILER')) {
      const last = [facts.boilerServiceDate ? new Date(`${facts.boilerServiceDate}T00:00:00Z`) : null, heating.lastMaintenance ? new Date(`${heating.lastMaintenance}T00:00:00Z`) : null, lastLetter(l.id, 'BOILER')].filter((d): d is Date => Boolean(d)).sort((a, b) => b.getTime() - a.getTime())[0] ?? l.startDate
      if (today.getTime() - last.getTime() >= 365 * DAY)
        tasks.push({ id: `boiler-${l.id}`, type: 'BOILER', tag: 'Chaudière', tone: 'caramel', place, title: `Demander l’attestation d’entretien de la chaudière à ${who}`, text: 'L’entretien annuel est obligatoire et à la charge du locataire. Le courrier est prêt.', leaseId: l.id })
    }
  }

  for (const e of toVerify) {
    tasks.push({ id: `exp-${e.id}`, type: 'INVOICE', tag: 'Facture à vérifier', tone: 'green', place: e.property ? propertyName(e.property) : 'Sans logement', title: `${e.vendor}, ${formatEuros(e.amountCents)}${e.property ? `, rangée dans ${propertyName(e.property)}` : ''}`, expenseId: e.id })
  }
  // Mise en location : chaque étape à faire, dans l'ordre, pour chaque logement (fiche, annonce, locataire, bail, signature…).
  const journeys = await rentalJourneys(user)
  for (const p of properties) {
    const steps = journeys.get(p.id) ?? []
    for (const st of steps) {
      if (st.state !== 'TODO' || !st.action || st.key === 'RENT') continue
      // Déjà signalé par un rappel (état des lieux, assurance) : pas de doublon.
      if ((st.key === 'INVENTORY' || st.key === 'INSURANCE') && tasks.some((t) => t.type === st.key && leases.some((l) => l.id === t.leaseId && l.propertyId === p.id))) continue
      tasks.push({ id: `step-${p.id}-${st.key}`, type: 'STEP', tag: st.optional ? 'Mise en location, facultatif' : 'Mise en location', tone: st.key === 'PROPERTY' || st.key === 'TENANT' ? 'caramel' : 'owner', place: propertyName(p), title: st.title, text: st.text, propertyId: p.id, step: { key: st.key, label: st.action.label, to: st.action.to, optional: Boolean(st.optional) } })
    }
  }

  // Prochaines échéances : loyers du mois suivant, rappels à venir, dernier jour pour donner congé.
  const upcoming: { date: string; label: string; sort: number }[] = []
  const nextMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 5))
  if (running.length) upcoming.push({ date: short(nextMonth), label: `Loyers de ${['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][nextMonth.getUTCMonth()]} attendus`, sort: nextMonth.getTime() })
  for (const r of reminders) {
    const l = leaseById.get(r.leaseId)
    if (!l || r.dueDate <= in30 || r.type === 'RENT_RECEIPT') continue
    const place = propertyName(l.property)
    const label = { RENT_REVISION: `Révision du loyer, ${place}`, INSURANCE: `Attestation d’assurance, ${place}`, LEASE_END: `Dernier jour pour donner congé, ${place}`, INVENTORY_ENTRY: `État des lieux d’entrée, ${place}`, CHARGES_REGULARIZATION: 'Régularisation annuelle des charges', RENT_RECEIPT: '' }[r.type]
    upcoming.push({ date: short(r.dueDate), label, sort: r.dueDate.getTime() })
  }
  for (const i of await upcomingInterventions(user.id)) upcoming.push({ date: short(i.date), label: i.label, sort: i.date.getTime() })
  // Échéances fiscales, déduites des loyers et des baux (calendrier vérifié par année : domain/fiscalCalendar.ts).
  const y = now.getUTCFullYear()
  const lastYearPaid = leases.some((l) => l.payments.some((p) => p.period.startsWith(String(y - 1))))
  if (lastYearPaid && now.getUTCMonth() <= 5) {
    const deadline = declarationDeadline(y, readProfile(user).postalCode)
    const d = deadline.date ? new Date(`${deadline.date}T00:00:00Z`) : new Date(Date.UTC(y, 4, 31))
    if (d >= today) upcoming.push({ date: deadline.date ? short(d) : 'fin mai', label: `Déclaration des revenus ${y - 1} en ligne${deadline.date ? '' : ' (date à confirmer sur impots.gouv.fr)'} : vos loyers et dépenses sont prêts dans Argent`, sort: d.getTime() })
  }
  // Occupation des logements (« Gérer mes biens immobiliers ») : changement d'occupant entre le 2 janvier de l'an
  // dernier et le 1er janvier : à déclarer avant le 1er juillet ; un changement récent : à déclarer dès maintenant.
  const changes = leases.flatMap((l) => [...(l.status !== 'DRAFT' ? [iso(l.startDate)!] : []), ...(l.status === 'ENDED' ? [iso(l.endDate)!] : [])])
  const july = new Date(Date.UTC(y, 6, 1))
  if (now < july && occupancyDeclarationDue(y, changes)) upcoming.push({ date: short(july), label: 'Déclarer l’occupation de vos logements sur impots.gouv.fr (Gérer mes biens immobiliers)', sort: july.getTime() - 1 })
  const recent = changes.some((d) => d <= iso(today)! && d >= iso(new Date(today.getTime() - 30 * DAY))!)
  if (recent) upcoming.push({ date: 'ce mois-ci', label: 'Nouvel occupant ou logement libéré : à signaler sur impots.gouv.fr (Gérer mes biens immobiliers)', sort: today.getTime() })
  // Location meublée : cotisation foncière des entreprises (CFE) le 15 décembre, sauf recettes de 5 000 € ou moins.
  if (now.getUTCMonth() >= 9 && leases.some((l) => l.type === 'FURNISHED' && (l.status === 'ACTIVE' || l.status === 'IMPORTED'))) {
    const cfe = new Date(Date.UTC(y, 11, 15))
    upcoming.push({ date: short(cfe), label: 'CFE de la location meublée (exonérée si vos recettes ne dépassent pas 5 000 €)', sort: cfe.getTime() })
  }
  upcoming.sort((a, b) => a.sort - b.sort)

  const expected = running.length
  const received = running.filter((l) => l.payments.some((p) => p.period === period && p.amountCents >= l.rentCents + l.chargesCents)).length
  const cashed = leases.flatMap((l) => l.payments).filter((p) => p.receivedAt.getUTCFullYear() === now.getUTCFullYear() && p.receivedAt.getUTCMonth() === now.getUTCMonth()).reduce((a, p) => a + p.amountCents, 0)

  res.json({
    success: true,
    data: {
      user: publicUser(user),
      date: iso(today),
      stats: { rentsExpected: expected, rentsReceived: received, cashedCents: cashed, month: period },
      tasks,
      upcoming: upcoming.slice(0, 6).map(({ date, label }) => ({ date, label })),
      properties: properties.map((p) => {
        const ls = leases.filter((l) => l.propertyId === p.id)
        const current = ls.find((l) => (l.status === 'ACTIVE' || l.status === 'IMPORTED') && l.startDate <= now && l.endDate >= now) ?? ls.find((l) => l.status === 'ACTIVE' && l.startDate > now)
        const draft = ls.find((l) => l.status === 'DRAFT')
        const st = current ? rentStatus(current, current.payments, now) : null
        const status = current ? (st!.key === 'PAID' ? { label: 'Payé', tone: 'green' } : st!.key === 'LATE' ? { label: 'En retard', tone: 'error' } : st!.key === 'UPCOMING' ? { label: 'Entrée à venir', tone: 'owner' } : { label: st!.label, tone: 'muted' }) : draft ? { label: 'Bail en cours', tone: 'caramel' } : { label: 'Disponible', tone: 'muted' }
        return { id: p.id, name: propertyName(p), status }
      }),
      counts: { properties: properties.length, tenants: tenants.length, leases: leases.length, signedLeases: leases.filter((l) => l.status !== 'DRAFT').length },
    },
  })
})

// « Me le rappeler plus tard » pour une échéance déduite (chaudière) : 30 jours.
router.post('/leases/:id/snooze/:key', requireUser, async (req, res) => {
  const lease = await prisma.lease.findFirst({ where: { id: String(req.params.id), userId: req.user!.id } })
  if (!lease) throw new HttpError(404, 'Bail introuvable.')
  const key = z.enum(['BOILER']).parse(req.params.key)
  const until = new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10)
  const data = (lease.data ?? {}) as Record<string, unknown>
  await prisma.lease.update({ where: { id: lease.id }, data: { data: { ...data, snoozed: { ...((data.snoozed as Record<string, string>) ?? {}), [key]: until } } } })
  res.json({ success: true, data: { until } })
})

// Actions sur un rappel : fait, annuler, me le rappeler plus tard (dans 7 jours).
router.post('/reminders/:id/:action', async (req, res) => {
  const { id, action } = z.object({ id: z.uuid(), action: z.enum(['done', 'undo', 'snooze']) }).parse(req.params)
  const r = await prisma.reminder.findFirst({ where: { id, userId: req.user!.id } })
  if (!r) throw new HttpError(404, 'Rappel introuvable.')
  const data = action === 'done' ? { status: 'DONE' as const, doneAt: new Date() } : action === 'undo' ? { status: 'TODO' as const, doneAt: null, snoozedUntil: null } : { snoozedUntil: new Date(Date.now() + 7 * DAY) }
  const updated = await prisma.reminder.update({ where: { id }, data })
  res.json({ success: true, data: { id: updated.id, status: updated.status, snoozedUntil: iso(updated.snoozedUntil) } })
})

export default router
