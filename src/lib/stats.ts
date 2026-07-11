import type { FuelRecord } from '../types'

/** 연비 (km/L) — 이동 거리와 주유량이 모두 있어야 계산 */
export function fuelEconomy(record: FuelRecord): number | null {
  if (record.distanceKm == null || record.distanceKm <= 0 || record.liters <= 0) return null
  return record.distanceKm / record.liters
}

export interface MonthlyStat {
  /** YYYY-MM */
  month: string
  liters: number
  amount: number
  distanceKm: number
  count: number
  /** 월 평균 연비 (총 이동거리 / 해당 거리의 주유량) */
  economy: number | null
}

/** 최근 monthsBack개월(기록이 있는 첫 달부터, 빈 달 포함)의 월별 합계 */
export function monthlyStats(records: FuelRecord[], monthsBack = 12): MonthlyStat[] {
  if (records.length === 0) return []

  const byMonth = new Map<string, FuelRecord[]>()
  for (const r of records) {
    const key = r.date.slice(0, 7)
    const list = byMonth.get(key)
    if (list) list.push(r)
    else byMonth.set(key, [r])
  }

  const now = new Date()
  const months: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const firstRecorded = [...byMonth.keys()].sort()[0]
  const visible = months.filter((m) => m >= firstRecorded)

  return visible.map((month) => {
    const list = byMonth.get(month) ?? []
    const liters = list.reduce((sum, r) => sum + r.liters, 0)
    const amount = list.reduce((sum, r) => sum + r.amount, 0)
    const distanceKm = list.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0)
    // 연비는 거리 입력이 있는 기록만으로 계산해야 왜곡되지 않는다
    const litersWithDistance = list
      .filter((r) => r.distanceKm != null && r.distanceKm > 0)
      .reduce((sum, r) => sum + r.liters, 0)
    return {
      month,
      liters,
      amount,
      distanceKm,
      count: list.length,
      economy: litersWithDistance > 0 ? distanceKm / litersWithDistance : null,
    }
  })
}

export const fmt = (n: number): string => Math.round(n).toLocaleString('ko-KR')

export const fmt1 = (n: number): string =>
  n.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 'YYYY-MM' → 'YYYY년 M월' */
export const monthLabel = (month: string): string => {
  const [y, m] = month.split('-')
  return `${y}년 ${Number(m)}월`
}
