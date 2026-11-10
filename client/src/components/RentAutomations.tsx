import { api } from '../lib/api'
import { DunningSettings } from './DunningSettings'
import { Toggle, useToast } from './kit'
import type { LeaseView } from '../lib/space'

/** Réglages des loyers d'un bail : quittance par email, loyer supposé reçu, relances automatiques. Page du bail et fiche du locataire. */
export function RentAutomations({ l, reload }: { l: LeaseView; reload: () => void }) {
  const toast = useToast()
  return (
    <>
                  <Toggle
                    checked={Boolean(l.facts?.receiptAuto)}
                    onChange={(v) =>
                      void api(`/leases/${l.id}/receipt-auto`, { method: 'PUT', body: { auto: v } })
                        .then(() => {
                          toast.show(v ? 'La quittance partira dès que vous notez le loyer reçu.' : 'Envoi des quittances par email arrêté.')
                          reload()
                        })
                        .catch(toast.error)
                    }
                    label="Quittance par email dès que le loyer est noté reçu"
                    sub={
                      l.facts?.eReceiptConsent || l.tenants.some((x) => x.email)
                        ? 'La quittance part tout de suite au locataire.'
                        : 'Ajoutez l’email du locataire dans sa fiche pour l’activer.'
                    }
                  />
                  {l.facts?.receiptAuto ? (
                    <Toggle
                      checked={Boolean(l.facts?.receiptAssume)}
                      onChange={(v) =>
                        void api(`/leases/${l.id}/receipt-auto`, { method: 'PUT', body: { assume: v } })
                          .then(() => {
                            toast.show(v ? 'Sans nouvelle de votre part, le loyer sera noté reçu 7 jours après l’échéance.' : 'Bailio attendra que vous notiez le loyer reçu.')
                            reload()
                          })
                          .catch(toast.error)
                      }
                      label="Sans nouvelle de moi, noter le loyer reçu 7 jours après l’échéance"
                      sub="Facultatif. La quittance prouve le paiement : activez-le seulement si votre locataire paie toujours à l’heure. Vous êtes prévenu 3 jours avant et pouvez l’arrêter d’un clic."
                    />
                  ) : null}
                
      {l.status !== 'ENDED' && l.facts?.dunning ? <DunningSettings leaseId={l.id} value={l.facts.dunning} tenantName={l.tenantName} onChange={reload} /> : null}
    </>
  )
}
