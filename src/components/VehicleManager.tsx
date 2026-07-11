import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { FUEL_GRADE_LABELS } from '../types'
import { VehicleForm } from './VehicleForm'

export function VehicleManager() {
  const vehicles = useAppStore((s) => s.vehicles)
  const records = useAppStore((s) => s.records)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const selectVehicle = useAppStore((s) => s.selectVehicle)
  const addVehicle = useAppStore((s) => s.addVehicle)
  const removeVehicle = useAppStore((s) => s.removeVehicle)
  const [showForm, setShowForm] = useState(false)

  const recordCount = (vehicleId: string) =>
    records.filter((r) => r.vehicleId === vehicleId).length

  const handleRemove = (id: string, name: string) => {
    const count = recordCount(id)
    const message =
      count > 0
        ? `'${name}' 차량과 주유 기록 ${count}건이 모두 삭제됩니다. 계속할까요?`
        : `'${name}' 차량을 삭제할까요?`
    if (window.confirm(message)) removeVehicle(id)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {vehicles.map((v) => {
          const selected = v.id === selectedVehicleId
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => selectVehicle(v.id)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left ${
                selected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
              }`}
            >
              <span
                aria-hidden
                className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                  selected ? 'border-blue-600' : 'border-slate-300'
                }`}
              >
                {selected && <span className="size-2.5 rounded-full bg-blue-600" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-slate-900">
                  {v.name}
                  {v.plateNumber && (
                    <span className="ml-2 font-normal text-slate-500">{v.plateNumber}</span>
                  )}
                </span>
                <span className="block text-xs text-slate-500">
                  {FUEL_GRADE_LABELS[v.fuelGrade]} · 기록 {recordCount(v.id)}건
                </span>
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(v.id, v.name)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    handleRemove(v.id, v.name)
                  }
                }}
                className="shrink-0 rounded-lg px-2 py-1 text-xs text-red-500 active:bg-red-50"
              >
                삭제
              </span>
            </button>
          )
        })}
      </div>

      {showForm ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">새 차량 추가</h3>
          <VehicleForm
            submitLabel="차량 추가"
            onSubmit={(data) => {
              addVehicle(data)
              setShowForm(false)
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
        >
          + 차량 추가
        </button>
      )}
    </div>
  )
}
