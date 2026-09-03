import { useMemo } from 'react'
import type { BusinessHours } from '@/types/database'
import { addDays, toISODate, weekdayName } from '@/lib/date'

interface Props {
  byWeekday: Map<number, BusinessHours>
  selectedDate: string | null
  onSelect: (date: string) => void
}

const DAYS_AHEAD = 14

export function DateStep({ byWeekday, selectedDate, onSelect }: Props) {
  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const date = addDays(new Date(), i)
        const iso = toISODate(date)
        const weekday = date.getDay()
        const hours = byWeekday.get(weekday)
        return {
          iso,
          weekday,
          isToday: i === 0,
          isOpen: hours?.is_open ?? false,
        }
      }),
    [byWeekday],
  )

  const openDays = days.filter((d) => d.isOpen)

  if (openDays.length === 0) {
    return (
      <p className="text-center text-brand-light/60">
        Nenhum dia de funcionamento configurado. Verifique os horários no painel.
      </p>
    )
  }

  return (
    <div>
      <p className="mb-3 text-sm text-brand-light/60">Próximos {DAYS_AHEAD} dias</p>
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-7">
        {days.map((day) => {
          const selected = day.iso === selectedDate
          const dateNumber = Number(day.iso.slice(8, 10))
          return (
            <button
              key={day.iso}
              type="button"
              disabled={!day.isOpen}
              onClick={() => onSelect(day.iso)}
              className={`flex flex-col items-center rounded-xl border px-2 py-3 text-center transition ${
                !day.isOpen
                  ? 'cursor-not-allowed border-white/5 bg-white/5 text-brand-light/25'
                  : selected
                    ? 'border-brand-primary bg-brand-primary/15 text-brand-primary'
                    : 'border-white/10 bg-brand-secondary/50 text-brand-light/80 hover:border-brand-primary/40'
              }`}
            >
              <span className="text-xs">
                {day.isToday ? 'Hoje' : weekdayName(day.weekday).slice(0, 3)}
              </span>
              <span className="mt-1 text-lg font-bold">{dateNumber}</span>
              {day.isOpen ? (
                <span className="mt-0.5 text-[10px] text-brand-light/50">Aberto</span>
              ) : (
                <span className="mt-0.5 text-[10px]">Fechado</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
