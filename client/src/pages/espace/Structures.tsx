import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Fields } from '../../components/FlowLayout'
import { NewStructure } from '../../components/StructurePicker'
import { Btn, Callout, Card, Chips, Crumbs, Input, LoadError, Loader, Modal, NumberField, PageHead, Pill, TextLink, Toggle, useLoad, useToast } from '../../components/kit'
import { display } from '../../components/ui'
import { api } from '../../lib/api'
import { KIND_OPTIONS, TAX_LABEL, isCompany, type StructureFile, type StructureView } from '../../lib/structures'

/**
 * Vos structures : en votre nom, à plusieurs, SCI, société. Chaque logement appartient à l'une d'elles,
 * qui désigne le bailleur de ses baux.
 */
export default function Structures() {
  const navigate = useNavigate()
  const { data, error, loading, reload } = useLoad(() => api<StructureView[]>('/structures'))
  const [adding, setAdding] = useState(false)

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Vos structures' }]} />
      <PageHead title="Vos structures" sub="Qui détient vos logements : vous, à plusieurs, une SCI ou une société. Le bail de chaque logement en dépend." actions={<Btn onClick={() => setAdding(true)}>Ajouter une structure</Btn>} />
      {loading && !data ? (
        <Loader />
      ) : error ? (
        <LoadError message={error} retry={reload} />
      ) : (
        (data ?? []).map((s) => (
          <Card key={s.id} title={<h2 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{s.name}</h2>} action={<TextLink to={`/espace/structures/${s.id}`}>Modifier</TextLink>}>
            <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill tone="owner">{KIND_OPTIONS.find((k) => k.value === (s.file.kind ?? 'PERSON'))?.label}</Pill>
              {s.file.kind === 'SCI' && s.file.sciFamily ? <Pill tone="green">Familiale</Pill> : null}
              <Pill tone="caramel">{TAX_LABEL[s.taxRegime]}</Pill>
            </span>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>
              {s.effects.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <span style={{ fontSize: 15 }}>
              {s.properties.length ? (
                <>
                  {s.properties.length} logement{s.properties.length > 1 ? 's' : ''} :{' '}
                  {s.properties.map((p, i) => (
                    <span key={p.id}>
                      {i ? ', ' : ''}
                      <TextLink to={`/espace/logements/${p.id}`} style={{ fontSize: 15 }}>
                        {p.name}
                      </TextLink>
                    </span>
                  ))}
                </>
              ) : (
                <span style={{ color: BAI.inkSoft }}>Aucun logement pour l’instant.</span>
              )}
            </span>
          </Card>
        ))
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Nouvelle structure">
        <NewStructure onCreated={(id) => navigate(`/espace/structures/${id}`)} />
      </Modal>
    </AppShell>
  )
}

/** Fiche d'une structure : ce qui figure dans le bail (société, co-propriétaires) et ce qui servira à la déclaration (régime, associés). */
export function StructureFiche() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { data, error, loading, reload } = useLoad(() => api<StructureView>(`/structures/${id}`), [id])
  const [f, setF] = useState<StructureFile | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (data) setF(data.file)
  }, [data])
  const set = (patch: Partial<StructureFile>) => setF((x) => ({ ...x, ...patch }))

  if (error) return <AppShell><LoadError message={error} retry={reload} /></AppShell>
  if (loading || !data || !f) return <AppShell><Loader /></AppShell>
  const company = isCompany(f.kind)
  const c = f.company ?? {}
  const associates = f.associates ?? []
  const coOwners = f.coOwners ?? []
  const total = Math.round(associates.reduce((a, x) => a + (x.sharePct ?? 0), 0) * 100) / 100

  const save = async () => {
    setBusy(true)
    try {
      await api<StructureView>(`/structures/${id}`, { method: 'PUT', body: f })
      toast.show('Structure enregistrée.')
      reload()
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!window.confirm(`Supprimer « ${data.name} » ? Elle reste 30 jours dans la corbeille.`)) return
    try {
      await api(`/structures/${id}`, { method: 'DELETE' })
      navigate('/espace/structures')
    } catch (e) {
      toast.error(e)
    }
  }

  return (
    <AppShell>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: 'Vos structures', to: '/espace/structures' }, { label: data.name }]} />
      <h1 style={display('clamp(34px, 5vw, 48px)')}>{data.name}</h1>

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Qui détient les logements</h2>}>
        <Chips legend="Le logement est détenu" value={f.kind ?? 'PERSON'} onChange={(v) => set({ kind: v })} options={KIND_OPTIONS} />
        {f.kind === 'SCI' ? <Toggle checked={Boolean(f.sciFamily)} onChange={(v) => set({ sciFamily: v })} label="SCI familiale" sub="Associés tous parents ou alliés jusqu’au 4e degré (frères, cousins, oncles…) : le bail vide dure 3 ans, comme pour un particulier." /> : null}
        {!company ? <Input label="Nom pour vous y retrouver (facultatif)" value={f.name} onChange={(v) => set({ name: v })} placeholder={f.kind === 'COUPLE' ? 'Avec Paul' : 'En mon nom'} /> : null}
        <Callout tone="tip" title="Ce que cela change">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.5 }}>
            {data.effects.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Callout>
        {data.properties.length ? <span style={{ fontSize: 14, color: BAI.inkSoft }}>Un bail déjà signé garde le bailleur indiqué à la signature. Les baux en préparation suivent ce choix.</span> : null}
      </Card>

      {f.kind === 'COUPLE' ? (
        <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Les autres propriétaires</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Ils sont aussi bailleurs : leur nom figure dans le bail, à côté du vôtre.</span>
          {coOwners.map((o, i) => (
            <Fields key={i}>
              <Input label="Prénoms" value={o.firstNames} onChange={(v) => set({ coOwners: coOwners.map((x, j) => (j === i ? { ...x, firstNames: v } : x)) })} />
              <Input label="Nom" value={o.lastName} onChange={(v) => set({ coOwners: coOwners.map((x, j) => (j === i ? { ...x, lastName: v } : x)) })} />
            </Fields>
          ))}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <TextLink onClick={() => set({ coOwners: [...coOwners, {}] })}>Ajouter un propriétaire</TextLink>
            {coOwners.length ? <TextLink onClick={() => set({ coOwners: coOwners.slice(0, -1) })}>Retirer le dernier</TextLink> : null}
          </div>
        </Card>
      ) : null}

      {company ? (
        <Card id="company" title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>La société</h2>}>
          <span style={{ fontSize: 15, color: BAI.inkMid }}>Le bail indique sa dénomination, son siège et qui signe pour elle (loi du 6 juillet 1989, art. 3).</span>
          <Fields>
            <Input label="Dénomination" value={c.name} onChange={(v) => set({ company: { ...c, name: v } })} />
            <Input label="Forme" value={c.form} onChange={(v) => set({ company: { ...c, form: v } })} placeholder={f.kind === 'SCI' ? 'SCI' : 'SARL de famille, SAS…'} />
          </Fields>
          <Fields>
            <Input label="Numéro SIREN (facultatif)" value={c.siren} inputMode="numeric" maxLength={9} onChange={(v) => set({ company: { ...c, siren: v.replace(/\D/g, '') } })} />
            <Input label="Siège social" value={c.seat} onChange={(v) => set({ company: { ...c, seat: v } })} />
          </Fields>
          <Fields>
            <Input label="Représentée par" value={c.representedBy} onChange={(v) => set({ company: { ...c, representedBy: v } })} hint="La personne qui signe les baux, en général le gérant." />
            <Input label="En qualité de" value={c.representativeRole} onChange={(v) => set({ company: { ...c, representativeRole: v } })} placeholder="Gérant" />
          </Fields>
        </Card>
      ) : null}

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Impôts</h2>}>
        <Chips
          legend="Régime fiscal"
          value={f.taxRegime ?? data.taxRegime}
          onChange={(v) => set({ taxRegime: v })}
          options={[
            { value: 'IR', label: TAX_LABEL.IR },
            { value: 'IS', label: TAX_LABEL.IS },
          ]}
          hint={company ? 'Une SCI relève de l’impôt sur le revenu (chaque associé déclare sa part), sauf si elle a choisi l’impôt sur les sociétés. Une SAS ou une SARL relève de l’impôt sur les sociétés, sauf la SARL de famille qui a choisi l’impôt sur le revenu.' : 'En votre nom, les loyers sont déclarés avec vos revenus.'}
        />
        {company || f.kind === 'COUPLE' ? (
          <>
            <span style={{ fontSize: 15, color: BAI.inkMid }}>{company ? 'Associés et leur part du capital' : 'Part de chacun (indivision)'} : elle servira à répartir les loyers et les charges dans l’aide à la déclaration.</span>
            {associates.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <Input label="Nom" hideLabel={i > 0} value={a.name} onChange={(v) => set({ associates: associates.map((x, j) => (j === i ? { ...x, name: v } : x)) })} style={{ flex: '2 1 220px' }} />
                <NumberField label="Part" hideLabel={i > 0} value={a.sharePct ?? null} onChange={(v) => set({ associates: associates.map((x, j) => (j === i ? { ...x, sharePct: v } : x)) })} suffix="%" step="decimal" style={{ flex: '1 1 120px' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <TextLink onClick={() => set({ associates: [...associates, {}] })}>Ajouter {company ? 'un associé' : 'une personne'}</TextLink>
              {associates.length ? <TextLink onClick={() => set({ associates: associates.slice(0, -1) })}>Retirer la dernière ligne</TextLink> : null}
              {associates.length ? <span style={{ fontSize: 14, color: Math.abs(total - 100) < 0.01 ? BAI.green : BAI.caramelInk, fontWeight: 600 }}>Total : {total.toLocaleString('fr-FR')} %</span> : null}
            </div>
          </>
        ) : null}
      </Card>

      <Card title={<h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Compte qui reçoit les loyers</h2>}>
        <span style={{ fontSize: 15, color: BAI.inkMid }}>Facultatif : sans compte ici, Bailio reprend celui de votre profil. Une société a en général son propre compte.</span>
        <Fields>
          <Input label="Titulaire (facultatif)" value={f.payment?.holder} onChange={(v) => set({ payment: { ...f.payment, holder: v } })} />
          <Input label="IBAN (facultatif)" value={f.payment?.iban} onChange={(v) => set({ payment: { ...f.payment, iban: v.toUpperCase() } })} />
        </Fields>
      </Card>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <Btn onClick={() => void save()} loading={busy} disabled={busy}>
          Enregistrer
        </Btn>
        {!data.properties.length ? (
          <TextLink onClick={() => void remove()} style={{ color: BAI.error }}>
            Supprimer cette structure
          </TextLink>
        ) : null}
      </div>
    </AppShell>
  )
}
