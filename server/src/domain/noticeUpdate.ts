/**
 * Notice d'information de l'arrêté du 9 octobre 2026 : obligatoire pour les baux conclus depuis le 18 octobre 2026.
 * Bailio a joint l'ancienne jusqu'à sa mise à jour : ces baux reçoivent une tâche « Envoyer la nouvelle notice »
 * (`POST /leases/:id/notice/send`), une fois (`lease.data.noticeUpdateSentAt`).
 */
/** Baux signés pendant la période où Bailio joignait l'ancienne notice (du 18 octobre 2026 à la mise à jour). */
export const NOTICE_GAP = { from: '2026-10-18', to: '2026-11-07' }
export const noticeUpdateDue = (status: string, signedAt: Date | null, data: unknown) => {
  const day = signedAt?.toISOString().slice(0, 10)
  return status === 'ACTIVE' && Boolean(day && day >= NOTICE_GAP.from && day < NOTICE_GAP.to) && !(data as { noticeUpdateSentAt?: string } | null)?.noticeUpdateSentAt
}
