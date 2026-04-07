import {
  AlertTriangle,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  Video,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  appointmentStatusLabel,
  type AppointmentRecord,
  type AppointmentStatus,
} from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";

type StatusFilter = "all" | AppointmentStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "scheduled",
  "checked_in",
  "in_consultation",
  "completed",
];

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
  if (status === "completed") return "border-[rgba(17,18,20,0.06)] bg-[#FCFCFC]";
  return "border-[rgba(17,18,20,0.09)] bg-white";
}

function cardBorderStripe(status: AppointmentStatus) {
  if (status === "in_consultation") return "bg-blue-400";
  if (status === "checked_in") return "bg-amber-400";
  if (status === "completed") return "bg-emerald-400";
  return "bg-slate-300";
}

// ── Avatar helpers ────────────────────────────────────────────────────────────

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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
}

// ── Date grouping ─────────────────────────────────────────────────────────────

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
    if (a.isPast !== b.isPast) return a.isPast ? 1 : -1;
    return a.date.getTime() - b.date.getTime();
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
        <span className={`h-1.5 w-1.5 rounded-full ${statusDotColor(status)}`} />
      )}
      {appointmentStatusLabel(status)}
    </span>
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
      <div
        className={`absolute bottom-0 left-0 top-0 w-[3px] rounded-l-2xl ${cardBorderStripe(appointment.status)}`}
      />
      <Link
        to={`/patient-flow/practitioner/appointments/${appointment.id}`}
        className="flex items-start gap-4 p-4 pl-5"
      >
        <div
          className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${palette.bg} ${palette.text}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-[15px] font-bold leading-tight text-[#111214]">
              {appointment.patientLabel}
            </p>
            <StatusPill status={appointment.status} />
          </div>
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
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PRAC02Appointments() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const practitionerId = auth.user?.practitionerId ?? null;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!practitionerId) {
        setLoading(false);
        setError("Aucun identifiant praticien n'est associé à ce compte.");
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
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les rendez-vous.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [auth.appointmentAdapter, practitionerId]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return appointments.filter((item) => {
      const matchesStatus =
        statusFilter === "all" || item.status === statusFilter;
      if (!matchesStatus) return false;
      if (!normalizedQuery) return true;

      const haystack = [
        item.patientLabel,
        item.practitionerName,
        item.dateLabel,
        item.timeLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [appointments, query, statusFilter]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { all: appointments.length };
    for (const a of appointments) {
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [appointments]);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  };

  const fullName = auth.user?.fullName ?? "Praticien";

  return (
    <PractitionerDashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-5 py-2 lg:py-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#111214]">Rendez-vous</h1>
          {!loading && !error ? (
            <span className="rounded-full bg-[#5B1112]/10 px-3 py-1 text-sm font-bold text-[#5B1112]">
              {appointments.length} au total
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-[#5B1112]/45" />
          </div>
        ) : error ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E9B3B3] bg-[#FFF2F2] px-4 py-3 text-sm text-[#8A2E2E]">
            <AlertTriangle size={15} />
            {error}
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition focus-within:border-[rgba(17,18,20,0.22)] focus-within:bg-white focus-within:shadow-md">
              <Search
                size={16}
                className="flex-shrink-0 text-[rgba(17,18,20,0.35)]"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher un patient, date, heure..."
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
                        <AppointmentCard
                          key={appt.id}
                          appointment={appt}
                          index={i}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PractitionerDashboardLayout>
  );
}
