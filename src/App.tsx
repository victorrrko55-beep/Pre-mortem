import { useProjectStore } from './store/useProjectStore'
import { StepNav } from './components/StepNav'
import { ProjectSetup } from './components/ProjectSetup'
import { PremortemBoard } from './components/PremortemBoard'
import { AssumptionMapper } from './components/AssumptionMapper'
import { ResultsView } from './components/ResultsView'

function App() {
  const step = useProjectStore((s) => s.step)

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">
          Pre-mortem &rarr; Assumption Mapping
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          프로젝트가 실패했다고 상상하며 원인을 찾고, 그 뒤에 숨은 가정을 검증 우선순위로 정리합니다.
        </p>
      </header>

      <StepNav />

      <main className="mt-6">
        {step === 'setup' && <ProjectSetup />}
        {step === 'premortem' && <PremortemBoard />}
        {step === 'mapping' && <AssumptionMapper />}
        {step === 'results' && <ResultsView />}
      </main>
    </div>
  )
}

export default App
