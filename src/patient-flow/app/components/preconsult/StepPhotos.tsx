import { useState, useEffect, useMemo, useRef, type ReactNode, type ComponentType, type SVGProps } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  ImagePlus,
  Lightbulb,
  CheckCircle2,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import {
  IconLumiereNaturelle,
  IconPasDeFiltre,
  IconPhotoClose,
  IconPhotoWide,
  IconCamera,
  IconGalerie,
  IconPrivacy,
  IconSkipPhoto,
} from "./photo-icons";

// ——— Custom icon type ———
type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

// ——— Photo item ———
interface PhotoItem {
  id: string;
  url: string;
  name: string;
}

// ——— Max photos ———
const MAX_PHOTOS = 4;

// ——— Photo tips data ———
const PHOTO_TIPS: { icon: SvgIcon; title: string; description: string; accentColor: string }[] = [
  {
    icon: IconLumiereNaturelle,
    title: "Lumière naturelle",
    description: "Près d'une fenêtre, sans flash",
    accentColor: "#5B1112",
  },
  {
    icon: IconPasDeFiltre,
    title: "Sans filtre",
    description: "Photo brute, sans retouche",
    accentColor: "#00415E",
  },
  {
    icon: IconPhotoClose,
    title: "1 photo de près",
    description: "Détails de la lésion visibles",
    accentColor: "#00415E",
  },
  {
    icon: IconPhotoWide,
    title: "1 photo de loin",
    description: "Contexte de la zone touchée",
    accentColor: "#5B1112",
  },
];

// ——— Motif-based contextual advice ———
function getMotifAdvice(motif: string | null): string | null {
  switch (motif) {
    case "acne":
      return "Photographiez les zones avec boutons en lumière naturelle — évitez le flash qui aplatit les reliefs.";
    case "taches":
      return "Prenez une photo rapprochée des taches pour montrer leur taille, forme et couleur exacte.";
    case "eczema":
      return "Capturez la texture de la peau (sécheresse, desquamation) avec une photo de près bien éclairée.";
    case "rougeurs":
      return "Les rougeurs sont mieux visibles en lumière naturelle. Évitez tout filtre qui modifie la couleur.";
    case "cheveux":
      return "Photographiez la zone de perte de cheveux et la ligne frontale pour montrer l'étendue.";
    case "mycose":
      return "Montrez les bords de la lésion en photo rapprochée — cela aide beaucoup au diagnostic.";
    case "grain":
      return "Photographiez le grain de beauté avec un objet de référence (pièce, règle) pour l'échelle.";
    default:
      return null;
  }
}

// ——— Zone-specific photo tips ———
interface ZoneTip {
  zone: string;
  tip: string;
  emoji: string;
}

const ZONE_TIPS: Record<string, { tip: string; emoji: string }> = {
  "Visage": { tip: "Prenez une photo de face et de profil", emoji: "😊" },
  "Cuir chevelu": { tip: "Écartez les cheveux pour montrer la zone", emoji: "💇" },
  "Corps": { tip: "Incluez une photo d'ensemble du torse ou du dos", emoji: "🧍" },
  "Mains": { tip: "Photographiez le dos et la paume des mains", emoji: "🤲" },
  "Pieds": { tip: "Montrez le dessus et la plante du pied", emoji: "🦶" },
  "Ongles": { tip: "Photo rapprochée de l'ongle, bien éclairée", emoji: "💅" },
  "Zones intimes": { tip: "Photo discrète, cadrée uniquement sur la zone", emoji: "🔒" },
};

// ——— Smart motif × zone cross-tips ———
const MOTIF_ZONE_COMBOS: Record<string, Record<string, string>> = {
  acne: {
    "Visage": "Pour l'acné du visage, photographiez front, joues et menton séparément si possible.",
    "Corps": "L'acné du dos est fréquente — demandez de l'aide pour photographier les zones difficiles.",
  },
  eczema: {
    "Mains": "Montrez la texture de l'eczéma sur les mains : dos de la main et entre les doigts.",
    "Visage": "Pour l'eczéma du visage, une photo de face au naturel montre bien les rougeurs et la sécheresse.",
    "Corps": "Les plis (coudes, genoux) sont souvent touchés — photographiez-les dépliés et pliés.",
  },
  taches: {
    "Visage": "Les taches du visage se voient mieux en lumière naturelle latérale (près d'une fenêtre, de profil).",
    "Mains": "Photographiez le dos des mains à plat, bien éclairées, pour montrer la répartition.",
    "Corps": "Incluez une photo large pour montrer la distribution des taches sur le corps.",
  },
  rougeurs: {
    "Visage": "Photographiez de face, sans maquillage, pour montrer la localisation exacte des rougeurs.",
    "Corps": "Montrez les contours de la zone rouge — cela aide à distinguer les différentes causes.",
  },
  mycose: {
    "Pieds": "Photographiez entre les orteils et sous le pied — les mycoses s'y cachent souvent.",
    "Ongles": "Montrez l'ongle entier de face et de profil pour évaluer l'épaississement ou la décoloration.",
    "Corps": "Photographiez le bord de la lésion en gros plan — la forme circulaire est un indice clé.",
  },
  grain: {
    "Visage": "Photographiez le grain de beauté de très près avec la règle ABCDE en tête (Asymétrie, Bords, Couleur, Diamètre, Évolution).",
    "Corps": "Si le grain de beauté est dans le dos, demandez à quelqu'un de le photographier de près.",
  },
  cheveux: {
    "Cuir chevelu": "Photographiez le cuir chevelu en écartant les cheveux et montrez aussi la ligne frontale vue de dessus.",
  },
};

function getZoneTips(zones: string[]): ZoneTip[] {
  return zones
    .filter((z) => ZONE_TIPS[z])
    .map((z) => ({
      zone: z,
      tip: ZONE_TIPS[z].tip,
      emoji: ZONE_TIPS[z].emoji,
    }));
}

function getCrossAdvice(motif: string | null, zones: string[]): string | null {
  if (!motif || zones.length === 0) return null;
  const motifCombos = MOTIF_ZONE_COMBOS[motif];
  if (!motifCombos) return null;
  for (const z of zones) {
    if (motifCombos[z]) return motifCombos[z];
  }
  return null;
}

// ——— Smart feedback based on photo count ———
function getPhotoFeedback(count: number, isVideo: boolean): {
  message: string;
  type: "info" | "good" | "great";
} {
  if (count === 0) {
    return {
      message: isVideo
        ? "Pour une vidéo consultation, les photos sont fortement recommandées pour préparer le diagnostic."
        : "Les photos aident le dermatologue à préparer votre consultation, même en présentiel.",
      type: "info",
    };
  }
  if (count === 1) {
    return {
      message: "Bon début ! Ajoutez une 2e photo (de loin ou de près) pour un meilleur aperçu.",
      type: "good",
    };
  }
  if (count === 2) {
    return {
      message: "Très bien ! 2 photos c'est déjà utile. Vous pouvez en ajouter jusqu'à 4.",
      type: "good",
    };
  }
  if (count === 3) {
    return {
      message: "Excellent ! Vous pouvez encore ajouter 1 photo si besoin.",
      type: "great",
    };
  }
  return {
    message: "Parfait ! 4 photos, le Dr. Diallo aura tout ce qu'il faut pour préparer la consultation.",
    type: "great",
  };
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

// ——— Photo Count Ring ———
function PhotoCountRing({ count, max }: { count: number; max: number }) {
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
          color: count > 0 ? "#00415E" : "rgba(17,18,20,0.35)",
          fontWeight: count > 0 ? 600 : 450,
        }}
      >
        {count}/{max}
      </span>
    </motion.div>
  );
}

// ——— Tip Card ———
function TipCard({
  icon: Icon,
  title,
  description,
  accentColor,
  index,
}: {
  icon: SvgIcon;
  title: string;
  description: string;
  accentColor: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-start gap-2.5 p-3 rounded-[14px] bg-white"
      style={{
        boxShadow: "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
      }}
    >
      <div
        className="w-[32px] h-[32px] rounded-[10px] flex items-center justify-center flex-shrink-0 mt-[1px]"
        style={{ background: `${accentColor}0C` }}
      >
        <Icon
          className="w-[16px] h-[16px]"
          style={{ color: accentColor }}
        />
      </div>
      <div className="min-w-0">
        <p
          className="text-[13px] text-[#111214]/75 tracking-[-0.1px]"
          style={{ fontWeight: 580 }}
        >
          {title}
        </p>
        <p
          className="text-[11px] text-[#111214]/35 tracking-[-0.05px] mt-[1px] leading-[1.3]"
          style={{ fontWeight: 420 }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ——— Photo Slot ———
function PhotoSlot({
  filled,
  index,
}: {
  filled: boolean;
  index: number;
}) {
  return (
    <motion.div
      className="flex flex-col items-center gap-1"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
    >
      <motion.div
        className="w-[10px] h-[10px] rounded-full"
        initial={false}
        animate={{
          backgroundColor: filled ? "#00415E" : "rgba(17, 18, 20, 0.08)",
          scale: filled ? [1, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
    </motion.div>
  );
}

// ——— Upload Button Card ———
function UploadCard({
  icon: Icon,
  label,
  sublabel,
  onClick,
  isPrimary,
  index,
  disabled,
}: {
  icon: SvgIcon;
  label: string;
  sublabel: string;
  onClick: () => void;
  isPrimary: boolean;
  index: number;
  disabled: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileTap={disabled ? {} : { scale: 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 relative flex flex-col items-center gap-2 py-5 px-3 rounded-[18px] cursor-pointer
        transition-all duration-250 overflow-hidden
        ${disabled ? "opacity-40 cursor-not-allowed" : ""}
      `}
      style={{
        backgroundColor: isPrimary ? "rgba(91, 17, 18, 0.03)" : "white",
        boxShadow: isPrimary
          ? "inset 0 0 0 1.5px rgba(91, 17, 18, 0.1)"
          : "0 1px 4px rgba(17,18,20,0.04), 0 0.5px 1.5px rgba(17,18,20,0.03)",
        minHeight: 110,
      }}
    >
      <motion.div
        className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center"
        style={{
          background: isPrimary
            ? "linear-gradient(135deg, rgba(91, 17, 18, 0.08) 0%, rgba(0, 65, 94, 0.06) 100%)"
            : "rgba(17, 18, 20, 0.03)",
        }}
      >
        <Icon
          className="w-[22px] h-[22px]"
          style={{
            color: isPrimary ? "#5B1112" : "rgba(17, 18, 20, 0.4)",
          }}
        />
      </motion.div>
      <div className="text-center">
        <span
          className="text-[14px] tracking-[-0.15px] block"
          style={{
            color: isPrimary ? "#5B1112" : "rgba(17, 18, 20, 0.65)",
            fontWeight: isPrimary ? 600 : 520,
          }}
        >
          {label}
        </span>
        <span
          className="text-[11px] mt-0.5 block tracking-[-0.05px]"
          style={{
            color: isPrimary ? "rgba(91, 17, 18, 0.45)" : "rgba(17, 18, 20, 0.3)",
            fontWeight: 420,
          }}
        >
          {sublabel}
        </span>
      </div>
    </motion.button>
  );
}

// ——— Photo Preview Card ———
function PhotoPreview({
  photo,
  index,
  onRemove,
}: {
  photo: PhotoItem;
  index: number;
  onRemove: () => void;
}) {
  const labels = ["Photo 1", "Photo 2", "Photo 3", "Photo 4"];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -8 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative group"
    >
      <div
        className="aspect-square rounded-[16px] overflow-hidden"
        style={{
          boxShadow: "0 2px 8px rgba(17,18,20,0.06), 0 1px 3px rgba(17,18,20,0.04)",
        }}
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay at bottom */}
        <div
          className="absolute inset-x-0 bottom-0 h-[40%] pointer-events-none"
          style={{
            background: "linear-gradient(transparent, rgba(17,18,20,0.35))",
          }}
        />
        {/* Label */}
        <div className="absolute bottom-2 left-2.5">
          <span
            className="text-[11px] text-white/90 tracking-[-0.05px]"
            style={{ fontWeight: 550 }}
          >
            {labels[index] || `Photo ${index + 1}`}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-[26px] h-[26px] rounded-full flex items-center justify-center cursor-pointer z-10"
        style={{
          background: "rgba(17,18,20,0.7)",
          backdropFilter: "blur(4px)",
          boxShadow: "0 2px 6px rgba(17,18,20,0.2)",
        }}
      >
        <X className="w-[12px] h-[12px] text-white" strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  );
}

// ——— Props ———
interface StepPhotosProps {
  photos: PhotoItem[];
  appointmentType: "presentiel" | "video";
  motif?: string | null;
  zones?: string[];
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (id: string) => void;
}

// ——— Main Component ———
export function StepPhotos({
  photos,
  appointmentType,
  motif = null,
  zones = [],
  onAddPhotos,
  onRemovePhoto,
}: StepPhotosProps) {
  const isVideo = appointmentType === "video";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Progressive disclosure
  const [revealedUpTo, setRevealedUpTo] = useState(1);
  const computedRevealedUpTo = useMemo(
    () => (photos.length > 0 ? Math.max(revealedUpTo, 3) : revealedUpTo),
    [photos.length, revealedUpTo],
  );
  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const prevRevealedRef = useRef(computedRevealedUpTo);

  // Auto-reveal section 2 after a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (revealedUpTo < 2) setRevealedUpTo(2);
    }, 600);
    return () => clearTimeout(timer);
  }, [revealedUpTo]);

  // Also reveal section 3 after a longer delay regardless
  useEffect(() => {
    const timer = setTimeout(() => {
      if (revealedUpTo < 3) setRevealedUpTo(3);
    }, 2000);
    return () => clearTimeout(timer);
  }, [revealedUpTo]);

  // Auto-scroll on reveal
  useEffect(() => {
    const prev = prevRevealedRef.current;
    if (computedRevealedUpTo > prev) {
      prevRevealedRef.current = computedRevealedUpTo;
      const timer = setTimeout(() => {
        const targetRef = computedRevealedUpTo === 2 ? section2Ref : computedRevealedUpTo === 3 ? section3Ref : null;
        targetRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [computedRevealedUpTo]);

  // Feedback
  const feedback = getPhotoFeedback(photos.length, isVideo);
  const motifAdvice = getMotifAdvice(motif);
  const zoneTips = getZoneTips(zones);
  const crossAdvice = getCrossAdvice(motif, zones);
  const isFull = photos.length >= MAX_PHOTOS;

  return (
    <div className="space-y-0">
      {/* ——— Section 1: Photo Tips ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-[14px]"
          style={{
            background: "rgba(17, 18, 20, 0.02)",
            border: "1px solid rgba(17, 18, 20, 0.05)",
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-[26px] h-[26px] rounded-[8px] bg-[#5B1112]/[0.08] flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-[13px] h-[13px] text-[#5B1112]" strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] text-[#111214]/70 tracking-[-0.08px]" style={{ fontWeight: 560 }}>
                Besoin d'aide pour les photos ?
              </p>
              <p className="text-[11px] text-[#111214]/40 tracking-[-0.05px]" style={{ fontWeight: 430 }}>
                Touchez ? pour voir les conseils
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={isHelpOpen ? "Masquer les conseils photo" : "Afficher les conseils photo"}
            onClick={() => setIsHelpOpen((prev) => !prev)}
            className="w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: isHelpOpen ? "rgba(91, 17, 18, 0.12)" : "rgba(91, 17, 18, 0.08)",
              color: "#5B1112",
              fontWeight: 700,
              fontSize: 15,
              lineHeight: 1,
            }}
          >
            ?
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isHelpOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 10 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              {/* Tips grid */}
              <div className="grid grid-cols-2 gap-2">
                {PHOTO_TIPS.map((tip, i) => (
                  <TipCard
                    key={tip.title}
                    icon={tip.icon}
                    title={tip.title}
                    description={tip.description}
                    accentColor={tip.accentColor}
                    index={i}
                  />
                ))}
              </div>

              {/* Motif-contextual advice */}
              <AnimatePresence>
                {motifAdvice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-3 px-4 py-3 rounded-[14px]"
                      style={{
                        background: "linear-gradient(135deg, rgba(91, 17, 18, 0.03) 0%, rgba(254, 240, 213, 0.15) 100%)",
                        border: "1px solid rgba(91, 17, 18, 0.06)",
                      }}
                    >
                      <div className="w-[22px] h-[22px] rounded-[7px] bg-[#5B1112]/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Lightbulb className="w-[11px] h-[11px] text-[#5B1112]" strokeWidth={1.8} />
                      </div>
                      <p className="text-[12px] text-[#5B1112]/60 leading-[1.5] tracking-[-0.05px]" style={{ fontWeight: 450 }}>
                        {motifAdvice}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Zone-specific tips */}
              <AnimatePresence>
                {zoneTips.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 }}
                    className="overflow-hidden"
                  >
                    {/* Mini section label */}
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-[11px] h-[11px] text-[#00415E]/40" strokeWidth={1.8} />
                      <span
                        className="text-[11px] text-[#00415E]/45 tracking-[-0.05px]"
                        style={{ fontWeight: 550 }}
                      >
                        Conseils pour vos zones
                      </span>
                      <span
                        className="text-[10px] px-[6px] py-[1px] rounded-full tracking-[-0.02px]"
                        style={{
                          background: "rgba(0, 65, 94, 0.06)",
                          color: "rgba(0, 65, 94, 0.5)",
                          fontWeight: 600,
                        }}
                      >
                        {zoneTips.length}
                      </span>
                    </div>

                    {/* Zone tip cards */}
                    <div className="space-y-1.5">
                      {zoneTips.map((tip, i) => (
                        <motion.div
                          key={tip.zone}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: 0.3 + i * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px]"
                          style={{
                            background: "rgba(0, 65, 94, 0.02)",
                            border: "1px solid rgba(0, 65, 94, 0.05)",
                          }}
                        >
                          <span className="text-[14px] flex-shrink-0 leading-none">
                            {tip.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span
                              className="text-[12px] text-[#00415E]/55 tracking-[-0.05px]"
                              style={{ fontWeight: 550 }}
                            >
                              {tip.zone}
                            </span>
                            <span className="text-[11px] text-[#111214]/30 mx-1.5">·</span>
                            <span
                              className="text-[11.5px] text-[#111214]/40 tracking-[-0.05px]"
                              style={{ fontWeight: 420 }}
                            >
                              {tip.tip}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Cross-advice for motif × zone combo */}
              <AnimatePresence>
                {crossAdvice && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-start gap-3 px-4 py-3 rounded-[14px]"
                      style={{
                        background: "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(91, 17, 18, 0.02) 100%)",
                        border: "1px solid rgba(0, 65, 94, 0.08)",
                      }}
                    >
                      <div
                        className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          background: "linear-gradient(135deg, rgba(0, 65, 94, 0.1) 0%, rgba(91, 17, 18, 0.06) 100%)",
                        }}
                      >
                        <Lightbulb className="w-[11px] h-[11px] text-[#00415E]" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0">
                        <span
                          className="text-[10.5px] px-[6px] py-[2px] rounded-[5px] tracking-[-0.02px] inline-block mb-1"
                          style={{
                            background: "linear-gradient(135deg, rgba(0, 65, 94, 0.08) 0%, rgba(91, 17, 18, 0.05) 100%)",
                            color: "rgba(0, 65, 94, 0.6)",
                            fontWeight: 600,
                          }}
                        >
                          Conseil personnalisé
                        </span>
                        <p
                          className="text-[12px] text-[#00415E]/55 leading-[1.5] tracking-[-0.05px]"
                          style={{ fontWeight: 450 }}
                        >
                          {crossAdvice}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ——— Section 2: Upload Area (revealed after tips) ——— */}
      <AnimatePresence>
        {computedRevealedUpTo >= 2 && (
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
                icon={ImagePlus}
                title="Ajoutez vos photos"
                subtitle={`${photos.length === 0 ? "2 à 4 photos recommandées" : `${photos.length} sur ${MAX_PHOTOS} ajoutée${photos.length > 1 ? "s" : ""}`}`}
                badge={<PhotoCountRing count={photos.length} max={MAX_PHOTOS} />}
              />

              {/* Photo slot progress */}
              <div className="flex items-center justify-center gap-3 mb-4">
                {Array.from({ length: MAX_PHOTOS }).map((_, i) => (
                  <PhotoSlot
                    key={i}
                    filled={i < photos.length}
                    index={i}
                  />
                ))}
              </div>

              {/* Upload buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                <UploadCard
                  icon={IconCamera}
                  label="Prendre une photo"
                  sublabel="Ouvrir l'appareil"
                  onClick={() => cameraInputRef.current?.click()}
                  isPrimary={true}
                  index={0}
                  disabled={isFull}
                />
                <UploadCard
                  icon={IconGalerie}
                  label="Importer"
                  sublabel="Depuis la galerie"
                  onClick={() => fileInputRef.current?.click()}
                  isPrimary={false}
                  index={1}
                  disabled={isFull}
                />
              </div>

              {/* Hidden file inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onAddPhotos(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    onAddPhotos(e.target.files);
                    e.target.value = "";
                  }
                }}
              />

              {/* Photo previews grid */}
              <AnimatePresence mode="popLayout">
                {photos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <AnimatePresence>
                        {photos.map((photo, i) => (
                          <PhotoPreview
                            key={photo.id}
                            photo={photo}
                            index={i}
                            onRemove={() => onRemovePhoto(photo.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Smart feedback */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.25 }}
                className="mt-4"
              >
                <div
                  className="flex items-start gap-3 px-4 py-3 rounded-[14px]"
                  style={{
                    background:
                      feedback.type === "great"
                        ? "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(0, 65, 94, 0.03) 100%)"
                        : feedback.type === "good"
                        ? "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.15) 100%)"
                        : "rgba(17, 18, 20, 0.02)",
                    border:
                      feedback.type === "great"
                        ? "1px solid rgba(0, 65, 94, 0.08)"
                        : feedback.type === "good"
                        ? "1px solid rgba(0, 65, 94, 0.06)"
                        : "1px solid rgba(17, 18, 20, 0.04)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{
                      scale: photos.length > 0 ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex-shrink-0 mt-0.5"
                  >
                    {feedback.type === "great" ? (
                      <div className="w-[22px] h-[22px] rounded-[7px] bg-[#00415E]/[0.1] flex items-center justify-center">
                        <CheckCircle2 className="w-[12px] h-[12px] text-[#00415E]" strokeWidth={2} />
                      </div>
                    ) : (
                      <div className="w-[22px] h-[22px] rounded-[7px] bg-[rgba(17,18,20,0.04)] flex items-center justify-center">
                        <Lightbulb
                          className="w-[11px] h-[11px]"
                          style={{ color: feedback.type === "good" ? "#00415E" : "rgba(17,18,20,0.3)" }}
                          strokeWidth={1.8}
                        />
                      </div>
                    )}
                  </motion.div>
                  <p
                    className="text-[12px] leading-[1.5] tracking-[-0.05px]"
                    style={{
                      color:
                        feedback.type === "great"
                          ? "rgba(0, 65, 94, 0.7)"
                          : feedback.type === "good"
                          ? "rgba(0, 65, 94, 0.6)"
                          : "rgba(17, 18, 20, 0.4)",
                      fontWeight: 450,
                    }}
                  >
                    {feedback.message}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ——— Section 3: Privacy & Skip (revealed later) ——— */}
      <AnimatePresence>
        {computedRevealedUpTo >= 3 && (
          <motion.div
            ref={section3Ref}
            initial={{ opacity: 0, y: 20, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, y: 10, height: 0, marginTop: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-1">
              <RevealDivider />
            </div>
            <div className="pt-4 space-y-3">
              {/* Privacy card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="flex items-start gap-3 px-4 py-3.5 rounded-[16px]"
                style={{
                  background: "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.2) 100%)",
                  border: "1px solid rgba(0, 65, 94, 0.06)",
                }}
              >
                <div className="w-[30px] h-[30px] rounded-[10px] bg-[#00415E]/[0.08] flex items-center justify-center flex-shrink-0">
                  <IconPrivacy
                    className="w-[16px] h-[16px] text-[#00415E]"
                  />
                </div>
                <div>
                  <p
                    className="text-[13px] text-[#00415E]/70 tracking-[-0.1px]"
                    style={{ fontWeight: 580 }}
                  >
                    Vos photos sont protégées
                  </p>
                  <p
                    className="text-[11.5px] text-[#00415E]/40 leading-[1.5] mt-0.5 tracking-[-0.05px]"
                    style={{ fontWeight: 420 }}
                  >
                    Visibles uniquement par le Dr. Diallo et l'équipe médicale. Elles ne seront jamais partagées sans votre consentement.
                  </p>
                </div>
              </motion.div>

              {/* Skip option (only when no photos) */}
              <AnimatePresence>
                {photos.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.3, delay: 0.15 }}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
                      style={{
                        border: "1.5px dashed rgba(17,18,20,0.06)",
                      }}
                    >
                      <IconSkipPhoto
                        className="w-[18px] h-[18px] flex-shrink-0"
                        style={{ color: "rgba(17, 18, 20, 0.25)" }}
                      />
                      <p
                        className="text-[12.5px] text-[rgba(17,18,20,0.35)] tracking-[-0.05px] leading-[1.4]"
                        style={{ fontWeight: 460 }}
                      >
                        {isVideo
                          ? "Vous pouvez continuer sans photos, mais elles améliorent considérablement le diagnostic à distance."
                          : "Pas de photos ? Pas de souci — vous pouvez continuer. Le Dr. Diallo verra directement en consultation."
                        }
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
