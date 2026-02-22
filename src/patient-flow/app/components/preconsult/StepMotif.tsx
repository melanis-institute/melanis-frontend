import { motion, AnimatePresence } from "motion/react";
import {
  MoreHorizontal,
} from "lucide-react";
import Acne from "../../../imports/Acne";
import Taches from "../../../imports/Taches";
import Eczema from "../../../imports/Eczema";
import Rougeurs from "../../../imports/Rougeurs";
import ChuteDeCheveux from "../../../imports/ChuteDeCheveux";
import Infection from "../../../imports/Infection";
import GrainsDeBeaute from "../../../imports/GrainsDeBeaute";
import { MOTIFS } from "./types";

const ICONS: Record<string, React.ReactNode> = {
  acne: <div className="w-[28px] h-[28px]"><Acne /></div>,
  taches: <div className="w-[28px] h-[28px]"><Taches /></div>,
  eczema: <div className="w-[28px] h-[28px]"><Eczema /></div>,
  rougeurs: <div className="w-[28px] h-[28px]"><Rougeurs /></div>,
  cheveux: <div className="w-[28px] h-[28px]"><ChuteDeCheveux /></div>,
  mycose: <div className="w-[28px] h-[28px]"><Infection /></div>,
  grain: <div className="w-[28px] h-[28px]"><GrainsDeBeaute /></div>,
  autre: <MoreHorizontal className="w-[28px] h-[28px]" strokeWidth={1.5} />,
};

interface StepMotifProps {
  selected: string | null;
  autreText: string;
  onSelect: (key: string) => void;
  onAutreChange: (text: string) => void;
}

export function StepMotif({
  selected,
  autreText,
  onSelect,
  onAutreChange,
}: StepMotifProps) {
  return (
    <div className="space-y-3">
      {MOTIFS.map((m, i) => (
        <motion.div
          key={m.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.04, ease: "easeOut" }}
        >
          <button
            onClick={() => onSelect(m.key)}
            className={`w-full flex items-center gap-4 rounded-[20px] text-left transition-all duration-200 cursor-pointer ${ selected === m.key ? "bg-white ring-[1.5px] ring-[#5B1112]/20" : "bg-white hover:bg-[#FFFDF8] hover:shadow-md" } px-[16px] py-[28px]`}
            style={{
              boxShadow:
                selected === m.key
                  ? "0 2px 8px rgba(91,17,18,0.08), 0 1px 3px rgba(17,18,20,0.04)"
                  : "0 1px 3px rgba(17,18,20,0.04), 0 2px 6px rgba(17,18,20,0.02)",
              minHeight: 64,
            }}
          >
            <div
              className={`flex-shrink-0 transition-colors duration-200`}
              style={{
                "--fill-0": selected === m.key ? "#5B1112" : "rgba(17,18,20,0.45)",
                "--stroke-0": selected === m.key ? "#5B1112" : "rgba(17,18,20,0.45)",
              } as React.CSSProperties}
            >
              {ICONS[m.icon]}
            </div>
            <span
              className={`flex-1 text-[17px] leading-[1.3] transition-colors duration-200 ${
                selected === m.key
                  ? "text-[#5B1112]"
                  : "text-[#111214]/80"
              }`}
              style={{ fontWeight: selected === m.key ? 600 : 500 }}
            >
              {m.label}
            </span>
            {selected === m.key && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-shrink-0 w-[20px] h-[20px] rounded-full bg-[#5B1112] flex items-center justify-center"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            )}
          </button>
        </motion.div>
      ))}

      {/* "Autre" text field */}
      <AnimatePresence>
        {selected === "autre" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-1">
              <input
                type="text"
                value={autreText}
                onChange={(e) =>
                  onAutreChange(e.target.value.slice(0, 140))
                }
                placeholder="Décrivez brièvement votre motif..."
                maxLength={140}
                className="
                  w-full px-4 py-3.5 rounded-[16px] text-[14px]
                  bg-white border border-[rgba(17,18,20,0.08)]
                  text-[#111214] placeholder:text-[rgba(17,18,20,0.3)]
                  outline-none focus:ring-[1.5px] focus:ring-[#5B1112]/20
                  focus:border-[#5B1112]/20 transition-all duration-200
                "
                style={{ minHeight: 48 }}
                autoFocus
              />
              <p className="text-right text-[11px] text-[rgba(17,18,20,0.25)] mt-1.5 pr-1">
                {autreText.length}/140
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}