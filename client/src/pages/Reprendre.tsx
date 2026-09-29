import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SimplePage } from '../components/SiteChrome'
import { stepPath, TUNNEL_STEPS } from '../components/TunnelLayout'
import { ButtonLink, Notice, Spinner } from '../components/ui'
import { useDraft } from '../lib/draft'

/** Lien « reprendre mon bail » reçu par email. */
export default function Reprendre() {
  const [params] = useSearchParams()
  const { adopt } = useDraft()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const once = useRef(false)

  useEffect(() => {
    if (once.current) return
    once.current = true
    const token = params.get('brouillon')
    if (!token) return setFailed(true)
    adopt(token).then((draft) => {
      if (!draft) return setFailed(true)
      const step = (TUNNEL_STEPS as readonly string[]).includes(draft.step) ? draft.step : 'type'
      navigate(stepPath(step), { replace: true })
    })
  }, [params, adopt, navigate])

  return (
    <SimplePage title="Reprendre mon bail">
      {failed ? (
        <div className="stack" style={{ gap: 16, maxWidth: 520 }}>
          <Notice tone="warning">Ce lien a expiré (les brouillons sont gardés 30 jours) ou votre bail a déjà été créé.</Notice>
          <ButtonLink to="/commencer">Recommencer mon bail</ButtonLink>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Spinner /> Nous retrouvons votre bail…
        </div>
      )}
    </SimplePage>
  )
}
