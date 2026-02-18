import { useState, FormEvent } from 'react'
import { X, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { authService } from '../../services/auth.service'
import toast from 'react-hot-toast'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordRequirements = [
    { text: 'Au moins 8 caracteres', met: newPassword.length >= 8 },
    { text: 'Une majuscule', met: /[A-Z]/.test(newPassword) },
    { text: 'Une minuscule', met: /[a-z]/.test(newPassword) },
    { text: 'Un chiffre', met: /[0-9]/.test(newPassword) },
  ]

  const isPasswordStrong = passwordRequirements.every((r) => r.met)

  const getStrengthPercent = () => {
    const met = passwordRequirements.filter((r) => r.met).length
    return (met / passwordRequirements.length) * 100
  }

  const getStrengthColor = () => {
    const pct = getStrengthPercent()
    if (pct <= 25) return 'bg-red-500'
    if (pct <= 50) return 'bg-orange-500'
    if (pct <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (!isPasswordStrong) {
      setError('Le nouveau mot de passe ne respecte pas les criteres')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (currentPassword === newPassword) {
      setError('Le nouveau mot de passe doit etre different de l\'actuel')
      return
    }

    setIsLoading(true)

    try {
      await authService.changePassword(currentPassword, newPassword)
      toast.success('Mot de passe modifie avec succes')
      handleClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setShowCurrent(false)
    setShowNew(false)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            Changer le mot de passe
          </h3>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input pl-10 pr-10 w-full"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrent ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pl-10 pr-10 w-full"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Strength Bar */}
            {newPassword && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                    style={{ width: `${getStrengthPercent()}%` }}
                  />
                </div>
              </div>
            )}

            {/* Requirements */}
            <div className="mt-2 space-y-1">
              {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  {req.met ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                  )}
                  <span
                    className={`text-xs ${
                      req.met ? 'text-green-600' : 'text-gray-500'
                    }`}
                  >
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10 w-full"
                disabled={isLoading}
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1">
                Les mots de passe ne correspondent pas
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-ghost flex-1"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1 disabled:opacity-50"
              disabled={isLoading || !isPasswordStrong || newPassword !== confirmPassword}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  En cours...
                </span>
              ) : (
                'Changer le mot de passe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
