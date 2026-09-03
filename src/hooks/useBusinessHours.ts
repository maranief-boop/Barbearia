import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { BusinessHours } from '@/types/database'

/** Horários de funcionamento por dia da semana (0 = domingo). */
export function useBusinessHours() {
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('business_hours')
      .select('*')
      .order('weekday')
    if (err) setError(err.message)
    else setHours((data ?? []) as BusinessHours[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const byWeekday = new Map(hours.map((h) => [h.weekday, h]))

  return { hours, byWeekday, loading, error, refetch: load }
}
