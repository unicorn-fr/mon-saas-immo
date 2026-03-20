/**
 * Skeleton — Maison Design System shimmer
 */

/** Base skeleton block */
export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-lg ${className}`} style={style} />
}

/** KPI card skeleton */
export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-5"
      style={{ border: '1px solid #e4e1db', borderTop: '3px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-2.5 w-24 rounded-full" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-16 rounded-lg mb-2" />
      <Skeleton className="h-2.5 w-20 rounded-full" />
    </div>
  )
}

/** Table row skeleton */
export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={`h-4 rounded-full ${i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24'}`} />
        </td>
      ))}
    </tr>
  )
}

/** Generic card skeleton */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl p-5"
      style={{ border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4 rounded-full" />
          <Skeleton className="h-3 w-1/2 rounded-full" />
        </div>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded-full mb-2 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  )
}

/** Profile skeleton */
export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-full" />
      </div>
    </div>
  )
}

/** Property card skeleton */
export function PropertyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden"
      style={{ border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/2 rounded-full" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

/** Dashboard grid skeleton (4 KPI + table) */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-xl overflow-hidden"
        style={{ border: '1px solid #e4e1db', boxShadow: '0 1px 2px rgba(13,12,10,0.04), 0 4px 12px rgba(13,12,10,0.06)' }}>
        <div className="p-5 border-b" style={{ borderColor: '#e4e1db' }}>
          <Skeleton className="h-5 w-40 rounded-full" />
        </div>
        <table className="w-full">
          <tbody>
            {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  )
}
