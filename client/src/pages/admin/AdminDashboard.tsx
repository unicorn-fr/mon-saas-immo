import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminService } from '../../services/admin.service'
import { PlatformStatistics, RecentActivity } from '../../types/admin.types'
import {
  Shield,
  Users,
  Home as HomeIcon,
  Calendar,
  FileText,
  TrendingUp,
  Eye,
  MessageSquare,
  Mail,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { BAI } from '../../constants/bailio-tokens'

export default function AdminDashboard() {
  const [statistics, setStatistics] = useState<PlatformStatistics | null>(null)
  const [activity, setActivity] = useState<RecentActivity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [stats, act] = await Promise.all([
        adminService.getPlatformStatistics(),
        adminService.getRecentActivity(10),
      ])
      setStatistics(stats)
      setActivity(act)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const iconColors: Record<string, { bg: string; color: string }> = {
    primary: { bg: BAI.ownerLight, color: BAI.owner },
    blue:    { bg: BAI.ownerLight, color: BAI.owner },
    green:   { bg: BAI.tenantLight, color: BAI.tenant },
    yellow:  { bg: BAI.caramelLight, color: BAI.caramel },
    red:     { bg: BAI.errorLight, color: BAI.error },
    purple:  { bg: BAI.errorLight, color: BAI.error },
  }

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtext,
    color = 'primary',
    link,
  }: {
    icon: any
    label: string
    value: string | number
    subtext?: string
    color?: 'primary' | 'green' | 'yellow' | 'red' | 'blue' | 'purple'
    link?: string
  }) => {
    const ic = iconColors[color] ?? iconColors.primary

    const content = (
      <div
        style={{
          background: BAI.bgSurface,
          border: `1px solid ${BAI.border}`,
          borderRadius: BAI.radiusLg,
          boxShadow: BAI.shadowMd,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          transition: BAI.transition,
        }}
      >
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: BAI.fontBody,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: BAI.inkFaint,
            }}
          >
            {label}
          </p>
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: BAI.fontDisplay,
              fontSize: 32,
              fontWeight: 700,
              color: BAI.ink,
              lineHeight: 1.1,
            }}
          >
            {value}
          </p>
          {subtext && (
            <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
              {subtext}
            </p>
          )}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: ic.bg,
            color: ic.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    )

    return link ? (
      <Link to={link} style={{ textDecoration: 'none', display: 'block' }}>
        {content}
      </Link>
    ) : (
      content
    )
  }

  if (isLoading || !statistics) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: BAI.bgBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `3px solid ${BAI.border}`,
            borderTopColor: BAI.caramel,
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  const SectionTitle = ({ children }: { children: string }) => (
    <h2
      style={{
        margin: '0 0 16px',
        fontFamily: BAI.fontBody,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: BAI.inkMid,
      }}
    >
      {children}
    </h2>
  )

  return (
    <div style={{ minHeight: '100vh', background: BAI.bgBase, fontFamily: BAI.fontBody }}>

      {/* Dark hero banner */}
      <div
        style={{
          background: BAI.night,
          padding: '32px clamp(16px,4vw,48px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: '0 0 6px',
              fontFamily: BAI.fontBody,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: BAI.caramel,
            }}
          >
            Administration
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: BAI.fontDisplay,
              fontSize: 'clamp(24px,4vw,32px)',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            Dashboard
          </h1>
        </div>
        <button
          onClick={loadData}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: BAI.radius,
            color: '#ffffff',
            fontFamily: BAI.fontBody,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            transition: BAI.transition,
          }}
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(12px,4vw,32px)' }}>

        {/* Users Stats */}
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>Utilisateurs</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard icon={Users}      label="Total Utilisateurs" value={statistics.users.total}        color="primary" link="/admin/users" />
            <StatCard icon={HomeIcon}   label="Propriétaires"      value={statistics.users.owners}       subtext={`${Math.round((statistics.users.owners / statistics.users.total) * 100)}%`} color="blue" />
            <StatCard icon={Users}      label="Locataires"         value={statistics.users.tenants}      subtext={`${Math.round((statistics.users.tenants / statistics.users.total) * 100)}%`} color="green" />
            <StatCard icon={Shield}     label="Admins"             value={statistics.users.admins}       color="purple" />
            <StatCard icon={TrendingUp} label="Nouveaux ce mois"   value={statistics.users.newThisMonth} color="yellow" />
          </div>
        </div>

        {/* Properties Stats */}
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>Propriétés</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={HomeIcon} label="Total Propriétés" value={statistics.properties.total}     color="primary" />
            <StatCard icon={HomeIcon} label="Disponibles"      value={statistics.properties.available} subtext={`${Math.round((statistics.properties.available / statistics.properties.total) * 100)}%`} color="green" />
            <StatCard icon={HomeIcon} label="Occupées"         value={statistics.properties.occupied}  subtext={`${Math.round((statistics.properties.occupied / statistics.properties.total) * 100)}%`} color="blue" />
            <StatCard icon={HomeIcon} label="Brouillons"       value={statistics.properties.draft}     color="yellow" />
          </div>
        </div>

        {/* Bookings & Contracts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: 32 }}>
          <div>
            <SectionTitle>Visites</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Calendar} label="Total"      value={statistics.bookings.total}     color="primary" />
              <StatCard icon={Calendar} label="En attente" value={statistics.bookings.pending}   color="yellow" />
              <StatCard icon={Calendar} label="Confirmées" value={statistics.bookings.confirmed} color="green" />
              <StatCard icon={Calendar} label="Annulées"   value={statistics.bookings.cancelled} color="red" />
            </div>
          </div>
          <div>
            <SectionTitle>Contrats</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={FileText} label="Total"      value={statistics.contracts.total}      color="primary" />
              <StatCard icon={FileText} label="Actifs"     value={statistics.contracts.active}     color="green" />
              <StatCard icon={FileText} label="Brouillons" value={statistics.contracts.draft}      color="yellow" />
              <StatCard icon={FileText} label="Résiliés"   value={statistics.contracts.terminated} color="red" />
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div style={{ marginBottom: 32 }}>
          <SectionTitle>Activité</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard icon={Eye}           label="Vues Totales" value={statistics.activity.totalViews.toLocaleString()} color="blue" />
            <StatCard icon={Mail}          label="Contacts"     value={statistics.activity.totalContacts}               color="primary" />
            <StatCard icon={MessageSquare} label="Messages"     value={statistics.activity.totalMessages}               color="green" />
          </div>
        </div>

        {/* Recent Activity */}
        {activity && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: BAI.radiusLg,
                boxShadow: BAI.shadowMd,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 700,
                  color: BAI.ink,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Users size={16} color={BAI.owner} />
                Utilisateurs Récents
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activity.users.slice(0, 5).map((user) => {
                  const roleBg =
                    user.role === 'OWNER'  ? BAI.ownerLight  :
                    user.role === 'TENANT' ? BAI.tenantLight :
                    BAI.errorLight
                  const roleColor =
                    user.role === 'OWNER'  ? BAI.owner  :
                    user.role === 'TENANT' ? BAI.tenant :
                    BAI.error
                  return (
                    <Link
                      key={user.id}
                      to={`/admin/users?userId=${user.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: BAI.bgMuted,
                        borderRadius: BAI.radius,
                        textDecoration: 'none',
                        transition: BAI.transition,
                      }}
                    >
                      <div>
                        <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                          {user.firstName} {user.lastName}
                        </p>
                        <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
                          {user.email}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: roleBg,
                            color: roleColor,
                            borderRadius: 10,
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {user.role}
                        </span>
                        <p style={{ margin: '4px 0 0', fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                          {format(new Date(user.createdAt), 'dd MMM', { locale: fr })}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>

            {/* Recent Properties */}
            <div
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: BAI.radiusLg,
                boxShadow: BAI.shadowMd,
                padding: '20px 24px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px',
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 700,
                  color: BAI.ink,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <HomeIcon size={16} color={BAI.owner} />
                Propriétés Récentes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activity.properties.slice(0, 5).map((property) => {
                  const statusBg =
                    property.status === 'AVAILABLE' ? BAI.tenantLight :
                    property.status === 'OCCUPIED'  ? BAI.ownerLight  :
                    BAI.caramelLight
                  const statusColor =
                    property.status === 'AVAILABLE' ? BAI.tenant :
                    property.status === 'OCCUPIED'  ? BAI.owner  :
                    BAI.caramel
                  return (
                    <div
                      key={property.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: BAI.bgMuted,
                        borderRadius: BAI.radius,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: BAI.fontBody,
                            fontSize: 14,
                            fontWeight: 600,
                            color: BAI.ink,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {property.title}
                        </p>
                        <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
                          {property.city} · {property.owner.firstName} {property.owner.lastName}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            background: statusBg,
                            color: statusColor,
                            borderRadius: 10,
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {property.status}
                        </span>
                        <p style={{ margin: '4px 0 0', fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                          {format(new Date(property.createdAt), 'dd MMM', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
