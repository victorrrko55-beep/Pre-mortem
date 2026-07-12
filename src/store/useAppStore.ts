import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FuelRecord, Vehicle } from '../types'

/** CLOVA OCR 연동 설정 (선택) — 비어 있으면 브라우저 내 Tesseract OCR 사용 */
export interface OcrSettings {
  clovaInvokeUrl: string
  clovaSecretKey: string
}

interface AppState {
  vehicles: Vehicle[]
  records: FuelRecord[]
  selectedVehicleId: string | null
  ocrSettings: OcrSettings
}

interface AppActions {
  addVehicle: (data: Omit<Vehicle, 'id' | 'createdAt'>) => void
  updateVehicle: (id: string, patch: Partial<Omit<Vehicle, 'id' | 'createdAt'>>) => void
  removeVehicle: (id: string) => void
  selectVehicle: (id: string) => void
  addRecord: (data: Omit<FuelRecord, 'id' | 'createdAt'>) => void
  updateRecord: (id: string, patch: Partial<Omit<FuelRecord, 'id' | 'createdAt'>>) => void
  removeRecord: (id: string) => void
  setOcrSettings: (settings: OcrSettings) => void
  /** 백업(JSON) 가져오기 — 전체 데이터를 교체한다 */
  restoreBackup: (data: {
    vehicles: Vehicle[]
    records: FuelRecord[]
    selectedVehicleId: string | null
  }) => void
}

const makeId = () => crypto.randomUUID()

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      vehicles: [],
      records: [],
      selectedVehicleId: null,
      ocrSettings: { clovaInvokeUrl: '', clovaSecretKey: '' },

      addVehicle: (data) =>
        set((s) => {
          const vehicle: Vehicle = { ...data, id: makeId(), createdAt: Date.now() }
          return {
            vehicles: [...s.vehicles, vehicle],
            selectedVehicleId: s.selectedVehicleId ?? vehicle.id,
          }
        }),

      updateVehicle: (id, patch) =>
        set((s) => ({
          vehicles: s.vehicles.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      removeVehicle: (id) =>
        set((s) => {
          const vehicles = s.vehicles.filter((v) => v.id !== id)
          return {
            vehicles,
            records: s.records.filter((r) => r.vehicleId !== id),
            selectedVehicleId:
              s.selectedVehicleId === id ? (vehicles[0]?.id ?? null) : s.selectedVehicleId,
          }
        }),

      selectVehicle: (id) => set({ selectedVehicleId: id }),

      addRecord: (data) =>
        set((s) => ({
          records: [...s.records, { ...data, id: makeId(), createdAt: Date.now() }],
        })),

      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      removeRecord: (id) =>
        set((s) => ({
          records: s.records.filter((r) => r.id !== id),
        })),

      setOcrSettings: (ocrSettings) => set({ ocrSettings }),

      restoreBackup: (data) =>
        set({
          vehicles: data.vehicles,
          records: data.records,
          selectedVehicleId: data.selectedVehicleId ?? data.vehicles[0]?.id ?? null,
        }),
    }),
    {
      name: 'fuel-log-app',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as AppState
        if (version === 0) {
          // v0에는 fullTank/ocrSettings가 없었다 — 기존 기록은 가득 주유로 간주
          state.records = (state.records ?? []).map((r) => ({ ...r, fullTank: r.fullTank ?? true }))
          state.ocrSettings = { clovaInvokeUrl: '', clovaSecretKey: '' }
        }
        return state
      },
    },
  ),
)
