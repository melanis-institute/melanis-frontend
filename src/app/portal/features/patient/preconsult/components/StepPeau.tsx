import {
  ChevronRight,
  HelpCircle,
  Lightbulb,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import {
  IconGrasse,
  IconJeNeSaisPas,
  IconMixte,
  IconNormale,
  IconResistant,
  IconSeche,
  IconSensible,
  IconSkinHelper,
} from "./peau-icons";
import { PHOTOTYPES, TYPES_PEAU } from "./types";

// ——— Custom icon type ———
type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ——— Skin type icon + description mapping ———
const SKIN_TYPE_META: Record<
  string,
  { icon: SvgIcon; description: string; emoji: string }
> = {
  seche: {
    icon: IconSeche,
    description: "Tiraillements, rugosité, manque de confort",
    emoji: "🏜️",
  },
  mixte: {
    icon: IconMixte,
    description: "Zone T grasse, joues sèches ou normales",
    emoji: "⚖️",
  },
  grasse: {
    icon: IconGrasse,
    description: "Brillance, pores dilatés, excès de sébum",
    emoji: "💧",
  },
  normale: {
    icon: IconNormale,
    description: "Confortable, ni trop grasse ni trop sèche",
    emoji: "✨",
  },
};

// ——— Phototype swatches ———
const PHOTOTYPE_SWATCHES: Record<number, { color: string; gradient: string }> =
  {
    1: {
      color: "#FFE0BD",
      gradient: "linear-gradient(135deg, #FFE0BD 0%, #FFD4A6 100%)",
    },
    2: {
      color: "#F5C8A3",
      gradient: "linear-gradient(135deg, #F5C8A3 0%, #EBB98E 100%)",
    },
    3: {
      color: "#D4A373",
      gradient: "linear-gradient(135deg, #D4A373 0%, #C89560 100%)",
    },
    4: {
      color: "#A67B5B",
      gradient: "linear-gradient(135deg, #A67B5B 0%, #966D4D 100%)",
    },
    5: {
      color: "#6B4226",
      gradient: "linear-gradient(135deg, #6B4226 0%, #5A371F 100%)",
    },
    6: {
      color: "#3B1F0B",
      gradient: "linear-gradient(135deg, #3B1F0B 0%, #2D1708 100%)",
    },
  };

// ——— Skin type quiz data ———
const QUIZ_QUESTIONS = [
  {
    question: "Après avoir lavé votre visage, que ressentez-vous ?",
    options: [
      { key: "tight", label: "Peau qui tire", emoji: "😬" },
      { key: "shiny", label: "Peau brillante", emoji: "✨" },
      { key: "both", label: "Les deux par zones", emoji: "🔄" },
      { key: "nothing", label: "Rien de spécial", emoji: "😌" },
    ],
  },
  {
    question:
      "En milieu de journée, comment est votre zone T (front, nez, menton) ?",
    options: [
      { key: "dry", label: "Sèche / terne", emoji: "🏜️" },
      { key: "oily", label: "Brillante / luisante", emoji: "💧" },
      { key: "mixed", label: "Ça dépend des zones", emoji: "⚖️" },
      { key: "fine", label: "Tout va bien", emoji: "👍" },
    ],
  },
];

function quizResult(
  a1: string,
  a2: string,
): { key: string; label: string; confidence: string } {
  // Simple mapping
  if (a1 === "tight" && a2 === "dry")
    return { key: "seche", label: "Sèche", confidence: "Très probable" };
  if (a1 === "tight" && a2 === "oily")
    return { key: "mixte", label: "Mixte", confidence: "Probable" };
  if (a1 === "tight" && a2 === "mixed")
    return { key: "mixte", label: "Mixte", confidence: "Probable" };
  if (a1 === "tight" && a2 === "fine")
    return { key: "seche", label: "Sèche", confidence: "Probable" };
  if (a1 === "shiny" && a2 === "oily")
    return { key: "grasse", label: "Grasse", confidence: "Très probable" };
  if (a1 === "shiny" && a2 === "dry")
    return { key: "mixte", label: "Mixte", confidence: "Probable" };
  if (a1 === "shiny" && a2 === "mixed")
    return { key: "mixte", label: "Mixte", confidence: "Probable" };
  if (a1 === "shiny" && a2 === "fine")
    return { key: "grasse", label: "Grasse", confidence: "Probable" };
  if (a1 === "both")
    return { key: "mixte", label: "Mixte", confidence: "Très probable" };
  if (a1 === "nothing" && a2 === "fine")
    return { key: "normale", label: "Normale", confidence: "Très probable" };
  if (a1 === "nothing" && a2 === "oily")
    return { key: "mixte", label: "Mixte", confidence: "Probable" };
  if (a1 === "nothing" && a2 === "dry")
    return { key: "seche", label: "Sèche", confidence: "Probable" };
  return { key: "normale", label: "Normale", confidence: "Probable" };
}

// ——— Smart tips ———
function getSmartTip(
  peauSensible: boolean | null,
  typePeau: string | null,
  phototype: number | null,
): string | null {
  if (peauSensible === true && typePeau === "seche") {
    return "Peau sèche et sensible — des produits très doux, sans parfum ni alcool, seront privilégiés.";
  }
  if (peauSensible === true && typePeau === "grasse") {
    return "Peau grasse mais sensible — les traitements trop agressifs sont à éviter. La prescription sera adaptée.";
  }
  if (phototype !== null && phototype >= 4 && typePeau !== null) {
    return "Pour les peaux mates à foncées, le risque d'hyperpigmentation post-inflammatoire est à prendre en compte dans le choix du traitement.";
  }
  if (typePeau === "unknown") {
    return "Pas de souci si vous ne connaissez pas votre type de peau ! Il sera évalué lors de la consultation.";
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
        <Icon className="w-[15px] h-[15px] text-[#5B1112]" strokeWidth={1.7} />
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

// ——— Sensitivity Card ———
function SensitivityCard({
  label,
  sublabel,
  icon: Icon,
  selected,
  onSelect,
  index,
  accentColor,
}: {
  label: string;
  sublabel: string;
  icon: SvgIcon;
  selected: boolean;
  onSelect: () => void;
  index: number;
  accentColor: string;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      className="flex-1 relative flex flex-col items-center gap-2 py-4 px-3 rounded-[18px] cursor-pointer transition-all duration-250 overflow-hidden"
      style={{
        backgroundColor: selected ? `${accentColor}0A` : "white",
        boxShadow: selected
          ? `inset 0 0 0 1.5px ${accentColor}30`
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 100,
      }}
    >
      {/* Selected check */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="absolute top-2.5 right-2.5"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              className="w-[20px] h-[20px] rounded-full flex items-center justify-center"
              style={{ backgroundColor: accentColor }}
            >
              <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
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

      {/* Icon */}
      <motion.div
        className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center"
        initial={false}
        animate={{
          backgroundColor: selected
            ? `${accentColor}12`
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.25 }}
      >
        <Icon
          className="w-[21px] h-[21px] transition-colors duration-250"
          style={{ color: selected ? accentColor : "rgba(17, 18, 20, 0.35)" }}
        />
      </motion.div>

      {/* Text */}
      <div className="text-center">
        <span
          className="text-[14px] tracking-[-0.15px] block transition-colors duration-200"
          style={{
            color: selected ? accentColor : "rgba(17, 18, 20, 0.7)",
            fontWeight: selected ? 600 : 520,
          }}
        >
          {label}
        </span>
        <span
          className="text-[11px] mt-0.5 block tracking-[-0.05px] transition-colors duration-200"
          style={{
            color: selected ? `${accentColor}88` : "rgba(17, 18, 20, 0.3)",
            fontWeight: 420,
          }}
        >
          {sublabel}
        </span>
      </div>
    </motion.button>
  );
}

// ——— Skin Type Card ———
function SkinTypeCard({
  label,
  icon: Icon,
  description,
  selected,
  onSelect,
  index,
}: {
  label: string;
  icon: SvgIcon;
  description: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onSelect}
      className={`
        relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[16px] cursor-pointer
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
        minHeight: 72,
      }}
    >
      {/* Selection indicator line */}
      <motion.div
        className="absolute left-0 top-[14px] bottom-[14px] w-[3px] rounded-r-full"
        initial={false}
        animate={{ scaleY: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ background: "#5B1112", transformOrigin: "center" }}
      />

      {/* Icon */}
      <motion.div
        className="w-[44px] h-[44px] rounded-[14px] flex items-center justify-center flex-shrink-0"
        initial={false}
        animate={{
          backgroundColor: selected
            ? "rgba(91, 17, 18, 0.08)"
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.25 }}
      >
        <Icon
          className="w-[22px] h-[22px] transition-colors duration-250"
          style={{ color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.3)" }}
        />
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[15px] tracking-[-0.15px] transition-colors duration-200"
            style={{
              color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.75)",
              fontWeight: selected ? 600 : 520,
            }}
          >
            {label}
          </span>
        </div>
        <p
          className="text-[11.5px] mt-0.5 tracking-[-0.05px] transition-colors duration-200"
          style={{
            color: selected ? "#5B1112aa" : "rgba(17, 18, 20, 0.35)",
            fontWeight: 420,
          }}
        >
          {description}
        </p>
      </div>

      {/* Check */}
      <motion.div
        className="flex-shrink-0"
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-[22px] h-[22px] rounded-full bg-[#5B1112] flex items-center justify-center">
          <svg width="11" height="9" viewBox="0 0 12 10" fill="none">
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
    </motion.button>
  );
}

// ——— Phototype Visual Swatch ———
function PhototypeSwatch({
  value,
  label,
  swatchColor,
  swatchGradient,
  selected,
  onSelect,
  index,
}: {
  value: number;
  label: string;
  swatchColor: string;
  swatchGradient: string;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const isDark = value >= 4;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.93 }}
      onClick={onSelect}
      className="flex flex-col items-center gap-2 cursor-pointer group"
      style={{ flex: "1 1 0", minWidth: 0 }}
    >
      {/* Swatch circle */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        initial={false}
        animate={{
          width: selected ? 52 : 44,
          height: selected ? 52 : 44,
          boxShadow: selected
            ? `0 4px 16px ${swatchColor}40, 0 0 0 3px ${swatchColor}30`
            : `0 2px 6px ${swatchColor}20`,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ background: swatchGradient }}
      >
        {/* Selected check inside */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
                <path
                  d="M1.5 6.5L6 11L14.5 2"
                  stroke={isDark ? "white" : "#5B1112"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Label */}
      <span
        className="text-[11px] text-center leading-[1.2] tracking-[-0.05px] transition-colors duration-200"
        style={{
          color: selected ? "#5B1112" : "rgba(17, 18, 20, 0.45)",
          fontWeight: selected ? 600 : 450,
        }}
      >
        {label}
      </span>
    </motion.button>
  );
}

// ——— Skin Type Quiz ———
function SkinTypeQuiz({ onResult }: { onResult: (skinType: string) => void }) {
  const [quizStep, setQuizStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<{
    key: string;
    label: string;
    confidence: string;
  } | null>(null);

  const currentQ = QUIZ_QUESTIONS[quizStep];

  const handleAnswer = (key: string) => {
    const newAnswers = [...answers, key];
    setAnswers(newAnswers);

    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(quizStep + 1);
    } else {
      // Compute result
      const res = quizResult(newAnswers[0], newAnswers[1]);
      setResult(res);
    }
  };

  const handleAccept = () => {
    if (result) onResult(result.key);
  };

  const handleRetry = () => {
    setQuizStep(0);
    setAnswers([]);
    setResult(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div
        className="rounded-[18px] overflow-hidden mt-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.2) 100%)",
          border: "1px solid rgba(0, 65, 94, 0.06)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
          <div className="w-[26px] h-[26px] rounded-[8px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0">
            <IconSkinHelper className="w-[14px] h-[14px] text-[#00415E]" />
          </div>
          <div>
            <p
              className="text-[13px] text-[#00415E]/80 tracking-[-0.1px]"
              style={{ fontWeight: 600 }}
            >
              Mini-guide rapide
            </p>
            <p
              className="text-[10.5px] text-[#00415E]/40"
              style={{ fontWeight: 420 }}
            >
              2 questions pour identifier votre type
            </p>
          </div>
          {!result && (
            <div className="ml-auto flex items-center gap-1">
              {QUIZ_QUESTIONS.map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full"
                  initial={false}
                  animate={{
                    width: i === quizStep ? 14 : 6,
                    height: 6,
                    backgroundColor:
                      i <= quizStep ? "#00415E" : "rgba(0, 65, 94, 0.15)",
                  }}
                  transition={{ duration: 0.3 }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quiz content */}
        <div className="px-4 pb-4">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key={`q-${quizStep}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <p
                  className="text-[13.5px] text-[#00415E]/70 mb-3 tracking-[-0.1px] leading-[1.4]"
                  style={{ fontWeight: 500 }}
                >
                  {currentQ.question}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {currentQ.options.map((opt, i) => (
                    <motion.button
                      key={opt.key}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAnswer(opt.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] cursor-pointer transition-all duration-200 hover:bg-[#00415E]/[0.04]"
                      style={{
                        background: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(0, 65, 94, 0.08)",
                        minHeight: 44,
                      }}
                    >
                      <span className="text-[14px]">{opt.emoji}</span>
                      <span
                        className="text-[12.5px] text-[#00415E]/70 text-left tracking-[-0.05px]"
                        style={{ fontWeight: 500 }}
                      >
                        {opt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-3"
              >
                {/* Result display */}
                <div className="flex items-center gap-3">
                  <div className="w-[44px] h-[44px] rounded-[14px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const meta = SKIN_TYPE_META[result.key];
                      if (!meta) return null;
                      const ResultIcon = meta.icon;
                      return (
                        <ResultIcon className="w-[22px] h-[22px] text-[#00415E]" />
                      );
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[15px] text-[#00415E] tracking-[-0.15px]"
                        style={{ fontWeight: 650 }}
                      >
                        Peau {result.label}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#00415E]/[0.08] text-[#00415E]/70"
                        style={{ fontWeight: 550 }}
                      >
                        {result.confidence}
                      </span>
                    </div>
                    <p
                      className="text-[11.5px] text-[#00415E]/50 mt-0.5"
                      style={{ fontWeight: 420 }}
                    >
                      {SKIN_TYPE_META[result.key]?.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAccept}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[12px] cursor-pointer transition-colors duration-200"
                    style={{
                      background: "#00415E",
                      minHeight: 42,
                    }}
                  >
                    <span
                      className="text-[13px] text-white tracking-[-0.1px]"
                      style={{ fontWeight: 600 }}
                    >
                      C'est moi !
                    </span>
                    <ChevronRight
                      className="w-[13px] h-[13px] text-white/70"
                      strokeWidth={2}
                    />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRetry}
                    className="px-4 py-2.5 rounded-[12px] cursor-pointer transition-colors duration-200 hover:bg-[#00415E]/[0.04]"
                    style={{
                      border: "1px solid rgba(0, 65, 94, 0.12)",
                      minHeight: 42,
                    }}
                  >
                    <span
                      className="text-[12.5px] text-[#00415E]/60 tracking-[-0.05px]"
                      style={{ fontWeight: 500 }}
                    >
                      Refaire
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ——— Props ———
interface StepPeauProps {
  peauSensible: boolean | null;
  typePeau: string | null;
  phototype: number | null;
  onSensibleChange: (val: boolean) => void;
  onTypeChange: (key: string) => void;
  onPhototypeChange: (val: number) => void;
}

// ——— Main Component ———
export function StepPeau({
  peauSensible,
  typePeau,
  phototype,
  onSensibleChange,
  onTypeChange,
  onPhototypeChange,
}: StepPeauProps) {
  const [showQuiz, setShowQuiz] = useState(false);

  // Progressive disclosure watermark
  const revealedUpTo = useMemo(() => {
    if (typePeau !== null) return 3;
    if (peauSensible !== null) return 2;
    return 1;
  }, [peauSensible, typePeau]);

  // Section refs
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const prevRevealedRef = useRef(revealedUpTo);

  // Auto-scroll on reveal
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
              : null;
        targetRef?.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealedUpTo]);

  // Handle quiz result
  const handleQuizResult = (key: string) => {
    onTypeChange(key);
    setShowQuiz(false);
  };

  // Handle "Je ne sais pas" click
  const handleDontKnow = () => {
    if (typePeau === "unknown") {
      // Toggle quiz
      setShowQuiz(!showQuiz);
    } else {
      onTypeChange("unknown");
      setShowQuiz(true);
    }
  };

  // Smart tip
  const smartTip = getSmartTip(peauSensible, typePeau, phototype);

  // Completion
  const totalFilled =
    (peauSensible !== null ? 1 : 0) +
    (typePeau !== null ? 1 : 0) +
    (phototype !== null ? 1 : 0);

  // Skin types (excluding "unknown")
  const skinTypes = TYPES_PEAU.filter((t) => t.key !== "unknown");

  return (
    <div className="space-y-0">
      {/* ——— Section 1: Sensibilité ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader
          icon={Sparkles}
          title="Sensibilité cutanée"
          subtitle="Votre peau réagit-elle facilement ?"
          badge={<CompletionRing filled={totalFilled} total={3} />}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <SensitivityCard
            label="Sensible"
            sublabel="Réactive, rougeurs, picotements"
            icon={IconSensible}
            selected={peauSensible === true}
            onSelect={() => onSensibleChange(true)}
            index={0}
            accentColor="#5B1112"
          />
          <SensitivityCard
            label="Non sensible"
            sublabel="Tolère bien les produits"
            icon={IconResistant}
            selected={peauSensible === false}
            onSelect={() => onSensibleChange(false)}
            index={1}
            accentColor="#00415E"
          />
        </div>

        {/* Contextual micro-feedback */}
        <AnimatePresence>
          {peauSensible === true && (
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
                    "linear-gradient(135deg, rgba(91, 17, 18, 0.03) 0%, rgba(254, 240, 213, 0.2) 100%)",
                  border: "1px solid rgba(91, 17, 18, 0.06)",
                }}
              >
                <Lightbulb
                  className="w-[14px] h-[14px] text-[#5B1112] flex-shrink-0 mt-0.5"
                  strokeWidth={1.8}
                />
                <p
                  className="text-[12px] text-[#5B1112]/70 leading-[1.5]"
                  style={{ fontWeight: 450 }}
                >
                  Noté ! Des formulations douces adaptées
                  aux peaux sensibles.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ——— Section 2: Type de peau (revealed after section 1) ——— */}
      <AnimatePresence>
        {revealedUpTo >= 2 && (
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
                icon={HelpCircle}
                title="Votre type de peau"
                subtitle="Sélectionnez celui qui vous correspond"
              />

              {/* Skin type cards */}
              <div className="space-y-2">
                {skinTypes.map((tp, i) => {
                  const meta = SKIN_TYPE_META[tp.key];
                  if (!meta) return null;
                  return (
                    <SkinTypeCard
                      key={tp.key}
                      label={tp.label}
                      icon={meta.icon}
                      description={meta.description}
                      selected={typePeau === tp.key}
                      onSelect={() => {
                        onTypeChange(tp.key);
                        setShowQuiz(false);
                      }}
                      index={i}
                    />
                  );
                })}
              </div>

              {/* "Je ne sais pas" special card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-3"
              >
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDontKnow}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] cursor-pointer
                    transition-all duration-250
                    ${
                      typePeau === "unknown"
                        ? "ring-[1.5px] ring-[#00415E]/15"
                        : "hover:bg-[rgba(17,18,20,0.01)]"
                    }
                  `}
                  style={{
                    background:
                      typePeau === "unknown"
                        ? "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.15) 100%)"
                        : "transparent",
                    border:
                      typePeau === "unknown"
                        ? "none"
                        : "1.5px dashed rgba(17,18,20,0.08)",
                    minHeight: 56,
                  }}
                >
                  <div
                    className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        typePeau === "unknown"
                          ? "rgba(0, 65, 94, 0.08)"
                          : "rgba(17, 18, 20, 0.03)",
                    }}
                  >
                    <IconJeNeSaisPas
                      className="w-[19px] h-[19px] transition-colors duration-250"
                      style={{
                        color:
                          typePeau === "unknown"
                            ? "#00415E"
                            : "rgba(17, 18, 20, 0.3)",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span
                      className="text-[14px] tracking-[-0.15px] block transition-colors duration-200"
                      style={{
                        color:
                          typePeau === "unknown"
                            ? "#00415E"
                            : "rgba(17, 18, 20, 0.5)",
                        fontWeight: typePeau === "unknown" ? 600 : 500,
                      }}
                    >
                      Je ne sais pas
                    </span>
                    <span
                      className="text-[11px] block tracking-[-0.05px] transition-colors duration-200"
                      style={{
                        color:
                          typePeau === "unknown"
                            ? "#00415E80"
                            : "rgba(17, 18, 20, 0.25)",
                        fontWeight: 420,
                      }}
                    >
                      {typePeau === "unknown" && showQuiz
                        ? "Un mini-guide pour vous aider ↓"
                        : "On peut vous aider à le déterminer"}
                    </span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{
                      rotate: typePeau === "unknown" && showQuiz ? 90 : 0,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight
                      className="w-[16px] h-[16px] flex-shrink-0"
                      style={{
                        color:
                          typePeau === "unknown"
                            ? "#00415E"
                            : "rgba(17, 18, 20, 0.2)",
                      }}
                      strokeWidth={1.8}
                    />
                  </motion.div>
                </motion.button>

                {/* Embedded quiz */}
                <AnimatePresence>
                  {typePeau === "unknown" && showQuiz && (
                    <SkinTypeQuiz onResult={handleQuizResult} />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 3: Phototype (revealed after section 2) ——— */}
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
                icon={Palette}
                title="Ton de peau"
                subtitle="Aide à adapter le diagnostic — optionnel"
              />

              {/* Gradient scale label */}
              <div className="flex justify-between items-center mb-3 px-1">
                <span
                  className="text-[10px] text-[rgba(17,18,20,0.3)]"
                  style={{ fontWeight: 450 }}
                >
                  Clair
                </span>
                <div
                  className="flex-1 h-[3px] mx-3 rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #FFE0BD 0%, #F5C8A3 20%, #D4A373 40%, #A67B5B 60%, #6B4226 80%, #3B1F0B 100%)",
                  }}
                />
                <span
                  className="text-[10px] text-[rgba(17,18,20,0.3)]"
                  style={{ fontWeight: 450 }}
                >
                  Foncé
                </span>
              </div>

              {/* Visual swatches */}
              <div className="flex gap-1 mb-3">
                {PHOTOTYPES.filter((p) => p.value > 0).map((pt, i) => {
                  const swatch = PHOTOTYPE_SWATCHES[pt.value];
                  return (
                    <PhototypeSwatch
                      key={pt.value}
                      value={pt.value}
                      label={pt.label}
                      swatchColor={swatch.color}
                      swatchGradient={swatch.gradient}
                      selected={phototype === pt.value}
                      onSelect={() => onPhototypeChange(pt.value)}
                      index={i}
                    />
                  );
                })}
              </div>

              {/* "Je ne sais pas" option */}
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPhototypeChange(0)}
                className={`
                  w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] cursor-pointer
                  transition-all duration-200
                  ${
                    phototype === 0
                      ? "bg-[#00415E]/[0.04] ring-[1.5px] ring-[#00415E]/10"
                      : "hover:bg-[rgba(17,18,20,0.02)]"
                  }
                `}
                style={{
                  border:
                    phototype === 0
                      ? "none"
                      : "1.5px dashed rgba(17,18,20,0.08)",
                  minHeight: 42,
                }}
              >
                <IconJeNeSaisPas
                  className="w-[14px] h-[14px]"
                  style={{
                    color:
                      phototype === 0 ? "#00415E" : "rgba(17, 18, 20, 0.3)",
                  }}
                />
                <span
                  className="text-[12.5px] tracking-[-0.1px]"
                  style={{
                    color:
                      phototype === 0 ? "#00415E" : "rgba(17, 18, 20, 0.35)",
                    fontWeight: phototype === 0 ? 600 : 500,
                  }}
                >
                  Je ne sais pas
                </span>
              </motion.button>
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
