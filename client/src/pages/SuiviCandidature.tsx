import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { Logo } from '../components/Logo'
import { Btn, Callout, Card, Check, LoadError, Loader, useLoad, useToast } from '../components/kit'
import { PublicPhoto } from '../components/media'
import { display } from '../components/ui'
import { api } from '../lib/api'
import { dateNum } from '../lib/format'

interface Follow {
  firstNames: string
  city: string | null
  hasPhoto: boolean
  sentAt: string
  documents: string[]
  visitConfirmedAt: string | null
  keepDays: number
}

/** Conseils contre les fausses annonces, repris sur la candidature et sur son suivi. */
export function SafetyNote() {
  return (
    <Callout tone="info" title="Vos pièces sont protégées">
      <ul style={{ margin: '4px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <li>Chaque pièce reçoit un filigrane avec la ville du logement et la date : elle ne peut pas resservir ailleurs.</li>
        <li>Le propriétaire ne voit vos pièces qu’après que vous avez confirmé avoir visité le logement ou l’avoir rencontré.</li>
        <li>Un propriétaire qui ne peut pas faire visiter, qui est « à l’étranger » ou qui demande de l’argent avant la visite : c’est presque toujours une arnaque.</li>
        <li>Ne versez jamais d’argent (frais de dossier, réservation, premier loyer) avant d’avoir visité le logement et signé le bail.</li>
      </ul>
    </Callout>
  )
}

/**
 * Suivi d'une candidature, depuis le lien reçu par email (sans compte) : le candidat confirme la visite (ses pièces
 * deviennent alors visibles du propriétaire) ou retire sa candidature (tout est effacé).
 */
export default function SuiviCandidature() {
  const { token = '' } = useParams()
  const toast = useToast()
  const path = `/suivi-candidature/${encodeURIComponent(token)}`
  const { data, error, loading, reload, setData } = useLoad(() => api<Follow>(path), [token])
  const [met, setMet] = useState(false)
  const [busy, setBusy] = useState(false)
  const [withdrawn, setWithdrawn] = useState(false)

  const confirm = async () => {
    if (!met) return toast.show('Cochez la case pour confirmer la visite.', 'error')
    setBusy(true)
    try {
      setData(await api<Follow>(`${path}/visit`, { method: 'POST' }))
      toast.show('Visite confirmée : le propriétaire peut voir vos pièces.')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  const withdraw = async () => {
    if (!window.confirm('Retirer votre candidature ? Elle est effacée tout de suite, avec vos pièces.')) return
    setBusy(true)
    try {
      await api(path, { method: 'DELETE' })
      setWithdrawn(true)
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink }}>
      <header style={{ padding: '20px clamp(16px, 4vw, 40px)', borderBottom: `1px solid ${BAI.divider}`, background: BAI.surface }}>
        <Logo />
      </header>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) 16px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {withdrawn ? (
          <Card>
            <h1 style={display('clamp(32px, 5vw, 44px)')}>Candidature retirée.</h1>
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.55 }}>Votre candidature et vos pièces sont effacées.</span>
          </Card>
        ) : loading && !data ? (
          <Loader />
        ) : error || !data ? (
          <LoadError message={error ?? 'Ce lien de suivi n’est plus actif.'} retry={reload} />
        ) : (
          <>
            {data.hasPhoto ? <PublicPhoto src={`/api${path}/photo`} alt={data.city ? `Photo du logement à ${data.city}` : 'Photo du logement'} /> : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 14, color: BAI.inkSoft }}>Candidature envoyée le {dateNum(data.sentAt)}</span>
              <h1 style={display('clamp(32px, 5vw, 46px)')}>
                Votre candidature{data.city ? ` à ${data.city}` : ''}, <em>en sécurité</em>
              </h1>
            </div>
            <Card title="Vos pièces">
              {data.documents.length ? (
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 15, lineHeight: 1.6 }}>
                  {data.documents.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : (
                <span style={{ fontSize: 15, color: BAI.inkMid }}>Aucune pièce déposée.</span>
              )}
              {data.visitConfirmedAt ? (
                <Callout tone="ok">Visite confirmée le {dateNum(data.visitConfirmedAt)} : le propriétaire peut voir vos pièces, avec leur filigrane.</Callout>
              ) : (
                <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>Elles portent un filigrane et restent cachées au propriétaire tant que vous n’avez pas confirmé la visite.</span>
              )}
            </Card>
            {!data.visitConfirmedAt ? (
              <Card title="Avez-vous visité le logement ?">
                <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>Confirmez seulement après avoir vu le logement en vrai, ou rencontré le propriétaire en personne.</span>
                <Check checked={met} onChange={setMet} label="J’ai visité ce logement ou rencontré son propriétaire en personne." />
                <div>
                  <Btn onClick={() => void confirm()} disabled={busy}>
                    Confirmer la visite
                  </Btn>
                </div>
              </Card>
            ) : null}
            <SafetyNote />
            <Card title="Retirer ma candidature">
              <span style={{ fontSize: 15, color: BAI.inkMid, lineHeight: 1.55 }}>
                Vous avez trouvé ailleurs ou l’annonce vous semble douteuse ? Votre candidature et vos pièces sont effacées tout de suite. Sinon, elles le sont au plus tard {Math.round(data.keepDays / 30)} mois après l’envoi si elle n’est pas retenue.
              </span>
              <div>
                <Btn variant="outline" onClick={() => void withdraw()} disabled={busy}>
                  Retirer ma candidature
                </Btn>
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
