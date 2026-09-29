import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BAI } from './constants/bailio-tokens'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DraftProvider, useDraft } from './lib/draft'
import Home from './pages/Home'

const TypeStep = lazy(() => import('./pages/tunnel/TypeStep'))
const LogementStep = lazy(() => import('./pages/tunnel/LogementStep'))
const PersonnesStep = lazy(() => import('./pages/tunnel/PersonnesStep'))
const LoyerStep = lazy(() => import('./pages/tunnel/LoyerStep'))
const RelectureStep = lazy(() => import('./pages/tunnel/RelectureStep'))
const RecevoirStep = lazy(() => import('./pages/tunnel/RecevoirStep'))
const Importer = lazy(() => import('./pages/Importer'))
const Reprendre = lazy(() => import('./pages/Reprendre'))
const Bienvenue = lazy(() => import('./pages/Bienvenue'))
const Connexion = lazy(() => import('./pages/Connexion'))
const ConnexionLien = lazy(() => import('./pages/Connexion').then((m) => ({ default: m.ConnexionLien })))
const Aujourdhui = lazy(() => import('./pages/espace/Aujourdhui'))
const Bail = lazy(() => import('./pages/espace/Bail'))
const Compte = lazy(() => import('./pages/espace/Compte'))
const legal = () => import('./pages/legal/Legal')
const MentionsLegales = lazy(() => legal().then((m) => ({ default: m.MentionsLegales })))
const Conditions = lazy(() => legal().then((m) => ({ default: m.Conditions })))
const Confidentialite = lazy(() => legal().then((m) => ({ default: m.Confidentialite })))
const Contact = lazy(() => legal().then((m) => ({ default: m.Contact })))
const NotFound = lazy(() => legal().then((m) => ({ default: m.NotFound })))

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BAI.bg }}>
      <Spinner size={28} />
    </div>
  )
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/connexion" replace state={{ from: location.pathname }} />
  return <>{children}</>
}

/** Les étapes du tunnel attendent que le brouillon enregistré soit rechargé. */
function DraftReady({ children }: { children: ReactNode }) {
  const { ready } = useDraft()
  return ready ? <>{children}</> : <Loading />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DraftProvider>
          <ScrollToTop />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/commencer" element={<DraftReady><TypeStep /></DraftReady>} />
              <Route path="/commencer/logement" element={<DraftReady><LogementStep /></DraftReady>} />
              <Route path="/commencer/personnes" element={<DraftReady><PersonnesStep /></DraftReady>} />
              <Route path="/commencer/loyer" element={<DraftReady><LoyerStep /></DraftReady>} />
              <Route path="/commencer/relecture" element={<DraftReady><RelectureStep /></DraftReady>} />
              <Route path="/commencer/recevoir" element={<DraftReady><RecevoirStep /></DraftReady>} />
              <Route path="/importer" element={<Importer />} />
              <Route path="/reprendre" element={<Reprendre />} />
              <Route path="/connexion" element={<Connexion />} />
              <Route path="/connexion/lien" element={<ConnexionLien />} />
              <Route path="/bienvenue/:leaseId" element={<RequireAuth><Bienvenue /></RequireAuth>} />
              <Route path="/espace" element={<RequireAuth><Aujourdhui /></RequireAuth>} />
              <Route path="/espace/baux/:id" element={<RequireAuth><Bail /></RequireAuth>} />
              <Route path="/espace/compte" element={<RequireAuth><Compte /></RequireAuth>} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/conditions" element={<Conditions />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </DraftProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
