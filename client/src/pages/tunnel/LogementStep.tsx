import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AddressField } from '../../components/AddressField'
import { Check } from '../../components/Icons'
import { StepNav, TunnelLayout, focusFirstError } from '../../components/TunnelLayout'
import { QuestionCount, useQuestion } from '../../components/Questions'
import { Notice, TextField, display, inputStyle } from '../../components/ui'
import { api } from '../../lib/api'
import { useDraft } from '../../lib/draft'
import type { DraftData } from '../../lib/types'
import { smallSurfaceWarning } from '../../lib/lease'

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
  // Une erreur disparaît dès que l'on corrige la réponse, sans attendre « Continuer ».
  const clear = (...keys: string[]) => setErrors((e) => (keys.some((k) => e[k]) ? Object.fromEntries(Object.entries(e).filter(([k]) => !keys.includes(k))) : e))

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

  // Une question par écran : un choix passe tout seul à la suivante. L'étage et la porte ne sont demandés que pour un appartement.
  const ids = ['address', 'habitat', 'legalRegime', 'surface', 'rooms', ...(p.habitat === 'INDIVIDUAL' ? [] : ['floorDoor']), 'period', 'heating', 'energy', 'hotWater'] as const
  const { q, go } = useQuestion(ids.length)
  const id = ids[q - 1]
  const count = ids.length
  const forward = () => (q < count ? go(q + 1) : void finish())
  const pick = () => setTimeout(forward, 120)

  /** Ce qui manque encore, question par question (le même contrôle qu'avant, dans l'ordre des questions). */
  function missing(): Record<string, string> {
    const surfaceValue = Number(surface.replace(',', '.'))
    const e: Record<string, string> = {}
    if (address.trim().length < 5) e.address = "Indiquez l'adresse du logement."
    if (!p.habitat) e.habitat = 'Indiquez s’il s’agit d’un appartement ou d’une maison.'
    if (!p.legalRegime) e.legalRegime = 'Indiquez si le logement est en copropriété.'
    if (!surfaceValue || surfaceValue <= 0) e.surface = 'Indiquez la surface habitable.'
    if (!rooms) e.rooms = 'Choisissez le nombre de pièces.'
    if (!p.constructionPeriod) e.period = 'Indiquez la période de construction.'
    if (!p.heatingMode) e.heating = 'Indiquez si le chauffage est individuel ou collectif.'
    if (!p.hotWaterMode) e.hotWater = 'Indiquez si l’eau chaude est individuelle ou collective.'
    return e
  }

  function next() {
    const e = missing()
    if (e[id]) {
      setErrors({ [id]: e[id] })
      return focusFirstError()
    }
    setErrors({})
    forward()
  }

  async function finish() {
    const e = missing()
    const first = ids.find((k) => e[k])
    if (first) {
      setErrors({ [first]: e[first] })
      return go(ids.indexOf(first) + 1)
    }
    const surfaceValue = Number(surface.replace(',', '.'))
    update((prev) => ({ property: { ...prev.property, address: address.trim(), surface: surfaceValue, rooms } }), 'personnes')
    await flush()
    navigate('/commencer/personnes')
  }

  const found = dpe && dpe.length === 1 ? dpe[0] : null
  const back = q > 1 ? `?q=${q - 1}` : '/commencer'
  const heading = (text: string) => <h1 style={display('clamp(34px, 5vw, 50px)')}>{text}</h1>

  return (
    <TunnelLayout step="logement" sub={{ q, count }}>
      <div data-question className="stack" style={{ gap: 28 }}>
        <QuestionCount q={q} count={count} />
        {id === 'address' ? (
          <>
            {heading('Où se trouve le logement ?')}
            <div data-field="address" className="stack">
              <AddressField
                label="Adresse"
                value={address}
                autoFocus={!address}
                placeholder="12 rue de la République, 34000 Montpellier"
                error={errors.address}
                onChange={(v) => {
                  setAddress(v)
                  if (v.trim().length >= 5) clear('address')
                  // Adresse modifiée à la main : les informations liées à l'ancienne adresse ne valent plus.
                  patch(p.banId ? { address: v, banId: undefined, inseeCode: undefined, postalCode: undefined, city: undefined, dpeClass: undefined, dpeNumber: undefined } : { address: v })
                  if (p.banId) setDpe(null)
                }}
                onSelect={(s) => {
                  setAddress(s.label)
                  clear('address')
                  patch({ address: s.label, postalCode: s.postalCode, city: s.city, inseeCode: s.inseeCode, banId: s.banId, dpeClass: undefined, dpeNumber: undefined })
                  if (s.banId) lookupDpe(s.banId)
                }}
              />
            </div>
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
          </>
        ) : null}

        {id === 'habitat' ? (
          <>
            {heading('C’est un appartement ou une maison ?')}
            <ChipGroup
              legend="C’est"
              field="habitat"
              error={errors.habitat}
              value={p.habitat}
              onChange={(v) => {
                clear('habitat', 'legalRegime')
                // Une maison n'a ni bâtiment, ni étage, ni porte : une réponse donnée pour un appartement est retirée.
                patch({ habitat: v, legalRegime: p.legalRegime ?? (v === 'COLLECTIVE' ? 'COPRO' : 'MONO'), ...(v === 'INDIVIDUAL' ? { floorDoor: undefined } : {}) })
                pick()
              }}
              options={[
                { value: 'COLLECTIVE', label: 'Un appartement' },
                { value: 'INDIVIDUAL', label: 'Une maison' },
              ]}
            />
          </>
        ) : null}

        {id === 'legalRegime' ? (
          <>
            {heading('Est-il en copropriété ?')}
            <ChipGroup
              legend="En copropriété ?"
              hint="Copropriété : il y a un syndic et un règlement de copropriété."
              field="legalRegime"
              error={errors.legalRegime}
              value={p.legalRegime}
              onChange={(v) => {
                clear('legalRegime')
                patch({ legalRegime: v })
                pick()
              }}
              options={[
                { value: 'COPRO', label: 'Oui' },
                { value: 'MONO', label: 'Non' },
              ]}
            />
          </>
        ) : null}

        {id === 'surface' ? (
          <>
            {heading('Quelle est sa surface habitable ?')}
            <div data-field="surface" style={{ display: 'flex', gap: 20 }}>
              <TextField
                label="Surface habitable"
                name="surface"
                inputMode="decimal"
                suffix="m²"
                value={surface}
                error={errors.surface}
                hint={smallSurfaceWarning(Number(surface.replace(',', '.'))) ?? undefined}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d,.]/g, '')
                  setSurface(v)
                  if (Number(v.replace(',', '.')) > 0) clear('surface')
                  patch({ surface: Number(v.replace(',', '.')) || undefined })
                }}
              />
            </div>
          </>
        ) : null}

        {id === 'rooms' ? (
          <>
            {heading('Combien de pièces principales ?')}
            <fieldset data-field="rooms" aria-describedby="rooms-help" style={{ margin: 0, padding: 0, border: 'none' }} className="stack">
              <legend className="sr-only">Nombre de pièces principales</legend>
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
                        clear('rooms')
                        patch({ rooms: n })
                        if (n < 5) pick()
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
              <span id="rooms-help" style={{ fontSize: 14, color: errors.rooms ? BAI.error : BAI.inkSoft, marginTop: 10 }}>
                {errors.rooms ?? 'Séjour et chambres. La cuisine et la salle de bain ne comptent pas.'}
              </span>
            </fieldset>
          </>
        ) : null}

        {id === 'floorDoor' ? (
          <>
            {heading('Bâtiment, étage, porte ?')}
            <TextField maxLength={120} label="Bâtiment, étage, porte (facultatif)" name="floorDoor" value={p.floorDoor ?? ''} onChange={(e) => patch({ floorDoor: e.target.value })} placeholder="Bâtiment B, 2e étage, porte gauche" />
          </>
        ) : null}

        {id === 'period' ? (
          <>
            {heading('Quand a-t-il été construit ?')}
            <ChipGroup
              legend="Période de construction"
              hint="Elle figure dans le bail et décide des diagnostics à fournir. Une estimation suffit."
              field="period"
              error={errors.period}
              value={p.constructionPeriod}
              onChange={(v) => {
                clear('period')
                patch({ constructionPeriod: v })
                pick()
              }}
              options={[
                { value: 'BEFORE_1949', label: 'Avant 1949' },
                { value: '1949_1974', label: '1949 à 1974' },
                { value: '1975_1989', label: '1975 à 1989' },
                { value: '1990_2005', label: '1990 à 2005' },
                { value: 'AFTER_2005', label: 'Depuis 2005' },
              ]}
            />
          </>
        ) : null}

        {id === 'heating' ? (
          <>
            {heading('Le chauffage est individuel ou collectif ?')}
            <ChipGroup
              legend="Le chauffage est"
              field="heating"
              error={errors.heating}
              value={p.heatingMode}
              onChange={(v) => {
                clear('heating')
                patch({ heatingMode: v })
                pick()
              }}
              options={[
                { value: 'INDIVIDUAL', label: 'Individuel' },
                { value: 'COLLECTIVE', label: 'Collectif (pour tout l’immeuble)' },
              ]}
            />
          </>
        ) : null}

        {id === 'energy' ? (
          <>
            {heading('Il fonctionne à quoi ?')}
            <ChipGroup
              legend="Il fonctionne à"
              hint="Facultatif."
              value={p.heatingEnergy}
              onChange={(v) => {
                patch({ heatingEnergy: v })
                pick()
              }}
              options={[
                { value: 'ELECTRIC', label: 'Électricité' },
                { value: 'GAS', label: 'Gaz' },
                { value: 'HEAT_PUMP', label: 'Pompe à chaleur' },
                { value: 'FUEL', label: 'Fioul' },
                { value: 'WOOD', label: 'Bois' },
                { value: 'NETWORK', label: 'Réseau de chaleur' },
              ]}
            />
          </>
        ) : null}

        {id === 'hotWater' ? (
          <>
            {heading('Et l’eau chaude ?')}
            <ChipGroup
              legend="L’eau chaude est"
              field="hotWater"
              error={errors.hotWater}
              value={p.hotWaterMode}
              onChange={(v) => {
                clear('hotWater')
                patch({ hotWaterMode: v })
              }}
              options={[
                { value: 'INDIVIDUAL', label: 'Individuelle' },
                { value: 'COLLECTIVE', label: 'Collective' },
              ]}
            />
          </>
        ) : null}
      </div>

      <StepNav back={back} next={next} />
    </TunnelLayout>
  )
}

/** Choix en boutons, comme le nombre de pièces. */
function ChipGroup<T extends string>({ legend, field, hint, error, value, onChange, options }: { legend: string; field?: string; hint?: string; error?: string; value?: T; onChange: (v: T) => void; options: Array<{ value: T; label: string }> }) {
  const helpId = field ? `${field}-help` : undefined
  return (
    <fieldset data-field={field} aria-describedby={error || hint ? helpId : undefined} style={{ margin: 0, padding: 0, border: 'none' }} className="stack">
      <legend style={{ fontSize: 15, fontWeight: 600, padding: 0, marginBottom: 10 }}>{legend}</legend>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const selected = value === o.value
          return (
            <button key={o.value} type="button" aria-pressed={selected} onClick={() => onChange(o.value)} style={{ minHeight: 52, padding: '0 18px', border: selected ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: selected ? BAI.ownerLight : BAI.surface, color: selected ? BAI.owner : BAI.ink, fontSize: 16, fontWeight: selected ? 700 : 600, borderRadius: 12, fontFamily: 'inherit' }}>
              {o.label}
            </button>
          )
        })}
      </div>
      {error || hint ? <span id={helpId} style={{ fontSize: 14, color: error ? BAI.error : BAI.inkSoft, marginTop: 10 }}>{error ?? hint}</span> : null}
    </fieldset>
  )
}
