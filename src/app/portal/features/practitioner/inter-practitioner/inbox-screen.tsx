import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import { useAuth } from "@portal/session/useAuth";
import type { InterPractitionerCaseRecord } from "@portal/domains/account/types";

const FILTERS = [
  { key: "", label: "Tous" },
  { key: "submitted", label: "À traiter" },
  { key: "waiting_for_external", label: "En attente externe" },
  { key: "responded", label: "Répondus" },
] as const;

export default function PractitionerInterPractitionerInboxScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [items, setItems] = useState<InterPractitionerCaseRecord[]>([]);

  useEffect(() => {
    if (!auth.user) return;
    let active = true;
    void auth.accountAdapter
      .listPractitionerInterPractitionerCases(auth.user.id, status || undefined)
      .then((nextItems) => {
        if (!active) return;
        setItems(nextItems);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user, status]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  return (
    <PractitionerDashboardLayout
      fullName={auth.user?.fullName ?? "Praticien"}
      onLogout={handleLogout}
    >
      <div className="space-y-6 py-2">
        <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#111214]/35">
            Collaboration
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#111214]">Demandes d'avis externes</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setStatus(filter.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  status === filter.key
                    ? "bg-[#5B1112] text-white"
                    : "border border-[#111214]/10 bg-white/70 text-[#111214]/60"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(`/patient-flow/practitioner/inter-practitioner/${item.id}`)
              }
              className="w-full rounded-[2rem] border border-white/70 bg-white/70 p-5 text-left shadow-sm transition hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[#111214]">{item.subject}</h2>
                  <p className="mt-2 text-sm text-[#111214]/58">{item.clinicalContext}</p>
                </div>
                <span className="rounded-full bg-[#5B1112]/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]">
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#111214]/52">
                <span>Patient : {item.patientLabel ?? "Non précisé"}</span>
                <span>Dernier message : {new Date(item.latestMessageAt).toLocaleString("fr-FR")}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </PractitionerDashboardLayout>
  );
}
