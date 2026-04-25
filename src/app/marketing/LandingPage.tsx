import { motion, useScroll, useTransform } from 'motion/react';
import Header from './components/Header';
import { GuidedEntry } from './components/landing/GuidedEntry';
import { HowItWorks } from './components/landing/HowItWorks';
import { CoreValueModules } from './components/landing/CoreValueModules';
import { ProductPreviews } from './components/landing/ProductPreviews';
import { TrustSecurity } from './components/landing/TrustSecurity';
import { PractitionerTeaser } from './components/landing/PractitionerTeaser';
import { BlogCarousel } from './components/landing/BlogCarousel';
import { FAQSection } from './components/landing/FAQSection';
import { ContactCTA } from './components/landing/ContactCTA';
import { Footer } from './components/landing/Footer';
import heroImage from './assets/melanis-landing-hero.webp';

export default function LandingPage() {
  // We use scrollY directly to avoid target/container resolution issues in some environments
  const { scrollY } = useScroll();

  // Map scroll pixels to animation values
  // 0 to 1000px covers the typical hero interaction range
  const scale = useTransform(scrollY, [0, 1000], [1, 1.15]);
  const textOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const y = useTransform(scrollY, [0, 1000], ["0%", "5%"]);

  return (
    <div className="relative min-h-screen bg-[#FEF0D5] font-aileron">
      <Header />
      
      {/* Fixed Hero Section - stays behind content */}
      <section className="fixed top-0 left-0 w-full h-screen overflow-hidden bg-black z-0">
        <motion.div 
          style={{ 
            scale,
            y,
          }}
          className="absolute inset-0 w-full h-full origin-center"
        >
          <img 
            src={heroImage} 
            alt="Melanis Hero - Skin Detail"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-6">
          <motion.div 
            style={{ opacity: textOpacity }}
            className="max-w-5xl"
          >
            <h1 className="text-5xl md:text-8xl font-semibold tracking-tight text-white drop-shadow-2xl mb-6">
              L'excellence dermatologique <br />
              <span className="italic font-light">pour les peaux noires & métissées.</span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-normal max-w-2xl mx-auto drop-shadow-lg">
              La première plateforme de santé dédiée aux spécificités de votre peau.
              Consultations, télé-derm et suivi médical au Sénégal et en Afrique de l'Ouest.
            </p>
          </motion.div>
          
          {/* Scroll Indicator */}
          <motion.div 
            style={{ opacity: textOpacity }}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-12 flex flex-col items-center gap-2"
          >
            <span className="text-white/60 text-[10px] uppercase tracking-[0.2em] font-semibold">Découvrir Melanis</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-white/60 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* Spacer to allow scrolling before content covers hero */}
      <div className="relative h-[100vh] w-full pointer-events-none" />

      {/* Main Content Flow - Slides OVER the fixed hero */}
      <main className="relative z-10 bg-[#FEF0D5] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] rounded-t-3xl">
        <GuidedEntry />
        <HowItWorks />
        <CoreValueModules />
        <ProductPreviews />
        <TrustSecurity />
        <PractitionerTeaser />
        <BlogCarousel />
        <FAQSection />
        <ContactCTA />
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
