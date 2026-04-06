import { motion } from 'motion/react';
import { Search, MapPin, Star, Languages, ArrowRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function PractitionerTeaser() {
  const practitioners = [
    { 
        name: "Dr. Aminata Diop", 
        spec: "Dermatologie pédiatrique", 
        loc: "Dakar, Plateau", 
        langs: ["FR", "WOL"],
        image: "https://images.unsplash.com/photo-1633419798503-0b0c628f267c?q=80&w=600&auto=format&fit=crop",
        tags: ["Eczéma", "Acné", "Pédiatrie"]
    },
    { 
        name: "Dr. Moussa Fall", 
        spec: "Chirurgie & Esthétique", 
        loc: "Saly, Mbour", 
        langs: ["FR", "EN"],
        image: "https://images.unsplash.com/photo-1666887360742-974c8fce8e6b?q=80&w=600&auto=format&fit=crop",
        tags: ["Kéloïdes", "Laser", "Chirurgie"]
    },
    { 
        name: "Dr. Sarah Ndiaye", 
        spec: "Médecine Esthétique", 
        loc: "Dakar, Almadies", 
        langs: ["FR", "WOL"],
        image: "https://images.unsplash.com/photo-1651848894662-5245755aea8e?q=80&w=600&auto=format&fit=crop",
        tags: ["Taches", "Peeling", "Hydratation"]
    },
  ];

  return (
    <section className="bg-white py-32 px-4 md:px-8 border-y border-[#111214]/5">
      <div className="max-w-[1400px] mx-auto">
        <AnimatedSection className="text-center mb-20 max-w-2xl mx-auto">
          <span className="text-[#5B1112] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Annuaire Certifié
          </span>
          <h2 className="text-4xl md:text-5xl text-[#111214] mb-8 leading-tight font-semibold">
            Les meilleurs spécialistes,<br />
            <span className="italic text-[#111214]/40">vérifiés pour vous.</span>
          </h2>
          
          {/* Search Bar - Modern & Floating */}
          <div className="relative group max-w-lg mx-auto transform hover:-translate-y-1 transition-transform duration-300">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#111214]/30 group-focus-within:text-[#5B1112] transition-colors">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder="Rechercher à Dakar, Saly, Thiès..." 
              className="w-full pl-16 pr-6 py-5 rounded-full bg-white border border-[#111214]/10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] focus:outline-none focus:border-[#5B1112]/30 focus:shadow-[0_12px_40px_rgba(91,17,18,0.08)] transition-all duration-300 text-[#111214] placeholder:text-[#111214]/30 font-medium text-lg"
            />
            <button className="absolute right-3 top-2 bottom-2 bg-[#111214] text-white px-8 rounded-full text-sm font-semibold tracking-wide hover:bg-[#5B1112] transition-colors duration-300 shadow-lg">
              Chercher
            </button>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {practitioners.map((doc, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-[2rem] overflow-hidden hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 border border-[#111214]/5"
            >
              {/* Image Header */}
              <div className="h-72 w-full overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60" />
                  <img 
                    src={doc.image} 
                    alt={doc.name} 
                    className="w-full h-full object-cover transition-transform duration-[1.2s] group-hover:scale-110" 
                  />
                  
                  {/* Floating Tags */}
                  <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                     <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-medium border border-white/10 flex items-center gap-1">
                        <MapPin size={10} /> {doc.loc}
                     </span>
                      <span className="px-3 py-1 bg-[#5B1112] rounded-full text-white text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <Star size={10} fill="currentColor" /> Vérifié
                     </span>
                  </div>
              </div>

              {/* Content Body */}
              <div className="p-8">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-2xl font-semibold text-[#111214] mb-1 group-hover:text-[#5B1112] transition-colors">
                            {doc.name}
                        </h3>
                        <p className="text-[#111214]/50 text-sm font-medium uppercase tracking-wide mb-4">
                            {doc.spec}
                        </p>
                    </div>
                  </div>
                  
                  {/* Pills */}
                  <div className="flex flex-wrap gap-2 mb-8">
                     {doc.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-lg bg-[#F9FAFB] text-[#111214]/60 text-xs font-medium border border-[#111214]/5">
                            {tag}
                        </span>
                     ))}
                     <span className="px-3 py-1 rounded-lg bg-[#F9FAFB] text-[#111214]/40 text-xs font-medium border border-[#111214]/5 flex items-center gap-1">
                        <Languages size={12} /> {doc.langs.join("/")}
                     </span>
                  </div>

                  <button className="w-full py-4 rounded-xl border border-[#111214]/10 text-[#111214] font-semibold text-sm hover:bg-[#111214] hover:text-white hover:border-[#111214] transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                    Voir les disponibilités <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
