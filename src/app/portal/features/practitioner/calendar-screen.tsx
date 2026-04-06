import { type AppointmentRecord } from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
] as const;

const DOW_LABELS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function dateToKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date(year, month, 1);
  while (cursor.getMonth() === month) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function getMiniCalendarCells(year: number, month: number): Array<Date | null> {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Convert Sunday-based (0) to Monday-based (0)
  const startDow = (firstDay.getDay() + 6) % 7;
  const cells: Array<Date | null> = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++)
    cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(d: Date): boolean {
  return d.getDay() === 0 || d.getDay() === 6;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return d
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    .replace(":", "h");
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, now)) return "Aujourd'hui";
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, tomorrow)) return "Demain";
  return d.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

function getDaysUntil(iso: string): number | null {
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

interface AppointmentColors {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

function appointmentColors(appt: AppointmentRecord): AppointmentColors {
  if (appt.status === "completed") {
    return {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-100",
      dot: "bg-emerald-400",
    };
  }
  if (appt.status === "in_consultation") {
    return {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-100",
      dot: "bg-blue-400",
    };
  }
  if (appt.status === "checked_in") {
    return {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-100",
      dot: "bg-amber-400",
    };
  }
  if (appt.appointmentType === "video") {
    return {
      bg: "bg-violet-50",
      text: "text-violet-800",
      border: "border-violet-100",
      dot: "bg-violet-400",
    };
  }
  return {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-100",
    dot: "bg-slate-400",
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MonthTabStrip({
  selectedYear,
  selectedMonthIndex,
  onSelectMonth,
  onYearChange,
}: {
  selectedYear: number;
  selectedMonthIndex: number;
  onSelectMonth: (index: number) => void;
  onYearChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onYearChange(-1)}
        className="flex-shrink-0 rounded-full border border-[rgba(17,18,20,0.12)] bg-white/60 p-1.5 text-[#111214]/50 transition hover:bg-white hover:text-[#111214]"
      >
        <ChevronLeft size={15} />
      </button>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {MONTHS_FR.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => onSelectMonth(i)}
            className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              i === selectedMonthIndex
                ? "bg-[#111214] text-white shadow-md"
                : "text-[#111214]/50 hover:bg-white/80 hover:text-[#111214]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <span className="flex-shrink-0 text-sm font-semibold text-[#111214]/40">
        {selectedYear}
      </span>

      <button
        type="button"
        onClick={() => onYearChange(1)}
        className="flex-shrink-0 rounded-full border border-[rgba(17,18,20,0.12)] bg-white/60 p-1.5 text-[#111214]/50 transition hover:bg-white hover:text-[#111214]"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function AppointmentChip({ appointment }: { appointment: AppointmentRecord }) {
  const colors = appointmentColors(appointment);
  return (
    <Link
      to={`/patient-flow/practitioner/appointments/${appointment.id}`}
      className={`inline-flex items-center gap-2 rounded-xl border ${colors.bg} ${colors.border} px-3 py-2 transition hover:opacity-75 active:scale-[0.97]`}
    >
      {appointment.appointmentType === "video" ? (
        <Video size={12} className={`flex-shrink-0 ${colors.text}`} />
      ) : (
        <MapPin size={12} className={`flex-shrink-0 ${colors.text}`} />
      )}
      <div className="min-w-0">
        <p
          className={`truncate max-w-[120px] text-xs font-semibold leading-tight ${colors.text}`}
        >
          {appointment.patientLabel}
        </p>
        <p className={`text-[10px] leading-tight ${colors.text} opacity-60`}>
          {formatTime(appointment.scheduledFor)}
        </p>
      </div>
    </Link>
  );
}

function DayRow({
  day,
  appointments,
  isCurrentDay,
}: {
  day: Date;
  appointments: AppointmentRecord[];
  isCurrentDay: boolean;
}) {
  const weekend = isWeekend(day);
  const dayNum = day.getDate();
  const weekdayShort = day.toLocaleDateString("fr-FR", { weekday: "short" });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex items-start gap-4 rounded-2xl px-3 py-3 transition ${
        isCurrentDay
          ? "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
          : "hover:bg-white/50"
      }`}
    >
      {/* Day badge */}
      <div className="flex w-10 flex-shrink-0 flex-col items-center pt-0.5">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            isCurrentDay
              ? "bg-[#111214] text-white"
              : weekend
                ? "text-[#111214]/30"
                : "text-[#111214]/65"
          }`}
        >
          {dayNum}
        </div>
        <span
          className={`mt-0.5 text-[9px] uppercase tracking-wide ${
            isCurrentDay ? "text-[#5B1112] font-semibold" : "text-[#111214]/35"
          }`}
        >
          {weekdayShort}
        </span>
      </div>

      {/* Events area */}
      <div className="min-w-0 flex-1 py-1">
        {weekend && appointments.length === 0 ? (
          <p className="text-sm text-[#111214]/28">Week-end</p>
        ) : appointments.length === 0 ? (
          <p className="text-sm text-[#111214]/35">Aucun rendez-vous</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {appointments.map((appt) => (
              <AppointmentChip key={appt.id} appointment={appt} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MiniCalendar({
  currentMonth,
  cells,
  appointmentsByDay,
  today,
  onPrev,
  onNext,
}: {
  currentMonth: Date;
  cells: Array<Date | null>;
  appointmentsByDay: Map<string, AppointmentRecord[]>;
  today: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Legend counts for displayed month
  const legend = useMemo(() => {
    let completed = 0;
    let upcoming = 0;
    for (const cell of cells) {
      if (!cell) continue;
      const key = dateToKey(cell);
      const appts = appointmentsByDay.get(key) ?? [];
      for (const a of appts) {
        if (a.status === "completed") completed++;
        else upcoming++;
      }
    }
    return { completed, upcoming };
  }, [cells, appointmentsByDay]);

  return (
    <div className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#111214]">
          <span className="capitalize">
            {currentMonth.toLocaleDateString("fr-FR", { month: "long" })}
          </span>{" "}
          <span className="text-[rgba(17,18,20,0.40)]">
            {currentMonth.getFullYear()}
          </span>
        </h3>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onPrev}
            className="rounded-full p-1 text-[#111214]/40 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-full p-1 text-[#111214]/40 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="mb-1 grid grid-cols-7">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="py-1 text-center text-[10px] font-semibold text-[rgba(17,18,20,0.35)]"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`pad-${i}`} className="h-9" />;
          }
          const key = dateToKey(day);
          const dayAppts = appointmentsByDay.get(key) ?? [];
          const isCurrentDay = isSameDay(day, today);

          return (
            <div key={key} className="flex flex-col items-center py-0.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition ${
                  isCurrentDay
                    ? "bg-[#111214] font-bold text-white"
                    : "text-[#111214]/65 hover:bg-[#FEF0D5]"
                }`}
              >
                {day.getDate()}
              </div>
              {dayAppts.length > 0 && (
                <div className="mt-0.5 flex items-center gap-0.5">
                  {dayAppts.slice(0, 3).map((appt) => {
                    const c = appointmentColors(appt);
                    return (
                      <div
                        key={appt.id}
                        className={`h-1 w-1 rounded-full ${c.dot}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[rgba(17,18,20,0.06)] pt-3">
        <span className="flex items-center gap-1 text-[10px] text-[rgba(17,18,20,0.52)]">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Terminés {legend.completed}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[rgba(17,18,20,0.52)]">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Vidéo
        </span>
        <span className="flex items-center gap-1 text-[10px] text-[rgba(17,18,20,0.52)]">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Présentiel
        </span>
      </div>
    </div>
  );
}

function UpcomingEventsPanel({
  appointments,
}: {
  appointments: AppointmentRecord[];
}) {
  return (
    <div className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-sm font-semibold text-[#111214]">
        Prochains rendez-vous
      </h3>

      {appointments.length === 0 ? (
        <p className="text-sm text-[rgba(17,18,20,0.45)]">
          Aucun rendez-vous à venir.
        </p>
      ) : (
        <div className="space-y-2.5">
          {appointments.map((appt) => {
            const colors = appointmentColors(appt);
            const daysLeft = getDaysUntil(appt.scheduledFor);

            return (
              <Link
                key={appt.id}
                to={`/patient-flow/practitioner/appointments/${appt.id}`}
                className={`block rounded-2xl border ${colors.bg} ${colors.border} p-3.5 transition hover:opacity-80 active:scale-[0.98]`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`truncate text-sm font-semibold leading-snug ${colors.text}`}
                  >
                    {appt.patientLabel}
                  </p>
                  {daysLeft !== null && daysLeft >= 0 && (
                    <span
                      className={`flex-shrink-0 rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold ${colors.text}`}
                    >
                      {daysLeft === 0 ? "Auj." : `${daysLeft} j`}
                    </span>
                  )}
                </div>
                <p
                  className={`mt-1 text-xs leading-snug ${colors.text} opacity-60`}
                >
                  {formatRelativeDate(appt.scheduledFor)} ·{" "}
                  {formatTime(appt.scheduledFor)}
                </p>
                <p
                  className={`mt-0.5 flex items-center gap-1 text-[10px] ${colors.text} opacity-45`}
                >
                  {appt.appointmentType === "video" ? (
                    <>
                      <Video size={9} /> Vidéo
                    </>
                  ) : (
                    <>
                      <MapPin size={9} /> Présentiel
                    </>
                  )}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function PRAC04Calendar() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const practitionerId = auth.user?.practitionerId ?? null;

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

  // ── Derived data ──────────────────────────────────────────────────────────

  const today = useMemo(() => new Date(), []);
  const selectedYear = currentMonth.getFullYear();
  const selectedMonthIndex = currentMonth.getMonth();

  const daysInMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonthIndex),
    [selectedYear, selectedMonthIndex],
  );

  const miniCalendarCells = useMemo(
    () => getMiniCalendarCells(selectedYear, selectedMonthIndex),
    [selectedYear, selectedMonthIndex],
  );

  // Build map of all appointments keyed by date string
  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentRecord[]>();
    for (const appt of appointments) {
      const key = dateToKey(new Date(appt.scheduledFor));
      const existing = map.get(key);
      if (existing) {
        existing.push(appt);
      } else {
        map.set(key, [appt]);
      }
    }
    // Sort each day's list by time
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      );
    }
    return map;
  }, [appointments]);

  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter(
        (a) =>
          a.status !== "completed" && new Date(a.scheduledFor).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      )
      .slice(0, 8);
  }, [appointments]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goToPrevMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentMonth((m) => new Date(m.getFullYear(), monthIndex, 1));
  };

  const handleYearChange = (delta: number) => {
    setCurrentMonth((m) => new Date(m.getFullYear() + delta, m.getMonth(), 1));
  };

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
        <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-[#E9B3B3] bg-[#FFF2F2] px-4 py-3 text-sm text-[#8A2E2E]">
          <AlertTriangle size={15} />
          {error}
        </div>
      ) : (
        <div className="py-2 lg:py-4">
          {/* Month tab strip */}
          <MonthTabStrip
            selectedYear={selectedYear}
            selectedMonthIndex={selectedMonthIndex}
            onSelectMonth={handleSelectMonth}
            onYearChange={handleYearChange}
          />

          {/* Main layout: day list + right panel */}
          <div className="mt-5 flex gap-6">
            {/* ── Left: day-by-day list ── */}
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h1 className="text-base font-semibold text-[#111214]">
                  Agenda ·{" "}
                  <span className="capitalize text-[rgba(17,18,20,0.55)]">
                    {currentMonth.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </h1>
                <span className="rounded-full bg-[#5B1112]/10 px-2.5 py-1 text-xs font-bold text-[#5B1112]">
                  {
                    appointments.filter(
                      (a) =>
                        new Date(a.scheduledFor).getMonth() ===
                          selectedMonthIndex &&
                        new Date(a.scheduledFor).getFullYear() === selectedYear,
                    ).length
                  }{" "}
                  rdv
                </span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/60 backdrop-blur-sm">
                {daysInMonth.map((day, index) => {
                  const key = dateToKey(day);
                  const dayAppts = appointmentsByDay.get(key) ?? [];
                  const isCurrentDay = isSameDay(day, today);

                  return (
                    <div key={key}>
                      {index > 0 && (
                        <div className="mx-4 border-t border-[rgba(17,18,20,0.05)]" />
                      )}
                      <DayRow
                        day={day}
                        appointments={dayAppts}
                        isCurrentDay={isCurrentDay}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Right panel: mini calendar + upcoming events ── */}
            <div className="hidden w-[268px] flex-shrink-0 flex-col gap-4 lg:flex xl:w-[290px]">
              <MiniCalendar
                currentMonth={currentMonth}
                cells={miniCalendarCells}
                appointmentsByDay={appointmentsByDay}
                today={today}
                onPrev={goToPrevMonth}
                onNext={goToNextMonth}
              />
              <UpcomingEventsPanel appointments={upcomingAppointments} />
            </div>
          </div>
        </div>
      )}
    </PractitionerDashboardLayout>
  );
}
