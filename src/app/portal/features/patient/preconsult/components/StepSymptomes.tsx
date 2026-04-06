import { useState, useEffect, useMemo, useRef, useCallback, type ComponentType, type SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Flame,
  Zap,
  Clock,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  PenLine,
  ChevronDown,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import {
  IconDemangeaisons,
  IconDouleur,
  IconBrulure,
  IconSaignement,
  IconSuintement,
  IconSecheresse,
  IconGonflement,
  IconRougeur,
  IconDesquamation,
} from "./symptom-icons";
import { SYMPTOMES, DUREES } from "./types";

// ——— Custom symptom icon type ———
type SymptomIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// ——— Symptom icon mapping ———
const SYMPTOME_ICONS: Record<string, SymptomIconComponent> = {
  "Démangeaisons": IconDemangeaisons,
  "Douleur": IconDouleur,
  "Brûlure": IconBrulure,
  "Saignement": IconSaignement,
  "Suintement": IconSuintement,
  "Sécheresse": IconSecheresse,
  "Gonflement": IconGonflement,
  "Rougeur": IconRougeur,
  "Desquamation": IconDesquamation,
};

// ——— Duration icons ———
const DUREE_ICONS: Record<string, LucideIcon> = {
  "1w": Clock,
  "1-4w": CalendarDays,
  "1-6m": CalendarRange,
  "6m+": CalendarClock,
};

// ——— Intensity data ———
const INTENSITE_DATA = [
  { value: 1, label: "Léger", emoji: "😊", color: "#00415E", bgColor: "rgba(0, 65, 94, 0.08)", glowColor: "rgba(0, 65, 94, 0.15)" },
  { value: 2, label: "Modéré", emoji: "😐", color: "#00415E", bgColor: "rgba(0, 65, 94, 0.08)", glowColor: "rgba(0, 65, 94, 0.15)" },
  { value: 3, label: "Moyen", emoji: "😕", color: "#5B1112", bgColor: "rgba(91, 17, 18, 0.08)", glowColor: "rgba(91, 17, 18, 0.15)" },
  { value: 4, label: "Important", emoji: "😣", color: "#5B1112", bgColor: "rgba(91, 17, 18, 0.08)", glowColor: "rgba(91, 17, 18, 0.15)" },
  { value: 5, label: "Sévère", emoji: "😖", color: "#5B1112", bgColor: "rgba(91, 17, 18, 0.08)", glowColor: "rgba(91, 17, 18, 0.15)" },
];

// ——— Smart contextual tips ———
function getSmartTip(symptomes: string[], duree: string | null, intensite: number): string | null {
  if (symptomes.includes("Brûlure") && symptomes.includes("Rougeur")) {
    return "La combinaison brûlure + rougeur peut indiquer une réaction cutanée. Évitez d'appliquer des produits irritants en attendant la consultation.";
  }
  if (symptomes.includes("Démangeaisons") && duree === "6m+") {
    return "Des démangeaisons persistantes depuis plus de 6 mois méritent un suivi spécialisé. Vous avez bien fait de prendre rendez-vous.";
  }
  if (symptomes.includes("Sécheresse") && symptomes.includes("Desquamation")) {
    return "La sécheresse et la desquamation sont souvent liées. Hydratez bien votre peau en attendant la consultation.";
  }
  if (intensite >= 4 && symptomes.length >= 3) {
    return "Vous ressentez plusieurs symptômes intenses. Un plan de traitement adapté pourra vous être proposé.";
  }
  return null;
}

// ——— Section Header component ———
function SectionHeader({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <div
        className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, rgba(91, 17, 18, 0.06) 0%, rgba(0, 65, 94, 0.06) 100%)" }}
      >
        <Icon className="w-[15px] h-[15px] text-[#5B1112]" strokeWidth={1.7} />
      </div>
      <div>
        <p className="text-[14px] text-[#111214]/80 tracking-[-0.1px]" style={{ fontWeight: 600 }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-[11.5px] text-[#111214]/35 tracking-[-0.05px] mt-[1px]" style={{ fontWeight: 450 }}>
            {subtitle}
          </p>
        )}
      </div>
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
        background: "linear-gradient(90deg, transparent 0%, rgba(91,17,18,0.06) 30%, rgba(0,65,94,0.06) 70%, transparent 100%)",
      }}
    />
  );
}

// ——— Symptom Card component ———
function SymptomCard({
  label,
  icon: Icon,
  selected,
  onToggle,
  index,
}: {
  label: string;
  icon: SymptomIconComponent;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={`
        relative w-full flex items-center gap-3 px-3.5 py-3 rounded-[16px] cursor-pointer
        transition-all duration-250 overflow-hidden
        ${selected
          ? "bg-[#5B1112]/[0.06] ring-[1.5px] ring-[#5B1112]/20"
          : "bg-white hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        boxShadow: selected
          ? "inset 0 0 0 0 transparent"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 52,
      }}
    >
      {/* Selection indicator line */}
      <motion.div
        className="absolute left-0 top-[12px] bottom-[12px] w-[3px] rounded-r-full"
        initial={false}
        animate={{
          scaleY: selected ? 1 : 0,
          opacity: selected ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ background: "#5B1112", transformOrigin: "center" }}
      />

      {/* Icon container */}
      <motion.div
        className="w-[36px] h-[36px] rounded-[12px] flex items-center justify-center flex-shrink-0"
        initial={false}
        animate={{
          backgroundColor: selected ? "rgba(91, 17, 18, 0.08)" : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.25 }}
      >
        <Icon
          className="w-[18px] h-[18px] transition-colors duration-250"
          style={{ color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.35)" }}
        />
      </motion.div>

      {/* Label */}
      <span
        className="text-[15px] text-left tracking-[-0.15px] transition-colors duration-200"
        style={{
          color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.7)",
          fontWeight: selected ? 600 : 500,
        }}
      >
        {label}
      </span>

      {/* Check indicator */}
      <motion.div
        className="ml-auto flex-shrink-0"
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-[22px] h-[22px] rounded-full bg-[#5B1112] flex items-center justify-center">
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </motion.div>
    </motion.button>
  );
}

// ——— Duration Card component ———
function DurationCard({
  label,
  icon: Icon,
  selected,
  onSelect,
  index,
}: {
  label: string;
  icon: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: "easeOut" }}
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      className={`
        flex-1 min-w-0 flex flex-col items-center gap-1.5 py-3 px-2 rounded-[16px] cursor-pointer
        transition-all duration-250
        ${selected
          ? "bg-[#5B1112]/[0.06] ring-[1.5px] ring-[#5B1112]/20"
          : "bg-white hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        boxShadow: selected
          ? "none"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 72,
      }}
    >
      <motion.div
        className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center"
        initial={false}
        animate={{
          backgroundColor: selected ? "rgba(91, 17, 18, 0.1)" : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className="w-[15px] h-[15px] transition-colors duration-200"
          style={{ color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.3)" }}
          strokeWidth={selected ? 2 : 1.5}
        />
      </motion.div>
      <span
        className="text-[12px] text-center leading-[1.25] tracking-[-0.1px] transition-colors duration-200"
        style={{
          color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.55)",
          fontWeight: selected ? 600 : 500,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ——— Visual Intensity Gauge component ———
function IntensityGauge({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const data = INTENSITE_DATA[value - 1];

  return (
    <div className="space-y-4">
      {/* Emoji + label display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, scale: 0.8, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -6 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <span className="text-[36px] leading-none">{data.emoji}</span>
          <motion.span
            className="text-[14px] mt-1.5 tracking-[-0.2px]"
            style={{ color: data.color, fontWeight: 650 }}
          >
            {data.label}
          </motion.span>
        </motion.div>
      </AnimatePresence>

      {/* Gauge track */}
      <div className="relative px-1">
        <div className="relative h-[6px] rounded-full overflow-hidden" style={{ background: "rgba(17,18,20,0.05)" }}>
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            initial={false}
            animate={{ width: `${((value - 1) / 4) * 100}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: `linear-gradient(90deg, #00415E 0%, ${data.color} 100%)`,
            }}
          />
        </div>
        <input
          type="range"
          min={1}
          max={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full opacity-0 cursor-pointer"
          style={{ height: 44, marginTop: -19 }}
        />
      </div>

      {/* Level dots */}
      <div className="flex justify-between items-center gap-1 px-0.5">
        {INTENSITE_DATA.map((level) => {
          const isActive = level.value === value;
          const isPast = level.value < value;

          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group flex-1"
              style={{ minHeight: 44 }}
            >
              <motion.div
                className="relative flex items-center justify-center rounded-full"
                initial={false}
                animate={{
                  width: isActive ? 38 : 30,
                  height: isActive ? 38 : 30,
                  backgroundColor: isActive ? level.color : isPast ? level.bgColor : "rgba(17,18,20,0.04)",
                  boxShadow: isActive ? `0 2px 12px ${level.glowColor}, 0 0 0 3px ${level.glowColor}` : "none",
                }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.span
                  className="text-[12px]"
                  initial={false}
                  animate={{
                    color: isActive ? "#fff" : isPast ? level.color : "rgba(17,18,20,0.3)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {level.value}
                </motion.span>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ——— Props ———
interface StepSymptomesProps {
  symptomes: string[];
  duree: string | null;
  intensite: number;
  notesSymptomes?: string;
  onToggleSymptome: (s: string) => void;
  onDureeChange: (d: string) => void;
  onIntensiteChange: (val: number) => void;
  onNotesChange?: (val: string) => void;
}

// ——— Main Component ———
export function StepSymptomes({
  symptomes,
  duree,
  intensite,
  notesSymptomes = "",
  onToggleSymptome,
  onDureeChange,
  onIntensiteChange,
  onNotesChange,
}: StepSymptomesProps) {
  const [showNotes, setShowNotes] = useState(notesSymptomes.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Progressive disclosure: watermark — once unlocked, stays visible
  const revealedUpTo = useMemo(() => {
    if (duree !== null) return 3;
    if (symptomes.length > 0) return 2;
    return 1;
  }, [duree, symptomes.length]);

  // Section refs for scroll-into-view
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);

  // Track previous values to detect new reveals
  const prevRevealedRef = useRef(revealedUpTo);

  // Auto-scroll when a new section is revealed
  useEffect(() => {
    const prev = prevRevealedRef.current;
    if (revealedUpTo > prev) {
      prevRevealedRef.current = revealedUpTo;
      // Small delay to let animation start before scrolling
      const timer = setTimeout(() => {
        const targetRef =
          revealedUpTo === 2 ? section2Ref :
          revealedUpTo === 3 ? section3Ref :
          null;
        targetRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealedUpTo]);

  const showRedFlag = useMemo(() => {
    const hasPain = symptomes.includes("Douleur");
    const hasSwelling = symptomes.includes("Gonflement");
    const severe = intensite >= 4;
    return severe && (hasPain || hasSwelling);
  }, [symptomes, intensite]);

  const smartTip = getSmartTip(symptomes, duree, intensite);

  // Auto-resize textarea
  const handleNotesInput = useCallback((val: string) => {
    onNotesChange?.(val);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [onNotesChange]);

  // Visibility flags
  const showSection2 = revealedUpTo >= 2;
  const showSection3 = revealedUpTo >= 3;

  return (
    <div className="space-y-0">
      {/* ——— Section 1: Symptômes Grid ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader
          icon={Zap}
          title="Que ressentez-vous ?"
          subtitle="Sélectionnez tout ce qui s'applique"
        />
        <div className="grid grid-cols-2 gap-2">
          {SYMPTOMES.map((s, i) => (
            <SymptomCard
              key={s}
              label={s}
              icon={SYMPTOME_ICONS[s] || IconDemangeaisons}
              selected={symptomes.includes(s)}
              onToggle={() => onToggleSymptome(s)}
              index={i}
            />
          ))}
        </div>

        {/* Selected count badge */}
        <AnimatePresence>
          {symptomes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#5B1112]/[0.04]">
                <div className="w-[18px] h-[18px] rounded-full bg-[#5B1112] flex items-center justify-center">
                  <span className="text-[10px] text-white" style={{ fontWeight: 700 }}>
                    {symptomes.length}
                  </span>
                </div>
                <span className="text-[12px] text-[#5B1112]/70 tracking-[-0.1px]" style={{ fontWeight: 500 }}>
                  symptôme{symptomes.length > 1 ? "s" : ""} sélectionné{symptomes.length > 1 ? "s" : ""}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ——— Section 2: Durée (revealed after symptoms selected) ——— */}
      <AnimatePresence>
        {showSection2 && (
          <motion.div
            ref={section2Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4">
              <SectionHeader
                icon={Clock}
                title="Depuis quand ?"
                subtitle="Durée approximative des symptômes"
              />
              <div className="grid grid-cols-4 gap-2">
                {DUREES.map((d, i) => (
                  <DurationCard
                    key={d.key}
                    label={d.label}
                    icon={DUREE_ICONS[d.key] || Clock}
                    selected={duree === d.key}
                    onSelect={() => onDureeChange(d.key)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 3: Intensité Gauge (revealed after duration selected) ——— */}
      <AnimatePresence>
        {showSection3 && (
          <motion.div
            ref={section3Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4">
              <SectionHeader
                icon={Flame}
                title="Quelle intensité ?"
                subtitle="Évaluez le niveau de gêne ressenti"
              />
              <div
                className="rounded-[20px] px-4 pt-5 pb-4"
                style={{
                  background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(254,240,213,0.15) 100%)",
                  boxShadow: "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <IntensityGauge value={intensite} onChange={onIntensiteChange} />
              </div>
            </div>

            {/* ——— Smart Contextual Tip ——— */}
            <AnimatePresence>
              {smartTip && !showRedFlag && (
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
                      background: "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.3) 100%)",
                      border: "1px solid rgba(0, 65, 94, 0.08)",
                    }}
                  >
                    <div className="w-[26px] h-[26px] rounded-[8px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Lightbulb className="w-[13px] h-[13px] text-[#00415E]" strokeWidth={1.8} />
                    </div>
                    <p className="text-[12.5px] text-[#00415E]/80 leading-[1.5] tracking-[-0.05px]" style={{ fontWeight: 450 }}>
                      {smartTip}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ——— Red Flag Warning ——— */}
            <AnimatePresence>
              {showRedFlag && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-4"
                >
                  <div
                    className="relative overflow-hidden rounded-[18px] p-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(91, 17, 18, 0.06) 0%, rgba(254, 240, 213, 0.4) 100%)",
                      border: "1px solid rgba(91, 17, 18, 0.12)",
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full bg-[#5B1112]/40" />
                    <div className="flex items-start gap-3 pl-1.5">
                      <div className="w-[32px] h-[32px] rounded-[10px] bg-[#5B1112]/10 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-[16px] h-[16px] text-[#5B1112]" strokeWidth={1.8} />
                      </div>
                      <div>
                        <p className="text-[13.5px] text-[#5B1112] leading-[1.35]" style={{ fontWeight: 650 }}>
                          Symptômes importants détectés
                        </p>
                        <p className="text-[12px] text-[#5B1112]/65 leading-[1.55] mt-1.5" style={{ fontWeight: 450 }}>
                          Si vous avez de la fièvre ou si les symptômes s'aggravent rapidement, consultez en urgence ou appelez le{" "}
                          <span style={{ fontWeight: 650, color: "rgba(91, 17, 18, 0.85)" }}>1515</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ——— Section 4: Notes supplémentaires ——— */}
            <div ref={section4Ref} className="mt-5">
              {!showNotes ? (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNotes(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-[14px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(17,18,20,0.02)]"
                  style={{ border: "1.5px dashed rgba(17,18,20,0.1)" }}
                >
                  <PenLine className="w-[14px] h-[14px] text-[rgba(17,18,20,0.3)]" strokeWidth={1.6} />
                  <span className="text-[13px] text-[rgba(17,18,20,0.4)] tracking-[-0.1px]" style={{ fontWeight: 500 }}>
                    Ajouter des détails supplémentaires
                  </span>
                  <ChevronDown className="w-[13px] h-[13px] text-[rgba(17,18,20,0.25)]" strokeWidth={1.5} />
                </motion.button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <RevealDivider />
                  <div className="pt-4">
                    <SectionHeader
                      icon={PenLine}
                      title="Notes supplémentaires"
                      subtitle="Facultatif — décrivez librement"
                    />
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={notesSymptomes}
                        onChange={(e) => handleNotesInput(e.target.value)}
                        placeholder="Ex : Les démangeaisons sont plus fortes la nuit, surtout après la douche..."
                        maxLength={500}
                        rows={3}
                        className="
                          w-full px-4 py-3.5 rounded-[16px] text-[14px] resize-none
                          bg-white border border-[rgba(17,18,20,0.07)]
                          text-[#111214] placeholder:text-[rgba(17,18,20,0.25)]
                          outline-none focus:ring-[1.5px] focus:ring-[#5B1112]/15
                          focus:border-[#5B1112]/15 transition-all duration-200
                        "
                        style={{ minHeight: 80, lineHeight: 1.55, fontWeight: 400 }}
                      />
                      <div className="flex justify-end mt-1.5 pr-1">
                        <span
                          className="text-[11px] tracking-[-0.05px]"
                          style={{
                            color: notesSymptomes.length > 400 ? "rgba(91, 17, 18, 0.6)" : "rgba(17,18,20,0.2)",
                            fontWeight: 450,
                          }}
                        >
                          {notesSymptomes.length}/500
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
