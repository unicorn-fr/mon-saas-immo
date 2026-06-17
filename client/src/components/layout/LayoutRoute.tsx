import { Outlet } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { Layout } from './Layout'

function PageLoader() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 120)
    return () => clearTimeout(t)
  }, [])
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh',
    }}>
      {show && (
        <>
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            border: '2px solid #e4e1db', borderTopColor: '#c4976a',
            animation: 'pageSpin 0.7s linear infinite',
          }} />
          <style>{`@keyframes pageSpin { to { transform: rotate(360deg) } }`}</style>
        </>
      )}
    </div>
  )
}

/**
 * Route parente stable qui monte Layout (sidebar + header) UNE SEULE FOIS
 * pour tout un groupe de routes imbriquées.
 *
 * La Suspense interne autour de <Outlet> est essentielle : quand un chunk
 * de page charge, seul le contenu central est remplacé par le PageLoader.
 * Sans elle, la Suspense externe (App.tsx) attrape la suspension et
 * remplace TOUTE la page — sidebar et header inclus — provoquant le flash.
 */
export function LayoutRoute() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </Layout>
  )
}
