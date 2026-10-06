import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { display } from '../../components/ui'
import { Btn, Empty, LoadError, Loader, PageHead, Pill, Stat, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import { eurosCents, monthName, plural } from '../../lib/format'
import type { PropertySummary } from '../../lib/space'

/** Liste des logements. Maquette « Logements ». */
export default function Logements() {
  const { data, error, loading, reload } = useLoad(() => api<PropertySummary[]>('/properties'))
  return (
    <AppShell>
      {loading && !data ? (
        <Loader />
      ) : error || !data ? (
        <LoadError message={error ?? ''} retry={reload} />
      ) : (
        <List items={data} />
      )}
    </AppShell>
  )
}

const PHOTO_BG = [BAI.photoWarm, BAI.photoCool, BAI.photoSand]

/** Clé d'immeuble : même adresse et même ville, sans tenir compte des accents, de la casse ni de la ponctuation. */
const buildingKey = (p: PropertySummary) =>
  `${p.address} ${p.city ?? ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Logements regroupés par immeuble, dans l'ordre de la liste. */
function buildings(items: PropertySummary[]) {
  const groups = new Map<string, PropertySummary[]>()
  for (const p of items) {
    const k = buildingKey(p) || p.id
    groups.set(k, [...(groups.get(k) ?? []), p])
  }
  return [...groups].map(([key, list]) => ({ key, label: list[0].address, items: list }))
}

function List({ items }: { items: PropertySummary[] }) {
  const rented = items.filter((p) => p.status === 'RENTED').length
  const drafts = items.filter((p) => p.lease?.status === 'DRAFT').length
  const late = items.filter((p) => p.lease?.rent.key === 'LATE').length
  const groups = buildings(items)
  const singles = groups.filter((g) => g.items.length === 1).map((g) => g.items[0])
  return (
    <>
      <PageHead
        title="Vos logements"
        sub={items.length ? `${plural(items.length, 'logement')} · ${rented} loué${rented > 1 ? 's' : ''}, ${items.length - rented} disponible${items.length - rented > 1 ? 's' : ''}` : 'Ajoutez votre premier logement.'}
        actions={
          <>
            <Btn variant="outline" to="/espace/structures">
              Vos structures
            </Btn>
            <Btn to="/espace/logements/nouveau">Ajouter un logement</Btn>
          </>
        }
      />
      {items.length ? (
        <>
          <div className="stats-bar" style={{ background: BAI.night, borderRadius: 20, padding: '24px 28px', ['--line' as string]: BAI.nightLine }}>
            <Stat value={items.length} label={items.length > 1 ? 'logements' : 'logement'} />
            <Stat value={rented} label={rented > 1 ? 'loués' : 'loué'} />
            <Stat value={late} label={late > 1 ? 'loyers en retard' : 'loyer en retard'} accent />
            <Stat value={drafts} label={drafts > 1 ? 'baux en préparation' : 'bail en préparation'} />
          </div>
          <Link to="/espace/patrimoine" style={{ alignSelf: 'flex-start', fontSize: 15, fontWeight: 600, color: BAI.owner }}>
            Tableau de bord : ce qu’il vous reste chaque mois, et ce qui est à surveiller
          </Link>
          {groups.map((g) =>
            g.items.length > 1 ? (
              <section key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <h2 style={{ ...display('clamp(22px, 3vw, 26px)'), margin: 0 }}>{g.label}</h2>
                  <span style={{ fontSize: 14, color: BAI.inkSoft }}>Même immeuble · {plural(g.items.length, 'logement')}</span>
                  <Link to={`/espace/argent/repartir?logements=${g.items.map((p) => p.id).join(',')}`} style={{ fontSize: 14, fontWeight: 600, color: BAI.owner }}>
                    Répartir une dépense de l’immeuble
                  </Link>
                </div>
                <div className="cards-3">
                  {g.items.map((p) => (
                    <PropertyCard key={p.id} p={p} bg={PHOTO_BG[items.indexOf(p) % PHOTO_BG.length]} />
                  ))}
                </div>
              </section>
            ) : null,
          )}
          {singles.length && singles.length < items.length ? <h2 style={{ ...display('clamp(22px, 3vw, 26px)'), margin: 0 }}>Autres logements</h2> : null}
          <div className="cards-3">
            {singles.map((p) => (
              <PropertyCard key={p.id} p={p} bg={PHOTO_BG[items.indexOf(p) % PHOTO_BG.length]} />
            ))}
          </div>
        </>
      ) : (
        <Empty title="Aucun logement pour l’instant." text="Bailio vous pose quelques questions simples, une à la fois. Les réponses servent ensuite pour le bail, les quittances et l’état des lieux." action={<Btn to="/espace/logements/nouveau">Ajouter un logement</Btn>} />
      )}
    </>
  )
}

function PropertyCard({ p, bg }: { p: PropertySummary; bg: string }) {
  const available = p.status === 'AVAILABLE'
  const rent = p.lease?.rent
  const month = monthName(new Date().getMonth() + 1, true)
  const facts = [p.kindLabel, p.surface ? `${String(p.surface).replace('.', ',')} m²` : null, p.city].filter(Boolean).join(' · ')
  return (
    <Link to={`/espace/logements/${p.id}`} style={{ textDecoration: 'none', color: BAI.ink, background: BAI.surface, border: available ? `1.5px dashed ${BAI.dashed}` : `1px solid ${BAI.divider}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 150, background: bg, display: 'flex', alignItems: 'flex-end', padding: 14, boxSizing: 'border-box' }}>
        {available ? <Pill tone="caramel">{p.lease?.status === 'DRAFT' ? 'Bail en préparation' : 'Disponible'}</Pill> : <Pill tone="green">Loué</Pill>}
      </div>
      <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 19, fontWeight: 700 }}>{p.name}</span>
          <span style={{ fontSize: 14, color: BAI.inkSoft }}>{facts}</span>
        </div>
        {p.lease && !available ? (
          <>
            <Row label="Locataire" value={p.lease.tenantName || 'À compléter'} border />
            <Row label="Loyer charges comprises" value={eurosCents(p.lease.totalCents)} />
            <Row label={month} value={rent?.label ?? ''} color={rent?.key === 'PAID' ? BAI.green : rent?.key === 'LATE' ? BAI.error : undefined} />
          </>
        ) : (
          <div style={{ fontSize: 14, lineHeight: 1.55, color: BAI.inkMid, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 }}>
            {p.lease?.status === 'DRAFT' ? `Un bail est en préparation${p.lease.tenantName ? ` pour ${p.lease.tenantName}` : ''}.` : p.completion < 100 ? `Fiche remplie à ${p.completion} %. Complétez-la pour préparer le bail.` : 'Prêt à louer : créez le bail quand vous avez trouvé votre locataire.'}
          </div>
        )}
        {available ? (
          <span style={{ marginTop: 'auto', alignSelf: 'flex-start', background: BAI.owner, color: BAI.surface, padding: '12px 18px', borderRadius: 10, fontWeight: 600, fontSize: 14 }}>{p.lease?.status === 'DRAFT' ? 'Reprendre le bail' : 'Voir le logement'}</span>
        ) : null}
      </div>
    </Link>
  )
}

function Row({ label, value, border, color }: { label: string; value: string; border?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14, ...(border ? { borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 14 } : {}) }}>
      <span style={{ color: BAI.inkSoft }}>{label}</span>
      <span style={{ fontWeight: 600, color: color ?? BAI.ink, textAlign: 'right' }}>{value}</span>
    </div>
  )
}
