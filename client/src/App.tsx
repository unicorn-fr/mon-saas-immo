import { Suspense, useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BAI } from './constants/bailio-tokens'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/kit'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DraftProvider, useDraft } from './lib/draft'
import { lazyPage as lazy } from './lib/lazyPage'
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
const Inscription = lazy(() => import('./pages/Connexion').then((m) => ({ default: m.Inscription })))
const ConnexionLien = lazy(() => import('./pages/Connexion').then((m) => ({ default: m.ConnexionLien })))
const Aujourdhui = lazy(() => import('./pages/espace/Aujourdhui'))
const Logements = lazy(() => import('./pages/espace/Logements'))
const Logement = lazy(() => import('./pages/espace/Logement'))
const Locataires = lazy(() => import('./pages/espace/Locataires'))
const Locataire = lazy(() => import('./pages/espace/Locataire'))
const Documents = lazy(() => import('./pages/espace/Documents'))
const Argent = lazy(() => import('./pages/espace/Argent'))
const FactureAjout = lazy(() => import('./pages/espace/Facture').then((m) => ({ default: m.FactureAjout })))
const FactureVerifier = lazy(() => import('./pages/espace/Facture').then((m) => ({ default: m.FactureVerifier })))
const Bail = lazy(() => import('./pages/espace/Bail'))
const AjoutLogement = lazy(() => import('./pages/espace/parcours/AjoutLogement'))
const AjoutLocataire = lazy(() => import('./pages/espace/parcours/AjoutLocataire'))
const CreationBail = lazy(() => import('./pages/espace/parcours/CreationBail'))
const FicheBailleur = lazy(() => import('./pages/espace/fiches/FicheBailleur'))
const FicheLogement = lazy(() => import('./pages/espace/fiches/FicheLogement'))
const FicheLocataire = lazy(() => import('./pages/espace/fiches/FicheLocataire'))
const ActeCaution = lazy(() => import('./pages/espace/fiches/ActeCaution'))
const Contrat = lazy(() => import('./pages/espace/fiches/Contrat'))
const Courriers = lazy(() => import('./pages/espace/Courriers'))
const EtatDesLieux = lazy(() => import('./pages/espace/EtatDesLieux'))
const Edl = lazy(() => import('./pages/Edl'))
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
          <ToastProvider>
            <ScrollToTop />
            <Pages />
          </ToastProvider>
        </DraftProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

function Pages() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
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
              <Route path="/inscription" element={<Inscription />} />
              <Route path="/bienvenue/:leaseId" element={<RequireAuth><Bienvenue /></RequireAuth>} />
              <Route path="/espace" element={<RequireAuth><Aujourdhui /></RequireAuth>} />
              <Route path="/espace/logements" element={<RequireAuth><Logements /></RequireAuth>} />
              <Route path="/espace/logements/nouveau" element={<RequireAuth><AjoutLogement /></RequireAuth>} />
              <Route path="/espace/locataires/nouveau" element={<RequireAuth><AjoutLocataire /></RequireAuth>} />
              <Route path="/espace/baux/nouveau" element={<RequireAuth><CreationBail /></RequireAuth>} />
              <Route path="/espace/logements/:id" element={<RequireAuth><Logement /></RequireAuth>} />
              <Route path="/espace/locataires" element={<RequireAuth><Locataires /></RequireAuth>} />
              <Route path="/espace/locataires/:id" element={<RequireAuth><Locataire /></RequireAuth>} />
              <Route path="/espace/documents" element={<RequireAuth><Documents /></RequireAuth>} />
              <Route path="/espace/argent" element={<RequireAuth><Argent /></RequireAuth>} />
              <Route path="/espace/argent/facture" element={<RequireAuth><FactureAjout /></RequireAuth>} />
              <Route path="/espace/argent/factures/:id" element={<RequireAuth><FactureVerifier /></RequireAuth>} />
              <Route path="/espace/baux/:id" element={<RequireAuth><Bail /></RequireAuth>} />
              <Route path="/espace/baux/:id/courriers" element={<RequireAuth><Courriers /></RequireAuth>} />
              <Route path="/espace/baux/:id/etat-des-lieux" element={<RequireAuth><EtatDesLieux /></RequireAuth>} />
              <Route path="/edl/:id" element={<RequireAuth><Edl /></RequireAuth>} />
              <Route path="/espace/compte" element={<RequireAuth><Compte /></RequireAuth>} />
              <Route path="/espace/compte/profil" element={<RequireAuth><FicheBailleur /></RequireAuth>} />
              <Route path="/espace/logements/:id/fiche" element={<RequireAuth><FicheLogement /></RequireAuth>} />
              <Route path="/espace/locataires/:id/fiche" element={<RequireAuth><FicheLocataire /></RequireAuth>} />
              <Route path="/espace/locataires/:id/caution" element={<RequireAuth><ActeCaution /></RequireAuth>} />
              <Route path="/espace/baux/:id/contrat" element={<RequireAuth><Contrat /></RequireAuth>} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/conditions" element={<Conditions />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
    </ErrorBoundary>
  )
}
