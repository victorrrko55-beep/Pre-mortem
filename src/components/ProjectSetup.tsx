import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'

export function ProjectSetup() {
  const projectName = useProjectStore((s) => s.projectName)
  const projectGoal = useProjectStore((s) => s.projectGoal)
  const setProjectInfo = useProjectStore((s) => s.setProjectInfo)
  const setStep = useProjectStore((s) => s.setStep)

  const [name, setName] = useState(projectName)
  const [goal, setGoal] = useState(projectGoal)

  const canContinue = name.trim().length > 0

  const handleContinue = () => {
    setProjectInfo(name.trim(), goal.trim())
    setStep('premortem')
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">프로젝트 정보</h2>
        <p className="mt-1 text-sm text-slate-500">
          어떤 프로젝트/아이디어를 점검할지 적어주세요.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          프로젝트 이름
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 신규 구독 결제 시스템 출시"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-slate-700">
          목표 / 성공 기준 (선택)
          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="예: 3개월 안에 유료 전환율 5% 달성"
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </label>

        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Pre-mortem 시작하기 &rarr;
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-800">진행 순서</h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            <strong>Pre-mortem</strong>: 프로젝트가 미래에 실패했다고 상상하고, 그 원인이 될 만한
            것들을 최대한 많이 적습니다.
          </li>
          <li>
            <strong>Assumption Mapping</strong>: 각 실패 원인 뒤에 숨은 &quot;가정&quot;을 뽑아내고,
            중요도와 확신도(근거) 기준으로 배치합니다.
          </li>
          <li>
            <strong>검증 우선순위</strong>: 중요하지만 근거가 부족한 가정부터 먼저 검증하도록
            우선순위 목록을 확인합니다.
          </li>
        </ol>
      </div>
    </div>
  )
}
