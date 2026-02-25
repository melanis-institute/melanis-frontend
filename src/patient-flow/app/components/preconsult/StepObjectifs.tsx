import { useState, useEffect, useMemo, useRef, useCallback, type ComponentType, type SVGProps, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Target,
  SlidersHorizontal,
  Lightbulb,
  PenLine,
  ChevronDown,
  Heart,
  type LucideIcon,
} from "lucide-react";
import {
  IconSoulager,
  IconComprendre,
  IconRoutine,
  IconPrescription,
  IconSuivi,
  IconAvisSpecialise,
  IconRoutineSimple,
  IconBudget,
  IconNaturel,
  IconSansParfum,
  IconLocal,
  IconBioVegan,
} from "./objectif-icons";
import { OBJECTIFS } from "./types";

// ——— Custom icon type ———
type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ——— Objectif data with icons, descriptions, accents ———
interface ObjectifMeta {
  label: string;
  icon: SvgIcon;
  description: string;
  accentColor: string;
  emoji: string;
}

const OBJECTIF_META: ObjectifMeta[] = [
  {
    label: "Soulager rapidement",
    icon: IconSoulager,
    description: "Traitement rapide pour calmer les symptômes",
    accentColor: "#5B1112",
    emoji: "⚡",
  },
  {
    label: "Comprendre la cause",
    icon: IconComprendre,
    description: "Diagnostic approfondi et explications claires",
    accentColor: "#00415E",
    emoji: "🔍",
  },
  {
    label: "Routine skincare",
    icon: IconRoutine,
    description: "Conseils personnalisés pour votre peau au quotidien",
    accentColor: "#00415E",
    emoji: "✨",
  },
  {
    label: "Obtenir une prescription",
    icon: IconPrescription,
    description: "Ordonnance pour un traitement adapté",
    accentColor: "#5B1112",
    emoji: "📋",
  },
  {
    label: "Suivi de traitement",
    icon: IconSuivi,
    description: "Évaluer l'efficacité d'un traitement en cours",
    accentColor: "#00415E",
    emoji: "🔄",
  },
  {
    label: "Avis spécialisé",
    icon: IconAvisSpecialise,
    description: "Expertise dermato sur un problème spécifique",
    accentColor: "#5B1112",
    emoji: "🩺",
  },
];

// ——— Preference data with icons ———
interface PrefMeta {
  label: string;
  icon: SvgIcon;
  description: string;
  accentColor: string;
}

const PREF_META: PrefMeta[] = [
  { label: "Routine simple", icon: IconRoutineSimple, description: "Peu d'étapes", accentColor: "#00415E" },
  { label: "Budget limité", icon: IconBudget, description: "Solutions accessibles", accentColor: "#5B1112" },
  { label: "Produits naturels", icon: IconNaturel, description: "Ingrédients d'origine naturelle", accentColor: "#00415E" },
  { label: "Sans parfum", icon: IconSansParfum, description: "Peau sensible", accentColor: "#00415E" },
  { label: "Produits locaux", icon: IconLocal, description: "Disponibles au Sénégal", accentColor: "#00415E" },
  { label: "Bio / vegan", icon: IconBioVegan, description: "Éthique & naturel", accentColor: "#00415E" },
];

// ——— Smart contextual tips ———
function getSmartTip(
  objectifs: string[],
  motif: string | null
): { message: string; type: "info" | "reassurance" | "tip" } | null {
  // Combo tips: objectif × motif
  if (objectifs.includes("Soulager rapidement") && motif === "eczema") {
    return {
      message:
        "L'eczéma peut être soulagé rapidement avec des émollients et des dermocorticoïdes. Le Dr. Diallo pourra vous prescrire le traitement le plus adapté.",
      type: "tip",
    };
  }
  if (objectifs.includes("Routine skincare") && motif === "acne") {
    return {
      message:
        "Une bonne routine anti-acné repose souvent sur un nettoyant doux, un sérum adapté et une protection solaire. Le Dr. Diallo vous guidera étape par étape.",
      type: "tip",
    };
  }
  if (objectifs.includes("Comprendre la cause") && motif === "taches") {
    return {
      message:
        "Les taches cutanées ont de nombreuses causes possibles (soleil, hormones, inflammation). Un diagnostic dermatologique permettra d'identifier la vôtre.",
      type: "tip",
    };
  }
  if (objectifs.includes("Obtenir une prescription") && motif === "mycose") {
    return {
      message:
        "Les mycoses nécessitent souvent un antifongique spécifique. Le Dr. Diallo pourra vous prescrire le traitement le plus efficace après examen.",
      type: "tip",
    };
  }

  // Generic multi-objectif tips
  if (objectifs.includes("Soulager rapidement") && objectifs.includes("Comprendre la cause")) {
    return {
      message:
        "Excellente combinaison ! Le Dr. Diallo pourra à la fois vous soulager et vous expliquer les causes profondes.",
      type: "reassurance",
    };
  }
  if (objectifs.includes("Routine skincare") && objectifs.includes("Avis spécialisé")) {
    return {
      message:
        "Un avis spécialisé est idéal pour construire une routine skincare vraiment adaptée à votre type de peau et à vos besoins.",
      type: "tip",
    };
  }
  if (objectifs.length >= 3) {
    return {
      message:
        "Vous avez plusieurs attentes — c'est très bien ! Le Dr. Diallo prendra le temps d'aborder chacune lors de votre consultation.",
      type: "reassurance",
    };
  }
  if (objectifs.includes("Suivi de traitement")) {
    return {
      message:
        "Pensez à apporter vos ordonnances précédentes ou le nom des produits utilisés — cela aidera le Dr. Diallo à évaluer votre traitement.",
      type: "info",
    };
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

// ——— Objectif Card ———
function ObjectifCard({
  meta,
  selected,
  onToggle,
  index,
}: {
  meta: ObjectifMeta;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const Icon = meta.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
      className={`
        relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-[18px] cursor-pointer
        transition-all duration-250 overflow-hidden text-left
        ${
          selected
            ? "ring-[1.5px] ring-[#5B1112]/20"
            : "bg-white hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        backgroundColor: selected
          ? `${meta.accentColor}08`
          : undefined,
        boxShadow: selected
          ? "none"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 68,
      }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-[14px] bottom-[14px] w-[3px] rounded-r-full"
        initial={false}
        animate={{
          scaleY: selected ? 1 : 0,
          opacity: selected ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        style={{ background: meta.accentColor, transformOrigin: "center" }}
      />

      {/* Icon */}
      <motion.div
        className="w-[42px] h-[42px] rounded-[14px] flex items-center justify-center flex-shrink-0"
        initial={false}
        animate={{
          backgroundColor: selected
            ? `${meta.accentColor}14`
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.25 }}
      >
        <Icon
          className="w-[20px] h-[20px] transition-colors duration-250"
          style={{
            color: selected ? meta.accentColor : "rgba(17, 18, 20, 0.35)",
          }}
        />
      </motion.div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className="text-[15px] tracking-[-0.15px] transition-colors duration-200 block"
          style={{
            color: selected ? meta.accentColor : "rgba(17, 18, 20, 0.75)",
            fontWeight: selected ? 620 : 520,
          }}
        >
          {meta.label}
        </span>
        <span
          className="text-[11.5px] tracking-[-0.05px] mt-0.5 block transition-colors duration-200"
          style={{
            color: selected
              ? `${meta.accentColor}88`
              : "rgba(17, 18, 20, 0.32)",
            fontWeight: 420,
          }}
        >
          {meta.description}
        </span>
      </div>

      {/* Check */}
      <motion.div
        className="flex-shrink-0"
        initial={false}
        animate={{ scale: selected ? 1 : 0, opacity: selected ? 1 : 0 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          className="w-[24px] h-[24px] rounded-full flex items-center justify-center"
          style={{ backgroundColor: meta.accentColor }}
        >
          <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
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

// ——— Preference Card ———
function PreferenceCard({
  meta,
  selected,
  onToggle,
  index,
}: {
  meta: PrefMeta;
  selected: boolean;
  onToggle: () => void;
  index: number;
}) {
  const Icon = meta.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={`
        flex-1 min-w-0 flex flex-col items-center gap-1.5 py-3.5 px-2.5 rounded-[16px] cursor-pointer
        transition-all duration-250
        ${
          selected
            ? "ring-[1.5px] ring-[#5B1112]/15"
            : "bg-white hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        backgroundColor: selected ? `${meta.accentColor}08` : undefined,
        boxShadow: selected
          ? "none"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 82,
      }}
    >
      <motion.div
        className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center"
        initial={false}
        animate={{
          backgroundColor: selected
            ? `${meta.accentColor}14`
            : "rgba(17, 18, 20, 0.03)",
        }}
        transition={{ duration: 0.2 }}
      >
        <Icon
          className="w-[17px] h-[17px] transition-colors duration-200"
          style={{
            color: selected ? meta.accentColor : "rgba(17, 18, 20, 0.3)",
          }}
        />
      </motion.div>
      <div className="text-center">
        <span
          className="text-[12.5px] tracking-[-0.1px] transition-colors duration-200 block leading-[1.25]"
          style={{
            color: selected ? meta.accentColor : "rgba(17, 18, 20, 0.6)",
            fontWeight: selected ? 600 : 500,
          }}
        >
          {meta.label}
        </span>
        <span
          className="text-[10px] mt-0.5 block tracking-[-0.02px] transition-colors duration-200"
          style={{
            color: selected
              ? `${meta.accentColor}66`
              : "rgba(17, 18, 20, 0.25)",
            fontWeight: 420,
          }}
        >
          {meta.description}
        </span>
      </div>
    </motion.button>
  );
}

// ——— Completion Ring ———
function CompletionRing({
  count,
  max,
  label,
}: {
  count: number;
  max: number;
  label: string;
}) {
  const pct = max === 0 ? 0 : count / max;
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
          stroke={pct >= 0.5 ? "#00415E" : "#5B1112"}
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
          color: count > 0 ? "#5B1112" : "rgba(17,18,20,0.35)",
          fontWeight: count > 0 ? 600 : 450,
        }}
      >
        {count} {label}
      </span>
    </motion.div>
  );
}

// ——— Props ———
interface StepObjectifsProps {
  objectifs: string[];
  preferences: string[];
  notesObjectifs?: string;
  motif?: string | null;
  onToggleObjectif: (o: string) => void;
  onTogglePreference: (p: string) => void;
  onNotesChange?: (val: string) => void;
}

// ——— Main Component ———
export function StepObjectifs({
  objectifs,
  preferences,
  notesObjectifs = "",
  motif = null,
  onToggleObjectif,
  onTogglePreference,
  onNotesChange,
}: StepObjectifsProps) {
  const [showNotes, setShowNotes] = useState(notesObjectifs.length > 0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Progressive disclosure watermark
  const revealedUpTo = useMemo(() => {
    if (
      preferences.length > 0 ||
      notesObjectifs.length > 0 ||
      objectifs.length > 0
    ) {
      return 3;
    }
    return 1;
  }, [objectifs.length, preferences.length, notesObjectifs.length]);

  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const prevRevealedRef = useRef(revealedUpTo);

  // Auto-scroll on reveal
  useEffect(() => {
    const prev = prevRevealedRef.current;
    if (revealedUpTo > prev) {
      prevRevealedRef.current = revealedUpTo;
      const timer = setTimeout(() => {
        const targetRef = revealedUpTo === 3 ? section3Ref : null;
        targetRef?.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [revealedUpTo]);

  // Smart tip
  const smartTip = getSmartTip(objectifs, motif);

  // Auto-resize textarea
  const handleNotesInput = useCallback(
    (val: string) => {
      onNotesChange?.(val);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height =
          textareaRef.current.scrollHeight + "px";
      }
    },
    [onNotesChange]
  );

  const showSection2 = revealedUpTo >= 2;
  const showSection3 = revealedUpTo >= 3;

  // Get selected objectifs emojis for the summary
  const selectedEmojis = objectifs
    .map((o) => OBJECTIF_META.find((m) => m.label === o)?.emoji)
    .filter(Boolean);

  return (
    <div className="space-y-0">
      {/* ——— Section 1: Objectifs ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SectionHeader
          icon={Target}
          title="Qu'attendez-vous de ce RDV ?"
          subtitle="Sélectionnez tout ce qui s'applique"
          badge={
            <CompletionRing
              count={objectifs.length}
              max={OBJECTIFS.length}
              label={`objectif${objectifs.length !== 1 ? "s" : ""}`}
            />
          }
        />

        <div className="space-y-2">
          {OBJECTIF_META.map((meta, i) => (
            <ObjectifCard
              key={meta.label}
              meta={meta}
              selected={objectifs.includes(meta.label)}
              onToggle={() => onToggleObjectif(meta.label)}
              index={i}
            />
          ))}
        </div>

        {/* Selected summary badge */}
        <AnimatePresence>
          {objectifs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px] bg-[#5B1112]/[0.04]">
                <div className="w-[20px] h-[20px] rounded-full bg-[#5B1112] flex items-center justify-center">
                  <span
                    className="text-[10px] text-white"
                    style={{ fontWeight: 700 }}
                  >
                    {objectifs.length}
                  </span>
                </div>
                <span
                  className="text-[12px] text-[#5B1112]/70 tracking-[-0.1px]"
                  style={{ fontWeight: 500 }}
                >
                  {selectedEmojis.join(" ")} sélectionné
                  {objectifs.length > 1 ? "s" : ""}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Smart contextual tip */}
        <AnimatePresence>
          {smartTip && (
            <motion.div
              initial={{ opacity: 0, y: 8, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, y: -4, height: 0, marginTop: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-[16px]"
                style={{
                  background:
                    smartTip.type === "reassurance"
                      ? "linear-gradient(135deg, rgba(91, 17, 18, 0.03) 0%, rgba(254, 240, 213, 0.3) 100%)"
                      : smartTip.type === "tip"
                      ? "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.25) 100%)"
                      : "rgba(0, 65, 94, 0.03)",
                  border:
                    smartTip.type === "reassurance"
                      ? "1px solid rgba(91, 17, 18, 0.06)"
                      : "1px solid rgba(0, 65, 94, 0.08)",
                }}
              >
                <div
                  className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background:
                      smartTip.type === "reassurance"
                        ? "rgba(91, 17, 18, 0.08)"
                        : "rgba(0, 65, 94, 0.08)",
                  }}
                >
                  {smartTip.type === "reassurance" ? (
                    <Heart
                      className="w-[13px] h-[13px] text-[#5B1112]"
                      strokeWidth={1.8}
                    />
                  ) : (
                    <Lightbulb
                      className="w-[13px] h-[13px] text-[#00415E]"
                      strokeWidth={1.8}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <span
                    className="text-[10.5px] px-[6px] py-[2px] rounded-[5px] tracking-[-0.02px] inline-block mb-1"
                    style={{
                      background:
                        smartTip.type === "reassurance"
                          ? "rgba(91, 17, 18, 0.06)"
                          : "rgba(0, 65, 94, 0.06)",
                      color:
                        smartTip.type === "reassurance"
                          ? "rgba(91, 17, 18, 0.6)"
                          : "rgba(0, 65, 94, 0.6)",
                      fontWeight: 600,
                    }}
                  >
                    {smartTip.type === "reassurance"
                      ? "Bonne nouvelle"
                      : smartTip.type === "tip"
                      ? "Le saviez-vous ?"
                      : "Conseil"}
                  </span>
                  <p
                    className="text-[12.5px] leading-[1.5] tracking-[-0.05px]"
                    style={{
                      color:
                        smartTip.type === "reassurance"
                          ? "rgba(91, 17, 18, 0.65)"
                          : "rgba(0, 65, 94, 0.7)",
                      fontWeight: 450,
                    }}
                  >
                    {smartTip.message}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ——— Section 2: Préférences (progressive disclosure) ——— */}
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
                icon={SlidersHorizontal}
                title="Vos préférences"
                subtitle="Aide à personnaliser les recommandations (optionnel)"
                badge={
                  preferences.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1"
                    >
                      <span
                        className="text-[10px] px-[7px] py-[2px] rounded-full"
                        style={{
                          background: "rgba(0, 65, 94, 0.08)",
                          color: "rgba(0, 65, 94, 0.65)",
                          fontWeight: 650,
                        }}
                      >
                        {preferences.length}
                      </span>
                    </motion.div>
                  ) : undefined
                }
              />

              <div className="grid grid-cols-3 gap-2">
                {PREF_META.map((meta, i) => (
                  <PreferenceCard
                    key={meta.label}
                    meta={meta}
                    selected={preferences.includes(meta.label)}
                    onToggle={() => onTogglePreference(meta.label)}
                    index={i}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 3: Message personnel (progressive disclosure) ——— */}
      <AnimatePresence>
        {showSection3 && (
          <motion.div
            ref={section3Ref}
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
              {!showNotes ? (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowNotes(true)}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-[16px] cursor-pointer transition-colors duration-200 hover:bg-[rgba(17,18,20,0.02)]"
                  style={{ border: "1.5px dashed rgba(17,18,20,0.08)" }}
                >
                  <PenLine
                    className="w-[15px] h-[15px] text-[rgba(17,18,20,0.3)]"
                    strokeWidth={1.6}
                  />
                  <span
                    className="text-[13.5px] text-[rgba(17,18,20,0.4)] tracking-[-0.1px]"
                    style={{ fontWeight: 500 }}
                  >
                    Un message pour le Dr. Diallo ?
                  </span>
                  <ChevronDown
                    className="w-[13px] h-[13px] text-[rgba(17,18,20,0.2)]"
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
                  <SectionHeader
                    icon={PenLine}
                    title="Message personnel"
                    subtitle="Facultatif — partagez ce qui vous tient à cœur"
                  />
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={notesObjectifs}
                      onChange={(e) => handleNotesInput(e.target.value)}
                      placeholder="Ex : J'aimerais comprendre pourquoi mes taches reviennent malgré les crèmes, et trouver une routine simple et abordable..."
                      maxLength={500}
                      rows={3}
                      className="
                        w-full px-4 py-3.5 rounded-[16px] text-[14px] resize-none
                        bg-white border border-[rgba(17,18,20,0.07)]
                        text-[#111214] placeholder:text-[rgba(17,18,20,0.25)]
                        outline-none focus:ring-[1.5px] focus:ring-[#5B1112]/15
                        focus:border-[#5B1112]/15 transition-all duration-200
                      "
                      style={{
                        minHeight: 88,
                        lineHeight: 1.55,
                        fontWeight: 400,
                      }}
                    />
                    <div className="flex justify-end mt-1.5 pr-1">
                      <span
                        className="text-[11px] tracking-[-0.05px]"
                        style={{
                          color:
                            notesObjectifs.length > 400
                              ? "rgba(91, 17, 18, 0.6)"
                              : "rgba(17,18,20,0.2)",
                          fontWeight: 450,
                        }}
                      >
                        {notesObjectifs.length}/500
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Reassurance card */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 }}
                className="mt-4"
              >
                <div
                  className="flex items-start gap-3 px-4 py-3.5 rounded-[16px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.15) 100%)",
                    border: "1px solid rgba(0, 65, 94, 0.06)",
                  }}
                >
                  <div className="w-[28px] h-[28px] rounded-[9px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0">
                    <Heart
                      className="w-[14px] h-[14px] text-[#00415E]"
                      strokeWidth={1.7}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[13px] text-[#00415E]/70 tracking-[-0.1px]"
                      style={{ fontWeight: 580 }}
                    >
                      Consultation sur mesure
                    </p>
                    <p
                      className="text-[11.5px] text-[#00415E]/40 leading-[1.5] mt-0.5 tracking-[-0.05px]"
                      style={{ fontWeight: 420 }}
                    >
                      Le Dr. Diallo lira vos réponses avant la consultation
                      pour vous offrir un accompagnement personnalisé dès la
                      première minute.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
