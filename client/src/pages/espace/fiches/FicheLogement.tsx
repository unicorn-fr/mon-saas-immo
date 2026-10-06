import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { BAI } from '../../../constants/bailio-tokens'
import { FicheLayout, FicheSection, Fields } from '../../../components/FlowLayout'
import { UploadModal } from '../../../components/UploadModal'
import { AuthImage, uploadPhotos } from '../../../components/media'
import { Btn, Callout, Check, Chips, Computed, Input, LoadError, Loader, Money, MultiChips, NumberField, Pill, Select, TextArea, TextLink, useToast } from '../../../components/kit'
import { Spinner } from '../../../components/ui'
import { api } from '../../../lib/api'
import { ANNEXES, COMMON_AREAS, CONSTRUCTION_LABEL, EQUIPMENTS, ENERGY_LABEL, FURNITURE_REQUIRED, PARKING_TYPES, isParking, type DiagnosticRule, type FurnitureKey, type PropertyFile } from '../../../lib/contract'
import { useFiche } from '../../../lib/fiche'
import { dateNum } from '../../../lib/format'
import type { PropertyView } from '../../../lib/space'
import { diagnosticStatus } from '../Logement'

const opts = <T extends string>(o: Record<T, string>) => (Object.keys(o) as T[]).map((k) => ({ value: k, label: o[k] }))

/** Fiche complète du logement. Maquette « Fiche du logement ». */
export default function FicheLogement() {
  const { id = '' } = useParams()
  const [view, setView] = useState<PropertyView | null>(null)
  const [diags, setDiags] = useState<DiagnosticRule[]>([])
  const [upload, setUpload] = useState<string | null>(null)
  const toast = useToast()
  const { file: f, set, completion, save, saveNow, loadError, reload } = useFiche<PropertyFile>(
    () =>
      api<PropertyView>(`/properties/${id}`).then((v) => {
        setView(v)
        setDiags(v.diagnostics)
        return { file: v.file, completion: v.completion }
      }),
    async (file) => {
      const r = await api<{ completion: PropertyView['completion']; diagnostics: DiagnosticRule[] }>(`/properties/${id}`, { method: 'PUT', body: file })
      setDiags(r.diagnostics)
      return r
    },
    [id],
  )
  if (loadError) return <div style={{ padding: 24 }}><LoadError message={loadError} retry={reload} /></div>
  if (!f || !completion || !view) return <Loader />
  const done = (k: string) => completion.steps.find((s) => s.key === k)?.done
  const d = f.diagnostics ?? {}
  const collective = f.habitat === 'COLLECTIVE'
  let n = 0

  // Garage, box ou place loué seul : seulement ce que le contrat demande.
  if (isParking(f)) {
    const k = f.parking ?? {}
    const sk = (patch: NonNullable<PropertyFile['parking']>) => set({ parking: { ...k, ...patch } })
    return (
      <FicheLayout backTo={`/espace/logements/${id}`} title="Fiche du garage" subtitle={[view.name, f.city].filter(Boolean).join(', ')} completion={completion} save={save} onSave={saveNow}>
        <FicheSection id="address" n={++n} title="Adresse" done={done('address')}>
          <Input label="Adresse" value={f.address} onChange={(v) => set({ address: v })} />
          <Fields>
            <Input label="Code postal" value={f.postalCode} inputMode="numeric" maxLength={5} onChange={(v) => set({ postalCode: v })} />
            <Input label="Ville" value={f.city} onChange={(v) => set({ city: v })} />
          </Fields>
          <Input label="Nom pour le reconnaître" value={f.label} onChange={(v) => set({ label: v })} placeholder="Box rue Foch" />
        </FicheSection>
        <FicheSection id="parking" n={++n} title="L’emplacement" intro="Repris dans le contrat et l’annonce." done={done('parking')}>
          <Chips legend="Type d’emplacement" value={k.type ?? null} onChange={(v) => sk({ type: v })} options={(Object.keys(PARKING_TYPES) as Array<keyof typeof PARKING_TYPES>).map((v) => ({ value: v, label: PARKING_TYPES[v] }))} />
          {k.type === 'PLACE' ? <Chips legend="La place est" value={k.covered ?? null} onChange={(v) => sk({ covered: v })} options={[{ value: true, label: 'Couverte' }, { value: false, label: 'En extérieur' }]} /> : null}
          <Fields>
            <Input label="Numéro (facultatif)" value={k.number} onChange={(v) => sk({ number: v })} />
            <Input label="Niveau (facultatif)" value={k.level} onChange={(v) => sk({ level: v })} />
          </Fields>
          <Fields>
            <NumberField label="Surface en m² (facultatif)" step="decimal" value={f.surface ?? null} onChange={(v) => set({ surface: v })} />
            <Input label="Numéro de lot de copropriété (facultatif)" value={f.lotNumber} onChange={(v) => set({ lotNumber: v })} />
          </Fields>
          <Input label="Accès (facultatif)" value={k.access} onChange={(v) => sk({ access: v })} placeholder="Portail à badge, accès 24 h sur 24" />
          <Input label="Clés, badges ou télécommandes remis (facultatif)" value={f.keys} onChange={(v) => set({ keys: v })} placeholder="1 télécommande et 1 clé" />
        </FicheSection>
        <FicheSection id="rent" n={++n} title="Loyer" intro="Saisi une seule fois : il est repris dans l’annonce et dans le contrat.">
          <Fields>
            <Money label="Loyer hors charges, par mois" cents={f.rent?.rentCents ?? null} onChange={(c) => set({ rent: { ...f.rent, rentCents: c } })} />
            <Money label="Charges, par mois" cents={f.rent?.chargesCents ?? null} onChange={(c) => set({ rent: { ...f.rent, chargesCents: c } })} />
          </Fields>
          <Chips legend="Les charges sont" value={f.rent?.chargesMode === 'FORFAIT' ? 'FORFAIT' : 'PROVISION'} onChange={(v) => set({ rent: { ...f.rent, chargesMode: v } })} options={[{ value: 'PROVISION', label: 'Une provision, régularisée chaque année' }, { value: 'FORFAIT', label: 'Un forfait' }]} />
          <Fields>
            <Money label="Dépôt de garantie" cents={f.rent?.depositCents ?? null} onChange={(c) => set({ rent: { ...f.rent, depositCents: c } })} hint="Libre : un mois de loyer est l’usage, deux au plus." />
            <NumberField label="Jour de paiement du loyer" value={f.rent?.paymentDay ?? 5} onChange={(v) => set({ rent: { ...f.rent, paymentDay: v ? Math.min(28, Math.max(1, Math.round(v))) : null } })} />
          </Fields>
        </FicheSection>
        <FicheSection id="photos" n={++n} title="Photos" done={done('photos')}>
          <Photos f={f} set={set} onError={toast.error} />
        </FicheSection>
      </FicheLayout>
    )
  }

  return (
    <FicheLayout backTo={`/espace/logements/${id}`} title="Fiche du logement" subtitle={[view.name, f.city].filter(Boolean).join(', ')} completion={completion} save={save} onSave={saveNow}>
      <FicheSection id="address" guides={['bail']} n={++n} title="Adresse et localisation" reference="Contrat type, décret n° 2015-587 du 29 mai 2015, rubrique II.A" done={done('address')}>
        <Input label="Adresse" value={f.address} onChange={(v) => set({ address: v })} />
        <Fields>
          <Input label="Code postal" value={f.postalCode} inputMode="numeric" maxLength={5} onChange={(v) => set({ postalCode: v })} />
          <Input label="Ville" value={f.city} onChange={(v) => set({ city: v })} />
        </Fields>
        <Fields>
          <Input label="Bâtiment" value={f.building} onChange={(v) => set({ building: v })} />
          <Input label="Escalier, étage, porte" value={f.floorDoor} onChange={(v) => set({ floorDoor: v })} />
        </Fields>
        <Fields>
          <Input label="Nom pour le reconnaître" value={f.label} onChange={(v) => set({ label: v })} placeholder="Studio rue Foch" />
          <Input label="Identifiant fiscal du logement" value={f.fiscalId} onChange={(v) => set({ fiscalId: v })} hint="Obligatoire dans le bail. Sur impots.gouv.fr (« Gérer mes biens immobiliers ») ou sur l’avis de taxe foncière." />
        </Fields>
        <Chips legend="Votre commune exige-t-elle un « permis de louer » ?" value={f.rentalPermit?.required ?? null} onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, required: v } })} options={[{ value: false, label: 'Non' }, { value: true, label: 'Oui' }]} hint="Certaines communes imposent une autorisation avant de louer. En cas de doute, demandez à votre mairie." />
        {f.rentalPermit?.required ? (
          <Fields>
            <Input label="Numéro de l’autorisation" value={f.rentalPermit.reference} onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, reference: v } })} />
            <Input label="Date de l’autorisation" type="date" value={f.rentalPermit.date} onChange={(v) => set({ rentalPermit: { ...f.rentalPermit, date: v || null } })} />
          </Fields>
        ) : null}
      </FicheSection>

      <FicheSection id="type" guides={['meuble']} n={++n} title="Type et régime" intro="Ces mentions sont obligatoires dans le bail." reference="Contrat type, rubriques II.A et II.B" done={done('type')}>
        <Chips legend="Type d’habitat" value={f.habitat ?? null} onChange={(v) => set({ habitat: v })} options={[{ value: 'COLLECTIVE', label: 'Immeuble collectif' }, { value: 'INDIVIDUAL', label: 'Maison individuelle' }]} />
        <Chips legend="Régime juridique de l’immeuble" value={f.legalRegime ?? null} onChange={(v) => set({ legalRegime: v })} options={[{ value: 'MONO', label: 'Monopropriété' }, { value: 'COPRO', label: 'Copropriété' }]} />
        <Chips legend="Le logement est loué" value={f.furnished ?? null} onChange={(v) => set({ furnished: v })} options={[{ value: false, label: 'Vide' }, { value: true, label: 'Meublé' }]} />
        <Chips legend="Destination" value={f.destination ?? null} onChange={(v) => set({ destination: v })} options={[{ value: 'HABITATION', label: 'Habitation uniquement' }, { value: 'MIXTE', label: 'Habitation et usage professionnel' }]} />
      </FicheSection>

      {f.legalRegime === 'COPRO' ? (
        <FicheSection id="copro" n={++n} title="Copropriété" reference="loi n° 89-462 du 6 juillet 1989, art. 3" done={done('copro')}>
          <Fields>
            <Input label="Syndic" value={f.copro?.syndic} onChange={(v) => set({ copro: { ...f.copro, syndic: v } })} />
            <Input label="Quote-part de charges" value={f.copro?.quotePart} onChange={(v) => set({ copro: { ...f.copro, quotePart: v } })} placeholder="245 / 10 000es" />
          </Fields>
          <Input label="Numéro de lot" value={f.lotNumber} onChange={(v) => set({ lotNumber: v })} />
          <Check checked={Boolean(f.copro?.extractsProvided)} onChange={(v) => set({ copro: { ...f.copro, extractsProvided: v } })} label="Extraits du règlement de copropriété prêts" sub="Destination de l’immeuble, jouissance des parties privatives et communes, quote-part des charges. Ils sont annexés au bail." />
        </FicheSection>
      ) : null}

      <FicheSection id="size" guides={['decence']} n={++n} title="Construction et surface" intro="La période de construction détermine les diagnostics obligatoires." reference="loi n° 89-462 du 6 juillet 1989, art. 3-1" done={done('size')}>
        <Chips legend="Période de construction" value={f.constructionPeriod ?? null} onChange={(v) => set({ constructionPeriod: v, permitBefore1997: v === 'AFTER_2005' ? false : v === '1990_2005' ? f.permitBefore1997 : true })} options={opts(CONSTRUCTION_LABEL)} />
        {f.constructionPeriod === '1990_2005' ? <Chips legend="Permis de construire délivré avant le 1er juillet 1997 ?" value={f.permitBefore1997 ?? null} onChange={(v) => set({ permitBefore1997: v })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} /> : null}
        <Fields>
          <NumberField label="Surface habitable" suffix="m²" step="decimal" value={f.surface} onChange={(v) => set({ surface: v })} hint="Loi Boutin : sans murs, cloisons, escaliers, ni parties de moins de 1,80 m de hauteur." />
          <NumberField label="Nombre de pièces principales" value={f.rooms} onChange={(v) => set({ rooms: v })} hint="Séjour et chambres, sans cuisine ni salle d’eau." />
        </Fields>
        <Callout tone="tip">Une surface habitable surévaluée de plus de 5 % permet au locataire de demander une baisse de loyer.</Callout>
      </FicheSection>

      <FicheSection id="rooms" n={++n} title="Les pièces du logement" intro="Cette liste sert de base à l’état des lieux, pièce par pièce." done={done('rooms')}>
        <RoomList f={f} set={set} />
      </FicheSection>

      <FicheSection id="heating" n={++n} title="Chauffage et eau chaude" reference="Contrat type, rubrique II.A" done={done('heating')}>
        <Chips legend="Chauffage" value={f.heating?.mode ?? null} onChange={(v) => set({ heating: { ...f.heating, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuel' }, { value: 'COLLECTIVE', label: 'Collectif' }]} />
        <Chips legend="Énergie" value={f.heating?.energy ?? null} onChange={(v) => set({ heating: { ...f.heating, energy: v } })} options={opts(ENERGY_LABEL)} />
        <Chips legend="Eau chaude sanitaire" value={f.hotWater?.mode ?? null} onChange={(v) => set({ hotWater: { ...f.hotWater, mode: v } })} options={[{ value: 'INDIVIDUAL', label: 'Individuelle' }, { value: 'COLLECTIVE', label: 'Collective' }]} />
        <Fields>
          <Input label="Appareil" value={f.heating?.appliance} onChange={(v) => set({ heating: { ...f.heating, appliance: v } })} placeholder="Chaudière gaz murale" />
          <Input label="Dernier entretien" type="date" value={f.heating?.lastMaintenance} onChange={(v) => set({ heating: { ...f.heating, lastMaintenance: v || null } })} hint="L’entretien annuel est à la charge du locataire." />
        </Fields>
        {f.heating?.mode === 'COLLECTIVE' ? <TextArea label="Répartition de la consommation de chauffage" value={f.heating?.split} onChange={(v) => set({ heating: { ...f.heating, split: v } })} placeholder="Selon les tantièmes de copropriété" /> : null}
        {f.hotWater?.mode === 'COLLECTIVE' ? <TextArea label="Répartition de la consommation d’eau chaude" value={f.hotWater?.split} onChange={(v) => set({ hotWater: { ...f.hotWater, split: v } })} /> : null}
        {f.heating?.mode === 'COLLECTIVE' || f.hotWater?.mode === 'COLLECTIVE' ? <Callout tone="tip">Avec un chauffage ou une eau chaude collectifs, le bail doit préciser comment la consommation est répartie.</Callout> : null}
      </FicheSection>

      <FicheSection id="equipments" guides={['decence']} n={++n} title="Équipements du logement" intro="Listés dans le bail et vérifiés à l’état des lieux." reference="Contrat type, rubrique II.A" done={done('equipments')}>
        <MultiChips options={opts(EQUIPMENTS)} value={f.equipments} onChange={(v) => set({ equipments: v })} />
        <Input label="Autres équipements" value={f.otherEquipments} onChange={(v) => set({ otherEquipments: v })} />
        <Fields>
          <NumberField label="Détecteurs de fumée installés" value={f.smokeDetectors} onChange={(v) => set({ smokeDetectors: v, ...(v && v > 0 && !f.equipments?.includes('smokeDetector') ? { equipments: [...(f.equipments ?? []), 'smokeDetector'] } : {}) })} hint="Au moins un par logement, normalisé (marquage CE). Le nombre figure dans le bail." />
          <Input label="Clés et moyens d’accès remis" value={f.keys} onChange={(v) => set({ keys: v })} placeholder="2 clés, 1 badge, 1 télécommande" hint="Repris dans le bail et dans l’état des lieux." />
        </Fields>
        {!f.smokeDetectors && !f.equipments?.includes('smokeDetector') ? <Callout tone="warn">Un détecteur de fumée est obligatoire dans tout logement.</Callout> : null}
      </FicheSection>

      <FicheSection id="annexes" n={++n} title="Annexes privatives" reference="Contrat type, rubrique II.C" done={done('annexes')}>
        <MultiChips options={opts(ANNEXES)} value={f.annexes} onChange={(v) => set({ annexes: v })} hint="Aucune ? Laissez vide et continuez : c’est noté." />
        {f.annexes === null || f.annexes === undefined ? (
          <div>
            <Btn size="sm" variant="outline" onClick={() => set({ annexes: [] })}>
              Aucune annexe
            </Btn>
          </div>
        ) : null}
        {f.annexes?.some((a) => a === 'garage' || a === 'parking') || f.annexes?.includes('garden') ? (
          <Fields>
            {f.annexes?.some((a) => a === 'garage' || a === 'parking') ? <Input label="Numéro de garage ou de place" value={f.garageNumber} onChange={(v) => set({ garageNumber: v })} /> : null}
            {f.annexes?.includes('garden') ? <NumberField label="Superficie du jardin" suffix="m²" value={f.gardenArea} onChange={(v) => set({ gardenArea: v })} /> : null}
          </Fields>
        ) : null}
      </FicheSection>

      {collective ? (
        <FicheSection id="common" n={++n} title="Parties communes" reference="Contrat type, rubrique II.D" done={done('common')}>
          <MultiChips options={opts(COMMON_AREAS)} value={f.commonAreas} onChange={(v) => set({ commonAreas: v })} />
          {f.commonAreas === null || f.commonAreas === undefined ? (
            <div>
              <Btn size="sm" variant="outline" onClick={() => set({ commonAreas: [] })}>
                Aucune
              </Btn>
            </div>
          ) : null}
        </FicheSection>
      ) : null}

      <FicheSection id="tv" n={++n} title="Télévision et internet" reference="Contrat type, rubrique II.E" done={done('tv')}>
        <Chips legend="Réception de la télévision" value={f.tv ?? null} onChange={(v) => set({ tv: v })} options={[{ value: 'INDIVIDUAL', label: 'Antenne individuelle' }, { value: 'COLLECTIVE', label: 'Antenne collective' }, { value: 'CABLE', label: 'Câble' }, { value: 'SATELLITE', label: 'Satellite' }, { value: 'NONE', label: 'Aucune' }]} />
        <Chips legend="Accès à internet" value={f.internet ?? null} onChange={(v) => set({ internet: v })} options={[{ value: 'FIBER', label: 'Fibre' }, { value: 'ADSL', label: 'ADSL' }, { value: 'NONE', label: 'Aucun raccordement' }]} />
      </FicheSection>

      <FicheSection id="diagnostics" guides={['diagnostics', 'dpe']} n={++n} title="Diagnostics" intro="Ils forment le dossier de diagnostic technique, annexé au bail." reference="loi n° 89-462 du 6 juillet 1989, art. 3-3" done={done('diagnostics')}>
        <Fields>
          <Select label="Classe énergie (DPE)" value={d.dpe?.class ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, class: v || null } } })} options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((c) => ({ value: c, label: c }))} />
          <Select label="Classe climat (GES)" value={d.dpe?.ges ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, ges: v || null } } })} options={(['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const).map((c) => ({ value: c, label: c }))} />
        </Fields>
        <Fields>
          <Input label="Date du DPE" type="date" value={d.dpe?.date} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, date: v || null } } })} />
          <Input label="Numéro ADEME du DPE" value={d.dpe?.number} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, number: v } } })} />
        </Fields>
        <Fields>
          <NumberField label="Dépenses d’énergie estimées, minimum (€ par an)" value={d.dpe?.costMin ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costMin: v } } })} />
          <NumberField label="Maximum (€ par an)" value={d.dpe?.costMax ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costMax: v } } })} hint="Fourchette indiquée sur le DPE. Obligatoire dans l’annonce." />
          <NumberField label="Année des prix" value={d.dpe?.costYear ?? null} onChange={(v) => set({ diagnostics: { ...d, dpe: { ...d.dpe, costYear: v } } })} />
        </Fields>
        <Fields>
          <Chips legend="Installation de gaz" value={d.gas?.hasGas ?? null} onChange={(v) => set({ diagnostics: { ...d, gas: { ...d.gas, hasGas: v } } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
          <Chips legend="Installation électrique de plus de 15 ans" value={d.electricity?.installOver15 ?? null} onChange={(v) => set({ diagnostics: { ...d, electricity: { ...d.electricity, installOver15: v } } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
        </Fields>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {diags.map((r) => {
            const st = diagnosticStatus(r, f)
            const key = r.key as keyof NonNullable<PropertyFile['diagnostics']>
            const cur = (d[key] ?? {}) as { date?: string | null }
            return (
              <div key={r.key} className="col-md" style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${BAI.dividerSoft}` }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{r.label}</span>
                  <span style={{ fontSize: 13, color: BAI.inkSoft }}>
                    {r.required ? `Exigé · ${r.validity}` : r.reason}
                  </span>
                </div>
                {r.required && r.key !== 'dpe' ? (
                  <div style={{ width: 170 }}>
                    <Input label="Date" type="date" value={cur.date} onChange={(v) => set({ diagnostics: { ...d, [key]: { ...cur, date: v || null } } })} />
                  </div>
                ) : null}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Pill tone={st.tone === 'ok' ? 'green' : st.tone === 'error' ? 'error' : 'muted'}>{st.label}</Pill>
                  {r.required ? (
                    r.key === 'erp' ? (
                      <a href="https://errial.georisques.gouv.fr/" target="_blank" rel="noreferrer" style={{ fontSize: 14, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Le faire en ligne
                      </a>
                    ) : (
                      <TextLink style={{ fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setUpload(r.key)}>
                        Joindre
                      </TextLink>
                    )
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        {d.dpe?.class === 'G' || d.dpe?.class === 'F' ? <Callout tone="warn">Classe G : le logement ne peut plus être loué depuis 2025. Classe F ou G : le loyer ne peut plus être augmenté, ni en cours de bail, ni au changement de locataire.</Callout> : null}
      </FicheSection>

      <FicheSection id="rent" n={++n} title="Loyer" intro="Saisi une seule fois : il est repris dans l’annonce et dans le bail, et mis à jour partout si vous le changez." reference="loi n° 89-462 du 6 juillet 1989, art. 22 (dépôt de garantie)">
        <Fields>
          <Money label="Loyer hors charges, par mois" cents={f.rent?.rentCents ?? null} onChange={(c) => set({ rent: { ...f.rent, rentCents: c } })} />
          <Money label="Charges, par mois" cents={f.rent?.chargesCents ?? null} onChange={(c) => set({ rent: { ...f.rent, chargesCents: c } })} />
        </Fields>
        <Chips legend="Les charges sont" value={f.rent?.chargesMode === 'FORFAIT' ? 'FORFAIT' : 'PROVISION'} onChange={(v) => set({ rent: { ...f.rent, chargesMode: v } })} options={[{ value: 'PROVISION', label: 'Une provision, régularisée chaque année' }, { value: 'FORFAIT', label: 'Un forfait' }]} />
        <Fields>
          <Money label="Dépôt de garantie" cents={f.rent?.depositCents ?? null} onChange={(c) => set({ rent: { ...f.rent, depositCents: c } })} hint={`Au plus ${f.furnished ? 'deux mois' : 'un mois'} de loyer hors charges.`} />
          <NumberField label="Jour de paiement du loyer" value={f.rent?.paymentDay ?? 5} onChange={(v) => set({ rent: { ...f.rent, paymentDay: v ? Math.min(28, Math.max(1, Math.round(v))) : null } })} />
        </Fields>
      </FicheSection>

      <FicheSection id="market" guides={['encadrement', 'zonesTendues']} n={++n} title="Loyer de marché et encadrement" reference="loi n° 89-462 du 6 juillet 1989, art. 17 et 18" done={done('market')}>
        <Chips legend="La commune est en zone tendue" value={f.market?.tense ?? null} onChange={(v) => set({ market: { ...f.market, tense: v } })} options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} hint={<>Liste officielle : <a href="https://www.service-public.gouv.fr/simulateur/calcul/zones-tendues" target="_blank" rel="noreferrer">vérifier ma commune</a>.</>} />
        {view.rentControlLikely ? (
          <Fields>
            <MoneyM2 label="Loyer de référence" cents={f.market?.refRentCentsM2} onChange={(c) => set({ market: { ...f.market, refRentCentsM2: c } })} />
            <MoneyM2 label="Loyer de référence majoré" cents={f.market?.refRentMaxCentsM2} onChange={(c) => set({ market: { ...f.market, refRentMaxCentsM2: c } })} />
          </Fields>
        ) : null}
        <Computed
          rows={[
            ['Zone tendue', f.market?.tense === true ? 'Oui' : f.market?.tense === false ? 'Non' : 'À indiquer'],
            ['Liste officielle des zones tendues', view.tenseOfficial === true ? 'Commune en zone tendue' : view.tenseOfficial === false ? 'Commune hors zone tendue' : 'Adresse à choisir dans la liste pour vérifier'],
            ['Encadrement des loyers', view.rentControl === 'full' ? 'Commune concernée' : view.rentControl === 'partial' ? 'Certains quartiers seulement : vérifiez sur le simulateur de la métropole' : 'Non concerné'],
            ['Loyer au changement de locataire', f.market?.tense ? 'Limité au dernier loyer (sauf exceptions)' : 'Libre'],
          ]}
        />
        {view.rentControlLikely ? <Callout tone="tip">Le loyer de référence et le loyer de référence majoré se trouvent sur le site de la préfecture ou de la métropole. Le loyer du bail ne peut pas dépasser le loyer de référence majoré, sauf complément de loyer justifié.</Callout> : null}
      </FicheSection>

      {f.furnished ? (
        <FicheSection id="furniture" guides={['meubleRegles']} n={++n} title="Le mobilier" intro="Les 11 éléments exigés par la loi, puis l’inventaire détaillé qui sera annexé au bail." reference="Décret n° 2015-981 du 31 juillet 2015" done={done('furniture')}>
          <div className="grid-2" style={{ gap: 10 }}>
            {(Object.keys(FURNITURE_REQUIRED) as FurnitureKey[]).map((k) => (
              <Check
                key={k}
                checked={Boolean(f.furniture?.present?.includes(k))}
                label={FURNITURE_REQUIRED[k]}
                onChange={(v) => {
                  const s = new Set(f.furniture?.present ?? [])
                  if (v) s.add(k)
                  else s.delete(k)
                  set({ furniture: { ...f.furniture, present: (Object.keys(FURNITURE_REQUIRED) as FurnitureKey[]).filter((x) => s.has(x)) } })
                }}
              />
            ))}
          </div>
          <FurnitureInventory f={f} set={set} />
        </FicheSection>
      ) : null}

      <FicheSection id="photos" n={++n} title="Photos" done={done('photos')}>
        <Photos f={f} set={set} onError={toast.error} />
      </FicheSection>
      <UploadModal open={upload !== null} onClose={() => setUpload(null)} onSaved={() => toast.show('Diagnostic joint.')} propertyId={id} kind="DIAGNOSTIC" diagnostic={upload ?? undefined} />
      {view.documents.some((x) => x.kind === 'DIAGNOSTIC') ? (
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Diagnostics joints : {view.documents.filter((x) => x.kind === 'DIAGNOSTIC').map((x) => `${x.title} (${dateNum(x.createdAt)})`).join(', ')}.</span>
      ) : null}
    </FicheLayout>
  )
}

function MoneyM2({ label, cents, onChange }: { label: string; cents: number | null | undefined; onChange: (c: number | null) => void }) {
  return <NumberField label={`${label} (€/m²)`} step="decimal" value={cents === null || cents === undefined ? null : cents / 100} onChange={(v) => onChange(v === null ? null : Math.round(v * 100))} />
}

function RoomList({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const rooms = f.roomList ?? []
  const upd = (i: number, patch: Partial<{ name: string; level: string; note: string }>) => set({ roomList: rooms.map((r, j) => (j === i ? { ...r, ...patch } : r)) })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rooms.map((r, i) => (
        <div key={i} className="col-md" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Input label="Pièce" hideLabel={i > 0} value={r.name} onChange={(v) => upd(i, { name: v })} style={{ flex: '2 1 0' }} />
          <Input label="Niveau" hideLabel={i > 0} value={r.level} onChange={(v) => upd(i, { level: v })} placeholder="Rez-de-chaussée" />
          <Input label="Remarque" hideLabel={i > 0} value={r.note} onChange={(v) => upd(i, { note: v })} style={{ flex: '2 1 0' }} />
          <Btn variant="ghost" size="sm" onClick={() => set({ roomList: rooms.filter((_, j) => j !== i) })} style={{ height: 50 }}>
            Retirer
          </Btn>
        </div>
      ))}
      <TextLink onClick={() => set({ roomList: [...rooms, { name: '' }] })}>+ Ajouter une pièce</TextLink>
    </div>
  )
}

function FurnitureInventory({ f, set }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void }) {
  const inv = f.furniture?.inventory ?? []
  const upd = (i: number, patch: Partial<{ room: string; item: string; count: number; state: string }>) => set({ furniture: { ...f.furniture, inventory: inv.map((x, j) => (j === i ? { ...x, ...patch } : x)) } })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>Inventaire du mobilier</span>
      {inv.map((x, i) => (
        <div key={i} className="col-md" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <Input label="Pièce" hideLabel={i > 0} value={x.room} onChange={(v) => upd(i, { room: v })} />
          <Input label="Élément" hideLabel={i > 0} value={x.item} onChange={(v) => upd(i, { item: v })} style={{ flex: '2 1 0' }} />
          <NumberField label="Nombre" hideLabel={i > 0} value={x.count} onChange={(v) => upd(i, { count: Math.max(1, v ?? 1) })} />
          <Select label="État" hideLabel={i > 0} value={x.state ?? ''} onChange={(v) => upd(i, { state: v })} options={['Neuf', 'Bon', 'Usé', 'Mauvais'].map((s) => ({ value: s, label: s }))} />
          <Btn variant="ghost" size="sm" onClick={() => set({ furniture: { ...f.furniture, inventory: inv.filter((_, j) => j !== i) } })} style={{ height: 50 }}>
            Retirer
          </Btn>
        </div>
      ))}
      <TextLink onClick={() => set({ furniture: { ...f.furniture, inventory: [...inv, { item: '', count: 1 }] } })}>+ Ajouter un élément</TextLink>
    </div>
  )
}

function Photos({ f, set, onError }: { f: PropertyFile; set: (p: Partial<PropertyFile>) => void; onError: (e: unknown) => void }) {
  const [busy, setBusy] = useState(false)
  const photos = f.photos ?? []
  return (
    <>
      <label style={{ border: `1.5px dashed ${BAI.dashed}`, background: BAI.bg, borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center', cursor: 'pointer' }}>
        {busy ? <Spinner size={22} /> : null}
        <span style={{ fontSize: 16, fontWeight: 700 }}>Déposez les photos du logement</span>
        <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pour l’annonce et comme référence pour l’état des lieux</span>
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
              onError(err)
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
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>Les photos ne sont visibles que par vous. Rien n’est publié.</span>
    </>
  )
}
