/**
 * Pilotage de Bailio (réservé au fondateur) : indicateurs calculés à partir de la base, sans aucun traceur.
 * On mesure des comportements (logement ajouté, bail signé, loyer enregistré, retour après une semaine), pas
 * seulement des inscriptions. Fonctions pures : la route ne fait que lire les lignes et les passer ici.
 */

const DAY = 86_400_000

export interface MetricsInput {
  now: Date
  users: Array<{ id: string; createdAt: Date; followUpSince: Date | null }>
  /** Appareils connectés encore ouverts (un appareil inutilisé 30 jours est fermé et effacé). */
  sessions: Array<{ userId: string; createdAt: Date; lastSeenAt: Date | null }>
  properties: Array<{ userId: string }>
  leases: Array<{ userId: string; createdAt: Date; signedAt: Date | null }>
  payments: Array<{ userId: string; createdAt: Date }>
  /** Brouillons du parcours public (bail commencé sans compte). */
  drafts: Array<{ createdAt: Date }>
}

export interface Metrics {
  generatedAt: string
  totals: Array<{ key: string; label: string; value: number; hint: string }>
  funnel: Array<{ label: string; users: number; percent: number }>
  weeks: Array<{ week: string; signups: number; signedLeases: number; activeUsers: number }>
  notMeasured: string[]
}

/** Lundi 00:00 (UTC) de la semaine de `d`. */
export function weekStart(d: Date): Date {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = (x.getUTCDay() + 6) % 7
  return new Date(x.getTime() - day * DAY)
}

const lastSeen = (s: { createdAt: Date; lastSeenAt: Date | null }) => s.lastSeenAt ?? s.createdAt

export function computeMetrics(i: MetricsInput): Metrics {
  const now = i.now.getTime()
  const since = (days: number) => now - days * DAY
  const created = new Map(i.users.map((u) => [u.id, u.createdAt.getTime()]))
  const known = (id: string) => created.has(id)
  const distinct = <T extends { userId: string }>(rows: T[], keep: (r: T) => boolean = () => true) => new Set(rows.filter((r) => known(r.userId) && keep(r)).map((r) => r.userId))

  const activeSince = (days: number) => distinct(i.sessions, (s) => lastSeen(s).getTime() >= since(days))
  // Revenu : s'est servi de Bailio au moins 7 jours après la création de son compte.
  const returning = distinct(i.sessions, (s) => lastSeen(s).getTime() >= (created.get(s.userId) ?? Infinity) + 7 * DAY)
  const withProperty = distinct(i.properties)
  const withLease = distinct(i.leases)
  const withSigned = distinct(i.leases, (l) => l.signedAt !== null)
  const withPayment = distinct(i.payments)
  const leases = i.leases.filter((l) => known(l.userId))

  const total = i.users.length
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)

  const totals = [
    { key: 'accounts', label: 'Comptes créés', value: total, hint: `${i.users.filter((u) => u.createdAt.getTime() >= since(30)).length} ces 30 derniers jours` },
    { key: 'active7', label: 'Actifs cette semaine', value: activeSince(7).size, hint: 'Venus dans Bailio ces 7 derniers jours' },
    { key: 'active30', label: 'Actifs ce mois-ci', value: activeSince(30).size, hint: 'Venus dans Bailio ces 30 derniers jours' },
    { key: 'returning', label: 'Revenus après une semaine', value: returning.size, hint: 'Revenus au moins 7 jours après leur inscription' },
    { key: 'leasesStarted', label: 'Baux commencés', value: leases.length, hint: `${leases.filter((l) => l.createdAt.getTime() >= since(30)).length} ces 30 derniers jours` },
    { key: 'leasesSigned', label: 'Baux signés', value: leases.filter((l) => l.signedAt).length, hint: `${leases.filter((l) => l.signedAt && l.signedAt.getTime() >= since(30)).length} ces 30 derniers jours` },
    { key: 'payments30', label: 'Loyers enregistrés (30 jours)', value: i.payments.filter((p) => known(p.userId) && p.createdAt.getTime() >= since(30)).length, hint: `Par ${distinct(i.payments, (p) => p.createdAt.getTime() >= since(30)).size} propriétaire(s)` },
    { key: 'followUp', label: 'Suivi activé', value: i.users.filter((u) => u.followUpSince).length, hint: 'Reçoivent les emails de rappel' },
    { key: 'drafts30', label: 'Parcours commencés sans compte (30 jours)', value: i.drafts.filter((d) => d.createdAt.getTime() >= since(30)).length, hint: 'Bail commencé depuis l’accueil, avant l’inscription' },
  ]

  const funnel = [
    { label: 'Compte créé', users: total },
    { label: 'Logement ajouté', users: withProperty.size },
    { label: 'Bail commencé', users: withLease.size },
    { label: 'Bail signé', users: withSigned.size },
    { label: 'Loyer enregistré', users: withPayment.size },
  ].map((f) => ({ ...f, percent: pct(f.users) }))

  // 8 dernières semaines, la plus ancienne d'abord.
  const current = weekStart(i.now).getTime()
  const weeks = Array.from({ length: 8 }, (_, k) => {
    const from = current - (7 - k) * 7 * DAY
    const to = from + 7 * DAY
    const inWeek = (d: Date | null) => d !== null && d.getTime() >= from && d.getTime() < to
    return {
      week: new Date(from).toISOString().slice(0, 10),
      signups: i.users.filter((u) => inWeek(u.createdAt)).length,
      signedLeases: leases.filter((l) => inWeek(l.signedAt)).length,
      // Dernière visite connue dans la semaine (le relevé ne garde que la plus récente de chaque appareil).
      activeUsers: distinct(i.sessions, (s) => inWeek(lastSeen(s))).size,
    }
  })

  return {
    generatedAt: i.now.toISOString(),
    totals,
    funnel,
    weeks,
    notMeasured: [
      'Visiteurs du site : aucun outil de mesure d’audience n’est installé (pas de cookie ni de traceur). Les journaux du serveur peuvent donner un ordre d’idée.',
      'Connexions des assistants d’IA : arriveront avec le connecteur (phase 2).',
      'Abonnés payants, revenu mensuel et résiliations : aucune offre payante n’est encore ouverte.',
    ],
  }
}
