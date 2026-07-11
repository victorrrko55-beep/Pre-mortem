import { useAppStore } from '../store/useAppStore'
import { fmt, fmt1, monthlyStats } from '../lib/stats'
import { MonthlyBarChart } from './MonthlyBarChart'

export function TrendsView() {
  const records = useAppStore((s) => s.records)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)

  const vehicleRecords = records.filter((r) => r.vehicleId === selectedVehicleId)
  const stats = monthlyStats(vehicleRecords)

  if (stats.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        아직 주유 기록이 없습니다.
        <br />
        주유 기록을 추가하면 월별 트렌드가 표시됩니다.
      </div>
    )
  }

  const economyPoints = stats.map((s) => ({ month: s.month, value: s.economy ?? 0 }))
  const hasEconomy = economyPoints.some((p) => p.value > 0)

  return (
    <div className="space-y-4">
      <MonthlyBarChart
        title="월별 주유금액"
        unit="원"
        color="#2a78d6"
        points={stats.map((s) => ({ month: s.month, value: s.amount }))}
        format={fmt}
      />
      <MonthlyBarChart
        title="월별 주유량"
        unit="L"
        color="#1baf7a"
        points={stats.map((s) => ({ month: s.month, value: s.liters }))}
        format={fmt1}
      />
      <MonthlyBarChart
        title="월별 이동거리"
        unit="km"
        color="#4a3aa7"
        points={stats.map((s) => ({ month: s.month, value: s.distanceKm }))}
        format={fmt}
      />
      {hasEconomy && (
        <MonthlyBarChart
          title="월 평균 연비"
          unit="km/L"
          color="#008300"
          points={economyPoints}
          format={fmt1}
        />
      )}
      <p className="px-1 text-xs text-slate-400">
        막대를 누르면 해당 월의 값이 표시됩니다. 연비는 이동 거리가 입력된 기록으로만 계산됩니다.
      </p>
    </div>
  )
}
