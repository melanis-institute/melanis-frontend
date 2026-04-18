import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@portal/session/useAuth";
import type {
  ExternalPractitionerApplicationRecord,
  InterPractitionerCaseDetailRecord,
  InterPractitionerCaseRecord,
} from "@portal/domains/account/types";

export default function ExternalPractitionerHome() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<ExternalPractitionerApplicationRecord | null>(null);
  const [cases, setCases] = useState<InterPractitionerCaseRecord[]>([]);
  const [selectedCase, setSelectedCase] = useState<InterPractitionerCaseDetailRecord | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [subject, setSubject] = useState("");
  const [clinicalContext, setClinicalContext] = useState("");
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState("");

  async function refresh() {
    if (!auth.user) return;
    const [applications, nextCases] = await Promise.all([
      auth.accountAdapter.listExternalPractitionerApplications(auth.user.id),
      auth.accountAdapter.listExternalPractitionerCases(auth.user.id),
    ]);
    setApplication(applications.find((item) => item.userId === auth.user?.id) ?? null);
    setCases(nextCases);
  }

  useEffect(() => {
    let active = true;
    if (!auth.user) return;
    void Promise.all([
      auth.accountAdapter.listExternalPractitionerApplications(auth.user.id),
      auth.accountAdapter.listExternalPractitionerCases(auth.user.id),
    ]).then(([applications, nextCases]) => {
      if (!active) return;
      setApplication(applications.find((item) => item.userId === auth.user?.id) ?? null);
      setCases(nextCases);
    });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  async function handleSubmitApplication() {
    if (!auth.user) return;
    setApplication(
      await auth.accountAdapter.createExternalPractitionerApplication({
        userId: auth.user.id,
        specialty,
      }),
    );
  }

  async function handleCreateCase() {
    if (!auth.user || !subject.trim() || !clinicalContext.trim() || !question.trim()) return;
    await auth.accountAdapter.createExternalPractitionerCase({
      actorUserId: auth.user.id,
      subject: subject.trim(),
      clinicalContext: clinicalContext.trim(),
      question: question.trim(),
      consentAttested: true,
      mediaAssetIds: [],
    });
    setSubject("");
    setClinicalContext("");
    setQuestion("");
    await refresh();
  }

  async function handleOpenCase(caseId: string) {
    if (!auth.user) return;
    setSelectedCase(
      await auth.accountAdapter.getExternalPractitionerCase(auth.user.id, caseId),
    );
  }

  async function handleReply() {
    if (!auth.user || !selectedCase || !reply.trim()) return;
    const detail = await auth.accountAdapter.replyToExternalPractitionerCase({
      actorUserId: auth.user.id,
      caseId: selectedCase.case.id,
      body: reply.trim(),
      mediaAssetIds: [],
    });
    setReply("");
    setSelectedCase(detail);
    await refresh();
  }

  const isApproved = application?.status === "approved";

  return (
    <div className="min-h-screen bg-[#FEF0D5] px-5 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-[#111214]">Praticien externe</h1>
              <p className="mt-1 text-sm text-[rgba(17,18,20,0.62)]">
                Déposez votre dossier de vérification puis soumettez des demandes d'avis
                dermatologique structurées.
              </p>
            </div>
            <button
              onClick={() => void handleLogout()}
              className="rounded-xl border border-[rgba(17,18,20,0.12)] px-3 py-2 text-xs font-medium text-[#111214]"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Validation du compte</h2>
            {application ? (
              <div className="mt-4 rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                <p className="text-sm text-[rgba(17,18,20,0.58)]">Statut</p>
                <p className="mt-1 font-medium text-[#111214]">{application.status}</p>
                <p className="mt-3 text-sm text-[rgba(17,18,20,0.58)]">
                  Spécialité : {application.specialty ?? "Non précisée"}
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <input
                  value={specialty}
                  onChange={(event) => setSpecialty(event.target.value)}
                  placeholder="Spécialité"
                  className="w-full rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleSubmitApplication()}
                  className="rounded-2xl bg-[#5B1112] px-4 py-3 text-sm font-medium text-white"
                >
                  Envoyer la demande
                </button>
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Nouvelle demande d'avis</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Motif de la demande"
                disabled={!isApproved}
                className="w-full rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none disabled:bg-[#F7F7F7]"
              />
              <textarea
                value={clinicalContext}
                onChange={(event) => setClinicalContext(event.target.value)}
                placeholder="Contexte clinique"
                rows={4}
                disabled={!isApproved}
                className="w-full rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none disabled:bg-[#F7F7F7]"
              />
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Question adressée au dermatologue"
                rows={4}
                disabled={!isApproved}
                className="w-full rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none disabled:bg-[#F7F7F7]"
              />
              <button
                type="button"
                disabled={!isApproved}
                onClick={() => void handleCreateCase()}
                className="rounded-2xl bg-[#111214] px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
              >
                Soumettre le dossier
              </button>
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Mes dossiers</h2>
            <div className="mt-4 space-y-3">
              {cases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void handleOpenCase(item.id)}
                  className="w-full rounded-2xl border border-[rgba(17,18,20,0.08)] p-4 text-left"
                >
                  <p className="font-medium text-[#111214]">{item.subject}</p>
                  <p className="mt-1 text-sm text-[rgba(17,18,20,0.58)]">{item.status}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white p-6">
            <h2 className="text-lg font-semibold text-[#111214]">Fil de discussion</h2>
            {!selectedCase ? (
              <p className="mt-4 text-sm text-[rgba(17,18,20,0.58)]">
                Sélectionnez un dossier pour consulter les échanges.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {selectedCase.messages.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[rgba(17,18,20,0.08)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[rgba(17,18,20,0.35)]">
                      {item.authorRole}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[rgba(17,18,20,0.65)]">{item.body}</p>
                  </div>
                ))}
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  rows={4}
                  placeholder="Répondre au dermatologue"
                  className="w-full rounded-2xl border border-[rgba(17,18,20,0.1)] px-4 py-3 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  className="rounded-2xl bg-[#5B1112] px-4 py-3 text-sm font-medium text-white"
                >
                  Envoyer la réponse
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
