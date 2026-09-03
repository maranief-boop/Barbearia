import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Horários disponíveis para agendamento em uma data, via RPC
 * `get_available_slots` (considera funcionamento, agendamentos existentes
 * e a duração do serviço).
 */
export function useAvailability(
  professionalId: string | null,
  date: string | null,
  durationMin: number | null,
) {
  const [slots, setSlots] = useState<string[]>([]) // "HH:mm"
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date || !durationMin) {
      setSlots([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)

    supabase
      .rpc('get_available_slots', {
        p_professional_id: professionalId,
        p_date: date,
        p_duration_min: durationMin,
      })
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) {
          setError(err.message)
          setSlots([])
        } else {
          setSlots(
            ((data ?? []) as { start_time: string }[]).map((s) =>
              s.start_time.slice(0, 5),
            ),
          )
        }
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [professionalId, date, durationMin])

  return { slots, loading, error }
}
