/**
 * matchingEngine.ts
 * Client-side pre-qualification scoring (mirrors server logic for instant feedback).
 * The authoritative score is always computed server-side at submission.
 */

import type { SelectionCriteria, MatchResult, MatchDetail } from '../types/application.types'

export interface TenantSnapshot {
  netSalary: number | null
  contractType: string | null
  docCategories: string[]          // e.g. ["IDENTITE", "REVENUS", "SITUATION_PRO"]
  hasGuarantor: boolean
  guarantorType?: string
}

export function computeClientScore(
  propertyPrice: number,
  criteria: SelectionCriteria,
  tenant: TenantSnapshot
): MatchResult {
  const ratio = criteria.minSalaryRatio ?? 3
  const threshold = propertyPrice * ratio

  // ── Salary (40 pts) ─────────────────────────────────────────────────────────
  let salaryPoints = 0
  let salaryStatus: MatchDetail['status'] = 'na'
  let salaryExplanation = ''

  if (tenant.netSalary === null) {
    salaryStatus = 'na'
    salaryExplanation = 'Salaire non renseigné. Complétez votre dossier.'
  } else if (tenant.netSalary >= threshold) {
    salaryStatus = 'pass'
    salaryPoints = 40
    salaryExplanation = `${tenant.netSalary} €/mois ≥ ${ratio}× le loyer (${threshold} €). ✓`
  } else if (tenant.netSalary >= threshold * 0.8) {
    salaryStatus = 'partial'
    salaryPoints = 20
    salaryExplanation = `${tenant.netSalary} €/mois légèrement insuffisant (seuil : ${threshold} €). Un garant fort peut compenser.`
  } else {
    salaryStatus = 'fail'
    salaryPoints = 0
    salaryExplanation = `Revenu de ${tenant.netSalary} €/mois insuffisant — seuil requis : ${threshold} €. Ajoutez un garant.`
  }

  // ── Guarantor (30 pts) ──────────────────────────────────────────────────────
  let guarantorPoints = 0
  let guarantorStatus: MatchDetail['status'] = 'na'
  let guarantorExplanation = ''

  if (!criteria.requiredGuarantor) {
    guarantorStatus = 'pass'
    guarantorPoints = 30
    guarantorExplanation = tenant.hasGuarantor
      ? 'Garant fourni (non obligatoire) — dossier renforcé.'
      : 'Garant non exigé pour ce bien.'
  } else if (!tenant.hasGuarantor) {
    guarantorStatus = 'fail'
    guarantorPoints = 0
    guarantorExplanation = 'Ce bien exige un garant. Ajoutez-en un pour postuler.'
  } else {
    const accepted = criteria.acceptedGuarantorTypes ?? ['physique', 'visale']
    if (!tenant.guarantorType || accepted.includes(tenant.guarantorType)) {
      guarantorStatus = 'pass'
      guarantorPoints = 30
      guarantorExplanation = `Garant ${tenant.guarantorType ?? ''} accepté. ✓`
    } else {
      guarantorStatus = 'fail'
      guarantorPoints = 0
      guarantorExplanation = `Type de garant non accepté. Types valides : ${accepted.join(', ')}.`
    }
  }

  // ── Documents (20 pts) ──────────────────────────────────────────────────────
  const required = criteria.requiredDocCategories ?? ['IDENTITE', 'REVENUS', 'EMPLOI']
  const present = required.filter((c) => tenant.docCategories.includes(c))
  const docRatio = required.length > 0 ? present.length / required.length : 1
  const docPoints = Math.round(docRatio * 20)
  const docStatus: MatchDetail['status'] =
    docRatio === 1 ? 'pass' : docRatio >= 0.5 ? 'partial' : 'fail'
  const missing = required.filter((c) => !tenant.docCategories.includes(c))
  const docExplanation =
    docRatio === 1
      ? 'Tous les documents obligatoires sont présents. ✓'
      : `Documents manquants : ${missing.join(', ')}.`

  // ── Contract type (10 pts) ──────────────────────────────────────────────────
  const preferred = criteria.preferredContractTypes ?? ['CDI']
  let contractPoints = 0
  let contractStatus: MatchDetail['status'] = 'na'
  let contractExplanation = ''

  if (!tenant.contractType) {
    contractStatus = 'na'
    contractPoints = 5
    contractExplanation = 'Type de contrat non renseigné.'
  } else if (preferred.includes(tenant.contractType)) {
    contractStatus = 'pass'
    contractPoints = 10
    contractExplanation = `Contrat ${tenant.contractType} — profil prioritaire. ✓`
  } else {
    contractStatus = 'partial'
    contractPoints = 5
    contractExplanation = `Contrat ${tenant.contractType} accepté (${preferred.join(', ')} préféré).`
  }

  const totalScore = salaryPoints + guarantorPoints + docPoints + contractPoints
  const minScore = criteria.minScore ?? 70
  const verdict: MatchResult['verdict'] =
    totalScore >= minScore ? 'ELIGIBLE' : totalScore >= 40 ? 'PARTIAL' : 'INELIGIBLE'

  return {
    score: totalScore,
    verdict,
    details: {
      salary:       { label: 'Solvabilité',               points: salaryPoints,    maxPoints: 40, status: salaryStatus,    explanation: salaryExplanation },
      guarantor:    { label: 'Garant',                    points: guarantorPoints, maxPoints: 30, status: guarantorStatus, explanation: guarantorExplanation },
      documents:    { label: 'Complétude du dossier',     points: docPoints,       maxPoints: 20, status: docStatus,       explanation: docExplanation },
      contractType: { label: 'Stabilité professionnelle', points: contractPoints,  maxPoints: 10, status: contractStatus,  explanation: contractExplanation },
    },
  }
}

/** Extract a TenantSnapshot from the user's profileMeta + document list */
export function extractTenantSnapshot(
  profileMeta: Record<string, unknown> | null | undefined,
  docCategories: string[],
  hasGuarantor: boolean,
  guarantorType?: string
): TenantSnapshot {
  const composed = (profileMeta?._composed ?? {}) as Record<string, unknown>
  return {
    netSalary: typeof composed.netSalary === 'number' ? composed.netSalary : null,
    contractType: typeof composed.contractType === 'string' ? composed.contractType : null,
    docCategories,
    hasGuarantor,
    guarantorType,
  }
}

/** Format a score as a colour-coded label */
export function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-red-600'
}

export function scoreBg(score: number): string {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-red-500'
}
