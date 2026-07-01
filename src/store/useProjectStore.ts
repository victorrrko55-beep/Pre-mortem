import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assumption, PremortemItem, ProjectData, Step } from '../types'

interface ProjectActions {
  setProjectInfo: (name: string, goal: string) => void
  setStep: (step: Step) => void
  addPremortemItem: (text: string) => void
  updatePremortemItem: (id: string, text: string) => void
  removePremortemItem: (id: string) => void
  convertToAssumption: (sourceItemId: string, text: string) => void
  addAssumption: (text: string) => void
  updateAssumption: (id: string, patch: Partial<Omit<Assumption, 'id' | 'createdAt'>>) => void
  removeAssumption: (id: string) => void
  resetProject: () => void
}

const initialData: ProjectData = {
  projectName: '',
  projectGoal: '',
  step: 'setup',
  premortemItems: [],
  assumptions: [],
}

const makeId = () => crypto.randomUUID()

export const useProjectStore = create<ProjectData & ProjectActions>()(
  persist(
    (set) => ({
      ...initialData,

      setProjectInfo: (name, goal) =>
        set({ projectName: name, projectGoal: goal }),

      setStep: (step) => set({ step }),

      addPremortemItem: (text) =>
        set((s) => ({
          premortemItems: [
            ...s.premortemItems,
            { id: makeId(), text, createdAt: Date.now() } satisfies PremortemItem,
          ],
        })),

      updatePremortemItem: (id, text) =>
        set((s) => ({
          premortemItems: s.premortemItems.map((item) =>
            item.id === id ? { ...item, text } : item,
          ),
        })),

      removePremortemItem: (id) =>
        set((s) => ({
          premortemItems: s.premortemItems.filter((item) => item.id !== id),
        })),

      convertToAssumption: (sourceItemId, text) =>
        set((s) => ({
          assumptions: [
            ...s.assumptions,
            {
              id: makeId(),
              text,
              sourceItemId,
              importance: 50,
              evidence: 50,
              createdAt: Date.now(),
            } satisfies Assumption,
          ],
        })),

      addAssumption: (text) =>
        set((s) => ({
          assumptions: [
            ...s.assumptions,
            {
              id: makeId(),
              text,
              sourceItemId: null,
              importance: 50,
              evidence: 50,
              createdAt: Date.now(),
            } satisfies Assumption,
          ],
        })),

      updateAssumption: (id, patch) =>
        set((s) => ({
          assumptions: s.assumptions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),

      removeAssumption: (id) =>
        set((s) => ({
          assumptions: s.assumptions.filter((a) => a.id !== id),
        })),

      resetProject: () => set(initialData),
    }),
    { name: 'premortem-assumption-mapping' },
  ),
)
