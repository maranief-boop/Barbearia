import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Professional } from '@/types/database'

/** Barbeiros disponíveis para agendamento (e exibição no site). */
export function useProfessionals(activeOnly = true) {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from('professionals').select('*').order('name')
    if (activeOnly) query = query.eq('active', true)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setProfessionals((data ?? []) as Professional[])
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    void load()
  }, [load])

  return { professionals, loading, error, refetch: load }
}
