import { useMemo } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { QUADRANT_INFO, quadrantOf, type Quadrant } from '../lib/quadrant'

function buildMarkdown(
  projectName: string,
  projectGoal: string,
  groups: Record<Quadrant, { text: string; importance: number; evidence: number }[]>,
) {
  const lines = [`# ${projectName || '프로젝트'} — Assumption Mapping 결과`]
  if (projectGoal) lines.push('', `목표: ${projectGoal}`)

  const order: Quadrant[] = ['leap-of-faith', 'keep-monitoring', 'nice-to-know', 'low-priority']
  for (const key of order) {
    const info = QUADRANT_INFO[key]
    const list = groups[key]
    if (list.length === 0) continue
    lines.push('', `## ${info.title}`, info.description, '')
    for (const a of list) {
      lines.push(`- ${a.text} (중요도 ${Math.round(a.importance)}, 근거 ${Math.round(a.evidence)})`)
    }
  }
  return lines.join('\n')
}

export function ResultsView() {
  const projectName = useProjectStore((s) => s.projectName)
  const projectGoal = useProjectStore((s) => s.projectGoal)
  const assumptions = useProjectStore((s) => s.assumptions)
  const setStep = useProjectStore((s) => s.setStep)
  const resetProject = useProjectStore((s) => s.resetProject)

  const groups = useMemo(() => {
    const result: Record<Quadrant, typeof assumptions> = {
      'leap-of-faith': [],
      'keep-monitoring': [],
      'nice-to-know': [],
      'low-priority': [],
    }
    for (const a of assumptions) {
      result[quadrantOf(a)].push(a)
    }
    for (const key of Object.keys(result) as Quadrant[]) {
      result[key].sort((a, b) => b.importance - a.importance || a.evidence - b.evidence)
    }
    return result
  }, [assumptions])

  const order: Quadrant[] = ['leap-of-faith', 'keep-monitoring', 'nice-to-know', 'low-priority']

  const handleExport = () => {
    const markdown = buildMarkdown(projectName, projectGoal, groups)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName || 'assumption-mapping'}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">검증 우선순위</h2>
          <button
            type="button"
            onClick={handleExport}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Markdown으로 내보내기
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          위쪽 항목부터 먼저 실험/인터뷰/조사로 검증하세요.
        </p>
      </div>

      {order
        .filter((key) => groups[key].length > 0)
        .map((key) => {
          const info = QUADRANT_INFO[key]
          return (
            <div key={key} className={`rounded-lg border p-4 ${info.color}`}>
              <h3 className="font-semibold">{info.title}</h3>
              <p className="mt-0.5 text-sm opacity-80">{info.description}</p>
              <ul className="mt-3 space-y-2">
                {groups[key].map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-black/10 bg-white/70 px-3 py-2 text-sm text-slate-800"
                  >
                    {a.text}
                    <span className="ml-2 text-xs text-slate-500">
                      (중요도 {Math.round(a.importance)} · 근거 {Math.round(a.evidence)})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep('mapping')}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          &larr; 이전
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm('새 프로젝트를 시작하면 현재 내용이 모두 초기화됩니다. 계속할까요?')) {
              resetProject()
            }
          }}
          className="rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          새 프로젝트 시작
        </button>
      </div>
    </div>
  )
}
