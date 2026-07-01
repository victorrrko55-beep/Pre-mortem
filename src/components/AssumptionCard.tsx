import { useRef } from 'react'
import type { Assumption } from '../types'

interface Props {
  assumption: Assumption
  selected: boolean
  onSelect: (id: string) => void
  onMove: (id: string, importance: number, evidence: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function AssumptionCard({ assumption, selected, onSelect, onMove, containerRef }: Props) {
  const dragging = useRef(false)

  const updateFromPointer = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const xPct = clamp(((clientX - rect.left) / rect.width) * 100)
    const yPct = clamp(((clientY - rect.top) / rect.height) * 100)
    onMove(assumption.id, 100 - yPct, xPct)
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    onSelect(assumption.id)
    updateFromPointer(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return
    updateFromPointer(e.clientX, e.clientY)
  }

  const handlePointerUp = () => {
    dragging.current = false
  }

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        left: `${assumption.evidence}%`,
        top: `${100 - assumption.importance}%`,
      }}
      className={[
        'absolute z-10 w-32 -translate-x-1/2 -translate-y-1/2 touch-none rounded-md border px-2 py-1.5 text-left text-xs shadow-sm transition-shadow',
        selected
          ? 'border-slate-900 bg-white ring-2 ring-slate-900'
          : 'border-slate-300 bg-white hover:shadow-md',
      ].join(' ')}
    >
      <span className="line-clamp-3">{assumption.text}</span>
    </button>
  )
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, n))
}
