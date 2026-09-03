import { CalendarClock, RefreshCcw, Sparkles, Users } from 'lucide-react'

const DIFFERENTIALS = [
  {
    icon: CalendarClock,
    title: 'Agendamento 24/7',
    description:
      'Escolha serviço, barbeiro e horário pelo celular, a qualquer hora — sem ligação e sem fila de espera.',
  },
  {
    icon: Users,
    title: 'Barbeiros experientes',
    description:
      'Profissionais qualificados e apaixonados pelo ofício, prontos para o estilo que você procura.',
  },
  {
    icon: Sparkles,
    title: 'Acabamento impecável',
    description:
      'Produtos de qualidade, toalha quente e aquele cuidado nos detalhes que fazem toda a diferença.',
  },
  {
    icon: RefreshCcw,
    title: 'Seu horário, sempre em dia',
    description:
      'Horário marcado é horário respeitado: atendimento pontual, sem espera e sem correria.',
  },
] as const

export function Differentials() {
  return (
    <section id="diferenciais" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="text-center text-3xl font-bold">
        Por que escolher a <span className="text-brand-primary">nossa barbearia</span>
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {DIFFERENTIALS.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-2xl border border-white/10 bg-brand-secondary/60 p-6 transition hover:border-brand-primary/40"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/15 text-brand-primary">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-brand-light/65">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
