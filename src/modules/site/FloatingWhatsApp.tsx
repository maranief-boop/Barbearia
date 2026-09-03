import { MessageCircle } from 'lucide-react'
import { BRAND, waLink } from '@/config/brand'

/** Botão flutuante fixo de WhatsApp — presente em todas as seções do site. */
export function FloatingWhatsApp() {
  return (
    <a
      href={waLink()}
      target="_blank"
      rel="noreferrer"
      aria-label={`Chamar ${BRAND.name} no WhatsApp`}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-xl transition hover:scale-105"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  )
}
