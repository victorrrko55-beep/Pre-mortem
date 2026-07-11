import { useState } from 'react'
import { monthLabel } from '../lib/stats'

interface ChartPoint {
  month: string
  value: number
}

interface Props {
  title: string
  unit: string
  color: string
  points: ChartPoint[]
  format: (n: number) => string
}

const INK = '#0b0b0b'
const MUTED = '#898781'
const GRID = '#e1e0d9'
const AXIS = '#c3c2b7'

const W = 340
const H = 180
const PAD = { top: 8, right: 8, bottom: 24, left: 44 }

/** 최댓값을 1/2/2.5/5×10^n 단위의 깔끔한 눈금 상한으로 올림 */
function niceMax(max: number): number {
  if (max <= 0) return 1
  const exp = Math.floor(Math.log10(max))
  const base = Math.pow(10, exp)
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (max <= m * base) return m * base
  }
  return 10 * base
}

/** 위쪽 모서리만 둥근 막대 path (baseline은 각지게) */
function roundedTopBar(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h)
  const bottom = y + h
  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `L ${x + w - r} ${y}`,
    `Q ${x + w} ${y} ${x + w} ${y + r}`,
    `L ${x + w} ${bottom}`,
    'Z',
  ].join(' ')
}

export function MonthlyBarChart({ title, unit, color, points, format }: Props) {
  const [active, setActive] = useState(points.length - 1)

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const yMax = niceMax(Math.max(...points.map((p) => p.value)))
  const slot = plotW / Math.max(points.length, 1)
  const barW = Math.min(24, slot * 0.6)

  const yOf = (v: number) => PAD.top + plotH * (1 - v / yMax)
  const ticks = [0, yMax / 2, yMax]

  const activePoint = points[active]

  return (
    <section className="rounded-2xl border border-black/10 bg-[#fcfcfb] p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {activePoint && (
          <p className="text-xs text-slate-500">
            {monthLabel(activePoint.month)} ·{' '}
            <span className="font-semibold text-slate-900">
              {format(activePoint.value)}
              {unit}
            </span>
          </p>
        )}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label={title}>
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(t)}
              y2={yOf(t)}
              stroke={t === 0 ? AXIS : GRID}
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={yOf(t) + 3}
              textAnchor="end"
              fontSize={9}
              fill={MUTED}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {format(t)}
            </text>
          </g>
        ))}

        {points.map((p, i) => {
          const cx = PAD.left + slot * i + slot / 2
          const barH = (p.value / yMax) * plotH
          const isActive = i === active
          return (
            <g key={p.month} onPointerDown={() => setActive(i)} onPointerEnter={() => setActive(i)}>
              {/* 막대보다 넓은 히트 영역 */}
              <rect
                x={PAD.left + slot * i}
                y={PAD.top}
                width={slot}
                height={plotH}
                fill="transparent"
              />
              {p.value > 0 && (
                <path
                  d={roundedTopBar(cx - barW / 2, yOf(p.value), barW, barH)}
                  fill={color}
                  opacity={isActive ? 1 : 0.55}
                />
              )}
              <text
                x={cx}
                y={H - 8}
                textAnchor="middle"
                fontSize={9}
                fill={isActive ? INK : MUTED}
                fontWeight={isActive ? 600 : 400}
              >
                {Number(p.month.slice(5))}월
              </text>
            </g>
          )
        })}
      </svg>
    </section>
  )
}
