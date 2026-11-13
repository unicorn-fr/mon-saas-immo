import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from './Logo'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { initialsOf } from '../lib/contract'
import type { TodayView } from '../lib/space'
import { ROLE_LABEL, ROLE_RIGHTS, getSpace, switchSpace } from '../lib/shared'
import { Euro, Home, Page, People, Plus, Sun, Signpost, Book, TabIcon, type TabName } from './Icons'
import { Modal } from './kit'
import { FeedbackModal } from './Feedback'

/**
 * Espace propriétaire : menu latéral sombre sur ordinateur (maquette « Aujourd'hui »),
 * barre du bas avec bouton « Ajouter » sur téléphone (maquette « Aujourd'hui sur mobile »).
 */

interface SpaceState {
  taskCount: number | null
  setTaskCount: (n: number) => void
  openAdd: () => void
}
const SpaceContext = createContext<SpaceState | null>(null)

export function useSpace(): SpaceState {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace hors AppShell')
  return ctx
}

const NAV = [
  { to: '/espace', label: 'Aujourd’hui', end: true, icon: Sun },
  { to: '/espace/logements', label: 'Logements', icon: Home },
  { to: '/espace/locataires', label: 'Locataires', icon: People },
  { to: '/espace/documents', label: 'Documents', icon: Page },
  { to: '/espace/argent', label: 'Argent', icon: Euro },
  { to: '/espace/carnet', label: 'Carnet', icon: Book },
  { to: '/espace/situations', label: 'Que se passe-t-il ?', icon: Signpost },
]

export function AppShell({ children }: { children: ReactNode }) {
  const [taskCount, setTaskCount] = useState<number | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [feedback, setFeedback] = useState(false)
  const { pathname } = useLocation()

  // Le nombre d'actions du jour s'affiche dans le menu ; la page « Aujourd'hui » le met à jour elle-même.
  useEffect(() => {
    if (taskCount !== null || pathname === '/espace') return
    api<TodayView>('/today')
      .then((t) => setTaskCount(t.tasks.length))
      .catch(() => undefined)
  }, [taskCount, pathname])

  const openAdd = useCallback(() => setAddOpen(true), [])
  const value = useMemo(() => ({ taskCount, setTaskCount, openAdd }), [taskCount, openAdd])
  const space = getSpace()
  // Un intervenant n'a que sa fiche d'intervention.
  if (space?.role === 'CONTRACTOR') return <Navigate to="/espace/partage" replace />

  return (
    <SpaceContext.Provider value={value}>
      <div className="shell" style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex' }}>
        <Sidebar taskCount={taskCount} onAdd={openAdd} onFeedback={() => setFeedback(true)} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <MobileHeader />
          {space ? (
            <div role="status" style={{ background: BAI.night, color: BAI.surface, padding: '10px clamp(16px, 3vw, 32px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontSize: 14 }}>
              <span>
                Espace de <strong>{space.ownerName}</strong> · {ROLE_LABEL[space.role]}. {ROLE_RIGHTS[space.role]}
              </span>
              <button type="button" onClick={() => switchSpace(null)} style={{ background: 'none', border: `1px solid ${BAI.nightLine}`, borderRadius: 10, color: BAI.surface, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '6px 12px', cursor: 'pointer' }}>
                Revenir à mon espace
              </button>
            </div>
          ) : null}
          <main className="shell-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: 1240, margin: '0 auto' }}>
            {children}
          </main>
        </div>
        <BottomNav onAdd={openAdd} />
        <AddMenu open={addOpen} onClose={() => setAddOpen(false)} />
        {/* Hors de la barre latérale : sa position collante l'enfermerait sous le contenu de la page. */}
        <FeedbackModal open={feedback} onClose={() => setFeedback(false)} />
      </div>
    </SpaceContext.Provider>
  )
}

function Sidebar({ taskCount, onAdd, onFeedback }: { taskCount: number | null; onAdd: () => void; onFeedback: () => void }) {
  const { user } = useAuth()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  return (
    <nav aria-label="Navigation principale" className="sidebar" style={{ width: 256, flexShrink: 0, background: BAI.side, display: 'flex', flexDirection: 'column', gap: 24, padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
      <div style={{ padding: '0 8px' }}>
        <Logo size={28} to="/espace" onBlue />
      </div>
      <button type="button" className="side-add" onClick={onAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 46, borderRadius: BAI.radiusBtn, background: BAI.surface, color: BAI.owner, border: 'none', fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        <Plus />
        Ajouter
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className="side-link"
            style={({ isActive }) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 700 : 500, background: isActive ? BAI.sideActive : 'transparent', color: BAI.surface })}
          >
            <n.icon size={19} />
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.end && taskCount ? <span style={{ background: BAI.surface, color: BAI.owner, fontSize: 12.5, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>{taskCount}</span> : null}
          </NavLink>
        ))}
      </div>
      <div style={{ flexGrow: 1 }} />
      <button type="button" className="side-link" onClick={onFeedback} style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'transparent', border: `1px solid ${BAI.sideLine}`, color: BAI.surface, fontFamily: 'inherit', fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}>
        Votre avis
      </button>
      <Link to="/espace/compte" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 8px 0', borderTop: `1px solid ${BAI.sideLine}`, textDecoration: 'none' }}>
        <span style={{ width: 38, height: 38, borderRadius: 19, background: BAI.surface, color: BAI.owner, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>{initialsOf(name)}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ color: BAI.surface, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <span style={{ color: BAI.surface, fontSize: 13 }}>Mon compte</span>
        </span>
      </Link>
    </nav>
  )
}

function MobileHeader() {
  const { user } = useAuth()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  const round = { width: 44, height: 44, borderRadius: 22, border: `1px solid ${BAI.border}`, background: BAI.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', color: BAI.ink, textDecoration: 'none' } as const
  return (
    <header className="mobile-only" style={{ padding: '20px 22px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Logo size={26} to="/espace" />
      <div style={{ display: 'flex', gap: 8 }}>
        <Link to="/espace/locataires" aria-label="Locataires" style={round}>
          <People size={20} />
        </Link>
        <Link to="/espace/compte" aria-label="Mon compte" style={{ ...round, fontSize: 14, fontWeight: 700, color: BAI.owner }}>
          {initialsOf(name)}
        </Link>
      </div>
    </header>
  )
}

/**
 * Barre du bas (téléphone) : barre claire, cinq onglets de même construction (icône puis libellé). L'onglet actif
 * prend une pastille de couleur douce derrière son icône ; « Ajouter », l'action principale, est la seule en bleu plein.
 */
const TABS: Array<{ to: string; label: string; end?: boolean; icon: TabName }> = [
  { to: '/espace', label: 'Aujourd’hui', end: true, icon: 'today' },
  { to: '/espace/logements', label: 'Logements', icon: 'homes' },
  { to: '/espace/documents', label: 'Documents', icon: 'docs' },
  { to: '/espace/argent', label: 'Argent', icon: 'money' },
]

const tabStyle = { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 56, textDecoration: 'none', fontSize: 12, letterSpacing: '0.01em', background: 'none', border: 'none', fontFamily: 'inherit', cursor: 'pointer', padding: 0 } as const
const pill = (active: boolean, accent = false) => ({ width: 56, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', background: accent ? BAI.cta : active ? BAI.ownerTint : 'transparent', color: accent ? BAI.ctaInk : active ? BAI.owner : BAI.inkSoft, transition: 'background-color .18s ease, color .18s ease' })

function BottomNav({ onAdd }: { onAdd: () => void }) {
  const tab = (t: (typeof TABS)[number]) => (
    <NavLink key={t.to} to={t.to} end={t.end} style={({ isActive }) => ({ ...tabStyle, color: isActive ? BAI.owner : BAI.inkSoft, fontWeight: isActive ? 700 : 500 })}>
      {({ isActive }) => (
        <>
          <span style={pill(isActive)}>
            <TabIcon name={t.icon} active={isActive} />
          </span>
          {t.label}
        </>
      )}
    </NavLink>
  )
  return (
    <nav aria-label="Navigation principale" className="mobile-only bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box', background: BAI.surface, borderTop: `1px solid ${BAI.divider}`, display: 'flex', alignItems: 'stretch', padding: '6px 6px calc(6px + env(safe-area-inset-bottom))' }}>
      {tab(TABS[0])}
      {tab(TABS[1])}
      <button type="button" onClick={onAdd} style={{ ...tabStyle, color: BAI.ink, fontWeight: 600 }}>
        <span style={pill(false, true)}>
          <TabIcon name="add" />
        </span>
        Ajouter
      </button>
      {tab(TABS[2])}
      {tab(TABS[3])}
    </nav>
  )
}

const ADD_ITEMS = [
  { to: '/espace/logements/nouveau', title: 'Un logement', text: 'Quelques questions simples, une à la fois.' },
  { to: '/espace/locataires/nouveau', title: 'Un locataire', text: 'Son identité, son garant, ses justificatifs.' },
  { to: '/espace/baux/nouveau', title: 'Un bail', text: 'Bailio ne demande que ce qu’il ne sait pas.' },
  { to: '/espace/argent/facture', title: 'Une facture ou une dépense', text: 'En photo : Bailio la lit et la range.' },
  { to: '/espace/documents?ajouter=1', title: 'Un document', text: 'Diagnostic, attestation, courrier reçu.' },
  { to: '/importer', title: 'Un bail déjà signé', text: 'Une photo suffit. Bailio remplit tout.' },
]

function AddMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <Modal open={open} onClose={onClose} title="Ajouter" width={640}>
      <div className="grid-2" style={{ gap: 12 }}>
        {ADD_ITEMS.map((it) => (
          <button
            key={it.to}
            type="button"
            onClick={() => {
              onClose()
              navigate(it.to)
            }}
            style={{ textAlign: 'left', border: `1px solid ${BAI.divider}`, background: BAI.surface, borderRadius: 16, padding: '18px 18px', fontFamily: 'inherit', color: BAI.ink, display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 17, fontWeight: 700 }}>{it.title}</span>
            <span style={{ fontSize: 14, color: BAI.inkMid, lineHeight: 1.45 }}>{it.text}</span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
