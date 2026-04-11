import type { PreventionAlertRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

export default function PatientPreventionAlertDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const alertId = params.alertId ?? "";
  const [alert, setAlert] = useState<PreventionAlertRecord | null>(null);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId || !alertId) return;
    auth.accountAdapter
      .listPreventionAlerts(auth.user.id, auth.actingProfileId)
      .then((items) => setAlert(items.find((item) => item.id === alertId) ?? null));
  }, [alertId, auth.accountAdapter, auth.actingProfileId, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <Link
          to="/patient-flow/auth/prevention"
          className="inline-flex items-center gap-2 rounded-full border border-[#111214]/10 bg-white px-4 py-2 text-sm font-medium text-[#111214]/68"
        >
          <ArrowLeft size={14} />
          Retour à la prévention
        </Link>

        {alert ? (
          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[#5B1112]/8 p-3">
                <ShieldAlert size={20} className="text-[#5B1112]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                  Alerte prévention
                </p>
                <h1 className="mt-2 font-serif text-[1.9rem] text-[#111214]">
                  {alert.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-[#111214]/66">
                  {alert.body}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              {[
                ["Sévérité", alert.severity],
                ["Début", new Date(alert.startsAt).toLocaleString("fr-FR")],
                ["Expire", alert.expiresAt ? new Date(alert.expiresAt).toLocaleString("fr-FR") : "—"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.2rem] bg-[#FEF0D5]/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/35">{label}</p>
                  <p className="mt-2 text-sm font-semibold text-[#111214]">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
