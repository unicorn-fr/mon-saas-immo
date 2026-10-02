import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Card, Line, TextLink, useLoad, useToast } from './kit'
import { api } from '../lib/api'
import { dateNum } from '../lib/format'

interface TenantLinkView {
  code: string | null
  url: string | null
  boiler: boolean
  received: {
    insurance?: { insurer: string | null; expiresAt: string; at: string }
    boiler?: { date: string; at: string }
    eReceiptConsent?: { email: string; at: string } | null
    eReceiptWithdrawnAt?: string | null
  }
}

/**
 * Lien sans compte pour le locataire : il y envoie son attestation d'assurance, celle d'entretien de la chaudière,
 * et donne son accord pour les quittances par email. Ce qu'il envoie est rangé avec le bail.
 */
export function TenantLink({ leaseId, tenantEmail }: { leaseId: string; tenantEmail?: string | null }) {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<TenantLinkView>(`/leases/${leaseId}/tenant-link`), [leaseId])
  const [busy, setBusy] = useState(false)
  if (!data) return null
  const r = data.received
  const toggle = async (open: boolean) => {
    if (!open && !window.confirm('Désactiver le lien ? Le locataire ne pourra plus l’utiliser.')) return
    setBusy(true)
    try {
      await api(`/leases/${leaseId}/tenant-link`, { method: 'POST', body: { open } })
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const send = async () => {
    setBusy(true)
    try {
      const out = await api<{ sentTo: string[] }>(`/leases/${leaseId}/tenant-link/send`, { method: 'POST' })
      toast.show(`Lien envoyé à ${out.sentTo.join(', ')}.`)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.url ?? '')
      toast.show('Lien copié.')
    } catch {
      window.prompt('Copiez le lien :', data.url ?? '')
    }
  }
  return (
    <Card title="Documents du locataire">
      <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
        Un lien, sans compte, pour que votre locataire vous envoie son attestation d’assurance{data.boiler ? ', l’entretien de la chaudière' : ''} et son accord pour les quittances par email.
      </span>
      <Line label="Assurance" value={r.insurance ? `jusqu’au ${dateNum(r.insurance.expiresAt)}` : 'pas reçue'} tone={r.insurance ? 'green' : undefined} />
      {data.boiler ? <Line label="Chaudière" value={r.boiler ? `entretien du ${dateNum(r.boiler.date)}` : 'pas reçue'} tone={r.boiler ? 'green' : undefined} /> : null}
      <Line label="Quittance par email" value={r.eReceiptConsent ? `accord du ${dateNum(r.eReceiptConsent.at)}` : r.eReceiptWithdrawnAt ? 'accord retiré' : 'pas d’accord'} tone={r.eReceiptConsent ? 'green' : undefined} />
      {data.url ? (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn size="sm" onClick={() => void send()} loading={busy} disabled={!tenantEmail} title={tenantEmail ? undefined : 'Ajoutez l’email du locataire dans sa fiche'}>
              Envoyer par email
            </Btn>
            <Btn size="sm" variant="outline" onClick={() => void copy()}>
              Copier le lien
            </Btn>
          </div>
          <TextLink style={{ fontSize: 13, color: BAI.inkSoft }} onClick={() => void toggle(false)}>
            Désactiver le lien
          </TextLink>
        </>
      ) : (
        <Btn size="sm" variant="outline" onClick={() => void toggle(true)} loading={busy} style={{ alignSelf: 'flex-start' }}>
          Créer le lien
        </Btn>
      )}
    </Card>
  )
}
