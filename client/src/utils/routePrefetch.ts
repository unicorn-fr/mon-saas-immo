const importers: Record<string, () => Promise<unknown>> = {
  '/dashboard/owner': () => import('../pages/owner/Dashboard'),
  '/properties/owner/me': () => import('../pages/owner/MyProperties'),
  '/properties/new': () => import('../pages/owner/CreatePropertyWizard'),
  '/bookings/manage': () => import('../pages/owner/BookingManagement'),
  '/applications/manage': () => import('../pages/owner/ApplicationManagement'),
  '/owner/settings': () => import('../pages/owner/Settings'),
  '/owner/rentabilite': () => import('../pages/owner/Rentabilite'),
  '/owner/finances': () => import('../pages/owner/Finance'),
  '/owner/maintenance': () => import('../pages/owner/Maintenance'),
  '/owner/quittances': () => import('../pages/owner/Quittances'),
  '/owner/locataires': () => import('../pages/owner/MesLocataires'),
  '/owner/documents': () => import('../pages/owner/Documents'),
  '/owner/outils': () => import('../pages/owner/Outils'),
  '/owner/abonnement': () => import('../pages/owner/Abonnement'),

  '/dashboard/tenant': () => import('../pages/tenant/TenantDashboard'),
  '/search': () => import('../pages/public/SearchProperties'),
  '/favorites': () => import('../pages/tenant/Favorites'),
  '/mes-alertes': () => import('../pages/tenant/SearchAlerts'),
  '/my-applications': () => import('../pages/tenant/MyApplications'),
  '/my-bookings': () => import('../pages/tenant/MyBookings'),
  '/dossier': () => import('../pages/tenant/DossierLocatif'),
  '/tenant/settings': () => import('../pages/tenant/Settings'),
  '/tenant/maintenance': () => import('../pages/tenant/Maintenance'),
  '/tenant/documents': () => import('../pages/tenant/Documents'),
  '/tenant/payments': () => import('../pages/tenant/TenantPayments'),

  '/messages': () => import('../pages/Messages'),
  '/notifications': () => import('../pages/Notifications'),
  '/profile': () => import('../pages/Profile'),
  '/contracts': () => import('../pages/contracts/ContractsList'),
}

const done = new Set<string>()

export function prefetchRoute(path: string) {
  if (done.has(path)) return
  const importer = importers[path]
  if (!importer) return
  done.add(path)
  importer().catch(() => done.delete(path))
}
