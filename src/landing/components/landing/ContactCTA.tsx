import { ArrowUpRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';
import { Link } from 'react-router';

export function ContactCTA() {
  return (
    <section className="bg-[#111214] py-32 px-4 md:px-8 overflow-hidden relative group">
      {/* Dynamic Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-[#5B1112] rounded-full blur-[200px] translate-x-1/2 -translate-y-1/2 group-hover:bg-[#80181A] transition-colors duration-[2s]" />
      </div>

      <div className="max-w-5xl mx-auto text-center relative z-10">
        <AnimatedSection>
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[#FEF0D5] text-xs font-semibold tracking-[0.2em] uppercase mb-8 backdrop-blur-sm">
                Une nouvelle ère
            </span>
            
            <h2 className="text-5xl md:text-7xl lg:text-8xl text-white mb-12 leading-[0.9] tracking-tight font-semibold">
                La dermatologie,<br />
                <span className="italic text-white/40">dédiée à votre peau.</span>
            </h2>
            
            <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-16 leading-relaxed">
                Rejoignez les milliers de patients qui font confiance à Melanis pour un suivi proactif au Sénégal et en Afrique de l'Ouest.
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                <Link
                    to="/patient-flow"
                    className="relative px-12 py-6 bg-[#FEF0D5] text-[#5B1112] rounded-full text-xl font-semibold tracking-wide hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(254,240,213,0.3)] group overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Commencer maintenant <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                    </span>
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay" />
                </Link>
                
                <Link
                    to="/patient-flow/auth/inscription"
                    className="px-12 py-6 bg-transparent border border-white/20 text-white rounded-full text-xl font-medium hover:bg-white/5 hover:border-white/40 transition-all duration-300 flex items-center gap-3 group"
                >
                    Espace Praticien <ArrowUpRight size={24} className="opacity-40 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </Link>
            </div>
            
            <div className="mt-20 flex items-center justify-center gap-2 text-white/30 text-xs font-semibold uppercase tracking-widest">
                <span>Dakar</span> • <span>Saly</span> • <span>Thiès</span> • <span>Saint-Louis</span>
            </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
