import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toISODate } from '@/lib/date'
import type {
  PaymentMethod,
  PaymentWithProfessional,
} from '@/types/database'

export interface RevenueSummary {
  total: number
  count: number
  byMethod: Record<PaymentMethod, number>
  byDay: { day: string; total: number }[]
  byProfessional: {
    id: string
    name: string
    gross: number
    commission: number
  }[]
}

/**
 * Faturamento de um período (por dia, método de pagamento e barbeiro,
 * com comissão calculada). Datas "YYYY-MM-DD" comparadas no fuso local.
 */
export function useRevenueStats(from: string, to: string) {
  const [payments, setPayments] = useState<PaymentWithProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('payments')
      .select(
        'id, amount, method, received_at, professional_id, professional:professionals(id, name, commission_pct)',
      )
      .order('received_at', { ascending: false })
    if (err) setError(err.message)
    else setPayments((data ?? []) as unknown as PaymentWithProfessional[])
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo<RevenueSummary>(() => {
    const inPeriod = payments.filter((p) => {
      const day = toISODate(new Date(p.received_at))
      return day >= from && day <= to
    })

    const byMethod: Record<PaymentMethod, number> = {
      dinheiro: 0,
      pix: 0,
      cartao: 0,
    }
    const byDayMap = new Map<string, number>()
    const byProfessionalMap = new Map<
      string,
      { id: string; name: string; gross: number; commission: number }
    >()

    let total = 0
    for (const p of inPeriod) {
      const amount = Number(p.amount)
      total += amount
      byMethod[p.method] += amount

      const day = toISODate(new Date(p.received_at))
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + amount)

      if (p.professional) {
        const prof = byProfessionalMap.get(p.professional.id) ?? {
          id: p.professional.id,
          name: p.professional.name,
          gross: 0,
          commission: 0,
        }
        prof.gross += amount
        prof.commission += amount * (Number(p.professional.commission_pct) / 100)
        byProfessionalMap.set(p.professional.id, prof)
      }
    }

    return {
      total,
      count: inPeriod.length,
      byMethod,
      byDay: [...byDayMap.entries()]
        .map(([day, dayTotal]) => ({ day, total: dayTotal }))
        .sort((a, b) => a.day.localeCompare(b.day)),
      byProfessional: [...byProfessionalMap.values()].sort(
        (a, b) => b.gross - a.gross,
      ),
    }
  }, [payments, from, to])

  return { payments, summary, loading, error, refetch: load }
}
