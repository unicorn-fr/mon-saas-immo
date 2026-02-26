import { ReactNode } from 'react'
import { Header } from './Header'

interface LayoutProps {
  children: ReactNode
  showHeader?: boolean
}

export const Layout = ({ children, showHeader = true }: LayoutProps) => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--surface-page)' }}>
      {showHeader && <Header />}
      <main>{children}</main>
    </div>
  )
}
