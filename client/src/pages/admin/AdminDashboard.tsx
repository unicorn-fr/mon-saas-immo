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
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

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
    const colorClasses = {
      primary: 'bg-primary-100 text-primary-600',
      green: 'bg-green-100 text-green-600',
      yellow: 'bg-yellow-100 text-yellow-600',
      red: 'bg-red-100 text-red-600',
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
    }

    const content = (
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
            {subtext && <p className="text-sm text-gray-500">{subtext}</p>}
          </div>
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    )

    return link ? <Link to={link}>{content}</Link> : content
  }

  if (isLoading || !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-7 h-7 text-primary-600" />
                Administration
              </h1>
              <p className="text-gray-600 mt-1">Gestion de la plateforme</p>
            </div>
            <Link to="/admin/users" className="btn btn-primary">
              <Users className="w-5 h-5 mr-2" />
              Gérer les utilisateurs
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Users Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <StatCard
              icon={Users}
              label="Total Utilisateurs"
              value={statistics.users.total}
              color="primary"
              link="/admin/users"
            />
            <StatCard
              icon={HomeIcon}
              label="Propriétaires"
              value={statistics.users.owners}
              subtext={`${Math.round((statistics.users.owners / statistics.users.total) * 100)}%`}
              color="blue"
            />
            <StatCard
              icon={Users}
              label="Locataires"
              value={statistics.users.tenants}
              subtext={`${Math.round((statistics.users.tenants / statistics.users.total) * 100)}%`}
              color="green"
            />
            <StatCard
              icon={Shield}
              label="Admins"
              value={statistics.users.admins}
              color="purple"
            />
            <StatCard
              icon={TrendingUp}
              label="Nouveaux ce mois"
              value={statistics.users.newThisMonth}
              color="yellow"
            />
          </div>
        </div>

        {/* Properties Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Propriétés</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={HomeIcon}
              label="Total Propriétés"
              value={statistics.properties.total}
              color="primary"
            />
            <StatCard
              icon={HomeIcon}
              label="Disponibles"
              value={statistics.properties.available}
              subtext={`${Math.round((statistics.properties.available / statistics.properties.total) * 100)}%`}
              color="green"
            />
            <StatCard
              icon={HomeIcon}
              label="Occupées"
              value={statistics.properties.occupied}
              subtext={`${Math.round((statistics.properties.occupied / statistics.properties.total) * 100)}%`}
              color="blue"
            />
            <StatCard
              icon={HomeIcon}
              label="Brouillons"
              value={statistics.properties.draft}
              color="yellow"
            />
          </div>
        </div>

        {/* Bookings & Contracts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bookings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Visites</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Calendar}
                label="Total"
                value={statistics.bookings.total}
                color="primary"
              />
              <StatCard
                icon={Calendar}
                label="En attente"
                value={statistics.bookings.pending}
                color="yellow"
              />
              <StatCard
                icon={Calendar}
                label="Confirmées"
                value={statistics.bookings.confirmed}
                color="green"
              />
              <StatCard
                icon={Calendar}
                label="Annulées"
                value={statistics.bookings.cancelled}
                color="red"
              />
            </div>
          </div>

          {/* Contracts */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contrats</h2>
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={FileText}
                label="Total"
                value={statistics.contracts.total}
                color="primary"
              />
              <StatCard
                icon={FileText}
                label="Actifs"
                value={statistics.contracts.active}
                color="green"
              />
              <StatCard
                icon={FileText}
                label="Brouillons"
                value={statistics.contracts.draft}
                color="yellow"
              />
              <StatCard
                icon={FileText}
                label="Résiliés"
                value={statistics.contracts.terminated}
                color="red"
              />
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              icon={Eye}
              label="Vues Totales"
              value={statistics.activity.totalViews.toLocaleString()}
              color="blue"
            />
            <StatCard
              icon={Mail}
              label="Contacts"
              value={statistics.activity.totalContacts}
              color="purple"
            />
            <StatCard
              icon={MessageSquare}
              label="Messages"
              value={statistics.activity.totalMessages}
              color="green"
            />
          </div>
        </div>

        {/* Recent Activity */}
        {activity && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                Utilisateurs Récents
              </h3>
              <div className="space-y-3">
                {activity.users.slice(0, 5).map((user) => (
                  <Link
                    key={user.id}
                    to={`/admin/users/${user.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.role === 'OWNER'
                            ? 'bg-blue-100 text-blue-700'
                            : user.role === 'TENANT'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(user.createdAt), 'dd MMM', { locale: fr })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Recent Properties */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-primary-600" />
                Propriétés Récentes
              </h3>
              <div className="space-y-3">
                {activity.properties.slice(0, 5).map((property) => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{property.title}</p>
                      <p className="text-sm text-gray-600">
                        {property.city} • {property.owner.firstName} {property.owner.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          property.status === 'AVAILABLE'
                            ? 'bg-green-100 text-green-700'
                            : property.status === 'OCCUPIED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {property.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(property.createdAt), 'dd MMM', { locale: fr })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
