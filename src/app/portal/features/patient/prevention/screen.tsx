import type {
  PreventionAlertRecord,
  PreventionCurrentRecord,
} from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import {
  AlertTriangle,
  ArrowRight,
  LocateFixed,
  Shield,
  Wind,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

function severityTone(severity: PreventionAlertRecord["severity"]) {
  if (severity === "high") return "bg-[#5B1112] text-white";
  if (severity === "attention") return "bg-[#F6DDB6] text-[#5B1112]";
  return "bg-[#E9F1F7] text-[#00415E]";
}

export default function PatientPreventionScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState<PreventionCurrentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!auth.user || !auth.actingProfileId) return;
    setLoading(true);
    try {
      const payload = await auth.accountAdapter.getPreventionCurrent(
        auth.user.id,
        auth.actingProfileId,
      );
      setCurrent(payload);
    } finally {
      setLoading(false);
    }
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";
  const inputs = (current?.snapshot.inputs ?? {}) as Record<string, number>;
  const topAlert = useMemo(() => current?.alerts[0] ?? null, [current?.alerts]);

  const handleUseMyLocation = async () => {
    if (!auth.user || !auth.actingProfileId) return;
    if (!navigator.geolocation) {
      setGeoStatus("La géolocalisation n'est pas disponible sur cet appareil.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await auth.accountAdapter.updatePreventionLocation({
          actorUserId: auth.user!.id,
          profileId: auth.actingProfileId!,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          locationLabel: "Position actuelle",
          source: "device",
        });
        setGeoStatus("Position mise à jour.");
        await refresh();
      },
      () => {
        setGeoStatus("Permission refusée. Le mode Dakar reste utilisé par défaut.");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
              Prévention dynamique
            </p>
            <h1 className="mt-3 font-serif text-[2rem] leading-none">
              Des conseils actionnables selon l'environnement du jour.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
              UV, chaleur, air et poussière sont traduits en alertes utiles selon votre contexte cutané.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleUseMyLocation()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#111214]"
              >
                <LocateFixed size={15} />
                Utiliser ma position
              </button>
              <Link
                to="/patient-flow/auth/reminders"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white/68"
              >
                Voir les rappels
                <ArrowRight size={14} />
              </Link>
            </div>
            {geoStatus ? <p className="mt-3 text-xs text-white/58">{geoStatus}</p> : null}
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_8px_28px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Contexte actuel
            </p>
            <p className="mt-2 font-serif text-[1.5rem] text-[#111214]">
              {current?.settings.locationLabel ?? "Dakar"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["UV", String(inputs.uv_index ?? "--")],
                ["Temp.", `${inputs.temperature ?? "--"}°C`],
                ["Humidité", `${inputs.humidity ?? "--"}%`],
                ["AQI", String(inputs.aqi ?? "--")],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.2rem] bg-[#FEF0D5]/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/35">{label}</p>
                  <p className="mt-2 font-serif text-3xl text-[#5B1112]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[1.25rem] bg-[#111214]/[0.03] px-4 py-8 text-center text-sm text-[#111214]/56">
            Chargement de la prévention...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#5B1112]" />
                <h2 className="font-serif text-[1.5rem] text-[#111214]">
                  Alertes prévention
                </h2>
              </div>
              <div className="mt-5 space-y-3">
                {(current?.alerts ?? []).length === 0 ? (
                  <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-10 text-center text-sm text-[#111214]/56">
                    Aucun signal préventif majeur pour le moment.
                  </div>
                ) : (
                  current?.alerts.map((alert) => (
                    <Link
                      key={alert.id}
                      to={`/patient-flow/auth/prevention/alerts/${alert.id}`}
                      className="block rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4 transition hover:border-[#5B1112]/18 hover:bg-[#FEF0D5]/55"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${severityTone(alert.severity)}`}>
                            {alert.severity}
                          </span>
                          <h3 className="mt-3 text-base font-semibold text-[#111214]">{alert.title}</h3>
                          <p className="mt-1 text-sm text-[#111214]/58">{alert.body}</p>
                        </div>
                        <ArrowRight size={16} className="text-[#111214]/30" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Wind size={18} className="text-[#5B1112]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">Conseil du jour</p>
                    <p className="mt-1 text-xs text-[#111214]/52">
                      {topAlert?.body ??
                        "Continuez votre routine habituelle et surveillez seulement l'exposition au soleil."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={18} className="text-[#5B1112]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">Source</p>
                    <p className="mt-1 text-xs text-[#111214]/52">
                      {current?.snapshot.source === "fallback"
                        ? "Données de secours utilisées pour garder l'expérience disponible."
                        : "Snapshot environnemental actualisé automatiquement."}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
