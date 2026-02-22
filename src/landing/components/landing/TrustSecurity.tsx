import { motion } from 'motion/react';
import { ShieldCheck, Lock, Fingerprint, FileSearch, Database, Server, EyeOff, Key } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function TrustSecurity() {
  const items = [
    { text: "Consentements granulaires", icon: ShieldCheck, desc: "Vous décidez qui voit quoi, quand." },
    { text: "Chiffrement HDS", icon: Lock, desc: "Hébergement Données de Santé certifié." },
    { text: "Ségrégation des données", icon: Database, desc: "Identité et dossier médical séparés." },
    { text: "Audit trail complet", icon: FileSearch, desc: "Traçabilité de chaque accès." },
  ];

  return (
    <section className="bg-[#111214] py-32 px-4 md:px-8 overflow-hidden relative">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-20" />
         <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20" />
         <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-white to-transparent opacity-20" />
      </div>
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-12 mb-20">
             <AnimatedSection>
                <span className="text-[#FEF0D5] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block opacity-60">
                    Confiance & Sécurité
                </span>
                <h2 className="text-4xl md:text-5xl font-semibold text-white leading-tight">
                    Vos données,<br />
                    <span className="italic text-white/40">votre propriété.</span>
                </h2>
            </AnimatedSection>
            
            <motion.p 
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.6 }}
                className="text-white text-sm md:text-base max-w-md text-right md:text-left leading-relaxed border-l border-white/20 pl-6"
            >
                Nous appliquons les standards de sécurité bancaire à vos données médicales. 
                Aucun compromis sur la confidentialité.
            </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="group bg-white/5 backdrop-blur-sm border border-white/5 rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 hover:border-white/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-2 h-2 rounded-full bg-[#FEF0D5] animate-pulse" />
              </div>
              
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-[#FEF0D5] mb-6 group-hover:scale-110 group-hover:bg-[#FEF0D5] group-hover:text-[#111214] transition-all duration-300 shadow-lg">
                <item.icon size={24} strokeWidth={1.5} />
              </div>
              
              <h3 className="font-medium text-lg text-white mb-2">{item.text}</h3>
              <p className="text-white/40 text-sm leading-relaxed group-hover:text-white/60 transition-colors">
                  {item.desc}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Security Badge Strip */}
        <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-16 opacity-30 grayscale hover:grayscale-0 hover:opacity-60 transition-all duration-700">
            {/* Mock logos for HIPAA, GDPR, HDS */}
            <span className="text-white font-semibold text-xl flex items-center gap-2"><Server size={18}/> HDS CERTIFIED</span>
            <span className="text-white font-semibold text-xl flex items-center gap-2"><Key size={18}/> GDPR COMPLIANT</span>
            <span className="text-white font-semibold text-xl flex items-center gap-2"><EyeOff size={18}/> E2E ENCRYPTED</span>
        </div>
      </div>
    </section>
  );
}
