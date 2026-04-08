import { useEffect, useState } from "react";
import type { AsyncCaseRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import { Link, useNavigate } from "react-router";
import { TELEDERM_STATUS_LABELS, TELEDERM_STATUS_STYLES, formatTeledermDate } from "@portal/features/telederm/shared";

const FILTERS = [
  ["all", "Tous"],
  ["submitted", "Soumis"],
  ["in_review", "En revue"],
  ["waiting_for_patient", "Action patient"],
  ["patient_replied", "Réponse patient"],
  ["responded", "Répondu"],
  ["closed", "Clos"],
  ["overdue", "En retard"],
] as const;

export default function PractitionerTeledermInboxScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [cases, setCases] = useState<AsyncCaseRecord[]>([]);

  useEffect(() => {
    if (!auth.user) return;
    const status = filter === "all" ? undefined : filter;
    auth.accountAdapter.listPractitionerAsyncCases(auth.user.id, status).then(setCases);
  }, [auth.accountAdapter, auth.user, filter]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleClaim(caseId: string) {
    if (!auth.user) return;
    await auth.accountAdapter.claimAsyncCase(auth.user.id, caseId);
    const nextStatus = filter === "all" ? undefined : filter;
    const nextCases = await auth.accountAdapter.listPractitionerAsyncCases(auth.user.id, nextStatus);
    setCases(nextCases);
  }

  return (
    <PractitionerDashboardLayout fullName={auth.user?.fullName ?? "Praticien"} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
            Inbox télé-derm
          </p>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            Pile asynchrone praticien.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/66">
            Réclamez un dossier, demandez plus d&apos;infos, publiez un compte-rendu,
            puis clôturez le cas sans quitter l&apos;app.
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  filter === value
                    ? "bg-[#5B1112] text-white"
                    : "border border-[#111214]/8 bg-white text-[#111214]/62"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {cases.map((item) => {
              const statusStyle = TELEDERM_STATUS_STYLES[item.status];
              const StatusIcon = statusStyle.icon;
              return (
                <div
                  key={item.id}
                  className="rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.tone}`}>
                          <StatusIcon size={12} />
                          {TELEDERM_STATUS_LABELS[item.status]}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/30">
                          {item.bodyArea ?? "Zone"}
                        </span>
                      </div>
                      <h2 className="mt-3 text-base font-semibold text-[#111214]">
                        {item.patientSummary || "Cas sans résumé patient"}
                      </h2>
                      <p className="mt-1 text-sm text-[#111214]/56">
                        {item.conditionKey ?? "Motif non renseigné"} · mis à jour {formatTeledermDate(item.latestMessageAt ?? item.updatedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {["submitted", "patient_replied"].includes(item.status) ? (
                        <button
                          type="button"
                          onClick={() => void handleClaim(item.id)}
                          className="rounded-full border border-[#5B1112]/16 px-4 py-2 text-sm font-medium text-[#5B1112]"
                        >
                          Réclamer
                        </button>
                      ) : null}
                      <Link
                        to={`/patient-flow/practitioner/telederm/${item.id}`}
                        className="rounded-full bg-[#111214] px-4 py-2 text-sm font-medium text-white"
                      >
                        Ouvrir
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            {cases.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-10 text-center text-sm text-[#111214]/58">
                Aucun dossier pour ce filtre.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PractitionerDashboardLayout>
  );
}
