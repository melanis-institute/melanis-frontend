import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  NEXT_STATUS_BY_CURRENT,
  appointmentStatusLabel,
  type AppointmentRecord,
  type AppointmentStatus,
} from "@portal/domains/appointments/types";
import { MOTIFS, DUREES, type PreConsultData } from "@portal/features/patient/preconsult/components/types";
import { useAuth } from "@portal/session/useAuth";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
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

function nextStatusActionLabel(status: AppointmentStatus | null): string {
  if (status === "checked_in") return "Marquer patient arrivé";
  if (status === "in_consultation") return "Démarrer la consultation";
  if (status === "completed") return "Terminer la consultation";
  return "";
}

function toDisplayRows(preConsultData: unknown): Array<{ label: string; value: string }> {
  if (!preConsultData || typeof preConsultData !== "object") {
    return [];
  }

  const data = preConsultData as Partial<PreConsultData>;
  const rows: Array<{ label: string; value: string }> = [];

  if (typeof data.motif === "string") {
    const motif = MOTIFS.find((item) => item.key === data.motif)?.label;
    if (motif) {
      rows.push({ label: "Motif", value: motif });
    }
  }

  if (typeof data.motifAutre === "string" && data.motifAutre.trim().length > 0) {
    rows.push({ label: "Motif (autre)", value: data.motifAutre.trim() });
  }

  if (Array.isArray(data.zones) && data.zones.length > 0) {
    rows.push({ label: "Zones", value: data.zones.join(", ") });
  }

  if (Array.isArray(data.symptomes) && data.symptomes.length > 0) {
    rows.push({ label: "Symptômes", value: data.symptomes.join(", ") });
  }

  if (typeof data.duree === "string") {
    const duration = DUREES.find((item) => item.key === data.duree)?.label;
    if (duration) {
      rows.push({ label: "Depuis", value: duration });
    }
  }

  if (typeof data.intensite === "number") {
    rows.push({ label: "Intensité", value: `${data.intensite}/5` });
  }

  if (Array.isArray(data.objectifs) && data.objectifs.length > 0) {
    rows.push({ label: "Objectifs", value: data.objectifs.join(", ") });
  }

  if (Array.isArray(data.photos)) {
    rows.push({ label: "Photos", value: `${data.photos.length} ajoutée(s)` });
  }

  return rows;
}

export default function PRAC03AppointmentDetail() {
  const auth = useAuth();
  const params = useParams();

  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const appointmentId = params.appointmentId ?? "";

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const found = await auth.appointmentAdapter.getAppointmentById(appointmentId);

        if (!found) {
          if (!cancelled) {
            setError("Rendez-vous introuvable.");
            setAppointment(null);
          }
          return;
        }

        if (auth.user?.practitionerId && found.practitionerId !== auth.user.practitionerId) {
          if (!cancelled) {
            setError("Accès refusé à ce rendez-vous.");
            setAppointment(null);
          }
          return;
        }

        if (!cancelled) {
          setAppointment(found);
          setError(null);
        }
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger ce rendez-vous.",
          );
          setAppointment(null);
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
  }, [appointmentId, auth.appointmentAdapter, auth.user?.practitionerId]);

  const nextStatus = appointment ? NEXT_STATUS_BY_CURRENT[appointment.status] : null;

  const preConsultRows = useMemo(
    () => toDisplayRows(appointment?.preConsultData),
    [appointment?.preConsultData],
  );

  const handleTransition = async () => {
    if (!appointment || !nextStatus || !auth.user) return;

    try {
      setIsTransitioning(true);
      const updated = await auth.appointmentAdapter.transitionAppointmentStatus({
        appointmentId: appointment.id,
        actorUserId: auth.user.id,
        toStatus: nextStatus,
      });
      setAppointment(updated);
      setFeedback(`Statut mis à jour: ${appointmentStatusLabel(updated.status)}.`);
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de mettre à jour le statut.",
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#111214]">Détail rendez-vous</h1>
            <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
              Informations patient et pré-consultation.
            </p>
          </div>
          <Link
            to="/patient-flow/practitioner/appointments"
            className="rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
          >
            Retour à la liste
          </Link>
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-[rgba(17,18,20,0.6)]">Chargement...</p>
        ) : error ? (
          <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-[#E9B3B3] bg-[#FFF2F2] px-3 py-2 text-sm text-[#8A2E2E]">
            <AlertTriangle size={15} />
            {error}
          </div>
        ) : appointment ? (
          <div className="mt-6 space-y-4">
            <section className="rounded-2xl border border-[rgba(17,18,20,0.1)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#111214]">{appointment.patientLabel}</p>
                  <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">
                    {formatDateTime(appointment.scheduledFor)} • {appointment.appointmentType === "video" ? "Vidéo" : "Présentiel"}
                  </p>
                  <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">
                    {appointment.practitionerName}
                    {appointment.practitionerLocation ? ` • ${appointment.practitionerLocation}` : ""}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusTone(appointment.status)}`}>
                  {appointmentStatusLabel(appointment.status)}
                </span>
              </div>

              {nextStatus ? (
                <button
                  onClick={() => void handleTransition()}
                  disabled={isTransitioning}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#5B1112] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {nextStatusActionLabel(nextStatus)}
                  <ArrowRight size={14} />
                </button>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  <CheckCircle2 size={15} />
                  Consultation terminée
                </div>
              )}

              {feedback ? (
                <p className="mt-3 text-sm text-[rgba(17,18,20,0.65)]">{feedback}</p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[rgba(17,18,20,0.1)] p-4">
              <h2 className="text-sm font-semibold text-[#111214]">Pré-consultation</h2>

              {preConsultRows.length === 0 ? (
                <p className="mt-3 text-sm text-[rgba(17,18,20,0.6)]">
                  Aucune donnée de pré-consultation disponible.
                </p>
              ) : (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {preConsultRows.map((row) => (
                    <div
                      key={row.label}
                      className="rounded-xl border border-[rgba(17,18,20,0.08)] bg-[#FCFCFC] p-3"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-[rgba(17,18,20,0.45)]">
                        {row.label}
                      </p>
                      <p className="mt-1 text-sm text-[#111214]">{row.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
