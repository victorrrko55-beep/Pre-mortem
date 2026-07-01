export type Step = 'setup' | 'premortem' | 'mapping' | 'results'

export interface PremortemItem {
  id: string
  text: string
  createdAt: number
}

export interface Assumption {
  id: string
  text: string
  sourceItemId: string | null
  /** 0 (low) – 100 (high): how much this matters to the project's success */
  importance: number
  /** 0 (low) – 100 (high): how much evidence/certainty we already have */
  evidence: number
  createdAt: number
}

export interface ProjectData {
  projectName: string
  projectGoal: string
  step: Step
  premortemItems: PremortemItem[]
  assumptions: Assumption[]
}
