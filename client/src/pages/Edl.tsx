import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { AuthImage, PhotoButton, SignaturePad } from '../components/media'
import { Btn, Callout, Input, LoadError, Loader, Pill, TextArea, errorMessage, useLoad, useToast } from '../components/kit'
import { display } from '../components/ui'
import { api } from '../lib/api'
import { openDoc } from '../lib/docs'
import { dateFr } from '../lib/format'
import { STATES, inventoryItemKey, stateChange, type InventoryData, type InventoryView, type ItemState } from '../lib/space'

/**
 * État des lieux sur téléphone (6 écrans) : départ, compteurs, pièces, une pièce, clés, signatures.
 * Chaque modification est enregistrée sur le serveur au fur et à mesure.
 */
export default function Edl() {
  const { id = '' } = useParams()
  const { data, error, loading, reload } = useLoad(() => api<InventoryView>(`/inventories/${id}`), [id])
  if (loading && !data) return <Loader />
  if (error || !data) return <div style={{ padding: 16 }}><LoadError message={error ?? ''} retry={reload} /></div>
  return <Flow inv={data} />
}

type Screen = { s: 'start' } | { s: 'meters' } | { s: 'rooms' } | { s: 'room'; i: number } | { s: 'furniture' } | { s: 'keys' } | { s: 'sign' } | { s: 'done' }

const BASE = ['Sol', 'Murs', 'Plafond', 'Fenêtres et volets', 'Porte', 'Prises et interrupteurs', 'Radiateurs']
function itemsForRoom(name: string): string[] {
  const n = name.toLowerCase()
  if (/cuisine/.test(n)) return [...BASE, 'Plaques de cuisson', 'Four', 'Hotte', 'Évier et robinetterie', 'Placards']
  if (/salle de bain|salle d.eau|sdb/.test(n)) return [...BASE, 'Baignoire ou douche', 'Vasque et robinetterie', 'Miroir et éclairage', 'VMC']
  if (/^wc|toilette/.test(n)) return ['Sol', 'Murs', 'Plafond', 'Porte', 'Cuvette et chasse d’eau', 'Éclairage']
  if (/séjour|salon/.test(n)) return [...BASE, 'Détecteur de fumée']
  if (/entrée|couloir|dégagement/.test(n)) return ['Sol', 'Murs', 'Plafond', 'Porte d’entrée', 'Interphone', 'Prises et interrupteurs']
  if (/garage|cave|parking/.test(n)) return ['Sol', 'Murs', 'Porte', 'Éclairage']
  if (/extérieur|jardin|terrasse|balcon/.test(n)) return ['Sol ou pelouse', 'Clôture ou garde-corps', 'Portail', 'Éclairage extérieur']
  return BASE
}

function Flow({ inv }: { inv: InventoryView }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [data, setData] = useState<InventoryData>(inv.data)
  const [screen, setScreen] = useState<Screen>(inv.status === 'SIGNED' ? { s: 'done' } : { s: 'start' })
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved')
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(data)
  const exit = inv.kind === 'EXIT'
  const signed = inv.status === 'SIGNED'

  const push = useCallback(async () => {
    window.clearTimeout(timer.current)
    try {
      await api(`/inventories/${inv.id}`, { method: 'PUT', body: latest.current })
      setSaveState('saved')
    } catch (e) {
      setSaveState('error')
      throw e
    }
  }, [inv.id])

  const update = (fn: (d: InventoryData) => InventoryData) => {
    setData((d) => {
      const next = fn(d)
      latest.current = next
      return next
    })
    setSaveState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void push().catch(() => undefined), 800)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => window.scrollTo(0, 0), [screen])

  const rooms = data.rooms ?? []
  const hasFurniture = inv.lease.furnished && (data.furniture?.length ?? 0) > 0
  const order: Screen['s'][] = ['start', 'meters', 'rooms', 'keys', 'sign']
  const step = screen.s === 'room' || screen.s === 'furniture' ? 3 : Math.max(1, order.indexOf(screen.s) + 1)
  const label = { start: 'Départ', meters: 'Compteurs', rooms: 'Pièces', room: 'Pièces', furniture: 'Mobilier', keys: 'Clés', sign: 'Signatures', done: 'Terminé' }[screen.s]
  const back = (): Screen | null => (screen.s === 'meters' ? { s: 'start' } : screen.s === 'rooms' ? { s: 'meters' } : screen.s === 'room' || screen.s === 'furniture' ? { s: 'rooms' } : screen.s === 'keys' ? { s: 'rooms' } : screen.s === 'sign' ? { s: 'keys' } : null)

  const go = async (next: Screen) => {
    try {
      if (saveState !== 'saved') await push()
    } catch (e) {
      toast.error(e)
    }
    setScreen(next)
  }

  const nextRoom = (from = -1) => {
    const i = rooms.findIndex((r, j) => j > from && !r.done)
    const any = i >= 0 ? i : rooms.findIndex((r) => !r.done)
    return any
  }

  const finish = async () => {
    const d = latest.current
    if (!d.signatures?.landlord || !d.signatures?.tenant) return toast.show('Les deux signatures sont nécessaires.', 'error')
    if (exit && !d.newAddress?.trim()) return toast.show('Indiquez la nouvelle adresse du locataire.', 'error')
    try {
      await push()
      await api(`/inventories/${inv.id}/sign`, { method: 'POST', timeout: 90_000 })
      toast.show('État des lieux signé. Le PDF est dans vos documents.')
      setScreen({ s: 'done' })
    } catch (e) {
      toast.show(errorMessage(e), 'error')
    }
  }

  const b = back()
  return (
    <div style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex', flexDirection: 'column' }}>
      <header style={{ height: 60, boxSizing: 'border-box', padding: '0 16px', display: 'grid', gridTemplateColumns: '90px 1fr 90px', alignItems: 'center', background: BAI.surface, position: 'sticky', top: 0, zIndex: 20 }}>
        <div>
          {b && !signed ? (
            <button type="button" onClick={() => go(b)} style={{ border: 'none', background: 'transparent', color: BAI.owner, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, padding: '10px 0', cursor: 'pointer' }}>
              Retour
            </button>
          ) : (
            <Link to={`/espace/baux/${inv.lease.id}`} style={{ textDecoration: 'none', color: BAI.owner, fontSize: 15, fontWeight: 600 }}>
              Quitter
            </Link>
          )}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, textAlign: 'center' }}>{label}</span>
        <span aria-live="polite" style={{ textAlign: 'right', fontSize: 13, color: saveState === 'error' ? BAI.error : saveState === 'saving' ? BAI.inkSoft : BAI.green }}>
          {signed ? 'Signé' : saveState === 'saving' ? 'Envoi…' : saveState === 'error' ? 'Non enregistré' : 'Enregistré'}
        </span>
      </header>
      <div style={{ height: 4, background: BAI.divider, display: 'flex' }}>
        <div style={{ width: `${screen.s === 'done' ? 100 : Math.round((step / 5) * 100)}%`, background: BAI.owner }} />
      </div>
      <main style={{ flex: 1, width: '100%', maxWidth: 560, margin: '0 auto', boxSizing: 'border-box', padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {screen.s === 'start' ? (
          <Page action={<Btn size="lg" full onClick={() => go({ s: 'meters' })}>Commencer</Btn>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>
                {exit ? 'Sortie' : 'Entrée'}
                {data.date ? ` · ${dateFr(data.date)}` : ''}
              </span>
              <h1 style={display(38, { lineHeight: 1 })}>{inv.property.name}</h1>
              <span style={{ fontSize: 15, color: BAI.inkMid }}>Avec {inv.tenantName || 'le locataire'}</span>
            </div>
            <Box>
              <span style={{ fontWeight: 700 }}>Le déroulé</span>
              <span>1. Les compteurs</span>
              <span>2. Les pièces, une par une</span>
              <span>3. Les clés</span>
              <span>4. Les deux signatures</span>
            </Box>
            <div style={{ display: 'flex', gap: 10 }}>
              <Input label="Date" type="date" value={data.date ?? ''} onChange={(v) => update((d) => ({ ...d, date: v || null }))} />
              <Input label="Heure" type="time" value={data.time ?? ''} onChange={(v) => update((d) => ({ ...d, time: v || null }))} />
            </div>
            <span style={{ fontSize: 14, color: BAI.inkSoft }}>Comptez 30 à 45 minutes. Tout est enregistré au fur et à mesure.</span>
          </Page>
        ) : null}

        {screen.s === 'meters' ? (
          <Page title="Les compteurs" action={<Btn size="lg" full onClick={() => go({ s: 'rooms' })}>Continuer</Btn>}>
            {(data.meters ?? []).map((m, i) => (
              <Box key={m.key} gap={10}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{m.label}</span>
                  {m.notApplicable ? <Pill tone="muted">Sans objet</Pill> : m.photoId ? <Pill tone="green">Photo prise</Pill> : null}
                </div>
                {exit && inv.comparison?.meters[m.key]?.entryIndex ? <span style={{ fontSize: 14, color: BAI.inkMid }}>À l’entrée : {inv.comparison.meters[m.key].entryIndex}</span> : null}
                {!m.notApplicable ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                    <Input label="Index relevé" value={m.index ?? ''} inputMode="decimal" onChange={(v) => update((d) => ({ ...d, meters: (d.meters ?? []).map((x, j) => (j === i ? { ...x, index: v } : x)) }))} />
                    <PhotoButton label={`Photo du compteur ${m.label}`} count={m.photoId ? 1 : 0} onPhotos={(ids) => update((d) => ({ ...d, meters: (d.meters ?? []).map((x, j) => (j === i ? { ...x, photoId: ids[0] } : x)) }))} />
                  </div>
                ) : null}
                {!m.notApplicable ? <Input label="Numéro du compteur (facultatif)" value={m.number ?? ''} onChange={(v) => update((d) => ({ ...d, meters: (d.meters ?? []).map((x, j) => (j === i ? { ...x, number: v } : x)) }))} /> : null}
                {m.photoId ? <AuthImage id={m.photoId} alt="Photo du compteur" size={96} onRemove={() => update((d) => ({ ...d, meters: (d.meters ?? []).map((x, j) => (j === i ? { ...x, photoId: null } : x)) }))} /> : null}
                <button type="button" onClick={() => update((d) => ({ ...d, meters: (d.meters ?? []).map((x, j) => (j === i ? { ...x, notApplicable: !x.notApplicable } : x)) }))} style={linkBtn}>
                  {m.notApplicable ? 'Ce compteur existe' : 'Pas de compteur de ce type'}
                </button>
              </Box>
            ))}
            <Box gap={10}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Chauffage et eau chaude</span>
              <StateChips value={data.heating?.state ?? null} onChange={(v) => update((d) => ({ ...d, heating: { ...(d.heating ?? {}), state: v } }))} />
              <Input label="Dernier entretien de la chaudière" type="date" value={data.heating?.lastMaintenance ?? ''} onChange={(v) => update((d) => ({ ...d, heating: { ...(d.heating ?? {}), lastMaintenance: v || null } }))} />
            </Box>
          </Page>
        ) : null}

        {screen.s === 'rooms' ? (
          <Page
            title="Les pièces"
            action={
              nextRoom() >= 0 ? (
                <Btn size="lg" full onClick={() => go({ s: 'room', i: nextRoom() })}>
                  Ouvrir {rooms[nextRoom()]?.name.toLowerCase()}
                </Btn>
              ) : (
                <Btn size="lg" full onClick={() => go({ s: 'keys' })}>
                  Passer aux clés
                </Btn>
              )
            }
          >
            {rooms.map((r, i) => {
              const started = r.items.some((it) => it.state)
              return (
                <button key={`${r.name}-${i}`} type="button" onClick={() => go({ s: 'room', i })} style={rowBtn}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{r.name}</span>
                  <Pill tone={r.done ? 'green' : started ? 'owner' : 'ink'}>{r.done ? 'Fait' : started ? 'En cours' : 'À faire'}</Pill>
                </button>
              )
            })}
            {hasFurniture ? (
              <button type="button" onClick={() => go({ s: 'furniture' })} style={rowBtn}>
                <span style={{ fontSize: 16, fontWeight: 600 }}>Mobilier</span>
                <Pill tone={(data.furniture ?? []).every((f) => f.state) ? 'green' : 'ink'}>{(data.furniture ?? []).every((f) => f.state) ? 'Fait' : 'À faire'}</Pill>
              </button>
            ) : null}
            <button
              type="button"
              style={linkBtn}
              onClick={() => {
                const name = window.prompt('Nom de la pièce (par exemple : Chambre 3, Buanderie)')?.trim()
                if (!name) return
                update((d) => ({ ...d, rooms: [...(d.rooms ?? []), { name, done: false, items: itemsForRoom(name).map((label) => ({ label })) }] }))
              }}
            >
              + Ajouter une pièce
            </button>
          </Page>
        ) : null}

        {screen.s === 'room' && rooms[screen.i] ? (
          <RoomScreen
            key={screen.i}
            room={rooms[screen.i]}
            previous={exit}
            entry={(label) => inv.comparison?.items[inventoryItemKey(rooms[screen.i].name, label)] ?? null}
            hasEntry={Boolean(inv.comparison?.hasEntry)}
            onChange={(r) => update((d) => ({ ...d, rooms: (d.rooms ?? []).map((x, j) => (j === screen.i ? r : x)) }))}
            onNext={() => {
              update((d) => ({ ...d, rooms: (d.rooms ?? []).map((x, j) => (j === screen.i ? { ...x, done: true } : x)) }))
              const n = rooms.findIndex((r, j) => j !== screen.i && !r.done && j > screen.i)
              const any = n >= 0 ? n : rooms.findIndex((r, j) => j !== screen.i && !r.done)
              void go(any >= 0 ? { s: 'room', i: any } : { s: 'rooms' })
            }}
            onRemove={() => {
              if (!window.confirm(`Retirer la pièce « ${rooms[screen.i].name} » ?`)) return
              update((d) => ({ ...d, rooms: (d.rooms ?? []).filter((_, j) => j !== screen.i) }))
              void go({ s: 'rooms' })
            }}
            nextLabel={rooms.some((r, j) => j !== screen.i && !r.done) ? 'Pièce suivante' : 'Terminer les pièces'}
          />
        ) : null}

        {screen.s === 'furniture' ? (
          <Page title="Le mobilier" action={<Btn size="lg" full onClick={() => go({ s: 'rooms' })}>Terminer le mobilier</Btn>}>
            {(data.furniture ?? []).map((f, i) => (
              <Box key={i} gap={10}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>
                  {f.item} {f.count > 1 ? `(${f.count})` : ''}
                </span>
                <StateChips value={f.state ?? null} onChange={(v) => update((d) => ({ ...d, furniture: (d.furniture ?? []).map((x, j) => (j === i ? { ...x, state: v } : x)) }))} />
              </Box>
            ))}
          </Page>
        ) : null}

        {screen.s === 'keys' ? (
          <Page title="Les clés remises" action={<Btn size="lg" full onClick={() => go({ s: 'sign' })}>Passer aux signatures</Btn>}>
            {(data.keys ?? []).map((k, i) => (
              <Box key={i} row>
                <span style={{ fontSize: 16, fontWeight: 600 }}>{k.type}</span>
                <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <Round label="Moins" onClick={() => update((d) => ({ ...d, keys: (d.keys ?? []).map((x, j) => (j === i ? { ...x, count: Math.max(0, x.count - 1) } : x)) }))}>
                    -
                  </Round>
                  <span style={{ fontSize: 18, fontWeight: 700, width: 18, textAlign: 'center' }}>{k.count}</span>
                  <Round label="Plus" onClick={() => update((d) => ({ ...d, keys: (d.keys ?? []).map((x, j) => (j === i ? { ...x, count: Math.min(99, x.count + 1) } : x)) }))}>
                    +
                  </Round>
                </span>
              </Box>
            ))}
            <button
              type="button"
              style={linkBtn}
              onClick={() => {
                const type = window.prompt('Quelle clé ou quel badge ? (par exemple : Portail, Télécommande, Cave)')?.trim()
                if (type) update((d) => ({ ...d, keys: [...(d.keys ?? []), { type, count: 1 }] }))
              }}
            >
              + Ajouter une clé ou un badge
            </button>
          </Page>
        ) : null}

        {screen.s === 'sign' ? (
          <Page title="Les signatures" action={<Btn size="lg" full onClick={finish}>Terminer et créer le PDF</Btn>}>
            {exit ? <Input label="Nouvelle adresse du locataire" value={data.newAddress ?? ''} onChange={(v) => update((d) => ({ ...d, newAddress: v }))} hint="Obligatoire : elle sert à restituer le dépôt de garantie." /> : null}
            <TextArea label="Remarques générales (facultatif)" value={data.notes ?? ''} onChange={(v) => update((d) => ({ ...d, notes: v || null }))} rows={2} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{inv.landlordName || 'Le bailleur'}, bailleur</span>
              <SignaturePad value={data.signatures?.landlord} onChange={(v) => update((d) => ({ ...d, signatures: { ...(d.signatures ?? {}), landlord: v } }))} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>{inv.tenantName || 'Le locataire'}, locataire</span>
              <SignaturePad value={data.signatures?.tenant} onChange={(v) => update((d) => ({ ...d, signatures: { ...(d.signatures ?? {}), tenant: v } }))} />
            </div>
            <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>Une fois signé, l’état des lieux ne peut plus être modifié. Chacun en reçoit un exemplaire par email.</span>
          </Page>
        ) : null}

        {screen.s === 'done' ? (
          <Page
            title="C’est signé."
            action={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Btn size="lg" full variant={(data.complements ?? []).some((c) => c.status === 'PENDING') ? 'outline' : 'primary'} onClick={() => openDoc(`/inventories/${inv.id}/pdf`).catch(toast.error)}>
                  Ouvrir le PDF
                </Btn>
                <Btn size="lg" full variant="outline" onClick={() => navigate(`/espace/baux/${inv.lease.id}`)}>
                  Retour au bail
                </Btn>
              </div>
            }
          >
            <span style={{ fontSize: 16, color: BAI.inkMid, lineHeight: 1.5 }}>L’état des lieux {exit ? 'de sortie' : 'd’entrée'} de {inv.property.name} est enregistré dans vos documents, avec les photos.{exit ? ' Il ne peut plus être modifié.' : ' Votre locataire peut demander à le compléter dans les 10 jours : vous déciderez.'}</span>
            {exit ? <Callout tone="tip">Prochaine étape : restituer le dépôt de garantie, dans un mois si tout est conforme, deux mois sinon.</Callout> : null}
            {!exit ? <Complements invId={inv.id} items={data.complements ?? []} onDecided={(c) => setData((d) => ({ ...d, complements: (d.complements ?? []).map((x) => (x.id === c.id ? c : x)) }))} /> : null}
          </Page>
        ) : null}
      </main>
    </div>
  )
}

const linkBtn = { alignSelf: 'flex-start', background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 15, fontWeight: 600, color: BAI.owner, cursor: 'pointer' } as const
const rowBtn = { background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 14, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'inherit', color: BAI.ink, cursor: 'pointer', textAlign: 'left' } as const

function Page({ title, children, action }: { title?: string; children: ReactNode; action: ReactNode }) {
  return (
    <>
      {title ? <h1 style={display(36)}>{title}</h1> : null}
      {children}
      <div style={{ flexGrow: 1, minHeight: 12 }} />
      <div style={{ position: 'sticky', bottom: 12 }}>{action}</div>
    </>
  )
}

function Box({ children, gap = 10, row }: { children: ReactNode; gap?: number; row?: boolean }) {
  return <div style={{ background: BAI.surface, border: `1px solid ${BAI.divider}`, borderRadius: 14, padding: row ? '14px 16px' : 14, display: 'flex', flexDirection: row ? 'row' : 'column', justifyContent: row ? 'space-between' : undefined, alignItems: row ? 'center' : undefined, gap, fontSize: 15 }}>{children}</div>
}

function Round({ children, onClick, label }: { children: string; onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={{ width: 40, height: 40, borderRadius: 20, border: `1.5px solid ${BAI.borderStrong}`, background: BAI.surface, fontSize: 20, cursor: 'pointer', color: BAI.ink }}>
      {children}
    </button>
  )
}

function StateChips({ value, onChange }: { value: ItemState | null; onChange: (v: ItemState) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {STATES.map((s) => (
        <button
          key={s}
          type="button"
          aria-pressed={value === s}
          onClick={() => onChange(s)}
          style={{ flex: '1 1 auto', minWidth: 0, padding: '0 8px', height: 40, border: value === s ? `2px solid ${BAI.owner}` : `1.5px solid ${BAI.borderStrong}`, background: value === s ? BAI.ownerLight : BAI.surface, color: value === s ? BAI.owner : BAI.ink, fontFamily: 'inherit', fontSize: 13, fontWeight: value === s ? 700 : 500, borderRadius: 10, cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}

type Room = NonNullable<InventoryData['rooms']>[number]

type EntryItem = NonNullable<InventoryView['comparison']>['items'][string]

function RoomScreen({ room, onChange, onNext, onRemove, nextLabel, previous, entry, hasEntry }: { room: Room; onChange: (r: Room) => void; onNext: () => void; onRemove: () => void; nextLabel: string; previous: boolean; entry: (label: string) => EntryItem | null; hasEntry: boolean }) {
  const [notes, setNotes] = useState<Record<number, boolean>>({})
  const setItem = (i: number, patch: Partial<Room['items'][number]>) => onChange({ ...room, items: room.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  const allSet = room.items.every((it) => it.state)
  return (
    <Page
      title={room.name}
      action={
        <Btn size="lg" full onClick={onNext}>
          {nextLabel}
        </Btn>
      }
    >
      {previous ? (
        <span style={{ fontSize: 14, color: BAI.inkSoft, lineHeight: 1.45 }}>
          {hasEntry ? 'Sous chaque élément : son état à l’entrée. Indiquez l’état d’aujourd’hui ; Bailio signale ce qui a changé.' : 'Aucun état des lieux d’entrée dans Bailio : comparez avec votre exemplaire papier.'}
        </span>
      ) : null}
      <Box gap={10}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>Vue d’ensemble</span>
            <span style={{ fontSize: 13, color: BAI.inkSoft }}>Une ou deux photos de toute la pièce, depuis la porte.</span>
          </span>
          <PhotoButton label={`Photo d’ensemble : ${room.name}`} count={room.photoIds?.length ?? 0} onPhotos={(ids) => onChange({ ...room, photoIds: [...(room.photoIds ?? []), ...ids].slice(0, 10) })} />
        </div>
        {room.photoIds?.length ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {room.photoIds.map((p) => (
              <AuthImage key={p} id={p} alt={`Vue d’ensemble : ${room.name}`} size={64} onRemove={() => onChange({ ...room, photoIds: (room.photoIds ?? []).filter((x) => x !== p) })} />
            ))}
          </div>
        ) : null}
      </Box>
      {room.items.map((it, i) => (
        <Box key={`${it.label}-${i}`} gap={10}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{it.label}</span>
            <PhotoButton label={`Photo : ${it.label}`} count={it.photoIds?.length ?? 0} onPhotos={(ids) => setItem(i, { photoIds: [...(it.photoIds ?? []), ...ids].slice(0, 20) })} />
          </div>
          {previous && hasEntry ? <EntryLine e={entry(it.label)} exitState={it.state ?? null} /> : null}
          <StateChips value={it.state ?? null} onChange={(v) => setItem(i, { state: v })} />
          {it.photoIds?.length ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {it.photoIds.map((p) => (
                <AuthImage key={p} id={p} alt="Photo de l’élément" size={64} onRemove={() => setItem(i, { photoIds: (it.photoIds ?? []).filter((x) => x !== p) })} />
              ))}
            </div>
          ) : null}
          {notes[i] || it.note ? (
            <Input label="Remarque" value={it.note ?? ''} onChange={(v) => setItem(i, { note: v || null })} placeholder="Rayure de 10 cm près de la fenêtre" />
          ) : (
            <button type="button" style={{ ...linkBtn, fontSize: 14 }} onClick={() => setNotes((n) => ({ ...n, [i]: true }))}>
              Ajouter une remarque
            </button>
          )}
        </Box>
      ))}
      <button
        type="button"
        style={linkBtn}
        onClick={() => {
          const label = window.prompt('Élément à ajouter (par exemple : Placard, Store, Cheminée)')?.trim()
          if (label) onChange({ ...room, items: [...room.items, { label }] })
        }}
      >
        + Ajouter un élément
      </button>
      {!allSet ? <span style={{ fontSize: 13, color: BAI.inkSoft }}>Un élément sans état est noté « non vérifié » dans le PDF.</span> : null}
      <button type="button" style={{ ...linkBtn, color: BAI.error, fontSize: 14 }} onClick={onRemove}>
        Retirer cette pièce
      </button>
    </Page>
  )
}

type Complement = NonNullable<InventoryData['complements']>[number]

/**
 * Demandes du locataire pour compléter l'état des lieux d'entrée (article 3-2) : une à la fois, accepter (ajoutée au
 * PDF, envoyé aux deux parties) ou refuser avec un motif (le locataire peut saisir la commission de conciliation).
 */
function Complements({ invId, items, onDecided }: { invId: string; items: Complement[]; onDecided: (c: Complement) => void }) {
  const toast = useToast()
  const [refusing, setRefusing] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const pending = items.find((c) => c.status === 'PENDING')
  const decided = items.filter((c) => c.status !== 'PENDING')
  const decide = async (accept: boolean) => {
    if (!pending) return
    if (!accept && !reason.trim()) return toast.show('Indiquez en une phrase pourquoi vous refusez.', 'error')
    setBusy(true)
    try {
      const r = await api<{ status: Complement['status'] }>(`/inventories/${invId}/complements/${pending.id}`, { method: 'POST', body: accept ? { accept } : { accept, reason: reason.trim() }, timeout: 90_000 })
      onDecided({ ...pending, status: r.status, decidedAt: new Date().toISOString(), reason: accept ? null : reason.trim() })
      toast.show(accept ? 'Ajouté à l’état des lieux. Le nouveau PDF est envoyé à votre locataire et à vous.' : 'Refus envoyé à votre locataire, avec votre motif.')
      setRefusing(false)
      setReason('')
    } catch (e) {
      toast.error(e)
    } finally {
      setBusy(false)
    }
  }
  if (!items.length) return null
  return (
    <>
      {pending ? (
        <Box gap={12}>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: BAI.caramelInk }}>Demande de votre locataire</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            {pending.heating ? 'Compléter le chauffage' : 'Compléter l’état des lieux'}, le {dateFr(pending.at.slice(0, 10))}
          </span>
          <span style={{ fontSize: 15, lineHeight: 1.5 }}>« {pending.text} »</span>
          {pending.photoIds.length ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pending.photoIds.map((p, n) => (
                <AuthImage key={p} id={p} alt={`Photo ${n + 1} envoyée par le locataire`} size={88} />
              ))}
            </div>
          ) : null}
          <span style={{ fontSize: 13, color: BAI.inkSoft, lineHeight: 1.45 }}>La loi permet au locataire de demander à compléter l’état des lieux d’entrée dans les 10 jours, et pour le chauffage pendant le premier mois de chauffe. Si vous refusez, il peut saisir la commission départementale de conciliation.</span>
          {refusing ? (
            <>
              <TextArea label="Pourquoi refusez-vous ?" value={reason} onChange={setReason} rows={2} hint="Votre locataire recevra ce motif." />
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <Btn variant="outline" onClick={() => void decide(false)} loading={busy}>
                  Envoyer le refus
                </Btn>
                <button type="button" style={linkBtn} onClick={() => setRefusing(false)}>
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn onClick={() => void decide(true)} loading={busy}>
                Ajouter à l’état des lieux
              </Btn>
              <button type="button" style={linkBtn} onClick={() => setRefusing(true)}>
                Refuser
              </button>
            </div>
          )}
        </Box>
      ) : null}
      {decided.map((c) => (
        <span key={c.id} style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.45 }}>
          Demande du {dateFr(c.at.slice(0, 10))} : {c.status === 'ACCEPTED' ? 'ajoutée à l’état des lieux' : `refusée (${c.reason ?? ''})`}.
        </span>
      ))}
    </>
  )
}

/** Sortie : état et photos relevés à l'entrée, puis l'évolution dès que l'état du jour est choisi. */
function EntryLine({ e, exitState }: { e: EntryItem | null; exitState: ItemState | null }) {
  if (!e?.entryState) return <span style={{ fontSize: 13, color: BAI.inkSoft }}>Pas relevé à l’entrée.</span>
  const change = stateChange(e.entryState, exitState)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 14, color: BAI.inkMid }}>
          À l’entrée : <strong>{e.entryState}</strong>
          {e.entryNote ? `, ${e.entryNote}` : ''}
        </span>
        {change === 'WORSE' ? <Pill tone="caramel">À regarder</Pill> : change === 'SAME' ? <Pill tone="green">Identique</Pill> : change === 'BETTER' ? <Pill tone="green">Meilleur</Pill> : null}
      </div>
      {e.entryPhotoIds.length ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {e.entryPhotoIds.slice(0, 4).map((p, n) => (
            <AuthImage key={p} id={p} alt={`Photo ${n + 1} de l’entrée`} size={48} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
