import { useMemo, useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { recognizeReceipt } from '../lib/ocr'
import { recognizeWithClova } from '../lib/clova'
import { preprocessReceiptImage } from '../lib/preprocess'
import { parseReceiptText } from '../lib/receipt'
import { fmt, fmt1 } from '../lib/stats'
import type { FuelGrade, FuelRecord } from '../types'
import { FUEL_GRADE_LABELS } from '../types'

interface Props {
  editingRecord: FuelRecord | null
  onDone: () => void
}

type ScanState =
  | { kind: 'idle' }
  | { kind: 'working'; percent: number; status: string }
  | { kind: 'done'; fields: string[] }
  | { kind: 'error'; message: string }

const PARSED_FIELD_LABELS: Record<string, string> = {
  date: '날짜',
  stationName: '주유소명',
  stationAddress: '주소',
  fuelGrade: '유종',
  liters: '주유량',
  amount: '주유금액',
  unitPrice: '단가',
  paymentCard: '결제카드',
}

const today = () => new Date().toISOString().slice(0, 10)

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none'
const labelClass = 'mb-1 block text-xs font-medium text-slate-600'

export function RecordForm({ editingRecord, onDone }: Props) {
  const vehicles = useAppStore((s) => s.vehicles)
  const records = useAppStore((s) => s.records)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const addRecord = useAppStore((s) => s.addRecord)
  const updateRecord = useAppStore((s) => s.updateRecord)
  const ocrSettings = useAppStore((s) => s.ocrSettings)

  const vehicle = vehicles.find((v) => v.id === (editingRecord?.vehicleId ?? selectedVehicleId))

  const [date, setDate] = useState(editingRecord?.date ?? today())
  const [stationName, setStationName] = useState(editingRecord?.stationName ?? '')
  const [stationAddress, setStationAddress] = useState(editingRecord?.stationAddress ?? '')
  const [fuelGrade, setFuelGrade] = useState<FuelGrade>(
    editingRecord?.fuelGrade ?? vehicle?.fuelGrade ?? 'regular',
  )
  const [liters, setLiters] = useState(editingRecord ? String(editingRecord.liters) : '')
  const [amount, setAmount] = useState(editingRecord ? String(editingRecord.amount) : '')
  const [unitPrice, setUnitPrice] = useState(
    editingRecord?.unitPrice != null ? String(editingRecord.unitPrice) : '',
  )
  const [paymentCard, setPaymentCard] = useState(editingRecord?.paymentCard ?? '')
  const [distanceKm, setDistanceKm] = useState(
    editingRecord?.distanceKm != null ? String(editingRecord.distanceKm) : '',
  )
  const [odometer, setOdometer] = useState(
    editingRecord?.odometer != null ? String(editingRecord.odometer) : '',
  )
  const [fullTank, setFullTank] = useState(editingRecord?.fullTank ?? true)
  const [memo, setMemo] = useState(editingRecord?.memo ?? '')

  const [scan, setScan] = useState<ScanState>({ kind: 'idle' })
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // 이 차량의 직전 기록(수정 중인 기록 제외) — 누적 주행거리로 이동 거리 자동 제안
  const prevOdometer = useMemo(() => {
    const candidates = records
      .filter(
        (r) =>
          r.vehicleId === (editingRecord?.vehicleId ?? selectedVehicleId) &&
          r.id !== editingRecord?.id &&
          r.odometer != null,
      )
      .sort((a, b) => (a.date === b.date ? a.createdAt - b.createdAt : a.date < b.date ? -1 : 1))
    return candidates.at(-1)?.odometer ?? null
  }, [records, selectedVehicleId, editingRecord])

  const litersNum = Number(liters)
  const amountNum = Number(amount)
  const distanceNum = Number(distanceKm)
  const autoUnitPrice =
    litersNum > 0 && amountNum > 0 ? Math.round(amountNum / litersNum) : null
  const economy = litersNum > 0 && distanceNum > 0 ? distanceNum / litersNum : null

  const handleImage = async (file: File | undefined) => {
    if (!file) return
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old)
      return URL.createObjectURL(file)
    })
    setScan({ kind: 'working', percent: 0, status: '인식 엔진 준비 중' })
    try {
      let text: string | null = null
      // CLOVA OCR이 설정되어 있으면 우선 사용, 실패하면 기기 내 OCR로 폴백
      if (ocrSettings.clovaInvokeUrl && ocrSettings.clovaSecretKey) {
        setScan({ kind: 'working', percent: 50, status: 'CLOVA OCR 인식 중' })
        try {
          text = await recognizeWithClova(
            file,
            ocrSettings.clovaInvokeUrl,
            ocrSettings.clovaSecretKey,
          )
        } catch {
          text = null
        }
      }
      if (text === null) {
        // 전처리(리사이즈·그레이스케일·대비 보정)로 기기 내 OCR 인식률을 높인다
        let input: File | Blob = file
        try {
          input = await preprocessReceiptImage(file)
        } catch {
          input = file
        }
        text = await recognizeReceipt(input, (percent, status) =>
          setScan({ kind: 'working', percent, status }),
        )
      }
      const parsed = parseReceiptText(text)
      if (parsed.date) setDate(parsed.date)
      if (parsed.stationName) setStationName(parsed.stationName)
      if (parsed.stationAddress) setStationAddress(parsed.stationAddress)
      if (parsed.fuelGrade) setFuelGrade(parsed.fuelGrade)
      if (parsed.liters) setLiters(String(parsed.liters))
      if (parsed.amount) setAmount(String(parsed.amount))
      if (parsed.unitPrice) setUnitPrice(String(parsed.unitPrice))
      if (parsed.paymentCard) setPaymentCard(parsed.paymentCard)
      const found = Object.entries(parsed)
        .filter(([, v]) => v !== undefined)
        .map(([k]) => PARSED_FIELD_LABELS[k])
      setScan({ kind: 'done', fields: found })
    } catch {
      setScan({
        kind: 'error',
        message: '영수증 인식에 실패했습니다. 네트워크 연결을 확인하거나 직접 입력해 주세요.',
      })
    }
  }

  const handleOdometerChange = (value: string) => {
    setOdometer(value)
    const n = Number(value)
    if (distanceKm === '' && prevOdometer != null && n > prevOdometer) {
      setDistanceKm(String(n - prevOdometer))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicle) return
    if (!(litersNum > 0) || !(amountNum > 0)) {
      window.alert('주유량과 주유금액을 확인해 주세요.')
      return
    }
    const data = {
      vehicleId: vehicle.id,
      date,
      stationName: stationName.trim(),
      stationAddress: stationAddress.trim(),
      fuelGrade,
      liters: litersNum,
      amount: amountNum,
      unitPrice: unitPrice !== '' ? Number(unitPrice) : autoUnitPrice,
      paymentCard: paymentCard.trim(),
      distanceKm: distanceKm !== '' && distanceNum > 0 ? distanceNum : null,
      odometer: odometer !== '' && Number(odometer) > 0 ? Number(odometer) : null,
      fullTank,
      memo: memo.trim(),
    }
    if (editingRecord) updateRecord(editingRecord.id, data)
    else addRecord(data)
    onDone()
  }

  if (!vehicle) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        먼저 차량 탭에서 차량을 선택해 주세요.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 영수증 스캔 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">영수증으로 자동 입력</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          영수증을 찍으면 날짜·주유소·유종·주유량·금액·카드가 자동으로 채워집니다.
        </p>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void handleImage(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void handleImage(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={scan.kind === 'working'}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-40"
          >
            📷 영수증 촬영
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={scan.kind === 'working'}
            className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 active:bg-slate-50 disabled:opacity-40"
          >
            🖼 앨범에서 선택
          </button>
        </div>
        {previewUrl && (
          <img
            src={previewUrl}
            alt="영수증 미리보기"
            className="mt-3 max-h-40 w-full rounded-xl object-contain"
          />
        )}
        {scan.kind === 'working' && (
          <div className="mt-3">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${scan.percent}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {scan.status}… {scan.percent > 0 && `${scan.percent}%`}
            </p>
          </div>
        )}
        {scan.kind === 'done' && (
          <p className="mt-3 text-xs text-emerald-600">
            {scan.fields.length > 0
              ? `인식 완료: ${scan.fields.join(', ')} — 내용을 확인하고 수정해 주세요.`
              : '영수증에서 항목을 찾지 못했습니다. 직접 입력해 주세요.'}
          </p>
        )}
        {scan.kind === 'error' && <p className="mt-3 text-xs text-red-500">{scan.message}</p>}
      </section>

      {/* 주유 정보 */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">주유 정보</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>날짜 *</span>
            <input
              type="date"
              className={inputClass}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>유종</span>
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
        </div>
        <label className="block">
          <span className={labelClass}>주유소명</span>
          <input
            className={inputClass}
            value={stationName}
            onChange={(e) => setStationName(e.target.value)}
            placeholder="예: OO셀프주유소"
          />
        </label>
        <label className="block">
          <span className={labelClass}>주소</span>
          <input
            className={inputClass}
            value={stationAddress}
            onChange={(e) => setStationAddress(e.target.value)}
            placeholder="주유소 주소"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>주유량 (L) *</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className={inputClass}
              value={liters}
              onChange={(e) => setLiters(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>주유금액 (원) *</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>단가 (원/L)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className={inputClass}
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder={autoUnitPrice != null ? `자동: ${fmt(autoUnitPrice)}` : ''}
            />
          </label>
          <label className="block">
            <span className={labelClass}>결제 카드</span>
            <input
              className={inputClass}
              value={paymentCard}
              onChange={(e) => setPaymentCard(e.target.value)}
              placeholder="예: 신한카드"
            />
          </label>
        </div>
      </section>

      {/* 주행 정보 (직접 입력) */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">주행 정보 (직접 입력)</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={labelClass}>이동 거리 (km)</span>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              className={inputClass}
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              placeholder="직전 주유 이후"
            />
          </label>
          <label className="block">
            <span className={labelClass}>총 주행거리 (km)</span>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              className={inputClass}
              value={odometer}
              onChange={(e) => handleOdometerChange(e.target.value)}
              placeholder="계기판 누적"
            />
          </label>
        </div>
        {prevOdometer != null && (
          <p className="text-xs text-slate-500">
            직전 기록의 총 주행거리: {fmt(prevOdometer)} km — 총 주행거리를 입력하면 이동 거리가
            자동 계산됩니다.
          </p>
        )}
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5">
          <input
            type="checkbox"
            checked={fullTank}
            onChange={(e) => setFullTank(e.target.checked)}
            className="size-4 accent-blue-600"
          />
          <span className="text-sm text-slate-700">
            가득 주유
            <span className="ml-1.5 text-xs text-slate-400">연비는 가득~가득 구간으로 계산</span>
          </span>
        </label>
        <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm">
          <span className="text-slate-500">예상 연비 </span>
          <span className="font-semibold text-slate-900">
            {!fullTank
              ? '부분 주유 — 다음 가득 주유 때 구간 연비로 계산'
              : economy != null
                ? `${fmt1(economy)} km/L`
                : '이동 거리와 주유량 입력 시 계산'}
          </span>
        </div>
        <label className="block">
          <span className={labelClass}>메모</span>
          <input
            className={inputClass}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="선택 입력"
          />
        </label>
      </section>

      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white active:bg-blue-700"
      >
        {editingRecord ? '수정 저장' : `${vehicle.name} 주유 기록 저장`}
      </button>
      {editingRecord && (
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl border border-slate-300 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
        >
          수정 취소
        </button>
      )}
    </form>
  )
}
