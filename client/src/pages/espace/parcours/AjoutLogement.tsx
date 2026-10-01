import { useEffect, useState } from 'react'
import { Cite } from '../../../components/Sources'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { AddressField } from '../../../components/AddressField'
import { StepFlow, StepNote, StepTitle } from '../../../components/FlowLayout'
import { UploadModal } from '../../../components/UploadModal'
import { AuthImage, uploadPhotos } from '../../../components/media'
import { Callout, Check, ChipButton, Chips, ChoiceCard, Input, Loader, NumberField, Pill, errorMessage, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { Camera } from '../../../components/Icons'
import { api } from '../../../lib/api'
import { CONSTRUCTION_LABEL, FURNITURE_REQUIRED, type DiagnosticRule, type FurnitureKey, type PropertyFile } from '../../../lib/contract'
import type { PropertyView } from '../../../lib/space'

const LABELS = ['Adresse', 'Type', 'Taille', 'Chauffage', 'Équipements', 'Meublé', 'Diagnostics', 'Photos']

/**
 * Ajouter un logement, une question à la fois (maquette « Ajouter un logement, 8 étapes »).
 * Le logement est créé dès la première étape, puis complété à chaque « Continuer » :
 * on peut s'arrêter et reprendre plus tard, rien n'est perdu.
 */
export default function AjoutLogement() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const id = params.get('id')
  const step = Math.min(8, Math.max(1, Number(params.get('etape') ?? 1)))
  const [f, setF] = useState<PropertyFile>({})
  const [diagnostics, setDiagnostics] = useState<DiagnosticRule[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<PropertyFile>) => setF((x) => ({ ...x, ...patch }))

  useEffect(() => {
    if (!id) return
    api<PropertyView>(`/properties/${id}`)
      .then((p) => {
        setF(p.file)
        setDiagnostics(p.diagnostics)
      })
      .catch((e) => toast.error(e))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const goto = (n: number, newId = id) => {
    const next = new URLSearchParams(params)
    if (newId) next.set('id', newId)
    next.set('etape', String(n))
    setParams(next)
    setError(null)
  }
  const furnishedStep = f.furnished === true
  const nextStep = (n: number) => (n === 6 && !furnishedStep ? 7 : n)
  const prevStep = (n: number) => (n === 6 && !furnishedStep ? 5 : n)

  const save = async (patch: Partial<PropertyFile>) => {
    if (!id) {
      const r = await api<{ id: string }>('/properties', { method: 'POST', body: { ...f, ...patch } })
      return r.id
    }
    const r = await api<{ diagnostics: DiagnosticRule[] }>(`/properties/${id}`, { method: 'PUT', body: patch })
    setDiagnostics(r.diagnostics)
    return id
  }

  const next = async () => {
    const check = validate(step, f)
    if (check) return setError(check)
    setBusy(true)
    try {
      const patch = patchFor(step, f)
      const newId = await save(patch)
      if (step === 8) {
        toast.show('Logement enregistré.')
        const back = params.get('retour')
        navigate(back === 'bail' ? `/espace/baux/nouveau?logement=${newId}` : `/espace/logements/${newId}`, { replace: true })
        return
      }
      if (!id && newId) {
        // Diagnostics exigés, connus dès la création.
        api<PropertyView>(`/properties/${newId}`).then((p) => setDiagnostics(p.diagnostics)).catch(() => undefined)
      }
      goto(nextStep(step + 1), newId)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader />

  return (
    <StepFlow
      title="Ajouter un logement"
      closeTo={id ? `/espace/logements/${id}` : '/espace/logements'}
      label={LABELS[step - 1]}
      step={step}
      total={8}
      onBack={step > 1 ? () => goto(prevStep(step - 1)) : undefined}
      onNext={next}
      busy={busy}
      nextLabel={step === 8 ? 'Enregistrer le logement' : 'Continuer'}
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      {step === 1 ? <StepAddress f={f} set={set} /> : null}
      {step === 2 ? (
        <>
          <StepTitle>C’est…</StepTitle>
          <div className="grid-2" style={{ gap: 14 }}>
            <ChoiceCard column selected={f.habitat === 'COLLECTIVE'} onClick={() => set({ habitat: 'COLLECTIVE', legalRegime: f.legalRegime ?? 'COPRO' })} title="Un appartement" sub="Dans un immeuble" />
            <ChoiceCard column selected={f.habitat === 'INDIVIDUAL'} onClick={() => set({ habitat: 'INDIVIDUAL', legalRegime: f.legalRegime ?? 'MONO' })} title="Une maison" sub="Individuelle ou mitoyenne" />
          </div>
          <Chips big legend="Il sera loué" value={f.furnished ?? null} onChange={(v) => set({ furnished: v })} options={[{ value: false, label: 'Vide' }, { value: true, label: 'Meublé' }]} />
          {f.habitat === 'COLLECTIVE' ? <Chips legend="L’immeuble est" value={f.legalRegime ?? null} onChange={(v) => set({ legalRegime: v })} options={[{ value: 'COPRO', label: 'En copropriété' }, { value: 'MONO', label: 'À un seul propriétaire' }]} /> : null}
        </>
      ) : null}
      {step === 3 ? (
        <>
          <StepTitle>Quelle taille ?</StepTitle>
          <NumberField big label="Surface habitable" suffix="m²" step="decimal" value={f.surface} onChange={(v) => set({ surface: v })} hint="Sans les balcons, caves et parkings. Elle figure obligatoirement dans le bail." />
          <Chips big legend="Pièces principales" value={f.rooms && f.rooms >= 5 ? 5 : (f.rooms ?? null)} onChange={(v) => set({ rooms: v })} options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })).concat([{ value: 5, label: '5 et plus' }])} hint="Séjour et chambres. La cuisine et la salle de bain ne comptent pas." />
          {f.rooms && f.rooms >= 5 ? <NumberField label="Nombre exact de pièces principales" value={f.rooms} onChange={(v) => set({ rooms: v ?? 5 })} /> : null}
        </>
      ) : null}
      {step === 4 ? (
        <>
          <StepTitle>Chauffage et eau chaude</StepTitle>
          <Chips big legend="Le chauffage est" value={f.heating?.mode ?? null} onChange={(v) => set({ heating: { ...f.heating, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuel' }, { value: 'COLLECTIVE', label: 'Collectif' }]} />
          <Chips
            big
            legend="Il fonctionne à"
            value={f.heating?.energy ?? null}
            onChange={(v) => set({ heating: { ...f.heating, energy: v } })}
            options={[
              { value: 'ELECTRIC', label: 'Électricité' },
              { value: 'GAS', label: 'Gaz' },
              { value: 'HEAT_PUMP', label: 'Pompe à chaleur' },
              { value: 'FUEL', label: 'Fioul' },
              { value: 'WOOD', label: 'Bois' },
              { value: 'NETWORK', label: 'Réseau de chaleur' },
            ]}
          />
          <Chips big legend="L’eau chaude est" value={f.hotWater?.mode ?? null} onChange={(v) => set({ hotWater: { ...f.hotWater, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuelle' }, { value: 'COLLECTIVE', label: 'Collective' }]} />
        </>
      ) : null}
      {step === 5 ? <StepEquipments f={f} set={set} /> : null}
      {step === 6 ? <StepFurniture f={f} set={set} /> : null}
      {step === 7 ? (
        <StepDiagnostics
          f={f}
          set={(p) => {
            set(p)
            // L'année de construction change la liste des diagnostics : elle est enregistrée tout de suite.
            if (id && ('constructionPeriod' in p || 'permitBefore1997' in p || 'diagnostics' in p)) void save(p).catch(() => undefined)
          }}
          diagnostics={diagnostics}
          propertyId={id}
        />
      ) : null}
      {step === 8 ? <StepPhotos f={f} set={set} /> : null}
      {step === 8 ? (
        <button type="button" onClick={next} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, padding: 0, cursor: 'pointer' }}>
          Passer cette étape
        </button>
      ) : null}
    </StepFlow>
  )
}

function validate(step: number, f: PropertyFile): string | null {
  if (step === 1 && !f.address?.trim()) return 'Indiquez l’adresse du logement.'
  if (step === 2 && (!f.habitat || f.furnished === null || f.furnished === undefined)) return 'Choisissez le type de logement et s’il est loué vide ou meublé.'
  if (step === 3 && (!f.surface || !f.rooms)) return 'Indiquez la surface et le nombre de pièces.'
  return null
}

/** Ce que chaque étape enregistre. */
function patchFor(step: number, f: PropertyFile): Partial<PropertyFile> {
  switch (step) {
    case 1:
      return { address: f.address, postalCode: f.postalCode, city: f.city, inseeCode: f.inseeCode, banId: f.banId, building: f.building, floorDoor: f.floorDoor, label: f.label }
    case 2:
      return { habitat: f.habitat, furnished: f.furnished, legalRegime: f.legalRegime, destination: f.destination ?? 'HABITATION' }
    case 3:
      return { surface: f.surface, rooms: f.rooms, roomList: f.roomList?.length ? f.roomList : defaultRooms(f) }
    case 4:
      return { heating: f.heating, hotWater: f.hotWater }
    case 5:
      return { equipments: f.equipments ?? [], annexes: f.annexes ?? [], commonAreas: f.commonAreas ?? [], internet: f.internet }
    case 6:
      return { furniture: { ...f.furniture, present: f.furniture?.present ?? [] } }
    case 7:
      return { constructionPeriod: f.constructionPeriod, permitBefore1997: f.permitBefore1997, diagnostics: f.diagnostics }
    default:
      return { photos: f.photos ?? [] }
  }
}

/** Pièces proposées d'après le nombre de pièces principales (modifiables dans la fiche). */
function defaultRooms(f: PropertyFile): Array<{ name: string }> {
  const n = f.rooms ?? 1
  const rooms = ['Entrée', n === 1 ? 'Pièce principale' : 'Séjour', 'Cuisine']
  for (let i = 1; i < n; i++) rooms.push(n === 2 ? 'Chambre' : `Chambre ${i}`)
  rooms.push('Salle de bain', 'WC')
  return rooms.map((name) => ({ name }))
}

function StepAddress({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  return (
    <>
      <StepTitle>Où se trouve le logement ?</StepTitle>
      <AddressField
        label="Adresse"
        value={f.address ?? ''}
        autoFocus
        onChange={(v) => set({ address: v })}
        onSelect={(s) => {
          const street = s.label.replace(new RegExp(`\\s*${s.postalCode}\\s+.*$`), '').trim()
          set({ address: s.label, postalCode: s.postalCode, city: s.city, inseeCode: s.inseeCode, banId: s.banId, label: f.label || street })
        }}
        placeholder="12 rue de la Loge, Montpellier"
      />
      <Input big label="Bâtiment, étage, porte" value={f.floorDoor ?? ''} onChange={(v) => set({ floorDoor: v })} placeholder="Bâtiment B, 2e étage, porte gauche" />
      <Input big label="Un nom pour le reconnaître (facultatif)" value={f.label ?? ''} onChange={(v) => set({ label: v })} placeholder="Studio rue Foch" />
      <StepNote>L’adresse apparaîtra dans le bail et sur vos quittances.</StepNote>
    </>
  )
}

function StepEquipments({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const annexes = new Set(f.annexes ?? [])
  const eq = new Set(f.equipments ?? [])
  const common = new Set(f.commonAreas ?? [])
  const toggle = <T extends string>(s: Set<T>, v: T) => {
    const n = new Set(s)
    if (n.has(v)) n.delete(v)
    else n.add(v)
    return [...n]
  }
  return (
    <>
      <StepTitle>Ce qui va avec</StepTitle>
      <Group legend="Annexes privées">
        {(
          [
            ['cellar', 'Cave'],
            ['parking', 'Parking'],
            ['garage', 'Garage'],
            ['balcony', 'Balcon'],
            ['terrace', 'Terrasse'],
            ['garden', 'Jardin'],
            ['attic', 'Grenier'],
          ] as const
        ).map(([k, l]) => (
          <ChipButton key={k} big pressed={annexes.has(k)} onClick={() => set({ annexes: toggle(annexes, k) })}>
            {l}
          </ChipButton>
        ))}
      </Group>
      <Group legend="Équipements">
        {(
          [
            ['kitchen', 'Cuisine équipée'],
            ['intercom', 'Interphone'],
            ['washer', 'Lave-linge'],
            ['doubleGlazing', 'Double vitrage'],
            ['shutters', 'Volets roulants'],
            ['shower', 'Douche'],
            ['bathtub', 'Baignoire'],
            ['smokeDetector', 'Détecteur de fumée'],
          ] as const
        ).map(([k, l]) => (
          <ChipButton key={k} big pressed={eq.has(k)} onClick={() => set({ equipments: toggle(eq, k) })}>
            {l}
          </ChipButton>
        ))}
        <ChipButton big pressed={f.internet === 'FIBER'} onClick={() => set({ internet: f.internet === 'FIBER' ? 'NONE' : 'FIBER' })}>
          Fibre
        </ChipButton>
      </Group>
      {f.habitat === 'COLLECTIVE' ? (
        <Group legend="Dans l’immeuble">
          {(
            [
              ['elevator', 'Ascenseur'],
              ['bikes', 'Local vélos'],
              ['bins', 'Local poubelles'],
              ['green', 'Espaces verts'],
              ['caretaker', 'Gardien'],
            ] as const
          ).map(([k, l]) => (
            <ChipButton key={k} big pressed={common.has(k)} onClick={() => set({ commonAreas: toggle(common, k) })}>
              {l}
            </ChipButton>
          ))}
        </Group>
      ) : null}
    </>
  )
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <legend style={{ fontSize: 15, fontWeight: 600, padding: 0, marginBottom: 10 }}>{legend}</legend>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    </fieldset>
  )
}

function StepFurniture({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const present = new Set(f.furniture?.present ?? [])
  const keys = Object.keys(FURNITURE_REQUIRED) as FurnitureKey[]
  const missing = keys.filter((k) => !present.has(k))
  return (
    <>
      <StepTitle>Les meubles obligatoires</StepTitle>
      <StepNote>Pour louer en meublé, la loi impose ces 11 équipements (<Cite reference="décret n° 2015-981" />). Cochez ce qui est présent.</StepNote>
      <div style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 16, padding: '18px 20px', display: 'grid', gap: 12 }}>
        {keys.map((k) => (
          <Check
            key={k}
            checked={present.has(k)}
            label={FURNITURE_REQUIRED[k]}
            onChange={(v) => {
              const n = new Set(present)
              if (v) n.add(k)
              else n.delete(k)
              set({ furniture: { ...f.furniture, present: keys.filter((x) => n.has(x)) } })
            }}
          />
        ))}
      </div>
      {missing.length && missing.length < 11 ? <Callout tone="warn">Il manque : {missing.map((k) => FURNITURE_REQUIRED[k].toLowerCase()).join(', ')}. Bailio vous le rappellera avant le bail.</Callout> : null}
    </>
  )
}

function StepDiagnostics({ f, set, diagnostics, propertyId }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void; diagnostics: DiagnosticRule[]; propertyId: string | null }) {
  const [upload, setUpload] = useState<string | null>(null)
  const d = f.diagnostics ?? {}
  const period = f.constructionPeriod
  // Liste indicative mise à jour tout de suite, avant l'enregistrement (le serveur fait foi ensuite).
  const rules = diagnostics.length ? diagnostics : []
  return (
    <>
      <StepTitle>Les diagnostics</StepTitle>
      <Chips
        big
        legend="Année de construction"
        value={period ?? null}
        onChange={(v) => set({ constructionPeriod: v, permitBefore1997: v === 'BEFORE_1949' || v === '1949_1974' || v === '1975_1989' ? true : v === 'AFTER_2005' ? false : f.permitBefore1997 })}
        options={(Object.keys(CONSTRUCTION_LABEL) as Array<keyof typeof CONSTRUCTION_LABEL>).map((k) => ({ value: k, label: CONSTRUCTION_LABEL[k] }))}
      />
      {period === '1990_2005' ? <Chips legend="Permis de construire délivré avant le 1er juillet 1997 ?" value={f.permitBefore1997 ?? null} onChange={(v) => set({ permitBefore1997: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint="Il détermine si le repérage de l’amiante est exigé." /> : null}
      <Chips legend="Classe énergie (DPE)" value={d.dpe?.class ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, class: v } } })} options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((c) => ({ value: c, label: c }))} hint="Sur le diagnostic de performance énergétique, ou sur l’annonce du logement." />
      {d.dpe?.class === 'G' ? <Callout tone="warn">Depuis le 1er janvier 2025, un logement classé G ne peut plus être proposé à la location (décence énergétique).</Callout> : d.dpe?.class === 'F' ? <Callout tone="warn">Classé F : le loyer ne peut pas être augmenté, et le logement ne pourra plus être loué à partir de 2028.</Callout> : null}
      {rules.length ? (
        <>
          <StepNote>Selon l’âge du logement, la loi n’exige pas les mêmes diagnostics. Voici ceux qu’il vous faut :</StepNote>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules
              .filter((r) => r.required)
              .map((r) => (
                <div key={r.key} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: BAI.inkSoft }}>{r.reason}</span>
                  </span>
                  {r.key === 'erp' ? (
                    <a href="https://errial.georisques.gouv.fr/" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Le faire en ligne
                    </a>
                  ) : propertyId ? (
                    <button type="button" onClick={() => setUpload(r.key)} style={{ background: 'none', border: 'none', color: BAI.owner, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      Ajouter le PDF
                    </button>
                  ) : null}
                </div>
              ))}
          </div>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>L’état des risques se fait gratuitement sur le site officiel Géorisques. Vous pourrez ajouter les diagnostics plus tard.</span>
        </>
      ) : null}
      {propertyId ? <UploadModal open={upload !== null} onClose={() => setUpload(null)} onSaved={() => undefined} propertyId={propertyId} kind="DIAGNOSTIC" diagnostic={upload ?? undefined} /> : null}
    </>
  )
}

function StepPhotos({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const photos = f.photos ?? []
  return (
    <>
      <StepTitle>Des photos ?</StepTitle>
      <StepNote>Facultatif. Elles vous serviront pour votre annonce et l’état des lieux.</StepNote>
      <label style={{ border: `1.5px dashed ${BAI.dashed}`, background: BAI.surface, borderRadius: 20, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center', cursor: 'pointer' }}>
        {busy ? <Spinner size={28} /> : <Camera size={36} />}
        <span style={{ fontSize: 17, fontWeight: 700 }}>Déposez vos photos</span>
        <span style={{ fontSize: 14, color: BAI.inkSoft }}>ou prenez-les depuis votre téléphone</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []).slice(0, 10)
            e.target.value = ''
            if (!files.length) return
            setBusy(true)
            try {
              const ids = await uploadPhotos(files)
              set({ photos: [...photos, ...ids].slice(0, 60) })
            } catch (err) {
              toast.error(err)
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {photos.length ? (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {photos.map((p) => (
            <AuthImage key={p} id={p} size={96} onRemove={() => set({ photos: photos.filter((x) => x !== p) })} />
          ))}
        </div>
      ) : null}
      {photos.length ? <Pill tone="green">{photos.length} photo{photos.length > 1 ? 's' : ''}</Pill> : null}
    </>
  )
}
