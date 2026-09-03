import type { PeriodKey } from '@/lib/date'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'dia', label: 'Hoje' },
  { key: 'semana', label: 'Semana' },
  { key: 'mes', label: 'Mês' },
  { key: 'ano', label: 'Ano' },
] as const

/** Seletor segmentado de período (Hoje/Semana/Mês/Ano). */
export function PeriodTabs({
  value,
  onChange,
}: {
  value: PeriodKey
  onChange: (period: PeriodKey) => void
}) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-brand-secondary/50 p-1">
      {PERIODS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
            value === key
              ? 'bg-brand-primary text-brand-dark'
              : 'text-brand-light/60 hover:text-brand-light'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
