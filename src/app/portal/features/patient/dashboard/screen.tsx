import type {
  ClinicalDocumentRecord,
  EducationProgramRecord,
  PatientRecordEvent,
  PreventionCurrentRecord,
  ScreeningCadence,
  ScreeningReminder,
  ScreeningReminderStatus,
  SkinScoreRecord,
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
  FileText,
  Pill,
  Plus,
  Shield,
  ScanFace,
  Sparkles,
  TrendingUp,
  User,
  Video,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

const DASHBOARD_PATH = "/patient-flow/auth/dashboard";
const PROFILE_PATH = "/patient-flow/account";
const BOOKING_PATH = "/patient-flow";
const DOCUMENTS_PATH = "/patient-flow/auth/dashboard/documents";
const EMPTY_CLINICAL_DOCUMENTS: ClinicalDocumentRecord[] = [];
const EMPTY_TIMELINE_EVENTS: PatientRecordEvent[] = [];
const EMPTY_SCREENING_REMINDERS: ScreeningReminder[] = [];

const PATHS = {
  home: DASHBOARD_PATH,
  appointments: `${DASHBOARD_PATH}#appointments`,
  records: `${DASHBOARD_PATH}#records`,
  profile: PROFILE_PATH,
  scan: `${DASHBOARD_PATH}#scan`,
  telederm: "/patient-flow/auth/telederm",
  programs: "/patient-flow/auth/programs",
  prevention: "/patient-flow/auth/prevention",
  reminders: "/patient-flow/auth/reminders",
  photos: `${DASHBOARD_PATH}#photos`,
  cases: BOOKING_PATH,
  booking: BOOKING_PATH,
} as const;

function getDocumentDetailPath(documentId: string) {
  return `${DOCUMENTS_PATH}/${documentId}`;
}

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
  id?: string;
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
  recentDocuments: ClinicalDocumentRecord[];
  recentDocumentsLoading: boolean;
  recentDocumentsError: string | null;
  clinicalDocuments?: ClinicalDocumentRecord[];
  timelineEvents?: PatientRecordEvent[];
  screeningReminders?: ScreeningReminder[];
  careHubLoading?: boolean;
  careHubError?: string | null;
  skinScores: SkinScoreRecord[];
  skinScoresLoading: boolean;
  skinScoresError: string | null;
  educationPrograms: EducationProgramRecord[];
  preventionCurrent: PreventionCurrentRecord | null;
  preventionLoading: boolean;
  preventionError: string | null;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bonjour";
  if (hour < 18) return "Bon après-midi";
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
  if (type === "appointment_checked_in") return Clock;
  if (type === "consultation_started" || type === "consultation_completed")
    return Check;
  if (type === "consent_signed" || type === "consent_revoked") return Bell;
  if (type === "prescription_issued") return Pill;
  if (type === "document_shared") return FileText;
  if (type === "follow_up_scheduled") return Calendar;
  if (type === "measurement_recorded") return Activity;
  if (type === "profile_updated") return User;
  if (type === "dependent_created" || type === "dependent_unlinked")
    return Plus;
  return Activity;
}

function documentKindLabel(kind: ClinicalDocumentRecord["kind"]) {
  if (kind === "prescription") return "Ordonnance";
  if (kind === "report") return "Compte-rendu";
  return "Document";
}

function documentPreviewText(document: ClinicalDocumentRecord): string {
  if (document.summary && document.summary.trim().length > 0) {
    return document.summary.trim();
  }
  if (document.body && document.body.trim().length > 0) {
    return document.body.trim().slice(0, 140);
  }
  if (document.prescriptionItems.length > 0) {
    return document.prescriptionItems
      .slice(0, 2)
      .map((item) => `${item.name}: ${item.instructions}`)
      .join(" · ");
  }
  return documentKindLabel(document.kind);
}

function reminderStatusTone(status: ScreeningReminderStatus) {
  if (status === "completed")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "snoozed")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-[#111214]/10 bg-[#111214]/5 text-[#111214]/60";
}

function channelSummary(channels: ScreeningReminder["channels"]) {
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
  if (score >= 80) return "Excellent état";
  if (score >= 65) return "Équilibre stable";
  if (score >= 50) return "Peau à surveiller";
  return "Suivi recommandé";
}

function scoreTrendLabel(delta: number | null): string {
  if (delta === null) return "Premier score enregistré";
  if (delta > 0) return `+${delta} vs précédent`;
  if (delta < 0) return `${delta} vs précédent`;
  return "Stable vs précédent";
}

function selectUpcomingAppointment(
  appointments: AppointmentRecord[],
): AppointmentRecord | null {
  const sorted = [...appointments].sort((first, second) => {
    const firstTime = new Date(first.scheduledFor).getTime();
    const secondTime = new Date(second.scheduledFor).getTime();
    const safeFirst = Number.isNaN(firstTime)
      ? Number.MAX_SAFE_INTEGER
      : firstTime;
    const safeSecond = Number.isNaN(secondTime)
      ? Number.MAX_SAFE_INTEGER
      : secondTime;
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
  const fallbackLocation =
    appointment.appointmentType === "video" ? "Consultation video" : "Cabinet";
  return {
    id: appointment.id,
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

  if (!hasActingProfile) {
    return null;
  }

  const actions = [
    { Icon: Calendar, label: "Réserver un RDV", to: PATHS.booking },
    { Icon: ScanFace, label: "Télé-derm", to: PATHS.telederm },
    { Icon: FileText, label: "Programmes", to: PATHS.programs },
    { Icon: Shield, label: "Prévention", to: PATHS.prevention },
    { Icon: Bell, label: "Rappels", to: PATHS.reminders },
    { Icon: User, label: "Mon profil", to: PROFILE_PATH },
  ] as const;

  return (
    <section className="space-y-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
          Accès rapide
        </p>
        <p className="mt-1 text-sm text-[#111214]/56">
          Les raccourcis essentiels pour gérer votre suivi sans chercher.
        </p>
      </div>
      <div className="flex items-center gap-2.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {actions.map(({ Icon, label, to }, index) => (
          <Link key={label} to={to}>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 + index * 0.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-shrink-0 items-center gap-2 rounded-full border border-[#111214]/8 bg-white/80 px-4 py-2.5 shadow-sm transition-all hover:border-[#5B1112]/20 hover:bg-white hover:shadow-md"
            >
              <Icon size={13} className="text-[#5B1112]/65" />
              <span className="whitespace-nowrap text-xs font-medium text-[#111214]/70">
                {label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PatientEngagementStrip({
  hasActingProfile,
  educationPrograms,
  preventionCurrent,
  preventionLoading,
  preventionError,
}: {
  hasActingProfile: boolean;
  educationPrograms: EducationProgramRecord[];
  preventionCurrent: PreventionCurrentRecord | null;
  preventionLoading: boolean;
  preventionError: string | null;
}) {
  if (!hasActingProfile) return null;
  const activeAlerts = preventionCurrent?.alerts ?? [];
  const nextCheckIn = educationPrograms
    .map((item) => item.enrollment?.nextCheckInDueAt)
    .filter((value): value is string => Boolean(value))
    .sort()[0];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Link
        to={PATHS.programs}
        className="block rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_8px_28px_rgba(17,18,20,0.05)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Parcours éducatif
            </p>
            <h3 className="mt-2 font-serif text-[1.4rem] text-[#111214]">
              {educationPrograms.length} programme{educationPrograms.length > 1 ? "s" : ""}
            </h3>
            <p className="mt-2 text-sm text-[#111214]/56">
              {nextCheckIn
                ? `Prochain check-in : ${formatDate(nextCheckIn)}`
                : "Aucun check-in planifié pour le moment."}
            </p>
          </div>
          <ArrowUpRight size={18} className="text-[#5B1112]" />
        </div>
      </Link>

      <Link
        to={PATHS.prevention}
        className="block rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_8px_28px_rgba(17,18,20,0.05)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Prévention
            </p>
            <h3 className="mt-2 font-serif text-[1.4rem] text-[#111214]">
              {preventionLoading
                ? "Chargement..."
                : preventionError
                  ? "Indisponible"
                  : `${activeAlerts.length} alerte${activeAlerts.length > 1 ? "s" : ""}`}
            </h3>
            <p className="mt-2 text-sm text-[#111214]/56">
              {preventionError
                ? preventionError
                : activeAlerts[0]?.title ??
                  "Pas de signal critique détecté actuellement."}
            </p>
          </div>
          <Shield size={18} className="text-[#5B1112]" />
        </div>
      </Link>
    </section>
  );
}

function PatientPriorityStrip({
  hasActingProfile,
  upcoming,
  upcomingLoading,
  upcomingError,
  recentDocuments,
  recentDocumentsLoading,
  recentDocumentsError,
  skinScores,
  skinScoresLoading,
  skinScoresError,
}: {
  hasActingProfile: boolean;
  upcoming: UpcomingAppointment | null;
  upcomingLoading: boolean;
  upcomingError: string | null;
  recentDocuments: ClinicalDocumentRecord[];
  recentDocumentsLoading: boolean;
  recentDocumentsError: string | null;
  skinScores: SkinScoreRecord[];
  skinScoresLoading: boolean;
  skinScoresError: string | null;
}) {
  const latestDocument = recentDocuments[0] ?? null;
  const latestScore = useMemo(
    () =>
      [...skinScores].sort((first, second) =>
        second.measuredAt.localeCompare(first.measuredAt),
      )[0] ?? null,
    [skinScores],
  );

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#111214] p-5 text-white shadow-[0_10px_36px_rgba(17,18,20,0.2)]">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#5B1112]/50 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Calendar size={12} />
            Priorité du jour
          </div>
          {!hasActingProfile ? (
            <>
              <p className="mt-4 font-serif text-[1.6rem] leading-tight">
                Activez un profil pour voir votre suivi.
              </p>
              <p className="mt-2 max-w-xs text-sm text-white/65">
                Le rendez-vous, les documents et les rappels s&apos;affichent
                ici dès qu&apos;un profil patient est actif.
              </p>
              <Link
                to="/patient-flow/account/select-profile"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#111214]"
              >
                Choisir un profil
                <ArrowUpRight size={12} />
              </Link>
            </>
          ) : upcomingLoading ? (
            <p className="mt-4 text-sm text-white/68">
              Chargement du prochain rendez-vous...
            </p>
          ) : upcomingError ? (
            <p className="mt-4 text-sm text-white/72">{upcomingError}</p>
          ) : upcoming ? (
            <>
              <p className="mt-4 font-serif text-[1.85rem] leading-tight">
                {upcoming.practitioner}
              </p>
              <p className="mt-2 text-sm text-white/65">
                {upcoming.dateLabel} · {upcoming.timeLabel} ·{" "}
                {upcoming.location}
              </p>
              <Link
                to={PATHS.appointments}
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-xs font-semibold text-white"
              >
                Ouvrir le rendez-vous
                <ArrowUpRight size={12} />
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 font-serif text-[1.6rem] leading-tight">
                Aucun rendez-vous à venir.
              </p>
              <p className="mt-2 max-w-xs text-sm text-white/65">
                Réservez votre prochain rendez-vous pour retrouver vos consignes
                ici.
              </p>
              <Link
                to={PATHS.booking}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-semibold text-white"
              >
                Réserver maintenant
                <ArrowUpRight size={12} />
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-[#5B1112]/12 bg-white/88 p-5 shadow-[0_6px_28px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/55">
          <FileText size={12} />
          Dernier document
        </div>
        {!hasActingProfile ? (
          <p className="mt-4 text-sm text-[#111214]/58">
            Les documents du praticien s&apos;afficheront ici pour le profil
            actif.
          </p>
        ) : recentDocumentsLoading ? (
          <p className="mt-4 text-sm text-[#111214]/58">
            Chargement des documents...
          </p>
        ) : recentDocumentsError ? (
          <p className="mt-4 text-sm text-[#5B1112]">{recentDocumentsError}</p>
        ) : latestDocument ? (
          <>
            <p className="mt-4 line-clamp-2 font-serif text-[1.55rem] leading-tight text-[#111214]">
              {latestDocument.title}
            </p>
            <p className="mt-2 text-sm text-[#111214]/58">
              {documentKindLabel(latestDocument.kind)} · publié le{" "}
              {formatDate(
                latestDocument.publishedAt ?? latestDocument.createdAt,
              )}
            </p>
            <p className="mt-3 line-clamp-3 text-sm text-[#111214]/62">
              {documentPreviewText(latestDocument)}
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Link
                to={getDocumentDetailPath(latestDocument.id)}
                className="inline-flex items-center gap-2 rounded-full bg-[#111214] px-4 py-2 text-xs font-semibold text-white"
              >
                Lire le document
                <ArrowUpRight size={12} />
              </Link>
              <span className="rounded-full bg-[#5B1112]/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5B1112]/70">
                {recentDocuments.length} disponible
                {recentDocuments.length > 1 ? "s" : ""}
              </span>
            </div>
          </>
        ) : (
          <>
            <p className="mt-4 font-serif text-[1.45rem] leading-tight text-[#111214]">
              Aucun document partagé pour le moment.
            </p>
            <p className="mt-2 text-sm text-[#111214]/58">
              Les ordonnances et comptes-rendus arriveront ici après la
              consultation.
            </p>
          </>
        )}
      </div>

      <div className="rounded-[2rem] border border-[#111214]/8 bg-[linear-gradient(145deg,#fff9ef_0%,#fff1d9_100%)] p-5 shadow-[0_6px_28px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/42">
          <ScanFace size={12} />
          Suivi peau
        </div>
        {!hasActingProfile ? (
          <p className="mt-4 text-sm text-[#111214]/58">
            Lancez un premier scan pour faire apparaître votre score et vos
            tendances.
          </p>
        ) : skinScoresLoading ? (
          <p className="mt-4 text-sm text-[#111214]/58">
            Chargement du suivi peau...
          </p>
        ) : skinScoresError ? (
          <p className="mt-4 text-sm text-[#5B1112]">{skinScoresError}</p>
        ) : latestScore ? (
          <>
            <div className="mt-4 flex items-end gap-3">
              <span className="font-serif text-[3rem] leading-none text-[#5B1112]">
                {latestScore.score}
              </span>
              <div className="pb-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111214]/38">
                  Score actuel
                </p>
                <p className="mt-1 text-sm text-[#111214]/58">
                  {scoreStatusLabel(latestScore.score)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#111214]/58">
              Dernière mesure le {formatDateTime(latestScore.measuredAt)}.
            </p>
            <Link
              to={PATHS.scan}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-xs font-semibold text-white"
            >
              Ouvrir le suivi
              <ArrowUpRight size={12} />
            </Link>
          </>
        ) : (
          <>
            <p className="mt-4 font-serif text-[1.45rem] leading-tight text-[#111214]">
              Aucun score enregistré.
            </p>
            <p className="mt-2 text-sm text-[#111214]/58">
              Un premier scan suffit pour commencer le suivi de votre peau.
            </p>
            <Link
              to={PATHS.scan}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#111214]/10 bg-white px-4 py-2 text-xs font-semibold text-[#111214]"
            >
              Faire mon premier scan
              <ArrowUpRight size={12} />
            </Link>
          </>
        )}
      </div>
    </section>
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
  const isInJoinWindow = minsUntil !== null && minsUntil <= 30;
  const isJoinableVideo = Boolean(isInJoinWindow && appointment?.isVideo && appointment.id);
  const showCountdown = minsUntil !== null && minsUntil > 0 && minsUntil <= 120;
  const actionClassName = `flex items-center justify-center gap-2 rounded-[1.25rem] py-3 text-sm font-medium transition-all ${
    isClose || isJoinableVideo
      ? "bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/40"
      : "border border-white/8 bg-white/10 text-white/75 hover:bg-white/18"
  }`;

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
                Lancez la réservation et choisissez le profil pendant le
                parcours.
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
                to={PATHS.appointments}
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
              {isJoinableVideo ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to={`/patient-flow/auth/appointments/${appointment.id}/video`}
                    className={actionClassName}
                  >
                    <Video size={14} />
                    Rejoindre la video
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={actionClassName}
                >
                  <Clock size={14} />
                  Preparer le RDV
                </motion.div>
              )}
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
  const visibleStartIndex = Math.max(
    sortedScores.length - visibleScores.length,
    0,
  );
  const selectedScore =
    sortedScores.find((score) => score.id === selectedScoreId) ??
    sortedScores[sortedScores.length - 1] ??
    null;
  const activeIndex = selectedScore
    ? sortedScores.findIndex((score) => score.id === selectedScore.id)
    : -1;
  const previousScore =
    activeIndex > 0 ? (sortedScores[activeIndex - 1] ?? null) : null;
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
                  const num = scoreDate.getDate().toString().padStart(2, "0");

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
                <p className="mt-0.5 text-xs text-[#111214]/40">
                  {scoreStatus}
                </p>
                <p className="mt-1 text-[10px] text-[#111214]/30">
                  Mesure enregistrée le{" "}
                  {formatDateTime(selectedScore.measuredAt)}
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

interface CarePlanItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  tone: "urgent" | "attention" | "stable";
  to: string;
  cta: string;
  badge?: string;
}

function planToneClasses(tone: CarePlanItem["tone"]) {
  if (tone === "urgent") {
    return {
      icon: "bg-[#5B1112] text-white",
      badge: "border-[#5B1112]/14 bg-[#5B1112]/[0.07] text-[#5B1112]",
    };
  }
  if (tone === "attention") {
    return {
      icon: "bg-amber-50 text-amber-700",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }
  return {
    icon: "bg-[#111214]/5 text-[#111214]/60",
    badge: "border-[#111214]/10 bg-[#111214]/5 text-[#111214]/55",
  };
}

function selectLatestPrescription(
  documents: ClinicalDocumentRecord[],
): ClinicalDocumentRecord | null {
  return (
    [...documents]
      .sort((first, second) =>
        (second.publishedAt ?? second.createdAt).localeCompare(
          first.publishedAt ?? first.createdAt,
        ),
      )
      .find(
        (document) =>
          document.kind === "prescription" ||
          document.prescriptionItems.length > 0,
      ) ?? null
  );
}

function selectNextReminder(
  reminders: ScreeningReminder[],
): ScreeningReminder | null {
  return (
    [...reminders]
      .filter((reminder) => reminder.status !== "completed")
      .sort((first, second) => first.nextDueAt.localeCompare(second.nextDueAt))[0] ??
    null
  );
}

function selectLatestTimelineEvent(
  events: PatientRecordEvent[],
): PatientRecordEvent | null {
  return (
    [...events].sort((first, second) =>
      second.occurredAt.localeCompare(first.occurredAt),
    )[0] ?? null
  );
}

function RoutineCard({
  delay = 0,
  upcoming,
  hasActingProfile,
  clinicalDocuments,
  timelineEvents,
  screeningReminders,
  loading,
  error,
}: {
  delay?: number;
  upcoming: UpcomingAppointment | null;
  hasActingProfile: boolean;
  clinicalDocuments: ClinicalDocumentRecord[];
  timelineEvents: PatientRecordEvent[];
  screeningReminders: ScreeningReminder[];
  loading: boolean;
  error: string | null;
}) {
  const visibleTimelineEvents = hasActingProfile
    ? timelineEvents
    : EMPTY_TIMELINE_EVENTS;
  const visibleClinicalDocuments = hasActingProfile
    ? clinicalDocuments
    : EMPTY_CLINICAL_DOCUMENTS;
  const visibleScreeningReminders = hasActingProfile
    ? screeningReminders
    : EMPTY_SCREENING_REMINDERS;
  const visibleHubError = hasActingProfile ? error : null;
  const visibleIsHubLoading = hasActingProfile ? loading : false;

  const latestDocuments = useMemo(
    () =>
      [...visibleClinicalDocuments]
        .sort((first, second) =>
          (second.publishedAt ?? second.createdAt).localeCompare(
            first.publishedAt ?? first.createdAt,
          ),
        )
        .slice(0, 4),
    [visibleClinicalDocuments],
  );

  const featuredDocument = latestDocuments[0] ?? null;
  const latestPrescription = useMemo(
    () => selectLatestPrescription(visibleClinicalDocuments),
    [visibleClinicalDocuments],
  );
  const nextReminder = useMemo(
    () => selectNextReminder(visibleScreeningReminders),
    [visibleScreeningReminders],
  );
  const latestTimelineEvent = useMemo(
    () => selectLatestTimelineEvent(visibleTimelineEvents),
    [visibleTimelineEvents],
  );
  const carePlanItems = useMemo<CarePlanItem[]>(() => {
    const items: CarePlanItem[] = [];

    if (upcoming) {
      const minutesUntil = minutesUntilDate(upcoming.scheduledFor);
      items.push({
        id: "upcoming-appointment",
        label: "Rendez-vous",
        title: `${upcoming.practitioner} · ${upcoming.dateLabel}`,
        subtitle: `${upcoming.timeLabel} · ${upcoming.location}`,
        Icon: Calendar,
        tone:
          minutesUntil !== null && minutesUntil <= 24 * 60 ? "urgent" : "stable",
        to: PATHS.appointments,
        cta: "Voir le rendez-vous",
        badge:
          minutesUntil !== null && minutesUntil >= 0
            ? `Dans ${formatRelativeFromNow(upcoming.scheduledFor)}`
            : "Planifié",
      });
    }

    if (latestPrescription) {
      const leadItem = latestPrescription.prescriptionItems[0];
      items.push({
        id: "active-prescription",
        label: "Ordonnance active",
        title: leadItem?.name ?? latestPrescription.title,
        subtitle:
          leadItem?.instructions ??
          documentPreviewText(latestPrescription).slice(0, 120),
        Icon: Pill,
        tone: "attention",
        to: getDocumentDetailPath(latestPrescription.id),
        cta: "Ouvrir l'ordonnance",
        badge: `v${latestPrescription.version}`,
      });
    }

    if (nextReminder) {
      items.push({
        id: "next-follow-up",
        label: "Rappel de suivi",
        title: nextReminder.screeningType,
        subtitle: `Échéance le ${formatDate(nextReminder.nextDueAt)} · ${CADENCE_LABELS[nextReminder.cadence]}`,
        Icon: Bell,
        tone: nextReminder.status === "snoozed" ? "attention" : "stable",
        to: PATHS.records,
        cta: "Voir les rappels",
        badge: STATUS_LABELS[nextReminder.status],
      });
    }

    if (latestTimelineEvent) {
      items.push({
        id: "latest-timeline-event",
        label: "Dernière mise à jour",
        title: latestTimelineEvent.title,
        subtitle:
          latestTimelineEvent.description ??
          `Enregistré ${formatRelativeFromNow(latestTimelineEvent.occurredAt)} plus tôt`,
        Icon: timelineIcon(latestTimelineEvent.type),
        tone: "stable",
        to: PATHS.records,
        cta: "Ouvrir le dossier",
        badge: formatDateTime(latestTimelineEvent.occurredAt),
      });
    }

    return items;
  }, [latestPrescription, latestTimelineEvent, nextReminder, upcoming]);

  if (!hasActingProfile) {
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
          Plan de suivi indisponible
        </h3>
        <p className="mt-2 text-sm text-[#111214]/62">
          Le plan clinique, les rappels et les derniers documents
          apparaîtront dès qu&apos;un profil actif et une première activité de
          soin seront disponibles.
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
    <>
      {/* ── Card 1 : Plan de suivi ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl mb-2"
      >
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
              Plan de suivi
            </p>
            <span className="text-[10px] font-semibold text-[#5B1112]">
              {carePlanItems.length} repère{carePlanItems.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-xs text-[#111214]/50">
            Synthèse en temps réel de votre rendez-vous, de vos documents
            cliniques et des rappels déjà enregistrés.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Documents", value: `${latestDocuments.length}` },
            { label: "Rappels", value: `${visibleScreeningReminders.length}` },
            { label: "Événements", value: `${visibleTimelineEvents.length}` },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.1rem] border border-[#111214]/8 bg-white px-3 py-3"
            >
              <p className="text-[9px] uppercase tracking-[0.18em] text-[#111214]/35">
                {metric.label}
              </p>
              <p className="mt-1 font-serif text-xl text-[#111214]">
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {carePlanItems.length === 0 && !visibleIsHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun repère clinique n&apos;est encore disponible pour ce profil.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {carePlanItems.map((item) => {
              const toneClasses = planToneClasses(item.tone);
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className="rounded-[1.25rem] border border-[#111214]/6 bg-white px-4 py-3 transition-all hover:border-[#5B1112]/10 hover:bg-[#FAF7F2]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[1rem] ${toneClasses.icon}`}
                    >
                      <item.Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[9px] uppercase tracking-[0.18em] text-[#111214]/35">
                          {item.label}
                        </p>
                        {item.badge ? (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[9px] font-medium ${toneClasses.badge}`}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-medium text-[#111214]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-[11px] text-[#111214]/50">
                        {item.subtitle}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#5B1112]">
                        {item.cta}
                        <ArrowUpRight size={11} />
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Card 2 : Ordonnances & documents ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: delay + 0.08,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl mb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
              Ordonnances & documents
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">
              Dernières pièces publiées par votre praticien
            </p>
          </div>
          {visibleIsHubLoading ? (
            <span className="text-[10px] text-[#111214]/45">Chargement...</span>
          ) : null}
        </div>

        {visibleHubError ? (
          <div className="rounded-xl border border-[#5B1112]/20 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
            {visibleHubError}
          </div>
        ) : null}

        {featuredDocument ? (
          <Link
            to={getDocumentDetailPath(featuredDocument.id)}
            className="flex w-full items-start justify-between gap-3 rounded-[1.35rem] border border-[#5B1112]/12 bg-[#5B1112]/[0.05] px-4 py-3 text-left transition hover:bg-[#5B1112]/[0.08]"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5B1112]/70">
                Nouveau document praticien
              </p>
              <p className="mt-1 text-sm font-medium text-[#111214]">
                {featuredDocument.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-[#111214]/55">
                {documentPreviewText(featuredDocument)}
              </p>
              <p className="mt-2 text-[9px] uppercase tracking-wider text-[#111214]/35">
                {documentKindLabel(featuredDocument.kind)} ·{" "}
                {formatDate(
                  featuredDocument.publishedAt ?? featuredDocument.createdAt,
                )}
              </p>
            </div>
            <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-[#5B1112] shadow-sm">
              Ouvrir <ArrowUpRight size={11} />
            </span>
          </Link>
        ) : null}

        {latestDocuments.length === 0 && !visibleIsHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucune ordonnance ni document clinique disponible pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {latestDocuments.map((document) => (
              <div
                key={document.id}
                className="rounded-xl border border-[#111214]/8 bg-white px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[#111214]/76">
                      {document.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#111214]/42">
                      {document.summary || documentKindLabel(document.kind)}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      {documentKindLabel(document.kind)} · v{document.version} ·{" "}
                      {formatDate(document.publishedAt ?? document.createdAt)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#5B1112]/7 p-2 text-[#5B1112]">
                    {document.kind === "prescription" ? (
                      <Pill size={12} />
                    ) : (
                      <FileText size={12} />
                    )}
                  </div>
                </div>

                <div className="mt-2 flex justify-end">
                  <Link
                    to={getDocumentDetailPath(document.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5B1112]"
                  >
                    Ouvrir le détail <ArrowUpRight size={11} />
                  </Link>
                </div>

                {document.prescriptionItems.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {document.prescriptionItems.slice(0, 2).map((item) => (
                      <div
                        key={`${document.id}-${item.name}`}
                        className="rounded-lg border border-[#111214]/8 bg-[#FCFCFC] px-2.5 py-2"
                      >
                        <p className="text-[11px] font-medium text-[#111214]/76">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[#111214]/48">
                          {item.instructions}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Card 3 : Dossier patient / Timeline ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: delay + 0.14,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl mb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
              Dossier patient
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">
              Événements récents de votre parcours
            </p>
          </div>
          {visibleIsHubLoading ? (
            <span className="text-[10px] text-[#111214]/45">Chargement...</span>
          ) : null}
        </div>

        {visibleHubError ? (
          <div className="rounded-xl border border-[#5B1112]/20 bg-[#5B1112]/5 px-3 py-2 text-xs text-[#5B1112]">
            {visibleHubError}
          </div>
        ) : null}

        {visibleTimelineEvents.length === 0 && !visibleIsHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun événement de dossier pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTimelineEvents.slice(0, 6).map((event) => {
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
      </motion.div>

      {/* ── Card 4 : Rappels dépistage ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: delay + 0.2,
          duration: 0.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
              Rappels dépistage
            </p>
            <p className="mt-1 text-xs text-[#111214]/50">
              Rappels de suivi définis par votre praticien
            </p>
          </div>
          <span className="rounded-full border border-[#111214]/12 bg-white px-3 py-1.5 text-[10px] font-medium text-[#111214]/60">
            Lecture seule
          </span>
        </div>

        {visibleScreeningReminders.length === 0 && !visibleIsHubLoading ? (
          <div className="rounded-xl border border-dashed border-[#111214]/14 px-3 py-3 text-xs text-[#111214]/52">
            Aucun rappel configuré pour ce profil.
          </div>
        ) : (
          <div className="space-y-2">
            {visibleScreeningReminders.map((reminder) => (
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
                      Cadence : {CADENCE_LABELS[reminder.cadence]}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#111214]/42">
                      Prochaine échéance : {formatDate(reminder.nextDueAt)}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider text-[#111214]/35">
                      Canaux : {channelSummary(reminder.channels)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${reminderStatusTone(reminder.status)}`}
                  >
                    {STATUS_LABELS[reminder.status]}
                  </span>
                </div>
                <div className="mt-3 rounded-xl border border-dashed border-[#111214]/14 bg-[#FCFCFC] px-3 py-2.5">
                  <p className="text-[10px] text-[#111214]/52">
                    Ce rappel est configuré par votre praticien. Vous recevrez
                    simplement la prochaine alerte selon ce suivi.
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </>
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
      className="flex h-full items-center gap-4 rounded-[2rem] border border-[#5B1112]/8 p-5"
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
              Dernier scan : il y a{" "}
              {formatRelativeFromNow(latestScore.measuredAt)}
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

function RightPanel({
  hasActingProfile,
  upcoming,
  recentDocuments,
  skinScores,
}: {
  hasActingProfile: boolean;
  upcoming: UpcomingAppointment | null;
  recentDocuments: ClinicalDocumentRecord[];
  skinScores: SkinScoreRecord[];
}) {
  const latestDocument = recentDocuments[0] ?? null;
  const latestScore =
    [...skinScores].sort((first, second) =>
      second.measuredAt.localeCompare(first.measuredAt),
    )[0] ?? null;
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

  const summary = !hasActingProfile
    ? "Activez un profil pour afficher vos rendez-vous, vos documents et votre suivi clinique."
    : upcoming
      ? `Prochain rendez-vous ${upcoming.dateLabel} à ${upcoming.timeLabel} avec ${upcoming.practitioner}.`
      : latestDocument
        ? `${documentKindLabel(latestDocument.kind)} publié le ${formatDate(latestDocument.publishedAt ?? latestDocument.createdAt)}.`
        : latestScore
          ? `Dernier score peau ${latestScore.score}/100 enregistré il y a ${formatRelativeFromNow(latestScore.measuredAt)}.`
          : "Aucune activité clinique récente n'est encore disponible pour ce profil.";
  const summaryLabel = !hasActingProfile
    ? "Profil à activer"
    : upcoming
      ? "Suivi planifié"
      : latestDocument
        ? "Nouveau document"
        : latestScore
          ? "Dernier scan"
          : "En attente";
  const stats = [
    {
      Icon: Calendar,
      label: "RDV",
      value: upcoming ? upcoming.timeLabel : "--",
      unit: upcoming ? upcoming.dateLabel : "",
    },
    {
      Icon: FileText,
      label: "Docs",
      value: String(recentDocuments.length),
      unit: "publiés",
    },
    {
      Icon: ScanFace,
      label: "Scans",
      value: String(skinScores.length),
      unit: "enregistrés",
    },
    {
      Icon: TrendingUp,
      label: "Score",
      value: latestScore ? String(latestScore.score) : "--",
      unit: latestScore ? "/100" : "",
    },
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
              {summary}
            </p>
          </div>
        </div>

        <p className="z-10 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#5B1112]/40">
          Melanis · {summaryLabel}
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
          Repères du dossier
        </p>
        <div className="grid grid-cols-4 gap-2">
          {stats.map(({ Icon, label, value, unit }, index) => (
            <motion.div
              key={`${label}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.07 }}
              className="flex flex-col items-center gap-1 rounded-[1.25rem] bg-[#111214]/3 py-3"
            >
              <Icon size={13} className="text-[#5B1112]/50" />
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
        {latestDocument ? (
          <p className="mt-4 text-[10px] text-[#111214]/45">
            Dernier document: {latestDocument.title}
          </p>
        ) : null}
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
  recentDocuments,
  recentDocumentsLoading,
  recentDocumentsError,
  clinicalDocuments = recentDocuments,
  timelineEvents = EMPTY_TIMELINE_EVENTS,
  screeningReminders = EMPTY_SCREENING_REMINDERS,
  careHubLoading = recentDocumentsLoading,
  careHubError = recentDocumentsError,
  skinScores,
  skinScoresLoading,
  skinScoresError,
  educationPrograms = [],
  preventionCurrent = null,
  preventionLoading = false,
  preventionError = null,
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

        <PatientPriorityStrip
          hasActingProfile={hasActingProfile}
          upcoming={upcoming}
          upcomingLoading={upcomingLoading}
          upcomingError={upcomingError}
          recentDocuments={recentDocuments}
          recentDocumentsLoading={recentDocumentsLoading}
          recentDocumentsError={recentDocumentsError}
          skinScores={skinScores}
          skinScoresLoading={skinScoresLoading}
          skinScoresError={skinScoresError}
        />

        <QuickActions />

        <PatientEngagementStrip
          hasActingProfile={hasActingProfile}
          educationPrograms={educationPrograms}
          preventionCurrent={preventionCurrent}
          preventionLoading={preventionLoading}
          preventionError={preventionError}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div id="appointments" className="scroll-mt-28">
            <AppointmentCard
              delay={0.14}
              appointment={upcoming}
              hasActingProfile={hasActingProfile}
              loading={upcomingLoading}
              error={upcomingError}
            />
          </div>
          <TodayCard
            delay={0.2}
            hasActingProfile={hasActingProfile}
            skinScores={skinScores}
            loading={skinScoresLoading}
            error={skinScoresError}
          />
        </div>

        <div id="records" className="scroll-mt-28">
          <RoutineCard
            delay={0.28}
            upcoming={upcoming}
            hasActingProfile={hasActingProfile}
            clinicalDocuments={clinicalDocuments}
            timelineEvents={timelineEvents}
            screeningReminders={screeningReminders}
            loading={careHubLoading}
            error={careHubError}
          />
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
        <RightPanel
          hasActingProfile={hasActingProfile}
          upcoming={upcoming}
          recentDocuments={recentDocuments}
          skinScores={skinScores}
        />
      </div>
    </div>
  );
}

export default function PatientDashboardScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const actingProfileId = auth.actingProfileId;
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(
    null,
  );
  const [skinScores, setSkinScores] = useState<SkinScoreRecord[]>([]);
  const [skinScoresLoading, setSkinScoresLoading] = useState(false);
  const [skinScoresError, setSkinScoresError] = useState<string | null>(null);
  const [clinicalDocuments, setClinicalDocuments] = useState<
    ClinicalDocumentRecord[]
  >([]);
  const [timelineEvents, setTimelineEvents] = useState<PatientRecordEvent[]>([]);
  const [screeningReminders, setScreeningReminders] = useState<
    ScreeningReminder[]
  >([]);
  const [careHubLoading, setCareHubLoading] = useState(false);
  const [careHubError, setCareHubError] = useState<string | null>(null);
  const [educationPrograms, setEducationPrograms] = useState<EducationProgramRecord[]>([]);
  const [preventionCurrent, setPreventionCurrent] =
    useState<PreventionCurrentRecord | null>(null);
  const [preventionLoading, setPreventionLoading] = useState(false);
  const [preventionError, setPreventionError] = useState<string | null>(null);
  const hasActingProfile = Boolean(userId && actingProfileId);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId || !actingProfileId) {
        setAppointments([]);
        setAppointmentsLoading(false);
        setAppointmentsError(null);
        setSkinScores([]);
        setSkinScoresLoading(false);
        setSkinScoresError(null);
        setClinicalDocuments([]);
        setTimelineEvents([]);
        setScreeningReminders([]);
        setCareHubLoading(false);
        setCareHubError(null);
        setEducationPrograms([]);
        setPreventionCurrent(null);
        setPreventionLoading(false);
        setPreventionError(null);
        return;
      }

      setAppointmentsLoading(true);
      setAppointmentsError(null);
      setSkinScoresLoading(true);
      setSkinScoresError(null);
      setCareHubLoading(true);
      setCareHubError(null);
      setPreventionLoading(true);
      setPreventionError(null);

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

      void Promise.all([
        auth.accountAdapter.listClinicalDocuments(userId, actingProfileId),
        auth.accountAdapter.listTimelineEvents(userId, actingProfileId, 20),
        auth.accountAdapter.listScreeningReminders(userId, actingProfileId),
      ])
        .then(([documents, events, reminders]) => {
          if (cancelled) return;
          setClinicalDocuments(documents);
          setTimelineEvents(events);
          setScreeningReminders(reminders);
        })
        .catch((adapterError) => {
          if (cancelled) return;
          setClinicalDocuments([]);
          setTimelineEvents([]);
          setScreeningReminders([]);
          setCareHubError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger le dossier patient pour le moment.",
          );
        })
        .finally(() => {
          if (cancelled) return;
          setCareHubLoading(false);
        });

      if (typeof auth.accountAdapter.listEducationPrograms === "function") {
        void auth.accountAdapter
          .listEducationPrograms(userId, actingProfileId)
          .then((records) => {
            if (cancelled) return;
            setEducationPrograms(records);
          })
          .catch(() => {
            if (cancelled) return;
            setEducationPrograms([]);
          });
      } else {
        setEducationPrograms([]);
      }

      if (typeof auth.accountAdapter.getPreventionCurrent === "function") {
        void auth.accountAdapter
          .getPreventionCurrent(userId, actingProfileId)
          .then((record) => {
            if (cancelled) return;
            setPreventionCurrent(record);
          })
          .catch((adapterError) => {
            if (cancelled) return;
            setPreventionCurrent(null);
            setPreventionError(
              adapterError instanceof Error
                ? adapterError.message
                : "Impossible de charger la prévention.",
            );
          })
          .finally(() => {
            if (cancelled) return;
            setPreventionLoading(false);
          });
      } else {
        setPreventionCurrent(null);
        setPreventionLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [actingProfileId, auth.accountAdapter, auth.appointmentAdapter, userId]);

  const firstName = useMemo(
    () => getFirstName(auth.user?.fullName),
    [auth.user?.fullName],
  );

  const upcoming = useMemo(() => {
    const nextAppointment = selectUpcomingAppointment(appointments);
    return nextAppointment ? toUpcomingAppointment(nextAppointment) : null;
  }, [appointments]);
  const recentDocuments = useMemo(
    () =>
      [...clinicalDocuments]
        .sort((first, second) =>
          (second.publishedAt ?? second.createdAt).localeCompare(
            first.publishedAt ?? first.createdAt,
          ),
        )
        .slice(0, 4),
    [clinicalDocuments],
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
        recentDocuments={hasActingProfile ? recentDocuments : []}
        recentDocumentsLoading={hasActingProfile ? careHubLoading : false}
        recentDocumentsError={hasActingProfile ? careHubError : null}
        clinicalDocuments={hasActingProfile ? clinicalDocuments : []}
        timelineEvents={hasActingProfile ? timelineEvents : []}
        screeningReminders={hasActingProfile ? screeningReminders : []}
        careHubLoading={hasActingProfile ? careHubLoading : false}
        careHubError={hasActingProfile ? careHubError : null}
        skinScores={hasActingProfile ? skinScores : []}
        skinScoresLoading={hasActingProfile ? skinScoresLoading : false}
        skinScoresError={hasActingProfile ? skinScoresError : null}
        educationPrograms={hasActingProfile ? educationPrograms : []}
        preventionCurrent={hasActingProfile ? preventionCurrent : null}
        preventionLoading={hasActingProfile ? preventionLoading : false}
        preventionError={hasActingProfile ? preventionError : null}
      />
    </DashboardLayout>
  );
}
