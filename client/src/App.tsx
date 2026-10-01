import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BAI } from './constants/bailio-tokens'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/kit'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DraftProvider, useDraft } from './lib/draft'
import Home from './pages/Home'
// Toutes les pages sont dans le même fichier : changer de page ne télécharge plus rien,
// donc plus de page qui reste bloquée (réseau mobile, mise à jour du site pendant la visite).
import TypeStep from './pages/tunnel/TypeStep'
import LogementStep from './pages/tunnel/LogementStep'
import PersonnesStep from './pages/tunnel/PersonnesStep'
import LoyerStep from './pages/tunnel/LoyerStep'
import RelectureStep from './pages/tunnel/RelectureStep'
import RecevoirStep from './pages/tunnel/RecevoirStep'
import Importer from './pages/Importer'
import Reprendre from './pages/Reprendre'
import Bienvenue from './pages/Bienvenue'
import Connexion, { Inscription, ConnexionLien } from './pages/Connexion'
import Aujourdhui from './pages/espace/Aujourdhui'
import Logements from './pages/espace/Logements'
import Logement from './pages/espace/Logement'
import Locataires from './pages/espace/Locataires'
import Locataire from './pages/espace/Locataire'
import Documents from './pages/espace/Documents'
import Argent from './pages/espace/Argent'
import { FactureAjout, FactureVerifier } from './pages/espace/Facture'
import Bail from './pages/espace/Bail'
import AjoutLogement from './pages/espace/parcours/AjoutLogement'
import AjoutLocataire from './pages/espace/parcours/AjoutLocataire'
import CreationBail from './pages/espace/parcours/CreationBail'
import FicheBailleur from './pages/espace/fiches/FicheBailleur'
import FicheLogement from './pages/espace/fiches/FicheLogement'
import FicheLocataire from './pages/espace/fiches/FicheLocataire'
import ActeCaution from './pages/espace/fiches/ActeCaution'
import Signer from './pages/Signer'
import Contrat from './pages/espace/fiches/Contrat'
import Courriers from './pages/espace/Courriers'
import EtatDesLieux from './pages/espace/EtatDesLieux'
import Edl from './pages/Edl'
import Compte from './pages/espace/Compte'
import { MentionsLegales, Conditions, Confidentialite, Contact, NotFound } from './pages/legal/Legal'


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
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

function Pages() {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname}>
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
              <Route path="/signer/:token" element={<Signer />} />
              <Route path="/mentions-legales" element={<MentionsLegales />} />
              <Route path="/conditions" element={<Conditions />} />
              <Route path="/confidentialite" element={<Confidentialite />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
    </ErrorBoundary>
  )
}
