import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Avatar, Btn, Card, Empty, LoadError, Loader, PageHead, Pill, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import { euros, plural } from '../../lib/format'
import type { TenantSummary } from '../../lib/space'

/** Liste des locataires. Maquette « Locataires ». */
export default function Locataires() {
  const { data, error, loading, reload } = useLoad(() => api<TenantSummary[]>('/tenants'))
  return (
    <AppShell>
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <List items={data} />}
    </AppShell>
  )
}

const TONE = { 'À jour': 'green', 'Loyer en retard': 'error', 'Paiement partiel': 'caramel', 'Bail à signer': 'caramel', 'Sans bail': 'muted' } as const

function List({ items }: { items: TenantSummary[] }) {
  const toSign = items.filter((t) => t.situation === 'Bail à signer').length
  const grid = { gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1.2fr)' }
  return (
    <>
      <PageHead title="Vos locataires" sub={items.length ? `${plural(items.length, 'locataire')}${toSign ? `, ${toSign} bail${toSign > 1 ? 'x' : ''} en préparation` : ''}` : undefined} actions={<Btn to="/espace/locataires/nouveau">Ajouter un locataire</Btn>} />
      {items.length ? (
        <Card pad={8} style={{ gap: 0, padding: 8 }}>
          <div className="table-row hide-sm" style={{ ...grid, padding: '12px 18px', fontSize: 13, fontWeight: 600, color: BAI.inkSoft }}>
            <span>Locataire</span>
            <span>Logement</span>
            <span>Loyer</span>
            <span>Situation</span>
          </div>
          {items.map((t) => (
            <Link key={t.id} to={`/espace/locataires/${t.id}`} className="table-row" style={{ ...grid, padding: '14px 18px', borderTop: `1px solid ${BAI.dividerSoft}`, textDecoration: 'none', color: BAI.ink, fontSize: 15 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar text={t.initials} size={38} />
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Sans nom'}</span>
              </span>
              <span style={{ color: BAI.inkMid }}>{t.property?.name ?? 'Aucun logement'}</span>
              <span style={{ fontWeight: 600 }}>{t.totalCents !== null ? euros(t.totalCents) : ''}</span>
              <span>
                <Pill tone={TONE[t.situation as keyof typeof TONE] ?? 'muted'}>{t.situation}</Pill>
              </span>
            </Link>
          ))}
        </Card>
      ) : (
        <Empty title="Aucun locataire pour l’instant." text="Ajoutez votre locataire : son identité, son garant et ses justificatifs servent ensuite au bail et aux quittances." action={<Btn to="/espace/locataires/nouveau">Ajouter un locataire</Btn>} />
      )}
    </>
  )
}
