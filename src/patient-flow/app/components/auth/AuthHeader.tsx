import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Menu, X } from "lucide-react";

const navItems = [
  { label: "Accueil", to: "/" },
  { label: "Parcours", to: "/patient-flow" },
];

export function AuthHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-5"
    >
      <div className="w-full max-w-6xl bg-[#FEF0D5]/70 backdrop-blur-xl rounded-full px-6 py-3 flex items-center justify-between border border-[#111214]/25 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-semibold tracking-tight text-[#5B1112]">
            melanis
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-sm font-medium text-[#111214]/80 hover:text-[#5B1112] transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/patient-flow"
            className="text-sm font-medium text-[#00415E] hover:text-[#00415E]/80 transition-colors"
          >
            Télé-derm
          </Link>
          <Link
            to="/"
            className="bg-[#5B1112] hover:bg-[#4a0e0f] text-white px-6 py-2.5 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            Quitter
          </Link>
        </div>

        <button
          className="lg:hidden p-2 text-[#111214]"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-24 left-5 right-5 bg-[#FEF0D5] rounded-2xl p-6 shadow-xl border border-[#111214]/10 lg:hidden flex flex-col gap-4"
        >
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="text-base font-medium text-[#111214] py-2 border-b border-[#111214]/10 last:border-0"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/patient-flow"
              className="w-full text-[#00415E] font-medium py-2 text-center"
              onClick={() => setIsOpen(false)}
            >
              Télé-derm
            </Link>
            <Link
              to="/"
              className="w-full bg-[#5B1112] text-white py-3 rounded-xl font-medium shadow-sm text-center"
              onClick={() => setIsOpen(false)}
            >
              Quitter
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
