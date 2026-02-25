import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const cards = [
  {
    id: 1,
    title: "Consultation Cabinet",
    subtitle: "Dakar & Saly",
    description: "Rencontrez nos dermatologues pour un examen approfondi (diagnostic, petite chirurgie, esthétique) dans nos cliniques partenaires.",
    image: "https://images.unsplash.com/photo-1665356203472-a839db7898c4?q=80&w=1200&auto=format&fit=crop",
    action: "Voir les créneaux",
    link: "#booking"
  },
  {
    id: 2,
    title: "Télé-Dermatologie",
    subtitle: "Diagnostic à distance",
    description: "Envoyez des photos de vos lésions via notre parcours guidé. Recevez un diagnostic et une ordonnance sous 48h, où que vous soyez.",
    image: "https://images.unsplash.com/photo-1681841902330-045551fadeab?q=80&w=1200&auto=format&fit=crop",
    action: "Démarrer un diagnostic",
    link: "#telederm"
  },
  {
    id: 3,
    title: "Peaux Noires & Métissées",
    subtitle: "Expertise spécifique",
    description: "Nos spécialistes maîtrisent les spécificités des peaux pigmentées : keloïdes, taches, dépigmentation, acné...",
    image: "https://images.unsplash.com/photo-1651848894662-5245755aea8e?q=80&w=1200&auto=format&fit=crop",
    action: "En savoir plus",
    link: "#knowledge"
  }
];

export function GuidedEntry() {
  const [activeId, setActiveId] = useState<number>(2); // Default center active

  return (
    <section className="relative py-24 px-4 md:px-8 max-w-[1600px] mx-auto min-h-[800px] flex flex-col justify-center bg-[#FEF0D5]">
      <AnimatedSection className="mb-12 md:mb-16 flex flex-col md:flex-row items-end justify-between gap-6 px-4">
        <div>
          <span className="text-[#5B1112] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
            Votre Parcours
          </span>
          <h2 className="text-4xl md:text-6xl text-[#111214] leading-[0.95] tracking-tight font-semibold">
            Votre peau,<br />
            <span className="italic text-[#111214]/40">votre chemin.</span>
          </h2>
        </div>
        <p className="max-w-sm text-[#111214]/60 text-sm md:text-base leading-relaxed text-right md:text-left">
          Besoin d'un avis rapide ou d'un suivi complet ? Melanis s'adapte à votre rythme et vous connecte aux meilleurs experts d'Afrique de l'Ouest.
        </p>
      </AnimatedSection>

      <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[600px]">
        {cards.map((card) => (
          <Card 
            key={card.id} 
            card={card} 
            isActive={activeId === card.id}
            onClick={() => setActiveId(card.id)}
            onHover={() => setActiveId(card.id)}
          />
        ))}
      </div>
    </section>
  );
}

function Card({ 
  card, 
  isActive, 
  onClick,
  onHover
}: { 
  card: typeof cards[0], 
  isActive: boolean, 
  onClick: () => void,
  onHover: () => void
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      onMouseEnter={onHover}
      className={`relative rounded-[2rem] overflow-hidden cursor-pointer group transition-all duration-700 ease-[0.22,1,0.36,1] ${
        isActive ? 'md:flex-[3] flex-[3]' : 'md:flex-[1] flex-[1]'
      } h-[400px] md:h-full bg-black`}
    >
      {/* Background Image with Parallax-like scale */}
      <div className="absolute inset-0 bg-[#111214] overflow-hidden">
        <motion.img
          layoutId={`img-${card.id}`}
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-700"
          animate={{ scale: isActive ? 1.05 : 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-80' : 'opacity-60'}`} />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-between z-10">
        {/* Top: Number & Arrow */}
        <div className="flex justify-between items-start w-full">
          <span className="text-white/60 text-xs md:text-sm tracking-widest border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm bg-white/5 font-semibold">
            0{card.id}
          </span>
          <motion.div
            animate={{ rotate: isActive ? 45 : 0 }}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:bg-white group-hover:text-black transition-colors duration-300"
          >
            <ArrowUpRight size={20} />
          </motion.div>
        </div>

        {/* Bottom: Text Content */}
        <div className="relative w-full">
          <motion.h3 
            layout="position"
            className={`font-semibold text-2xl md:text-4xl text-white mb-2 leading-tight origin-left whitespace-nowrap md:whitespace-normal ${!isActive ? 'truncate' : ''}`}
          >
            {card.title}
          </motion.h3>
          
          <motion.p 
            layout="position"
            className="text-white/70 text-xs md:text-sm font-medium tracking-wide uppercase mb-4 md:mb-6"
          >
            {card.subtitle}
          </motion.p>

          <div className="overflow-hidden">
             <motion.div
              initial={false}
              animate={{ 
                height: isActive ? 'auto' : 0,
                opacity: isActive ? 1 : 0
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-lg mb-6 md:mb-8 line-clamp-3 md:line-clamp-none">
                {card.description}
              </p>
              
              <div className="flex items-center gap-3 text-white group/link">
                <span className="font-medium tracking-wide border-b border-white/30 pb-1 group-hover/link:border-white transition-colors duration-300">
                  {card.action}
                </span>
                <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform duration-300" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
