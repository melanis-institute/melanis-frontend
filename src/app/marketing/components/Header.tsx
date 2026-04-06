import { Menu, X } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    if (isOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
    }

    return () => {
      html.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, [isOpen]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6"
    >
      <div className="w-full max-w-6xl bg-[#FEF0D5]/70 backdrop-blur-xl rounded-full px-6 py-3 flex items-center justify-between border border-[#111214]/25 shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-2xl font-semibold tracking-tight text-[#5B1112]">
            melanis
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {[
            "Services",
            "Télé-derm",
            "Annuaire praticiens",
            "Centre de savoir",
            "FAQ",
            "Contact",
          ].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-[#111214]/80 hover:text-[#5B1112] transition-colors duration-300"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/patient-flow"
            className="bg-[#5B1112] hover:bg-[#4a0e0f] text-white px-6 py-2.5 rounded-full text-[13px] font-medium tracking-wide transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            Prendre RDV
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 text-[#111214]"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-24 left-6 right-6 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain bg-[#FEF0D5] rounded-2xl p-6 shadow-xl border border-[#111214]/10 lg:hidden flex flex-col gap-4"
        >
          {[
            "Services",
            "Télé-derm",
            "Annuaire praticiens",
            "Centre de savoir",
            "FAQ",
            "Contact",
          ].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-base font-medium text-[#111214] py-2 border-b border-[#111214]/10 last:border-0"
              onClick={() => setIsOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="flex flex-col gap-3 mt-4">
            <Link
              to="/patient-flow"
              className="w-full bg-[#5B1112] text-white py-3 rounded-xl font-medium shadow-sm text-center"
              onClick={() => setIsOpen(false)}
            >
              Prendre RDV
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
