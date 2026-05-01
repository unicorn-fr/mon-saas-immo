import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'
import { useThemeStore } from './store/themeStore'
import { ScrollToTop } from './components/ScrollToTop'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import VerifyMagicLink from './pages/VerifyMagicLink'
import SelectRole from './pages/SelectRole'
import NotFound from './pages/NotFound'

// Public Pages
import SearchProperties from './pages/public/SearchProperties'
import PropertyDetailsPublic from './pages/public/PropertyDetailsPublic'

// Owner Pages
import Dashboard from './pages/owner/Dashboard'
import MyProperties from './pages/owner/MyProperties'
import CreatePropertyWizard from './pages/owner/CreatePropertyWizard'
import EditProperty from './pages/owner/EditProperty'
import PropertyDetails from './pages/owner/PropertyDetails'
import BookingManagement from './pages/owner/BookingManagement'
import ApplicationManagement from './pages/owner/ApplicationManagement'
import TenantProfile from './pages/owner/TenantProfile'
import OwnerSettings from './pages/owner/Settings'
import Rentabilite from './pages/owner/Rentabilite'
import Finance from './pages/owner/Finance'
import Maintenance from './pages/owner/Maintenance'

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard'
import MyBookings from './pages/tenant/MyBookings'
import MyApplications from './pages/tenant/MyApplications'
import Favorites from './pages/tenant/Favorites'
import DossierLocatif from './pages/tenant/DossierLocatif'
import DossierShareManager from './pages/tenant/DossierShareManager'
import PrivacyCenter from './pages/tenant/PrivacyCenter'
import TenantSettings from './pages/tenant/Settings'

// Shared Pages
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

// Contract Pages
import ContractsList from './pages/contracts/ContractsList'
import CreateContract from './pages/contracts/CreateContract'
import ContractDetails from './pages/contracts/ContractDetails'
import EtatDesLieux from './pages/contracts/EtatDesLieux'
import EdlSessionPage from './pages/contracts/EdlSession'
import EdlJoin from './pages/contracts/EdlJoin'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersManagement from './pages/admin/UsersManagement'
import WaitlistAdmin from './pages/admin/WaitlistAdmin'

// Super Admin Pages — Cerveau Central
import SuperAdminLayout from './pages/super-admin/SuperAdminLayout'
import SADashboard from './pages/super-admin/SADashboard'
import SAUsers from './pages/super-admin/SAUsers'
import SADossiers from './pages/super-admin/SADossiers'
import SADatabase from './pages/super-admin/SADatabase'
import SAMessages from './pages/super-admin/SAMessages'
import SAAuditLogs from './pages/super-admin/SAAuditLogs'
import SAContracts from './pages/super-admin/SAContracts'
import SAUserDetail from './pages/super-admin/SAUserDetail'
import SAProperties from './pages/super-admin/SAProperties'

// Legal Pages
import MentionsLegales from './pages/legal/MentionsLegales'
import CGU from './pages/legal/CGU'
import PolitiqueConfidentialite from './pages/legal/PolitiqueConfidentialite'
import Cookies from './pages/legal/Cookies'

// Info Pages
import FAQ from './pages/info/FAQ'
import Contact from './pages/info/Contact'
import Support from './pages/info/Support'
import Presse from './pages/info/Presse'
import APropos from './pages/info/APropos'
import Proprietaires from './pages/info/Proprietaires'
import Locataires from './pages/info/Locataires'
import Pricing from './pages/Pricing'

// PWA Components
import { InstallPWA } from './components/pwa/InstallPWA'
import { UpdatePWA } from './components/pwa/UpdatePWA'

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeSync />
      <Router>
        <AppRoutes />
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
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchProperties />} />
      <Route path="/property/:id" element={<PropertyDetailsPublic />} />

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

      {/* Legal & Info Pages */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      <Route path="/presse" element={<Presse />} />
      <Route path="/a-propos" element={<APropos />} />
      <Route path="/proprietaires" element={<Proprietaires />} />
      <Route path="/locataires" element={<Locataires />} />
      <Route path="/pricing" element={<Pricing />} />

      {/* Search & Properties (Public for now, can be protected later) */}
      {/* <Route path="/search" element={<SearchPage />} /> */}
      {/* <Route path="/property/:id" element={<PropertyDetails />} /> */}

      {/* Protected Routes - Owner Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
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
        <Route path="/owner/maintenance" element={<Maintenance />} />
      </Route>

      {/* Protected Routes - Tenant Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['TENANT', 'ADMIN']} />}>
        <Route path="/dashboard/tenant" element={<TenantDashboard />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/my-applications" element={<MyApplications />} />
        <Route path="/dossier" element={<DossierLocatif />} />
        <Route path="/dossier/partages" element={<DossierShareManager />} />
        <Route path="/privacy" element={<PrivacyCenter />} />
        <Route path="/tenant/settings" element={<TenantSettings />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/select-role" element={<SelectRole />} />
      </Route>

      {/* Protected Routes - All authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/contracts" element={<ContractsList />} />
        <Route path="/contracts/:id" element={<ContractDetails />} />
        <Route path="/contracts/:id/edl" element={<EtatDesLieux />} />
        <Route path="/contracts/:contractId/edl/session" element={<EdlSessionPage />} />
        <Route path="/edl/join" element={<EdlJoin />} />
      </Route>

      {/* Protected Routes - Create Contract (Owner only) */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route path="/contracts/new" element={<CreateContract />} />
      </Route>

      {/* Waitlist admin — public route, protégé par ?secret= côté composant */}
      <Route path="/admin/waitlist" element={<WaitlistAdmin />} />

      {/* Protected Routes - Admin Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
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
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}

export default App
