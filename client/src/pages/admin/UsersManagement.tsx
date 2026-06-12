import { useEffect, useState } from 'react'
import { adminService } from '../../services/admin.service'
import { AdminUser } from '../../types/admin.types'
import {
  Users,
  Search,
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
import { BAI } from '../../constants/bailio-tokens'

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>('ALL')

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
    const bg =
      role === 'OWNER'  ? BAI.ownerLight  :
      role === 'TENANT' ? BAI.tenantLight :
      BAI.errorLight
    const color =
      role === 'OWNER'  ? BAI.owner  :
      role === 'TENANT' ? BAI.tenant :
      BAI.error
    const border =
      role === 'OWNER'  ? BAI.ownerBorder  :
      role === 'TENANT' ? BAI.tenantBorder :
      BAI.error

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: bg,
          color,
          border: `1px solid ${border}`,
          borderRadius: 10,
          fontFamily: BAI.fontBody,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {role}
      </span>
    )
  }

  const totalPages = Math.ceil(total / limit)

  const inputStyle: React.CSSProperties = {
    background: BAI.bgMuted,
    border: `1px solid ${BAI.border}`,
    borderRadius: BAI.radius,
    fontFamily: BAI.fontBody,
    fontSize: 14,
    color: BAI.ink,
    padding: '10px 14px',
    outline: 'none',
    width: '100%',
  }

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
            Gestion des utilisateurs
          </h1>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.20)',
            borderRadius: BAI.radius,
            color: '#ffffff',
            fontFamily: BAI.fontBody,
            fontSize: 13,
            fontWeight: 600,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <Users size={14} />
          {total} utilisateur{total > 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(16px,3vw,32px) clamp(12px,4vw,32px)' }}>

        {/* Filters card */}
        <div
          style={{
            background: BAI.bgSurface,
            border: `1px solid ${BAI.border}`,
            borderRadius: BAI.radiusLg,
            boxShadow: BAI.shadowMd,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: BAI.inkFaint,
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom ou email..."
                  style={{ ...inputStyle, paddingLeft: 36 }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  background: BAI.night,
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: BAI.radius,
                  fontFamily: BAI.fontBody,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 44,
                }}
              >
                Rechercher
              </button>
            </form>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
              style={{ ...inputStyle, width: 160, flexShrink: 0 }}
            >
              <option value="ALL">Tous les rôles</option>
              <option value="OWNER">Propriétaires</option>
              <option value="TENANT">Locataires</option>
              <option value="ADMIN">Admins</option>
            </select>

            {/* Email Verified Filter */}
            <select
              value={emailVerifiedFilter}
              onChange={(e) => { setEmailVerifiedFilter(e.target.value); setPage(1) }}
              style={{ ...inputStyle, width: 160, flexShrink: 0 }}
            >
              <option value="ALL">Tous</option>
              <option value="VERIFIED">Vérifiés</option>
              <option value="UNVERIFIED">Non vérifiés</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
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
        ) : users.length === 0 ? (
          <div
            style={{
              background: BAI.bgSurface,
              border: `1px solid ${BAI.border}`,
              borderRadius: BAI.radiusLg,
              boxShadow: BAI.shadowMd,
              padding: '80px 24px',
              textAlign: 'center',
            }}
          >
            <Users size={48} color={BAI.inkFaint} style={{ margin: '0 auto 16px' }} />
            <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 14, color: BAI.inkMid }}>
              Aucun utilisateur trouvé
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                background: BAI.bgSurface,
                border: `1px solid ${BAI.border}`,
                borderRadius: BAI.radiusLg,
                boxShadow: BAI.shadowMd,
                overflow: 'hidden',
              }}
            >
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: BAI.bgMuted }}>
                      {['Utilisateur', 'Rôle', 'Statut', 'Activité', 'Inscription', 'Actions'].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: '12px 16px',
                            fontFamily: BAI.fontBody,
                            fontSize: 11,
                            fontWeight: 700,
                            color: BAI.inkFaint,
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            textAlign: i === 5 ? 'right' : 'left',
                            borderBottom: `1px solid ${BAI.border}`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        style={{ borderBottom: `1px solid ${BAI.border}` }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 14, fontWeight: 600, color: BAI.ink }}>
                            {user.firstName} {user.lastName}
                          </p>
                          <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 12, color: BAI.inkMid }}>
                            {user.email}
                          </p>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {getRoleBadge(user.role)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {user.emailVerified ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontFamily: BAI.fontBody,
                                fontSize: 12,
                                color: BAI.tenant,
                              }}
                            >
                              <CheckCircle size={13} />
                              Vérifié
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                fontFamily: BAI.fontBody,
                                fontSize: 12,
                                color: BAI.inkFaint,
                              }}
                            >
                              <XCircle size={13} />
                              Non vérifié
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                            {user._count.ownedProperties > 0 && (
                              <p style={{ margin: 0 }}>{user._count.ownedProperties} propriété(s)</p>
                            )}
                            {user._count.bookings > 0 && (
                              <p style={{ margin: 0 }}>{user._count.bookings} visite(s)</p>
                            )}
                            {user._count.sentMessages > 0 && (
                              <p style={{ margin: 0 }}>{user._count.sentMessages} message(s)</p>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                            {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                          </p>
                          {user.lastLoginAt && (
                            <p style={{ margin: 0, fontFamily: BAI.fontBody, fontSize: 11, color: BAI.inkFaint }}>
                              Vu: {format(new Date(user.lastLoginAt), 'dd MMM', { locale: fr })}
                            </p>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                              style={{
                                padding: 8,
                                background: 'transparent',
                                border: `1px solid ${BAI.border}`,
                                borderRadius: BAI.radius,
                                cursor: 'pointer',
                                color: BAI.inkMid,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 36,
                                minHeight: 36,
                              }}
                            >
                              <MoreVertical size={16} />
                            </button>

                            {showActionMenu === user.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 'calc(100% + 6px)',
                                  width: 192,
                                  background: BAI.bgSurface,
                                  border: `1px solid ${BAI.border}`,
                                  borderRadius: BAI.radius,
                                  boxShadow: BAI.shadowLg,
                                  zIndex: 10,
                                  overflow: 'hidden',
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    padding: '8px 16px',
                                    fontFamily: BAI.fontBody,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: BAI.inkFaint,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.08em',
                                    borderBottom: `1px solid ${BAI.border}`,
                                  }}
                                >
                                  Changer le rôle
                                </p>
                                {['OWNER', 'TENANT', 'ADMIN']
                                  .filter((role) => role !== user.role)
                                  .map((role) => (
                                    <button
                                      key={role}
                                      onClick={() => handleChangeRole(user.id, role)}
                                      style={{
                                        width: '100%',
                                        padding: '9px 16px',
                                        background: 'transparent',
                                        border: 'none',
                                        textAlign: 'left',
                                        fontFamily: BAI.fontBody,
                                        fontSize: 13,
                                        color: BAI.ink,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                      }}
                                    >
                                      {role === 'OWNER'  && <HomeIcon size={14} color={BAI.owner} />}
                                      {role === 'TENANT' && <User size={14} color={BAI.tenant} />}
                                      {role === 'ADMIN'  && <Shield size={14} color={BAI.error} />}
                                      {role}
                                    </button>
                                  ))}
                                <div style={{ borderTop: `1px solid ${BAI.border}` }} />
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  style={{
                                    width: '100%',
                                    padding: '9px 16px',
                                    background: 'transparent',
                                    border: 'none',
                                    textAlign: 'left',
                                    fontFamily: BAI.fontBody,
                                    fontSize: 13,
                                    color: BAI.error,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                  }}
                                >
                                  <Trash2 size={14} />
                                  Supprimer
                                </button>
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '9px 18px',
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: BAI.radius,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    color: BAI.inkMid,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1,
                    minHeight: 44,
                  }}
                >
                  Précédent
                </button>
                <span style={{ padding: '0 12px', fontFamily: BAI.fontBody, fontSize: 13, color: BAI.inkMid }}>
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '9px 18px',
                    background: BAI.bgSurface,
                    border: `1px solid ${BAI.border}`,
                    borderRadius: BAI.radius,
                    fontFamily: BAI.fontBody,
                    fontSize: 14,
                    color: BAI.inkMid,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1,
                    minHeight: 44,
                  }}
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
          style={{ position: 'fixed', inset: 0, zIndex: 0 }}
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  )
}
