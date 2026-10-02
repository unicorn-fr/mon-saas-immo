import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Card, Callout, Pill, useLoad, useToast } from './kit'
import { api } from '../lib/api'
import { openDoc } from '../lib/docs'
import { dateNum } from '../lib/format'

interface FileMissing {
  key: string
  label: string
  who: 'TENANT' | 'GUARANTOR'
  kind: 'INFO' | 'DOCUMENT'
}

/**
 * Dossier du locataire sur sa fiche : ce qui manque encore, à lui demander par email ou par courrier.
 * Il le complète lui-même en ligne, sans compte.
 */
export function TenantDossier({ tenantId, email }: { tenantId: string; email?: string | null }) {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<{ missing: FileMissing[]; link: { url: string; sentAt: string } | null }>(`/tenants/${tenantId}/missing`), [tenantId])
  const [busy, setBusy] = useState(false)
  if (!data) return null
  const send = async () => {
    setBusy(true)
    try {
      await api(`/tenants/${tenantId}/request`, { method: 'POST', body: { send: true } })
      toast.show(`Demande envoyée à ${email}.`)
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card title={<div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 12 }}><h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Dossier</h2>{data.missing.length ? <Pill tone="caramel">{data.missing.length} à compléter</Pill> : <Pill tone="green">Complet</Pill>}</div>}>
      {data.missing.length ? (
        <>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
            Il manque : {data.missing.slice(0, 5).map((m) => m.label.toLowerCase()).join(', ')}
            {data.missing.length > 5 ? '…' : '.'}
          </span>
          {data.link ? <Callout tone="info">Demande envoyée le {dateNum(data.link.sentAt)}, valable 30 jours.</Callout> : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {email ? (
              <Btn size="sm" onClick={() => void send()} loading={busy}>
                {data.link ? 'Renvoyer par email' : 'Demander par email'}
              </Btn>
            ) : null}
            <Btn size="sm" variant="outline" onClick={() => void openDoc(`/tenants/${tenantId}/request.pdf`).then(reload).catch(toast.error)}>
              Courrier à imprimer
            </Btn>
          </div>
        </>
      ) : (
        <span style={{ fontSize: 14, color: BAI.inkMid }}>Identité, coordonnées, situation et justificatifs : tout est là.</span>
      )}
    </Card>
  )
}
