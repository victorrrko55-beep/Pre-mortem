import type { Assumption } from '../types'

export type Quadrant = 'leap-of-faith' | 'keep-monitoring' | 'low-priority' | 'nice-to-know'

export const MID = 50

export function quadrantOf(a: Pick<Assumption, 'importance' | 'evidence'>): Quadrant {
  const important = a.importance >= MID
  const proven = a.evidence >= MID
  if (important && !proven) return 'leap-of-faith'
  if (important && proven) return 'keep-monitoring'
  if (!important && !proven) return 'low-priority'
  return 'nice-to-know'
}

export const QUADRANT_INFO: Record<
  Quadrant,
  { title: string; description: string; color: string; rank: number }
> = {
  'leap-of-faith': {
    title: '가장 먼저 검증하세요',
    description: '중요한데 근거가 부족한 가정 — 틀리면 프로젝트가 무너집니다.',
    color: 'bg-red-100 border-red-400 text-red-900',
    rank: 0,
  },
  'keep-monitoring': {
    title: '계속 지켜보세요',
    description: '중요하고 근거도 있는 가정 — 상황이 바뀌지 않는지 주기적으로 확인하세요.',
    color: 'bg-amber-100 border-amber-400 text-amber-900',
    rank: 1,
  },
  'nice-to-know': {
    title: '여유가 있을 때',
    description: '근거는 있지만 덜 중요한 가정 — 우선순위가 낮습니다.',
    color: 'bg-blue-100 border-blue-400 text-blue-900',
    rank: 2,
  },
  'low-priority': {
    title: '지금은 무시해도 좋습니다',
    description: '중요하지도 않고 근거도 부족한 가정.',
    color: 'bg-slate-100 border-slate-300 text-slate-700',
    rank: 3,
  },
}
