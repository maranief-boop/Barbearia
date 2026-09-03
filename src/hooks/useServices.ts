import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Service } from '@/types/database'

/** Lista de serviços exibidos no site e no fluxo de agendamento. */
export function useServices(activeOnly = true) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase.from('services').select('*').order('sort_order')
    if (activeOnly) query = query.eq('active', true)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setServices((data ?? []) as Service[])
    setLoading(false)
  }, [activeOnly])

  useEffect(() => {
    void load()
  }, [load])

  return { services, loading, error, refetch: load }
}
