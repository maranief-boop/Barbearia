import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import type { Customer } from '@/types/database'

export interface CustomerStats {
  visits: number
  totalSpent: number
  lastVisit: string | null
  lastService: string | null
}

export interface CustomerWithStats extends Customer {
  stats: CustomerStats
}

interface AppointmentRow {
  customer_id: string | null
  appointment_date: string
  price: number
  service: { name: string } | null
}

const EMPTY_STATS: CustomerStats = {
  visits: 0,
  totalSpent: 0,
  lastVisit: null,
  lastService: null,
}

/**
 * Base de clientes do CRM com estatísticas agregadas (visitas, gasto total,
 * último serviço) calculadas a partir dos agendamentos não cancelados.
 * Agendamentos futuros não entram no histórico — apenas o que já ocorreu.
 */
export function useCustomers() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [customersRes, appointmentsRes] = await Promise.all([
      supabase.from('customers').select('*').order('name'),
      supabase
        .from('appointments')
        .select('customer_id, appointment_date, price, service:services(name)')
        .neq('status', 'cancelado')
        .lte('appointment_date', toISODate(new Date()))
        .order('appointment_date', { ascending: false }),
    ])

    if (customersRes.error || appointmentsRes.error) {
      setError(customersRes.error?.message ?? appointmentsRes.error?.message ?? null)
      setLoading(false)
      return
    }

    const statsByCustomer = new Map<string, CustomerStats>()
    for (const raw of (appointmentsRes.data ?? []) as unknown as AppointmentRow[]) {
      if (!raw.customer_id) continue
      const stats = statsByCustomer.get(raw.customer_id) ?? { ...EMPTY_STATS }
      stats.visits += 1
      stats.totalSpent += Number(raw.price)
      if (!stats.lastVisit || raw.appointment_date > stats.lastVisit) {
        stats.lastVisit = raw.appointment_date
        stats.lastService = raw.service?.name ?? null
      }
      statsByCustomer.set(raw.customer_id, stats)
    }

    setCustomers(
      ((customersRes.data ?? []) as Customer[]).map((c) => ({
        ...c,
        stats: statsByCustomer.get(c.id) ?? EMPTY_STATS,
      })),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Registra o momento do último contato de campanha (CRM). */
  const markContacted = useCallback(async (id: string): Promise<boolean> => {
    const now = new Date().toISOString()
    const { error: err } = await supabase
      .from('customers')
      .update({ last_contacted_at: now })
      .eq('id', id)
    if (err) {
      setError(err.message)
      return false
    }
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, last_contacted_at: now } : c)),
    )
    return true
  }, [])

  return { customers, loading, error, refetch: load, markContacted }
}
