import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import { Calendar, FileText, CheckCircle, Sun, CloudRain, ShieldCheck, ArrowRight } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function ProductPreviews() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <section ref={containerRef} className="bg-white py-32 px-4 md:px-8 overflow-hidden">
      <div className="max-w-[1400px] mx-auto space-y-32">
        
        {/* Feature 1: The Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center group">
          <motion.div 
            style={{ y }}
            className="order-2 lg:order-1 relative bg-[#F9FAFB] rounded-[3rem] p-8 md:p-12 border border-[#111214]/5 overflow-hidden h-[500px] md:h-[600px] flex flex-col justify-center shadow-2xl shadow-gray-100"
          >
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FEF0D5] rounded-full blur-[100px] opacity-60 translate-x-1/3 -translate-y-1/3" />

            <div className="relative z-10 space-y-6">
                {/* Card 1 */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl border border-[#111214]/5 shadow-xl w-full max-w-md ml-auto hover:scale-105 transition-transform duration-300"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#5B1112]/5 flex items-center justify-center text-[#5B1112]">
                                <Calendar size={18} />
                            </div>
                            <div>
                                <h4 className="font-medium text-[#111214]">Consultation Dr. Aminata Sow</h4>
                                <span className="text-xs text-[#111214]/40">Mardi 12 Oct • 14:30</span>
                            </div>
                        </div>
                        <span className="bg-[#5B1112] text-white text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider">
                            Confirmé
                        </span>
                    </div>
                    <div className="h-2 w-full bg-[#F3F4F6] rounded-full mb-2" />
                    <div className="h-2 w-2/3 bg-[#F3F4F6] rounded-full" />
                </motion.div>

                {/* Card 2 */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="bg-white p-6 rounded-3xl border border-[#111214]/5 shadow-xl w-full max-w-md hover:scale-105 transition-transform duration-300 relative z-20"
                >
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00415E]/5 flex items-center justify-center text-[#00415E]">
                                <FileText size={18} />
                            </div>
                            <div>
                                <h4 className="font-medium text-[#111214]">Ordonnance #DK-4291</h4>
                                <span className="text-xs text-[#111214]/40">Disponible en pharmacie</span>
                            </div>
                        </div>
                         <div className="w-8 h-8 rounded-full border border-[#111214]/10 flex items-center justify-center cursor-pointer hover:bg-[#111214] hover:text-white transition-colors">
                            <ArrowRight size={14} />
                         </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-[#111214]/60 bg-[#F9FAFB] p-2 rounded-lg">
                            <CheckCircle size={12} className="text-green-500" /> 1x Crème Anti-taches
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#111214]/60 bg-[#F9FAFB] p-2 rounded-lg">
                            <CheckCircle size={12} className="text-green-500" /> 1x Écran Solaire Minéral
                        </div>
                    </div>
                </motion.div>
            </div>
          </motion.div>

          <div className="order-1 lg:order-2">
            <AnimatedSection>
                <span className="text-[#5B1112] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
                    Continuité
                </span>
                <h3 className="text-4xl md:text-5xl font-semibold text-[#111214] mb-6 leading-[1.1]">
                    Un dossier patient<br />
                    <span className="italic text-[#111214]/40">complet et mobile.</span>
                </h3>
                <p className="text-[#111214]/60 text-lg leading-relaxed mb-8">
                    Centralisez l'historique de votre peau : consultations, ordonnances, et évolution de vos traitements. Un outil indispensable pour un suivi efficace.
                </p>
                
                <ul className="space-y-4">
                    {['Accessible sur mobile 24/7', 'Partage sécurisé avec votre médecin', 'Historique des lésions'].map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#111214]/80 font-medium">
                            <div className="w-6 h-6 rounded-full bg-[#5B1112]/10 flex items-center justify-center text-[#5B1112]">
                                <CheckCircle size={14} />
                            </div>
                            {item}
                        </li>
                    ))}
                </ul>
            </AnimatedSection>
          </div>
        </div>

        {/* Feature 2: Prevention */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="order-1">
                 <AnimatedSection>
                    <span className="text-[#00415E] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
                        Prévention Contextuelle
                    </span>
                    <h3 className="text-4xl md:text-5xl font-semibold text-[#111214] mb-6 leading-[1.1]">
                        Votre peau vit<br />
                        <span className="italic text-[#111214]/40">sous ce climat.</span>
                    </h3>
                    <p className="text-[#111214]/60 text-lg leading-relaxed mb-8">
                        L'environnement ouest-africain impacte votre peau. Melanis vous alerte en fonction de l'indice UV, de l'harmattan ou de la chaleur pour adapter votre routine.
                    </p>
                    <button className="text-[#111214] font-medium border-b border-[#111214]/20 pb-1 hover:border-[#111214] transition-colors flex items-center gap-2 group">
                        Voir les conseils saisonniers <ArrowRight className="group-hover:translate-x-1 transition-transform" size={16} />
                    </button>
                </AnimatedSection>
            </div>

            <motion.div 
                style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]) }}
                className="order-2 relative bg-[#111214] rounded-[3rem] p-8 md:p-12 overflow-hidden h-[500px] md:h-[600px] flex items-center justify-center shadow-2xl"
            >
                {/* Dark Gradient BG */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#111214] to-[#2A2B2E]" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00415E] rounded-full blur-[80px] opacity-40" />

                <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col justify-between aspect-square"
                    >
                        <div className="flex justify-between items-start">
                            <Sun size={28} className="text-[#EAB308]" />
                            <span className="text-[10px] font-semibold bg-[#EAB308]/20 text-[#EAB308] px-2 py-1 rounded-full border border-[#EAB308]/20">EXTRÊME</span>
                        </div>
                        <div>
                            <div className="text-4xl font-medium text-white mb-1">11<span className="text-lg text-white/40 font-normal">/12</span></div>
                            <div className="text-xs text-white/60 uppercase tracking-widest">Index UV Dakar</div>
                        </div>
                    </motion.div>

                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 flex flex-col justify-between aspect-square mt-8"
                    >
                        <div className="flex justify-between items-start">
                             <CloudRain size={28} className="text-[#00415E] text-blue-300" />
                             <span className="text-[10px] font-semibold bg-red-500/20 text-red-300 px-2 py-1 rounded-full border border-red-500/20">Sec</span>
                        </div>
                        <div>
                            <div className="text-lg font-medium text-white leading-tight mb-1">Alerte<br/>Poussière</div>
                             <div className="text-xs text-white/60 uppercase tracking-widest">Harmattan</div>
                        </div>
                    </motion.div>

                    <motion.div 
                         initial={{ scale: 0.9, opacity: 0 }}
                         whileInView={{ scale: 1, opacity: 1 }}
                         transition={{ delay: 0.5 }}
                         className="col-span-2 bg-gradient-to-r from-[#5B1112] to-[#80181A] p-4 rounded-2xl flex items-center gap-4 border border-white/10 shadow-lg"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="text-white" size={20} />
                        </div>
                        <p className="text-white text-sm font-medium leading-tight">
                            Conseil: Renforcez l'hydratation ce soir. L'air est très sec.
                        </p>
                    </motion.div>
                </div>
            </motion.div>
        </div>

      </div>
    </section>
  );
}
