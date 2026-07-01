import { useMemo, useRef, useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { AssumptionCard } from './AssumptionCard'

export function AssumptionMapper() {
  const premortemItems = useProjectStore((s) => s.premortemItems)
  const assumptions = useProjectStore((s) => s.assumptions)
  const convertToAssumption = useProjectStore((s) => s.convertToAssumption)
  const addAssumption = useProjectStore((s) => s.addAssumption)
  const updateAssumption = useProjectStore((s) => s.updateAssumption)
  const removeAssumption = useProjectStore((s) => s.removeAssumption)
  const setStep = useProjectStore((s) => s.setStep)

  const convertedSourceIds = useMemo(
    () => new Set(assumptions.map((a) => a.sourceItemId).filter(Boolean)),
    [assumptions],
  )
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set())
  const pendingItems = premortemItems.filter(
    (item) => !convertedSourceIds.has(item.id) && !skippedIds.has(item.id),
  )

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [newAssumption, setNewAssumption] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const skip = (id: string) => setSkippedIds((prev) => new Set(prev).add(id))

  const convert = (itemId: string) => {
    const text = (drafts[itemId] ?? '').trim()
    if (!text) return
    convertToAssumption(itemId, text)
    setDrafts((prev) => {
      const next = { ...prev }
      delete next[itemId]
      return next
    })
  }

  const submitNewAssumption = () => {
    const text = newAssumption.trim()
    if (!text) return
    addAssumption(text)
    setNewAssumption('')
  }

  const selected = assumptions.find((a) => a.id === selectedId) ?? null

  return (
    <div className="space-y-6">
      {pendingItems.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">가정으로 바꾸기</h2>
          <p className="mt-1 text-sm text-slate-500">
            각 실패 원인이 사실이 되려면 무엇이 참이어야 했을까요? 그 &quot;가정&quot;을 한 문장으로
            적어보세요.
          </p>
          <ul className="mt-4 space-y-3">
            {pendingItems.map((item) => (
              <li key={item.id} className="rounded-md border border-slate-200 p-3">
                <p className="text-sm text-slate-500">
                  실패 원인: <span className="text-slate-800">{item.text}</span>
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={drafts[item.id] ?? ''}
                    onChange={(e) =>
                      setDrafts((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') convert(item.id)
                    }}
                    placeholder="예: 사용자는 이 문제를 돈을 내고 해결할 만큼 절실하다"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => convert(item.id)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                  >
                    가정 추가
                  </button>
                  <button
                    type="button"
                    onClick={() => skip(item.id)}
                    className="rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
                  >
                    건너뛰기
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">가정 지도 (Assumption Map)</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAssumption}
              onChange={(e) => setNewAssumption(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewAssumption()
              }}
              placeholder="가정 직접 추가"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={submitNewAssumption}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              추가
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          카드를 드래그해서 <strong>중요도</strong>(세로)와 <strong>근거 수준</strong>(가로)에 맞게
          배치하세요.
        </p>

        <div className="mt-6 flex gap-2">
          <div className="flex w-6 flex-col items-center justify-between text-xs text-slate-400">
            <span className="[writing-mode:vertical-rl]">중요함</span>
            <span className="rotate-180 [writing-mode:vertical-rl]">중요하지 않음</span>
          </div>
          <div className="flex-1">
            <div
              ref={gridRef}
              className="relative aspect-square w-full overflow-hidden rounded-lg border border-slate-300"
            >
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="border-b border-r border-slate-200 bg-red-50/60" />
                <div className="border-b border-slate-200 bg-amber-50/60" />
                <div className="border-r border-slate-200 bg-slate-50" />
                <div className="bg-blue-50/60" />
              </div>

              {assumptions.map((a) => (
                <AssumptionCard
                  key={a.id}
                  assumption={a}
                  selected={a.id === selectedId}
                  onSelect={setSelectedId}
                  onMove={(id, importance, evidence) =>
                    updateAssumption(id, { importance, evidence })
                  }
                  containerRef={gridRef}
                />
              ))}

              {assumptions.length === 0 && (
                <p className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-slate-400">
                  아직 가정이 없습니다. 위에서 실패 원인을 가정으로 바꾸거나 직접 추가해보세요.
                </p>
              )}
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>근거 부족 (추측)</span>
              <span>근거 충분 (검증됨)</span>
            </div>
          </div>
        </div>

        {selected && (
          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-800">{selected.text}</p>
              <button
                type="button"
                onClick={() => {
                  removeAssumption(selected.id)
                  setSelectedId(null)
                }}
                className="shrink-0 text-xs text-slate-400 hover:text-red-600"
              >
                삭제
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <label className="block">
                중요도: {Math.round(selected.importance)}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selected.importance}
                  onChange={(e) =>
                    updateAssumption(selected.id, { importance: Number(e.target.value) })
                  }
                  className="mt-1 w-full"
                />
              </label>
              <label className="block">
                근거 수준: {Math.round(selected.evidence)}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selected.evidence}
                  onChange={(e) =>
                    updateAssumption(selected.id, { evidence: Number(e.target.value) })
                  }
                  className="mt-1 w-full"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep('premortem')}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          &larr; 이전
        </button>
        <button
          type="button"
          disabled={assumptions.length === 0}
          onClick={() => setStep('results')}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          검증 우선순위 보기 &rarr;
        </button>
      </div>
    </div>
  )
}
