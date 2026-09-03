/**
 * Utilitários de data e moeda (sem dependências externas).
 */

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** Domingo da semana da data informada (início do período semanal). */
export function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1)
}

/** "HH:mm:ss" → "HH:mm" */
export function formatShortTime(time: string): string {
  return time.slice(0, 5)
}

/** "YYYY-MM-DD" → "DD/MM" */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

/** "YYYY-MM-DD" → "DD/MM/AAAA" */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const WEEKDAY_NAMES = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday] ?? ''
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/**
 * Períodos de análise (dia/semana/mês/ano) e o intervalo de datas
 * "YYYY-MM-DD" correspondente (inclusivo em ambas as pontas).
 */
export type PeriodKey = 'dia' | 'semana' | 'mes' | 'ano'

export function getDateRange(period: PeriodKey): { from: string; to: string } {
  const now = new Date()
  switch (period) {
    case 'dia':
      return { from: toISODate(now), to: toISODate(now) }
    case 'semana': {
      const start = startOfWeek(now)
      return { from: toISODate(start), to: toISODate(addDays(start, 6)) }
    }
    case 'mes': {
      const start = startOfMonth(now)
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      return { from: toISODate(start), to: toISODate(end) }
    }
    case 'ano': {
      const start = startOfYear(now)
      const end = new Date(now.getFullYear(), 11, 31)
      return { from: toISODate(start), to: toISODate(end) }
    }
  }
}
