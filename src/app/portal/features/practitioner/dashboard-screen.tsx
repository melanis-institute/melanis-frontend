import { CalendarCheck2, Clock3, ListChecks, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { appointmentStatusLabel, type AppointmentRecord, type AppointmentStatus } from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";

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

export default function PRAC01Dashboard() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const counts = useMemo(() => {
    const byStatus: Record<AppointmentStatus, number> = {
      scheduled: 0,
      checked_in: 0,
      in_consultation: 0,
      completed: 0,
    };

    for (const appointment of appointments) {
      byStatus[appointment.status] += 1;
    }

    return byStatus;
  }, [appointments]);

  const upcoming = useMemo(
    () => appointments.filter((item) => item.status !== "completed").slice(0, 5),
    [appointments],
  );

  const handleLogout = async () => {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#111214]">Dashboard praticien</h1>
            <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
              Vue rapide des rendez-vous et du flux consultation.
            </p>
          </div>
          <button
            onClick={() => void handleLogout()}
            className="inline-flex items-center gap-1 rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
          >
            <LogOut size={14} />
            Se déconnecter
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-4">
            <Clock3 size={18} className="text-[#5B1112]" />
            <p className="mt-2 text-xs text-[rgba(17,18,20,0.58)]">Planifiés</p>
            <p className="text-2xl font-semibold text-[#111214]">{counts.scheduled}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-4">
            <CalendarCheck2 size={18} className="text-[#5B1112]" />
            <p className="mt-2 text-xs text-[rgba(17,18,20,0.58)]">Arrivés</p>
            <p className="text-2xl font-semibold text-[#111214]">{counts.checked_in}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-4">
            <ListChecks size={18} className="text-[#5B1112]" />
            <p className="mt-2 text-xs text-[rgba(17,18,20,0.58)]">En consultation</p>
            <p className="text-2xl font-semibold text-[#111214]">{counts.in_consultation}</p>
          </div>
          <div className="rounded-2xl border border-[rgba(17,18,20,0.1)] bg-[#FCFCFC] p-4">
            <CalendarCheck2 size={18} className="text-[#5B1112]" />
            <p className="mt-2 text-xs text-[rgba(17,18,20,0.58)]">Terminés</p>
            <p className="text-2xl font-semibold text-[#111214]">{counts.completed}</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[rgba(17,18,20,0.1)] p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#111214]">Rendez-vous à traiter</h2>
            <Link
              to="/patient-flow/practitioner/appointments"
              className="text-xs font-medium text-[#5B1112]"
            >
              Voir la liste complète
            </Link>
          </div>

          {loading ? (
            <p className="mt-3 text-sm text-[rgba(17,18,20,0.6)]">Chargement...</p>
          ) : error ? (
            <p className="mt-3 text-sm text-[#8A2E2E]">{error}</p>
          ) : upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-[rgba(17,18,20,0.6)]">Aucun rendez-vous en attente.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {upcoming.map((appointment) => (
                <Link
                  key={appointment.id}
                  to={`/patient-flow/practitioner/appointments/${appointment.id}`}
                  className="block rounded-xl border border-[rgba(17,18,20,0.08)] bg-[#FCFCFC] p-3 transition hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#111214]">{appointment.patientLabel}</p>
                      <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.58)]">
                        {formatDateTime(appointment.scheduledFor)} • {appointment.appointmentType === "video" ? "Vidéo" : "Présentiel"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(appointment.status)}`}>
                      {appointmentStatusLabel(appointment.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
