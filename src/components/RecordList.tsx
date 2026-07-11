import { useAppStore } from '../store/useAppStore'
import { fmt, fmt1, fuelEconomy, monthLabel } from '../lib/stats'
import type { FuelRecord } from '../types'
import { FUEL_GRADE_LABELS } from '../types'

interface Props {
  onEdit: (record: FuelRecord) => void
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}

export function RecordList({ onEdit }: Props) {
  const records = useAppStore((s) => s.records)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const removeRecord = useAppStore((s) => s.removeRecord)

  const vehicleRecords = records
    .filter((r) => r.vehicleId === selectedVehicleId)
    .sort((a, b) => (a.date === b.date ? b.createdAt - a.createdAt : a.date < b.date ? 1 : -1))

  if (vehicleRecords.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        아직 주유 기록이 없습니다.
        <br />
        아래 <span className="font-semibold">주유 입력</span> 탭에서 영수증을 찍어 첫 기록을
        추가해 보세요.
      </div>
    )
  }

  // 요약 통계
  const thisMonth = new Date().toISOString().slice(0, 7)
  const monthRecords = vehicleRecords.filter((r) => r.date.startsWith(thisMonth))
  const monthAmount = monthRecords.reduce((sum, r) => sum + r.amount, 0)
  const monthLiters = monthRecords.reduce((sum, r) => sum + r.liters, 0)
  const withDistance = vehicleRecords.filter((r) => r.distanceKm != null && r.distanceKm > 0)
  const totalDistance = withDistance.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0)
  const totalLitersWithDistance = withDistance.reduce((sum, r) => sum + r.liters, 0)
  const avgEconomy =
    totalLitersWithDistance > 0 ? totalDistance / totalLitersWithDistance : null
  const latestOdometer = vehicleRecords.find((r) => r.odometer != null)?.odometer ?? null

  // 월별 그룹
  const groups: { month: string; items: FuelRecord[] }[] = []
  for (const r of vehicleRecords) {
    const month = r.date.slice(0, 7)
    const group = groups.at(-1)
    if (group && group.month === month) group.items.push(r)
    else groups.push({ month, items: [r] })
  }

  const handleRemove = (r: FuelRecord) => {
    if (window.confirm(`${r.date} ${r.stationName || '주유'} 기록을 삭제할까요?`)) {
      removeRecord(r.id)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="이번 달 주유금액" value={`${fmt(monthAmount)}원`} />
        <StatTile label="이번 달 주유량" value={`${fmt1(monthLiters)}L`} />
        <StatTile
          label="평균 연비"
          value={avgEconomy != null ? `${fmt1(avgEconomy)} km/L` : '—'}
        />
        <StatTile
          label="총 주행거리"
          value={latestOdometer != null ? `${fmt(latestOdometer)} km` : '—'}
        />
      </div>

      {groups.map(({ month, items }) => (
        <section key={month}>
          <h3 className="mb-2 flex items-baseline justify-between px-1 text-xs font-medium text-slate-500">
            <span>{monthLabel(month)}</span>
            <span>
              {items.length}회 · {fmt(items.reduce((sum, r) => sum + r.amount, 0))}원
            </span>
          </h3>
          <div className="space-y-2">
            {items.map((r) => {
              const economy = fuelEconomy(r)
              return (
                <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {r.stationName || '주유소 미입력'}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {r.date} · {FUEL_GRADE_LABELS[r.fuelGrade]}
                        {r.paymentCard && ` · ${r.paymentCard}`}
                      </p>
                    </div>
                    {economy != null && (
                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {fmt1(economy)} km/L
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                    <span>
                      <b>{fmt1(r.liters)}</b> L
                    </span>
                    <span>
                      <b>{fmt(r.amount)}</b> 원
                    </span>
                    {r.unitPrice != null && (
                      <span className="text-slate-500">{fmt(r.unitPrice)}원/L</span>
                    )}
                    {r.distanceKm != null && (
                      <span className="text-slate-500">{fmt(r.distanceKm)}km 주행</span>
                    )}
                  </div>
                  {r.stationAddress && (
                    <p className="mt-1 truncate text-xs text-slate-400">{r.stationAddress}</p>
                  )}
                  {r.memo && <p className="mt-1 text-xs text-slate-500">{r.memo}</p>}
                  <div className="mt-2 flex gap-3 border-t border-slate-100 pt-2">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="text-xs font-medium text-blue-600"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(r)}
                      className="text-xs font-medium text-red-500"
                    >
                      삭제
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
