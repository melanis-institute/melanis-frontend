import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  appointmentStatusLabel,
  type AppointmentRecord,
  type AppointmentStatus,
} from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";

type StatusFilter = "all" | AppointmentStatus;

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "scheduled",
  "checked_in",
  "in_consultation",
  "completed",
];

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(status: AppointmentStatus) {
  if (status === "scheduled") return "bg-slate-100 text-slate-700";
  if (status === "checked_in") return "bg-amber-100 text-amber-700";
  if (status === "in_consultation") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function PRAC02Appointments() {
  const auth = useAuth();

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
        const list = await auth.appointmentAdapter.listAppointmentsForPractitioner(practitionerId);
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
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
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

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#111214]">Rendez-vous praticien</h1>
            <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
              File de rendez-vous avec filtres de statut.
            </p>
          </div>
          <Link
            to="/patient-flow/practitioner"
            className="rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
          >
            Retour dashboard
          </Link>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(17,18,20,0.45)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un patient, date, heure..."
              className="w-full rounded-xl border border-[rgba(17,18,20,0.15)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[#5B1112]/45"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-[#5B1112] text-white"
                      : "border border-[rgba(17,18,20,0.12)] text-[rgba(17,18,20,0.75)]"
                  }`}
                >
                  {status === "all" ? "Tous" : appointmentStatusLabel(status)}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <p className="mt-5 text-sm text-[rgba(17,18,20,0.6)]">Chargement...</p>
        ) : error ? (
          <p className="mt-5 text-sm text-[#8A2E2E]">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="mt-5 text-sm text-[rgba(17,18,20,0.6)]">
            Aucun rendez-vous pour ce filtre.
          </p>
        ) : (
          <div className="mt-5 space-y-2">
            {filtered.map((appointment) => (
              <Link
                key={appointment.id}
                to={`/patient-flow/practitioner/appointments/${appointment.id}`}
                className="block rounded-xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-3 transition hover:bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">{appointment.patientLabel}</p>
                    <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.58)]">
                      {formatDateTime(appointment.scheduledFor)} • {appointment.appointmentType === "video" ? "Vidéo" : "Présentiel"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(appointment.status)}`}
                  >
                    {appointmentStatusLabel(appointment.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
