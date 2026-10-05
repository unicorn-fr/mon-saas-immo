import { useEffect, useState } from 'react'
import { Cite } from '../../../components/Sources'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { AddressField } from '../../../components/AddressField'
import { Fields, StepFlow, StepNote, StepTitle } from '../../../components/FlowLayout'
import { UploadModal } from '../../../components/UploadModal'
import { StructurePicker } from '../../../components/StructurePicker'
import { AuthImage, uploadPhotos } from '../../../components/media'
import { Callout, Check, ChipButton, Chips, ChoiceCard, Input, Loader, Money, NumberField, Pill, TextArea, errorMessage, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { Camera } from '../../../components/Icons'
import { api } from '../../../lib/api'
import { ANNEXES, COMMON_AREAS, CONSTRUCTION_LABEL, ENERGY_LABEL, EQUIPMENTS, FURNITURE_REQUIRED, type AnnexKey, type CommonKey, type DiagnosticRule, type EquipmentKey, type FurnitureKey, type PropertyFile } from '../../../lib/contract'
import type { PropertyView } from '../../../lib/space'

type StepId = 'address' | 'type' | 'copro' | 'size' | 'heating' | 'annexes' | 'equipments' | 'furniture' | 'diagnostics' | 'rent' | 'photos'
const LABELS: Record<StepId, string> = {
  address: 'Adresse',
  type: 'Type de location',
  copro: 'Copropriété',
  size: 'Construction et pièces',
  heating: 'Chauffage et eau chaude',
  annexes: 'Annexes et parties communes',
  equipments: 'Équipements',
  furniture: 'Mobilier',
  diagnostics: 'Diagnostics',
  rent: 'Loyer',
  photos: 'Photos',
}
/** Étapes utiles pour ce logement : la copropriété et le mobilier seulement quand ils le concernent. */
const stepsFor = (f: PropertyFile): StepId[] =>
  (['address', 'type', f.legalRegime === 'COPRO' ? 'copro' : null, 'size', 'heating', 'annexes', 'equipments', f.furnished === true ? 'furniture' : null, 'diagnostics', 'rent', 'photos'] as const).filter(
    (x): x is StepId => Boolean(x),
  )

/**
 * Ajouter un logement, une question à la fois. Chaque étape demande ce que le bail (contrat type, rubrique II),
 * les diagnostics et l'état des lieux exigent : à la fin, le logement est prêt pour le bail.
 * Le logement est créé dès la première étape, puis complété à chaque « Continuer » : rien n'est perdu.
 */
export default function AjoutLogement() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const id = params.get('id')
  const [f, setF] = useState<PropertyFile>({})
  const [diagnostics, setDiagnostics] = useState<DiagnosticRule[]>([])
  const [loading, setLoading] = useState(Boolean(id))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Structure qui détient le logement : demandée à la création seulement (elle se change ensuite depuis la page du logement).
  // null : la première du compte ; '' : une nouvelle structure est en cours de création.
  const [structureId, setStructureId] = useState<string | null>(null)
  const set = (patch: Partial<PropertyFile>) => setF((x) => ({ ...x, ...patch }))
  const steps = stepsFor(f)
  const asked = params.get('etape') as StepId | null
  const current: StepId = asked && steps.includes(asked) ? asked : 'address'
  const index = steps.indexOf(current)

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

  const goto = (step: StepId, newId = id) => {
    const next = new URLSearchParams(params)
    if (newId) next.set('id', newId)
    next.set('etape', step)
    setParams(next)
    setError(null)
    window.scrollTo(0, 0)
  }

  const save = async (patch: Partial<PropertyFile>) => {
    if (!id) {
      const r = await api<{ id: string }>('/properties', { method: 'POST', body: { ...f, ...patch, structureId: structureId || null } })
      return r.id
    }
    const r = await api<{ diagnostics: DiagnosticRule[] }>(`/properties/${id}`, { method: 'PUT', body: patch })
    setDiagnostics(r.diagnostics)
    return id
  }

  const next = async () => {
    const check = validate(current, f) ?? (current === 'address' && !id && structureId === '' ? 'Indiquez à qui appartient le logement, ou terminez la création de la structure.' : null)
    if (check) return setError(check)
    setBusy(true)
    try {
      const newId = await save(patchFor(current, f))
      const after = stepsFor(f)
      const following = after[after.indexOf(current) + 1]
      if (!following) {
        toast.show('Logement enregistré.')
        const back = params.get('retour')
        navigate(back === 'bail' ? `/espace/baux/nouveau?logement=${newId}` : back === 'locataire' ? `/espace/locataires/nouveau?logement=${newId}` : `/espace/logements/${newId}`, { replace: true })
        return
      }
      if (!id && newId) api<PropertyView>(`/properties/${newId}`).then((p) => setDiagnostics(p.diagnostics)).catch(() => undefined)
      goto(following, newId)
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
      label={LABELS[current]}
      step={index + 1}
      total={steps.length}
      onBack={index > 0 ? () => goto(steps[index - 1]) : undefined}
      onNext={next}
      busy={busy}
      nextLabel={index === steps.length - 1 ? 'Enregistrer le logement' : 'Continuer'}
    >
      {error ? <Callout tone="warn">{error}</Callout> : null}
      {current === 'address' ? <StepAddress f={f} set={set} /> : null}
      {current === 'address' && !id ? <StructurePicker value={structureId} onChange={setStructureId} /> : null}
      {current === 'type' ? <StepType f={f} set={set} /> : null}
      {current === 'copro' ? <StepCopro f={f} set={set} /> : null}
      {current === 'size' ? <StepSize f={f} set={set} /> : null}
      {current === 'heating' ? <StepHeating f={f} set={set} /> : null}
      {current === 'annexes' ? <StepAnnexes f={f} set={set} /> : null}
      {current === 'equipments' ? <StepEquipments f={f} set={set} /> : null}
      {current === 'furniture' ? <StepFurniture f={f} set={set} /> : null}
      {current === 'diagnostics' ? (
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
      {current === 'rent' ? <StepRent f={f} set={set} /> : null}
      {current === 'photos' ? <StepPhotos f={f} set={set} /> : null}
      {current === 'photos' ? (
        <button type="button" onClick={next} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, padding: 0, cursor: 'pointer' }}>
          Passer cette étape
        </button>
      ) : null}
    </StepFlow>
  )
}

/** Ce qui est indispensable au bail avant de passer à l'étape suivante. */
function validate(step: StepId, f: PropertyFile): string | null {
  switch (step) {
    case 'address':
      return f.address?.trim() ? null : 'Indiquez l’adresse du logement.'
    case 'type':
      if (!f.habitat || f.furnished === null || f.furnished === undefined) return 'Choisissez le type de logement et s’il est loué vide ou meublé.'
      if (!f.legalRegime) return 'Indiquez si l’immeuble est en copropriété.'
      return null
    case 'size':
      if (!f.constructionPeriod) return 'Indiquez la période de construction : elle figure dans le bail et décide des diagnostics.'
      if (!f.surface || !f.rooms) return 'Indiquez la surface habitable et le nombre de pièces principales.'
      return f.roomList?.some((r) => r.name.trim()) ? null : 'Indiquez au moins une pièce.'
    case 'heating':
      if (!f.heating?.mode || !f.heating.energy) return 'Indiquez le mode et l’énergie du chauffage.'
      if (!f.hotWater?.mode) return 'Indiquez comment l’eau chaude est produite.'
      if (f.heating.mode === 'COLLECTIVE' && !f.heating.split?.trim()) return 'Chauffage collectif : indiquez comment la consommation est répartie (le bail doit le préciser).'
      if (f.hotWater.mode === 'COLLECTIVE' && !f.hotWater.split?.trim()) return 'Eau chaude collective : indiquez comment la consommation est répartie (le bail doit le préciser).'
      return null
    case 'equipments':
      if (!f.equipments?.length && !f.otherEquipments?.trim()) return 'Indiquez au moins un équipement du logement.'
      if (!f.smokeDetectors || f.smokeDetectors < 1) return 'Indiquez le nombre de détecteurs de fumée : au moins un est obligatoire.'
      if (!f.tv || !f.internet) return 'Indiquez la réception de la télévision et l’accès à internet.'
      return null
    case 'diagnostics':
      return f.diagnostics?.dpe?.class ? null : 'Indiquez la classe énergie du DPE.'
    case 'rent': {
      const r = f.rent ?? {}
      if (!r.rentCents) return 'Indiquez le loyer hors charges.'
      if (r.chargesCents === null || r.chargesCents === undefined) return 'Indiquez les charges par mois (0 s’il n’y en a pas).'
      const max = r.rentCents * (f.furnished ? 2 : 1)
      if (r.depositCents && r.depositCents > max) return `Le dépôt de garantie ne peut pas dépasser ${f.furnished ? 'deux mois' : 'un mois'} de loyer hors charges.`
      return null
    }
    default:
      return null
  }
}

/** Ce que chaque étape enregistre. */
function patchFor(step: StepId, f: PropertyFile): Partial<PropertyFile> {
  switch (step) {
    case 'address':
      return { address: f.address, postalCode: f.postalCode, city: f.city, inseeCode: f.inseeCode, banId: f.banId, building: f.building, floorDoor: f.floorDoor, label: f.label }
    case 'type':
      return { habitat: f.habitat, furnished: f.furnished, legalRegime: f.legalRegime, destination: f.destination ?? 'HABITATION', fiscalId: f.fiscalId, rentalPermit: f.rentalPermit }
    case 'copro':
      return { copro: f.copro, lotNumber: f.lotNumber }
    case 'size':
      return { constructionPeriod: f.constructionPeriod, permitBefore1997: f.permitBefore1997, surface: f.surface, rooms: f.rooms, roomList: (f.roomList ?? []).filter((r) => r.name.trim()) }
    case 'heating':
      return { heating: f.heating, hotWater: f.hotWater }
    case 'annexes':
      return { annexes: f.annexes ?? [], garageNumber: f.garageNumber, gardenArea: f.gardenArea, commonAreas: f.habitat === 'COLLECTIVE' ? (f.commonAreas ?? []) : [] }
    case 'equipments':
      return { equipments: f.equipments ?? [], otherEquipments: f.otherEquipments, smokeDetectors: f.smokeDetectors, keys: f.keys, tv: f.tv, internet: f.internet }
    case 'furniture':
      return { furniture: { ...f.furniture, present: f.furniture?.present ?? [] } }
    case 'diagnostics':
      return { diagnostics: f.diagnostics, constructionPeriod: f.constructionPeriod, permitBefore1997: f.permitBefore1997 }
    case 'rent':
      return { rent: { ...f.rent, chargesMode: f.rent?.chargesMode ?? 'PROVISION', depositCents: f.rent?.depositCents ?? (f.rent?.rentCents ? f.rent.rentCents * (f.furnished ? 2 : 1) : null), paymentDay: f.rent?.paymentDay ?? 5 } }
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

function StepType({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  return (
    <>
      <StepTitle>C’est…</StepTitle>
      <div className="grid-2" style={{ gap: 14 }}>
        <ChoiceCard column selected={f.habitat === 'COLLECTIVE'} onClick={() => set({ habitat: 'COLLECTIVE', legalRegime: f.legalRegime ?? 'COPRO' })} title="Un appartement" sub="Dans un immeuble" />
        <ChoiceCard column selected={f.habitat === 'INDIVIDUAL'} onClick={() => set({ habitat: 'INDIVIDUAL', legalRegime: f.legalRegime ?? 'MONO' })} title="Une maison" sub="Individuelle ou mitoyenne" />
      </div>
      <Chips big legend="Il sera loué" value={f.furnished ?? null} onChange={(v) => set({ furnished: v })} options={[{ value: false, label: 'Vide' }, { value: true, label: 'Meublé' }]} hint="Meublé : il faut au moins les 11 éléments de mobilier fixés par la loi." />
      <Chips legend={f.habitat === 'INDIVIDUAL' ? 'La maison fait partie d’une copropriété ?' : 'L’immeuble est'} value={f.legalRegime ?? null} onChange={(v) => set({ legalRegime: v })} options={[{ value: 'COPRO', label: f.habitat === 'INDIVIDUAL' ? 'Oui, copropriété' : 'En copropriété' }, { value: 'MONO', label: f.habitat === 'INDIVIDUAL' ? 'Non' : 'À un seul propriétaire' }]} hint="Copropriété : il y a un syndic et un règlement de copropriété." />
      <Chips legend="Usage" value={f.destination ?? 'HABITATION'} onChange={(v) => set({ destination: v })} options={[{ value: 'HABITATION', label: 'Habitation seulement' }, { value: 'MIXTE', label: 'Habitation et activité professionnelle' }]} />
      <Input label="Identifiant fiscal du logement" value={f.fiscalId ?? ''} onChange={(v) => set({ fiscalId: v })} placeholder="12 chiffres" hint="Mention obligatoire du bail depuis 2024. Vous le trouvez sur impots.gouv.fr, espace « Gérer mes biens immobiliers », ou sur l’avis de taxe foncière." />
      <Chips
        legend="La commune impose une autorisation avant de louer (« permis de louer ») ?"
        value={f.rentalPermit?.required ?? null}
        onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, required: v } })}
        options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]}
        hint="Certaines communes l’exigent pour les logements anciens. Renseignez-vous auprès de la mairie en cas de doute."
      />
      {f.rentalPermit?.required ? (
        <Fields>
          <Input label="Numéro de l’autorisation" value={f.rentalPermit.reference ?? ''} onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, reference: v } })} />
          <Input label="Date de l’autorisation" type="date" value={f.rentalPermit.date ?? ''} onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, date: v || null } })} />
        </Fields>
      ) : null}
    </>
  )
}

function StepCopro({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  return (
    <>
      <StepTitle>La copropriété</StepTitle>
      <StepNote>Ces informations sont sur le règlement de copropriété et sur les appels de charges du syndic.</StepNote>
      <Input big label="Syndic" value={f.copro?.syndic ?? ''} onChange={(v) => set({ copro: { ...f.copro, syndic: v } })} placeholder="Nom du syndic" hint="Il rejoint votre carnet." />
      <Fields>
        <Input label="Numéro de lot" value={f.lotNumber ?? ''} onChange={(v) => set({ lotNumber: v })} placeholder="12" />
        <Input label="Quote-part des parties communes" value={f.copro?.quotePart ?? ''} onChange={(v) => set({ copro: { ...f.copro, quotePart: v } })} placeholder="245 / 10 000es" hint="Les tantièmes du lot." />
      </Fields>
      <Check checked={Boolean(f.copro?.extractsProvided)} onChange={(v) => set({ copro: { ...f.copro, extractsProvided: v } })} label="J’ai les extraits du règlement de copropriété à remettre au locataire" sub="Destination de l’immeuble, usage des parties privatives et communes, quote-part des charges. Ils sont annexés au bail." />
    </>
  )
}

function StepSize({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const period = f.constructionPeriod
  const rooms = f.roomList ?? []
  const setRooms = (list: Array<{ name: string }>) => set({ roomList: list })
  return (
    <>
      <StepTitle>Construction et pièces</StepTitle>
      <Chips
        big
        legend="Période de construction"
        value={period ?? null}
        onChange={(v) => set({ constructionPeriod: v, permitBefore1997: v === 'BEFORE_1949' || v === '1949_1974' || v === '1975_1989' ? true : v === 'AFTER_2005' ? false : f.permitBefore1997 })}
        options={(Object.keys(CONSTRUCTION_LABEL) as Array<keyof typeof CONSTRUCTION_LABEL>).map((k) => ({ value: k, label: CONSTRUCTION_LABEL[k] }))}
        hint="Elle figure dans le bail et décide des diagnostics à fournir (plomb, amiante)."
      />
      {period === '1990_2005' ? <Chips legend="Permis de construire délivré avant le 1er juillet 1997 ?" value={f.permitBefore1997 ?? null} onChange={(v) => set({ permitBefore1997: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint="Il détermine si le repérage de l’amiante est exigé." /> : null}
      <NumberField big label="Surface habitable" suffix="m²" step="decimal" value={f.surface} onChange={(v) => set({ surface: v })} hint="Sans les balcons, caves, parkings ni les parties de moins de 1,80 m de hauteur. Elle figure obligatoirement dans le bail." />
      <Chips
        big
        legend="Pièces principales"
        value={f.rooms && f.rooms >= 5 ? 5 : (f.rooms ?? null)}
        onChange={(v) => set({ rooms: v, roomList: rooms.length ? rooms : defaultRooms({ ...f, rooms: v }) })}
        options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) })).concat([{ value: 5, label: '5 et plus' }])}
        hint="Séjour et chambres. La cuisine et la salle de bain ne comptent pas."
      />
      {f.rooms && f.rooms >= 5 ? <NumberField label="Nombre exact de pièces principales" value={f.rooms} onChange={(v) => set({ rooms: v ?? 5 })} /> : null}
      {f.rooms ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Composition du logement</span>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>Elle sert au bail et prépare l’état des lieux, pièce par pièce. Modifiez-la si besoin.</span>
          {rooms.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <Input label="" value={r.name} onChange={(v) => setRooms(rooms.map((x, j) => (j === i ? { ...x, name: v } : x)))} style={{ flex: '1 1 0' }} />
              <button type="button" onClick={() => setRooms(rooms.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: BAI.inkSoft, fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>
                Retirer
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setRooms([...rooms, { name: '' }])} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: BAI.owner, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
            + Ajouter une pièce
          </button>
        </div>
      ) : null}
    </>
  )
}

function StepHeating({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const boiler = f.heating?.mode === 'INDIVIDUAL' && ['GAS', 'FUEL', 'WOOD'].includes(String(f.heating?.energy))
  return (
    <>
      <StepTitle>Chauffage et eau chaude</StepTitle>
      <Chips big legend="Le chauffage est" value={f.heating?.mode ?? null} onChange={(v) => set({ heating: { ...f.heating, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuel' }, { value: 'COLLECTIVE', label: 'Collectif' }]} hint="Collectif : une chaudière pour tout l’immeuble." />
      <Chips
        big
        legend="Il fonctionne à"
        value={f.heating?.energy ?? null}
        onChange={(v) => set({ heating: { ...f.heating, energy: v } })}
        options={(Object.keys(ENERGY_LABEL) as Array<keyof typeof ENERGY_LABEL>).map((k) => ({ value: k, label: ENERGY_LABEL[k] }))}
      />
      <Input label="Appareil de chauffage" value={f.heating?.appliance ?? ''} onChange={(v) => set({ heating: { ...f.heating, appliance: v } })} placeholder="Chaudière gaz murale, radiateurs électriques…" />
      {f.heating?.mode === 'COLLECTIVE' ? <TextArea label="Comment la consommation de chauffage est-elle répartie ?" value={f.heating?.split ?? ''} onChange={(v) => set({ heating: { ...f.heating, split: v } })} placeholder="Selon les tantièmes de copropriété, ou selon des répartiteurs sur les radiateurs" hint="Le bail doit le préciser." /> : null}
      {boiler ? <Input label="Date du dernier entretien de la chaudière" type="date" value={f.heating?.lastMaintenance ?? ''} onChange={(v) => set({ heating: { ...f.heating, lastMaintenance: v || null } })} hint="L’entretien annuel est obligatoire. Bailio vous rappellera de demander l’attestation chaque année." /> : null}
      <Chips big legend="L’eau chaude est" value={f.hotWater?.mode ?? null} onChange={(v) => set({ hotWater: { ...f.hotWater, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuelle' }, { value: 'COLLECTIVE', label: 'Collective' }]} hint="Individuelle : un ballon ou une chaudière propre au logement." />
      {f.hotWater?.mode === 'COLLECTIVE' ? <TextArea label="Comment la consommation d’eau chaude est-elle répartie ?" value={f.hotWater?.split ?? ''} onChange={(v) => set({ hotWater: { ...f.hotWater, split: v } })} placeholder="Selon un compteur d’eau chaude individuel" hint="Le bail doit le préciser." /> : null}
    </>
  )
}

function StepAnnexes({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const annexes = new Set(f.annexes ?? [])
  const common = new Set(f.commonAreas ?? [])
  return (
    <>
      <StepTitle>Annexes et parties communes</StepTitle>
      <Group legend="Annexes à l’usage du locataire seul">
        {(Object.keys(ANNEXES) as AnnexKey[]).map((k) => (
          <ChipButton key={k} big pressed={annexes.has(k)} onClick={() => set({ annexes: toggle(annexes, k) })}>
            {ANNEXES[k]}
          </ChipButton>
        ))}
      </Group>
      {annexes.has('garage') || annexes.has('parking') || annexes.has('cellar') ? <Input label="Numéro de garage, de place ou de cave" value={f.garageNumber ?? ''} onChange={(v) => set({ garageNumber: v })} /> : null}
      {annexes.has('garden') ? <NumberField label="Superficie du jardin" suffix="m²" value={f.gardenArea} onChange={(v) => set({ gardenArea: v })} hint="Son entretien courant revient au locataire." /> : null}
      {f.habitat === 'COLLECTIVE' ? (
        <Group legend="Dans l’immeuble, à l’usage de tous">
          {(Object.keys(COMMON_AREAS) as CommonKey[]).map((k) => (
            <ChipButton key={k} big pressed={common.has(k)} onClick={() => set({ commonAreas: toggle(common, k) })}>
              {COMMON_AREAS[k]}
            </ChipButton>
          ))}
        </Group>
      ) : null}
      <StepNote>Rien ne s’applique ? Continuez : le bail indiquera « néant ».</StepNote>
    </>
  )
}

const toggle = <T extends string>(s: Set<T>, v: T) => {
  const n = new Set(s)
  if (n.has(v)) n.delete(v)
  else n.add(v)
  return [...n]
}

function StepEquipments({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const eq = new Set(f.equipments ?? [])
  return (
    <>
      <StepTitle>Les équipements</StepTitle>
      <Group legend="Équipements du logement">
        {(Object.keys(EQUIPMENTS) as EquipmentKey[]).map((k) => (
          <ChipButton key={k} big pressed={eq.has(k)} onClick={() => set({ equipments: toggle(eq, k) })}>
            {EQUIPMENTS[k]}
          </ChipButton>
        ))}
      </Group>
      <Input label="Autres équipements" value={f.otherEquipments ?? ''} onChange={(v) => set({ otherEquipments: v })} placeholder="Climatisation, sèche-serviettes, cheminée…" />
      <div className="col-md" style={{ display: 'flex', gap: 16 }}>
        <NumberField label="Détecteurs de fumée" value={f.smokeDetectors} onChange={(v) => set({ smokeDetectors: v, ...(v && v > 0 && !eq.has('smokeDetector') ? { equipments: [...eq, 'smokeDetector'] } : {}) })} hint="Au moins un est obligatoire." />
        <Input label="Clés et badges remis" value={f.keys ?? ''} onChange={(v) => set({ keys: v })} placeholder="2 clés, 1 badge" />
      </div>
      <Chips
        legend="Télévision"
        value={f.tv ?? null}
        onChange={(v) => set({ tv: v })}
        options={[
          { value: 'INDIVIDUAL', label: 'Antenne individuelle' },
          { value: 'COLLECTIVE', label: 'Antenne collective' },
          { value: 'CABLE', label: 'Câble' },
          { value: 'SATELLITE', label: 'Satellite' },
          { value: 'NONE', label: 'Aucune' },
        ]}
      />
      <Chips
        legend="Internet"
        value={f.internet ?? null}
        onChange={(v) => set({ internet: v })}
        options={[
          { value: 'FIBER', label: 'Fibre raccordée' },
          { value: 'ADSL', label: 'ADSL (ligne téléphonique)' },
          { value: 'NONE', label: 'Aucun raccordement' },
        ]}
      />
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
  const rules = diagnostics.filter((r) => r.required && r.key !== 'dpe')
  type DiagKey = 'erp' | 'electricity' | 'gas' | 'lead' | 'asbestos' | 'noise'
  const setDiag = (key: DiagKey, patch: Record<string, unknown>) => set({ diagnostics: { ...d, [key]: { ...(d[key] ?? {}), ...patch } } })
  return (
    <>
      <StepTitle>Les diagnostics</StepTitle>
      <StepNote>Ils sont annexés au bail. Les informations du DPE y sont recopiées.</StepNote>
      <Chips big legend="Classe énergie (DPE)" value={d.dpe?.class ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, class: v } } })} options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((c) => ({ value: c, label: c }))} hint="Sur le diagnostic de performance énergétique (DPE)." />
      {d.dpe?.class === 'G' ? <Callout tone="warn">Depuis le 1er janvier 2025, un logement classé G ne peut plus être proposé à la location (décence énergétique).</Callout> : d.dpe?.class === 'F' ? <Callout tone="warn">Classé F : le loyer ne peut pas être augmenté, et le logement ne pourra plus être loué à partir de 2028.</Callout> : null}
      <Chips legend="Classe climat (gaz à effet de serre)" value={d.dpe?.ges ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, ges: v } } })} options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((c) => ({ value: c, label: c }))} />
      <Fields>
        <Input label="Date du DPE" type="date" value={d.dpe?.date ?? ''} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, date: v || null } } })} hint="Valable 10 ans." />
        <Input label="Numéro du DPE" value={d.dpe?.number ?? ''} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, number: v } } })} placeholder="13 caractères" />
      </Fields>
      <span style={{ fontSize: 15, fontWeight: 600 }}>Dépenses d’énergie estimées par le DPE</span>
      <span style={{ fontSize: 13, color: BAI.inkSoft, marginTop: -8 }}>Mention obligatoire du bail. Sur le DPE : « Estimation des coûts annuels d’énergie du logement ».</span>
      <div className="col-md" style={{ display: 'flex', gap: 12 }}>
        <NumberField label="Entre (€ par an)" value={d.dpe?.costMin ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costMin: v } } })} />
        <NumberField label="Et (€ par an)" value={d.dpe?.costMax ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costMax: v } } })} />
        <NumberField label="Prix de l’année" value={d.dpe?.costYear ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costYear: v } } })} />
      </div>
      <Chips legend="L’installation électrique a plus de 15 ans ?" value={d.electricity?.installOver15 ?? null} onChange={(v) => setDiag('electricity', { installOver15: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint="Si oui, un diagnostic électricité de moins de 6 ans est obligatoire." />
      <Chips legend="Le logement a une installation de gaz ?" value={d.gas?.hasGas ?? (f.heating?.energy === 'GAS' ? true : null)} onChange={(v) => setDiag('gas', { hasGas: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
      {d.gas?.hasGas ?? f.heating?.energy === 'GAS' ? <Chips legend="L’installation de gaz a plus de 15 ans ?" value={d.gas?.installOver15 ?? null} onChange={(v) => setDiag('gas', { installOver15: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} /> : null}
      <Chips legend="Le logement est dans une zone de bruit d’aéroport ?" value={d.noise?.inZone ?? null} onChange={(v) => setDiag('noise', { inZone: v })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]} hint="Indiqué sur l’état des risques (Géorisques)." />
      {rules.length ? (
        <>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Diagnostics à joindre à ce bail</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rules.map((r) => (
              <div key={r.key} style={{ background: BAI.surface, border: `1px solid ${BAI.border}`, borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{r.label}</span>
                    <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                      {r.reason} · valable {r.validity}
                    </span>
                  </span>
                  {r.key === 'erp' ? (
                    <a href="https://errial.georisques.gouv.fr/" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      Le faire en ligne, gratuitement
                    </a>
                  ) : propertyId ? (
                    <button type="button" onClick={() => setUpload(r.key)} style={{ background: 'none', border: 'none', color: BAI.owner, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }}>
                      Ajouter le PDF
                    </button>
                  ) : null}
                </span>
                <Input label="Date du diagnostic" type="date" value={d[r.key as DiagKey]?.date ?? ''} onChange={(v) => setDiag(r.key as DiagKey, { date: v || null })} />
              </div>
            ))}
          </div>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pas encore fait ? Continuez : Bailio vous le rappellera avant la signature du bail.</span>
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
            <AuthImage key={p} id={p} alt="Photo du logement" size={96} onRemove={() => set({ photos: photos.filter((x) => x !== p) })} />
          ))}
        </div>
      ) : null}
      {photos.length ? <Pill tone="green">{photos.length} photo{photos.length > 1 ? 's' : ''}</Pill> : null}
    </>
  )
}

function StepRent({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const r = f.rent ?? {}
  const sr = (patch: NonNullable<PropertyFile['rent']>) => set({ rent: { ...r, ...patch } })
  const max = r.rentCents ? r.rentCents * (f.furnished ? 2 : 1) : null
  return (
    <>
      <StepTitle>Quel loyer demandez-vous ?</StepTitle>
      <Fields>
        <Money big label="Loyer hors charges, par mois" cents={r.rentCents ?? null} onChange={(c) => sr({ rentCents: c })} />
        <Money big label="Charges, par mois" cents={r.chargesCents ?? null} onChange={(c) => sr({ chargesCents: c })} hint="0 s’il n’y en a pas." />
      </Fields>
      <Chips
        legend="Les charges sont"
        value={r.chargesMode ?? 'PROVISION'}
        onChange={(v) => sr({ chargesMode: v })}
        options={[
          { value: 'PROVISION', label: 'Une provision, régularisée chaque année' },
          { value: 'FORFAIT', label: 'Un forfait' },
        ]}
        hint={f.furnished ? 'Provision : le locataire paie une avance, comparée chaque année aux dépenses réelles. Forfait : un montant fixe, sans régularisation.' : 'En location vide, le forfait n’est permis qu’en colocation.'}
      />
      <Fields>
        <Money label="Dépôt de garantie" cents={r.depositCents ?? max} onChange={(c) => sr({ depositCents: c })} hint={max ? `Au plus ${f.furnished ? 'deux mois' : 'un mois'} de loyer hors charges.` : 'Au plus un mois de loyer hors charges en vide, deux en meublé.'} />
        <NumberField label="Jour de paiement du loyer" value={r.paymentDay ?? 5} onChange={(v) => sr({ paymentDay: v ? Math.min(28, Math.max(1, Math.round(v))) : null })} />
      </Fields>
      <StepNote>Ce loyer sera repris dans l’annonce et dans le bail. Vous pourrez toujours le changer : il sera mis à jour partout.</StepNote>
    </>
  )
}
