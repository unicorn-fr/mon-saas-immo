import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Avatar, Btn, Empty, Input, LoadError, Loader, PageHead, Pill, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import { dateNum, euros, plural } from '../../lib/format'
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

type Tone = 'green' | 'error' | 'accent' | 'muted'

/** État du loyer d'un locataire : le `rentStatus` du serveur (retards, partiel), jamais un second calcul. */
function rentState(t: TenantSummary): { label: string; tone: Tone } {
  if (!t.leaseDates) return { label: 'Sans bail', tone: 'muted' }
  if (t.leaseDates.status === 'DRAFT') return { label: 'Bail à signer', tone: 'accent' }
  const owed = t.rent?.unpaidCents ?? 0
  // Plus d'un mois de loyer dû : impayé ; sinon un retard.
  if (t.rent?.key === 'LATE') return owed > (t.totalCents ?? Infinity) ? { label: `Impayé : ${euros(owed)}`, tone: 'error' } : { label: `En retard : ${euros(owed)}`, tone: 'error' }
  if (t.rent?.key === 'PARTIAL') return { label: owed ? `Paiement partiel : ${euros(owed)}` : 'Paiement partiel', tone: 'accent' }
  return { label: 'À jour', tone: 'green' }
}

function List({ items: all }: { items: TenantSummary[] }) {
  const [q, setQ] = useState('')
  const items = q ? all.filter((t) => `${t.name} ${t.property?.name ?? ''}`.toLowerCase().includes(q.toLowerCase())) : all
  const toSign = items.filter((t) => t.situation === 'Bail à signer').length
  const grid: CSSProperties = { gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.6fr) minmax(0, 1.6fr) minmax(0, 0.9fr) minmax(0, 1.5fr)' }
  return (
    <>
      <PageHead over="Tableau de bord › Locataires" title="Locataires" sub={all.length ? `${plural(all.length, 'locataire')}${toSign ? `, ${toSign} ${toSign > 1 ? 'baux' : 'bail'} en préparation` : ''}` : undefined} actions={<Btn to="/espace/locataires/nouveau">Ajouter un locataire</Btn>} />
      {all.length > 3 ? (
        <div style={{ width: 'min(360px, 100%)' }}>
          <Input label="Rechercher un locataire" hideLabel placeholder="Rechercher un locataire" value={q} onChange={setQ} />
        </div>
      ) : null}
      {items.length ? (
        <div className="tenant-list" style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: BAI.radius, padding: 8, display: 'flex', flexDirection: 'column' }}>
          <div className="table-row hide-sm" style={{ ...grid, padding: '12px 18px', fontSize: 13, fontWeight: 600, color: BAI.inkSoft }}>
            <span>Nom du locataire</span>
            <span>Bien affecté</span>
            <span>Durée du bail</span>
            <span>Loyer</span>
            <span>État du loyer</span>
          </div>
          {items.map((t) => (
            <Link key={t.id} to={`/espace/locataires/${t.id}`} className="table-row tenant-row" style={{ ...grid, ...({ '--row-bg': BAI.surface, '--row-line': BAI.divider } as CSSProperties), padding: '14px 18px', borderTop: `1px solid ${BAI.dividerSoft}`, textDecoration: 'none', color: BAI.ink, fontSize: 15 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar text={t.initials} size={38} />
                <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Sans nom'}</span>
              </span>
              <span style={{ color: BAI.inkMid, overflowWrap: 'anywhere' }}>{t.property?.name ?? 'Aucun logement'}</span>
              <span style={{ color: BAI.inkMid }}>{t.leaseDates ? `Du ${dateNum(t.leaseDates.startDate)} au ${dateNum(t.leaseDates.endDate)}` : 'Pas de bail'}</span>
              <span style={{ fontWeight: 600 }}>
                {t.totalCents !== null ? euros(t.totalCents) : ''}
                {t.totalCents !== null ? <span style={{ fontWeight: 400, color: BAI.inkSoft, fontSize: 13 }}> / mois</span> : null}
              </span>
              <span>
                <Pill tone={rentState(t).tone}>{rentState(t).label}</Pill>
              </span>
            </Link>
          ))}
        </div>
      ) : all.length ? (
        <p style={{ margin: 0, color: BAI.inkMid }}>Aucun locataire ne correspond à « {q} ».</p>
      ) : (
        <Empty title="Aucun locataire pour l’instant." text="Ajoutez votre locataire : son identité, son garant et ses justificatifs servent ensuite au bail et aux quittances." action={<Btn to="/espace/locataires/nouveau">Ajouter un locataire</Btn>} />
      )}
    </>
  )
}
