import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  AppointmentStatus,
  AppointmentWithRelations,
} from '@/types/database'

export interface AppointmentFilters {
  /** "YYYY-MM-DD" (inclusivo) */
  from: string
  /** "YYYY-MM-DD" (inclusivo) */
  to: string
  /** null = todos os barbeiros */
  professionalId?: string | null
  status?: AppointmentStatus | null
}

/**
 * Agendamentos de um período com serviço e barbeiro relacionados —
 * base do Kanban do painel administrativo.
 */
export function useAppointments(filters: AppointmentFilters) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { from, to, professionalId, status } = filters

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('appointments')
      .select('*, service:services(*), professional:professionals(*)')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .order('appointment_date')
      .order('start_time')
    if (professionalId) query = query.eq('professional_id', professionalId)
    if (status) query = query.eq('status', status)
    const { data, error: err } = await query
    if (err) setError(err.message)
    else setAppointments((data ?? []) as AppointmentWithRelations[])
    setLoading(false)
  }, [from, to, professionalId, status])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * Move o card de coluna no Kanban: atualização otimista (move na hora e
   * reverte para o status anterior se o banco recusar).
   */
  const updateStatus = useCallback(
    async (id: string, newStatus: AppointmentStatus): Promise<boolean> => {
      let previous: AppointmentWithRelations | undefined
      setAppointments((prev) => {
        previous = prev.find((a) => a.id === id)
        return prev.map((a) =>
          a.id === id ? { ...a, status: newStatus } : a,
        )
      })
      const { error: err } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', id)
      if (err) {
        setError(err.message)
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === id && previous ? { ...a, ...previous } : a,
          ),
        )
        return false
      }
      return true
    },
    [],
  )

  return { appointments, loading, error, refetch: load, updateStatus }
}
