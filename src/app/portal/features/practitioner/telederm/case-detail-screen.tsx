import { useEffect, useState } from "react";
import type { AsyncCaseDetailRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import { useNavigate, useParams } from "react-router";
import { TELEDERM_STATUS_LABELS, TELEDERM_STATUS_STYLES, formatTeledermDate } from "@portal/features/telederm/shared";
import { ArrowRight, CheckCircle2, MessageSquareMore, Send } from "lucide-react";

export default function PractitionerTeledermCaseDetailScreen() {
  const { caseId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AsyncCaseDetailRecord | null>(null);
  const [requestBody, setRequestBody] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [body, setBody] = useState("");
  const [prescriptionName, setPrescriptionName] = useState("");
  const [prescriptionInstructions, setPrescriptionInstructions] = useState("");

  async function refreshDetail() {
    if (!auth.user || !caseId) return;
    const next = await auth.accountAdapter.getAsyncCase(auth.user.id, caseId);
    setDetail(next);
  }

  useEffect(() => {
    void refreshDetail();
  }, [auth.accountAdapter, auth.user, caseId]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleClaim() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.claimAsyncCase(auth.user.id, detail.case.id);
    await refreshDetail();
  }

  async function handleRequestMoreInfo() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.requestMoreInfo({
      actorUserId: auth.user.id,
      caseId: detail.case.id,
      body: requestBody,
    });
    setRequestBody("");
    await refreshDetail();
  }

  async function handleRespond() {
    if (!auth.user || !detail) return;
    const next = await auth.accountAdapter.respondToAsyncCase({
      actorUserId: auth.user.id,
      caseId: detail.case.id,
      diagnosis,
      clinicalSummary,
      body,
      prescriptionItems:
        prescriptionName && prescriptionInstructions
          ? [
              {
                name: prescriptionName,
                instructions: prescriptionInstructions,
                isMedication: true,
              },
            ]
          : [],
    });
    setDetail(next);
  }

  async function handleClose() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.closeAsyncCase(auth.user.id, detail.case.id);
    await refreshDetail();
  }

  if (!detail) {
    return (
      <PractitionerDashboardLayout fullName={auth.user?.fullName ?? "Praticien"} onLogout={handleLogout}>
        <div className="rounded-[2rem] bg-white/82 p-8 text-center text-sm text-[#111214]/58">
          Chargement du dossier télé-derm...
        </div>
      </PractitionerDashboardLayout>
    );
  }

  const statusStyle = TELEDERM_STATUS_STYLES[detail.case.status];
  const StatusIcon = statusStyle.icon;

  return (
    <PractitionerDashboardLayout fullName={auth.user?.fullName ?? "Praticien"} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.tone}`}>
              <StatusIcon size={12} />
              {TELEDERM_STATUS_LABELS[detail.case.status]}
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/36">
              {detail.case.bodyArea ?? "Zone"}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            {detail.case.patientSummary || "Cas télé-derm"}
          </h1>
          <p className="mt-4 text-sm text-white/66">
            Créé le {formatTeledermDate(detail.case.createdAt)} · dernier message{" "}
            {formatTeledermDate(detail.case.latestMessageAt ?? detail.case.updatedAt)}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {["submitted", "patient_replied"].includes(detail.case.status) ? (
              <button
                type="button"
                onClick={() => void handleClaim()}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#111214]"
              >
                Réclamer le dossier
              </button>
            ) : null}
            {detail.case.status === "responded" ? (
              <button
                type="button"
                onClick={() => void handleClose()}
                className="rounded-full border border-white/16 px-4 py-2 text-sm font-medium text-white"
              >
                Clôturer
              </button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Questionnaire patient
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {Object.entries(detail.case.questionnaireData).map(([key, value]) => (
                  <div key={key} className="rounded-[1.25rem] bg-[#111214]/[0.03] p-4">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-[#111214]/30">
                      {key}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#111214]/66">
                      {String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Média & comparaison
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {detail.mediaAssets.map((asset) => (
                  <div key={asset.id} className="overflow-hidden rounded-[1.25rem] border border-[#111214]/6">
                    <div className="aspect-[4/3] bg-[#FEF0D5]/80">
                      {asset.downloadUrl ? (
                        <img src={asset.downloadUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-[#111214]">{asset.captureKind ?? "photo"}</p>
                      <p className="mt-1 text-xs text-[#111214]/52">
                        {formatTeledermDate(asset.uploadedAt ?? asset.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {detail.comparisonGroups.length > 0 ? (
                <div className="mt-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3">
                    {detail.comparisonGroups[0].mediaAssets.map((asset) => (
                      <div key={asset.id} className="w-40 flex-shrink-0">
                        <div className="aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#FEF0D5]/80">
                          {asset.downloadUrl ? (
                            <img src={asset.downloadUrl} alt={asset.fileName} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-[#111214]/52">
                          {formatTeledermDate(asset.uploadedAt ?? asset.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Fil d'échange
              </p>
              <div className="mt-5 space-y-3">
                {detail.messages.map((message) => (
                  <div key={message.id} className="rounded-[1.25rem] bg-[#111214]/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#111214]">
                        {message.authorRole}
                      </span>
                      <span className="text-xs text-[#111214]/42">
                        {formatTeledermDate(message.createdAt)}
                      </span>
                    </div>
                    {message.body ? (
                      <p className="mt-3 text-sm leading-6 text-[#111214]/64">
                        {message.body}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {["in_review", "patient_replied"].includes(detail.case.status) ? (
              <div className="rounded-[2rem] border border-[#5B1112]/10 bg-white/90 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <MessageSquareMore size={18} />
                  <p className="text-sm font-semibold">Demande d'informations</p>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(event) => setRequestBody(event.target.value)}
                  rows={4}
                  className="mt-4 w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                  placeholder="Précisez ce que vous attendez du patient..."
                />
                <button
                  type="button"
                  onClick={() => void handleRequestMoreInfo()}
                  disabled={requestBody.trim().length < 6}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#5B1112]/12 px-4 py-3 text-sm font-semibold text-[#5B1112] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Envoyer la demande
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : null}

            {["in_review", "patient_replied"].includes(detail.case.status) ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="flex items-center gap-2 text-[#111214]">
                  <CheckCircle2 size={18} className="text-[#5B1112]" />
                  <p className="text-sm font-semibold">Publier une réponse</p>
                </div>
                <div className="mt-4 space-y-3">
                  <input
                    value={diagnosis}
                    onChange={(event) => setDiagnosis(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Diagnostic"
                  />
                  <textarea
                    value={clinicalSummary}
                    onChange={(event) => setClinicalSummary(event.target.value)}
                    rows={3}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Synthèse clinique"
                  />
                  <textarea
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={4}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Conseils, plan thérapeutique, surveillance..."
                  />
                  <input
                    value={prescriptionName}
                    onChange={(event) => setPrescriptionName(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Médicament optionnel"
                  />
                  <textarea
                    value={prescriptionInstructions}
                    onChange={(event) => setPrescriptionInstructions(event.target.value)}
                    rows={2}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Posologie"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => void handleRespond()}
                  disabled={clinicalSummary.trim().length < 8}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Publier la réponse
                  <Send size={15} />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PractitionerDashboardLayout>
  );
}
