import Header from '@/components/landing/Header'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import Integrations from '@/components/landing/Integrations'
import HowItWorks from '@/components/landing/HowItWorks'
import Pricing from '@/components/landing/Pricing'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <Integrations />
        <HowItWorks />
        <Pricing />
      </main>
      <Footer />
    </div>
  )
}
