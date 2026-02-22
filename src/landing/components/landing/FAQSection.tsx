import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ChevronDown, Plus, Minus, HelpCircle } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: "Quels sont les moyens de paiement acceptés ?", a: "Nous acceptons les paiements via Orange Money, Wave et carte bancaire. Le paiement est sécurisé et s'effectue avant la validation de votre demande de télé-derm ou la prise de RDV." },
    { q: "Est-ce que l'IA remplace le dermatologue ?", a: "Non, jamais. L'IA aide à trier les photos et pré-remplir votre dossier, mais le diagnostic final et l'ordonnance sont toujours établis par un dermatologue diplômé inscrit à l'Ordre." },
    { q: "Puis-je consulter pour mon enfant ?", a: "Oui, le mode 'Famille' vous permet de créer des profils pour vos enfants ou parents âgés et de gérer leurs consultations depuis votre compte principal." },
    { q: "Les dermatologues sont-ils basés au Sénégal ?", a: "Oui, la majorité de nos praticiens exercent au Sénégal (Dakar, Saly, Thiès) et en Afrique de l'Ouest. Ils connaissent parfaitement les spécificités des peaux noires et métissées." },
    { q: "Comment se passe la télé-dermatologie ?", a: "C'est simple : vous répondez à un questionnaire médical et envoyez des photos de votre problème de peau. Un dermatologue analyse votre dossier et vous envoie un compte-rendu et une ordonnance sous 48h." },
    { q: "Mes données médicales sont-elles protégées ?", a: "Absolument. Vos données sont chiffrées et hébergées sur des serveurs certifiés HDS (Hébergement de Données de Santé), en conformité avec la réglementation sur la protection des données personnelles." }
  ];

  return (
    <section className="bg-[#FEF0D5] py-32 px-4 md:px-8 overflow-hidden relative">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/40 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-20">
          <span className="text-[#5B1112] text-xs font-semibold tracking-[0.2em] uppercase mb-4 block">
             Support & Aide
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-[#111214] mb-4 leading-tight">
            Questions fréquentes
          </h2>
          <p className="text-[#111214]/50 text-lg max-w-lg mx-auto">
             Tout ce que vous devez savoir pour commencer votre parcours de soin en toute sérénité.
          </p>
        </AnimatedSection>

        <div className="space-y-4">
          {faqs.map((item, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group border-b border-[#111214]/10 last:border-0"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full py-8 flex items-center justify-between text-left group-hover:pl-4 transition-all duration-300"
              >
                <span className={`text-xl md:text-2xl font-semibold transition-colors duration-300 ${openIndex === idx ? 'text-[#5B1112]' : 'text-[#111214] group-hover:text-[#5B1112]'}`}>
                  {item.q}
                </span>
                <span className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === idx ? 'bg-[#5B1112] text-white rotate-180' : 'bg-white text-[#111214]/40 group-hover:text-[#5B1112]'}`}>
                  <ChevronDown size={20} />
                </span>
              </button>
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                  >
                    <div className="pb-8 pl-4 pr-12">
                         <div className="w-1 h-full absolute left-0 top-0 bg-[#5B1112]/20" />
                         <p className="text-[#111214]/70 text-lg leading-relaxed">
                            {item.a}
                         </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
            <p className="text-[#111214]/50 mb-6 font-medium">Vous ne trouvez pas votre réponse ?</p>
            <button className="bg-white px-8 py-3 rounded-full text-[#111214] font-medium border border-[#111214]/10 hover:border-[#5B1112] hover:text-[#5B1112] transition-colors shadow-sm inline-flex items-center gap-2 group">
                <HelpCircle size={18} /> Contacter le support <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
        </div>
      </div>
    </section>
  );
}
