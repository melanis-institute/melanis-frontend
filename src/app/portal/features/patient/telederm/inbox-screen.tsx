import { useEffect, useMemo, useState } from "react";
import type { AsyncCaseRecord } from "@portal/domains/account/types";
import { relationshipToLabel } from "@portal/domains/account/mockAccountAdapter";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { ArrowRight, Plus, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { TELEDERM_STATUS_LABELS, TELEDERM_STATUS_STYLES, formatTeledermDate } from "@portal/features/telederm/shared";

export default function PatientTeledermInboxScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState<AsyncCaseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    auth.accountAdapter
      .listAsyncCases(auth.user.id, auth.actingProfileId)
      .then((items) => {
        if (active) setCases(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  const fullName = auth.user?.fullName ?? "Patient";
  const profileLabel = useMemo(() => {
    if (!auth.actingProfile) return "Aucun profil actif";
    return `${auth.actingProfile.firstName} ${auth.actingProfile.lastName} · ${relationshipToLabel(auth.actingProfile.relationship)}`;
  }, [auth.actingProfile]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
              Télé-derm asynchrone
            </p>
            <h1 className="mt-3 font-serif text-[2rem] leading-none">
              Déposez un cas, recevez une réponse sans rendez-vous live.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">
              Questionnaire ciblé, photos guidées, puis suivi des échanges
              directement dans votre dossier patient.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/patient-flow/auth/telederm/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-[#111214]"
              >
                <Plus size={16} />
                Nouveau cas
              </Link>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white/68">
                <Sparkles size={15} />
                Profil actif : {profileLabel}
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_8px_28px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Vue d'ensemble
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Cas totaux", String(cases.length)],
                ["Réponses prêtes", String(cases.filter((item) => item.status === "responded").length)],
                ["Action requise", String(cases.filter((item) => item.status === "waiting_for_patient").length)],
                ["En cours", String(cases.filter((item) => ["submitted", "in_review", "patient_replied"].includes(item.status)).length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.2rem] bg-[#FEF0D5]/70 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/35">
                    {label}
                  </p>
                  <p className="mt-2 font-serif text-3xl text-[#5B1112]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Dossiers
              </p>
              <h2 className="mt-2 font-serif text-[1.6rem] text-[#111214]">
                Historique télé-derm
              </h2>
            </div>
            <Link
              to="/patient-flow/auth/telederm/new"
              className="inline-flex items-center gap-2 rounded-full border border-[#5B1112]/12 px-4 py-2 text-sm font-medium text-[#5B1112]"
            >
              Nouveau cas
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[1.25rem] bg-[#111214]/[0.03] px-4 py-8 text-center text-sm text-[#111214]/56">
                Chargement des cas télé-derm...
              </div>
            ) : cases.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-10 text-center">
                <p className="text-sm text-[#111214]/58">
                  Aucun dossier asynchrone pour ce profil.
                </p>
                <Link
                  to="/patient-flow/auth/telederm/new"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2 text-sm font-medium text-white"
                >
                  Démarrer un cas
                  <ArrowRight size={14} />
                </Link>
              </div>
            ) : (
              cases.map((item) => {
                const statusStyle = TELEDERM_STATUS_STYLES[item.status];
                const StatusIcon = statusStyle.icon;
                return (
                  <Link
                    key={item.id}
                    to={`/patient-flow/auth/telederm/cases/${item.id}`}
                    className="block rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4 transition hover:border-[#5B1112]/18 hover:bg-[#FEF0D5]/55"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.tone}`}>
                            <StatusIcon size={12} />
                            {TELEDERM_STATUS_LABELS[item.status]}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/30">
                            {item.bodyArea ?? "Zone à préciser"}
                          </span>
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-[#111214]">
                          {item.patientSummary || "Questionnaire en cours de préparation"}
                        </h3>
                        <p className="mt-1 text-sm text-[#111214]/56">
                          Motif : {item.conditionKey ?? "Non renseigné"} ·
                          Dernière activité {formatTeledermDate(item.latestMessageAt ?? item.updatedAt)}
                        </p>
                      </div>
                      <div className="text-right text-xs text-[#111214]/42">
                        <p>Créé le {formatTeledermDate(item.createdAt)}</p>
                        {item.slaDueAt ? <p className="mt-1">SLA {formatTeledermDate(item.slaDueAt)}</p> : null}
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
