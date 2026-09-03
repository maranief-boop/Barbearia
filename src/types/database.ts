/**
 * Tipos das tabelas do Supabase (espelham supabase/migrations/001_init.sql).
 */

export type AppointmentStatus =
  | 'agendado'
  | 'em_atendimento'
  | 'finalizado'
  | 'cancelado'

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao'

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  em_atendimento: 'Na Barbearia',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao: 'Cartão',
}

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration_min: number
  active: boolean
  sort_order: number
  created_at: string
}

export interface Professional {
  id: string
  name: string
  role: string
  avatar_url: string | null
  commission_pct: number
  active: boolean
  created_at: string
}

export interface BusinessHours {
  id: string
  weekday: number // 0 = domingo ... 6 = sábado
  open_time: string
  close_time: string
  is_open: boolean
}

export interface Customer {
  id: string
  name: string
  phone: string
  notes: string | null
  last_contacted_at: string | null
  created_at: string
}

export interface Appointment {
  id: string
  customer_id: string | null
  customer_name: string
  customer_phone: string
  service_id: string
  professional_id: string | null
  appointment_date: string // "YYYY-MM-DD"
  start_time: string // "HH:mm:ss"
  end_time: string
  status: AppointmentStatus
  price: number
  notes: string | null
  created_at: string
}

export interface AppointmentWithRelations extends Appointment {
  service: Service | null
  professional: Professional | null
}

export interface Payment {
  id: string
  appointment_id: string
  professional_id: string | null
  amount: number
  method: PaymentMethod
  received_at: string
}

export interface PaymentWithProfessional extends Payment {
  professional: Pick<Professional, 'id' | 'name' | 'commission_pct'> | null
}
