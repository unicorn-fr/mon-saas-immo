import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../db.js'
import { HttpError } from '../lib/http.js'
import { irlOneYearLater } from '../lib/irl.js'
import { requireUser } from '../services/session.js'
import { ensureReminders } from '../services/reminders.js'
import { upgradeLegacyLeases } from '../services/upgrade.js'
import { leaseKindOf, propertyName, readTenant, readTerms, tenantName } from '../services/contract.js'
import { formatEuros } from '../domain/lease.js'
import { revisedRent } from '../domain/letters.js'
import { landlordNoticeMonthsFor, rentRevisionAllowed } from '../domain/rules.js'
import { iso } from './helpers.js'
import { leaseTenantLabel, rentStatus } from './space.js'
import { publicUser } from './auth.js'

/**
 * « Aujourd'hui » : ce qu'il y a à faire cette semaine, déjà préparé, et les prochaines échéances.
 * Chaque tâche porte ses actions (relire la relance, loyer arrivé, lettre de révision…).
 */
const router = Router()
router.use(requireUser)

const DAY = 86_400_000
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const short = (d: Date) => `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`

export interface Task {
  id: string
  type: 'LATE_RENT' | 'PARTIAL_RENT' | 'REVISION' | 'INSURANCE' | 'INVOICE' | 'INVENTORY' | 'LEASE_END' | 'CHARGES' | 'DRAFT_LEASE'
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
}

router.get('/today', async (req, res) => {
  const user = req.user!
  await upgradeLegacyLeases(user)
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const [leases, tenants, properties, toVerify, inventories] = await Promise.all([
    prisma.lease.findMany({ where: { userId: user.id }, include: { property: true, payments: true } }),
    prisma.tenant.findMany({ where: { userId: user.id } }),
    prisma.property.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } }),
    prisma.expense.findMany({ where: { userId: user.id, status: 'TO_VERIFY' }, include: { property: true }, orderBy: { createdAt: 'desc' } }),
    prisma.inventory.findMany({ where: { userId: user.id } }),
  ])
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

  for (const e of toVerify) {
    tasks.push({ id: `exp-${e.id}`, type: 'INVOICE', tag: 'Facture à vérifier', tone: 'green', place: e.property ? propertyName(e.property) : 'Sans logement', title: `${e.vendor}, ${formatEuros(e.amountCents)}${e.property ? `, rangée dans ${propertyName(e.property)}` : ''}`, expenseId: e.id })
  }
  for (const l of leases.filter((x) => x.status === 'DRAFT')) {
    tasks.push({ id: `draft-${l.id}`, type: 'DRAFT_LEASE', tag: 'Bail en préparation', tone: 'owner', place: propertyName(l.property), title: `Le bail de ${leaseTenantLabel(l, names) || 'votre locataire'} est en préparation`, leaseId: l.id })
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
      counts: { properties: properties.length, tenants: tenants.length, leases: leases.length },
    },
  })
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
