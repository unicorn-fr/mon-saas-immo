import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { QrCode } from '../../components/media'
import { display, Spinner } from '../../components/ui'
import { Btn, Callout, Card, ChoiceCard, Crumbs, Known, LoadError, Loader, useLoad, useToast } from '../../components/kit'
import { api } from '../../lib/api'
import { openDoc } from '../../lib/docs'
import { dateFr, dateNum } from '../../lib/format'
import type { LeaseView } from '../../lib/space'

/** Lancer un état des lieux. Maquette « Lancer un état des lieux ». */
export default function EtatDesLieux() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<LeaseView>(`/leases/${id}`), [id])
  return (
    <AppShell>
      {loading && !data ? <Loader /> : error || !data ? <LoadError message={error ?? ''} retry={reload} /> : <Launch l={data} />}
    </AppShell>
  )
}

function Launch({ l }: { l: LeaseView }) {
  const [params] = useSearchParams()
  const toast = useToast()
  const entry = l.inventories.find((i) => i.kind === 'ENTRY')
  const defaultKind = params.get('type') === 'EXIT' || l.status === 'ENDED' || entry?.status === 'SIGNED' ? 'EXIT' : 'ENTRY'
  const [kind, setKind] = useState<'ENTRY' | 'EXIT'>(defaultKind)
  const [inv, setInv] = useState<{ id: string; url: string } | null>(null)
  const [preparing, setPreparing] = useState(false)
  const existing = l.inventories.find((i) => i.kind === kind)
  const first = l.tenants[0]?.name ?? 'Le locataire'
  const f = l.contract.property
  const rooms = f.roomList?.length ?? 0

  // L'état des lieux est préparé dès qu'on choisit « Entrée » ou « Sortie » ; le lien du téléphone dure 20 minutes.
  useEffect(() => {
    if (l.status === 'DRAFT' || existing?.status === 'SIGNED') return
    let alive = true
    setInv(null)
    setPreparing(true)
    ;(async () => {
      const created = await api<{ id: string }>(`/leases/${l.id}/inventories`, { method: 'POST', body: { kind } })
      const link = await api<{ url: string }>(`/inventories/${created.id}/phone-link`, { method: 'POST' })
      if (alive) setInv({ id: created.id, url: link.url })
    })()
      .catch((e) => alive && toast.error(e))
      .finally(() => alive && setPreparing(false))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, l.id])

  const ready = [
    `Les noms du bailleur et ${l.tenants.length > 1 ? 'des locataires' : 'du locataire'}`,
    rooms ? `${rooms} pièce${rooms > 1 ? 's' : ''}, reprises de la fiche du logement` : 'Les pièces habituelles (à ajuster sur place)',
    'Les compteurs selon le chauffage et l’eau chaude',
    'Les clés à remettre',
    ...(l.kind !== 'VIDE' ? ['L’inventaire du mobilier'] : []),
    ...(kind === 'EXIT' && entry?.status === 'SIGNED' ? ['Les états relevés à l’entrée, pour comparer'] : []),
  ]

  if (l.status === 'DRAFT') {
    return (
      <>
        <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: l.property.name, to: `/espace/logements/${l.property.id}` }, { label: 'État des lieux' }]} />
        <h1 style={display('clamp(38px, 5vw, 52px)')}>État des lieux</h1>
        <Callout tone="tip" title="Le bail n’est pas encore signé">
          L’état des lieux d’entrée se fait le jour de la remise des clés, une fois le bail signé.
        </Callout>
        <div>
          <Btn to={`/espace/baux/${l.id}`}>Retour au bail</Btn>
        </div>
      </>
    )
  }

  return (
    <>
      <Crumbs items={[{ label: 'Logements', to: '/espace/logements' }, { label: l.property.name, to: `/espace/logements/${l.property.id}` }, { label: 'État des lieux' }]} />
      <h1 style={display('clamp(38px, 5vw, 52px)')}>État des lieux</h1>
      <div className="split-aside" style={{ gap: 24 }}>
        <div className="grow">
          <Card title="Lequel ?">
            <div className="grid-2" style={{ gap: 14 }}>
              <ChoiceCard column selected={kind === 'ENTRY'} onClick={() => setKind('ENTRY')} title="Entrée" sub={entry?.status === 'SIGNED' ? `Fait le ${dateNum(entry.date)}` : `${first} arrive le ${dateFr(l.columns.startDate)}`} />
              <ChoiceCard column selected={kind === 'EXIT'} onClick={() => setKind('EXIT')} title="Sortie" sub="Le locataire part, on compare avec l’entrée" />
            </div>
          </Card>
          <Card title="Déjà prêt pour vous">
            <Known title="" items={ready} />
          </Card>
          {kind === 'EXIT' ? <Callout tone="info">À la sortie, la nouvelle adresse du locataire est demandée : elle sert à lui restituer le dépôt de garantie.</Callout> : null}
        </div>
        <section className="aside" style={{ width: 420, background: BAI.night, borderRadius: 24, padding: 32, alignItems: 'center', textAlign: 'center', color: BAI.surface, boxSizing: 'border-box' }}>
          {existing?.status === 'SIGNED' ? (
            <>
              <span style={display(34, { color: BAI.surface, lineHeight: 1.05 })}>Déjà signé</span>
              <span style={{ fontSize: 16, color: BAI.onDark }}>L’état des lieux {kind === 'ENTRY' ? 'd’entrée' : 'de sortie'} est signé{existing.date ? ` depuis le ${dateNum(existing.date)}` : ''}. Il ne peut plus être modifié.</span>
              <Btn variant="caramel" onClick={() => openDoc(`/inventories/${existing.id}/pdf`).catch(toast.error)}>
                Ouvrir le PDF
              </Btn>
            </>
          ) : (
            <>
              <span style={display(34, { color: BAI.surface, lineHeight: 1.05 })}>Faites-le sur votre téléphone</span>
              <span style={{ fontSize: 16, color: BAI.onDark }}>Vous marchez dans le logement, vous prenez les photos, tout s’enregistre.</span>
              {inv ? <QrCode text={inv.url} /> : <div style={{ width: 180, height: 180, borderRadius: 16, background: BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{preparing ? <Spinner size={26} /> : null}</div>}
              <span style={{ fontSize: 14, color: BAI.onDarkMuted }}>Scannez ce code avec l’appareil photo. Il reste valable 20 minutes.</span>
              {inv ? (
                <Link to={`/edl/${inv.id}`} style={{ color: BAI.caramel, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
                  Ou continuer sur cet appareil
                </Link>
              ) : null}
            </>
          )}
        </section>
      </div>
    </>
  )
}
