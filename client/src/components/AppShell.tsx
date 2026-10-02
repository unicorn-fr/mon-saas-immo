import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { BAI } from '../constants/bailio-tokens'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { initialsOf } from '../lib/contract'
import type { TodayView } from '../lib/space'
import { Euro, Home, Page, People, Plus, Sun, Signpost, Book } from './Icons'
import { Modal } from './kit'

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

  return (
    <SpaceContext.Provider value={value}>
      <div className="shell" style={{ minHeight: '100vh', background: BAI.bg, color: BAI.ink, display: 'flex' }}>
        <Sidebar taskCount={taskCount} onAdd={openAdd} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <MobileHeader />
          <main className="shell-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, width: '100%', maxWidth: 1240, margin: '0 auto' }}>
            {children}
          </main>
        </div>
        <BottomNav onAdd={openAdd} />
        <AddMenu open={addOpen} onClose={() => setAddOpen(false)} />
      </div>
    </SpaceContext.Provider>
  )
}

function Sidebar({ taskCount, onAdd }: { taskCount: number | null; onAdd: () => void }) {
  const { user } = useAuth()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  return (
    <nav aria-label="Navigation principale" className="sidebar" style={{ width: 248, flexShrink: 0, background: BAI.night, display: 'flex', flexDirection: 'column', gap: 32, padding: '32px 20px', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
      <Link to="/espace" style={{ textDecoration: 'none', fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: BAI.caramel, padding: '0 10px' }}>
        Bailio
      </Link>
      <button type="button" onClick={onAdd} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, background: BAI.caramel, color: BAI.night, border: 'none', fontFamily: 'inherit', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
        <Plus />
        Ajouter
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            style={({ isActive }) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 10, textDecoration: 'none', fontSize: 15, fontWeight: isActive ? 600 : 500, background: isActive ? BAI.nightActive : 'transparent', color: isActive ? BAI.surface : BAI.onDarkNav })}
          >
            <span>{n.label}</span>
            {n.end && taskCount ? <span style={{ background: BAI.caramel, color: BAI.night, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>{taskCount}</span> : null}
          </NavLink>
        ))}
      </div>
      <div style={{ flexGrow: 1 }} />
      <Link to="/espace/compte" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 10px 0', borderTop: `1px solid ${BAI.nightSoft}`, textDecoration: 'none' }}>
        <span style={{ width: 40, height: 40, borderRadius: 20, background: BAI.nightSoft, color: BAI.caramel, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{initialsOf(name)}</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ color: BAI.surface, fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
          <span style={{ color: BAI.onDarkMuted, fontSize: 13 }}>Mon compte</span>
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
      <Link to="/espace" style={{ fontFamily: BAI.fontDisplay, fontStyle: 'italic', fontWeight: 700, fontSize: 28, color: BAI.ink, textDecoration: 'none' }}>
        Bailio
      </Link>
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

function BottomNav({ onAdd }: { onAdd: () => void }) {
  const items = [NAV[0], NAV[1], null, NAV[3], NAV[4]]
  return (
    <nav aria-label="Navigation principale" className="mobile-only bottom-nav" style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, height: 'calc(76px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)', boxSizing: 'border-box', background: BAI.night, display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
      {items.map((n) =>
        n ? (
          <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({ textDecoration: 'none', color: isActive ? BAI.surface : BAI.onDarkMuted, fontSize: 12, fontWeight: isActive ? 700 : 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 60 })}>
            {({ isActive }) => (
              <>
                <n.icon color={isActive ? BAI.caramel : 'currentColor'} />
                {n.label}
              </>
            )}
          </NavLink>
        ) : (
          <button key="add" type="button" aria-label="Ajouter" onClick={onAdd} style={{ width: 56, height: 56, borderRadius: 28, background: BAI.caramel, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -24, cursor: 'pointer', color: BAI.night }}>
            <Plus size={26} strokeWidth={2.4} />
          </button>
        ),
      )}
    </nav>
  )
}

const ADD_ITEMS = [
  { to: '/espace/logements/nouveau', title: 'Un logement', text: 'Quelques questions simples, une à la fois.' },
  { to: '/espace/locataires/nouveau', title: 'Un locataire', text: 'Son identité, son garant, ses justificatifs.' },
  { to: '/espace/baux/nouveau', title: 'Un bail', text: 'Bailio vous demande seulement ce qu’il ne sait pas.' },
  { to: '/espace/argent/facture', title: 'Une facture ou une dépense', text: 'En photo : Bailio la lit et la range dans le bon logement.' },
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
