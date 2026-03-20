/**
 * SelectionCriteriaForm — embedded in CreateProperty / EditProperty
 * Lets an owner define pre-qualification requirements for their listing.
 */
import { Info } from 'lucide-react'
import type { SelectionCriteria } from '../../types/application.types'

const DOC_CATEGORIES = [
  { value: 'IDENTITE',       label: "Pièce d'identité" },
  { value: 'SITUATION_PRO',  label: 'Contrat de travail' },
  { value: 'REVENUS',        label: 'Bulletins de salaire' },
  { value: 'HISTORIQUE',     label: 'Quittances de loyer' },
  { value: 'GARANTIES',      label: 'Garant / Visale' },
]

const CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Intérim', 'Indépendant', 'Retraite']

interface Tip {
  text: string
}

function Tooltip({ text }: Tip) {
  return (
    <span className="group relative inline-flex ml-1.5">
      <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
      <span className="pointer-events-none absolute left-5 top-0 z-20 w-64 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  )
}

interface Props {
  criteria: SelectionCriteria
  onChange: (c: SelectionCriteria) => void
}

export function SelectionCriteriaForm({ criteria, onChange }: Props) {
  function update(patch: Partial<SelectionCriteria>) {
    onChange({ ...criteria, ...patch })
  }

  function toggleDocCategory(cat: string) {
    const current = criteria.requiredDocCategories ?? []
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat]
    update({ requiredDocCategories: next })
  }

  function toggleContractType(ct: string) {
    const current = criteria.preferredContractTypes ?? []
    const next = current.includes(ct) ? current.filter((c) => c !== ct) : [...current, ct]
    update({ preferredContractTypes: next })
  }

  function toggleGuarantorType(gt: string) {
    const current = criteria.acceptedGuarantorTypes ?? []
    const next = current.includes(gt) ? current.filter((c) => c !== gt) : [...current, gt]
    update({ acceptedGuarantorTypes: next })
  }

  return (
    <div className="space-y-6">
      {/* Salary ratio */}
      <div>
        <label className="flex items-center text-sm font-medium text-slate-700 mb-1">
          Ratio de solvabilité minimal
          <Tooltip text="Standard agence : 3× le loyer. Ex : loyer 900 € → revenu net ≥ 2 700 €/mois. Abaissez à 2,5× si vous acceptez des garants." />
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={2}
            max={5}
            step={0.5}
            value={criteria.minSalaryRatio ?? 3}
            onChange={(e) => update({ minSalaryRatio: parseFloat(e.target.value) })}
            className="w-48 accent-violet-600"
          />
          <span className="text-sm font-semibold text-[#1a1a2e] w-14">
            {criteria.minSalaryRatio ?? 3}× le loyer
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Score minimal requis pour soumettre une candidature :&nbsp;
          <span className="font-medium">{criteria.minScore ?? 70}/100</span>
          &nbsp;—&nbsp;
          <input
            type="range"
            min={40}
            max={100}
            step={5}
            value={criteria.minScore ?? 70}
            onChange={(e) => update({ minScore: parseInt(e.target.value) })}
            className="w-32 accent-violet-600 align-middle"
          />
        </p>
      </div>

      {/* Guarantor */}
      <div>
        <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
          Garant
          <Tooltip text="Exiger un garant renforce votre protection contre les impayés. Visale (Action Logement) est gratuit pour le bailleur et couvre jusqu'à 36 mois de loyers." />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked={criteria.requiredGuarantor ?? false}
            onChange={(e) => update({ requiredGuarantor: e.target.checked })}
            className="rounded accent-violet-600"
          />
          Exiger un garant
        </label>
        {criteria.requiredGuarantor && (
          <div className="ml-6 space-y-1.5">
            <p className="text-xs text-slate-500 mb-1">Types de garant acceptés :</p>
            {[
              { value: 'physique', label: 'Garant physique (personne réelle)' },
              { value: 'visale',   label: 'Visale — Action Logement' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(criteria.acceptedGuarantorTypes ?? []).includes(value)}
                  onChange={() => toggleGuarantorType(value)}
                  className="rounded accent-violet-600"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Required docs */}
      <div>
        <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
          Documents obligatoires
          <Tooltip text="Cochez les catégories de pièces que le locataire doit avoir uploadées dans son dossier pour pouvoir postuler." />
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DOC_CATEGORIES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={(criteria.requiredDocCategories ?? []).includes(value)}
                onChange={() => toggleDocCategory(value)}
                className="rounded accent-violet-600"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Preferred contract types */}
      <div>
        <label className="flex items-center text-sm font-medium text-slate-700 mb-2">
          Situations professionnelles prioritaires
          <Tooltip text="Les dossiers correspondant à ces types de contrat obtiennent un bonus de score. Les autres ne sont pas bloqués." />
        </label>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_TYPES.map((ct) => {
            const active = (criteria.preferredContractTypes ?? []).includes(ct)
            return (
              <button
                key={ct}
                type="button"
                onClick={() => toggleContractType(ct)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'border-[#1a1a2e] bg-[#eaf0fb] text-[#1a1a2e]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {ct}
              </button>
            )
          })}
        </div>
      </div>

      {/* Auto-pilot */}
      <div className="rounded-xl border border-[#d0e6ff] bg-[#e8f0fe] p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={criteria.autoPilot ?? false}
            onChange={(e) => update({ autoPilot: e.target.checked })}
            className="mt-0.5 rounded accent-violet-600"
          />
          <span>
            <span className="text-sm font-semibold text-[#0055b3]">Mode Auto-Pilot</span>
            <span className="ml-1.5 text-xs font-medium rounded-full bg-[#b8ccf0] text-[#1a1a2e] px-2 py-0.5">Bêta</span>
            <p className="text-xs text-[#1a1a2e] mt-0.5">
              Approuve automatiquement toute candidature atteignant le score minimal ({criteria.minScore ?? 70}/100)
              sans action de votre part. Le créneau de visite est immédiatement débloqué.
            </p>
          </span>
        </label>
      </div>
    </div>
  )
}
