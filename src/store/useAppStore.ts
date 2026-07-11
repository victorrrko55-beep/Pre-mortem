import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FuelRecord, Vehicle } from '../types'

interface AppState {
  vehicles: Vehicle[]
  records: FuelRecord[]
  selectedVehicleId: string | null
}

interface AppActions {
  addVehicle: (data: Omit<Vehicle, 'id' | 'createdAt'>) => void
  updateVehicle: (id: string, patch: Partial<Omit<Vehicle, 'id' | 'createdAt'>>) => void
  removeVehicle: (id: string) => void
  selectVehicle: (id: string) => void
  addRecord: (data: Omit<FuelRecord, 'id' | 'createdAt'>) => void
  updateRecord: (id: string, patch: Partial<Omit<FuelRecord, 'id' | 'createdAt'>>) => void
  removeRecord: (id: string) => void
}

const makeId = () => crypto.randomUUID()

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      vehicles: [],
      records: [],
      selectedVehicleId: null,

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
    }),
    { name: 'fuel-log-app' },
  ),
)
