import type { FuelRecord } from '../types'

const byDateAsc = (a: FuelRecord, b: FuelRecord) =>
  a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1

/**
 * 가득~가득(full-to-full) 방식 연비 계산.
 *
 * 가득 주유 기록마다, 직전 가득 주유 이후의 모든 기록(부분 주유 포함)의
 * 주유량 합과 이동 거리 합으로 구간 연비를 구한다. 구간 내에 이동 거리가
 * 빠진 기록이 있으면 그 구간은 계산하지 않는다. 부분 주유 기록 자체에는
 * 연비가 붙지 않는다. 기준이 될 직전 가득 주유가 없는 첫 가득 주유는
 * 해당 기록의 거리/주유량 단순 비율로 계산한다.
 *
 * @returns 기록 id → 연비(km/L)
 */
export function computeEconomies(records: FuelRecord[]): Map<string, number> {
  const sorted = [...records].sort(byDateAsc)
  const result = new Map<string, number>()

  let hasBaseline = false
  let spanLiters = 0
  let spanDistance = 0
  let spanComplete = true

  for (const r of sorted) {
    if (!hasBaseline) {
      if (r.fullTank) {
        if (r.distanceKm != null && r.distanceKm > 0 && r.liters > 0) {
          result.set(r.id, r.distanceKm / r.liters)
        }
        hasBaseline = true
      }
      continue
    }
    spanLiters += r.liters
    if (r.distanceKm != null && r.distanceKm > 0) spanDistance += r.distanceKm
    else spanComplete = false
    if (r.fullTank) {
      if (spanComplete && spanLiters > 0 && spanDistance > 0) {
        result.set(r.id, spanDistance / spanLiters)
      }
      spanLiters = 0
      spanDistance = 0
      spanComplete = true
    }
  }
  return result
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
