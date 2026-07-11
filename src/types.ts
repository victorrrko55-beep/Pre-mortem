export type FuelGrade = 'regular' | 'premium' | 'diesel' | 'lpg'

export const FUEL_GRADE_LABELS: Record<FuelGrade, string> = {
  regular: '일반 휘발유',
  premium: '고급 휘발유',
  diesel: '경유',
  lpg: 'LPG',
}

export interface Vehicle {
  id: string
  name: string
  plateNumber: string
  fuelGrade: FuelGrade
  createdAt: number
}

export interface FuelRecord {
  id: string
  vehicleId: string
  /** YYYY-MM-DD */
  date: string
  stationName: string
  stationAddress: string
  fuelGrade: FuelGrade
  /** 주유량 (L) */
  liters: number
  /** 주유금액 (원) */
  amount: number
  /** 단가 (원/L) */
  unitPrice: number | null
  /** 결제 카드 */
  paymentCard: string
  /** 직전 주유 이후 이동 거리 (km) — 사용자 입력 */
  distanceKm: number | null
  /** 총 누적 주행거리 (km) — 사용자 입력 */
  odometer: number | null
  memo: string
  createdAt: number
}

/** 영수증 OCR로 추출 가능한 필드 */
export interface ParsedReceipt {
  date?: string
  stationName?: string
  stationAddress?: string
  fuelGrade?: FuelGrade
  liters?: number
  amount?: number
  unitPrice?: number
  paymentCard?: string
}
