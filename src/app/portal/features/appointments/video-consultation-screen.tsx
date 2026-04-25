import { isApiError } from "@portal/domains/api/client";
import type { AppointmentRecord, VideoTokenRecord } from "@portal/domains/appointments/types";
import { useAuth } from "@portal/session/useAuth";
import { AlertTriangle, ArrowLeft, Loader2, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";

interface JitsiExternalApi {
  dispose: () => void;
}

interface JitsiExternalApiConstructor {
  new (
    domain: string,
    options: {
      roomName: string;
      parentNode: HTMLElement;
      jwt: string;
      width: string;
      height: string;
      userInfo: {
        displayName: string;
        email?: string;
      };
      configOverwrite?: Record<string, unknown>;
      interfaceConfigOverwrite?: Record<string, unknown>;
    },
  ): JitsiExternalApi;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiExternalApiConstructor;
  }
}

const loadedDomains = new Set<string>();

function loadJitsiExternalApi(domain: string): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (loadedDomains.has(domain)) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://${domain}/external_api.js`;
    script.async = true;
    script.onload = () => {
      loadedDomains.add(domain);
      resolve();
    };
    script.onerror = () => {
      reject(new Error("Impossible de charger la salle vidéo."));
    };
    document.body.appendChild(script);
  });
}

function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.error_code === "APPOINTMENT_VIDEO_NOT_AVAILABLE") {
      return "La consultation vidéo sera disponible 30 minutes avant le rendez-vous.";
    }
    if (error.error_code === "APPOINTMENT_COMPLETED") {
      return "Cette consultation est terminée.";
    }
    if (error.error_code === "APPOINTMENT_NOT_VIDEO") {
      return "Ce rendez-vous n'est pas une consultation vidéo.";
    }
    return error.detail;
  }
  return error instanceof Error
    ? error.message
    : "Impossible de rejoindre la consultation vidéo.";
}

function buildReturnPath(role: "patient" | "practitioner", appointmentId: string) {
  if (role === "practitioner") {
    return `/patient-flow/practitioner/appointments/${appointmentId}`;
  }
  return "/patient-flow/auth/dashboard#appointments";
}

export default function VideoConsultationScreen({
  role,
}: {
  role: "patient" | "practitioner";
}) {
  const auth = useAuth();
  const params = useParams();
  const appointmentId = params.appointmentId ?? "";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<JitsiExternalApi | null>(null);
  const [appointment, setAppointment] = useState<AppointmentRecord | null>(null);
  const [token, setToken] = useState<VideoTokenRecord | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const returnPath = useMemo(
    () => buildReturnPath(role, appointmentId),
    [appointmentId, role],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setStatus("loading");
        setError(null);

        const found = await auth.appointmentAdapter.getAppointmentById(appointmentId);
        if (!found) {
          throw new Error("Rendez-vous introuvable.");
        }
        if (found.appointmentType !== "video") {
          throw new Error("Ce rendez-vous n'est pas une consultation vidéo.");
        }
        if (found.status === "completed") {
          throw new Error("Cette consultation est terminée.");
        }
        if (
          role === "practitioner" &&
          auth.user?.practitionerId &&
          found.practitionerId !== auth.user.practitionerId
        ) {
          throw new Error("Accès refusé à cette consultation.");
        }

        const issuedToken = await auth.appointmentAdapter.issueVideoToken(appointmentId);
        await loadJitsiExternalApi(issuedToken.domain);

        if (cancelled) return;
        setAppointment(found);
        setToken(issuedToken);
        setStatus("ready");
      } catch (loadError) {
        if (cancelled) return;
        setStatus("error");
        setError(getErrorMessage(loadError));
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [appointmentId, auth.appointmentAdapter, auth.user?.practitionerId, role]);

  useEffect(() => {
    if (status !== "ready" || !token || !containerRef.current) return;
    if (!window.JitsiMeetExternalAPI) {
      setStatus("error");
      setError("La salle vidéo n'est pas disponible pour le moment.");
      return;
    }

    apiRef.current?.dispose();
    containerRef.current.innerHTML = "";
    apiRef.current = new window.JitsiMeetExternalAPI(token.domain, {
      roomName: token.roomName,
      parentNode: containerRef.current,
      jwt: token.jwt,
      width: "100%",
      height: "100%",
      userInfo: token.userInfo,
      configOverwrite: {
        prejoinPageEnabled: true,
        disableDeepLinking: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
      },
    });

    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, [status, token]);

  return (
    <main className="min-h-screen bg-[#111214] text-white">
      <div className="flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              to={returnPath}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/8 text-white/78 transition hover:bg-white/14"
              aria-label="Retour"
            >
              <ArrowLeft size={17} />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/42">
                Consultation vidéo
              </p>
              <h1 className="text-lg font-semibold">
                {appointment?.patientLabel ?? "Salle de consultation"}
              </h1>
            </div>
          </div>

          {appointment ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/64">
              <span>{appointment.practitionerName}</span>
              <span className="h-1 w-1 rounded-full bg-white/28" />
              <span>{appointment.dateLabel} à {appointment.timeLabel}</span>
            </div>
          ) : null}
        </header>

        <section className="relative min-h-0 flex-1">
          {status === "loading" ? (
            <div className="flex h-full min-h-[520px] flex-col items-center justify-center gap-3 text-white/70">
              <Loader2 size={28} className="animate-spin" />
              <p className="text-sm">Préparation de la salle vidéo...</p>
            </div>
          ) : status === "error" ? (
            <div className="flex h-full min-h-[520px] items-center justify-center px-4">
              <div className="max-w-md rounded-2xl border border-white/10 bg-white/8 p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#5B1112] text-white">
                  <AlertTriangle size={20} />
                </div>
                <h2 className="mt-4 text-lg font-semibold">Accès vidéo indisponible</h2>
                <p className="mt-2 text-sm leading-6 text-white/62">{error}</p>
                <Link
                  to={returnPath}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111214]"
                >
                  Retour
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-[calc(100vh-73px)] min-h-[520px]">
              <div ref={containerRef} className="h-full w-full bg-black" />
              <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-2 text-xs text-white/78 backdrop-blur">
                <Video size={13} />
                Salle sécurisée Melanis
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
