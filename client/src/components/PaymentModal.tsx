import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { currentPeriod, eurosCents, periodLabel, recentPeriods, todayIso } from '../lib/format'
import { Btn, Callout, Input, Modal, Money, Select, useToast } from './kit'

/**
 * « Loyer reçu » : paiement complet → quittance ; paiement partiel → reçu (jamais une quittance).
 * Le document est rangé dans les documents du bail, et peut être envoyé au locataire.
 */
export function PaymentModal({ open, onClose, onSaved, leaseId, dueCents, tenantEmail }: { open: boolean; onClose: () => void; onSaved: () => void; leaseId: string; dueCents: number; tenantEmail?: string | null }) {
  const toast = useToast()
  const [period, setPeriod] = useState(currentPeriod())
  const [amount, setAmount] = useState<number | null>(dueCents)
  const [date, setDate] = useState(todayIso())

  useEffect(() => {
    if (!open) return
    setPeriod(currentPeriod())
    setAmount(dueCents)
    setDate(todayIso())
  }, [open, dueCents])

  const partial = amount !== null && amount < dueCents

  const save = async (send: boolean) => {
    if (!amount) return toast.show('Indiquez le montant reçu.', 'error')
    try {
      await api(`/leases/${leaseId}/payments`, { method: 'POST', body: { period, amountCents: amount, receivedAt: date } })
      if (send) await api(`/leases/${leaseId}/receipts/${period}/send`, { method: 'POST' })
      toast.show(send ? `${partial ? 'Reçu' : 'Quittance'} envoyé${partial ? '' : 'e'} au locataire.` : `Loyer enregistré. ${partial ? 'Le reçu' : 'La quittance'} est dans vos documents.`)
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Loyer reçu"
      actions={
        <>
          <Btn variant="outline" onClick={() => save(false)}>
            Enregistrer
          </Btn>
          {tenantEmail ? <Btn onClick={() => save(true)}>Enregistrer et envoyer {partial ? 'le reçu' : 'la quittance'}</Btn> : null}
        </>
      }
    >
      <Select label="Mois concerné" value={period} onChange={setPeriod} options={recentPeriods(13).map((p) => ({ value: p, label: periodLabel(p, true) }))} />
      <div className="col-md" style={{ display: 'flex', gap: 14 }}>
        <Money label="Montant reçu" cents={amount} onChange={setAmount} hint={`Loyer et charges : ${eurosCents(dueCents)}`} />
        <Input label="Date de réception" type="date" value={date} onChange={setDate} />
      </div>
      {partial ? (
        <Callout tone="tip">Paiement partiel : Bailio établit un reçu, pas une quittance. La quittance n’est due que lorsque tout est payé (article 21 de la loi du 6 juillet 1989).</Callout>
      ) : (
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>La quittance est gratuite et due au locataire qui la demande.</span>
      )}
    </Modal>
  )
}
