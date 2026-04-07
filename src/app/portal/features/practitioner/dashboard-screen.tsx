import {
  appointmentStatusLabel,
  type AppointmentRecord,
  type AppointmentStatus,
} from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Stethoscope,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function getDrName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? parts[0] ?? "Praticien";
}

function formatTodayFull(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function getCountdownText(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
  if (diffMin === 0) return "Maintenant";
  if (diffMin > 0 && diffMin < 60) return `Dans ${diffMin} min`;
  if (diffMin > 0 && diffMin < 1440) return `Dans ${Math.round(diffMin / 60)}h`;
  if (diffMin < 0 && diffMin > -60) return `Il y a ${Math.abs(diffMin)} min`;
  if (diffMin < 0 && diffMin > -1440)
    return `Il y a ${Math.round(Math.abs(diffMin) / 60)}h`;
  return "";
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
  { bg: "bg-indigo-100", text: "text-indigo-700" },
] as const;

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

// ── Appointment grouping ──────────────────────────────────────────────────────

interface AppointmentGroup {
  key: string;
  label: string;
  date: Date;
  isPast: boolean;
  appointments: AppointmentRecord[];
}

function groupByDate(appointments: AppointmentRecord[]): AppointmentGroup[] {
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(todayMidnight.getDate() + 1);

  const groups = new Map<string, AppointmentGroup>();

  for (const appt of appointments) {
    const d = new Date(appt.scheduledFor);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (!groups.has(key)) {
      const t = dayStart.getTime();
      let label: string;
      if (t === todayMidnight.getTime()) label = "Aujourd'hui";
      else if (t === tomorrowMidnight.getTime()) label = "Demain";
      else
        label = d.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });

      groups.set(key, {
        key,
        label,
        date: dayStart,
        isPast: t < todayMidnight.getTime(),
        appointments: [],
      });
    }
    groups.get(key)!.appointments.push(appt);
  }

  for (const group of groups.values()) {
    group.appointments.sort(
      (a, b) =>
        new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime(),
    );
  }

  return [...groups.values()].sort((a, b) => {
    // Past groups sink to the bottom
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
    return a.date.getTime() - b.date.getTime();
  });
}

// ── Status helpers ────────────────────────────────────────────────────────────

function statusTone(status: AppointmentStatus) {
  if (status === "scheduled") return "bg-slate-100 text-slate-700";
  if (status === "checked_in") return "bg-amber-100 text-amber-700";
  if (status === "in_consultation") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

function statusDotColor(status: AppointmentStatus) {
  if (status === "scheduled") return "bg-slate-400";
  if (status === "checked_in") return "bg-amber-500";
  if (status === "in_consultation") return "bg-blue-500";
  return "bg-emerald-500";
}

function cardAccentClass(status: AppointmentStatus) {
  if (status === "in_consultation")
    return "border-blue-200 bg-gradient-to-r from-blue-50/80 to-white";
  if (status === "checked_in")
    return "border-amber-200 bg-gradient-to-r from-amber-50/80 to-white";
  if (status === "completed")
    return "border-[rgba(17,18,20,0.06)] bg-[#FCFCFC]";
  return "border-[rgba(17,18,20,0.09)] bg-white";
}

function cardBorderStripe(status: AppointmentStatus) {
  if (status === "in_consultation") return "bg-blue-400";
  if (status === "checked_in") return "bg-amber-400";
  if (status === "completed") return "bg-emerald-400";
  return "bg-slate-300";
}

function actionLabel(status: AppointmentStatus): string {
  if (status === "in_consultation") return "Terminer la consult.";
  if (status === "checked_in") return "Démarrer";
  if (status === "completed") return "Revoir";
  return "Voir le dossier";
}

function actionClass(status: AppointmentStatus): string {
  if (status === "in_consultation")
    return "bg-blue-600 text-white hover:bg-blue-700";
  if (status === "checked_in")
    return "bg-amber-500 text-white hover:bg-amber-600";
  if (status === "completed")
    return "border border-[rgba(17,18,20,0.12)] text-[rgba(17,18,20,0.55)] hover:bg-[#FEF0D5]";
  return "bg-[#111214] text-white hover:bg-[#111214]/85";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent = false,
  delay = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={`flex flex-col rounded-2xl border p-4 ${
        accent
          ? "border-[#5B1112]/15 bg-[#5B1112]/[0.05]"
          : "border-[rgba(17,18,20,0.08)] bg-white/70 backdrop-blur-sm"
      }`}
    >
      <Icon
        size={18}
        className={accent ? "text-[#5B1112]" : "text-[rgba(17,18,20,0.40)]"}
        strokeWidth={1.8}
      />
      <p className="mt-3 text-2xl font-bold text-[#111214]">{value}</p>
      <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.52)]">{label}</p>
    </motion.div>
  );
}

function NextPatientCard({ appointment }: { appointment: AppointmentRecord }) {
  const isInProgress =
    appointment.status === "in_consultation" ||
    appointment.status === "checked_in";
  const hasPreConsult = Boolean(appointment.preConsultData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="relative overflow-hidden rounded-3xl bg-[#5B1112] p-6 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute right-[-8%] top-[-30%] h-[220px] w-[220px] rounded-full bg-white/[0.06] blur-[60px]" />
        <div className="absolute bottom-[-20%] left-[35%] h-[150px] w-[150px] rounded-full bg-white/[0.04] blur-[40px]" />
      </div>

      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            {isInProgress ? "En cours" : "Prochain patient"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              appointment.status === "in_consultation"
                ? "bg-blue-400/20 text-blue-200"
                : appointment.status === "checked_in"
                  ? "bg-amber-400/20 text-amber-200"
                  : "bg-white/[0.15] text-white/75"
            }`}
          >
            {appointmentStatusLabel(appointment.status)}
          </span>
        </div>

        <h2 className="text-xl font-bold">{appointment.patientLabel}</h2>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <Clock3 size={13} />
            {formatTime(appointment.scheduledFor)}
          </span>
          <span className="flex items-center gap-1.5">
            {appointment.appointmentType === "video" ? (
              <>
                <Video size={13} />
                Vidéo
              </>
            ) : (
              <>
                <MapPin size={13} />
                {appointment.practitionerLocation ?? "Présentiel"}
              </>
            )}
          </span>
          {hasPreConsult ? (
            <span className="flex items-center gap-1 rounded-full bg-white/[0.15] px-2.5 py-0.5 text-xs text-white/75">
              <FileText size={11} />
              Pré-consult disponible
            </span>
          ) : null}
        </div>

        <div className="mt-5">
          <Link
            to={`/patient-flow/practitioner/appointments/${appointment.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5B1112] shadow-lg transition hover:bg-white/90 active:scale-[0.97]"
          >
            Ouvrir le dossier
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function TodayQueueSection({
  appointments,
}: {
  appointments: AppointmentRecord[];
}) {
  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      ),
    [appointments],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.18 }}
      className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-[#111214]">
          File du jour
          {sorted.length > 0 ? (
            <span className="rounded-full bg-[#5B1112]/10 px-2 py-0.5 text-xs font-bold text-[#5B1112]">
              {sorted.length}
            </span>
          ) : null}
        </h2>
        <Link
          to="/patient-flow/practitioner/appointments"
          className="text-xs font-medium text-[#5B1112] hover:underline"
        >
          Voir tout
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="py-8 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-medium text-[#111214]/55">
            Aucun rendez-vous aujourd'hui
          </p>
          <p className="mt-0.5 text-xs text-[#111214]/35">
            Profitez de votre journée
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((appt, i) => (
            <motion.div
              key={appt.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28, delay: 0.04 * i }}
            >
              <Link
                to={`/patient-flow/practitioner/appointments/${appt.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[rgba(17,18,20,0.07)] bg-[#FCFCFC] p-3 transition hover:border-[rgba(17,18,20,0.14)] hover:bg-white"
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold ${statusTone(appt.status)}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#111214]">
                    {appt.patientLabel}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-[rgba(17,18,20,0.52)]">
                    <Clock3 size={10} />
                    {formatTime(appt.scheduledFor)}
                    {" · "}
                    {appt.appointmentType === "video" ? "Vidéo" : "Présentiel"}
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone(appt.status)}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${statusDotColor(appt.status)}`}
                    />
                    {appointmentStatusLabel(appt.status)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

// ── Appointments view (hash = #appointments) ──────────────────────────────────

const STATUS_FILTERS = [
  "all",
  "scheduled",
  "checked_in",
  "in_consultation",
  "completed",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function StatusPill({ status }: { status: AppointmentStatus }) {
  const isActive = status === "in_consultation";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusTone(status)}`}
    >
      {isActive ? (
        <motion.span
          className={`h-1.5 w-1.5 rounded-full ${statusDotColor(status)}`}
          animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : (
        <span
          className={`h-1.5 w-1.5 rounded-full ${statusDotColor(status)}`}
        />
      )}
      {appointmentStatusLabel(status)}
    </span>
  );
}

function AppointmentCard({
  appointment,
  index,
}: {
  appointment: AppointmentRecord;
  index: number;
}) {
  const palette = getAvatarPalette(appointment.patientLabel);
  const initials = getInitials(appointment.patientLabel);
  const countdown = getCountdownText(appointment.scheduledFor);
  const hasPreConsult = Boolean(appointment.preConsultData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.05, 0.3) }}
      className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] ${cardAccentClass(appointment.status)}`}
    >
      {/* Colored left stripe */}
      <div
        className={`absolute bottom-0 left-0 top-0 w-[3px] rounded-l-2xl ${cardBorderStripe(appointment.status)}`}
      />

      <div className="flex items-start gap-4 p-4 pl-5">
        {/* Avatar */}
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${palette.bg} ${palette.text}`}
        >
          {initials}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Name row */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[15px] font-bold leading-tight text-[#111214]">
              {appointment.patientLabel}
            </p>
            <StatusPill status={appointment.status} />
          </div>

          {/* Time + location row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-[rgba(17,18,20,0.55)]">
            <span className="flex items-center gap-1 font-semibold text-[#111214]">
              <Clock3 size={12} />
              {formatTime(appointment.scheduledFor)}
            </span>
            {countdown ? (
              <>
                <span className="text-[rgba(17,18,20,0.30)]">·</span>
                <span
                  className={`font-medium ${
                    appointment.status === "in_consultation"
                      ? "text-blue-600"
                      : appointment.status === "checked_in"
                        ? "text-amber-600"
                        : "text-[rgba(17,18,20,0.50)]"
                  }`}
                >
                  {countdown}
                </span>
              </>
            ) : null}
            <span className="text-[rgba(17,18,20,0.30)]">·</span>
            <span className="flex items-center gap-1">
              {appointment.appointmentType === "video" ? (
                <>
                  <Video size={12} />
                  Vidéo
                </>
              ) : (
                <>
                  <MapPin size={12} />
                  {appointment.practitionerLocation ?? "Présentiel"}
                </>
              )}
            </span>
          </div>

          {/* Badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {hasPreConsult ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <FileText size={9} />
                Pré-consult reçu
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(17,18,20,0.08)] bg-[rgba(17,18,20,0.03)] px-2 py-0.5 text-[10px] text-[rgba(17,18,20,0.40)]">
                Pré-consult non reçu
              </span>
            )}
          </div>

          {/* Action row */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <Link
              to={`/patient-flow/practitioner/appointments/${appointment.id}`}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition active:scale-[0.97] ${actionClass(appointment.status)}`}
            >
              {actionLabel(appointment.status)}
              <ArrowRight size={12} />
            </Link>

            {appointment.practitionerSpecialty ? (
              <span className="text-[10px] text-[rgba(17,18,20,0.35)]">
                {appointment.practitionerSpecialty}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DateGroupHeader({
  label,
  count,
  isPast,
}: {
  label: string;
  count: number;
  isPast: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <h3
        className={`flex-shrink-0 text-sm font-bold capitalize ${
          isPast ? "text-[rgba(17,18,20,0.38)]" : "text-[#111214]"
        }`}
      >
        {label}
      </h3>
      <div className="flex-1 border-t border-[rgba(17,18,20,0.08)]" />
      <span
        className={`flex-shrink-0 text-xs ${
          isPast ? "text-[rgba(17,18,20,0.32)]" : "text-[rgba(17,18,20,0.45)]"
        }`}
      >
        {count} patient{count > 1 ? "s" : ""}
      </span>
    </div>
  );
}

function AppointmentsView({
  appointments,
}: {
  appointments: AppointmentRecord[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (q && !a.patientLabel.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [appointments, query, statusFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  // Counts per status for badge display
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: appointments.length };
    for (const a of appointments) {
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [appointments]);

  return (
    <motion.div
      key="appointments-view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 py-2 lg:py-4"
    >
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111214]">Rendez-vous</h1>
        <span className="rounded-full bg-[#5B1112]/10 px-3 py-1 text-sm font-bold text-[#5B1112]">
          {appointments.length} au total
        </span>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition focus-within:border-[rgba(17,18,20,0.22)] focus-within:bg-white focus-within:shadow-md">
        <Search
          size={16}
          className="flex-shrink-0 text-[rgba(17,18,20,0.35)]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un patient..."
          className="min-w-0 flex-1 bg-transparent text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.38)]"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="flex-shrink-0 rounded-full p-0.5 text-[rgba(17,18,20,0.38)] transition hover:bg-[#FEF0D5] hover:text-[#111214]"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_FILTERS.map((f) => {
          const isActive = statusFilter === f;
          const count = statusCounts[f] ?? 0;
          return (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-[#111214] text-white shadow-md"
                  : "border border-[rgba(17,18,20,0.12)] bg-white/70 text-[rgba(17,18,20,0.60)] hover:bg-white hover:text-[#111214]"
              }`}
            >
              {f === "all"
                ? "Tous"
                : appointmentStatusLabel(f as AppointmentStatus)}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-[rgba(17,18,20,0.08)] text-[rgba(17,18,20,0.55)]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results */}
      {groups.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(17,18,20,0.05)]">
            <Search size={22} className="text-[rgba(17,18,20,0.30)]" />
          </div>
          <p className="text-sm font-semibold text-[rgba(17,18,20,0.50)]">
            Aucun rendez-vous trouvé
          </p>
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-2 text-xs text-[#5B1112] hover:underline"
            >
              Effacer la recherche
            </button>
          ) : null}
        </motion.div>
      ) : (
        <div className="space-y-7">
          {groups.map((group) => (
            <div key={group.key}>
              <DateGroupHeader
                label={group.label}
                count={group.appointments.length}
                isPast={group.isPast}
              />
              <div className="mt-3 space-y-2.5">
                {group.appointments.map((appt, i) => (
                  <AppointmentCard key={appt.id} appointment={appt} index={i} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Home view ─────────────────────────────────────────────────────────────────

function HomeView({
  todayAppointments,
  counts,
  nextAppointment,
}: {
  appointments: AppointmentRecord[];
  todayAppointments: AppointmentRecord[];
  counts: Record<AppointmentStatus, number>;
  nextAppointment: AppointmentRecord | null;
}) {
  const fullName = useAuth().user?.fullName ?? "Praticien";
  const greeting = getGreeting();
  const drName = getDrName(fullName);

  return (
    <motion.div
      key="home-view"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 py-2 lg:py-4"
    >
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-3xl bg-[#5B1112] px-7 py-7"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-8%] top-[-30%] h-[220px] w-[220px] rounded-full bg-white/[0.06] blur-[70px]" />
          <div className="absolute bottom-[-25%] left-[20%] h-[180px] w-[180px] rounded-full bg-white/[0.04] blur-[50px]" />
        </div>
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm text-white/55">{greeting},</p>
            <h1 className="mt-0.5 text-2xl font-bold text-white">
              Dr. {drName}
            </h1>
            <p className="mt-1 text-sm capitalize text-white/40">
              {formatTodayFull()}
            </p>
          </div>
          {todayAppointments.length > 0 ? (
            <div className="rounded-2xl bg-white/[0.12] px-5 py-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-white">
                {todayAppointments.length}
              </p>
              <p className="mt-0.5 text-xs text-white/55">
                patient{todayAppointments.length > 1 ? "s" : ""} aujourd'hui
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/[0.10] px-5 py-4 backdrop-blur-sm">
              <p className="text-sm font-medium text-white/60">Journée libre</p>
              <p className="mt-0.5 text-xs text-white/35">
                Aucun patient prévu
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          icon={Clock3}
          label="Planifiés"
          value={counts.scheduled}
          delay={0.05}
        />
        <StatCard
          icon={Users}
          label="Arrivés"
          value={counts.checked_in}
          delay={0.1}
        />
        <StatCard
          icon={Stethoscope}
          label="En consultation"
          value={counts.in_consultation}
          accent={counts.in_consultation > 0}
          delay={0.15}
        />
        <StatCard
          icon={CalendarCheck2}
          label="Terminés"
          value={counts.completed}
          delay={0.2}
        />
      </div>

      {/* Next patient */}
      {nextAppointment ? (
        <NextPatientCard appointment={nextAppointment} />
      ) : null}

      {/* Today's queue */}
      <TodayQueueSection appointments={todayAppointments} />
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PRAC01Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const practitionerId = auth.user?.practitionerId ?? null;
  const isAppointmentsView = location.hash === "#appointments";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!practitionerId) {
        setLoading(false);
        setError("Aucun identifiant praticien associé à ce compte.");
        return;
      }

      try {
        setLoading(true);
        const list =
          await auth.appointmentAdapter.listAppointmentsForPractitioner(
            practitionerId,
          );
        if (!cancelled) {
          setAppointments(list);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Impossible de charger les rendez-vous.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [auth.appointmentAdapter, practitionerId]);

  const todayAppointments = useMemo(
    () => appointments.filter((a) => isToday(a.scheduledFor)),
    [appointments],
  );

  const counts = useMemo(() => {
    const c = { scheduled: 0, checked_in: 0, in_consultation: 0, completed: 0 };
    for (const a of todayAppointments) c[a.status]++;
    return c;
  }, [todayAppointments]);

  const nextAppointment = useMemo(() => {
    const inConsult = appointments.find((a) => a.status === "in_consultation");
    if (inConsult) return inConsult;

    const checkedIn = [...appointments]
      .filter((a) => a.status === "checked_in")
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      )[0];
    if (checkedIn) return checkedIn;

    const now = Date.now();
    return (
      [...appointments]
        .filter((a) => a.status === "scheduled")
        .sort(
          (a, b) =>
            new Date(a.scheduledFor).getTime() -
            new Date(b.scheduledFor).getTime(),
        )
        .find(
          (a) => new Date(a.scheduledFor).getTime() >= now - 15 * 60 * 1000,
        ) ?? null
    );
  }, [appointments]);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  };

  const fullName = auth.user?.fullName ?? "Praticien";

  return (
    <PractitionerDashboardLayout fullName={fullName} onLogout={handleLogout}>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={24} className="animate-spin text-[#5B1112]/45" />
        </div>
      ) : error ? (
        <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#E9B3B3] bg-[#FFF2F2] px-4 py-3 text-sm text-[#8A2E2E]">
          <AlertTriangle size={15} />
          {error}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {isAppointmentsView ? (
            <AppointmentsView key="appts" appointments={appointments} />
          ) : (
            <HomeView
              key="home"
              appointments={appointments}
              todayAppointments={todayAppointments}
              counts={counts}
              nextAppointment={nextAppointment}
            />
          )}
        </AnimatePresence>
      )}
    </PractitionerDashboardLayout>
  );
}
