import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  FileText,
  Heart,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { HeaderBack } from "@portal/shared/components/HeaderBack";
import { PageLayout } from "@portal/shared/layouts/PageLayout";
import { PersistentContextBar } from "@portal/shared/components/PersistentContextBar";
import {
  DUREES,
  INTENSITE_LABELS,
  MOTIFS,
  TYPES_PEAU,
} from "./components/recapHelpers";
import type { PreConsultData } from "./components/types";
import { StepIndicator } from "@portal/shared/components/StepIndicator";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

// ——— Skeleton Pulse Component ———
function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={`rounded-[12px] ${className ?? ""}`}
      style={{ background: "rgba(17,18,20,0.05)" }}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

// ——— Skeleton Screen ———
function RecapSkeleton() {
  return (
    <div className="space-y-5 px-5 pt-4 pb-4">
      {/* Title skeleton */}
      <div className="space-y-2">
        <SkeletonPulse className="h-[24px] w-[180px]" />
        <SkeletonPulse className="h-[16px] w-[260px]" />
      </div>

      {/* Practitioner card skeleton */}
      <div
        className="bg-white rounded-2xl p-4"
        style={{
          boxShadow:
            "0 2px 8px rgba(17,18,20,0.04), 0 1px 3px rgba(17,18,20,0.03)",
        }}
      >
        <div className="flex items-center gap-3">
          <SkeletonPulse className="w-[52px] h-[52px] rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-[16px] w-[160px]" />
            <SkeletonPulse className="h-[14px] w-[100px]" />
          </div>
        </div>
      </div>

      {/* Details card skeleton */}
      <div
        className="bg-white rounded-2xl p-4 space-y-4"
        style={{
          boxShadow:
            "0 2px 8px rgba(17,18,20,0.04), 0 1px 3px rgba(17,18,20,0.03)",
        }}
      >
        <SkeletonPulse className="h-[15px] w-[180px]" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonPulse className="w-[36px] h-[36px] rounded-[10px]" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-[10px] w-[60px]" />
              <SkeletonPulse className="h-[14px] w-[140px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Pre-consult summary skeleton */}
      <div
        className="bg-white rounded-2xl p-4 space-y-3"
        style={{
          boxShadow:
            "0 2px 8px rgba(17,18,20,0.04), 0 1px 3px rgba(17,18,20,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <SkeletonPulse className="h-[15px] w-[140px]" />
          <SkeletonPulse className="h-[24px] w-[90px] rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonPulse className="w-[28px] h-[28px] rounded-[8px]" />
            <div className="flex-1 space-y-1">
              <SkeletonPulse className="h-[10px] w-[80px]" />
              <SkeletonPulse className="h-[13px] w-[180px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Fee skeleton */}
      <div
        className="bg-white rounded-2xl p-4"
        style={{
          boxShadow:
            "0 2px 8px rgba(17,18,20,0.04), 0 1px 3px rgba(17,18,20,0.03)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-[36px] h-[36px] rounded-full" />
            <SkeletonPulse className="h-[15px] w-[130px]" />
          </div>
          <SkeletonPulse className="h-[18px] w-[90px]" />
        </div>
      </div>
    </div>
  );
}

// ——— Collapsible Section ———
function CollapsibleSection({
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
  children: React.ReactNode;
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
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 mb-2.5 cursor-pointer group"
      >
        <div
          className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: `${accentColor}0D` }}
        >
          <Icon
            className="w-[15px] h-[15px] transition-colors"
            style={{ color: accentColor }}
            strokeWidth={1.8}
          />
        </div>
        <span
          className="text-[13.5px] tracking-[-0.1px] flex-1 text-left"
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

// ——— Detail Row Card ———
function DetailRowCard({
  icon: Icon,
  label,
  value,
  accentColor = "#00415E",
  index,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accentColor?: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
      className="flex items-start gap-3 p-3.5 rounded-[16px] bg-white"
      style={{
        boxShadow:
          "0 1px 3px rgba(17,18,20,0.03), 0 2px 8px rgba(17,18,20,0.02)",
      }}
    >
      <div
        className="flex-shrink-0 w-[32px] h-[32px] rounded-[10px] flex items-center justify-center"
        style={{ background: `${accentColor}0D` }}
      >
        <Icon
          className="w-[15px] h-[15px]"
          style={{ color: accentColor }}
          strokeWidth={1.7}
        />
      </div>
      <div className="flex-1 min-w-0 pt-[1px]">
        <p
          className="text-[11px] tracking-[0.04em] uppercase"
          style={{ color: "rgba(17,18,20,0.4)", fontWeight: 520 }}
        >
          {label}
        </p>
        <p
          className="text-[14px] text-[#111214]/80 mt-0.5 leading-[1.4] tracking-[-0.1px]"
          style={{ fontWeight: 500 }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ——— Pills ———
function PillRow({
  items,
  accentColor,
}: {
  items: string[];
  accentColor: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
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

// ——— Summary Item ———
function SummaryItem({
  icon: Icon,
  label,
  children,
  index,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="flex items-start gap-3 p-3 rounded-[14px] bg-white"
      style={{
        boxShadow:
          "0 1px 2px rgba(17,18,20,0.02), 0 1px 4px rgba(17,18,20,0.015)",
      }}
    >
      <div
        className="flex-shrink-0 w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
        style={{ background: "rgba(91, 17, 18, 0.06)" }}
      >
        <Icon
          className="w-[13px] h-[13px] text-[#5B1112]/60"
          strokeWidth={1.7}
        />
      </div>
      <div className="flex-1 min-w-0 pt-[2px]">
        <p
          className="text-[11px] tracking-[0.03em] uppercase"
          style={{ color: "rgba(17,18,20,0.38)", fontWeight: 520 }}
        >
          {label}
        </p>
        <div className="mt-1">{children}</div>
      </div>
    </motion.div>
  );
}

// ——— Section divider ———
function SectionDivider({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className="h-[1px] mx-3 my-4 origin-center"
      style={{
        background:
          "linear-gradient(90deg, transparent 0%, rgba(91,17,18,0.05) 30%, rgba(0,65,94,0.05) 70%, transparent 100%)",
      }}
    />
  );
}

// ——— Intensity Dots ———
function IntensityDots({ value }: { value: number }) {
  const colors = ["#00415E", "#00415E", "#5B1112", "#5B1112", "#5B1112"];
  return (
    <div className="flex items-center gap-1.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: i <= value ? 7 : 5,
            height: i <= value ? 7 : 5,
            background: i <= value ? colors[i - 1] : "rgba(17,18,20,0.1)",
          }}
        />
      ))}
      <span
        className="text-[11px] ml-1 tracking-[-0.05px]"
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

function formatDateLabel(date?: string) {
  if (!date) return "À définir";
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

// ——— Main Component ———
export default function PF04() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const auth = useAuth();

  const appointmentType = state?.appointmentType ?? "presentiel";
  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));
  const selectedSlot = state?.selectedSlot ?? {
    date: "Lundi 24 Février 2026",
    time: "10:30",
  };
  const preConsultData: PreConsultData | undefined = state?.preConsultData;
  const preConsultSkipped = state?.preConsultSkipped ?? false;

  // Mock practitioner data
  const practitioner = {
    name: "Dr. Aissatou Diallo",
    specialty: "Dermatologie",
    location: "Cabinet Mermoz, Dakar",
    fee: "15 000 FCFA",
    avatar: "AD",
  };

  // ——— Skeleton loading state ———
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  // ——— Pre-consult derived data ———
  const preConsultSummary = useMemo(() => {
    if (!preConsultData || preConsultSkipped) return null;

    const motifLabel =
      MOTIFS.find((m) => m.key === preConsultData.motif)?.label ??
      (preConsultData.motifAutre || "Non renseigné");

    const dureeLabel =
      DUREES.find((d) => d.key === preConsultData.duree)?.label ??
      "Non renseigné";

    const peauParts: string[] = [];
    if (preConsultData.peauSensible != null)
      peauParts.push(preConsultData.peauSensible ? "Sensible" : "Non sensible");
    if (preConsultData.typePeau) {
      const tl = TYPES_PEAU.find(
        (t) => t.key === preConsultData.typePeau,
      )?.label;
      if (tl) peauParts.push(tl);
    }

    const historiqueItems: string[] = [];
    if (preConsultData.dejaEuProbleme === true)
      historiqueItems.push("Récurrent");
    if (preConsultData.dejaEuProbleme === false)
      historiqueItems.push("Première fois");
    if (preConsultData.dejaConsulte === true)
      historiqueItems.push("Déjà consulté");

    // Completeness
    const fields = [
      preConsultData.motif != null,
      (preConsultData.zones?.length ?? 0) > 0,
      (preConsultData.symptomes?.length ?? 0) > 0,
      preConsultData.duree != null,
      preConsultData.peauSensible != null,
      (preConsultData.objectifs?.length ?? 0) > 0,
      (preConsultData.photos?.length ?? 0) > 0,
      preConsultData.dejaEuProbleme != null,
    ];
    const filledCount = fields.filter(Boolean).length;
    const pct = Math.round((filledCount / fields.length) * 100);

    return {
      motifLabel,
      dureeLabel,
      peauParts,
      historiqueItems,
      pct,
      filledCount,
      total: fields.length,
    };
  }, [preConsultData, preConsultSkipped]);

  const handleConfirm = () => {
    navigate("/patient-flow/confirmation-succes", {
      state: {
        appointmentType,
        actingProfileId: auth.actingProfileId,
        actingRelationship: auth.actingProfile?.relationship,
        date: state?.date,
        time: state?.time,
        selectedSlot,
        practitioner,
        preConsultData,
      },
    });
  };

  return (
    <PageLayout>
      <div className="pf-page flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="pf-header flex items-center justify-between px-4 pt-1 pb-2"
        >
          <HeaderBack onBack={() => navigate(-1)} />
          <StepIndicator current={4} total={5} />
          <div className="w-[44px]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 }}
          className="px-5 mt-1"
        >
          <PersistentContextBar
            profileId={auth.actingProfileId}
            profileLabel={
              auth.actingProfile
                ? `${auth.actingProfile.firstName} ${auth.actingProfile.lastName}`
                : null
            }
            profileOptions={profileOptions}
            onProfileChange={(profileId) => {
              void auth.setActingProfile(profileId);
            }}
            appointmentType={appointmentType}
            practitionerName={practitioner.name}
            dateLabel={
              state?.date ? formatDateLabel(state.date) : selectedSlot.date
            }
            timeLabel={state?.time ?? selectedSlot.time}
          />
        </motion.div>

        {/* Scrollable content */}
        <div className="pf-scroll flex-1 min-h-0 overflow-y-auto">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <RecapSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="px-5 pb-6 md:pb-8"
              >
                {/* ——— Title ——— */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-1 mb-5"
                >
                  <h1
                    className="text-[#111214]"
                    style={{ fontSize: 22, fontWeight: 700 }}
                  >
                    Récapitulatif
                  </h1>
                  <p
                    className="text-[#111214]/55"
                    style={{ fontSize: 15, fontWeight: 400 }}
                  >
                    Vérifiez les détails avant de confirmer
                  </p>
                </motion.div>

                {/* ——— Practitioner Hero Card ——— */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                  className="rounded-[20px] p-4 mb-1"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(91, 17, 18, 0.04) 0%, rgba(254, 240, 213, 0.3) 100%)",
                    border: "1px solid rgba(91, 17, 18, 0.06)",
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Avatar */}
                    <div
                      className="w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background:
                          "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)",
                        boxShadow: "0 2px 8px rgba(91,17,18,0.2)",
                      }}
                    >
                      <span
                        className="text-[18px] text-[#FEF0D5]"
                        style={{ fontWeight: 700 }}
                      >
                        {practitioner.avatar}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[#111214]"
                        style={{ fontSize: 16, fontWeight: 650 }}
                      >
                        {practitioner.name}
                      </p>
                      <p
                        className="text-[#111214]/50"
                        style={{ fontSize: 13.5, fontWeight: 450 }}
                      >
                        {practitioner.specialty}
                      </p>
                    </div>
                    {/* Consultation type badge */}
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
                      style={{
                        background:
                          appointmentType === "video"
                            ? "rgba(0, 65, 94, 0.08)"
                            : "rgba(91, 17, 18, 0.06)",
                      }}
                    >
                      {appointmentType === "video" ? (
                        <Video
                          className="w-[13px] h-[13px] text-[#00415E]"
                          strokeWidth={1.8}
                        />
                      ) : (
                        <Stethoscope
                          className="w-[13px] h-[13px] text-[#5B1112]"
                          strokeWidth={1.8}
                        />
                      )}
                      <span
                        className="text-[11.5px] tracking-[-0.05px]"
                        style={{
                          color:
                            appointmentType === "video" ? "#00415E" : "#5B1112",
                          fontWeight: 580,
                        }}
                      >
                        {appointmentType === "video" ? "Vidéo" : "Cabinet"}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <SectionDivider delay={0.15} />

                {/* ——— Section 1: Rendez-vous ——— */}
                <CollapsibleSection
                  icon={CalendarDays}
                  title="Votre rendez-vous"
                  accentColor="#00415E"
                  index={0}
                >
                  <DetailRowCard
                    icon={CalendarDays}
                    label="Date"
                    value={selectedSlot.date}
                    accentColor="#00415E"
                    index={0}
                  />
                  <DetailRowCard
                    icon={Clock}
                    label="Heure"
                    value={selectedSlot.time}
                    accentColor="#00415E"
                    index={1}
                  />
                  {appointmentType === "presentiel" ? (
                    <DetailRowCard
                      icon={MapPin}
                      label="Lieu"
                      value={practitioner.location}
                      accentColor="#00415E"
                      index={2}
                    />
                  ) : (
                    <DetailRowCard
                      icon={Video}
                      label="Plateforme"
                      value="Consultation en ligne"
                      accentColor="#00415E"
                      index={2}
                    />
                  )}
                </CollapsibleSection>

                <SectionDivider delay={0.25} />

                {/* ——— Section 2: Pré-consultation ——— */}
                <CollapsibleSection
                  icon={FileText}
                  title="Pré-consultation"
                  accentColor="#5B1112"
                  index={1}
                >
                  {/* Status badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between mb-1"
                  >
                    {preConsultSkipped || !preConsultData ? (
                      <span
                        className="px-3 py-1.5 rounded-full bg-[#FEF0D5] text-[#5B1112] flex items-center gap-1.5"
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        Non complétée
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                          style={{
                            background: "rgba(0, 65, 94, 0.07)",
                            fontSize: 12,
                            fontWeight: 600,
                            color: "#00415E",
                          }}
                        >
                          <CheckCircle2
                            className="w-3.5 h-3.5"
                            strokeWidth={2}
                          />
                          Complétée
                        </span>
                        {preConsultSummary && (
                          <span
                            className="text-[11px] tracking-[-0.05px]"
                            style={{
                              color: "rgba(17,18,20,0.35)",
                              fontWeight: 480,
                            }}
                          >
                            {preConsultSummary.filledCount}/
                            {preConsultSummary.total} sections ·{" "}
                            {preConsultSummary.pct}%
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>

                  {preConsultData && !preConsultSkipped ? (
                    <div className="space-y-2">
                      {/* Motif */}
                      {preConsultData.motif && preConsultSummary && (
                        <SummaryItem icon={Target} label="Motif" index={0}>
                          <p
                            className="text-[13px] text-[#111214]/75 tracking-[-0.05px]"
                            style={{ fontWeight: 490 }}
                          >
                            {preConsultSummary.motifLabel}
                          </p>
                        </SummaryItem>
                      )}

                      {/* Zones */}
                      {(preConsultData.zones?.length ?? 0) > 0 && (
                        <SummaryItem icon={MapPin} label="Zones" index={1}>
                          <PillRow
                            items={preConsultData.zones}
                            accentColor="#5B1112"
                          />
                        </SummaryItem>
                      )}

                      {/* Symptômes */}
                      {(preConsultData.symptomes?.length ?? 0) > 0 && (
                        <SummaryItem icon={Zap} label="Symptômes" index={2}>
                          <PillRow
                            items={preConsultData.symptomes}
                            accentColor="#00415E"
                          />
                        </SummaryItem>
                      )}

                      {/* Durée + Intensité */}
                      {preConsultData.duree && preConsultSummary && (
                        <SummaryItem
                          icon={Clock}
                          label="Durée & Intensité"
                          index={3}
                        >
                          <p
                            className="text-[13px] text-[#111214]/70 tracking-[-0.05px]"
                            style={{ fontWeight: 470 }}
                          >
                            Depuis {preConsultSummary.dureeLabel.toLowerCase()}
                          </p>
                          <IntensityDots value={preConsultData.intensite} />
                        </SummaryItem>
                      )}

                      {/* Historique */}
                      {preConsultSummary &&
                        preConsultSummary.historiqueItems.length > 0 && (
                          <SummaryItem
                            icon={Heart}
                            label="Historique"
                            index={4}
                          >
                            <div className="space-y-0.5">
                              {preConsultSummary.historiqueItems.map((item) => (
                                <div
                                  key={item}
                                  className="flex items-start gap-1.5"
                                >
                                  <div className="w-[3.5px] h-[3.5px] rounded-full bg-[#5B1112]/25 mt-[6px] flex-shrink-0" />
                                  <span
                                    className="text-[12.5px] text-[#111214]/60 leading-[1.4]"
                                    style={{ fontWeight: 440 }}
                                  >
                                    {item}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </SummaryItem>
                        )}

                      {/* Peau */}
                      {preConsultSummary &&
                        preConsultSummary.peauParts.length > 0 && (
                          <SummaryItem
                            icon={Sparkles}
                            label="Type de peau"
                            index={5}
                          >
                            <PillRow
                              items={preConsultSummary.peauParts}
                              accentColor="#00415E"
                            />
                          </SummaryItem>
                        )}

                      {/* Photos */}
                      {(preConsultData.photos?.length ?? 0) > 0 && (
                        <SummaryItem icon={Camera} label="Photos" index={6}>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1.5">
                              {Array.from({
                                length: Math.min(
                                  preConsultData.photos.length,
                                  3,
                                ),
                              }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-[22px] h-[22px] rounded-[6px] border-2 border-white flex items-center justify-center"
                                  style={{
                                    background: "rgba(0, 65, 94, 0.08)",
                                  }}
                                >
                                  <Camera
                                    className="w-[9px] h-[9px] text-[#00415E]/40"
                                    strokeWidth={1.8}
                                  />
                                </div>
                              ))}
                            </div>
                            <span
                              className="text-[12px] text-[#111214]/55"
                              style={{ fontWeight: 480 }}
                            >
                              {preConsultData.photos.length} photo
                              {preConsultData.photos.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        </SummaryItem>
                      )}

                      {/* Objectifs */}
                      {(preConsultData.objectifs?.length ?? 0) > 0 && (
                        <SummaryItem icon={Target} label="Objectifs" index={7}>
                          <PillRow
                            items={preConsultData.objectifs}
                            accentColor="#5B1112"
                          />
                        </SummaryItem>
                      )}

                      {/* Notes personnelles */}
                      {preConsultData.notesObjectifs && (
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
                              className="text-[11px] text-[#5B1112]/40 mb-1"
                              style={{ fontWeight: 550 }}
                            >
                              Message au Dr. Diallo
                            </p>
                            <p
                              className="text-[12.5px] text-[#5B1112]/60 leading-[1.5] italic"
                              style={{ fontWeight: 420 }}
                            >
                              &ldquo;{preConsultData.notesObjectifs}
                              &rdquo;
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : preConsultSkipped ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-[16px]"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(254, 240, 213, 0.3) 0%, rgba(91, 17, 18, 0.02) 100%)",
                        border: "1px solid rgba(91, 17, 18, 0.05)",
                      }}
                    >
                      <FileText
                        className="w-[16px] h-[16px] text-[#5B1112]/40 flex-shrink-0 mt-0.5"
                        strokeWidth={1.7}
                      />
                      <p
                        className="text-[13px] text-[#111214]/45 leading-[1.55]"
                        style={{ fontWeight: 430 }}
                      >
                        Vous pourrez la compléter plus tard ou directement lors
                        de la consultation.
                      </p>
                    </motion.div>
                  ) : null}
                </CollapsibleSection>

                <SectionDivider delay={0.35} />

                {/* ——— Section 3: Tarification ——— */}
                <CollapsibleSection
                  icon={CreditCard}
                  title="Tarification"
                  accentColor="#5B1112"
                  index={2}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-[18px] p-4"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(91, 17, 18, 0.03) 0%, rgba(254, 240, 213, 0.25) 100%)",
                      border: "1px solid rgba(91, 17, 18, 0.06)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-[36px] h-[36px] rounded-full flex items-center justify-center"
                          style={{
                            background: "rgba(91, 17, 18, 0.08)",
                          }}
                        >
                          <CreditCard
                            className="w-[17px] h-[17px] text-[#5B1112]"
                            strokeWidth={1.7}
                          />
                        </div>
                        <p
                          className="text-[#111214]/60"
                          style={{
                            fontSize: 14,
                            fontWeight: 480,
                          }}
                        >
                          Tarif consultation
                        </p>
                      </div>
                      <p
                        className="text-[#111214]"
                        style={{ fontSize: 18, fontWeight: 720 }}
                      >
                        {practitioner.fee}
                      </p>
                    </div>

                    {/* Payment note */}
                    <div
                      className="flex items-center gap-2 mt-3 pt-3"
                      style={{
                        borderTop: "1px solid rgba(91, 17, 18, 0.06)",
                      }}
                    >
                      <ShieldCheck
                        className="w-[13px] h-[13px] text-[#00415E]/50 flex-shrink-0"
                        strokeWidth={1.7}
                      />
                      <p
                        className="text-[11.5px] text-[#111214]/35 leading-[1.5]"
                        style={{ fontWeight: 430 }}
                      >
                        Paiement sur place ou via Orange Money / Wave
                      </p>
                    </div>
                  </motion.div>
                </CollapsibleSection>

                {/* ——— Reassurance card ——— */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-5 flex items-start gap-3 px-4 py-4 rounded-[18px]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(0, 65, 94, 0.03) 0%, rgba(254, 240, 213, 0.15) 100%)",
                    border: "1px solid rgba(0, 65, 94, 0.06)",
                  }}
                >
                  <div className="w-[30px] h-[30px] rounded-[10px] bg-[#00415E]/8 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck
                      className="w-[15px] h-[15px] text-[#00415E]/60"
                      strokeWidth={1.7}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[13px] text-[#00415E]/70 tracking-[-0.1px]"
                      style={{ fontWeight: 580 }}
                    >
                      Annulation gratuite
                    </p>
                    <p
                      className="text-[11.5px] text-[#00415E]/40 leading-[1.55] mt-0.5 tracking-[-0.05px]"
                      style={{ fontWeight: 420 }}
                    >
                      Vous pouvez annuler ou reporter jusqu'à 24h avant le
                      rendez-vous, sans frais.
                    </p>
                  </div>
                </motion.div>

                {/* ——— Disclaimer ——— */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="text-center text-[#111214]/35 px-4 mt-5 mb-2"
                  style={{
                    fontSize: 11.5,
                    fontWeight: 400,
                    lineHeight: "18px",
                  }}
                >
                  En confirmant, vous acceptez les conditions générales
                  d'utilisation et la politique de confidentialité de Melanis.
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom CTA — fixed at bottom, no sticky */}
        <div
          className="pf-cta px-5 pb-5 pt-3"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)",
          }}
        >
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: loading ? 0.4 : 1, y: 0 }}
            transition={{ duration: 0.4, delay: loading ? 0 : 0.3 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={loading}
            className={`pf-primary-cta w-full py-4 rounded-2xl transition-all duration-200 ${
              loading ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            style={{
              background: loading
                ? "#5B1112"
                : "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)",
              color: "#FEF0D5",
              fontSize: 17,
              fontWeight: 600,
              boxShadow: loading
                ? "none"
                : "0 4px 16px rgba(91,17,18,0.25), 0 2px 4px rgba(91,17,18,0.15)",
            }}
          >
            Confirmer le rendez-vous
          </motion.button>
        </div>
      </div>
    </PageLayout>
  );
}
