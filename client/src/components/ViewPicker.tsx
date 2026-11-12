import { useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import type { User, ViewMode } from '../lib/types'
import { display } from './ui'
import { Btn, ChoiceCard, errorMessage, useToast } from './kit'

/**
 * Vue du tableau de bord selon la taille du patrimoine (server/src/domain/viewMode.ts) : mêmes composants pour tous,
 * seule la disposition change. Question posée à la première connexion, puis sélecteur discret en haut d'« Aujourd'hui ».
 */
export const VIEWS: Array<{ value: ViewMode; label: string; question: string; sub: string }> = [
  { value: 'SIMPLE', label: 'Simple', question: '1 ou 2 logements', sub: 'La prochaine chose à faire, en grand.' },
  { value: 'PORTFOLIO', label: 'Par logement', question: 'De 3 à 20 logements', sub: 'Alertes, loyers du mois, rentabilité.' },
  { value: 'LARGE', label: 'Patrimoine', question: 'Plus de 20, ou des sociétés', sub: 'Patrimoine, filtres et exports d’abord.' },
  { value: 'AGENCY', label: 'Gestion pour d’autres', question: 'Je gère pour d’autres propriétaires', sub: 'Accès par propriétaire, exports.' },
]

/** Vue proposée d'après le nombre de logements (même règle que le serveur). */
export const suggestView = (properties: number): ViewMode => (properties > 20 ? 'LARGE' : properties >= 3 ? 'PORTFOLIO' : 'SIMPLE')

function useSaveView() {
  const { setUser } = useAuth()
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const save = async (viewMode: ViewMode) => {
    setSaving(true)
    try {
      setUser(await api<User>('/account', { method: 'PATCH', body: { viewMode } }))
    } catch (e) {
      toast.error(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }
  return { save, saving }
}

/** Première connexion : une question, la réponse proposée d'après les logements déjà saisis. */
export function ViewQuestion({ properties }: { properties: number }) {
  const [pick, setPick] = useState<ViewMode>(suggestView(properties))
  const { save, saving } = useSaveView()
  return (
    <section className="panel-in" aria-labelledby="view-q" style={{ background: BAI.surface, borderRadius: BAI.radius, padding: 'clamp(20px, 3vw, 32px)', display: 'flex', flexDirection: 'column', gap: 18, border: `1px solid ${BAI.border}` }}>
      <h2 id="view-q" style={display('clamp(26px, 3vw, 34px)')}>
        Combien de logements <em>louez-vous ?</em>
      </h2>
      <div className="grid-2" role="group" aria-labelledby="view-q" style={{ display: 'grid', gap: 10 }}>
        {VIEWS.map((v) => (
          <ChoiceCard key={v.value} selected={pick === v.value} onClick={() => setPick(v.value)} title={v.question} sub={v.sub} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Btn variant="dark" onClick={() => save(pick)} loading={saving}>
          Afficher ma vue
        </Btn>
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>Modifiable à tout moment, en haut de cette page.</span>
      </div>
    </section>
  )
}

/** Sélecteur de vue, discret, en haut d'« Aujourd'hui ». */
export function ViewSwitch({ value }: { value: ViewMode }) {
  const { save, saving } = useSaveView()
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: BAI.inkMid }}>
      Vue
      <select
        value={value}
        disabled={saving}
        onChange={(e) => save(e.target.value as ViewMode)}
        style={{ minHeight: 44, borderRadius: 999, border: `1.5px solid ${BAI.borderStrong}`, background: BAI.surface, color: BAI.ink, padding: '0 14px', font: 'inherit', fontWeight: 600 }}
      >
        {VIEWS.map((v) => (
          <option key={v.value} value={v.value}>
            {v.label}
          </option>
        ))}
      </select>
    </label>
  )
}
