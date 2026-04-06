import { useState, useEffect, useMemo, useRef, useCallback, type ComponentType, type SVGProps, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  History,
  Stethoscope,
  FlaskConical,
  ShieldAlert,
  PenLine,
  ChevronDown,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import {
  IconRecurrence,
  IconPremiereFois,
  IconConsultation,
  IconPasConsulte,
  IconCreme,
  IconCorticoides,
  IconAntibiotiques,
  IconAntifongiques,
  IconNaturel,
  IconComplements,
  IconAllergies,
  IconMedicaments,
  IconGrossesse,
  IconNonConcerne,
  IconCheck,
  IconCross,
} from "./historique-icons";
import { TRAITEMENTS_CHIPS } from "./types";
import type { PreConsultData } from "./types";

// ——— Custom icon type ———
type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ——— Treatment icon mapping ———
const TRAITEMENT_ICONS: Record<string, SvgIcon> = {
  "Crème hydratante": IconCreme,
  "Corticoïdes": IconCorticoides,
  "Antibiotiques": IconAntibiotiques,
  "Antifongiques": IconAntifongiques,
  "Produits naturels": IconNaturel,
  "Compléments": IconComplements,
};

// ——— Smart contextual tips ———
function getSmartTip(data: PreConsultData): string | null {
  if (data.allergies === true && data.medicaments === true) {
    return "Les interactions médicamenteuses et allergies seront prises en compte pour adapter votre traitement en toute sécurité.";
  }
  if (data.dejaEuProbleme === true && data.dejaConsulte === false && data.traitements.length > 0) {
    return "Vous avez déjà essayé des traitements par vous-même — c'est une information précieuse pour la consultation.";
  }
  if (data.traitements.length >= 3) {
    return "Plusieurs traitements déjà essayés ? Le praticien pourra vous orienter vers des alternatives adaptées.";
  }
  if (data.grossesse === "oui") {
    return "Certains traitements dermatologiques sont contre-indiqués pendant la grossesse. La prescription sera adaptée en conséquence.";
  }
  return null;
}

// ——— Section Header ———
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div
        className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(91, 17, 18, 0.06) 0%, rgba(0, 65, 94, 0.06) 100%)",
        }}
      >
        <Icon
          className="w-[15px] h-[15px] text-[#5B1112]"
          strokeWidth={1.7}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] text-[#111214]/80 tracking-[-0.1px]"
          style={{ fontWeight: 600 }}
        >
          {title}
        </p>
        {subtitle && (
          <p
            className="text-[11.5px] text-[#111214]/35 tracking-[-0.05px] mt-[1px]"
            style={{ fontWeight: 450 }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {badge}
    </div>
  );
}

// ——— Reveal Divider ———
function RevealDivider() {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="h-[1px] mx-2 origin-center"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(91,17,18,0.06) 30%, rgba(0,65,94,0.06) 70%, transparent 100%)",
      }}
    />
  );
}

// ——— Yes/No Card ———
function YesNoCard({
  label,
  sublabel,
  iconYes: IconYes,
  iconNo: IconNo,
  value,
  onChange,
  index,
}: {
  label: string;
  sublabel?: string;
  iconYes: SvgIcon;
  iconNo: SvgIcon;
  value: boolean | null;
  onChange: (val: boolean) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative rounded-[18px] overflow-hidden"
      style={{
        background: "white",
        boxShadow:
          value !== null
            ? "none"
            : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
      }}
    >
      {/* Question row */}
      <div className="px-4 pt-3.5 pb-2">
        <p
          className="text-[14.5px] text-[#111214]/80 tracking-[-0.15px] leading-[1.4]"
          style={{ fontWeight: 550 }}
        >
          {label}
        </p>
        {sublabel && (
          <p
            className="text-[11.5px] text-[#111214]/30 mt-0.5 tracking-[-0.05px]"
            style={{ fontWeight: 420 }}
          >
            {sublabel}
          </p>
        )}
      </div>

      {/* Answer cards — side by side */}
      <div className="flex gap-2 px-3 pb-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange(true)}
          className={`
            flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] cursor-pointer
            transition-all duration-250
            ${
              value === true
                ? "bg-[#5B1112]/[0.06] ring-[1.5px] ring-[#5B1112]/20"
                : "bg-[rgba(17,18,20,0.015)] hover:bg-[rgba(17,18,20,0.03)]"
            }
          `}
          style={{ minHeight: 52 }}
        >
          <motion.div
            className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-shrink-0"
            initial={false}
            animate={{
              backgroundColor:
                value === true
                  ? "rgba(91, 17, 18, 0.1)"
                  : "rgba(17, 18, 20, 0.04)",
            }}
            transition={{ duration: 0.25 }}
          >
            <IconYes
              className="w-[17px] h-[17px] transition-colors duration-250"
              style={{
                color:
                  value === true ? "#5B1112" : "rgba(17, 18, 20, 0.3)",
              }}
            />
          </motion.div>
          <span
            className="text-[14px] tracking-[-0.1px] transition-colors duration-200"
            style={{
              color:
                value === true ? "#5B1112" : "rgba(17, 18, 20, 0.55)",
              fontWeight: value === true ? 600 : 500,
            }}
          >
            Oui
          </span>
          <AnimatePresence>
            {value === true && (
              <motion.div
                className="ml-auto"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="w-[20px] h-[20px] rounded-full bg-[#5B1112] flex items-center justify-center">
                  <svg
                    width="10"
                    height="8"
                    viewBox="0 0 12 10"
                    fill="none"
                  >
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange(false)}
          className={`
            flex-1 flex items-center gap-2.5 px-3.5 py-3 rounded-[14px] cursor-pointer
            transition-all duration-250
            ${
              value === false
                ? "bg-[#00415E]/[0.05] ring-[1.5px] ring-[#00415E]/15"
                : "bg-[rgba(17,18,20,0.015)] hover:bg-[rgba(17,18,20,0.03)]"
            }
          `}
          style={{ minHeight: 52 }}
        >
          <motion.div
            className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-shrink-0"
            initial={false}
            animate={{
              backgroundColor:
                value === false
                  ? "rgba(0, 65, 94, 0.08)"
                  : "rgba(17, 18, 20, 0.04)",
            }}
            transition={{ duration: 0.25 }}
          >
            <IconNo
              className="w-[17px] h-[17px] transition-colors duration-250"
              style={{
                color:
                  value === false ? "#00415E" : "rgba(17, 18, 20, 0.3)",
              }}
            />
          </motion.div>
          <span
            className="text-[14px] tracking-[-0.1px] transition-colors duration-200"
            style={{
              color:
                value === false ? "#00415E" : "rgba(17, 18, 20, 0.55)",
              fontWeight: value === false ? 600 : 500,
            }}
          >
            Non
          </span>
          <AnimatePresence>
            {value === false && (
              <motion.div
                className="ml-auto"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="w-[20px] h-[20px] rounded-full bg-[#00415E] flex items-center justify-center">
                  <svg
                    width="8"
                    height="2"
                    viewBox="0 0 8 2"
                    fill="none"
                  >
                    <path
                      d="M1 1h6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  );
}

// ——— Treatment Card ———
function TreatmentCard({
  label,
  icon: Icon,
  selected,
  onToggle,
  index,
}: {
  label: string;
  icon: SvgIcon;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={`
        relative w-full flex flex-col items-center gap-2 px-2 py-3.5 rounded-[16px] cursor-pointer
        transition-all duration-250 overflow-hidden
        ${
          selected
            ? "bg-[#5B1112]/[0.06] ring-[1.5px] ring-[#5B1112]/20"
            : "bg-white hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        boxShadow: selected
          ? "inset 0 0 0 0 transparent"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 88,
      }}
    >
      {/* Selection dot indicator */}
      <motion.div
        className="absolute top-2 right-2"
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-[18px] h-[18px] rounded-full bg-[#5B1112] flex items-center justify-center">
          <svg width="9" height="7" viewBox="0 0 12 10" fill="none">
            <path
              d="M1 5L4.5 8.5L11 1.5"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Icon */}
      <motion.div
        className="w-[40px] h-[40px] rounded-[13px] flex items-center justify-center flex-shrink-0"
        initial={false}
        animate={{
          backgroundColor: selected
            ? "rgba(91, 17, 18, 0.08)"
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.25 }}
      >
        <Icon
          className="w-[20px] h-[20px] transition-colors duration-250"
          style={{
            color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.35)",
          }}
        />
      </motion.div>

      {/* Label */}
      <span
        className="text-[12.5px] text-center leading-[1.3] tracking-[-0.1px] transition-colors duration-200"
        style={{
          color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.6)",
          fontWeight: selected ? 600 : 500,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ——— Grossesse Option Card ———
function GrossesseCard({
  label,
  sublabel,
  icon: Icon,
  selected,
  onSelect,
  index,
  accentColor = "#5B1112",
}: {
  label: string;
  sublabel?: string;
  icon: SvgIcon;
  selected: boolean;
  onSelect: () => void;
  index: number;
  accentColor?: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
        ease: "easeOut",
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      className="flex-1 min-w-0 flex flex-col items-center gap-2 py-3.5 px-3 rounded-[16px] cursor-pointer transition-all duration-250"
      style={{
        backgroundColor: selected
          ? `${accentColor}0A`
          : "white",
        boxShadow: selected
          ? `inset 0 0 0 1.5px ${accentColor}30`
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 82,
      }}
    >
      <motion.div
        className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center"
        initial={false}
        animate={{
          backgroundColor: selected
            ? `${accentColor}14`
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className="w-[18px] h-[18px] transition-colors duration-200"
          style={{
            color: selected ? accentColor : "rgba(17, 18, 20, 0.3)",
          }}
        />
      </motion.div>
      <div className="text-center">
        <span
          className="text-[13px] leading-[1.25] tracking-[-0.1px] transition-colors duration-200 block"
          style={{
            color: selected ? accentColor : "rgba(17, 18, 20, 0.55)",
            fontWeight: selected ? 600 : 500,
          }}
        >
          {label}
        </span>
        {sublabel && (
          <span
            className="text-[10.5px] mt-0.5 block tracking-[-0.05px]"
            style={{
              color: selected ? `${accentColor}88` : "rgba(17, 18, 20, 0.3)",
              fontWeight: 420,
            }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </motion.button>
  );
}

// ——— Medical Alert Card (Allergies/Medicaments) ———
function MedicalAlertCard({
  label,
  sublabel,
  icon: Icon,
  iconYes: IconY,
  iconNo: IconN,
  value,
  onChange,
  showDetail,
  detailPlaceholder,
  detailValue,
  onDetailChange,
  index,
}: {
  label: string;
  sublabel?: string;
  icon: SvgIcon;
  iconYes: SvgIcon;
  iconNo: SvgIcon;
  value: boolean | null;
  onChange: (val: boolean) => void;
  showDetail?: boolean;
  detailPlaceholder?: string;
  detailValue?: string;
  onDetailChange?: (val: string) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="rounded-[18px] overflow-hidden"
      style={{
        background: "white",
        boxShadow:
          "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
      }}
    >
      {/* Header with icon */}
      <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
        <div
          className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{
            background:
              value === true
                ? "rgba(91, 17, 18, 0.08)"
                : "rgba(17, 18, 20, 0.03)",
          }}
        >
          <Icon
            className="w-[16px] h-[16px] transition-colors duration-250"
            style={{
              color:
                value === true
                  ? "#5B1112"
                  : "rgba(17, 18, 20, 0.35)",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-[14.5px] text-[#111214]/80 tracking-[-0.15px]"
            style={{ fontWeight: 550 }}
          >
            {label}
          </p>
          {sublabel && (
            <p
              className="text-[11.5px] text-[#111214]/30 mt-0.5 tracking-[-0.05px]"
              style={{ fontWeight: 420 }}
            >
              {sublabel}
            </p>
          )}
        </div>
      </div>

      {/* Answer buttons */}
      <div className="flex gap-2 px-3 pb-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange(true)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] cursor-pointer
            transition-all duration-250
            ${
              value === true
                ? "bg-[#5B1112]/[0.06] ring-[1.5px] ring-[#5B1112]/15"
                : "bg-[rgba(17,18,20,0.015)] hover:bg-[rgba(17,18,20,0.03)]"
            }
          `}
          style={{ minHeight: 44 }}
        >
          <IconY
            className="w-[15px] h-[15px]"
            style={{
              color:
                value === true ? "#5B1112" : "rgba(17, 18, 20, 0.3)",
            }}
          />
          <span
            className="text-[13.5px] tracking-[-0.1px]"
            style={{
              color:
                value === true ? "#5B1112" : "rgba(17, 18, 20, 0.5)",
              fontWeight: value === true ? 600 : 500,
            }}
          >
            Oui
          </span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => onChange(false)}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-[12px] cursor-pointer
            transition-all duration-250
            ${
              value === false
                ? "bg-[#00415E]/[0.05] ring-[1.5px] ring-[#00415E]/12"
                : "bg-[rgba(17,18,20,0.015)] hover:bg-[rgba(17,18,20,0.03)]"
            }
          `}
          style={{ minHeight: 44 }}
        >
          <IconN
            className="w-[15px] h-[15px]"
            style={{
              color:
                value === false ? "#00415E" : "rgba(17, 18, 20, 0.3)",
            }}
          />
          <span
            className="text-[13.5px] tracking-[-0.1px]"
            style={{
              color:
                value === false ? "#00415E" : "rgba(17, 18, 20, 0.5)",
              fontWeight: value === false ? 600 : 500,
            }}
          >
            Non
          </span>
        </motion.button>
      </div>

      {/* Detail input slide-in */}
      <AnimatePresence>
        {showDetail && value === true && onDetailChange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">
              <input
                type="text"
                value={detailValue ?? ""}
                onChange={(e) => onDetailChange(e.target.value)}
                placeholder={detailPlaceholder ?? "Précisez..."}
                className="
                  w-full px-4 py-3 rounded-[12px] text-[14px]
                  bg-[rgba(91, 17, 18, 0.02)] border border-[rgba(91, 17, 18, 0.1)]
                  text-[#111214] placeholder:text-[rgba(17,18,20,0.25)]
                  outline-none focus:ring-[1.5px] focus:ring-[#5B1112]/15
                  focus:border-[#5B1112]/15 transition-all duration-200
                "
                style={{ minHeight: 44 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ——— Completion Ring ———
function CompletionRing({ filled, total }: { filled: number; total: number }) {
  const pct = total === 0 ? 0 : filled / total;
  const r = 9;
  const circ = 2 * Math.PI * r;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5"
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke="rgba(17,18,20,0.06)"
          strokeWidth="2.5"
        />
        <motion.circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={pct >= 1 ? "#00415E" : "#5B1112"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct) }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <span
        className="text-[11px] tracking-[-0.05px]"
        style={{
          color: pct >= 1 ? "#00415E" : "rgba(17,18,20,0.35)",
          fontWeight: pct >= 1 ? 600 : 450,
        }}
      >
        {filled}/{total}
      </span>
    </motion.div>
  );
}

// ——— Props ———
interface StepHistoriqueProps {
  data: PreConsultData;
  onUpdate: (patch: Partial<PreConsultData>) => void;
}

// ——— Main Component ———
export function StepHistorique({ data, onUpdate }: StepHistoriqueProps) {
  const [showOtherInput, setShowOtherInput] = useState(
    data.traitementAutre.length > 0
  );

  // ——— Progressive disclosure watermark ———
  const revealedUpTo = useMemo(() => {
    if (data.allergies !== null || data.medicaments !== null) return 4;

    const hasTraitements =
      data.traitements.length > 0 || data.traitementAutre.length > 0;
    const noHistory =
      data.dejaEuProbleme === false && data.dejaConsulte === false;
    if (hasTraitements || noHistory) return 4;

    if (data.dejaEuProbleme !== null && data.dejaConsulte !== null) return 3;
    if (data.dejaEuProbleme !== null || data.dejaConsulte !== null) return 2;
    return 1;
  }, [
    data.allergies,
    data.medicaments,
    data.traitements.length,
    data.traitementAutre,
    data.dejaEuProbleme,
    data.dejaConsulte,
  ]);

  // Section refs
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const prevRevealedRef = useRef(revealedUpTo);

  // Auto-scroll when new section appears
  useEffect(() => {
    const prev = prevRevealedRef.current;
    if (revealedUpTo > prev) {
      prevRevealedRef.current = revealedUpTo;
      const timer = setTimeout(() => {
        const targetRef =
          revealedUpTo === 2
            ? section2Ref
            : revealedUpTo === 3
              ? section3Ref
              : revealedUpTo === 4
                ? section4Ref
                : null;
        targetRef?.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealedUpTo]);

  const toggleTraitement = useCallback(
    (t: string) => {
      const arr = data.traitements.includes(t)
        ? data.traitements.filter((x) => x !== t)
        : [...data.traitements, t];
      onUpdate({ traitements: arr });
    },
    [data.traitements, onUpdate]
  );

  // Compute smart tip
  const smartTip = getSmartTip(data);

  // Section completion counts
  const section1Filled =
    (data.dejaEuProbleme !== null ? 1 : 0) +
    (data.dejaConsulte !== null ? 1 : 0);
  const section3Filled =
    (data.allergies !== null ? 1 : 0) +
    (data.medicaments !== null ? 1 : 0) +
    (data.grossesse !== null ? 1 : 0);

  return (
    <div className="space-y-0">
      {/* ——— Section 1: Antécédents ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader
          icon={History}
          title="Votre parcours"
          subtitle="Pour mieux comprendre votre situation"
          badge={<CompletionRing filled={section1Filled} total={2} />}
        />

        <div className="space-y-2.5">
          <YesNoCard
            label="Ce problème est-il déjà survenu ?"
            sublabel="Récurrence ou première fois"
            iconYes={IconRecurrence}
            iconNo={IconPremiereFois}
            value={data.dejaEuProbleme}
            onChange={(v) => onUpdate({ dejaEuProbleme: v })}
            index={0}
          />

          <YesNoCard
            label="Avez-vous déjà consulté pour ça ?"
            sublabel="Dermatologue ou médecin généraliste"
            iconYes={IconConsultation}
            iconNo={IconPasConsulte}
            value={data.dejaConsulte}
            onChange={(v) => onUpdate({ dejaConsulte: v })}
            index={1}
          />
        </div>

        {/* Contextual micro-feedback */}
        <AnimatePresence>
          {data.dejaEuProbleme === true && data.dejaConsulte === false && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-[14px]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.2) 100%)",
                  border: "1px solid rgba(0, 65, 94, 0.06)",
                }}
              >
                <Lightbulb
                  className="w-[14px] h-[14px] text-[#00415E] flex-shrink-0 mt-0.5"
                  strokeWidth={1.8}
                />
                <p
                  className="text-[12px] text-[#00415E]/70 leading-[1.5]"
                  style={{ fontWeight: 450 }}
                >
                  Pas de souci ! Le praticien prendra le temps d'examiner
                  votre situation en détail.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ——— Section 2: Traitements (revealed after section 1) ——— */}
      <AnimatePresence>
        {revealedUpTo >= 2 && (
          <motion.div
            ref={section2Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4">
              <SectionHeader
                icon={FlaskConical}
                title="Traitements essayés"
                subtitle="Sélectionnez ce que vous avez déjà utilisé"
              />

              <div className="grid grid-cols-3 gap-2">
                {TRAITEMENTS_CHIPS.map((t, i) => (
                  <TreatmentCard
                    key={t}
                    label={t}
                    icon={TRAITEMENT_ICONS[t] || IconCreme}
                    selected={data.traitements.includes(t)}
                    onToggle={() => toggleTraitement(t)}
                    index={i}
                  />
                ))}
              </div>

              {/* Selected count badge */}
              <AnimatePresence>
                {data.traitements.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{
                      opacity: 1,
                      height: "auto",
                      marginTop: 10,
                    }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#5B1112]/[0.04]">
                      <div className="w-[18px] h-[18px] rounded-full bg-[#5B1112] flex items-center justify-center">
                        <span
                          className="text-[10px] text-white"
                          style={{ fontWeight: 700 }}
                        >
                          {data.traitements.length}
                        </span>
                      </div>
                      <span
                        className="text-[12px] text-[#5B1112]/70 tracking-[-0.1px]"
                        style={{ fontWeight: 500 }}
                      >
                        traitement
                        {data.traitements.length > 1 ? "s" : ""}{" "}
                        sélectionné
                        {data.traitements.length > 1 ? "s" : ""}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* "Autre" collapsed input */}
              <div className="mt-3">
                {!showOtherInput ? (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowOtherInput(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(17,18,20,0.02)]"
                    style={{
                      border: "1.5px dashed rgba(17,18,20,0.08)",
                    }}
                  >
                    <PenLine
                      className="w-[13px] h-[13px] text-[rgba(17,18,20,0.3)]"
                      strokeWidth={1.6}
                    />
                    <span
                      className="text-[12.5px] text-[rgba(17,18,20,0.35)] tracking-[-0.1px]"
                      style={{ fontWeight: 500 }}
                    >
                      Autre traitement
                    </span>
                    <ChevronDown
                      className="w-[12px] h-[12px] text-[rgba(17,18,20,0.2)]"
                      strokeWidth={1.5}
                    />
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      value={data.traitementAutre}
                      onChange={(e) =>
                        onUpdate({ traitementAutre: e.target.value })
                      }
                      placeholder="Ex : beurre de karité, savon traditionnel..."
                      className="
                        w-full px-4 py-3 rounded-[14px] text-[14px]
                        bg-white border border-[rgba(17,18,20,0.07)]
                        text-[#111214] placeholder:text-[rgba(17,18,20,0.25)]
                        outline-none focus:ring-[1.5px] focus:ring-[#5B1112]/15
                        focus:border-[#5B1112]/15 transition-all duration-200
                      "
                      style={{ minHeight: 46 }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 3: Santé & contre-indications (revealed after section 2) ——— */}
      <AnimatePresence>
        {revealedUpTo >= 3 && (
          <motion.div
            ref={section3Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.05,
            }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4">
              <SectionHeader
                icon={ShieldAlert}
                title="Santé & contre-indications"
                subtitle="Important pour la sécurité de votre traitement"
                badge={
                  <CompletionRing filled={section3Filled} total={3} />
                }
              />

              <div className="space-y-2.5">
                <MedicalAlertCard
                  label="Allergies connues ?"
                  sublabel="Médicaments, cosmétiques, aliments..."
                  icon={IconAllergies}
                  iconYes={IconCheck}
                  iconNo={IconCross}
                  value={data.allergies}
                  onChange={(v) => onUpdate({ allergies: v })}
                  showDetail
                  detailPlaceholder="Lesquelles ? (ex : parabènes, pénicilline...)"
                  detailValue={data.allergiesDetail}
                  onDetailChange={(v) =>
                    onUpdate({ allergiesDetail: v })
                  }
                  index={0}
                />

                <MedicalAlertCard
                  label="Médicaments en cours ?"
                  sublabel="Y compris compléments et contraception"
                  icon={IconMedicaments}
                  iconYes={IconCheck}
                  iconNo={IconCross}
                  value={data.medicaments}
                  onChange={(v) => onUpdate({ medicaments: v })}
                  showDetail
                  detailPlaceholder="Lesquels ? (ex : pilule, vitamine D...)"
                  detailValue={data.medicamentsDetail}
                  onDetailChange={(v) =>
                    onUpdate({ medicamentsDetail: v })
                  }
                  index={1}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 4: Grossesse (revealed after section 3) ——— */}
      <AnimatePresence>
        {revealedUpTo >= 4 && (
          <motion.div
            ref={section4Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.08,
            }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4">
              <SectionHeader
                icon={Stethoscope}
                title="Grossesse / allaitement"
                subtitle="Nécessaire pour adapter la prescription"
              />

              <div className="grid grid-cols-3 gap-2">
                <GrossesseCard
                  label="Oui"
                  sublabel="Enceinte ou allaitante"
                  icon={IconGrossesse}
                  selected={data.grossesse === "oui"}
                  onSelect={() => onUpdate({ grossesse: "oui" })}
                  index={0}
                  accentColor="#5B1112"
                />
                <GrossesseCard
                  label="Non"
                  icon={IconCross}
                  selected={data.grossesse === "non"}
                  onSelect={() => onUpdate({ grossesse: "non" })}
                  index={1}
                  accentColor="#00415E"
                />
                <GrossesseCard
                  label="Non concerné(e)"
                  icon={IconNonConcerne}
                  selected={data.grossesse === "non_concerne"}
                  onSelect={() =>
                    onUpdate({ grossesse: "non_concerne" })
                  }
                  index={2}
                  accentColor="#00415E"
                />
              </div>
            </div>

            {/* ——— Smart Contextual Tip ——— */}
            <AnimatePresence>
              {smartTip && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="mt-4"
                >
                  <div
                    className="flex items-start gap-3 px-4 py-3.5 rounded-[16px]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.3) 100%)",
                      border: "1px solid rgba(0, 65, 94, 0.08)",
                    }}
                  >
                    <div className="w-[26px] h-[26px] rounded-[8px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb
                        className="w-[13px] h-[13px] text-[#00415E]"
                        strokeWidth={1.8}
                      />
                    </div>
                    <p
                      className="text-[12.5px] text-[#00415E]/80 leading-[1.5] tracking-[-0.05px]"
                      style={{ fontWeight: 450 }}
                    >
                      {smartTip}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
