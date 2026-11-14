import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { getProfile, getSpace, switchProfile } from '../lib/shared'

/**
 * « Tous les profils » : en haut du menu, choisir un profil bailleur (structure : en mon nom, SCI…) pour ne voir que
 * ses biens, locataires, loyers et comptes. Affiché à partir de deux profils, jamais dans un espace partagé.
 */
export function ProfilePicker() {
  const [list, setList] = useState<Array<{ id: string; name: string }>>([])
  const current = getProfile()
  useEffect(() => {
    if (getSpace()) return
    api<Array<{ id: string; name: string }>>('/structures')
      .then((rows) => {
        setList(rows)
        // Profil supprimé entre-temps : on revient à tous les profils.
        if (current && !rows.some((r) => r.id === current)) switchProfile(null)
      })
      .catch(() => undefined)
  }, [current])
  if (list.length < 2) return null
  return (
    <label className="profile-pick">
      <span className="sr-only">Profil bailleur affiché</span>
      <select value={current ?? ''} onChange={(e) => switchProfile(e.target.value || null)}>
        <option value="">Tous les profils</option>
        {list.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  )
}
