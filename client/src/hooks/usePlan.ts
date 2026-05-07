import { useState, useEffect } from 'react'
import { apiClient } from '../services/api.service'
import { useAuthStore } from '../store/authStore'

type PlanId = 'FREE' | 'SOLO' | 'PRO' | 'EXPERT'
const PLAN_ORDER: Record<PlanId, number> = { FREE: 0, SOLO: 1, PRO: 2, EXPERT: 3 }

interface PlanInfo {
  plan: PlanId
  status: string
  loading: boolean
  hasPlan: (required: PlanId) => boolean // true si plan >= required
}

export function usePlan(): PlanInfo {
  const { user } = useAuthStore()
  const [plan, setPlan] = useState<PlanId>('FREE')
  const [status, setStatus] = useState('ACTIVE')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    apiClient.get('/stripe/subscription')
      .then(res => {
        setPlan(res.data.plan ?? 'FREE')
        setStatus(res.data.status ?? 'ACTIVE')
      })
      .catch(() => {}) // silencieux — FREE par défaut
      .finally(() => setLoading(false))
  }, [user])

  return {
    plan,
    status,
    loading,
    hasPlan: (required: PlanId) => PLAN_ORDER[plan] >= PLAN_ORDER[required],
  }
}
