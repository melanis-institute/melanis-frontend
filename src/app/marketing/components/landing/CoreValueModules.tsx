import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  Users, Activity, Lock, Stethoscope, 
  ShieldCheck, Mail, Calendar, 
  Sun, ArrowRight, Smartphone
} from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function CoreValueModules() {
  const [activeTab, setActiveTab] = useState<'patients' | 'praticiens'>('patients');

  return (
    <section className="py-32 px-4 md:px-8 max-w-[1400px] mx-auto">
      <AnimatedSection className="mb-20 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-semibold text-[#111214] mb-8 leading-tight">
          Une plateforme,<br />
          <span className="italic text-[#111214]/40">deux perspectives.</span>
        </h2>

        {/* Custom Toggle Switch */}
        <div className="relative inline-flex bg-[#111214]/5 p-2 rounded-full backdrop-blur-sm border border-[#111214]/5">
            <motion.div 
                layoutId="active-pill"
                className="absolute inset-2 bg-white rounded-full shadow-sm z-0"
                style={{ 
                    width: 'calc(50% - 8px)',
                    left: activeTab === 'patients' ? '8px' : '50%' 
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            <button
                onClick={() => setActiveTab('patients')}
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors duration-300 ${
                    activeTab === 'patients' ? 'text-[#5B1112]' : 'text-[#111214]/60 hover:text-[#111214]'
                }`}
            >
                Patients & Familles
            </button>
            <button
                onClick={() => setActiveTab('praticiens')}
                className={`relative z-10 px-8 py-3 rounded-full text-sm font-medium transition-colors duration-300 ${
                    activeTab === 'praticiens' ? 'text-[#5B1112]' : 'text-[#111214]/60 hover:text-[#111214]'
                }`}
            >
                Professionnels
            </button>
        </div>
      </AnimatedSection>

      <div className="relative min-h-[600px]">
          {activeTab === 'patients' ? <PatientGrid /> : <PractitionerGrid />}
      </div>
    </section>
  );
}

function PatientGrid() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6 h-auto md:h-[800px]"
        >
            {/* Main Feature - Large */}
            <div className="md:col-span-2 md:row-span-2 bg-[#FEF0D5] rounded-[2.5rem] p-10 flex flex-col justify-between group overflow-hidden relative border border-[#5B1112]/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                
                <div>
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#5B1112] mb-6 shadow-sm">
                        <Smartphone size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-semibold text-[#111214] mb-4">Votre dermatologue,<br/>dans votre poche.</h3>
                    <p className="text-[#111214]/70 leading-relaxed max-w-sm">
                        Consultez où que vous soyez au Sénégal. Envoyez vos photos, recevez un diagnostic sous 48h et payez via Orange Money ou Wave.
                    </p>
                </div>
                
                <div className="mt-8 relative h-64 w-full bg-white rounded-2xl shadow-lg p-4 overflow-hidden transform group-hover:scale-[1.02] transition-transform duration-500">
                    {/* Mock UI */}
                    <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100" />
                        <div>
                            <div className="h-2 w-24 bg-gray-200 rounded mb-1" />
                            <div className="h-2 w-16 bg-gray-100 rounded" />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <div className="h-16 w-full bg-blue-50/50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100" />
                            <div className="h-2 w-32 bg-blue-200/50 rounded" />
                         </div>
                         <div className="h-16 w-full bg-green-50/50 rounded-xl p-3 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100" />
                            <div className="h-2 w-32 bg-green-200/50 rounded" />
                         </div>
                    </div>
                </div>
            </div>

            {/* Top Right - Tall */}
            <div className="md:col-span-1 md:row-span-2 bg-white border border-[#111214]/10 rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-lg transition-shadow duration-300">
                <div className="w-12 h-12 bg-[#111214]/5 rounded-2xl flex items-center justify-center text-[#111214] mb-4">
                    <Calendar size={24} strokeWidth={1.5} />
                </div>
                <div>
                     <h3 className="text-xl font-medium text-[#111214] mb-2">Agenda intelligent</h3>
                     <p className="text-[#111214]/60 text-sm leading-relaxed mb-6">
                        Rappels de rendez-vous et de traitement par SMS et WhatsApp.
                     </p>
                     <div className="space-y-3">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3 text-xs text-[#111214]/50">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#5B1112]" />
                                <span>Rappel WhatsApp 08:00</span>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

             {/* Top Right Corner - Square */}
             <div className="md:col-span-1 md:row-span-1 bg-[#111214] rounded-[2.5rem] p-8 flex flex-col justify-center text-center text-white relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-[#5B1112]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <Sun size={32} className="mx-auto mb-4 text-[#FEF0D5]" />
                    <h3 className="font-medium text-lg">Indice UV</h3>
                    <p className="text-white/60 text-sm mt-2">Dakar: Fort (9)</p>
                </div>
            </div>

             {/* Middle Right - Square */}
             <div className="md:col-span-1 md:row-span-1 bg-white border border-[#111214]/10 rounded-[2.5rem] p-8 flex flex-col justify-center hover:border-[#5B1112]/30 transition-colors">
                <ShieldCheck size={32} className="text-[#5B1112] mb-4" />
                <h3 className="font-medium text-lg">Données chiffrées</h3>
                <p className="text-[#111214]/60 text-sm mt-2">Conforme aux standards de santé.</p>
            </div>


            {/* Bottom Row - Wide */}
            <div className="md:col-span-2 md:row-span-1 bg-white border border-[#111214]/10 rounded-[2.5rem] p-8 flex items-center justify-between group cursor-pointer hover:bg-[#FEF0D5]/10 transition-colors">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-[#111214]/5 rounded-2xl flex items-center justify-center text-[#111214]">
                        <Users size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h3 className="text-xl font-medium text-[#111214] mb-1">Mode Famille</h3>
                        <p className="text-[#111214]/60 text-sm">Gérez les profils de vos enfants ou parents âgés.</p>
                    </div>
                 </div>
                 <div className="w-10 h-10 rounded-full border border-[#111214]/10 flex items-center justify-center group-hover:bg-[#5B1112] group-hover:border-[#5B1112] group-hover:text-white transition-all">
                    <ArrowRight size={18} />
                 </div>
            </div>
            
            {/* Bottom Right - Wide */}
             <div className="md:col-span-2 md:row-span-1 bg-[url('https://images.unsplash.com/photo-1552693673-1bf958298935?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center rounded-[2.5rem] p-8 flex flex-col justify-end overflow-hidden group relative">
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                 <div className="relative z-10 text-white">
                    <h3 className="text-xl font-medium mb-1">Centre de savoir</h3>
                    <p className="text-white/70 text-sm flex items-center gap-2 group-hover:gap-4 transition-all">
                        Lire : L'hydratation sous l'harmattan <ArrowRight size={14} />
                    </p>
                 </div>
            </div>
        </motion.div>
    );
}

function PractitionerGrid() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[600px]"
        >
             {/* Large Left Card */}
             <div className="md:col-span-1 bg-[#111214] rounded-[2.5rem] p-10 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(91,17,18,0.4),transparent_60%)]" />
                
                <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center text-white mb-8 border border-white/10">
                        <Activity size={28} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-3xl font-semibold mb-4">Suite Clinique<br/>Pro</h3>
                    <p className="text-white/60 leading-relaxed">
                        Optimisez votre pratique libérale à Dakar ou en région avec nos outils de gestion patientèle.
                    </p>
                </div>
                
                <button className="relative z-10 mt-8 w-full py-4 bg-white text-[#111214] rounded-xl font-medium hover:bg-[#FEF0D5] transition-colors">
                    Rejoindre le réseau
                </button>
             </div>

             {/* Right Column */}
             <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#FEF0D5] rounded-[2.5rem] p-8 flex flex-col justify-center min-h-[240px]">
                    <Mail size={32} className="text-[#5B1112] mb-4" />
                    <h3 className="text-xl font-medium text-[#111214] mb-2">Inbox prioritaire</h3>
                    <p className="text-[#111214]/70 text-sm">Centralisez vos demandes de télé-derm et gérez les urgences.</p>
                </div>

                <div className="bg-white border border-[#111214]/10 rounded-[2.5rem] p-8 flex flex-col justify-center min-h-[240px] hover:border-[#5B1112]/30 transition-colors">
                    <Stethoscope size={32} className="text-[#111214] mb-4" />
                    <h3 className="text-xl font-medium text-[#111214] mb-2">Télé-Expertise</h3>
                    <p className="text-[#111214]/70 text-sm">Collaborez avec vos confrères sur des cas complexes.</p>
                </div>

                <div className="md:col-span-2 bg-white border border-[#111214]/10 rounded-[2.5rem] p-8 flex items-center justify-between">
                     <div>
                        <h3 className="text-xl font-medium text-[#111214] mb-1">Sécurité & Confidentialité</h3>
                        <p className="text-[#111214]/70 text-sm">Données hébergées en conformité avec les régulations locales.</p>
                     </div>
                     <Lock size={24} className="text-[#00415E]" />
                </div>
             </div>
        </motion.div>
    );
}
