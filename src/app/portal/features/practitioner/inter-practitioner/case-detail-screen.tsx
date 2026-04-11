import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import { useAuth } from "@portal/session/useAuth";
import type { InterPractitionerCaseDetailRecord } from "@portal/domains/account/types";

export default function PractitionerInterPractitionerCaseDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { caseId = "" } = useParams();
  const [detail, setDetail] = useState<InterPractitionerCaseDetailRecord | null>(null);
  const [message, setMessage] = useState("");

  async function fetchData() {
    if (!auth.user || !caseId) return;
    return auth.accountAdapter.getPractitionerInterPractitionerCase(auth.user.id, caseId);
  }

  useEffect(() => {
    let active = true;
    void fetchData().then((result) => {
      if (!active || !result) return;
      setDetail(result);
    });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user, caseId]);

  async function refresh() {
    const result = await fetchData();
    if (!result) return;
    setDetail(result);
  }

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  }

  async function handleClaim() {
    if (!auth.user || !caseId) return;
    await auth.accountAdapter.claimInterPractitionerCase(auth.user.id, caseId);
    await refresh();
  }

  async function handleRequestMoreInfo() {
    if (!auth.user || !caseId || !message.trim()) return;
    await auth.accountAdapter.requestMoreInfoForInterPractitionerCase({
      actorUserId: auth.user.id,
      caseId,
      body: message.trim(),
      mediaAssetIds: [],
    });
    setMessage("");
    await refresh();
  }

  async function handleRespond() {
    if (!auth.user || !caseId || !message.trim()) return;
    await auth.accountAdapter.respondToInterPractitionerCase({
      actorUserId: auth.user.id,
      caseId,
      body: message.trim(),
      mediaAssetIds: [],
    });
    setMessage("");
    await refresh();
  }

  async function handleClose() {
    if (!auth.user || !caseId) return;
    await auth.accountAdapter.closeInterPractitionerCase(auth.user.id, caseId);
    await refresh();
  }

  return (
    <PractitionerDashboardLayout
      fullName={auth.user?.fullName ?? "Praticien"}
      onLogout={handleLogout}
    >
      {!detail ? (
        <div className="rounded-[2rem] border border-white/70 bg-white/60 p-6 text-sm text-[#111214]/50">
          Chargement de la demande...
        </div>
      ) : (
        <div className="space-y-6 py-2">
          <section className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#111214]/35">
                  Avis inter-praticien
                </p>
                <h1 className="mt-2 font-serif text-3xl text-[#111214]">
                  {detail.case.subject}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[#111214]/60">
                  {detail.case.clinicalContext}
                </p>
                <p className="mt-3 text-sm font-medium text-[#111214]">
                  Question : {detail.case.question}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="rounded-full bg-[#5B1112]/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]">
                  {detail.case.status}
                </span>
                {!detail.case.claimedByUserId ? (
                  <button
                    type="button"
                    onClick={() => void handleClaim()}
                    className="rounded-full bg-[#111214] px-4 py-2 text-sm font-medium text-white"
                  >
                    Me l'attribuer
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111214]">Fil de discussion</h2>
              <div className="mt-4 space-y-3">
                {detail.messages.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[1.5rem] border border-[#111214]/8 bg-white/80 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium capitalize text-[#111214]">
                        {item.authorRole.replaceAll("_", " ")}
                      </p>
                      <p className="text-xs text-[#111214]/40">
                        {new Date(item.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#111214]/62">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-[#111214]">Action praticien</h2>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={8}
                placeholder="Rédigez une demande de complément ou la réponse dermatologique..."
                className="mt-4 w-full rounded-[1.5rem] border border-[#111214]/10 bg-white/85 px-4 py-3 text-sm text-[#111214] outline-none"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleRequestMoreInfo()}
                  className="rounded-full border border-[#111214]/12 px-4 py-2 text-sm font-medium text-[#111214]/70"
                >
                  Demander des précisions
                </button>
                <button
                  type="button"
                  onClick={() => void handleRespond()}
                  className="rounded-full bg-[#5B1112] px-4 py-2 text-sm font-medium text-white"
                >
                  Envoyer la réponse
                </button>
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  className="rounded-full border border-[#5B1112]/15 px-4 py-2 text-sm font-medium text-[#5B1112]"
                >
                  Clôturer
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </PractitionerDashboardLayout>
  );
}
