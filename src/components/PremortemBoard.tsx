import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'

export function PremortemBoard() {
  const projectName = useProjectStore((s) => s.projectName)
  const items = useProjectStore((s) => s.premortemItems)
  const addItem = useProjectStore((s) => s.addPremortemItem)
  const updateItem = useProjectStore((s) => s.updatePremortemItem)
  const removeItem = useProjectStore((s) => s.removePremortemItem)
  const setStep = useProjectStore((s) => s.setStep)

  const [draft, setDraft] = useState('')

  const submit = () => {
    const text = draft.trim()
    if (!text) return
    addItem(text)
    setDraft('')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">
          {projectName || '이 프로젝트'}가 실패했다고 상상해보세요
        </h2>
        <p className="mt-1 text-sm text-red-800">
          지금부터 1년 뒤, 이 프로젝트가 완전히 실패했습니다. 무엇이 원인이었을까요? 검열하지 말고
          떠오르는 대로 최대한 많이 적어보세요.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="예: 핵심 사용자 니즈를 잘못 파악했다"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          추가
        </button>
      </div>

      <ul className="space-y-2">
        {items.length === 0 && (
          <li className="rounded-md border border-dashed border-slate-300 p-4 text-center text-sm text-slate-400">
            아직 실패 원인이 없습니다. 위에서 하나씩 추가해보세요.
          </li>
        )}
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start gap-2 rounded-md border border-slate-200 bg-white p-3"
          >
            <textarea
              value={item.text}
              onChange={(e) => updateItem(item.id, e.target.value)}
              rows={1}
              className="flex-1 resize-none border-none text-sm text-slate-800 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              aria-label="삭제"
              className="shrink-0 rounded px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-red-600"
            >
              삭제
            </button>
          </li>
        ))}
      </ul>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep('setup')}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          &larr; 이전
        </button>
        <button
          type="button"
          disabled={items.length === 0}
          onClick={() => setStep('mapping')}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          가정 매핑으로 이동 &rarr;
        </button>
      </div>
    </div>
  )
}
