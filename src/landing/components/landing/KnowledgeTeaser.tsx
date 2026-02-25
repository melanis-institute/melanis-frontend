import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function KnowledgeTeaser() {
  const articles = [
    { 
      title: "L'acné : Comprendre et suivre", 
      desc: "Analyse des mécanismes inflammatoires et protocoles d'hygiène.",
      cat: "Pathologie"
    },
    { 
      title: "Taches & Hyperpigmentation", 
      desc: "Identifier les différents types de mélanogénèse.",
      cat: "Science"
    },
    { 
      title: "Eczéma : L'école de l'atopie", 
      desc: "Programme d'éducation thérapeutique pour les familles.",
      cat: "Éducation"
    }
  ];

  return (
    <section className="bg-[#F9FAFB] py-24 px-6 md:px-12 border-b border-[#111214]/5">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl text-[#111214] mb-4 font-semibold">
            Comprendre, pas juste traiter.
          </h2>
          <p className="text-[#111214]/60 max-w-lg mx-auto leading-relaxed">
            Notre base de connaissance validée par des dermatologues pour vous aider à mieux gérer votre santé cutanée au quotidien.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 w-full">
          {articles.map((article, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-white rounded-2xl overflow-hidden border border-[#111214]/5 hover:shadow-lg transition-all duration-300 relative aspect-[4/3] flex flex-col justify-end p-8"
            >
              <div className="absolute inset-0 bg-[#FEF0D5]/10 group-hover:bg-[#FEF0D5]/20 transition-colors duration-500" />
              <div className="relative z-10">
                <span className="inline-block px-3 py-1 bg-[#5B1112]/10 text-[#5B1112] text-[10px] font-semibold rounded-full uppercase tracking-wider mb-4">
                  {article.cat}
                </span>
                <h3 className="text-xl font-semibold text-[#111214] mb-3 group-hover:text-[#5B1112] transition-colors duration-300">
                  {article.title}
                </h3>
                <p className="text-[#111214]/60 text-sm leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0 absolute bottom-8 left-8 right-8">
                  {article.desc}
                </p>
                <div className="w-8 h-8 rounded-full border border-[#111214]/10 flex items-center justify-center text-[#111214]/40 group-hover:bg-[#5B1112] group-hover:border-[#5B1112] group-hover:text-white transition-all duration-300 ml-auto">
                  <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="flex items-center gap-2 text-[#5B1112] font-medium border-b border-[#5B1112]/20 hover:border-[#5B1112] pb-1 transition-all duration-300">
          Explorer le centre de savoir <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
