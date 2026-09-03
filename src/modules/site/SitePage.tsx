import { Differentials } from './Differentials'
import { FloatingWhatsApp } from './FloatingWhatsApp'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { LocationHours } from './LocationHours'
import { ServicesSection } from './ServicesSection'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

/** Site institucional completo (página inicial). */
export function SitePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Hero />
        <Differentials />
        <ServicesSection />
        <Gallery />
        <LocationHours />
      </main>
      <SiteFooter />
      <FloatingWhatsApp />
    </div>
  )
}
