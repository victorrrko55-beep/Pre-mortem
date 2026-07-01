import { useProjectStore } from '../store/useProjectStore'
import type { Step } from '../types'

const STEPS: { key: Step; label: string }[] = [
  { key: 'setup', label: '1. 프로젝트 설정' },
  { key: 'premortem', label: '2. Pre-mortem' },
  { key: 'mapping', label: '3. Assumption Mapping' },
  { key: 'results', label: '4. 검증 우선순위' },
]

export function StepNav() {
  const step = useProjectStore((s) => s.step)
  const setStep = useProjectStore((s) => s.setStep)
  const canLeaveSetup = useProjectStore((s) => s.projectName.trim().length > 0)
  const hasPremortem = useProjectStore((s) => s.premortemItems.length > 0)
  const hasAssumptions = useProjectStore((s) => s.assumptions.length > 0)

  const isUnlocked = (key: Step) => {
    if (key === 'setup') return true
    if (key === 'premortem') return canLeaveSetup
    if (key === 'mapping') return canLeaveSetup && hasPremortem
    return canLeaveSetup && hasPremortem && hasAssumptions
  }

  return (
    <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
      {STEPS.map(({ key, label }) => {
        const unlocked = isUnlocked(key)
        const active = step === key
        return (
          <button
            key={key}
            type="button"
            disabled={!unlocked}
            onClick={() => setStep(key)}
            className={[
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              active
                ? 'bg-slate-900 text-white'
                : unlocked
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'cursor-not-allowed bg-slate-50 text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}
