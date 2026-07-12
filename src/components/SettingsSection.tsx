import { useRef, useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import { downloadCsv, downloadJsonBackup, parseJsonBackup } from '../lib/backup'

const inputClass =
  'w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none'

export function SettingsSection() {
  const vehicles = useAppStore((s) => s.vehicles)
  const records = useAppStore((s) => s.records)
  const selectedVehicleId = useAppStore((s) => s.selectedVehicleId)
  const restoreBackup = useAppStore((s) => s.restoreBackup)
  const ocrSettings = useAppStore((s) => s.ocrSettings)
  const setOcrSettings = useAppStore((s) => s.setOcrSettings)

  const importInputRef = useRef<HTMLInputElement>(null)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [showOcrForm, setShowOcrForm] = useState(false)
  const [invokeUrl, setInvokeUrl] = useState(ocrSettings.clovaInvokeUrl)
  const [secretKey, setSecretKey] = useState(ocrSettings.clovaSecretKey)

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const data = await parseJsonBackup(file)
      const ok = window.confirm(
        `백업 파일의 차량 ${data.vehicles.length}대, 주유 기록 ${data.records.length}건으로 ` +
          '현재 데이터를 모두 교체합니다. 계속할까요?',
      )
      if (!ok) return
      restoreBackup(data)
      setImportMessage('백업을 복원했습니다.')
    } catch (e) {
      setImportMessage(e instanceof Error ? e.message : '백업 파일을 읽지 못했습니다.')
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">데이터 백업</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          데이터는 이 기기 브라우저에만 저장됩니다. 기기 변경 전에 백업해 두세요.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => downloadJsonBackup(vehicles, records, selectedVehicleId)}
            className="rounded-xl border border-slate-300 py-2.5 text-xs font-medium text-slate-700 active:bg-slate-50"
          >
            백업 저장
            <span className="block text-[10px] text-slate-400">JSON</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="rounded-xl border border-slate-300 py-2.5 text-xs font-medium text-slate-700 active:bg-slate-50"
          >
            백업 복원
            <span className="block text-[10px] text-slate-400">JSON</span>
          </button>
          <button
            type="button"
            onClick={() => downloadCsv(vehicles, records)}
            className="rounded-xl border border-slate-300 py-2.5 text-xs font-medium text-slate-700 active:bg-slate-50"
          >
            기록 내보내기
            <span className="block text-[10px] text-slate-400">CSV (엑셀)</span>
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            void handleImport(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        {importMessage && <p className="mt-2 text-xs text-slate-500">{importMessage}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">영수증 인식 설정</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              기본: 기기 내 OCR (무료, 서버 전송 없음)
              {ocrSettings.clovaInvokeUrl && ocrSettings.clovaSecretKey && (
                <span className="ml-1 font-medium text-emerald-600">· CLOVA OCR 사용 중</span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOcrForm((v) => !v)}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-blue-600"
          >
            {showOcrForm ? '닫기' : '고급 설정'}
          </button>
        </div>
        {showOcrForm && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-slate-500">
              인식 정확도가 더 필요하면 네이버 클라우드{' '}
              <span className="font-medium">CLOVA OCR</span>의 Invoke URL과 Secret Key를 입력하세요.
              설정하면 영수증 이미지가 CLOVA 서버로 전송되어 인식되며, 실패 시 자동으로 기기 내
              OCR로 전환됩니다.
            </p>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Invoke URL</span>
              <input
                className={inputClass}
                value={invokeUrl}
                onChange={(e) => setInvokeUrl(e.target.value)}
                placeholder="https://…apigw.ntruss.com/custom/v1/…/general"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-slate-600">Secret Key</span>
              <input
                type="password"
                className={inputClass}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="X-OCR-SECRET"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setOcrSettings({
                  clovaInvokeUrl: invokeUrl.trim(),
                  clovaSecretKey: secretKey.trim(),
                })
                setShowOcrForm(false)
              }}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700"
            >
              저장
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
