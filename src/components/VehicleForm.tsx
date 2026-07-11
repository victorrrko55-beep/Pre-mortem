import { useState } from 'react'
import type { FuelGrade } from '../types'
import { FUEL_GRADE_LABELS } from '../types'

interface Props {
  submitLabel: string
  onSubmit: (data: { name: string; plateNumber: string; fuelGrade: FuelGrade }) => void
}

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none'

export function VehicleForm({ submitLabel, onSubmit }: Props) {
  const [name, setName] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [fuelGrade, setFuelGrade] = useState<FuelGrade>('regular')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), plateNumber: plateNumber.trim(), fuelGrade })
    setName('')
    setPlateNumber('')
    setFuelGrade('regular')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">차량 이름 *</span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 쏘렌토, 아빠차"
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">차량 번호</span>
        <input
          className={inputClass}
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          placeholder="예: 12가 3456"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">기본 유종</span>
        <select
          className={inputClass}
          value={fuelGrade}
          onChange={(e) => setFuelGrade(e.target.value as FuelGrade)}
        >
          {Object.entries(FUEL_GRADE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-40"
        disabled={!name.trim()}
      >
        {submitLabel}
      </button>
    </form>
  )
}
