import { useEffect, useState } from 'react'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import type { PropertySummary } from '../lib/space'
import { Btn, Select, useConfirm, useToast } from './kit'

/**
 * Sur la page d'un bien : le rattacher à un immeuble ou à une colocation (il en devient un lot, avec son bail, son loyer
 * et sa comptabilité), ou l'archiver (vendu, plus loué : rien n'est effacé).
 */
export function LotAndArchive({ propertyId, onChanged }: { propertyId: string; onChanged: () => void }) {
  const [list, setList] = useState<PropertySummary[] | null>(null)
  const toast = useToast()
  const confirm = useConfirm()
  useEffect(() => {
    api<PropertySummary[]>('/properties').then(setList).catch(() => setList([]))
  }, [propertyId])
  if (!list) return null
  const me = list.find((p) => p.id === propertyId)
  if (!me) return null
  const hasUnits = list.some((p) => p.parentId === me.id)
  const parents = list.filter((p) => p.id !== me.id && !p.parentId && !p.archivedAt)
  const act = async (fn: () => Promise<unknown>, done: string) => {
    try {
      await fn()
      toast.show(done)
      setList(await api<PropertySummary[]>('/properties'))
      onChanged()
    } catch (e) {
      toast.error(e)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
      {hasUnits ? (
        <span style={{ fontSize: 15, color: BAI.inkMid }}>
          Ce bien contient {list.filter((p) => p.parentId === me.id).length} lot(s) : sa comptabilité les additionne.
        </span>
      ) : parents.length ? (
        <Select
          label="Lot d’un immeuble ou chambre d’une colocation"
          value={me.parentId ?? 'none'}
          onChange={(v) => void act(() => api(`/properties/${me.id}/parent`, { method: 'PUT', body: { parentId: v === 'none' ? null : v } }), v === 'none' ? 'Bien détaché.' : 'Bien rattaché.')}
          options={[{ value: 'none', label: 'Bien indépendant' }, ...parents.map((p) => ({ value: p.id, label: `Lot de : ${p.name}` }))]}
        />
      ) : null}
      <span>
        <Btn
          size="sm"
          variant="outline"
          onClick={() =>
            void (async () => {
              if (!me.archivedAt && !(await confirm({ title: 'Archiver ce bien ?', text: 'Il quitte la liste des biens. Ses baux, loyers et documents sont gardés ; vous pouvez le ressortir à tout moment.', confirm: 'Archiver' }))) return
              await act(() => api(`/properties/${me.id}/archive`, { method: 'POST', body: { archived: !me.archivedAt } }), me.archivedAt ? 'Bien remis dans la liste.' : 'Bien archivé.')
            })()
          }
        >
          {me.archivedAt ? 'Ressortir des archives' : 'Archiver ce bien'}
        </Btn>
      </span>
    </div>
  )
}
