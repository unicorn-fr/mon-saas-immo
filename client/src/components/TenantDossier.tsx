import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Card, Callout, Modal, Pill, TextLink, useLoad, useToast } from './kit'
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
  const { data, reload } = useLoad(() => api<{ missing: FileMissing[]; toReview: number; link: { url: string; sentAt: string } | null }>(`/tenants/${tenantId}/missing`), [tenantId])
  const [busy, setBusy] = useState(false)
  const [reviewing, setReviewing] = useState(false)
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
      {data.toReview ? (
        <Callout tone="warn" title={`${data.toReview} élément${data.toReview > 1 ? 's' : ''} envoyé${data.toReview > 1 ? 's' : ''} par le locataire, à vérifier`}>
          Comparez avec ses justificatifs avant de vous en servir.{' '}
          <TextLink onClick={() => setReviewing(true)} style={{ fontSize: 13 }}>
            Vérifier maintenant
          </TextLink>
        </Callout>
      ) : null}
      {reviewing ? (
        <Review
          tenantId={tenantId}
          onClose={() => {
            setReviewing(false)
            reload()
          }}
        />
      ) : null}
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

interface ReviewItem {
  key: string
  label: string
  who: 'TENANT' | 'GUARANTOR'
  kind: 'INFO' | 'DOCUMENT'
  value?: string | number | null
  fileId?: string | null
}

const show = (r: ReviewItem) => {
  if (r.value === null || r.value === undefined || r.value === '') return '—'
  if (r.key.endsWith('monthlyIncomeCents') && typeof r.value === 'number') return `${(r.value / 100).toLocaleString('fr-FR')} € par mois`
  if (/birthDate$/.test(r.key) && typeof r.value === 'string') return r.value.split('-').reverse().join('/')
  return String(r.value)
}

/** Vérifier ce que le locataire a envoyé : chaque élément est conforme, ou à corriger (il est alors redemandé). */
function Review({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const toast = useToast()
  const { data, reload } = useLoad(() => api<ReviewItem[]>(`/tenants/${tenantId}/review`), [tenantId])
  const decide = async (key: string, ok: boolean) => {
    try {
      await api(`/tenants/${tenantId}/review`, { method: 'POST', body: { key, ok } })
      reload()
    } catch (e) {
      toast.error(e)
    }
  }
  const items = data ?? []
  return (
    <Modal open onClose={onClose} title="Vérifier le dossier" width={640} actions={<Btn onClick={onClose}>Terminé</Btn>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
        <span>Quelques vérifications simples :</span>
        <span>– le nom, le prénom et la date de naissance correspondent à la pièce d’identité ;</span>
        <span>
          – l’avis d’imposition est authentique : vérifiez-le sur le{' '}
          <a href="https://cfsmsp.impots.gouv.fr/secavis/" target="_blank" rel="noreferrer">
            service officiel des impôts
          </a>{' '}
          avec le numéro fiscal et la référence de l’avis ;
        </span>
        <span>– les revenus déclarés correspondent aux bulletins de salaire et à l’avis d’imposition.</span>
      </div>
      {!items.length ? (
        <Callout tone="tip">Tout est vérifié.</Callout>
      ) : (
        items.map((r) => (
          <div key={r.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
              {r.kind === 'INFO' ? (
                <span style={{ fontSize: 14, color: BAI.inkMid }}>{show(r)}</span>
              ) : r.fileId ? (
                <TextLink onClick={() => void openDoc(`/files/${r.fileId}`).catch(toast.error)} style={{ fontSize: 13 }}>
                  Voir le fichier
                </TextLink>
              ) : null}
            </span>
            <span style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="outline" onClick={() => void decide(r.key, true)}>
                Conforme
              </Btn>
              <Btn size="sm" variant="ghost" onClick={() => void decide(r.key, false)}>
                À corriger
              </Btn>
            </span>
          </div>
        ))
      )}
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>« À corriger » retire l’élément : il repasse dans ce qui manque et vous pouvez le redemander au locataire.</span>
    </Modal>
  )
}
