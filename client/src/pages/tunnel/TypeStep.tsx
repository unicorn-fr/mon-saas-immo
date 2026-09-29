import { useEffect, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { House, Sofa } from '../../components/Icons'
import { TunnelLayout } from '../../components/TunnelLayout'
import { display } from '../../components/ui'
import { useDraft } from '../../lib/draft'
import type { LeaseType } from '../../lib/types'

const OPTIONS: Array<{ type: LeaseType; title: string; text: string; icon: ReactNode }> = [
  { type: 'UNFURNISHED', title: 'Vide', text: 'Sans meubles · bail de 3 ans', icon: <House /> },
  { type: 'FURNISHED', title: 'Meublé', text: 'Avec meubles · bail de 1 an', icon: <Sofa /> },
]

export default function TypeStep() {
  const { data, update, ready } = useDraft()
  const navigate = useNavigate()
  const location = useLocation()
  const prefill = (location.state as { address?: string } | null)?.address

  // Adresse saisie sur la page d'accueil : on la garde pour l'étape suivante.
  useEffect(() => {
    if (ready && prefill && !data.property?.address) update((prev) => ({ property: { ...prev.property, address: prefill } }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, prefill])

  function choose(type: LeaseType) {
    update({ type, source: data.source ?? 'tunnel' }, 'logement')
    navigate('/commencer/logement')
  }

  return (
    <TunnelLayout step="type" width={720}>
      <h1 style={display('clamp(42px, 5vw, 60px)', { textAlign: 'center', lineHeight: 1 })}>Votre logement est…</h1>
      <div className="grid-2" style={{ gap: 20 }}>
        {OPTIONS.map((o) => {
          const selected = data.type === o.type
          return (
            <button
              key={o.type}
              type="button"
              onClick={() => choose(o.type)}
              aria-pressed={selected}
              style={{ color: BAI.ink, background: selected ? BAI.ownerLight : BAI.surface, border: `2px solid ${selected ? BAI.owner : BAI.border}`, borderRadius: 24, padding: 'clamp(24px, 3vw, 40px) 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}
            >
              <span className="hide-md">{o.icon}</span>
              <span style={{ fontSize: 'clamp(24px, 2.5vw, 28px)', fontWeight: 700 }}>{o.title}</span>
              <span style={{ fontSize: 16, color: BAI.inkMid }}>{o.text}</span>
            </button>
          )
        })}
      </div>
      <p style={{ margin: 0, fontSize: 15, color: BAI.inkSoft, textAlign: 'center' }}>
        Un logement est meublé si on peut y dormir, cuisiner et vivre sans rien apporter.
      </p>
      <Link to="/importer" style={{ alignSelf: 'center', fontSize: 15, fontWeight: 600, textDecoration: 'none', padding: 12 }}>
        J'ai déjà un bail signé
      </Link>
    </TunnelLayout>
  )
}
