import type { FuelGrade, FuelRecord, Vehicle } from '../types'
import { FUEL_GRADE_LABELS } from '../types'
import { computeEconomies, fmt1 } from './stats'

export interface BackupData {
  app: 'fuel-log'
  version: 1
  exportedAt: string
  vehicles: Vehicle[]
  records: FuelRecord[]
  selectedVehicleId: string | null
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const dateStamp = () => new Date().toISOString().slice(0, 10).replaceAll('-', '')

export function downloadJsonBackup(
  vehicles: Vehicle[],
  records: FuelRecord[],
  selectedVehicleId: string | null,
) {
  const backup: BackupData = {
    app: 'fuel-log',
    version: 1,
    exportedAt: new Date().toISOString(),
    vehicles,
    records,
    selectedVehicleId,
  }
  download(`주유수첩-백업-${dateStamp()}.json`, JSON.stringify(backup, null, 2), 'application/json')
}

const csvEscape = (v: string) => (/[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v)

export function downloadCsv(vehicles: Vehicle[], records: FuelRecord[]) {
  const vehicleName = new Map(vehicles.map((v) => [v.id, v.name]))
  const economies = new Map<string, number>()
  for (const v of vehicles) {
    for (const [id, e] of computeEconomies(records.filter((r) => r.vehicleId === v.id))) {
      economies.set(id, e)
    }
  }
  const header = [
    '차량',
    '날짜',
    '주유소명',
    '주소',
    '유종',
    '주유량(L)',
    '주유금액(원)',
    '단가(원/L)',
    '결제카드',
    '이동거리(km)',
    '총주행거리(km)',
    '가득주유',
    '연비(km/L)',
    '메모',
  ]
  const rows = [...records]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.createdAt - b.createdAt))
    .map((r) => {
      const economy = economies.get(r.id)
      return [
        vehicleName.get(r.vehicleId) ?? '',
        r.date,
        r.stationName,
        r.stationAddress,
        FUEL_GRADE_LABELS[r.fuelGrade],
        String(r.liters),
        String(r.amount),
        r.unitPrice != null ? String(r.unitPrice) : '',
        r.paymentCard,
        r.distanceKm != null ? String(r.distanceKm) : '',
        r.odometer != null ? String(r.odometer) : '',
        r.fullTank ? 'Y' : 'N',
        economy != null ? fmt1(economy) : '',
        r.memo,
      ]
        .map(csvEscape)
        .join(',')
    })
  // BOM을 붙여야 Excel에서 한글이 깨지지 않는다
  download(
    `주유수첩-기록-${dateStamp()}.csv`,
    '\uFEFF' + [header.join(','), ...rows].join('\n'),
    'text/csv',
  )
}

const GRADES: FuelGrade[] = ['regular', 'premium', 'diesel', 'lpg']

export async function parseJsonBackup(file: File): Promise<{
  vehicles: Vehicle[]
  records: FuelRecord[]
  selectedVehicleId: string | null
}> {
  const parsed = JSON.parse(await file.text()) as Partial<BackupData>
  if (parsed.app !== 'fuel-log' || !Array.isArray(parsed.vehicles) || !Array.isArray(parsed.records)) {
    throw new Error('주유수첩 백업 파일이 아닙니다.')
  }
  const vehicles: Vehicle[] = parsed.vehicles.map((v) => {
    if (typeof v?.id !== 'string' || typeof v?.name !== 'string') {
      throw new Error('백업 파일의 차량 데이터가 올바르지 않습니다.')
    }
    return {
      id: v.id,
      name: v.name,
      plateNumber: typeof v.plateNumber === 'string' ? v.plateNumber : '',
      fuelGrade: GRADES.includes(v.fuelGrade) ? v.fuelGrade : 'regular',
      createdAt: typeof v.createdAt === 'number' ? v.createdAt : Date.now(),
    }
  })
  const vehicleIds = new Set(vehicles.map((v) => v.id))
  const records: FuelRecord[] = parsed.records.map((r) => {
    if (
      typeof r?.id !== 'string' ||
      !vehicleIds.has(r?.vehicleId) ||
      typeof r?.date !== 'string' ||
      typeof r?.liters !== 'number' ||
      typeof r?.amount !== 'number'
    ) {
      throw new Error('백업 파일의 주유 기록 데이터가 올바르지 않습니다.')
    }
    return {
      id: r.id,
      vehicleId: r.vehicleId,
      date: r.date,
      stationName: typeof r.stationName === 'string' ? r.stationName : '',
      stationAddress: typeof r.stationAddress === 'string' ? r.stationAddress : '',
      fuelGrade: GRADES.includes(r.fuelGrade) ? r.fuelGrade : 'regular',
      liters: r.liters,
      amount: r.amount,
      unitPrice: typeof r.unitPrice === 'number' ? r.unitPrice : null,
      paymentCard: typeof r.paymentCard === 'string' ? r.paymentCard : '',
      distanceKm: typeof r.distanceKm === 'number' ? r.distanceKm : null,
      odometer: typeof r.odometer === 'number' ? r.odometer : null,
      fullTank: typeof r.fullTank === 'boolean' ? r.fullTank : true,
      memo: typeof r.memo === 'string' ? r.memo : '',
      createdAt: typeof r.createdAt === 'number' ? r.createdAt : Date.now(),
    }
  })
  return {
    vehicles,
    records,
    selectedVehicleId:
      typeof parsed.selectedVehicleId === 'string' && vehicleIds.has(parsed.selectedVehicleId)
        ? parsed.selectedVehicleId
        : null,
  }
}
