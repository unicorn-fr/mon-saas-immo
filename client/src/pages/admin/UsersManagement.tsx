import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import { AdminUser } from '../../types/admin.types'
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Home as HomeIcon,
  User,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import toast from 'react-hot-toast'

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>('ALL')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null)

  const limit = 20

  useEffect(() => {
    loadUsers()
  }, [page, roleFilter, emailVerifiedFilter])

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, limit }
      if (roleFilter !== 'ALL') params.role = roleFilter
      if (emailVerifiedFilter === 'VERIFIED') params.emailVerified = true
      if (emailVerifiedFilter === 'UNVERIFIED') params.emailVerified = false
      if (searchQuery) params.searchQuery = searchQuery

      const data = await adminService.getUsers(params)
      setUsers(data.users)
      setTotal(data.total)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadUsers()
  }

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Changer le rôle de cet utilisateur en ${newRole} ?`)) return

    try {
      await adminService.updateUserRole(userId, newRole)
      toast.success('Rôle modifié avec succès')
      loadUsers()
      setShowActionMenu(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return

    try {
      await adminService.deleteUser(userId)
      toast.success('Utilisateur supprimé avec succès')
      loadUsers()
      setShowActionMenu(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      OWNER: 'bg-blue-100 text-blue-700',
      TENANT: 'bg-green-100 text-green-700',
      ADMIN: 'bg-purple-100 text-purple-700',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors]}`}>
        {role}
      </span>
    )
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-7 h-7 text-primary-600" />
                Gestion des Utilisateurs
              </h1>
              <p className="text-gray-600 mt-1">
                {total} utilisateur{total > 1 ? 's' : ''} au total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  className="input pl-10"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Rechercher
              </button>
            </form>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="input w-40"
            >
              <option value="ALL">Tous les rôles</option>
              <option value="OWNER">Propriétaires</option>
              <option value="TENANT">Locataires</option>
              <option value="ADMIN">Admins</option>
            </select>

            {/* Email Verified Filter */}
            <select
              value={emailVerifiedFilter}
              onChange={(e) => {
                setEmailVerifiedFilter(e.target.value)
                setPage(1)
              }}
              className="input w-40"
            >
              <option value="ALL">Tous</option>
              <option value="VERIFIED">Vérifiés</option>
              <option value="UNVERIFIED">Non vérifiés</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="card text-center py-20">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Utilisateur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rôle
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Statut
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Activité
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Inscription
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {user.emailVerified ? (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <CheckCircle className="w-3 h-3" />
                                Vérifié
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <XCircle className="w-3 h-3" />
                                Non vérifié
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600">
                            {user._count.ownedProperties > 0 && (
                              <p>{user._count.ownedProperties} propriété(s)</p>
                            )}
                            {user._count.bookings > 0 && <p>{user._count.bookings} visite(s)</p>}
                            {user._count.sentMessages > 0 && (
                              <p>{user._count.sentMessages} message(s)</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">
                            {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </p>
                          {user.lastLoginAt && (
                            <p className="text-xs text-gray-500">
                              Vu: {format(new Date(user.lastLoginAt), 'dd MMM', { locale: fr })}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() =>
                                setShowActionMenu(showActionMenu === user.id ? null : user.id)
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {showActionMenu === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                                <div className="py-1">
                                  <p className="px-4 py-2 text-xs font-medium text-gray-500">
                                    Changer le rôle
                                  </p>
                                  {['OWNER', 'TENANT', 'ADMIN']
                                    .filter((role) => role !== user.role)
                                    .map((role) => (
                                      <button
                                        key={role}
                                        onClick={() => handleChangeRole(user.id, role)}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                      >
                                        {role === 'OWNER' && <HomeIcon className="w-4 h-4" />}
                                        {role === 'TENANT' && <User className="w-4 h-4" />}
                                        {role === 'ADMIN' && <Shield className="w-4 h-4" />}
                                        {role}
                                      </button>
                                    ))}
                                  <hr className="my-1" />
                                  <button
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Précédent
                </button>
                <span className="flex items-center px-4 text-sm text-gray-600">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary disabled:opacity-50"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Click outside to close menu */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  )
}
