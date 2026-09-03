import { useMemo, useRef, useState } from 'react'
import { ChevronDown, Megaphone, MessageCircle, Send } from 'lucide-react'
import type { CustomerWithStats } from '@/hooks/useCustomers'
import { BRAND, customerWaLink } from '@/config/brand'
import { formatBRL } from '@/lib/date'

const VARIABLES = ['{nome}', '{primeiro_nome}', '{servico}', '{barbearia}'] as const

const DEFAULT_TEMPLATE =
  'Olá, {primeiro_nome}! Sentimos sua falta na {barbearia}. 💈\nPreparamos uma promoção especial para você voltar: 20% de desconto em qualquer serviço esta semana. Quer garantir seu horário?'

interface Props {
  customers: CustomerWithStats[]
  selectedIds: Set<string>
  /** Chamado após o lojista abrir o WhatsApp de um cliente. */
  onSent: (customerId: string) => void
}

/**
 * Painel de campanha: o lojista seleciona clientes na lista, escreve a
 * mensagem (com variáveis) e envia cliente a cliente via wa.me, já com o
 * texto preenchido. Cada envio registra o contato no CRM.
 */
export function CampaignPanel({ customers, selectedIds, onSent }: Props) {
  const [open, setOpen] = useState(false)
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)

  const selectedCustomers = useMemo(
    () => customers.filter((c) => selectedIds.has(c.id)),
    [customers, selectedIds],
  )

  const preview = renderTemplate(template, selectedCustomers[0])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /** Insere a variável na posição do cursor do textarea. */
  function insertVariable(variable: string) {
    const el = textareaRef.current
    if (!el) {
      setTemplate((t) => t + variable)
      return
    }
    const start = el.selectionStart ?? template.length
    const end = el.selectionEnd ?? template.length
    setTemplate(template.slice(0, start) + variable + template.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + variable.length
      el.setSelectionRange(pos, pos)
    })
  }

  function handleSend(customer: CustomerWithStats) {
    window.open(
      customerWaLink(renderTemplate(template, customer), customer.phone),
      '_blank',
      'noreferrer',
    )
    onSent(customer.id)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-brand-secondary/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <Megaphone className="h-5 w-5 text-brand-primary" />
        <div className="flex-1">
          <p className="font-semibold">
            Campanha / lista de transmissão
            {selectedIds.size > 0 ? (
              <span className="ml-2 rounded-full bg-brand-primary/15 px-2.5 py-0.5 text-xs font-semibold text-brand-primary">
                {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
              </span>
            ) : null}
          </p>
          <p className="text-xs text-brand-light/50">
            Selecione clientes na lista, personalize a mensagem e envie pelo WhatsApp
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-brand-light/40 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="space-y-4 border-t border-white/10 p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-sm text-brand-light/60">Variáveis:</span>
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => insertVariable(v)}
                  className="rounded-lg border border-white/10 bg-brand-dark px-2.5 py-1 font-mono text-xs text-brand-primary transition hover:border-brand-primary/50"
                >
                  {v}
                </button>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={5}
              placeholder="Escreva a mensagem da campanha..."
              className="w-full resize-y rounded-xl border border-white/10 bg-brand-dark p-4 text-sm outline-none transition focus:border-brand-primary"
            />
          </div>

          {selectedIds.size === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-sm text-brand-light/40">
              Marque clientes na lista abaixo para começar a enviar.
            </p>
          ) : (
            <div>
              <p className="mb-2 text-xs text-brand-light/50">
                {preview
                  ? `Prévia para ${selectedCustomers[0].name.split(' ')[0]}:`
                  : undefined}
              </p>
              {preview ? (
                <p className="mb-3 whitespace-pre-wrap rounded-xl bg-brand-dark p-3 text-sm text-brand-light/75">
                  {preview}
                </p>
              ) : null}
              <ul className="space-y-2">
                {selectedCustomers.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-brand-dark p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-brand-light/45">
                        Último serviço:{' '}
                        {c.stats.lastService ?? 'nenhum'}
                        {c.stats.lastVisit
                          ? ` · ${formatBRL(c.stats.totalSpent)} no total`
                          : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSend(c)}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#25d366] px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-1.5 text-xs text-brand-light/40">
                <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Cada "Enviar" abre o WhatsApp do cliente com a mensagem pronta —
                basta apertar enviar. O contato é registrado automaticamente no CRM.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </section>
  )
}

function renderTemplate(
  template: string,
  customer?: CustomerWithStats,
): string {
  if (!customer) return template
  const firstName = customer.name.split(' ')[0]
  return template
    .replaceAll('{nome}', customer.name)
    .replaceAll('{primeiro_nome}', firstName)
    .replaceAll('{servico}', customer.stats.lastService ?? 'nosso serviço')
    .replaceAll('{barbearia}', BRAND.name)
}
