/**
 * KPICard — Light Premium
 * border-top thread · count-up · hover lift
 */
import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  label: string
  value: number | string
  icon?: LucideIcon
  trend?: number       // % change, positive = good
  trendLabel?: string
  prefix?: string
  suffix?: string
  thread?: string      // override thread color
  loading?: boolean
}

function useCountUp(target: number, duration = 800) {
  const [count, setCount] = useState(0)
  const raf = useRef<number>()

  useEffect(() => {
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(ease * target))
      if (progress < 1) raf.current = requestAnimationFrame(animate)
    }
    raf.current = requestAnimationFrame(animate)
    return () => { if (raf.current) cancelAnimationFrame(raf.current) }
  }, [target, duration])

  return count
}

export function KPICard({
  label, value, icon: Icon, trend, trendLabel, prefix = '', suffix = '',
  thread = 'var(--thread, #007AFF)', loading = false,
}: KPICardProps) {
  const numericValue = typeof value === 'number' ? value : parseInt(String(value)) || 0
  const animated = useCountUp(loading ? 0 : numericValue)
  const displayValue = typeof value === 'string' && isNaN(numericValue) ? value : `${prefix}${animated}${suffix}`

  if (loading) return <KPICardSkeleton />

  return (
    <div
      className="bg-white rounded-2xl p-5 transition-all duration-200 cursor-default select-none"
      style={{
        border: '1px solid #d2d2d7',
        borderTop: `3px solid ${thread}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = `0 4px 12px rgba(0,0,0,0.10), 0 12px 32px rgba(0,0,0,0.08)`
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ''
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${thread}18`, color: thread }}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <p className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: '#1d1d1f' }}>
        {displayValue}
      </p>

      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
            : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
          }
          <span className="text-[12px] font-semibold" style={{ color: trend >= 0 ? '#10b981' : '#ef4444' }}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
          {trendLabel && (
            <span className="text-[11px] text-slate-400 ml-0.5">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid #d2d2d7', borderTop: '3px solid #d2d2d7', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="h-2.5 w-24 rounded-full skeleton" />
        <div className="w-8 h-8 rounded-xl skeleton" />
      </div>
      <div className="h-8 w-16 rounded-lg skeleton mb-2" />
      <div className="h-2.5 w-20 rounded-full skeleton" />
    </div>
  )
}
