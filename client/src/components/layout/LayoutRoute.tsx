import { Outlet } from 'react-router-dom'
import { Layout } from './Layout'

/**
 * Route parente stable qui monte Layout (sidebar + header) UNE SEULE FOIS
 * pour tout un groupe de routes imbriquées. Sans ça, chaque page wrappant
 * son propre <Layout> force React à démonter/remonter toute la sidebar
 * à chaque navigation — flash visible de tout le dashboard.
 */
export function LayoutRoute() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
