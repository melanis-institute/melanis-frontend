import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { FileText, ScanFace, BrainCircuit, Sparkles, LineChart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

const steps = [
  {
    id: "01",
    title: "L'Anamnèse",
    subtitle: "Racontez votre peau",
    desc: "Un questionnaire guidé sur vos antécédents, votre phototype et vos habitudes de soin spécifiques (karité, dépigmentation, etc.).",
    image: "https://images.unsplash.com/photo-1722262179160-f00dbb9dcddb?q=80&w=1200&auto=format&fit=crop",
    icon: FileText
  },
  {
    id: "02",
    title: "La Captation",
    subtitle: "Photos guidées",
    desc: "Prenez des photos nettes de vos zones concernées (visage, dos, mains) grâce à notre guide visuel adapté aux peaux foncées.",
    image: "https://images.unsplash.com/photo-1771510581541-58a40280d8c7?q=80&w=1200&auto=format&fit=crop",
    icon: ScanFace
  },
  {
    id: "03",
    title: "L'Analyse",
    subtitle: "Expertise locale",
    desc: "Un dermatologue certifié (basé au Sénégal ou en Afrique de l'Ouest) analyse votre dossier et pose un diagnostic médical.",
    image: "https://images.unsplash.com/photo-1633419798503-0b0c628f267c?q=80&w=1200&auto=format&fit=crop",
    icon: BrainCircuit
  },
  {
    id: "04",
    title: "Le Protocole",
    subtitle: "Ordonnance & Soins",
    desc: "Recevez votre ordonnance (médicaments disponibles en pharmacie locale) et une routine de soins adaptée à votre climat.",
    image: "https://images.unsplash.com/photo-1651848894662-5245755aea8e?q=80&w=1200&auto=format&fit=crop",
    icon: Sparkles
  },
  {
    id: "05",
    title: "Le Suivi",
    subtitle: "Évolution maîtrisée",
    desc: "Votre peau évolue. Nous ajustons le traitement si besoin via des check-ins réguliers, par SMS ou WhatsApp.",
    image: "https://images.unsplash.com/photo-1646457417455-77a66a9fcf34?q=80&w=1200&auto=format&fit=crop",
    icon: LineChart
  }
];

export function HowItWorks() {
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"]
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-85%"]);

  return (
    <section ref={targetRef} className="relative h-[400vh] bg-[#FEF0D5]">
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
        
        {/* Ambient Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] rounded-full bg-white/40 blur-[100px]" />
            <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-[#5B1112]/5 blur-[120px]" />
        </div>

        {/* Header Section - Fixed Top */}
        <div className="relative z-10 px-6 md:px-24 pt-20 md:pt-24 pb-8 shrink-0">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="max-w-4xl"
           >
              <span className="text-[#5B1112] text-xs font-semibold tracking-[0.2em] uppercase block mb-3">
                Le Protocole Melanis
              </span>
              <h2 className="text-4xl md:text-6xl text-[#111214] leading-[0.9] font-semibold">
                Votre consultation<br />en <span className="italic opacity-60">5 étapes simples.</span>
              </h2>
           </motion.div>
        </div>

        {/* Slider Section - Fills Remaining Space */}
        <div className="flex-1 w-full flex items-center relative z-10">
            <motion.div 
              style={{ x }}
              className="flex gap-6 md:gap-12 px-6 md:px-24 items-center h-[55vh] md:h-[60vh]"
            >
              {steps.map((step, i) => (
                <Card key={step.id} step={step} index={i} />
              ))}
              
              {/* Final CTA Card */}
              <div className="relative h-full w-[85vw] md:w-[25vw] shrink-0 flex flex-col items-center justify-center bg-[#5B1112] rounded-[2.5rem] p-10 text-center shadow-[0_20px_60px_rgba(91,17,18,0.3)] group overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                 <div className="relative z-10 flex flex-col items-center">
                    <h3 className="text-3xl md:text-4xl font-semibold mb-6 text-white leading-tight">
                        Prêt à transformer<br/>votre peau ?
                    </h3>
                    <Link
                      to="/patient-flow"
                      className="bg-white text-[#5B1112] px-8 py-4 rounded-full text-lg font-medium hover:bg-[#FEF0D5] transition-colors flex items-center gap-2 group cursor-pointer shadow-lg active:scale-95 duration-200"
                    >
                        Lancer mon diagnostic <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
              </div>
            </motion.div>
        </div>
        
        {/* Progress Bar - Bottom */}
        <div className="absolute bottom-10 left-6 md:left-24 right-6 md:right-24 h-[2px] bg-[#111214]/10 rounded-full overflow-hidden z-20">
            <motion.div 
                style={{ scaleX: scrollYProgress }}
                className="h-full bg-[#5B1112] origin-left"
            />
        </div>
        
        {/* Scroll Hint */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-14 right-6 md:right-24 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#111214]/40 hidden md:block rotate-90 origin-right translate-x-full z-20"
        >
            Défiler pour découvrir
        </motion.div>
      </div>
    </section>
  );
}

function Card({ step, index }: { step: typeof steps[0], index: number }) {
  return (
    <motion.div 
        className="relative h-full w-[85vw] md:w-[60vw] lg:w-[45vw] shrink-0 flex flex-col md:flex-row bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] group border border-[#111214]/5 select-none"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      
      {/* Visual Side */}
      <div className="relative h-[45%] md:h-full md:w-[45%] overflow-hidden bg-[#111214]">
        <img 
          src={step.image} 
          alt={step.title}
          className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden" />
        
        {/* Number Badge */}
        <div className="absolute top-6 left-6 w-12 h-12 md:w-14 md:h-14 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 shadow-lg z-10 group-hover:scale-110 transition-transform duration-300">
            <span className="font-semibold text-lg md:text-xl text-[#111214]">{step.id}</span>
        </div>
      </div>

      {/* Content Side */}
      <div className="relative h-[55%] md:h-full md:w-[55%] p-6 md:p-10 lg:p-12 flex flex-col justify-center bg-white">
        {/* Decorative Background Number */}
        <span className="absolute -right-4 -bottom-10 text-[120px] md:text-[180px] font-semibold text-[#FEF0D5]/60 pointer-events-none select-none leading-none opacity-0 group-hover:opacity-50 transition-opacity duration-700 delay-100">
            {step.id}
        </span>

        <div className="w-12 h-12 md:w-14 md:h-14 bg-[#FEF0D5] rounded-2xl flex items-center justify-center text-[#5B1112] mb-4 md:mb-8 group-hover:rotate-12 transition-transform duration-500 shadow-sm">
           <step.icon size={24} strokeWidth={1.5} />
        </div>
        
        <h3 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#111214] mb-2 relative z-10 group-hover:text-[#5B1112] transition-colors duration-300">
          {step.title}
        </h3>
        <span className="text-[#5B1112] text-[10px] md:text-xs font-semibold tracking-[0.2em] uppercase mb-4 md:mb-6 block opacity-80 relative z-10">
            {step.subtitle}
        </span>
        
        <p className="text-[#111214]/60 text-sm md:text-base lg:text-lg leading-relaxed relative z-10 line-clamp-3 md:line-clamp-none">
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
}
