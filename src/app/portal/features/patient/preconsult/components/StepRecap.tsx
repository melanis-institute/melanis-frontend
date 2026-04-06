import { useState, useEffect, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit3,
  MapPin,
  Clock,
  Zap,
  Heart,
  Camera,
  Target,
  Check,
  ShieldCheck,
  FileCheck2,
  Stethoscope,
  Sparkles,
  AlertCircle,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import { MOTIFS, DUREES, INTENSITE_LABELS, TYPES_PEAU } from "./recapHelpers";
import type { PreConsultData } from "./types";

// ——— Completeness calculator ———
function computeCompleteness(data: PreConsultData) {
  const fields: { key: string; filled: boolean; weight: number }[] = [
    { key: "motif", filled: data.motif != null, weight: 15 },
    { key: "zones", filled: (data.zones?.length ?? 0) > 0, weight: 10 },
    { key: "symptomes", filled: (data.symptomes?.length ?? 0) > 0, weight: 15 },
    { key: "duree", filled: data.duree != null, weight: 8 },
    { key: "peau", filled: data.peauSensible != null, weight: 10 },
    { key: "objectifs", filled: (data.objectifs?.length ?? 0) > 0, weight: 12 },
    { key: "photos", filled: (data.photos?.length ?? 0) > 0, weight: 8 },
    { key: "historique", filled: data.dejaEuProbleme != null, weight: 10 },
    { key: "notes", filled: (data.notesSymptomes?.length ?? 0) > 0 || (data.notesObjectifs?.length ?? 0) > 0, weight: 6 },
    { key: "preferences", filled: (data.preferences?.length ?? 0) > 0, weight: 6 },
  ];
  const totalWeight = fields.reduce((s, f) => s + f.weight, 0);
  const filledWeight = fields.reduce((s, f) => s + (f.filled ? f.weight : 0), 0);
  const pct = Math.round((filledWeight / totalWeight) * 100);
  const filledCount = fields.filter((f) => f.filled).length;
  return { pct, filledCount, total: fields.length, fields };
}

// ——— Smart summary message ———
function getSummaryMessage(pct: number): { emoji: string; title: string; subtitle: string; accentColor: string } {
  if (pct >= 90) return {
    emoji: "🌟",
    title: "Dossier excellent !",
    subtitle: "Le Dr. Diallo aura toutes les infos pour une consultation optimale.",
    accentColor: "#00415E",
  };
  if (pct >= 70) return {
    emoji: "👍",
    title: "Très bon dossier",
    subtitle: "Quelques détails optionnels pourraient encore aider le diagnostic.",
    accentColor: "#00415E",
  };
  if (pct >= 50) return {
    emoji: "📋",
    title: "Dossier en bonne voie",
    subtitle: "Pensez à compléter les sections manquantes pour un meilleur suivi.",
    accentColor: "#5B1112",
  };
  return {
    emoji: "✏️",
    title: "Dossier à compléter",
    subtitle: "Plus le dossier est complet, meilleur sera le diagnostic.",
    accentColor: "#5B1112",
  };
}

// ——— Animated completion ring (large) ———
function LargeCompletionRing({ pct, emoji }: { pct: number; emoji: string }) {
  const r = 38;
  const circ = 2 * Math.PI * r;

  const color =
    pct >= 90 ? "#00415E" : pct >= 70 ? "#00415E" : pct >= 50 ? "#5B1112" : "#5B1112";

  return (
    <div className="relative w-[96px] h-[96px] flex items-center justify-center">
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(17,18,20,0.05)"
          strokeWidth="5"
        />
        <motion.circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
        />
      </svg>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <span className="text-[24px] leading-none">{emoji}</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-[13px] mt-0.5 tracking-[-0.2px]"
          style={{ color, fontWeight: 700 }}
        >
          {pct}%
        </motion.span>
      </motion.div>
    </div>
  );
}

// ——— Section Group ———
function SectionGroup({
  icon: Icon,
  title,
  accentColor,
  children,
  index,
  defaultExpanded = true,
}: {
  icon: LucideIcon;
  title: string;
  accentColor: string;
  children: ReactNode;
  index: number;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: 0.15 + index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Group header — tappable */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 mb-2 cursor-pointer group"
      >
        <div
          className="w-[28px] h-[28px] rounded-[9px] flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: `${accentColor}0D` }}
        >
          <Icon
            className="w-[14px] h-[14px] transition-colors"
            style={{ color: accentColor }}
            strokeWidth={1.8}
          />
        </div>
        <span
          className="text-[13px] tracking-[-0.1px] flex-1 text-left"
          style={{ color: `${accentColor}CC`, fontWeight: 620 }}
        >
          {title}
        </span>
        <motion.div
          animate={{ rotate: expanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown
            className="w-[14px] h-[14px]"
            style={{ color: "rgba(17,18,20,0.2)" }}
            strokeWidth={1.5}
          />
        </motion.div>
      </button>

      {/* Group body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ——— Recap Item Card ———
function RecapItem({
  icon: Icon,
  title,
  children,
  onEdit,
  status,
  index,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  onEdit: () => void;
  status: "complete" | "partial" | "empty";
  index: number;
}) {
  const statusColors = {
    complete: { bg: "rgba(0, 65, 94, 0.07)", icon: "#00415E" },
    partial: { bg: "rgba(91, 17, 18, 0.07)", icon: "#5B1112" },
    empty: { bg: "rgba(91, 17, 18, 0.07)", icon: "#5B1112" },
  };
  const sc = statusColors[status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        ease: "easeOut",
      }}
      className="relative flex items-start gap-3 p-3.5 rounded-[16px] bg-white overflow-hidden group"
      style={{
        boxShadow:
          "0 1px 3px rgba(17,18,20,0.03), 0 2px 8px rgba(17,18,20,0.02)",
      }}
    >
      {/* Left accent */}
      <div
        className="absolute left-0 top-[10px] bottom-[10px] w-[2.5px] rounded-r-full"
        style={{ background: sc.icon, opacity: 0.35 }}
      />

      {/* Status icon */}
      <div
        className="flex-shrink-0 w-[32px] h-[32px] rounded-[10px] flex items-center justify-center"
        style={{ background: sc.bg }}
      >
        <Icon
          className="w-[15px] h-[15px]"
          style={{ color: sc.icon }}
          strokeWidth={1.7}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-[1px]">
        <div className="flex items-center gap-2">
          <p
            className="text-[12px] tracking-[-0.1px]"
            style={{ color: "rgba(17,18,20,0.45)", fontWeight: 520 }}
          >
            {title}
          </p>
          {status === "complete" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Check
                className="w-[11px] h-[11px]"
                style={{ color: "#00415E" }}
                strokeWidth={2.5}
              />
            </motion.div>
          )}
          {status === "empty" && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <AlertCircle
                className="w-[11px] h-[11px]"
                style={{ color: "#5B1112" }}
                strokeWidth={2}
              />
              <span
                className="text-[10px]"
                style={{ color: "rgba(91, 17, 18, 0.5)", fontWeight: 550 }}
              >
                optionnel
              </span>
            </motion.div>
          )}
        </div>
        <div className="mt-1">{children}</div>
      </div>

      {/* Edit button */}
      <button
        onClick={onEdit}
        className="flex-shrink-0 w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(17,18,20,0.04)] active:scale-95 transition-all mt-0.5"
      >
        <Edit3
          className="w-[13px] h-[13px] text-[rgba(17,18,20,0.25)] group-hover:text-[rgba(17,18,20,0.45)] transition-colors"
          strokeWidth={1.7}
        />
      </button>
    </motion.div>
  );
}

// ——— Value display components ———
function TextValue({ text }: { text: string }) {
  return (
    <p
      className="text-[14px] text-[#111214]/80 leading-[1.45] tracking-[-0.1px]"
      style={{ fontWeight: 480 }}
    >
      {text}
    </p>
  );
}

function PillRow({ items, accentColor }: { items: string[]; accentColor: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-0.5">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[11.5px] tracking-[-0.05px]"
          style={{
            background: `${accentColor}0A`,
            color: `${accentColor}BB`,
            fontWeight: 550,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function IntensityDots({ value }: { value: number }) {
  const colors = ["#00415E", "#00415E", "#5B1112", "#5B1112", "#5B1112"];
  return (
    <div className="flex items-center gap-1.5 mt-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          initial={{ scale: 0 }}
          animate={{
            scale: 1,
            width: i <= value ? 8 : 5,
            height: i <= value ? 8 : 5,
          }}
          transition={{ duration: 0.2, delay: i * 0.05 }}
          style={{
            background: i <= value ? colors[i - 1] : "rgba(17,18,20,0.1)",
          }}
        />
      ))}
      <span
        className="text-[11.5px] ml-1 tracking-[-0.05px]"
        style={{
          color: colors[Math.min(value, 5) - 1],
          fontWeight: 580,
        }}
      >
        {INTENSITE_LABELS[value] ?? ""}
      </span>
    </div>
  );
}

function PhotoCount({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <div className="flex -space-x-2">
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="w-[24px] h-[24px] rounded-[7px] border-2 border-white flex items-center justify-center"
            style={{ background: "rgba(0, 65, 94, 0.08)" }}
          >
            <Camera
              className="w-[10px] h-[10px] text-[#00415E]/40"
              strokeWidth={1.8}
            />
          </motion.div>
        ))}
      </div>
      <span
        className="text-[12.5px] text-[#111214]/60 tracking-[-0.05px]"
        style={{ fontWeight: 500 }}
      >
        {count} photo{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

// ——— Consent toggle ———
function ConsentToggle({
  checked,
  onChange,
  icon: Icon,
  label,
  index,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  icon: LucideIcon;
  label: string;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
      onClick={() => onChange(!checked)}
      className={`
        w-full flex items-start gap-3.5 p-4 rounded-[18px] cursor-pointer
        text-left transition-all duration-250 overflow-hidden relative
        ${checked ? "ring-[1.5px] ring-[#00415E]/20" : ""}
      `}
      style={{
        background: checked
          ? "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.15) 100%)"
          : "white",
        boxShadow: checked
          ? "none"
          : "0 1px 3px rgba(17,18,20,0.03), 0 2px 6px rgba(17,18,20,0.02)",
      }}
    >
      {/* Left accent bar */}
      <motion.div
        className="absolute left-0 top-[12px] bottom-[12px] w-[2.5px] rounded-r-full"
        initial={false}
        animate={{
          scaleY: checked ? 1 : 0,
          opacity: checked ? 0.5 : 0,
        }}
        transition={{ duration: 0.25 }}
        style={{ background: "#00415E", transformOrigin: "center" }}
      />

      {/* Icon */}
      <div
        className="flex-shrink-0 w-[30px] h-[30px] rounded-[9px] flex items-center justify-center mt-0.5 transition-colors"
        style={{
          background: checked
            ? "rgba(0, 65, 94, 0.1)"
            : "rgba(17, 18, 20, 0.04)",
        }}
      >
        <Icon
          className="w-[14px] h-[14px] transition-colors"
          style={{
            color: checked ? "#00415E" : "rgba(17, 18, 20, 0.3)",
          }}
          strokeWidth={1.7}
        />
      </div>

      {/* Label */}
      <span
        className="flex-1 text-[13px] leading-[1.55] tracking-[-0.05px] transition-colors pt-[5px]"
        style={{
          color: checked ? "rgba(0, 65, 94, 0.75)" : "rgba(17, 18, 20, 0.55)",
          fontWeight: checked ? 500 : 450,
        }}
      >
        {label}
      </span>

      {/* Checkbox */}
      <div className="flex-shrink-0 mt-1">
        <motion.div
          className="w-[24px] h-[24px] rounded-[8px] flex items-center justify-center"
          initial={false}
          animate={{
            backgroundColor: checked ? "#00415E" : "transparent",
            borderColor: checked
              ? "#00415E"
              : "rgba(17, 18, 20, 0.15)",
          }}
          transition={{ duration: 0.2 }}
          style={{
            border: checked ? "none" : "1.5px solid rgba(17,18,20,0.15)",
          }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 22,
                }}
              >
                <Check
                  className="w-[14px] h-[14px] text-white"
                  strokeWidth={2.5}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.button>
  );
}

// ——— Divider ———
function SectionDivider({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-[1px] mx-3 my-3 origin-center"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(91,17,18,0.05) 30%, rgba(0,65,94,0.05) 70%, transparent 100%)",
      }}
    />
  );
}

// ——— Props ———
interface StepRecapProps {
  data: PreConsultData;
  onEdit: (step: number) => void;
  onConsentDonneesChange: (val: boolean) => void;
  onConsentExactitudeChange: (val: boolean) => void;
}

// ——— Main Component ———
export function StepRecap({
  data,
  onEdit,
  onConsentDonneesChange,
  onConsentExactitudeChange,
}: StepRecapProps) {
  const completeness = useMemo(() => computeCompleteness(data), [data]);
  const summary = useMemo(
    () => getSummaryMessage(completeness.pct),
    [completeness.pct]
  );

  // ——— Derived labels ———
  const motifLabel =
    MOTIFS.find((m) => m.key === data.motif)?.label ??
    (data.motifAutre || "Non renseigné");

  const dureeLabel =
    DUREES.find((d) => d.key === data.duree)?.label ?? "Non renseigné";

  const peauParts: string[] = [];
  if (data.peauSensible !== null)
    peauParts.push(data.peauSensible ? "Sensible" : "Non sensible");
  if (data.typePeau) {
    const tl = TYPES_PEAU.find((t) => t.key === data.typePeau)?.label;
    if (tl) peauParts.push(tl);
  }

  const historiqueItems: string[] = [];
  if (data.dejaEuProbleme === true) historiqueItems.push("Récurrent");
  if (data.dejaEuProbleme === false) historiqueItems.push("Première fois");
  if (data.dejaConsulte === true) historiqueItems.push("Déjà consulté");
  if ((data.traitements?.length ?? 0) > 0)
    historiqueItems.push(`Traitements: ${data.traitements.join(", ")}`);
  if (data.allergies === true)
    historiqueItems.push(
      `Allergies${data.allergiesDetail ? `: ${data.allergiesDetail}` : ""}`
    );
  if (data.medicaments === true)
    historiqueItems.push(
      `Médicaments${data.medicamentsDetail ? `: ${data.medicamentsDetail}` : ""}`
    );

  // ——— Animated reveal of sections ———
  const [showConsent, setShowConsent] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShowConsent(true), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-0">
      {/* ——— Hero completion section ——— */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center text-center mb-2"
      >
        <LargeCompletionRing pct={completeness.pct} emoji={summary.emoji} />

        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          className="mt-2"
        >
          <p
            className="text-[16px] tracking-[-0.3px]"
            style={{ color: summary.accentColor, fontWeight: 650 }}
          >
            {summary.title}
          </p>
          <p
            className="text-[12.5px] text-[#111214]/40 leading-[1.5] mt-1 max-w-[280px] mx-auto tracking-[-0.05px]"
            style={{ fontWeight: 430 }}
          >
            {summary.subtitle}
          </p>
        </motion.div>

        {/* Completion stats */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.7 }}
          className="flex items-center gap-3 mt-3 px-4 py-2 rounded-full"
          style={{ background: "rgba(17,18,20,0.025)" }}
        >
          <span
            className="text-[11.5px] tracking-[-0.05px]"
            style={{ color: "rgba(17,18,20,0.4)", fontWeight: 500 }}
          >
            {completeness.filledCount}/{completeness.total} sections
          </span>
          <div className="w-[1px] h-[12px] bg-[rgba(17,18,20,0.08)]" />
          <span
            className="text-[11.5px] tracking-[-0.05px]"
            style={{ color: "rgba(17,18,20,0.4)", fontWeight: 500 }}
          >
            Tout modifiable
          </span>
        </motion.div>
      </motion.div>

      <SectionDivider delay={0.3} />

      {/* ——— Group 1: Votre consultation ——— */}
      <SectionGroup
        icon={Stethoscope}
        title="Votre consultation"
        accentColor="#5B1112"
        index={0}
      >
        <RecapItem
          icon={Target}
          title="Motif"
          onEdit={() => onEdit(1)}
          status={data.motif ? "complete" : "empty"}
          index={0}
        >
          <TextValue text={motifLabel} />
        </RecapItem>

        <RecapItem
          icon={MapPin}
          title="Zones concernées"
          onEdit={() => onEdit(2)}
          status={
            (data.zones?.length ?? 0) > 0 ? "complete" : "empty"
          }
          index={1}
        >
          {(data.zones?.length ?? 0) > 0 ? (
            <PillRow items={data.zones} accentColor="#5B1112" />
          ) : (
            <TextValue text="Non renseigné" />
          )}
        </RecapItem>
      </SectionGroup>

      <SectionDivider delay={0.4} />

      {/* ——— Group 2: Vos symptômes ——— */}
      <SectionGroup
        icon={Zap}
        title="Vos symptômes"
        accentColor="#00415E"
        index={1}
      >
        <RecapItem
          icon={Zap}
          title="Symptômes ressentis"
          onEdit={() => onEdit(3)}
          status={(data.symptomes?.length ?? 0) > 0 ? "complete" : "empty"}
          index={0}
        >
          {(data.symptomes?.length ?? 0) > 0 ? (
            <PillRow items={data.symptomes} accentColor="#00415E" />
          ) : (
            <TextValue text="Aucun symptôme sélectionné" />
          )}
        </RecapItem>

        <RecapItem
          icon={Clock}
          title="Durée & Intensité"
          onEdit={() => onEdit(3)}
          status={data.duree ? "complete" : "partial"}
          index={1}
        >
          <div className="space-y-1.5">
            <TextValue text={`Depuis ${dureeLabel.toLowerCase()}`} />
            <IntensityDots value={data.intensite} />
          </div>
        </RecapItem>

        {data.notesSymptomes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div
              className="px-3.5 py-3 rounded-[14px] mt-1"
              style={{
                background: "rgba(0, 65, 94, 0.025)",
                border: "1px solid rgba(0, 65, 94, 0.06)",
              }}
            >
              <p
                className="text-[11.5px] text-[#00415E]/40 mb-1"
                style={{ fontWeight: 550 }}
              >
                Notes
              </p>
              <p
                className="text-[12.5px] text-[#00415E]/60 leading-[1.5] italic"
                style={{ fontWeight: 420 }}
              >
                &ldquo;{data.notesSymptomes}&rdquo;
              </p>
            </div>
          </motion.div>
        )}
      </SectionGroup>

      <SectionDivider delay={0.5} />

      {/* ——— Group 3: Votre profil ——— */}
      <SectionGroup
        icon={Heart}
        title="Votre profil santé"
        accentColor="#00415E"
        index={2}
      >
        <RecapItem
          icon={Stethoscope}
          title="Historique médical"
          onEdit={() => onEdit(4)}
          status={
            data.dejaEuProbleme !== null ? "complete" : "partial"
          }
          index={0}
        >
          {historiqueItems.length > 0 ? (
            <div className="space-y-1">
              {historiqueItems.map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <div className="w-[4px] h-[4px] rounded-full bg-[#00415E]/30 mt-[7px] flex-shrink-0" />
                  <span
                    className="text-[13px] text-[#111214]/65 leading-[1.4] tracking-[-0.05px]"
                    style={{ fontWeight: 450 }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <TextValue text="Aucune info renseignée" />
          )}
        </RecapItem>

        <RecapItem
          icon={Heart}
          title="Type de peau"
          onEdit={() => onEdit(5)}
          status={data.peauSensible !== null ? "complete" : "partial"}
          index={1}
        >
          {peauParts.length > 0 ? (
            <PillRow items={peauParts} accentColor="#00415E" />
          ) : (
            <TextValue text="Non renseigné" />
          )}
        </RecapItem>

        <RecapItem
          icon={Camera}
          title="Photos"
          onEdit={() => onEdit(6)}
          status={
            (data.photos?.length ?? 0) > 0 ? "complete" : "empty"
          }
          index={2}
        >
          {(data.photos?.length ?? 0) > 0 ? (
            <PhotoCount count={data.photos.length} />
          ) : (
            <TextValue text="Aucune photo ajoutée" />
          )}
        </RecapItem>
      </SectionGroup>

      <SectionDivider delay={0.6} />

      {/* ——— Group 4: Vos objectifs ——— */}
      <SectionGroup
        icon={Sparkles}
        title="Vos attentes"
        accentColor="#5B1112"
        index={3}
      >
        <RecapItem
          icon={Target}
          title="Objectifs"
          onEdit={() => onEdit(7)}
          status={(data.objectifs?.length ?? 0) > 0 ? "complete" : "empty"}
          index={0}
        >
          {(data.objectifs?.length ?? 0) > 0 ? (
            <PillRow items={data.objectifs} accentColor="#5B1112" />
          ) : (
            <TextValue text="Non renseigné" />
          )}
        </RecapItem>

        {(data.preferences?.length ?? 0) > 0 && (
          <RecapItem
            icon={Heart}
            title="Préférences"
            onEdit={() => onEdit(7)}
            status="complete"
            index={1}
          >
            <PillRow items={data.preferences} accentColor="#00415E" />
          </RecapItem>
        )}

        {data.notesObjectifs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
          >
            <div
              className="px-3.5 py-3 rounded-[14px] mt-1"
              style={{
                background: "rgba(91, 17, 18, 0.025)",
                border: "1px solid rgba(91, 17, 18, 0.06)",
              }}
            >
              <p
                className="text-[11.5px] text-[#5B1112]/40 mb-1"
                style={{ fontWeight: 550 }}
              >
                Message au Dr. Diallo
              </p>
              <p
                className="text-[12.5px] text-[#5B1112]/60 leading-[1.5] italic"
                style={{ fontWeight: 420 }}
              >
                &ldquo;{data.notesObjectifs}&rdquo;
              </p>
            </div>
          </motion.div>
        )}
      </SectionGroup>

      <SectionDivider delay={0.65} />

      {/* ——— Consent Section ——— */}
      <AnimatePresence>
        {showConsent && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Section header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-[28px] h-[28px] rounded-[9px] flex items-center justify-center"
                style={{ background: "rgba(0, 65, 94, 0.08)" }}
              >
                <ShieldCheck
                  className="w-[14px] h-[14px] text-[#00415E]"
                  strokeWidth={1.8}
                />
              </div>
              <span
                className="text-[13px] tracking-[-0.1px]"
                style={{ color: "rgba(0, 65, 94, 0.7)", fontWeight: 620 }}
              >
                Consentement
              </span>
            </div>

            <div className="space-y-2.5">
              <ConsentToggle
                checked={data.consentDonnees}
                onChange={onConsentDonneesChange}
                icon={ShieldCheck}
                label="J'accepte le traitement de mes données de santé dans le cadre de cette consultation."
                index={0}
              />
              <ConsentToggle
                checked={data.consentExactitude}
                onChange={onConsentExactitudeChange}
                icon={FileCheck2}
                label="Je confirme que les informations fournies sont exactes à ma connaissance."
                index={1}
              />
            </div>

            {/* Both consents checked → reassurance card */}
            <AnimatePresence>
              {data.consentDonnees && data.consentExactitude && (
                <motion.div
                  initial={{ opacity: 0, y: 8, height: 0, marginTop: 0 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    height: "auto",
                    marginTop: 14,
                  }}
                  exit={{ opacity: 0, y: -4, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-start gap-3 px-4 py-4 rounded-[18px]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.2) 100%)",
                      border: "1px solid rgba(0, 65, 94, 0.08)",
                    }}
                  >
                    <div className="w-[30px] h-[30px] rounded-[10px] bg-[#00415E]/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles
                        className="w-[15px] h-[15px] text-[#00415E]"
                        strokeWidth={1.7}
                      />
                    </div>
                    <div>
                      <p
                        className="text-[13.5px] text-[#00415E]/80 tracking-[-0.1px]"
                        style={{ fontWeight: 600 }}
                      >
                        Prêt pour votre consultation !
                      </p>
                      <p
                        className="text-[12px] text-[#00415E]/45 leading-[1.55] mt-1 tracking-[-0.05px]"
                        style={{ fontWeight: 420 }}
                      >
                        Le Dr. Diallo recevra ce dossier avant votre rendez-vous pour vous offrir un accompagnement personnalisé dès la première minute.
                      </p>
                    </div>
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