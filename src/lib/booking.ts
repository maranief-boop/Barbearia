import { supabase } from '@/lib/supabase'
import type { Appointment } from '@/types/database'

export interface BookAppointmentInput {
  name: string
  phone: string
  serviceId: string
  /** null = sem preferência de barbeiro */
  professionalId: string | null
  /** "YYYY-MM-DD" */
  date: string
  /** "HH:mm" ou "HH:mm:ss" */
  startTime: string
}

/**
 * Realiza o agendamento via RPC `book_appointment` (segura: valida slot,
 * cria/atualiza o cliente por telefone e insere o agendamento atomicamente).
 * Erros de horário indisponível chegam com mensagem em PT-BR do banco.
 */
export async function bookAppointment(
  input: BookAppointmentInput,
): Promise<Appointment> {
  const { data, error } = await supabase.rpc('book_appointment', {
    p_customer_name: input.name,
    p_customer_phone: input.phone,
    p_service_id: input.serviceId,
    p_professional_id: input.professionalId,
    p_appointment_date: input.date,
    p_start_time: input.startTime,
  })
  if (error) throw new Error(error.message)
  return data as Appointment
}
