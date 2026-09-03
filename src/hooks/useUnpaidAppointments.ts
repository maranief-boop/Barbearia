import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type {
  AppointmentWithRelations,
  PaymentMethod,
} from '@/types/database'

export type AppointmentWithPayments = AppointmentWithRelations & {
  payments: { amount: number }[]
}

/**
 * Atendimentos finalizados do período que ainda não tiveram recebimento
 * registrado — a lista "a receber" do financeiro.
 */
export function useUnpaidAppointments(from: string, to: string) {
  const [appointments, setAppointments] = useState<AppointmentWithPayments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*, service:services(name), payments(amount)')
      .eq('status', 'finalizado')
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .order('appointment_date')
      .order('start_time')
    if (err) {
      setError(err.message)
    } else {
      setAppointments(
        ((data ?? []) as unknown as AppointmentWithPayments[]).filter(
          (a) => !a.payments || a.payments.length === 0,
        ),
      )
    }
    setLoading(false)
  }, [from, to])

  useEffect(() => {
    void load()
  }, [load])

  return { appointments, loading, error, refetch: load }
}

export interface RegisterPaymentInput {
  appointmentId: string
  professionalId: string | null
  amount: number
  method: PaymentMethod
}

/** Registra o valor recebido por um atendimento. */
export async function registerPayment(
  input: RegisterPaymentInput,
): Promise<void> {
  const { error } = await supabase.from('payments').insert({
    appointment_id: input.appointmentId,
    professional_id: input.professionalId,
    amount: input.amount,
    method: input.method,
  })
  if (error) throw new Error(error.message)
}
