import { CalendarX2 } from 'lucide-react'
import { useAvailability } from '@/hooks/useAvailability'

interface Props {
  /** null = sem preferência de barbeiro */
  professionalId: string | null
  date: string
  durationMin: number
  selectedTime: string | null
  onSelect: (time: string) => void
}

export function TimeStep({
  professionalId,
  date,
  durationMin,
  selectedTime,
  onSelect,
}: Props) {
  const { slots, loading, error } = useAvailability(
    professionalId,
    date,
    durationMin,
  )

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-11 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-red-400">Erro: {error}</p>
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-brand-secondary/40 p-8 text-center">
        <CalendarX2 className="h-10 w-10 text-brand-primary/60" />
        <p className="text-brand-light/70">
          Sem horários livres neste dia. Escolha outra data ou outro barbeiro.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
      {slots.map((slot) => {
        const selected = slot === selectedTime
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`rounded-xl border py-2.5 text-center text-sm font-semibold transition ${
              selected
                ? 'border-brand-primary bg-brand-primary text-brand-dark'
                : 'border-white/10 bg-brand-secondary/50 text-brand-light/80 hover:border-brand-primary/40'
            }`}
          >
            {slot}
          </button>
        )
      })}
    </div>
  )
}
