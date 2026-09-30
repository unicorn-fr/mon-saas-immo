import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
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

function List({ items }: { items: PropertySummary[] }) {
  const rented = items.filter((p) => p.status === 'RENTED').length
  const drafts = items.filter((p) => p.lease?.status === 'DRAFT').length
  const late = items.filter((p) => p.lease?.rent.key === 'LATE').length
  return (
    <>
      <PageHead
        title="Vos logements"
        sub={items.length ? `${plural(items.length, 'logement')} · ${rented} loué${rented > 1 ? 's' : ''}, ${items.length - rented} disponible${items.length - rented > 1 ? 's' : ''}` : 'Ajoutez votre premier logement.'}
        actions={<Btn to="/espace/logements/nouveau">Ajouter un logement</Btn>}
      />
      {items.length ? (
        <>
          <div className="stats-bar" style={{ background: BAI.night, borderRadius: 20, padding: '24px 28px', ['--line' as string]: BAI.nightLine }}>
            <Stat value={items.length} label={items.length > 1 ? 'logements' : 'logement'} />
            <Stat value={rented} label={rented > 1 ? 'loués' : 'loué'} />
            <Stat value={late} label={late > 1 ? 'loyers en retard' : 'loyer en retard'} accent />
            <Stat value={drafts} label={drafts > 1 ? 'baux en préparation' : 'bail en préparation'} />
          </div>
          <div className="cards-3">
            {items.map((p, i) => (
              <PropertyCard key={p.id} p={p} bg={PHOTO_BG[i % PHOTO_BG.length]} />
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
