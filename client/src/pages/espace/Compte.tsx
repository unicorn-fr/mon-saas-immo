import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { EspaceLayout } from '../../components/EspaceLayout'
import { Button, Notice, TextField, display, overline } from '../../components/ui'
import { api, ApiError, downloadPdf } from '../../lib/api'
import { SESSION_KEY, storage } from '../../lib/storage'
import { useAuth } from '../../lib/auth'
import type { User } from '../../lib/types'

export default function Compte() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(body: Record<string, unknown>) {
    setError(null)
    try {
      setUser(await api<User>('/account', { method: 'PATCH', body }))
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement impossible.')
    }
  }

  async function exportData() {
    const res = await fetch(`${(import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''}/api/account/export`, {
      headers: { Authorization: `Bearer ${storage.get(SESSION_KEY) ?? ''}` },
    })
    if (!res.ok) return setError('Export impossible.')
    downloadPdf(URL.createObjectURL(await res.blob()), 'bailio-mes-donnees.json')
  }

  async function remove() {
    try {
      await api('/account', { method: 'DELETE' })
      storage.set(SESSION_KEY, null)
      await signOut()
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible.')
    }
  }

  if (!user) return null

  return (
    <EspaceLayout>
      <div className="stack" style={{ gap: 40, maxWidth: 640 }}>
        <h1 style={display('clamp(40px, 5vw, 56px)')}>Mon compte</h1>

        <section className="stack" style={{ gap: 16 }}>
          <h2 style={{ ...overline, margin: 0 }}>Vous</h2>
          <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid }}>Email de connexion : <strong style={{ color: BAI.ink }}>{user.email}</strong></p>
          <div className="col-md" style={{ display: 'flex', gap: 16 }}>
            <TextField label="Prénom" name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <TextField label="Nom" name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button height={52} onClick={() => void save({ firstName, lastName })}>Enregistrer</Button>
            {saved ? <span role="status" style={{ color: BAI.green, fontSize: 15 }}>Enregistré</span> : null}
          </div>
        </section>

        <section className="stack" style={{ gap: 12 }}>
          <h2 style={{ ...overline, margin: 0 }}>Suivi par email</h2>
          <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
            {user.followUpActive
              ? 'Activé : vous recevez un email quelques jours avant chaque échéance (loyer, assurance, révision, fin de bail).'
              : "Désactivé : vos échéances restent visibles dans « Aujourd'hui », mais vous ne recevez pas d'email."}
          </p>
          <div>
            <Button height={48} variant={user.followUpActive ? 'light' : 'dark'} onClick={() => void save({ followUp: !user.followUpActive })}>
              {user.followUpActive ? 'Désactiver les emails' : 'Activer le suivi'}
            </Button>
          </div>
        </section>

        <section className="stack" style={{ gap: 12 }}>
          <h2 style={{ ...overline, margin: 0 }}>Vos données</h2>
          <p style={{ margin: 0, fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>
            Vous pouvez récupérer toutes vos données, ou supprimer votre compte. La suppression efface définitivement vos logements, vos baux et vos documents.
          </p>
          <div className="col-md" style={{ display: 'flex', gap: 12 }}>
            <Button height={48} variant="outline" onClick={() => void exportData()}>Télécharger mes données</Button>
            <Button height={48} variant="light" onClick={() => void signOut().then(() => navigate('/'))}>Me déconnecter</Button>
          </div>
          {confirmDelete ? (
            <Notice tone="warning">
              Supprimer définitivement votre compte et tous vos documents ? Cette action ne peut pas être annulée.
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <Button height={44} style={{ background: BAI.error, borderColor: BAI.error }} onClick={() => void remove()}>Oui, tout supprimer</Button>
                <Button height={44} variant="ghost" onClick={() => setConfirmDelete(false)}>Annuler</Button>
              </div>
            </Notice>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, color: BAI.error, fontSize: 15, textDecoration: 'underline' }}>
              Supprimer mon compte
            </button>
          )}
        </section>
        {error ? <Notice tone="warning">{error}</Notice> : null}
      </div>
    </EspaceLayout>
  )
}
