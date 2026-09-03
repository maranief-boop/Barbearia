import { Users } from 'lucide-react'
import type { Professional } from '@/types/database'

export const ANY_PROFESSIONAL = 'any'

interface Props {
  professionals: Professional[]
  selected: string | 'any' | undefined
  onSelect: (professionalId: string | 'any') => void
}

export function ProfessionalStep({ professionals, selected, onSelect }: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => onSelect(ANY_PROFESSIONAL)}
        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
          selected === ANY_PROFESSIONAL
            ? 'border-brand-primary bg-brand-primary/10'
            : 'border-white/10 bg-brand-secondary/50 hover:border-brand-primary/40'
        }`}
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-brand-primary">
          <Users className="h-6 w-6" />
        </span>
        <span>
          <span className="block font-semibold">Sem preferência</span>
          <span className="block text-sm text-brand-light/60">
            Atendimento com o primeiro barbeiro livre
          </span>
        </span>
      </button>

      {professionals.map((professional) => {
        const isSelected = professional.id === selected
        return (
          <button
            key={professional.id}
            type="button"
            onClick={() => onSelect(professional.id)}
            className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
              isSelected
                ? 'border-brand-primary bg-brand-primary/10'
                : 'border-white/10 bg-brand-secondary/50 hover:border-brand-primary/40'
            }`}
          >
            {professional.avatar_url ? (
              <img
                src={professional.avatar_url}
                alt={professional.name}
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/15 text-lg font-bold text-brand-primary">
                {professional.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="block font-semibold">{professional.name}</span>
              <span className="block text-sm text-brand-light/60">
                {professional.role}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
