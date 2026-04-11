import type {
  EducationModuleProgressRecord,
  EducationProgramDetailRecord,
} from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  ClipboardList,
  MessageSquareText,
  Send,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

function progressFor(
  progress: EducationModuleProgressRecord[],
  moduleId: string,
) {
  return progress.find((item) => item.moduleId === moduleId)?.status ?? "not_started";
}

export default function PatientEducationProgramDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const programId = params.programId ?? "";
  const [detail, setDetail] = useState<EducationProgramDetailRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyModuleId, setBusyModuleId] = useState<string | null>(null);
  const [threadMessage, setThreadMessage] = useState("");
  const [requestAppointment, setRequestAppointment] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [threadFeedback, setThreadFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId || !programId) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    auth.accountAdapter
      .getEducationProgram(auth.user.id, auth.actingProfileId, programId)
      .then((payload) => {
        if (active) setDetail(payload);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.actingProfileId, auth.user, programId]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";
  const progressPercent = detail?.program.enrollment?.progressPercent ?? 0;
  const nextCheckInPath = detail?.program.enrollment
    ? `/patient-flow/auth/check-ins?enrollmentId=${detail.program.enrollment.id}`
    : "/patient-flow/auth/check-ins";

  const completedCount = useMemo(
    () =>
      detail?.progress.filter((item) => item.status === "completed").length ?? 0,
    [detail?.progress],
  );

  const handleComplete = async (moduleId: string) => {
    if (!auth.user || !auth.actingProfileId) return;
    setBusyModuleId(moduleId);
    try {
      const next = await auth.accountAdapter.markEducationModuleProgress({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        moduleId,
        status:
          progressFor(detail?.progress ?? [], moduleId) === "completed"
            ? "in_progress"
            : "completed",
      });
      setDetail(next);
    } finally {
      setBusyModuleId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!auth.user || !auth.actingProfileId || !threadMessage.trim()) return;
    setSendingMessage(true);
    setThreadFeedback(null);
    try {
      const next = await auth.accountAdapter.createEducationThreadMessage({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        programId,
        body: threadMessage.trim(),
        requestAppointment,
      });
      setDetail(next);
      setThreadMessage("");
      setRequestAppointment(false);
      setThreadFeedback("Message envoyé au praticien.");
    } catch (error) {
      setThreadFeedback(
        error instanceof Error ? error.message : "Impossible d'envoyer le message.",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <Link
            to="/patient-flow/auth/programs"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/70"
          >
            <ArrowLeft size={14} />
            Retour aux programmes
          </Link>
          <h1 className="mt-4 font-serif text-[2rem] leading-none">
            {detail?.program.title ?? "Programme"}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/68">
            {detail?.program.description ??
              "Suivez les modules et validez chaque étape à votre rythme."}
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["Progression", `${progressPercent}%`],
              ["Modules terminés", `${completedCount}/${detail?.modules.length ?? 0}`],
              [
                "Prochain check-in",
                detail?.program.enrollment?.nextCheckInDueAt
                  ? new Date(detail.program.enrollment.nextCheckInDueAt).toLocaleDateString("fr-FR")
                  : "À planifier",
              ],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-white/42">{label}</p>
                <p className="mt-2 text-lg font-semibold text-white/90">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="rounded-[1.25rem] bg-[#111214]/[0.03] px-4 py-8 text-center text-sm text-[#111214]/56">
            Chargement du programme...
          </div>
        ) : detail ? (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                    Modules
                  </p>
                  <h2 className="mt-2 font-serif text-[1.6rem] text-[#111214]">
                    Parcours guidé
                  </h2>
                </div>
                <Link
                  to={nextCheckInPath}
                  className="inline-flex items-center gap-2 rounded-full border border-[#5B1112]/12 px-4 py-2 text-sm font-medium text-[#5B1112]"
                >
                  Ouvrir le check-in
                  <ClipboardList size={15} />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {detail.modules.map((module) => {
                  const status = progressFor(detail.progress, module.id);
                  const isCompleted = status === "completed";
                  return (
                    <div
                      key={module.id}
                      className="rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#5B1112]/8 px-3 py-1 text-[11px] font-semibold text-[#5B1112]">
                              {module.moduleType}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/30">
                              {module.estimatedMinutes} min
                            </span>
                          </div>
                          <h3 className="mt-3 text-lg font-semibold text-[#111214]">
                            {module.title}
                          </h3>
                          <p className="mt-1 text-sm text-[#111214]/56">
                            {module.summary}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleComplete(module.id)}
                          disabled={busyModuleId === module.id}
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                            isCompleted
                              ? "bg-[#5B1112] text-white"
                              : "border border-[#111214]/10 bg-white text-[#111214]/72"
                          }`}
                        >
                          {isCompleted ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                          {busyModuleId === module.id
                            ? "Mise à jour..."
                            : isCompleted
                              ? "Terminé"
                              : "Marquer terminé"}
                        </button>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-[#111214]/70">{module.body}</p>

                      {module.checklistItems.length > 0 ? (
                        <div className="mt-4 grid gap-2">
                          {module.checklistItems.map((item) => (
                            <div key={item} className="inline-flex items-center gap-2 text-sm text-[#111214]/68">
                              <Check size={13} className="text-[#5B1112]" />
                              {item}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {module.routineMoments.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {module.routineMoments.map((moment) => (
                            <span
                              key={moment}
                              className="rounded-full bg-[#FEF0D5] px-3 py-1 text-xs font-medium text-[#111214]/65"
                            >
                              {moment}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="space-y-5">
              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                  Suivi
                </p>
                <h2 className="mt-2 font-serif text-[1.5rem] text-[#111214]">
                  Derniers check-ins
                </h2>
                <div className="mt-4 space-y-3">
                  {detail.recentCheckIns.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-6 text-sm text-[#111214]/54">
                      Aucun check-in enregistré pour ce programme.
                    </div>
                  ) : (
                    detail.recentCheckIns.map((item) => (
                      <div key={item.id} className="rounded-[1.25rem] bg-[#FEF0D5]/65 p-4">
                        <p className="text-xs font-medium text-[#111214]">
                          {new Date(item.submittedAt).toLocaleString("fr-FR")}
                        </p>
                        <p className="mt-2 text-sm text-[#111214]/62">
                          {Object.entries(item.questionnaireData)
                            .slice(0, 2)
                            .map(([key, value]) => `${key} : ${String(value)}`)
                            .join(" · ") || "Questionnaire soumis"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                      Interaction encadrée
                    </p>
                    <h2 className="mt-2 font-serif text-[1.5rem] text-[#111214]">
                      Questions sur le programme
                    </h2>
                  </div>
                  <MessageSquareText size={18} className="text-[#5B1112]" />
                </div>

                <div className="mt-4 rounded-[1.2rem] border border-[#5B1112]/10 bg-[#FEF0D5]/70 p-4">
                  <p className="text-sm font-medium text-[#111214]">
                    Cet espace sert à clarifier le programme, pas à gérer une urgence.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#111214]/58">
                    En cas d'aggravation, douleur importante ou besoin d'un nouvel avis clinique,
                    demandez un rendez-vous ou utilisez la télé-dermatologie.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/patient-flow"
                      className="inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-3 py-2 text-xs font-semibold text-white"
                    >
                      <ArrowRight size={14} />
                      Prendre un rendez-vous
                    </Link>
                    <Link
                      to="/patient-flow/auth/telederm/new"
                      className="inline-flex items-center gap-2 rounded-full border border-[#111214]/10 bg-white px-3 py-2 text-xs font-medium text-[#111214]/72"
                    >
                      Télé-derm asynchrone
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {(detail.messages ?? []).length === 0 ? (
                    <div className="rounded-[1.2rem] border border-dashed border-[#111214]/10 px-4 py-6 text-sm text-[#111214]/54">
                      Aucune question pour le moment. Utilisez ce fil pour demander une précision
                      sur la routine, les déclencheurs ou les consignes du programme.
                    </div>
                  ) : (
                    detail.messages.map((message) => {
                      const isPractitioner = message.authorRole === "practitioner";
                      return (
                        <div
                          key={message.id}
                          className={`rounded-[1.2rem] p-4 ${
                            isPractitioner
                              ? "bg-[#111214] text-white"
                              : "border border-[#111214]/6 bg-[#111214]/[0.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className={`text-xs font-semibold ${
                                isPractitioner ? "text-white/82" : "text-[#111214]"
                              }`}
                            >
                              {isPractitioner ? "Praticien" : "Patient / accompagnant"}
                            </p>
                            <p
                              className={`text-[11px] ${
                                isPractitioner ? "text-white/55" : "text-[#111214]/40"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleString("fr-FR")}
                            </p>
                          </div>
                          <p
                            className={`mt-2 text-sm leading-6 ${
                              isPractitioner ? "text-white/76" : "text-[#111214]/68"
                            }`}
                          >
                            {message.body}
                          </p>
                          {message.meta.requestAppointment ? (
                            <p
                              className={`mt-2 text-xs ${
                                isPractitioner ? "text-white/60" : "text-[#5B1112]"
                              }`}
                            >
                              Escalade demandée vers un rendez-vous.
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 rounded-[1.25rem] border border-[#111214]/8 bg-white p-4">
                  <textarea
                    value={threadMessage}
                    onChange={(event) => setThreadMessage(event.currentTarget.value)}
                    rows={4}
                    placeholder="Posez une question sur la routine, les déclencheurs ou les consignes du programme."
                    className="w-full rounded-xl border border-[#111214]/10 bg-white px-3 py-2.5 text-sm text-[#111214]"
                  />
                  <label className="mt-3 flex items-center gap-2 text-xs text-[#111214]/62">
                    <input
                      type="checkbox"
                      checked={requestAppointment}
                      onChange={(event) => setRequestAppointment(event.currentTarget.checked)}
                    />
                    Je pense qu'un rendez-vous est préférable.
                  </label>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    {threadFeedback ? (
                      <p className="text-xs text-[#111214]/58">{threadFeedback}</p>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => void handleSendMessage()}
                      disabled={!threadMessage.trim() || sendingMessage}
                      className="inline-flex items-center gap-2 rounded-full bg-[#5B1112] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-55"
                    >
                      <Send size={14} />
                      {sendingMessage ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <Sparkles size={18} className="text-[#5B1112]" />
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">Rester constant</p>
                    <p className="mt-1 text-xs text-[#111214]/52">
                      Mieux vaut compléter un module après l'autre que tout lire sans appliquer.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
