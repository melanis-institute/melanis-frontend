import type { EducationProgramRecord } from "@portal/domains/account/types";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { ArrowRight, BookOpenText, CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

function conditionLabel(conditionKey: string) {
  if (conditionKey === "eczema") return "Atopie / eczéma";
  if (conditionKey === "melasma") return "Taches / melasma";
  if (conditionKey === "acne") return "Acné";
  return conditionKey;
}

export default function PatientEducationProgramsScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<EducationProgramRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    auth.accountAdapter
      .listEducationPrograms(auth.user.id, auth.actingProfileId)
      .then((items) => {
        if (active) setPrograms(items);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.actingProfileId, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";
  const profileLabel = useMemo(() => {
    if (!auth.actingProfile) return "Aucun profil actif";
    return `${auth.actingProfile.firstName} ${auth.actingProfile.lastName} · ${relationshipToLabel(auth.actingProfile.relationship)}`;
  }, [auth.actingProfile]);

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
              Education thérapeutique
            </p>
            <h1 className="mt-3 font-serif text-[2rem] leading-none">
              Des programmes concrets pour garder le cap entre deux consultations.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/68">
              Modules courts, routines, checklists et check-ins récurrents,
              assignés directement dans votre parcours de soin.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2.5 text-sm text-white/68">
              <Sparkles size={15} />
              Profil actif : {profileLabel}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_8px_28px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Vue d'ensemble
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Programmes", String(programs.length)],
                [
                  "Complétés",
                  String(programs.filter((item) => item.enrollment?.status === "completed").length),
                ],
                [
                  "Check-ins dus",
                  String(programs.filter((item) => item.enrollment?.nextCheckInDueAt).length),
                ],
                [
                  "Progression moyenne",
                  `${programs.length > 0 ? Math.round(programs.reduce((sum, item) => sum + (item.enrollment?.progressPercent ?? 0), 0) / programs.length) : 0}%`,
                ],
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
                Programmes assignés
              </p>
              <h2 className="mt-2 font-serif text-[1.6rem] text-[#111214]">
                Votre parcours éducatif
              </h2>
            </div>
            <Link
              to="/patient-flow/auth/check-ins"
              className="inline-flex items-center gap-2 rounded-full border border-[#5B1112]/12 px-4 py-2 text-sm font-medium text-[#5B1112]"
            >
              Voir les check-ins
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-[1.25rem] bg-[#111214]/[0.03] px-4 py-8 text-center text-sm text-[#111214]/56">
                Chargement des programmes...
              </div>
            ) : programs.length === 0 ? (
              <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-10 text-center">
                <p className="text-sm text-[#111214]/58">
                  Aucun programme n'est encore assigné à ce profil.
                </p>
                <p className="mt-2 text-xs text-[#111214]/42">
                  Votre praticien pourra vous proposer un parcours éducatif après la consultation.
                </p>
              </div>
            ) : (
              programs.map((program) => (
                <Link
                  key={program.id}
                  to={`/patient-flow/auth/programs/${program.id}`}
                  className="block rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4 transition hover:border-[#5B1112]/18 hover:bg-[#FEF0D5]/55"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#5B1112]/8 px-3 py-1 text-[11px] font-semibold text-[#5B1112]">
                          <BookOpenText size={12} />
                          {conditionLabel(program.conditionKey)}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/30">
                          {program.modulesCount} modules
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-[#111214]">
                        {program.title}
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-[#111214]/56">
                        {program.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#111214]/68">
                        <CheckCircle2 size={13} className="text-[#5B1112]" />
                        {program.enrollment?.progressPercent ?? 0}% complété
                      </div>
                      {program.enrollment?.nextCheckInDueAt ? (
                        <p className="mt-2 text-xs text-[#111214]/42">
                          Prochain check-in :{" "}
                          {new Date(program.enrollment.nextCheckInDueAt).toLocaleDateString("fr-FR")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
