export type Tab = 'home' | 'add' | 'trends' | 'vehicles'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '홈', icon: '🏠' },
  { id: 'add', label: '주유 입력', icon: '⛽' },
  { id: 'trends', label: '트렌드', icon: '📊' },
  { id: 'vehicles', label: '차량', icon: '🚗' },
]

export function TabBar({ tab, onChange }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                active ? 'font-semibold text-blue-600' : 'text-slate-400'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-lg leading-none" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
