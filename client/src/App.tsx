import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState, lazy, Suspense } from 'react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { useThemeStore } from './store/themeStore'
import { ScrollToTop } from './components/ScrollToTop'
import { ErrorBoundary } from './components/ErrorBoundary'

// Pages — lazy-loaded for code splitting
const LayoutRoute = lazy(() => import('./components/layout/LayoutRoute').then(m => ({ default: m.LayoutRoute })))

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const VerifyMagicLink = lazy(() => import('./pages/VerifyMagicLink'))
const SelectRole = lazy(() => import('./pages/SelectRole'))
const GoogleOAuthCallback = lazy(() => import('./pages/GoogleOAuthCallback'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Public Pages
const SearchProperties = lazy(() => import('./pages/public/SearchProperties'))
const PropertyDetailsPublic = lazy(() => import('./pages/public/PropertyDetailsPublic'))
const Guide = lazy(() => import('./pages/public/Guide'))
const GuideArticle = lazy(() => import('./pages/public/GuideArticle'))
const LocationVille = lazy(() => import('./pages/public/LocationVille'))
const Estimer = lazy(() => import('./pages/public/Estimer'))

// Owner Pages
const Dashboard = lazy(() => import('./pages/owner/Dashboard'))
const MyProperties = lazy(() => import('./pages/owner/MyProperties'))
const CreatePropertyWizard = lazy(() => import('./pages/owner/CreatePropertyWizard'))
const EditProperty = lazy(() => import('./pages/owner/EditProperty'))
const PropertyDetails = lazy(() => import('./pages/owner/PropertyDetails'))
const BookingManagement = lazy(() => import('./pages/owner/BookingManagement'))
const ApplicationManagement = lazy(() => import('./pages/owner/ApplicationManagement'))
const TenantProfile = lazy(() => import('./pages/owner/TenantProfile'))
const OwnerSettings = lazy(() => import('./pages/owner/Settings'))
const Rentabilite = lazy(() => import('./pages/owner/Rentabilite'))
const Finance = lazy(() => import('./pages/owner/Finance'))
const FiscalWizard = lazy(() => import('./pages/owner/FiscalWizard'))
const Maintenance = lazy(() => import('./pages/owner/Maintenance'))
const Quittances = lazy(() => import('./pages/owner/Quittances'))
const MesLocataires = lazy(() => import('./pages/owner/MesLocataires'))
const Documents = lazy(() => import('./pages/owner/Documents'))
const Outils = lazy(() => import('./pages/owner/Outils'))
const Abonnement = lazy(() => import('./pages/owner/Abonnement'))

// Tenant Pages
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'))
const TenantPayments = lazy(() => import('./pages/tenant/TenantPayments'))
const MyBookings = lazy(() => import('./pages/tenant/MyBookings'))
const MyApplications = lazy(() => import('./pages/tenant/MyApplications'))
const Favorites = lazy(() => import('./pages/tenant/Favorites'))
const DossierLocatif = lazy(() => import('./pages/tenant/DossierLocatif'))
const DossierShareManager = lazy(() => import('./pages/tenant/DossierShareManager'))
const PrivacyCenter = lazy(() => import('./pages/tenant/PrivacyCenter'))
const TenantSettings = lazy(() => import('./pages/tenant/Settings'))
const TenantMaintenance = lazy(() => import('./pages/tenant/Maintenance'))
const TenantDocuments = lazy(() => import('./pages/tenant/Documents'))
const SearchAlerts = lazy(() => import('./pages/tenant/SearchAlerts'))

// Shared Pages
const Messages = lazy(() => import('./pages/Messages'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))

// Contract Pages
const ContractsList = lazy(() => import('./pages/contracts/ContractsList'))
const CreateContract = lazy(() => import('./pages/contracts/CreateContract'))
const ContractDetails = lazy(() => import('./pages/contracts/ContractDetails'))
const EtatDesLieux = lazy(() => import('./pages/contracts/EtatDesLieux'))
const EdlSessionPage = lazy(() => import('./pages/contracts/EdlSession'))
const EdlJoin = lazy(() => import('./pages/contracts/EdlJoin'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement'))
const WaitlistAdmin = lazy(() => import('./pages/admin/WaitlistAdmin'))

// Super Admin Pages — Cerveau Central
const SuperAdminLayout = lazy(() => import('./pages/super-admin/SuperAdminLayout'))
const SADashboard = lazy(() => import('./pages/super-admin/SADashboard'))
const SAUsers = lazy(() => import('./pages/super-admin/SAUsers'))
const SADossiers = lazy(() => import('./pages/super-admin/SADossiers'))
const SADatabase = lazy(() => import('./pages/super-admin/SADatabase'))
const SAMessages = lazy(() => import('./pages/super-admin/SAMessages'))
const SAAuditLogs = lazy(() => import('./pages/super-admin/SAAuditLogs'))
const SAContracts = lazy(() => import('./pages/super-admin/SAContracts'))
const SAUserDetail = lazy(() => import('./pages/super-admin/SAUserDetail'))
const SAProperties = lazy(() => import('./pages/super-admin/SAProperties'))
const SAPromoCodes = lazy(() => import('./pages/super-admin/SAPromoCodes'))

// Legal Pages
const MentionsLegales = lazy(() => import('./pages/legal/MentionsLegales'))
const CGU = lazy(() => import('./pages/legal/CGU'))
const PolitiqueConfidentialite = lazy(() => import('./pages/legal/PolitiqueConfidentialite'))
const Cookies = lazy(() => import('./pages/legal/Cookies'))

// Info Pages
const FAQ = lazy(() => import('./pages/info/FAQ'))
const Contact = lazy(() => import('./pages/info/Contact'))
const Support = lazy(() => import('./pages/info/Support'))
const Presse = lazy(() => import('./pages/info/Presse'))
const Videos = lazy(() => import('./pages/info/Videos'))
const APropos = lazy(() => import('./pages/info/APropos'))
const CompleteProfile = lazy(() => import('./pages/CompleteProfile'))
const VerifyIdentity = lazy(() => import('./pages/VerifyIdentity'))
const Proprietaires = lazy(() => import('./pages/info/Proprietaires'))
const Locataires = lazy(() => import('./pages/info/Locataires'))
const Pricing = lazy(() => import('./pages/Pricing'))

// PWA Components
import { InstallPWA } from './components/pwa/InstallPWA'
import { UpdatePWA } from './components/pwa/UpdatePWA'

// Onboarding
import { OnboardingWizard } from './components/onboarding/OnboardingWizard'

// Cookie consent
import CookieBanner from './components/ui/CookieBanner'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function DarkModeSync() {
  const { isDark } = useThemeStore()
  useEffect(() => {
    const html = document.documentElement
    html.classList.toggle('dark', isDark)
    // Remove inline styles set by the anti-flash script so they don't override CSS
    html.style.removeProperty('background-color')
    html.style.removeProperty('color')
  }, [isDark])
  return null
}

function RouteLoader() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 160)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      minHeight: '100vh', background: '#fafaf8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {show && (
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: '2.5px solid #e4e1db', borderTopColor: '#c4976a',
          animation: 'routeSpin 0.7s linear infinite',
        }} />
      )}
      <style>{`@keyframes routeSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeSync />
      <Router>
        <AppRoutes />
        {/* Cookie consent — doit être dans le Router car utilise <Link> */}
        <CookieBanner />
      </Router>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {/* PWA Components */}
      <InstallPWA />
      <UpdatePWA />
    </QueryClientProvider>
  )
}

function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth()

  // Précharge le chunk Layout (sidebar/header) dès l'authentification confirmée —
  // évite tout flash au premier accès au dashboard.
  useEffect(() => {
    if (isAuthenticated) import('./components/layout/LayoutRoute')
  }, [isAuthenticated])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <>
    <ScrollToTop />
    {/* Onboarding wizard — full-screen overlay for new users */}
    {isAuthenticated && user && user.onboardingCompleted === false && (
      <OnboardingWizard />
    )}
    <ErrorBoundary>
    <Suspense fallback={<RouteLoader />}>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchProperties />} />
      <Route path="/property/:id" element={<PropertyDetailsPublic />} />
      <Route path="/guide" element={<Guide />} />
      <Route path="/guide/:slug" element={<GuideArticle />} />
      <Route path="/location/:ville" element={<LocationVille />} />
      <Route path="/estimer" element={<Estimer />} />

      {/* Auth Routes - Redirect to home if already authenticated */}
      <Route
        path="/login"
        element={isAuthenticated
          ? <Navigate to={
              user?.role === 'OWNER' ? '/dashboard/owner'
              : user?.role === 'TENANT' ? '/dashboard/tenant'
              : user?.role === 'SUPER_ADMIN' ? '/super-admin'
              : '/'
            } replace />
          : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated && user?.emailVerified ? <Navigate to="/" replace /> : <Register />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/verify" element={<VerifyMagicLink />} />
      <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/verify-identity" element={<VerifyIdentity />} />

      {/* Legal & Info Pages */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      <Route path="/presse" element={<Presse />} />
      <Route path="/videos" element={<Videos />} />
      <Route path="/a-propos" element={<APropos />} />
      <Route path="/proprietaires" element={<Proprietaires />} />
      <Route path="/locataires" element={<Locataires />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Search & Properties (Public for now, can be protected later) */}
      {/* <Route path="/search" element={<SearchPage />} /> */}
      {/* <Route path="/property/:id" element={<PropertyDetails />} /> */}

      {/* Protected Routes - Owner Dashboard — Layout monté une seule fois pour tout le groupe */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route element={<LayoutRoute />}>
          <Route path="/dashboard/owner" element={<Dashboard />} />
          <Route path="/properties/owner/me" element={<MyProperties />} />
          <Route path="/properties/new" element={<CreatePropertyWizard />} />
          <Route path="/properties/:id/edit" element={<EditProperty />} />
          <Route path="/properties/:id" element={<PropertyDetails />} />
          <Route path="/bookings/manage" element={<BookingManagement />} />
          <Route path="/applications/manage" element={<ApplicationManagement />} />
          <Route path="/owner/tenants/:tenantId" element={<TenantProfile />} />
          <Route path="/owner/settings" element={<OwnerSettings />} />
          <Route path="/owner/rentabilite" element={<Rentabilite />} />
          <Route path="/owner/finances" element={<Finance />} />
          <Route path="/owner/fiscal-wizard" element={<FiscalWizard />} />
          <Route path="/owner/maintenance" element={<Maintenance />} />
          <Route path="/owner/quittances" element={<Quittances />} />
          <Route path="/owner/locataires" element={<MesLocataires />} />
          <Route path="/owner/documents" element={<Documents />} />
          <Route path="/owner/outils" element={<Outils />} />
          <Route path="/owner/abonnement" element={<Abonnement />} />
        </Route>
      </Route>

      {/* Protected Routes - Tenant Dashboard — Layout monté une seule fois pour tout le groupe */}
      <Route element={<ProtectedRoute allowedRoles={['TENANT', 'ADMIN']} />}>
        <Route element={<LayoutRoute />}>
          <Route path="/dashboard/tenant" element={<TenantDashboard />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/my-applications" element={<MyApplications />} />
          <Route path="/dossier" element={<DossierLocatif />} />
          <Route path="/dossier/partages" element={<DossierShareManager />} />
          <Route path="/privacy" element={<PrivacyCenter />} />
          <Route path="/tenant/settings" element={<TenantSettings />} />
          <Route path="/tenant/maintenance" element={<TenantMaintenance />} />
          <Route path="/tenant/documents" element={<TenantDocuments />} />
          <Route path="/mes-alertes" element={<SearchAlerts />} />
          <Route path="/tenant/payments" element={<TenantPayments />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/select-role" element={<SelectRole />} />
      </Route>

      {/* Protected Routes - Create Contract (Owner only) — AVANT /contracts/:id */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route element={<LayoutRoute />}>
          <Route path="/contracts/new" element={<ErrorBoundary><CreateContract /></ErrorBoundary>} />
        </Route>
      </Route>

      {/* Protected Routes - All authenticated users — Layout monté une seule fois pour tout le groupe */}
      <Route element={<ProtectedRoute />}>
        <Route element={<LayoutRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/contracts" element={<ContractsList />} />
          <Route path="/contracts/:id" element={<ErrorBoundary><ContractDetails /></ErrorBoundary>} />
          <Route path="/contracts/:id/edl" element={<EtatDesLieux />} />
        </Route>
        <Route path="/contracts/:contractId/edl/session" element={<EdlSessionPage />} />
        <Route path="/edl/join" element={<EdlJoin />} />
      </Route>

      {/* Waitlist admin — protégé ADMIN/SUPER_ADMIN */}

      {/* Protected Routes - Admin Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
        <Route path="/admin/waitlist" element={<WaitlistAdmin />} />
      </Route>

      {/* Super Admin — Cerveau Central (full dark mode layout) */}
      <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']} />}>
        <Route path="/super-admin" element={<SuperAdminLayout />}>
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SADashboard />} />
          <Route path="users" element={<SAUsers />} />
          <Route path="users/:id" element={<SAUserDetail />} />
          <Route path="dossiers" element={<SADossiers />} />
          <Route path="contracts" element={<SAContracts />} />
          <Route path="messages" element={<SAMessages />} />
          <Route path="database" element={<SADatabase />} />
          <Route path="properties" element={<SAProperties />} />
          <Route path="audit" element={<SAAuditLogs />} />
          <Route path="promo-codes" element={<SAPromoCodes />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
    </>
  )
}

export default App
