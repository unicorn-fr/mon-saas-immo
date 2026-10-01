import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { Guide } from '../../components/Sources'
import { Btn, Card, Pill, TextLink, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { dateNum } from '../../lib/format'

interface ESignStatus {
  id: string
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  completedAt: string | null
  amendment: boolean
  signers: Array<{ id: string; role: 'LANDLORD' | 'TENANT' | 'GUARANTOR'; roleLabel: string; name: string; email: string; signedAt: string | null; linkExpiresAt: string | null; linkExpired: boolean }>
}

/**
 * Signature en ligne du bail : lancement, suivi de chaque signataire, relance.
 * Le propriétaire signe lui aussi par le même parcours (code reçu par email).
 */
export function ESignCard({ leaseId, ready, amendment = false, onChange }: { leaseId: string; ready: boolean; amendment?: boolean; onChange: () => void }) {
  const { data, reload } = useLoad(() => api<ESignStatus | null>(`/leases/${leaseId}/esign`), [leaseId])
  const toast = useToast()
  const navigate = useNavigate()
  const pending = data?.status === 'PENDING' ? data : null

  const start = async () => {
    const r = await api<ESignStatus & { landlordUrl: string }>(`/leases/${leaseId}/esign`, { method: 'POST' })
    toast.show('Invitations envoyées. Signez à votre tour maintenant.')
    onChange()
    navigate(r.landlordUrl)
  }
  const signMyself = async () => {
    const r = await api<{ url: string }>(`/leases/${leaseId}/esign/landlord-link`, { method: 'POST' })
    navigate(r.url)
  }
  const remind = (id: string) => async () => {
    const r = await api<{ sentTo: string }>(`/leases/${leaseId}/esign/remind/${id}`, { method: 'POST' })
    toast.show(`Nouveau lien envoyé à ${r.sentTo}.`)
  }
  const cancel = async () => {
    if (!window.confirm('Annuler la signature en ligne ? Les liens envoyés ne fonctionneront plus.')) return
    await api(`/leases/${leaseId}/esign`, { method: 'DELETE' })
    reload()
    onChange()
  }

  if (pending) {
    const me = pending.signers.find((s) => s.role === 'LANDLORD')
    const done = pending.signers.filter((s) => s.signedAt).length
    return (
      <Card title={pending.amendment ? 'Signature de l’avenant en cours' : 'Signature en ligne en cours'} action={<span style={{ fontSize: 14, color: BAI.inkSoft }}>{done} sur {pending.signers.length}</span>}>
        {pending.signers.map((s) => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>
                {s.name} <span style={{ fontWeight: 400, color: BAI.inkSoft }}>· {s.roleLabel}</span>
              </span>
              <span style={{ fontSize: 13, color: BAI.inkSoft }}>{s.email}</span>
            </span>
            <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {s.signedAt ? (
                <Pill tone="green">Signé le {dateNum(s.signedAt)}</Pill>
              ) : s.role === 'LANDLORD' ? (
                <Btn size="sm" onClick={() => signMyself().catch(toast.error)}>
                  Signer maintenant
                </Btn>
              ) : (
                <>
                  <Pill tone={s.linkExpired ? 'error' : 'caramel'}>{s.linkExpired ? 'Lien expiré' : 'En attente'}</Pill>
                  <TextLink style={{ fontSize: 13 }} onClick={() => remind(s.id)().catch(toast.error)}>
                    {s.linkExpired ? 'Envoyer un nouveau lien' : 'Renvoyer le lien'}
                  </TextLink>
                </>
              )}
            </span>
          </div>
        ))}
        <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
          Lancée le {dateNum(pending.createdAt)}. Chaque lien reste valable 14 jours. Pendant la signature, le bail ne peut plus être modifié. Dès que tout le monde a signé, {pending.amendment ? 'la nouvelle version remplace l’ancienne' : 'le bail passe en « signé »'} et chacun reçoit son exemplaire avec le certificat de preuve.
          {me && !me.signedAt ? ' Il ne manque plus que vous quand les autres auront signé.' : ''}
        </span>
        <div>
          <TextLink style={{ fontSize: 13, color: BAI.error }} onClick={() => cancel().catch(toast.error)}>
            Annuler la signature en ligne
          </TextLink>
        </div>
      </Card>
    )
  }

  return (
    <Card title={amendment ? 'Faire signer la nouvelle version (avenant)' : 'Faire signer le bail'}>
      <div className="grid-2" style={{ gap: 12 }}>
        <div style={{ border: `2px solid ${BAI.owner}`, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 17, fontWeight: 700 }}>En ligne</span>
            <Pill tone="owner">Conseillé</Pill>
          </span>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
            Chacun reçoit un lien, confirme son identité par un code envoyé par email, puis signe sur son téléphone. Le bail signé et son certificat de preuve sont envoyés à tous.
          </span>
          <div>
            <Btn onClick={() => start().catch(toast.error)} disabled={!ready} title={ready ? undefined : 'Complétez d’abord les informations manquantes'}>
              Signer en ligne
            </Btn>
          </div>
        </div>
        <div style={{ border: `1px solid ${BAI.divider}`, borderRadius: 16, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>Sur papier</span>
          <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.5 }}>
            Imprimez un exemplaire par partie. Chacun paraphe chaque page, écrit « Lu et approuvé » et signe la dernière. Indiquez ensuite ici que le bail est signé.
          </span>
        </div>
      </div>
      <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>
        Les deux sont valables : la signature électronique a la même valeur qu’une signature à la main (Code civil, articles 1366 et 1367). <Guide to="signature" style={{ fontSize: 13 }} label="Le texte officiel" />
      </span>
    </Card>
  )
}
