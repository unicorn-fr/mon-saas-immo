import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Btn, Callout, LoadError, Loader, useLoad } from '../components/kit'
import { MailLinks } from '../components/MailLinks'
import { display } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { useAuth } from '../lib/auth'
import { switchSpace, type SharedSpace } from '../lib/shared'
import { AuthLayout } from './Connexion'

interface InvitationView {
  ownerName: string
  email: string
  role: SharedSpace['role']
  roleLabel: string
  roleText: string
  properties: string[]
}

/** Invitation à l'espace d'un propriétaire : qui invite, pour quoi faire, puis un clic pour accepter. */
export default function Invitation() {
  const { token = '' } = useParams()
  const { user } = useAuth()
  const { data, error, loading } = useLoad(() => api<InvitationView>(`/invitations/${encodeURIComponent(token)}`), [token])
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  const accept = async () => {
    setBusy(true)
    setProblem(null)
    try {
      const r = await api<{ spaceId: string; role: SharedSpace['role']; ownerName: string }>(`/invitations/${encodeURIComponent(token)}/accept`, { method: 'POST' })
      switchSpace({ id: r.spaceId, role: r.role, ownerName: r.ownerName })
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : 'Impossible d’accepter l’invitation.')
      setBusy(false)
    }
  }
  const sendLink = async () => {
    setBusy(true)
    setProblem(null)
    try {
      const r = await api<{ email: string }>('/auth/invitation-link', { method: 'POST', body: { token } })
      setSent(r.email)
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : 'Envoi impossible.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout>
      {loading ? (
        <Loader />
      ) : error || !data ? (
        <>
          <h1 style={display(40)}>Invitation expirée.</h1>
          <LoadError message={error ?? ''} />
        </>
      ) : sent ? (
        <>
          <h1 style={display(40)}>Regardez vos emails.</h1>
          <p style={{ margin: 0, fontSize: 17, color: BAI.inkMid, lineHeight: 1.5 }}>Un lien vient d’être envoyé à <strong>{sent}</strong>. Un clic, et l’espace partagé s’ouvre.</p>
          <MailLinks email={sent} />
        </>
      ) : (
        <>
          <h1 style={display(40)}>{data.ownerName} vous invite.</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>En tant que <strong>{data.roleLabel.toLowerCase()}</strong>, vous pourrez {data.roleText}.</p>
          <div style={{ background: BAI.bg, borderRadius: 16, padding: '14px 18px', fontSize: 15, color: BAI.inkMid, lineHeight: 1.6 }}>
            Logement{data.properties.length > 1 ? 's' : ''} : <strong style={{ color: BAI.ink }}>{data.properties.join(', ')}</strong>
          </div>
          {problem ? <Callout tone="warn">{problem}</Callout> : null}
          {user && user.email.toLowerCase() === data.email.toLowerCase() ? (
            <Btn size="lg" onClick={() => void accept()} loading={busy} disabled={busy}>
              Accepter l’invitation
            </Btn>
          ) : (
            <>
              {user ? <Callout tone="info">Vous êtes connecté avec {user.email}. Cette invitation est adressée à {data.email} : recevez un lien à cette adresse.</Callout> : null}
              <Btn size="lg" onClick={() => void sendLink()} loading={busy} disabled={busy}>
                Recevoir mon lien de connexion
              </Btn>
              <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.5 }}>Le lien part à {data.email}. Pas de mot de passe : un clic sur le lien suffit. Votre compte Bailio est créé s’il n’existe pas encore.</span>
            </>
          )}
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.5 }}>{data.ownerName} reste responsable des informations de ses logements et peut retirer cet accès à tout moment. Vous pouvez aussi quitter cet espace quand vous voulez, depuis « Mon compte ».</span>
        </>
      )}
    </AuthLayout>
  )
}
