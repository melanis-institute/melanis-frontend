import { motion } from 'motion/react';
import { ArrowUpRight, Instagram, Linkedin, Twitter, Mail, Facebook } from 'lucide-react';

export function Footer() {
  const links = [
    { title: "Annuaire praticiens", href: "#" },
    { title: "Centre de savoir", href: "#" },
    { title: "Événements", href: "#" },
    { title: "Contact", href: "#" },
    { title: "Mentions légales", href: "#" },
    { title: "Confidentialité", href: "#" },
    { title: "Consentements", href: "#" },
  ];

  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
    { name: "Facebook", icon: Facebook, href: "#" }
  ];

  return (
    <footer className="bg-[#FEF0D5] relative overflow-hidden pt-20 border-t border-[#111214]/5">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-12">
                <div className="max-w-xl">
                    <span className="text-5xl md:text-8xl font-semibold tracking-tight text-[#5B1112] block mb-6">
                        melanis
                    </span>
                    <p className="text-[#111214]/60 text-lg md:text-xl leading-relaxed max-w-sm">
                        La santé de la peau pour tous.<br/>
                        <span className="italic opacity-60">Au Sénégal et en Afrique de l'Ouest.</span>
                    </p>
                </div>
                
                <div className="flex flex-col items-start md:items-end gap-6">
                    <div className="flex gap-4">
                        {socialLinks.map((social) => (
                            <a 
                                key={social.name} 
                                href={social.href}
                                className="w-12 h-12 rounded-full border border-[#111214]/10 flex items-center justify-center hover:bg-[#5B1112] hover:text-white hover:border-transparent transition-all duration-300 group"
                            >
                                <social.icon size={20} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                            </a>
                        ))}
                    </div>
                    <a href="mailto:bonjour@melanis.sn" className="text-2xl md:text-3xl text-[#111214] hover:text-[#5B1112] transition-colors border-b border-[#111214]/10 pb-1 font-semibold">
                        bonjour@melanis.sn
                    </a>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 border-t border-[#111214]/10 py-12">
                <div>
                    <h4 className="font-semibold text-[#111214] mb-6 uppercase tracking-widest text-xs">Navigation</h4>
                    <ul className="space-y-3">
                        {['Accueil', 'Services', 'Practiciens', 'Blog'].map((item) => (
                            <li key={item}>
                                <a href="#" className="text-[#111214]/60 hover:text-[#5B1112] transition-colors text-sm font-medium block hover:translate-x-1 duration-300">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div>
                     <h4 className="font-semibold text-[#111214] mb-6 uppercase tracking-widest text-xs">Légal</h4>
                    <ul className="space-y-3">
                        {['Conditions Générales', 'Politique de Confidentialité', 'Mentions Légales', 'Cookies'].map((item) => (
                            <li key={item}>
                                <a href="#" className="text-[#111214]/60 hover:text-[#5B1112] transition-colors text-sm font-medium block hover:translate-x-1 duration-300">
                                    {item}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="col-span-2 md:col-span-2 bg-white rounded-2xl p-8 border border-[#111214]/5">
                    <h4 className="text-2xl text-[#111214] mb-4 font-semibold">Newsletter</h4>
                    <p className="text-[#111214]/50 text-sm mb-6">Recevez nos derniers conseils pour prendre soin de votre peau au quotidien.</p>
                    <form className="flex gap-2">
                        <input 
                            type="email" 
                            placeholder="Votre email" 
                            className="flex-1 bg-[#F9FAFB] border border-[#111214]/10 rounded-full px-6 py-3 text-sm focus:outline-none focus:border-[#5B1112]/30 transition-colors"
                        />
                        <button className="bg-[#111214] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#5B1112] transition-colors">
                            S'inscrire
                        </button>
                    </form>
                </div>
            </div>

            <div className="py-8 border-t border-[#111214]/5 flex flex-col md:flex-row justify-between items-center text-[#111214]/30 text-xs font-medium uppercase tracking-widest gap-4">
                <span>© 2026 Melanis Santé. Tous droits réservés.</span>
                <span className="flex items-center gap-6">
                    <span>Dakar</span>
                    <span>Abidjan</span>
                    <span>Bamako</span>
                </span>
            </div>
        </div>
    </footer>
  );
}
