import { Suspense, lazy, useEffect, type ComponentType, type ReactNode } from 'react'
import { recoverOnce } from './lib/recover'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { BAI } from './constants/bailio-tokens'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/kit'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { DraftProvider, useDraft } from './lib/draft'
import Home from './pages/Home'
// Pages publiques dans le fichier principal ; l'espace dans un second fichier (pages/espace/index.ts),
// téléchargé dès que la première page est affichée.
import TypeStep from './pages/tunnel/TypeStep'
import LogementStep from './pages/tunnel/LogementStep'
import PersonnesStep from './pages/tunnel/PersonnesStep'
import LoyerStep from './pages/tunnel/LoyerStep'
import RelectureStep from './pages/tunnel/RelectureStep'
import RecevoirStep from './pages/tunnel/RecevoirStep'
import Importer from './pages/Importer'
import Reprendre from './pages/Reprendre'
import Connexion, { Inscription, ConnexionLien } from './pages/Connexion'
import { MentionsLegales, Conditions, Confidentialite, Contact, NotFound } from './pages/legal/Legal'


type EspaceModule = typeof import('./pages/espace/index')
let espaceLoad: Promise<EspaceModule> | null = null
/** Téléchargement unique de l'espace. En cas d'échec (site mis à jour pendant la visite), la page est rechargée une fois. */
function loadEspace(): Promise<EspaceModule> {
  espaceLoad ??= import('./pages/espace/index').catch((err) => {
    espaceLoad = null
    if (recoverOnce()) return new Promise<EspaceModule>(() => undefined)
    throw err
  })
  return espaceLoad
}
const page = (name: keyof EspaceModule) => lazy(() => loadEspace().then((m) => ({ default: m[name] as ComponentType })))
const Aujourdhui = page('Aujourdhui')
const Logements = page('Logements')
const Logement = page('Logement')
const Locataires = page('Locataires')
const Locataire = page('Locataire')
const Documents = page('Documents')
const Argent = page('Argent')
const FactureAjout = page('FactureAjout')
const FactureVerifier = page('FactureVerifier')
const Bail = page('Bail')
const AjoutLogement = page('AjoutLogement')
const AjoutLocataire = page('AjoutLocataire')
const CreationBail = page('CreationBail')
const FicheBailleur = page('FicheBailleur')
const FicheLogement = page('FicheLogement')
const FicheLocataire = page('FicheLocataire')
const ActeCaution = page('ActeCaution')
const Contrat = page('Contrat')
const Courriers = page('Courriers')
const Situations = page('Situations')
const Parcours = page('Parcours')
const Annonce = page('Annonce')
const Candidats = page('Candidats')
const Declaration = page('Declaration')
const Candidature = page('Candidature')
const EtatDesLieux = page('EtatDesLieux')
const Compte = page('Compte')
const Edl = page('Edl')
const Signer = page('Signer')
const Bienvenue = page('Bienvenue')


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
  // L'espace est téléchargé dès que la première page est affichée : y entrer est ensuite instantané.
  useEffect(() => {
    const t = window.setTimeout(() => void loadEspace().catch(() => undefined), 800)
    return () => window.clearTimeout(t)
  }, [])
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
              <Route path="/espace/situations" element={<RequireAuth><Situations /></RequireAuth>} />
              <Route path="/espace/baux/:id/parcours/:kind" element={<RequireAuth><Parcours /></RequireAuth>} />
              <Route path="/espace/baux/:id/etat-des-lieux" element={<RequireAuth><EtatDesLieux /></RequireAuth>} />
              <Route path="/edl/:id" element={<RequireAuth><Edl /></RequireAuth>} />
              <Route path="/espace/compte" element={<RequireAuth><Compte /></RequireAuth>} />
              <Route path="/espace/compte/profil" element={<RequireAuth><FicheBailleur /></RequireAuth>} />
              <Route path="/espace/logements/:id/fiche" element={<RequireAuth><FicheLogement /></RequireAuth>} />
              <Route path="/espace/logements/:id/annonce" element={<RequireAuth><Annonce /></RequireAuth>} />
              <Route path="/espace/logements/:id/candidats" element={<RequireAuth><Candidats /></RequireAuth>} />
              <Route path="/espace/argent/declaration" element={<RequireAuth><Declaration /></RequireAuth>} />
              <Route path="/espace/locataires/:id/fiche" element={<RequireAuth><FicheLocataire /></RequireAuth>} />
              <Route path="/espace/locataires/:id/caution" element={<RequireAuth><ActeCaution /></RequireAuth>} />
              <Route path="/espace/baux/:id/contrat" element={<RequireAuth><Contrat /></RequireAuth>} />
              <Route path="/signer/:token" element={<Signer />} />
              <Route path="/candidature/:code" element={<Candidature />} />
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
