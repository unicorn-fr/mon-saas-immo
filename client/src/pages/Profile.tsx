import { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { useAuth } from '../hooks/useAuth'
import { authService } from '../services/auth.service'
import ChangePasswordModal from '../components/auth/ChangePasswordModal'
import toast from 'react-hot-toast'
import {
  User,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  XCircle,
  Edit2,
  Save,
  X as XIcon,
  Lock,
  AlertTriangle,
  Loader2,
  Link as LinkIcon,
  Trash2,
  FileText,
} from 'lucide-react'

export default function Profile() {
  const { user, updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateProfile(formData)
      toast.success('Profil mis a jour avec succes')
      setIsEditing(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la mise a jour'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
    })
    setIsEditing(false)
  }

  const handleResendVerification = async () => {
    setIsResendingVerification(true)
    try {
      await authService.resendVerification()
      toast.success('Email de verification envoye !')
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Erreur lors de l\'envoi de l\'email'
      )
    } finally {
      setIsResendingVerification(false)
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'Proprietaire'
      case 'TENANT':
        return 'Locataire'
      case 'ADMIN':
        return 'Administrateur'
      default:
        return role
    }
  }

  const hasPassword = true // We don't expose this from the API but default to true

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Votre adresse email n'est pas verifiee
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Verifiez votre email pour acceder a toutes les fonctionnalites.
              </p>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              className="btn btn-primary text-sm flex-shrink-0 disabled:opacity-50"
            >
              {isResendingVerification ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Renvoyer l\'email'
              )}
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mon Profil
          </h1>
          <p className="text-gray-600">
            Gerez vos informations personnelles et vos parametres
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-primary-600" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                  <Shield className="w-4 h-4" />
                  {getRoleName(user?.role || '')}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email verifie</span>
                    {user?.emailVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Telephone verifie
                    </span>
                    {user?.phoneVerified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {!user?.emailVerified && (
                <div className="mt-6">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="btn btn-primary w-full text-sm disabled:opacity-50"
                  >
                    {isResendingVerification ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Envoi...
                      </span>
                    ) : (
                      'Verifier mon email'
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    La verification augmente la confiance des autres
                    utilisateurs
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* ===== Section: Profil ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-gray-700" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Informations personnelles
                  </h3>
                </div>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn btn-ghost flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCancel}
                      className="btn btn-ghost flex items-center gap-2"
                      disabled={isSaving}
                    >
                      <XIcon className="w-4 h-4" />
                      Annuler
                    </button>
                    <button
                      onClick={handleSave}
                      className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Enregistrer
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prenom
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="input w-full"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user?.firstName}</span>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="input w-full"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{user?.lastName}</span>
                    </div>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user?.email}</span>
                    {user?.emailVerified && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    L'email ne peut pas etre modifie
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telephone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="06 12 34 56 78"
                      className="input w-full"
                      disabled={isSaving}
                    />
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">
                        {user?.phone || 'Non renseigne'}
                      </span>
                      {user?.phoneVerified && (
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      )}
                    </div>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Parlez-nous de vous..."
                      className="input w-full min-h-[100px] resize-y"
                      disabled={isSaving}
                      rows={4}
                    />
                  ) : (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg min-h-[60px]">
                      <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                      <span className="text-gray-900">
                        {user?.bio || 'Aucune bio renseignee'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de compte
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">
                      {getRoleName(user?.role || '')}
                    </span>
                  </div>
                </div>

                {/* Created At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membre depuis
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString(
                            'fr-FR',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== Section: Securite ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Lock className="w-5 h-5 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">Securite</h3>
              </div>
              <div className="space-y-4">
                {hasPassword && (
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn btn-secondary w-full justify-start gap-3"
                  >
                    <Lock className="w-4 h-4" />
                    Changer le mot de passe
                  </button>
                )}
                <button
                  disabled
                  className="btn btn-secondary w-full justify-start gap-3 opacity-60 cursor-not-allowed"
                >
                  <Shield className="w-4 h-4" />
                  Activer l'authentification a deux facteurs
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    Bientot disponible
                  </span>
                </button>
              </div>
            </div>

            {/* ===== Section: Comptes lies ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <LinkIcon className="w-5 h-5 text-gray-700" />
                <h3 className="text-xl font-bold text-gray-900">
                  Comptes lies
                </h3>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">Google</p>
                    <p className="text-sm text-gray-500">
                      Connectez-vous avec votre compte Google
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID
                    ? 'Disponible'
                    : 'Non configure'}
                </span>
              </div>
            </div>

            {/* ===== Section: Zone de danger ===== */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="text-xl font-bold text-red-900">
                  Zone de danger
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Une fois votre compte supprime, toutes vos donnees seront
                definitivement perdues. Cette action est irreversible.
              </p>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer mon compte
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowDeleteDialog(false)
              setDeleteConfirmText('')
            }}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Supprimer votre compte ?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est <strong>irreversible</strong>. Toutes vos
              donnees, proprietes, contrats et messages seront supprimes
              definitivement.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tapez <strong>SUPPRIMER</strong> pour confirmer
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="input w-full"
                placeholder="SUPPRIMER"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false)
                  setDeleteConfirmText('')
                }}
                className="btn btn-ghost flex-1"
              >
                Annuler
              </button>
              <button
                disabled={deleteConfirmText !== 'SUPPRIMER'}
                onClick={() => {
                  toast.error(
                    'La suppression de compte sera bientot disponible'
                  )
                  setShowDeleteDialog(false)
                  setDeleteConfirmText('')
                }}
                className="btn bg-red-600 hover:bg-red-700 text-white flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer definitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
