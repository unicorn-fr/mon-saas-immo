import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BAI } from '../../constants/bailio-tokens'
import { AppShell } from '../../components/AppShell'
import { Btn, Card, Empty, LoadError, Loader, PageHead, Select, TextLink, useLoad } from '../../components/kit'
import { api } from '../../lib/api'
import type { Contact } from '../../lib/contacts'
import type { PropertySummary } from '../../lib/space'
import { NEWS, newsFor, type NewsItem } from '../../content/actualites'
import { PARTENAIRES, SERVICES, matchesService, quoteRequest, type ServiceKey } from '../../content/prestataires'

const KIND_LABEL: Record<NewsItem['kind'], string> = { LOI: 'Nouvelle règle', ECHEANCE: 'Échéance', CONSEIL: 'Conseil' }
const dateFr = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const today = () => new Date().toISOString().slice(0, 10)

/** Une ligne du fil : date, type, titre, une phrase, la source officielle. */
export function NewsRow({ n }: { n: NewsItem }) {
  return (
    <article style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 12 }}>
      <span style={{ fontSize: 13, color: BAI.inkSoft }}>
        <strong style={{ color: n.kind === 'ECHEANCE' ? BAI.accentInk : BAI.owner }}>{KIND_LABEL[n.kind]}</strong> · {dateFr(n.date)}
      </span>
      <h3 style={{ margin: 0, fontSize: 17 }}>{n.title}</h3>
      <p style={{ margin: 0, fontSize: 15, color: BAI.inkMid, lineHeight: 1.5 }}>{n.text}</p>
      <a href={n.source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14 }}>
        Source : {n.source.label}
      </a>
    </article>
  )
}

/** Carte « Actualités » d'« Aujourd'hui » : les trois premières, puis la page. */
export function NewsCard() {
  return (
    <Card title="Actualités" action={<TextLink to="/espace/actualites" style={{ fontSize: 14 }}>Tout voir</TextLink>}>
      {newsFor(null, today()).slice(0, 3).map((n) => (
        <Link key={n.title} to="/espace/actualites" className="tap" style={{ textDecoration: 'none', color: BAI.ink, display: 'flex', flexDirection: 'column', gap: 2, borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
          <span style={{ fontSize: 13, color: BAI.inkSoft }}>
            {KIND_LABEL[n.kind]} · {dateFr(n.date)}
          </span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{n.title}</span>
        </Link>
      ))}
    </Card>
  )
}

/** /espace/actualites : nouvelles règles, échéances et conseils, sources officielles. */
export function Actualites() {
  const [filter, setFilter] = useState<'ALL' | NewsItem['kind']>('ALL')
  const list = newsFor(null, today()).filter((n) => filter === 'ALL' || n.kind === filter)
  return (
    <AppShell>
      <PageHead title="Actualités" sub="Nouvelles règles, échéances, conseils. Chaque information cite sa source." />
      <div role="group" aria-label="Filtrer" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(['ALL', 'LOI', 'ECHEANCE', 'CONSEIL'] as const).map((k) => (
          <Btn key={k} size="sm" variant={filter === k ? 'dark' : 'outline'} onClick={() => setFilter(k)}>
            {k === 'ALL' ? `Tout (${NEWS.length})` : KIND_LABEL[k]}
          </Btn>
        ))}
      </div>
      <Card>
        {list.map((n) => (
          <NewsRow key={n.title} n={n} />
        ))}
      </Card>
    </AppShell>
  )
}

/** /espace/prestataires : photo, vidéo, home staging, ménage, jardin. Vos contacts, puis une demande de devis prête. */
export function Prestataires() {
  const contacts = useLoad(() => api<Contact[]>('/contacts'))
  const props = useLoad(() => api<PropertySummary[]>('/properties'))
  const [service, setService] = useState<ServiceKey>('PHOTO')
  const [propertyId, setPropertyId] = useState<string | null>(null)
  if ((contacts.loading && !contacts.data) || (props.loading && !props.data)) return <AppShell><Loader /></AppShell>
  if (contacts.error || props.error) return <AppShell><LoadError message={contacts.error ?? props.error ?? ''} retry={() => (contacts.reload(), props.reload())} /></AppShell>
  const homes = (props.data ?? []).filter((p) => p.nature !== 'PARKING')
  const home = homes.find((p) => p.id === propertyId) ?? homes[0]
  const s = SERVICES.find((x) => x.key === service)!
  const mine = (contacts.data ?? []).filter((c) => matchesService(c, service))
  const partners = PARTENAIRES.filter((p) => p.service === service)
  const q = home ? quoteRequest(service, home) : null
  const mailto = (email = '') => (q ? `mailto:${email}?subject=${encodeURIComponent(q.subject)}&body=${encodeURIComponent(q.body)}` : undefined)
  return (
    <AppShell>
      <PageHead title="Prestataires" sub="Photo, ménage, jardin : une demande de devis prête à envoyer." />
      <div role="group" aria-label="Service" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {SERVICES.map((x) => (
          <Btn key={x.key} size="sm" variant={service === x.key ? 'dark' : 'outline'} onClick={() => setService(x.key)}>
            {x.title}
          </Btn>
        ))}
      </div>
      <Card title={s.title}>
        <p style={{ margin: 0, color: BAI.inkMid }}>{s.when}</p>
        {homes.length > 1 ? <Select label="Pour quel logement ?" value={home?.id ?? null} onChange={setPropertyId} options={homes.map((p) => ({ value: p.id, label: p.name }))} /> : null}
        {partners.length
          ? partners.map((p) => (
              <div key={p.name} style={{ borderTop: `1px solid ${BAI.dividerSoft}`, paddingTop: 10 }}>
                <strong>{p.name}</strong> · {p.area} · {p.price}{' '}
                <a href={mailto(p.email)}>Demander un devis</a>
              </div>
            ))
          : <p style={{ margin: 0, fontSize: 15, color: BAI.inkSoft }}>Pas encore de partenaire Bailio pour ce service.</p>}
        {mine.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <strong style={{ fontSize: 15 }}>Dans votre carnet</strong>
            {mine.map((c) => (
              <span key={c.id} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {c.name}
                {c.email ? <a href={mailto(c.email)}>Demander un devis</a> : c.phone ? <a href={`tel:${c.phone}`}>{c.phone}</a> : null}
              </span>
            ))}
          </div>
        ) : null}
        {q ? (
          <>
            <strong style={{ fontSize: 15 }}>Votre demande, prête à envoyer</strong>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 15, background: BAI.bg, borderRadius: 14, padding: 16 }}>{q.body}</pre>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Btn variant="outline" href={mailto()}>Ouvrir dans ma messagerie</Btn>
              <Btn variant="outline" onClick={() => navigator.clipboard?.writeText(q.body)}>Copier le texte</Btn>
            </div>
          </>
        ) : (
          <Empty title="Ajoutez d’abord un logement" text="La demande reprend son type, sa surface et son adresse." />
        )}
      </Card>
    </AppShell>
  )
}
