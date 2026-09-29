import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AddressField } from '../../components/AddressField'
import { Check } from '../../components/Icons'
import { StepNav, TunnelLayout } from '../../components/TunnelLayout'
import { Notice, TextField, display, inputStyle } from '../../components/ui'
import { api } from '../../lib/api'
import { useDraft } from '../../lib/draft'
import type { DraftData } from '../../lib/types'

type DpeClass = NonNullable<NonNullable<DraftData['property']>['dpeClass']>
const CLASSES: DpeClass[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

interface DpeRecord {
  number: string
  dpeClass: DpeClass
  floor: number | null
  surface: number | null
}

export function DpeWarning({ dpeClass }: { dpeClass?: string }) {
  if (dpeClass === 'G') {
    return (
      <Notice tone="warning">
        <strong>Logement classé G.</strong> Depuis le 1er janvier 2025, un logement classé G n'est plus considéré comme décent pour
        un nouveau bail : le locataire pourrait exiger des travaux. Nous vous conseillons de faire réaliser des travaux de
        rénovation avant de louer.
      </Notice>
    )
  }
  if (dpeClass === 'F') {
    return (
      <Notice tone="info">
        <strong>Logement classé F.</strong> Le loyer ne peut pas être augmenté, même à la révision annuelle. Il ne sera plus
        considéré comme décent pour un nouveau bail à partir de 2028.
      </Notice>
    )
  }
  return null
}

export default function LogementStep() {
  const { data, update, flush } = useDraft()
  const navigate = useNavigate()
  const p = data.property ?? {}
  const [address, setAddress] = useState(p.address ?? '')
  const [surface, setSurface] = useState(p.surface ? String(p.surface).replace('.', ',') : '')
  const [rooms, setRooms] = useState<number | undefined>(p.rooms)
  const [dpe, setDpe] = useState<DpeRecord[] | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!data.type) navigate('/commencer', { replace: true })
  }, [data.type, navigate])

  function lookupDpe(banId: string) {
    setDpe(null)
    api<DpeRecord[]>(`/geo/dpe?banId=${encodeURIComponent(banId)}`)
      .then((list) => {
        setDpe(list)
        if (list.length === 1) update((prev) => ({ property: { ...prev.property, banId, dpeClass: list[0].dpeClass, dpeNumber: list[0].number } }))
      })
      .catch(() => setDpe([]))
  }

  // DPE proposé à la réouverture de l'étape si l'adresse est déjà connue.
  useEffect(() => {
    if (p.banId && dpe === null) lookupDpe(p.banId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function patch(next: Partial<NonNullable<DraftData['property']>>) {
    update((prev) => ({ property: { ...prev.property, ...next } }))
  }

  async function next() {
    const surfaceValue = Number(surface.replace(',', '.'))
    const e: Record<string, string> = {}
    if (address.trim().length < 5) e.address = "Indiquez l'adresse du logement."
    if (!surfaceValue || surfaceValue <= 0) e.surface = 'Indiquez la surface habitable.'
    if (!rooms) e.rooms = 'Choisissez le nombre de pièces.'
    setErrors(e)
    if (Object.keys(e).length) return
    update((prev) => ({ property: { ...prev.property, address: address.trim(), surface: surfaceValue, rooms } }), 'personnes')
    await flush()
    navigate('/commencer/personnes')
  }

  const found = dpe && dpe.length === 1 ? dpe[0] : null

  return (
    <TunnelLayout step="logement">
      <h1 style={display('clamp(40px, 5vw, 56px)')}>Où se trouve le logement ?</h1>
      <AddressField
        label="Adresse"
        value={address}
        autoFocus={!address}
        placeholder="12 rue de la République, 34000 Montpellier"
        error={errors.address}
        onChange={(v) => {
          setAddress(v)
          // Adresse modifiée à la main : les informations liées à l'ancienne adresse ne valent plus.
          patch(p.banId ? { address: v, banId: undefined, inseeCode: undefined, postalCode: undefined, city: undefined, dpeClass: undefined, dpeNumber: undefined } : { address: v })
          if (p.banId) setDpe(null)
        }}
        onSelect={(s) => {
          setAddress(s.label)
          patch({ address: s.label, postalCode: s.postalCode, city: s.city, inseeCode: s.inseeCode, banId: s.banId, dpeClass: undefined, dpeNumber: undefined })
          if (s.banId) lookupDpe(s.banId)
        }}
      />

      {found ? (
        <div style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: BAI.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Check />
          </div>
          <div className="stack" style={{ gap: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Diagnostic énergétique trouvé : classe {found.dpeClass}</span>
            <span style={{ fontSize: 14, color: BAI.inkSoft }}>Il sera indiqué dans le bail automatiquement.</span>
          </div>
        </div>
      ) : dpe !== null ? (
        <div className="stack" style={{ gap: 8 }}>
          <label htmlFor="dpe" style={{ fontSize: 15, fontWeight: 600 }}>
            Classe énergie du logement <span style={{ fontWeight: 400, color: BAI.inkSoft }}>(facultatif)</span>
          </label>
          <select id="dpe" value={p.dpeClass ?? ''} onChange={(e) => patch({ dpeClass: (e.target.value || undefined) as DpeClass | undefined, dpeNumber: undefined })} style={{ ...inputStyle(), appearance: 'auto' }}>
            <option value="">Je ne sais pas</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                Classe {c}
              </option>
            ))}
          </select>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>
            {dpe.length > 1 ? 'Plusieurs diagnostics existent à cette adresse. ' : ''}Elle figure sur votre diagnostic de performance énergétique (DPE).
          </span>
        </div>
      ) : null}
      <DpeWarning dpeClass={p.dpeClass} />

      <div style={{ display: 'flex', gap: 20 }}>
        <TextField
          label="Surface habitable"
          name="surface"
          inputMode="decimal"
          suffix="m²"
          value={surface}
          error={errors.surface}
          onChange={(e) => {
            const v = e.target.value.replace(/[^\d,.]/g, '')
            setSurface(v)
            patch({ surface: Number(v.replace(',', '.')) || undefined })
          }}
        />
      </div>

      <fieldset style={{ margin: 0, padding: 0, border: 'none' }} className="stack">
        <legend style={{ fontSize: 15, fontWeight: 600, padding: 0, marginBottom: 10 }}>Nombre de pièces principales</legend>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = n === 5 ? (rooms ?? 0) >= 5 : rooms === n
            return (
              <button
                key={n}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setRooms(n)
                  patch({ rooms: n })
                }}
                style={{ width: 64, height: 56, border: selected ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: selected ? BAI.ownerLight : BAI.surface, color: selected ? BAI.owner : BAI.ink, fontSize: 18, fontWeight: selected ? 700 : 600, borderRadius: 12 }}
              >
                {n === 5 ? '5+' : n}
              </button>
            )
          })}
        </div>
        {(rooms ?? 0) >= 5 ? (
          <div style={{ marginTop: 12, maxWidth: 200 }}>
            <TextField label="Nombre exact" name="rooms" inputMode="numeric" value={String(rooms)} onChange={(e) => {
              const n = Math.max(5, Math.min(30, Number(e.target.value.replace(/\D/g, '')) || 5))
              setRooms(n)
              patch({ rooms: n })
            }} />
          </div>
        ) : null}
        <span style={{ fontSize: 14, color: errors.rooms ? BAI.error : BAI.inkSoft, marginTop: 10 }}>
          {errors.rooms ?? 'Séjour et chambres. La cuisine et la salle de bain ne comptent pas.'}
        </span>
      </fieldset>

      <StepNav back="/commencer" next={next} />
    </TunnelLayout>
  )
}
