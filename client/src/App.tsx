import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { useAuth } from './hooks/useAuth'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import NotFound from './pages/NotFound'

// Public Pages
import SearchProperties from './pages/public/SearchProperties'
import PropertyDetailsPublic from './pages/public/PropertyDetailsPublic'

// Owner Pages
import Dashboard from './pages/owner/Dashboard'
import MyProperties from './pages/owner/MyProperties'
import CreateProperty from './pages/owner/CreateProperty'
import EditProperty from './pages/owner/EditProperty'
import PropertyDetails from './pages/owner/PropertyDetails'
import BookingManagement from './pages/owner/BookingManagement'

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard'
import MyBookings from './pages/tenant/MyBookings'
import Favorites from './pages/tenant/Favorites'

// Shared Pages
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

// Contract Pages
import ContractsList from './pages/contracts/ContractsList'
import CreateContract from './pages/contracts/CreateContract'
import ContractDetails from './pages/contracts/ContractDetails'
import EtatDesLieux from './pages/contracts/EtatDesLieux'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import UsersManagement from './pages/admin/UsersManagement'

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchProperties />} />
      <Route path="/property/:id" element={<PropertyDetailsPublic />} />

      {/* Auth Routes - Redirect to home if already authenticated */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
      />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Legal & Info Pages */}
      <Route path="/mentions-legales" element={<MentionsLegales />} />
      <Route path="/cgu" element={<CGU />} />
      <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
      <Route path="/cookies" element={<Cookies />} />
      <Route path="/faq" element={<FAQ />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/support" element={<Support />} />
      <Route path="/presse" element={<Presse />} />

      {/* Search & Properties (Public for now, can be protected later) */}
      {/* <Route path="/search" element={<SearchPage />} /> */}
      {/* <Route path="/property/:id" element={<PropertyDetails />} /> */}

      {/* Protected Routes - Owner Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route path="/dashboard/owner" element={<Dashboard />} />
        <Route path="/properties/owner/me" element={<MyProperties />} />
        <Route path="/properties/new" element={<CreateProperty />} />
        <Route path="/properties/:id/edit" element={<EditProperty />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/bookings/manage" element={<BookingManagement />} />
        {/* <Route path="/tenants" element={<TenantsManagement />} /> */}
      </Route>

      {/* Protected Routes - Tenant Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['TENANT', 'ADMIN']} />}>
        <Route path="/dashboard/tenant" element={<TenantDashboard />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Route>

      {/* Protected Routes - All authenticated users */}
      <Route element={<ProtectedRoute />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/contracts" element={<ContractsList />} />
        <Route path="/contracts/:id" element={<ContractDetails />} />
        <Route path="/contracts/:id/edl" element={<EtatDesLieux />} />
      </Route>

      {/* Protected Routes - Create Contract (Owner only) */}
      <Route element={<ProtectedRoute allowedRoles={['OWNER', 'ADMIN']} />}>
        <Route path="/contracts/new" element={<CreateContract />} />
      </Route>

      {/* Protected Routes - Admin Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersManagement />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
