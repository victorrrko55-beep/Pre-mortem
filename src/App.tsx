import { useState } from 'react'
import { useAppStore } from './store/useAppStore'
import { TabBar, type Tab } from './components/TabBar'
import { VehicleForm } from './components/VehicleForm'
import { VehicleManager } from './components/VehicleManager'
import { RecordForm } from './components/RecordForm'
import { RecordList } from './components/RecordList'
import { TrendsView } from './components/TrendsView'
import type { FuelRecord } from './types'

const TAB_TITLES: Record<Tab, string> = {
  home: '주유 기록',
  add: '주유 입력',
  trends: '월별 트렌드',
  vehicles: '내 차량',
}

function App() {
  const vehicles = useAppStore((s) => s.vehicles)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const addVehicle = useAppStore((s) => s.addVehicle)
  const [tab, setTab] = useState<Tab>('home')
  const [editingRecord, setEditingRecord] = useState<FuelRecord | null>(null)

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId)

  // 온보딩: 차량이 없으면 먼저 차량을 등록한다
  if (vehicles.length === 0) {
    return (
      <div className="mx-auto min-h-screen max-w-md px-4 py-10">
        <header className="mb-8 text-center">
          <p className="text-4xl" aria-hidden>
            ⛽
          </p>
          <h1 className="mt-3 text-xl font-bold text-slate-900">주유수첩</h1>
          <p className="mt-2 text-sm text-slate-500">
            영수증 한 장으로 주유 기록과 연비를 관리하세요.
            <br />
            먼저 차량을 등록해 주세요.
          </p>
        </header>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <VehicleForm submitLabel="차량 등록하고 시작하기" onSubmit={addVehicle} />
        </div>
      </div>
    )
  }

  const startEdit = (record: FuelRecord) => {
    setEditingRecord(record)
    setTab('add')
  }

  const changeTab = (next: Tab) => {
    if (next !== 'add') setEditingRecord(null)
    setTab(next)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-5">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-900">{TAB_TITLES[tab]}</h1>
        {selectedVehicle && (
          <button
            type="button"
            onClick={() => changeTab('vehicles')}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 active:bg-slate-200"
          >
            🚗 {selectedVehicle.name}
          </button>
        )}
      </header>

      <main>
        {tab === 'home' && <RecordList onEdit={startEdit} />}
        {tab === 'add' && (
          <RecordForm
            key={editingRecord?.id ?? 'new'}
            editingRecord={editingRecord}
            onDone={() => {
              setEditingRecord(null)
              setTab('home')
            }}
          />
        )}
        {tab === 'trends' && <TrendsView />}
        {tab === 'vehicles' && <VehicleManager />}
      </main>

      <TabBar tab={tab} onChange={changeTab} />
    </div>
  )
}

export default App
