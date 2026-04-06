import type {
  NotificationChannelPreference,
  SkinScoreRecord,
  PatientRecordEvent,
  ScreeningCadence,
  ScreeningReminder,
  ScreeningReminderStatus,
} from "@portal/domains/account/types";
import type { AppointmentRecord } from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";
import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import {
  Activity,
  ArrowUpRight,
  Bell,
  Calendar,
  Camera,
  Check,
  ChevronRight,
  Clock,
  CloudSun,
  Droplets,
  FileText,
  ImagePlus,
  Pill,
  Plus,
  ScanFace,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Video,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router";

const DASHBOARD_PATH = "/patient-flow/auth/dashboard";
const PROFILE_PATH = "/patient-flow/account";
const BOOKING_PATH = "/patient-flow";

const PATHS = {
  home: DASHBOARD_PATH,
  appointments: `${DASHBOARD_PATH}#appointments`,
  records: `${DASHBOARD_PATH}#records`,
  profile: PROFILE_PATH,
  scan: `${DASHBOARD_PATH}#scan`,
  photos: `${DASHBOARD_PATH}#photos`,
  cases: BOOKING_PATH,
  booking: BOOKING_PATH,
} as const;

const CADENCE_LABELS: Record<ScreeningCadence, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semiannual: "Semestriel",
  annual: "Annuel",
};

const STATUS_LABELS: Record<ScreeningReminderStatus, string> = {
  active: "Actif",
  snoozed: "En pause",
  completed: "Terminé",
};

interface UpcomingAppointment {
  practitioner: string;
  location: string;
  dateLabel: string;
  timeLabel: string;
  isVideo: boolean;
  scheduledFor: string;
}

interface DashboardHomeProps {
  firstName: string;
  hasActingProfile: boolean;
  upcoming: UpcomingAppointment | null;
  upcomingLoading: boolean;
  upcomingError: string | null;
  skinScores: SkinScoreRecord[];
  skinScoresLoading: boolean;
  skinScoresError: string | null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

function getFirstName(fullName?: string): string {
  if (!fullName) return "Fatou";
  const [first] = fullName.trim().split(/\s+/);
  return first || "Fatou";
}

function formatTimeLabel(value?: string): string {
  if (!value) return "--";
  const trimmed = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
    return trimmed.replace(":", "h");
  }
  return trimmed;
}

function formatTimeFromDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return formatTimeLabel(
    parsed.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
}

function formatAppointmentDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  const now = new Date();
  const isToday =
    parsed.getDate() === now.getDate() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getFullYear() === now.getFullYear();
  if (isToday) return "Aujourd'hui";
  return parsed.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function minutesUntilDate(value: string): number | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((parsed.getTime() - Date.now()) / 60000);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatRelativeFromNow(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return `${Math.abs(diffMinutes)} min`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return `${Math.abs(diffHours)} h`;
  }
  const diffDays = Math.round(diffHours / 24);
  return `${Math.abs(diffDays)} j`;
}

function timelineIcon(type: PatientRecordEvent["type"]): LucideIcon {
  if (type === "appointment_booked") return Calendar;
  if (type === "consent_signed" || type === "consent_revoked") return Bell;
  if (type === "profile_updated") return User;
  if (type === "dependent_created" || type === "dependent_unlinked")
    return Plus;
  return Activity;
}

function reminderStatusTone(status: ScreeningReminderStatus) {
  if (status === "completed")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "snoozed")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-[#111214]/10 bg-[#111214]/5 text-[#111214]/60";
}

function channelSummary(channels: NotificationChannelPreference) {
  const labels: string[] = [];
  if (channels.sms) labels.push("SMS");
  if (channels.whatsapp) labels.push("WhatsApp");
  if (channels.email) labels.push("Email");
  return labels.length > 0 ? labels.join(" · ") : "Aucun canal";
}

function scoreSourceLabel(source: SkinScoreRecord["source"]): string {
  if (source === "scan") return "Scan IA";
  if (source === "manual") return "Saisie manuelle";
  return "Score calculé";
}

function scoreStatusLabel(score: number): string {
  if (score >= 80) return "Excellent etat";
  if (score >= 65) return "Equilibre stable";
  if (score >= 50) return "Peau a surveiller";
  return "Suivi recommande";
}

function scoreTrendLabel(delta: number | null): string {
  if (delta === null) return "Premier score enregistré";
  if (delta > 0) return `+${delta} vs precedent`;
  if (delta < 0) return `${delta} vs precedent`;
  return "Stable vs precedent";
}

function selectUpcomingAppointment(
  appointments: AppointmentRecord[],
): AppointmentRecord | null {
  const sorted = [...appointments].sort((first, second) => {
    const firstTime = new Date(first.scheduledFor).getTime();
    const secondTime = new Date(second.scheduledFor).getTime();
    const safeFirst = Number.isNaN(firstTime) ? Number.MAX_SAFE_INTEGER : firstTime;
    const safeSecond =
      Number.isNaN(secondTime) ? Number.MAX_SAFE_INTEGER : secondTime;
    return safeFirst - safeSecond;
  });

  const now = Date.now();

  return (
    sorted.find((appointment) => {
      if (appointment.status === "completed") return false;
      const scheduledAt = new Date(appointment.scheduledFor).getTime();
      return !Number.isNaN(scheduledAt) && scheduledAt >= now;
    }) ??
    sorted.find((appointment) => appointment.status !== "completed") ??
    null
  );
}

function toUpcomingAppointment(
  appointment: AppointmentRecord,
): UpcomingAppointment {
  const fallbackLocation = appointment.appointmentType === "video"
    ? "Consultation video"
    : "Cabinet";
  return {
    practitioner: appointment.practitionerName,
    location: appointment.practitionerLocation ?? fallbackLocation,
    dateLabel:
      appointment.dateLabel && appointment.dateLabel.trim().length > 0
        ? appointment.dateLabel
        : formatAppointmentDate(appointment.scheduledFor),
    timeLabel:
      appointment.timeLabel && appointment.timeLabel.trim().length > 0
        ? formatTimeLabel(appointment.timeLabel)
        : formatTimeFromDate(appointment.scheduledFor),
    isVideo: appointment.appointmentType === "video",
    scheduledFor: appointment.scheduledFor,
  };
}

function SkinScoreRing({
  score = 78,
  size = 72,
}: {
  score?: number;
  size?: number;
}) {
  const strokeWidth = size * 0.09;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(91,17,18,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#5B1112"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (score / 100) * circumference,
          }}
          transition={{ duration: 1.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-serif"
          style={{ fontSize: size * 0.28, lineHeight: 1, color: "#5B1112" }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
        >
          {score}
        </motion.span>
        <span
          style={{ fontSize: size * 0.1, color: "rgba(17,18,20,0.35)" }}
          className="mt-0.5 uppercase tracking-widest"
        >
          Score
        </span>
      </div>
    </div>
  );
}

function QuickActions() {
  const auth = useAuth();
  const hasActingProfile = Boolean(auth.user && auth.actingProfileId);
  const modules = [
    {
      Icon: Calendar,
      title: "Réserver un RDV",
      subtitle: "Parcours de réservation",
      to: PATHS.booking,
      available: true,
    },
    {
      Icon: FileText,
      title: "Dossier patient",
      subtitle: "Timeline clinique",
      to: PATHS.records,
      available: true,
    },
    {
      Icon: Bell,
      title: "Rappels dépistage",
      subtitle: "Liste et paramètres",
      to: PATHS.records,
      available: true,
    },
    {
      Icon: User,
      title: "Profil & consentements",
      subtitle: "Compte, consentements, notifications",
      to: PROFILE_PATH,
      available: true,
    },
    {
      Icon: ScanFace,
      title: "Télé-derm async",
      subtitle: "Module TD prochainement",
      to: PATHS.home,
      available: false,
    },
    {
      Icon: ImagePlus,
      title: "Upload guidé",
      subtitle: "Capture assistée en préparation",
      to: PATHS.home,
      available: false,
    },
  ] as const;

  if (!hasActingProfile) {
    return (
      <div className="rounded-[1.5rem] border border-[#5B1112]/15 bg-white/85 p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5B1112]/70">
          Hub actions
        </p>
        <p className="mt-2 text-sm text-[#111214]/65">
          Commencez par réserver un rendez-vous. Le reste des actions se
          débloquera ensuite automatiquement.
        </p>
        <Link
          to={PATHS.booking}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-medium text-white"
        >
          Prendre un rendez-vous
          <ArrowUpRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
      {modules.map(({ Icon, title, subtitle, to, available }, index) =>
        available ? (
          <Link key={title} to={to}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.05 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="rounded-[1.4rem] border border-[#111214]/7 bg-white/85 px-4 py-3.5 shadow-sm transition-all hover:border-[#5B1112]/20 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-[#5B1112]/8 p-2">
                  <Icon size={14} className="text-[#5B1112]/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#111214]/75">
                    {title}
                  </p>
                  <p className="mt-1 text-[11px] text-[#111214]/42">
                    {subtitle}
                  </p>
                </div>
                <ArrowUpRight size={12} className="text-[#111214]/30" />
              </div>
            </motion.div>
          </Link>
        ) : (
          <div
            key={title}
            className="rounded-[1.4rem] border border-dashed border-[#111214]/12 bg-white/60 px-4 py-3.5 opacity-80"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-[#111214]/6 p-2">
                <Icon size={14} className="text-[#111214]/45" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#111214]/65">{title}</p>
                <p className="mt-1 text-[11px] text-[#111214]/38">{subtitle}</p>
              </div>
              <span className="rounded-full bg-[#111214]/8 px-2 py-0.5 text-[10px] font-medium text-[#111214]/50">
                Bientôt
              </span>
            </div>
          </div>
        ),
      )}
    </div>
  );
}

function AppointmentCard({
  delay = 0,
  appointment,
  hasActingProfile,
  loading,
  error,
}: {
  delay?: number;
  appointment: UpcomingAppointment | null;
  hasActingProfile: boolean;
  loading: boolean;
  error: string | null;
}) {
  const minsUntil = appointment
    ? minutesUntilDate(appointment.scheduledFor)
    : null;
  const isClose = minsUntil !== null && minsUntil > 0 && minsUntil <= 30;
  const showCountdown = minsUntil !== null && minsUntil > 0 && minsUntil <= 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-[2rem] bg-[#111214] p-6 text-white"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-[#5B1112]/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-2.5rem] left-1/3 h-36 w-36 rounded-full bg-[#FEF0D5]/4 blur-2xl" />

      <div className="relative z-10 flex flex-1 flex-col gap-4">
        <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#FEF0D5]/35">
          Prochain Rendez-vous
        </p>

        {!hasActingProfile ? (
          <>
            <div>
              <h3 className="font-serif" style={{ fontSize: 20 }}>
                Aucun rendez-vous pour le moment
              </h3>
              <p className="mt-2 text-sm text-[#FEF0D5]/55">
                Lancez la réservation et choisissez le profil pendant le parcours.
              </p>
            </div>

            <Link
              to={PATHS.booking}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[#5B1112] py-3 text-sm font-medium text-white shadow-lg shadow-[#5B1112]/35"
            >
              Prendre un rendez-vous
              <ArrowUpRight size={12} />
            </Link>
          </>
        ) : loading ? (
          <div className="flex flex-1 items-center rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-5 text-sm text-[#FEF0D5]/60">
            Chargement du prochain rendez-vous...
          </div>
        ) : error ? (
          <>
            <div className="rounded-[1.5rem] border border-[#FEF0D5]/18 bg-white/8 px-4 py-4 text-sm text-[#FEF0D5]/75">
              {error}
            </div>
            <Link
              to={PATHS.booking}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-[1.25rem] border border-white/10 bg-white/10 py-3 text-sm font-medium text-white/80"
            >
              Réserver un RDV
              <ArrowUpRight size={12} />
            </Link>
          </>
        ) : !appointment ? (
          <>
            <div>
              <h3 className="font-serif" style={{ fontSize: 20 }}>
                Aucun rendez-vous à venir
              </h3>
              <p className="mt-2 text-sm text-[#FEF0D5]/55">
                Ce profil n'a pas encore de rendez-vous planifié.
              </p>
            </div>

            <Link
              to={PATHS.booking}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-[1.25rem] bg-[#5B1112] py-3 text-sm font-medium text-white shadow-lg shadow-[#5B1112]/35"
            >
              Réserver un RDV
              <ArrowUpRight size={12} />
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-serif" style={{ fontSize: 20 }}>
                  {appointment.practitioner}
                </h3>
                <p className="mt-0.5 text-xs text-[#FEF0D5]/45">
                  {appointment.location}
                </p>
              </div>

              <Link
                to={PATHS.booking}
                className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/8 px-3 py-1.5 text-[11px] font-medium transition-colors hover:bg-white/15"
              >
                Voir <ArrowUpRight size={10} />
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#FEF0D5]">
                {appointment.dateLabel}
              </span>
              <span className="rounded-xl bg-white/10 px-3 py-1.5 text-[11px] font-medium text-[#FEF0D5]">
                {appointment.timeLabel}
              </span>
              <span className="rounded-xl bg-[#5B1112]/60 px-3 py-1.5 text-[11px] font-medium text-white/85">
                {appointment.isVideo ? "Video" : "Cabinet"}
              </span>

              {showCountdown ? (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-1 rounded-xl bg-amber-500/20 px-3 py-1.5 text-[11px] font-medium text-amber-300"
                >
                  <Clock size={9} />
                  dans {minsUntil} min
                </motion.span>
              ) : null}
            </div>

            <div className="mt-auto flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#FEF0D5]/35">
                {formatDateTime(appointment.scheduledFor)}
              </p>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className={`flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-sm font-medium transition-all ${
                  isClose
                    ? "bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/40"
                    : "border border-white/8 bg-white/10 text-white/75 hover:bg-white/18"
                }`}
              >
                {isClose && appointment.isVideo ? (
                  <Video size={14} />
                ) : (
                  <Clock size={14} />
                )}
                {isClose && appointment.isVideo
                  ? "Rejoindre la video"
                  : "Preparer le RDV"}
              </motion.div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function TodayCard({
  delay = 0,
  hasActingProfile,
  skinScores,
  loading,
  error,
}: {
  delay?: number;
  hasActingProfile: boolean;
  skinScores: SkinScoreRecord[];
  loading: boolean;
  error: string | null;
}) {
  const sortedScores = useMemo(
    () =>
      [...skinScores].sort((first, second) =>
        first.measuredAt.localeCompare(second.measuredAt),
      ),
    [skinScores],
  );
  const [selectedScoreId, setSelectedScoreId] = useState<string | null>(null);

  const visibleScores = sortedScores.slice(-7);
  const visibleStartIndex = Math.max(sortedScores.length - visibleScores.length, 0);
  const selectedScore =
    sortedScores.find((score) => score.id === selectedScoreId) ??
    sortedScores[sortedScores.length - 1] ??
    null;
  const activeIndex = selectedScore
    ? sortedScores.findIndex((score) => score.id === selectedScore.id)
    : -1;
  const previousScore =
    activeIndex > 0 ? sortedScores[activeIndex - 1] ?? null : null;
  const scoreDelta =
    selectedScore && previousScore
      ? selectedScore.score - previousScore.score
      : null;
  const scoreStatus = selectedScore
    ? scoreStatusLabel(selectedScore.score)
    : null;
  const chips = selectedScore
    ? [
        {
          Icon: Sparkles,
          label: scoreSourceLabel(selectedScore.source),
          warn: false,
        },
        {
          Icon: Activity,
          label: `${sortedScores.length} mesure${sortedScores.length > 1 ? "s" : ""} sur 7j`,
          warn: false,
        },
        {
          Icon: Clock,
          label: `MAJ il y a ${formatRelativeFromNow(selectedScore.measuredAt)}`,
          warn: false,
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative flex min-h-[220px] flex-col gap-4 overflow-hidden rounded-[2rem] p-6"
      style={{
        background:
          "linear-gradient(140deg, #fff9f0 0%, #FEF0D5 60%, #fde8be 100%)",
      }}
    >
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#5B1112]/4 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
            Aujourd'hui
          </p>
          {selectedScore ? (
            <span className="text-[10px] font-medium text-[#5B1112]/65">
              {formatDate(selectedScore.measuredAt)}
            </span>
          ) : null}
        </div>

        {!hasActingProfile ? (
          <div className="rounded-[1.5rem] border border-[#111214]/10 bg-white/60 px-4 py-5 text-sm text-[#111214]/55">
            Le suivi peau apparaîtra après votre premier scan.
          </div>
        ) : loading ? (
          <div className="rounded-[1.5rem] border border-[#111214]/10 bg-white/60 px-4 py-5 text-sm text-[#111214]/55">
            Chargement du suivi peau...
          </div>
        ) : error ? (
          <div className="rounded-[1.5rem] border border-[#5B1112]/10 bg-white/70 px-4 py-5 text-sm text-[#5B1112]">
            {error}
          </div>
        ) : !selectedScore ? (
          <div className="flex flex-1 flex-col gap-4 rounded-[1.5rem] border border-dashed border-[#111214]/14 bg-white/55 px-4 py-5">
            <div>
              <p className="font-serif text-[#111214]" style={{ fontSize: 20 }}>
                Aucun score disponible
              </p>
              <p className="mt-2 text-sm text-[#111214]/52">
                Ce profil n'a pas encore de mesure peau enregistrée.
              </p>
            </div>
            <Link
              to={PATHS.scan}
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#5B1112] px-4 py-2 text-xs font-medium text-white"
            >
              Lancer un premier scan
              <ArrowUpRight size={12} />
            </Link>
          </div>
        ) : (
          <>
            {visibleScores.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleScores.map((score, index) => {
                  const actualIndex = visibleStartIndex + index;
                  const scoreDate = new Date(score.measuredAt);
                  const abbr = scoreDate
                    .toLocaleDateString("fr-FR", { weekday: "short" })
                    .replace(".", "")
                    .slice(0, 3);
                  const num = scoreDate
                    .getDate()
                    .toString()
                    .padStart(2, "0");

                  return (
                    <motion.button
                      key={score.id}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => setSelectedScoreId(score.id)}
                      className={`flex flex-shrink-0 flex-col items-center justify-center rounded-[1.25rem] transition-all duration-300 ${
                        actualIndex === activeIndex
                          ? "h-[3.4rem] w-[2.9rem] bg-[#5B1112] text-white shadow-md shadow-[#5B1112]/25"
                          : "h-[3rem] w-[2.5rem] bg-white/55 text-[#111214]/40 hover:bg-white/75"
                      }`}
                    >
                      <span className="mb-0.5 text-[8px] font-semibold uppercase tracking-wider">
                        {abbr}
                      </span>
                      <span
                        className={`font-serif ${actualIndex === activeIndex ? "text-lg" : "text-sm"}`}
                      >
                        {num}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            ) : null}

            <div className="flex items-center gap-4">
              <SkinScoreRing score={selectedScore.score} size={70} />

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-serif text-[#5B1112]"
                    style={{ fontSize: 28, lineHeight: 1 }}
                  >
                    {selectedScore.score}
                  </span>
                  {scoreDelta !== null ? (
                    <span
                      className={`flex items-center gap-0.5 ${
                        scoreDelta >= 0 ? "text-emerald-500" : "text-amber-600"
                      }`}
                    >
                      <TrendingUp size={10} />
                      <span className="text-[10px] font-semibold">
                        {scoreTrendLabel(scoreDelta)}
                      </span>
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-[#111214]/40">{scoreStatus}</p>
                <p className="mt-1 text-[10px] text-[#111214]/30">
                  Mesure enregistrée le {formatDateTime(selectedScore.measuredAt)}
                </p>
              </div>

              <div className="flex-shrink-0 opacity-75">
                <MelaniaMascot size={54} delay={delay + 0.3} />
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/55 px-4 py-2.5">
              <p className="text-[10px] italic leading-snug text-[#111214]/55">
                {scoreDelta === null
                  ? "Premier point de suivi enregistré pour ce profil."
                  : `Tendance récente: ${scoreTrendLabel(scoreDelta).toLowerCase()}.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {chips.map(({ Icon, label, warn }) => (
                <div
                  key={label}
                  className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-medium ${
                    warn
                      ? "border border-amber-100 bg-amber-50 text-amber-600"
                      : "border border-white/70 bg-white/55 text-[#111214]/50"
                  }`}
                >
                  <Icon
                    size={10}
                    className={warn ? "text-amber-500" : "text-[#5B1112]/40"}
                  />
                  {label}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function RoutineItem({
  title,
  subtitle,
  checked,
  onToggle,
  trailing,
  isMed = false,
}: {
  title: string;
  subtitle?: string;
  checked: boolean;
  onToggle: () => void;
  trailing?: ReactNode;
  isMed?: boolean;
}) {
  return (
    <motion.div
      layout
      onClick={onToggle}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      className={`flex cursor-pointer select-none items-center gap-3.5 rounded-[1.5rem] px-4 py-3.5 transition-colors duration-200 ${
        checked
          ? "bg-white/30"
          : "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
          checked ? "bg-[#5B1112]" : "border-2 border-[#111214]/10"
        }`}
      >
        <Check
          size={12}
          strokeWidth={3}
          className={`text-white transition-opacity ${checked ? "opacity-100" : "opacity-0"}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm font-medium transition-all ${
              checked ? "text-[#111214]/30 line-through" : "text-[#111214]"
            }`}
          >
            {title}
          </p>
          {isMed ? (
            <span className="flex-shrink-0 rounded-full bg-[#5B1112]/8 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-[#5B1112]/55">
              Medicament
            </span>
          ) : null}
        </div>

        {subtitle ? (
          <p className="mt-0.5 truncate text-[10px] text-[#111214]/35">
            {subtitle}
          </p>
        ) : null}
      </div>

      {trailing ? <div className="flex-shrink-0">{trailing}</div> : null}
    </motion.div>
  );
}

type RoutineTab = "matin" | "soir";

interface RoutineEntry {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  isMed?: boolean;
  initDone: boolean;
}

const ROUTINE_DATA: Record<RoutineTab, RoutineEntry[]> = {
  matin: [
    {
      title: "Nettoyage doux",
      subtitle: "Gel nettoyant · Tonique equilibrant",
      trailing: <Sparkles size={13} className="text-[#5B1112]" />,
      isMed: false,
      initDone: true,
    },
    {
      title: "Hydratation + SPF 50",
      subtitle: "UV 8/12 · Harmattan actif · 32 C",
      trailing: (
        <div className="flex items-center gap-1 rounded-xl border border-amber-100 bg-amber-50 px-2 py-1">
          <CloudSun size={11} className="text-amber-500" />
          <span className="text-[9px] font-semibold text-amber-500">32 C</span>
        </div>
      ),
      isMed: false,
      initDone: false,
    },
    {
      title: "Doxycycline 100 mg",
      subtitle: "Avec repas du matin",
      trailing: (
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#111214]/5">
          <Pill size={12} className="text-[#111214]/30" />
        </div>
      ),
      isMed: true,
      initDone: false,
    },
  ],
  soir: [
    {
      title: "Demaquillage complet",
      subtitle: "Huile · Eau micellaire",
      trailing: null,
      isMed: false,
      initDone: false,
    },
    {
      title: "Serum Retinol 0.25%",
      subtitle: "Appliquer sur peau propre et seche",
      trailing: (
        <div className="rounded-lg bg-[#5B1112]/6 px-2 py-1">
          <span className="text-[9px] font-semibold text-[#5B1112]">0.25%</span>
        </div>
      ),
      isMed: false,
      initDone: false,
    },
    {
      title: "Creme nuit nourrissante",
      subtitle: "Karite · Niacinamide",
      trailing: <Star size={12} className="fill-[#5B1112] text-[#FEF0D5]" />,
      isMed: false,
      initDone: false,
    },
  ],
};

function RoutineCard({ delay = 0 }: { delay?: number }) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const actingProfileId = auth.actingProfileId;
  const [tab, setTab] = useState<RoutineTab>("matin");
  const [checked, setChecked] = useState<Record<RoutineTab, boolean[]>>({
    matin: ROUTINE_DATA.matin.map((item) => item.initDone),
    soir: ROUTINE_DATA.soir.map((item) => item.initDone),
  });
  const [timelineEvents, setTimelineEvents] = useState<PatientRecordEvent[]>(
    [],
  );
  const [screeningReminders, setScreeningReminders] = useState<
    ScreeningReminder[]
  >([]);
  const [screeningChannels, setScreeningChannels] =
    useState<NotificationChannelPreference | null>(null);
  const [isHubLoading, setIsHubLoading] = useState(false);
  const [hubError, setHubError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savingReminderId, setSavingReminderId] = useState<string | null>(null);
  const [isSavingChannels, setIsSavingChannels] = useState(false);

  const toggle = (currentTab: RoutineTab, index: number) => {
    setChecked((prev) => ({
      ...prev,
      [currentTab]: prev[currentTab].map((value, mapIndex) =>
        mapIndex === index ? !value : value,
      ),
    }));
  };

  const totalDone =
    checked.matin.filter(Boolean).length + checked.soir.filter(Boolean).length;
  const totalItems = ROUTINE_DATA.matin.length + ROUTINE_DATA.soir.length;
  const progress = (totalDone / totalItems) * 100;

  useEffect(() => {
    if (!userId || !actingProfileId) {
      setTimelineEvents([]);
      setScreeningReminders([]);
      setScreeningChannels(null);
      setHubError(null);
      return;
    }

    let cancelled = false;
    setIsHubLoading(true);
    setHubError(null);

    void Promise.all([
      auth.accountAdapter.listTimelineEvents(userId, actingProfileId, 20),
      auth.accountAdapter.listScreeningReminders(userId, actingProfileId),
      auth.accountAdapter.getNotificationPreferences(userId, actingProfileId),
    ])
      .then(([events, reminders, preferences]) => {
        if (cancelled) return;
        setTimelineEvents(events);
        setScreeningReminders(reminders);
        setScreeningChannels(preferences.screening);
      })
      .catch(() => {
        if (cancelled) return;
        setHubError("Impossible de charger le dossier patient pour le moment.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsHubLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [actingProfileId, auth.accountAdapter, userId]);

  const updateReminder = async (
    reminderId: string,
    patch: Partial<
      Pick<ScreeningReminder, "cadence" | "status" | "nextDueAt" | "channels">
    >,
  ) => {
    if (!userId || !actingProfileId) return;
    setSavingReminderId(reminderId);
    setHubError(null);
    try {
      const updated = await auth.accountAdapter.updateScreeningReminder({
        actorUserId: userId,
        profileId: actingProfileId,
        reminderId,
        patch,
      });
      setScreeningReminders((prev) =>
        prev.map((reminder) =>
          reminder.id === reminderId ? updated : reminder,
        ),
      );
    } catch {
      setHubError("La mise à jour du rappel a échoué. Réessayez.");
    } finally {
      setSavingReminderId(null);
    }
  };

  const toggleScreeningChannel = async (
    channel: keyof NotificationChannelPreference,
  ) => {
    if (!userId || !actingProfileId || !screeningChannels) return;
    const nextChannels = {
      ...screeningChannels,
      [channel]: !screeningChannels[channel],
    };
    setScreeningChannels(nextChannels);
    setIsSavingChannels(true);
    setHubError(null);

    try {
      const reminderUpdates = screeningReminders.map((reminder) =>
        auth.accountAdapter.updateScreeningReminder({
          actorUserId: userId,
          profileId: actingProfileId,
          reminderId: reminder.id,
          patch: { channels: nextChannels },
        }),
      );

      const prefsUpdate = auth.accountAdapter.updateNotificationPreferences({
        actorUserId: userId,
        profileId: actingProfileId,
        patch: { screening: nextChannels },
      });

      const updatedReminders = await Promise.all([
        ...reminderUpdates,
        prefsUpdate,
      ]).then(
        (results) =>
          results.slice(0, screeningReminders.length) as ScreeningReminder[],
      );

      setScreeningReminders((prev) =>
        prev.map((reminder, index) => updatedReminders[index] ?? reminder),
      );
    } catch {
      setScreeningChannels((prev) =>
        prev
          ? {
              ...prev,
              [channel]: !nextChannels[channel],
            }
          : prev,
      );
      setHubError("Impossible de mettre à jour les canaux de rappel.");
    } finally {
      setIsSavingChannels(false);
    }
  };

  if (!actingProfileId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-[2rem] border border-[#5B1112]/15 bg-white/85 p-6 shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
      >
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5B1112]/65">
          Dossier & rappels
        </p>
        <h3 className="mt-2 font-serif text-[#111214]" style={{ fontSize: 22 }}>
          Dossier patient vide
        </h3>
        <p className="mt-2 text-sm text-[#111214]/62">
          Le dossier, les rappels et les préférences apparaîtront après votre
          premier rendez-vous ou votre premier scan.
        </p>
        <Link
          to={PATHS.booking}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-medium text-white"
        >
          Prendre un rendez-vous
          <ArrowUpRight size={12} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
            Routine du jour
          </p>
          <span className="text-[10px] font-semibold text-[#5B1112]">
            {totalDone}/{totalItems} complete
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#111214]/6">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#5B1112] to-[#8B1A1B]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{
              delay: delay + 0.3,
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        </div>
      </div>

      <div className="flex gap-1 rounded-[1.25rem] bg-[#111214]/5 p-1">
        {(["matin", "soir"] as const).map((itemTab) => (
          <button
            key={itemTab}
            onClick={() => setTab(itemTab)}
            className={`flex-1 rounded-[1rem] py-2 text-xs font-medium capitalize transition-all duration-200 ${
              tab === itemTab
                ? "bg-white text-[#111214] shadow-sm"
                : "text-[#111214]/40 hover:text-[#111214]/60"
            }`}
          >
            {itemTab === "matin" ? "Matin" : "Soir"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          className="flex flex-col gap-2"
        >
          {ROUTINE_DATA[tab].map((item, index) => (
            <RoutineItem
              key={`${item.title}-${index}`}
              title={item.title}
              subtitle={item.subtitle}
              checked={checked[tab][index]}
              onToggle={() => toggle(tab, index)}
              trailing={item.trailing}
              isMed={item.isMed}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <div className="h-px bg-[#111214]/6" />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/30">
              Dossier patient
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">
              Timeline clinique (événements récents)
            </p>
          </div>
          {isHubLoading ? (
            <span className="text-[10px] text-[#111214]/45">Chargement...</span>
          ) : null}
        </div>

        {hubError ? (
          <div className="rounded-xl border border-[#5B1112]/20 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
            {hubError}
          </div>
        ) : null}

        {timelineEvents.length === 0 && !isHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun événement de dossier pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {timelineEvents.slice(0, 6).map((event) => {
              const Icon = timelineIcon(event.type);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 rounded-xl border border-[#111214]/8 bg-white px-3 py-2.5"
                >
                  <div className="mt-0.5 rounded-lg bg-[#5B1112]/7 p-1.5">
                    <Icon size={12} className="text-[#5B1112]/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111214]/75">
                      {event.title}
                    </p>
                    {event.description ? (
                      <p className="mt-0.5 text-[10px] text-[#111214]/45">
                        {event.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      {formatDateTime(event.occurredAt)} · il y a{" "}
                      {formatRelativeFromNow(event.occurredAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/30">
              Rappels dépistage
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">
              Liste des rappels et statut actuel
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen((prev) => !prev)}
            className="rounded-full border border-[#111214]/12 bg-white px-3 py-1.5 text-[10px] font-medium text-[#111214]/60"
            aria-expanded={isSettingsOpen}
            aria-controls="pat23-settings"
          >
            {isSettingsOpen
              ? "Masquer les paramètres"
              : "Ouvrir les paramètres"}
          </button>
        </div>

        {screeningReminders.length === 0 && !isHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun rappel configuré pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {screeningReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="rounded-xl border border-[#111214]/8 bg-white px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111214]/76">
                      {reminder.screeningType}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#111214]/42">
                      Prochaine échéance: {formatDate(reminder.nextDueAt)}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      Canaux: {channelSummary(reminder.channels)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${reminderStatusTone(
                      reminder.status,
                    )}`}
                  >
                    {STATUS_LABELS[reminder.status]}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                  <label className="text-[10px] text-[#111214]/45">
                    Cadence
                    <select
                      value={reminder.cadence}
                      onChange={(event) =>
                        void updateReminder(reminder.id, {
                          cadence: event.currentTarget
                            .value as ScreeningCadence,
                        })
                      }
                      disabled={savingReminderId === reminder.id}
                      className="mt-1 w-full rounded-lg border border-[#111214]/12 bg-white px-2 py-1.5 text-[11px] text-[#111214]/75"
                    >
                      {(Object.keys(CADENCE_LABELS) as ScreeningCadence[]).map(
                        (cadence) => (
                          <option key={cadence} value={cadence}>
                            {CADENCE_LABELS[cadence]}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="text-[10px] text-[#111214]/45">
                    Statut
                    <select
                      value={reminder.status}
                      onChange={(event) =>
                        void updateReminder(reminder.id, {
                          status: event.currentTarget
                            .value as ScreeningReminderStatus,
                        })
                      }
                      disabled={savingReminderId === reminder.id}
                      className="mt-1 w-full rounded-lg border border-[#111214]/12 bg-white px-2 py-1.5 text-[11px] text-[#111214]/75"
                    >
                      {(
                        Object.keys(STATUS_LABELS) as ScreeningReminderStatus[]
                      ).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <AnimatePresence initial={false}>
        {isSettingsOpen ? (
          <motion.section
            id="pat23-settings"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="space-y-2 rounded-xl border border-[#5B1112]/16 bg-[#5B1112]/4 p-3"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/65">
              Paramètres des rappels
            </p>
            <p className="text-[11px] text-[#111214]/55">
              Choisissez les canaux utilisés pour les rappels de dépistage.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["sms", "SMS"],
                  ["whatsapp", "WhatsApp"],
                  ["email", "Email"],
                ] as Array<[keyof NotificationChannelPreference, string]>
              ).map(([channel, label]) => {
                const enabled = Boolean(screeningChannels?.[channel]);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => void toggleScreeningChannel(channel)}
                    disabled={isSavingChannels || !screeningChannels}
                    className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                      enabled
                        ? "border-[#5B1112]/30 bg-[#5B1112]/14 text-[#5B1112]"
                        : "border-[#111214]/14 bg-white text-[#111214]/55"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function WeeklyScanCard({
  delay = 0,
  hasActingProfile,
  skinScores,
  loading,
  error,
}: {
  delay?: number;
  hasActingProfile: boolean;
  skinScores: SkinScoreRecord[];
  loading: boolean;
  error: string | null;
}) {
  const sortedScores = useMemo(
    () =>
      [...skinScores].sort((first, second) =>
        first.measuredAt.localeCompare(second.measuredAt),
      ),
    [skinScores],
  );
  const latestScore = sortedScores[sortedScores.length - 1] ?? null;
  const scansLast7Days = useMemo(() => {
    if (!latestScore) return 0;
    const latestMeasuredAt = new Date(latestScore.measuredAt).getTime();
    if (Number.isNaN(latestMeasuredAt)) return 0;
    const threshold = latestMeasuredAt - 7 * 24 * 60 * 60 * 1000;
    return sortedScores.filter((score) => {
      const measuredAt = new Date(score.measuredAt).getTime();
      return !Number.isNaN(measuredAt) && measuredAt >= threshold;
    }).length;
  }, [latestScore, sortedScores]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 rounded-[2rem] border border-[#5B1112]/8 p-5"
      style={{
        background:
          "linear-gradient(135deg, #fff9f0 0%, #FEF0D5 70%, #fde8bf 100%)",
      }}
    >
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[1.1rem] bg-[#5B1112] shadow-lg shadow-[#5B1112]/30"
      >
        <ScanFace size={22} className="text-white" />
      </motion.div>

      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/45">
          Cette semaine
        </p>
        <p className="font-serif text-[#111214]" style={{ fontSize: 16 }}>
          Scan IA hebdomadaire
        </p>
        {!hasActingProfile ? (
          <p className="mt-1 text-[10px] text-[#111214]/42">
            Lancez un premier scan pour démarrer le suivi.
          </p>
        ) : loading ? (
          <p className="mt-1 text-[10px] text-[#111214]/42">
            Chargement des scans...
          </p>
        ) : error ? (
          <p className="mt-1 text-[10px] text-[#5B1112]">{error}</p>
        ) : latestScore ? (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-[#111214]/35">
              Dernier scan : il y a {formatRelativeFromNow(latestScore.measuredAt)}
            </span>
            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#111214]/20" />
            <span className="text-[10px] font-medium text-[#5B1112]/55">
              {scansLast7Days} scan{scansLast7Days > 1 ? "s" : ""} sur 7 jours
            </span>
          </div>
        ) : (
          <p className="mt-1 text-[10px] text-[#111214]/42">
            Aucun scan enregistré pour ce profil pour le moment.
          </p>
        )}
      </div>

      <Link to={PATHS.scan} className="flex-shrink-0">
        <motion.div
          whileHover={{ scale: 1.04, x: -2 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 rounded-full bg-[#5B1112] px-4 py-2.5 text-xs font-medium text-white shadow-md shadow-[#5B1112]/22"
        >
          {latestScore ? "Scanner" : "Premier scan"}
          <ChevronRight size={12} />
        </motion.div>
      </Link>
    </motion.div>
  );
}

function RightPanel() {
  const shortcuts = [
    {
      Icon: ScanFace,
      label: "Scanner",
      to: PATHS.scan,
      desc: "Analyse IA cutanee",
    },
    {
      Icon: Camera,
      label: "Ajouter photos",
      to: PATHS.photos,
      desc: "Galerie et suivi visuel",
    },
    {
      Icon: Plus,
      label: "Nouveau cas",
      to: PATHS.cases,
      desc: "Creer un suivi",
    },
  ];

  const stats = [
    { Icon: CloudSun, label: "UV Index", value: "8", unit: "/12", warn: true },
    { Icon: Droplets, label: "Hydratat.", value: "72", unit: "%", warn: false },
    { Icon: Wind, label: "Harmattan", value: "Actif", unit: "", warn: false },
    { Icon: Activity, label: "Peau", value: "Bon", unit: "", warn: false },
  ];

  return (
    <div className="sticky top-8 flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center gap-5 overflow-hidden rounded-[2.5rem] border border-white bg-white/70 p-8 shadow-[0_8px_48px_rgba(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FEF0D5] opacity-70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-24 w-24 rounded-full bg-[#5B1112]/3 blur-2xl" />
        <div className="relative z-10">
          <MelaniaMascot size={140} delay={0.4} />
        </div>

        <div className="relative z-10 w-full">
          <div
            className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-[#FEF0D5]/80"
            style={{ boxShadow: "-1px -1px 0 rgba(17,18,20,0.04)" }}
          />
          <div className="rounded-[1.25rem] border border-[#111214]/5 bg-[#FEF0D5]/80 px-5 py-4 backdrop-blur-sm">
            <p className="text-center text-xs italic leading-relaxed text-[#111214]/60">
              "Ta peau est bien hydratee aujourd'hui. Continue avec ton serum."
            </p>
          </div>
        </div>

        <p className="z-10 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5B1112]/40">
          Melanis · Votre guide peau
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Raccourcis
        </p>
        <div className="flex flex-col gap-2">
          {shortcuts.map(({ Icon, label, to, desc }, index) => (
            <Link key={`${label}-${index}`} to={to}>
              <motion.div
                whileHover={{ x: 3 }}
                className="group flex cursor-pointer items-center gap-3 rounded-[1.25rem] bg-[#111214]/3 px-4 py-3 transition-colors hover:bg-[#5B1112]/5"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon size={14} className="text-[#5B1112]/55" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#111214]/65 transition-colors group-hover:text-[#111214]">
                    {label}
                  </p>
                  <p className="truncate text-[9px] text-[#111214]/30">
                    {desc}
                  </p>
                </div>
                <ChevronRight
                  size={12}
                  className="flex-shrink-0 text-[#111214]/18 transition-colors group-hover:text-[#5B1112]/40"
                />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Meteo Peau · Dakar
        </p>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ Icon, label, value, unit, warn }, index) => (
            <motion.div
              key={`${label}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.07 }}
              className={`flex flex-col items-center gap-1 rounded-[1.25rem] py-3 ${
                warn
                  ? "border border-amber-100/80 bg-amber-50"
                  : "bg-[#111214]/3"
              }`}
            >
              <Icon
                size={13}
                className={warn ? "text-amber-500" : "text-[#5B1112]/50"}
              />
              <div className="flex items-baseline gap-px">
                <span className="font-serif text-sm text-[#111214]">
                  {value}
                </span>
                <span style={{ fontSize: 8, color: "rgba(17,18,20,0.35)" }}>
                  {unit}
                </span>
              </div>
              <span
                style={{ fontSize: 7.5, color: "rgba(17,18,20,0.4)" }}
                className="px-1 text-center uppercase leading-tight tracking-wider"
              >
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export function DashboardHome({
  firstName,
  hasActingProfile,
  upcoming,
  upcomingLoading,
  upcomingError,
  skinScores,
  skinScoresLoading,
  skinScoresError,
}: DashboardHomeProps) {
  const greeting = getGreeting();

  return (
    <div className="min-h-full xl:grid xl:grid-cols-[1fr_300px] xl:items-start xl:gap-10">
      <div className="mx-auto w-full max-w-[48rem] space-y-4 pb-28 lg:pb-12 xl:max-w-none">
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="pb-1 pt-1"
        >
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <h1
              className="font-serif text-[#111214]"
              style={{ fontSize: 32, lineHeight: 1.15 }}
            >
              {greeting},
            </h1>
            <h1
              className="font-serif text-[#5B1112]"
              style={{ fontSize: 32, lineHeight: 1.15 }}
            >
              {firstName}
            </h1>
          </div>
        </motion.div>

        <div id="appointments" className="scroll-mt-28">
          <QuickActions />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AppointmentCard
            delay={0.14}
            appointment={upcoming}
            hasActingProfile={hasActingProfile}
            loading={upcomingLoading}
            error={upcomingError}
          />
          <TodayCard
            delay={0.2}
            hasActingProfile={hasActingProfile}
            skinScores={skinScores}
            loading={skinScoresLoading}
            error={skinScoresError}
          />
        </div>

        <div id="records" className="scroll-mt-28">
          <RoutineCard delay={0.28} />
        </div>

        <div id="scan" className="scroll-mt-28">
          <WeeklyScanCard
            delay={0.36}
            hasActingProfile={hasActingProfile}
            skinScores={skinScores}
            loading={skinScoresLoading}
            error={skinScoresError}
          />
        </div>
      </div>

      <div className="hidden xl:block">
        <RightPanel />
      </div>
    </div>
  );
}

export default function AU06() {
  const navigate = useNavigate();
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const actingProfileId = auth.actingProfileId;
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [skinScores, setSkinScores] = useState<SkinScoreRecord[]>([]);
  const [skinScoresLoading, setSkinScoresLoading] = useState(false);
  const [skinScoresError, setSkinScoresError] = useState<string | null>(null);
  const hasActingProfile = Boolean(userId && actingProfileId);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId || !actingProfileId) return;

      setAppointmentsLoading(true);
      setAppointmentsError(null);
      setSkinScoresLoading(true);
      setSkinScoresError(null);

      void auth.appointmentAdapter
        .listAppointmentsForProfile(actingProfileId)
        .then((items) => {
          if (cancelled) return;
          setAppointments(items);
        })
        .catch((adapterError) => {
          if (cancelled) return;
          setAppointments([]);
          setAppointmentsError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les rendez-vous du profil.",
          );
        })
        .finally(() => {
          if (cancelled) return;
          setAppointmentsLoading(false);
        });

      void auth.accountAdapter
        .listSkinScores(userId, actingProfileId, 7)
        .then((records) => {
          if (cancelled) return;
          setSkinScores(records);
        })
        .catch((adapterError) => {
          if (cancelled) return;
          setSkinScores([]);
          setSkinScoresError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les scores peau du profil.",
          );
        })
        .finally(() => {
          if (cancelled) return;
          setSkinScoresLoading(false);
        });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    actingProfileId,
    auth.accountAdapter,
    auth.appointmentAdapter,
    userId,
  ]);

  const firstName = useMemo(
    () => getFirstName(auth.user?.fullName),
    [auth.user?.fullName],
  );

  const upcoming = useMemo(
    () => {
      const nextAppointment = selectUpcomingAppointment(appointments);
      return nextAppointment ? toUpcomingAppointment(nextAppointment) : null;
    },
    [appointments],
  );

  const handleLogout = () => {
    void auth.logout().finally(() => {
      navigate("/patient-flow/auth", { replace: true });
    });
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout
      fullName={auth.user?.fullName ?? "Fatou Diop"}
      onLogout={handleLogout}
    >
      <DashboardHome
        firstName={firstName}
        hasActingProfile={hasActingProfile}
        upcoming={hasActingProfile ? upcoming : null}
        upcomingLoading={hasActingProfile ? appointmentsLoading : false}
        upcomingError={hasActingProfile ? appointmentsError : null}
        skinScores={hasActingProfile ? skinScores : []}
        skinScoresLoading={hasActingProfile ? skinScoresLoading : false}
        skinScoresError={hasActingProfile ? skinScoresError : null}
      />
    </DashboardLayout>
  );
}
