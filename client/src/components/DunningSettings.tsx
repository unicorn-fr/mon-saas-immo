import { useState } from 'react'
import { api } from '../lib/api'
import { Btn, Callout, Input, TextLink, Toggle, errorMessage, useConfirm, useToast } from './kit'

export interface Dunning {
  enabled: boolean
  days: [number, number, number]
}

const STEPS = ['Relance amiable', 'Second rappel', 'Mise en demeure'] as const

/**
 * Relances automatiques d'un loyer impayé (page du bail, « Loyers et quittances ») : un interrupteur, puis les trois jours
 * après l'échéance, réglables. Les lettres sont celles des courriers de Bailio, envoyées par email au locataire.
 */
export function DunningSettings({ leaseId, value, tenantName, onChange }: { leaseId: string; value: Dunning; tenantName: string; onChange: () => void }) {
  const toast = useToast()
  const confirm = useConfirm()
  const [editing, setEditing] = useState(false)
  const [days, setDays] = useState<string[]>(value.days.map(String))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const save = async (body: Partial<Dunning>) => {
    await api(`/leases/${leaseId}/dunning`, { method: 'PUT', body })
    onChange()
  }

  const toggle = async (on: boolean) => {
    if (on) {
      const ok = await confirm({
        title: 'Envoyer les relances automatiquement ?',
        confirm: 'Oui, activer',
        text: `Si le loyer n’est pas noté reçu, ${tenantName || 'votre locataire'} recevra par email une relance amiable ${value.days[0]} jours après l’échéance, un second rappel à ${value.days[1]} jours, puis une mise en demeure à ${value.days[2]} jours. Vous recevez une copie de chaque envoi.`,
      })
      if (!ok) return
    }
    try {
      await save({ enabled: on })
      toast.show(on ? 'Relances automatiques activées.' : 'Relances automatiques arrêtées.')
    } catch (e) {
      toast.error(e)
    }
  }

  const saveDays = async () => {
    const n = days.map((d) => Number(d))
    if (!n.every((x) => Number.isInteger(x) && x >= 1 && x <= 60) || !(n[0] < n[1] && n[1] < n[2])) return setError('Choisissez des jours croissants, entre 1 et 60.')
    setBusy(true)
    setError(null)
    try {
      await save({ days: n as Dunning['days'] })
      setEditing(false)
      toast.show('Jours des relances enregistrés.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Toggle
        checked={value.enabled}
        onChange={(v) => void toggle(v)}
        label="Relancer automatiquement un loyer impayé"
        sub={`Relance amiable à J+${value.days[0]}, second rappel à J+${value.days[1]}, mise en demeure à J+${value.days[2]}. Tout s’arrête dès que le loyer est noté reçu.`}
      />
      {value.enabled ? (
        editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>
            {error ? <Callout tone="warn">{error}</Callout> : null}
            <div className="grid-3" style={{ gap: 12 }}>
              {STEPS.map((label, i) => (
                <Input key={label} label={label} suffix="jours" inputMode="numeric" value={days[i]} onChange={(v) => setDays(days.map((d, j) => (j === i ? v.replace(/\D/g, '') : d)))} maxLength={2} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn size="sm" variant="outline" onClick={() => setEditing(false)}>
                Annuler
              </Btn>
              <Btn size="sm" variant="outline" loading={busy} onClick={() => void saveDays()}>
                Enregistrer
              </Btn>
            </div>
          </div>
        ) : (
          <div style={{ paddingBottom: 12 }}>
            <TextLink style={{ fontSize: 14 }} onClick={() => setEditing(true)}>
              Modifier les jours
            </TextLink>
          </div>
        )
      ) : null}
    </>
  )
}
