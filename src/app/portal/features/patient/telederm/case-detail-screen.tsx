import { useEffect, useState } from "react";
import type { AccountAdapter } from "@portal/domains/account/adapter.types";
import type { AsyncCaseDetailRecord, MediaAssetRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { Link, useNavigate, useParams } from "react-router";
import { TELEDERM_STATUS_LABELS, TELEDERM_STATUS_STYLES, formatTeledermDate } from "@portal/features/telederm/shared";
import { ArrowRight, CheckCircle2, Circle, Clock3, MessageCircleMore, Send } from "lucide-react";

type ReplyPhoto = {
  id: string;
  file: File;
  url: string;
};

type PatientProgressStep = {
  key: string;
  label: string;
  description: string;
  occurredAt?: string;
  state: "completed" | "current" | "upcoming";
};

const STATUS_ORDER: AsyncCaseDetailRecord["case"]["status"][] = [
  "draft",
  "submitted",
  "in_review",
  "waiting_for_patient",
  "patient_replied",
  "responded",
  "closed",
];

const CAPTURE_KIND_LABELS: Record<string, string> = {
  context: "Vue d'ensemble",
  close: "Gros plan",
  follow_up: "Photo complémentaire",
};

function getStatusRank(status: AsyncCaseDetailRecord["case"]["status"]) {
  return STATUS_ORDER.indexOf(status);
}

function getProgressState(
  currentStatus: AsyncCaseDetailRecord["case"]["status"],
  statuses: AsyncCaseDetailRecord["case"]["status"][],
): PatientProgressStep["state"] {
  const currentRank = getStatusRank(currentStatus);
  const highestRank = Math.max(...statuses.map((status) => getStatusRank(status)));
  if (statuses.some((status) => status === currentStatus)) return "current";
  return highestRank >= currentRank ? "completed" : "upcoming";
}

function buildPatientProgress(detail: AsyncCaseDetailRecord): PatientProgressStep[] {
  const statusesSeen = new Set<AsyncCaseDetailRecord["case"]["status"]>(["submitted"]);
  detail.messages.forEach((message) => {
    const status = message.meta?.status;
    if (typeof status === "string" && STATUS_ORDER.includes(status as AsyncCaseDetailRecord["case"]["status"])) {
      statusesSeen.add(status as AsyncCaseDetailRecord["case"]["status"]);
    }
  });
  statusesSeen.add(detail.case.status);

  const timeline: PatientProgressStep[] = [
    {
      key: "submitted",
      label: "Dossier envoyé",
      description: "Votre demande a bien été transmise à l'équipe dermatologique.",
      occurredAt: detail.case.submittedAt ?? detail.case.createdAt,
      state: getProgressState(detail.case.status, ["submitted"]),
    },
    {
      key: "in_review",
      label: "Analyse en cours",
      description: "Un dermatologue examine vos photos et votre questionnaire.",
      occurredAt:
        detail.messages.find(
          (message) =>
            message.type === "status_change" &&
            typeof message.meta?.status === "string" &&
            ["in_review", "patient_replied", "responded", "closed"].includes(message.meta.status),
        )?.createdAt ?? detail.case.latestMessageAt,
      state: getProgressState(detail.case.status, ["in_review", "patient_replied", "responded", "closed"]),
    },
  ];

  if (
    statusesSeen.has("waiting_for_patient") ||
    statusesSeen.has("patient_replied") ||
    detail.case.status === "waiting_for_patient"
  ) {
    timeline.push({
      key: "waiting_for_patient",
      label: "Compléments demandés",
      description:
        detail.case.status === "waiting_for_patient"
          ? "Le dermatologue attend des précisions ou de nouvelles photos de votre part."
          : "Vous avez répondu à la demande de compléments.",
      occurredAt:
        detail.messages.find(
          (message) =>
            message.type === "request_more_info" ||
            (message.type === "status_change" && message.meta?.status === "waiting_for_patient"),
        )?.createdAt,
      state: getProgressState(detail.case.status, ["waiting_for_patient", "patient_replied"]),
    });
  }

  timeline.push({
    key: "responded",
    label: "Réponse disponible",
    description: "Votre compte-rendu et vos recommandations sont prêts à être consultés.",
    occurredAt: detail.case.respondedAt,
    state: getProgressState(detail.case.status, ["responded", "closed"]),
  });

  timeline.push({
    key: "closed",
    label: "Cas clôturé",
    description: "Le dossier est finalisé et archivé dans votre suivi.",
    occurredAt: detail.case.closedAt,
    state: getProgressState(detail.case.status, ["closed"]),
  });

  return timeline;
}

async function uploadReplyPhotos(
  authUserId: string,
  caseId: string,
  accountAdapter: AccountAdapter,
  detail: AsyncCaseDetailRecord,
  photos: ReplyPhoto[],
) {
  if (photos.length === 0) return [] as string[];
  const intents = await accountAdapter.createAsyncCaseUploadIntents({
    actorUserId: authUserId,
    caseId,
    captureSessionId: `follow_up_${Date.now()}`,
    captureKind: "follow_up",
    bodyArea: detail.case.bodyArea,
    conditionKey: detail.case.conditionKey,
    files: photos.map((photo) => ({
      fileName: photo.file.name,
      contentType: photo.file.type || "image/jpeg",
    })),
  });
  const assetIds: string[] = [];
  for (const [index, photo] of photos.entries()) {
    const intent = intents[index];
    if (!intent) continue;
    const isMockUpload = intent.uploadUrl.startsWith("mock");
    if (!isMockUpload) {
      const response = await fetch(intent.uploadUrl, {
        method: intent.uploadMethod,
        headers: { "Content-Type": intent.contentType },
        body: photo.file,
      });
      if (!response.ok) {
        throw new Error("Impossible de téléverser la photo de réponse.");
      }
    }
    const asset = await accountAdapter.completeAsyncCaseMediaUpload(authUserId, intent.id);
    assetIds.push(asset.id);
  }
  return assetIds;
}

export default function PatientTeledermCaseDetailScreen() {
  const { caseId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<AsyncCaseDetailRecord | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyPhotos, setReplyPhotos] = useState<ReplyPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.user || !caseId) return;
    auth.accountAdapter.getAsyncCase(auth.user.id, caseId).then(setDetail);
  }, [auth.accountAdapter, auth.user, caseId]);

  useEffect(() => {
    return () => {
      replyPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
    };
  }, [replyPhotos]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleReply() {
    if (!auth.user || !detail) return;
    setReplyError(null);
    setIsSubmitting(true);
    try {
      const mediaAssetIds = await uploadReplyPhotos(
        auth.user.id,
        detail.case.id,
        auth.accountAdapter,
        detail,
        replyPhotos,
      );
      const nextDetail = await auth.accountAdapter.replyToAsyncCase({
        actorUserId: auth.user.id,
        caseId: detail.case.id,
        body: replyBody,
        mediaAssetIds,
      });
      setDetail(nextDetail);
      setReplyBody("");
      replyPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
      setReplyPhotos([]);
    } catch (error) {
      setReplyError(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer votre réponse pour le moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderMediaGrid(items: MediaAssetRecord[]) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((asset) => (
          <div
            key={asset.id}
            className="overflow-hidden rounded-[1.25rem] border border-[#111214]/6 bg-[#111214]/[0.03]"
          >
            <div className="aspect-[4/3] bg-[#FEF0D5]/80">
              {asset.downloadUrl ? (
                <img src={asset.downloadUrl} alt={asset.fileName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#111214]/38">
                  Photo en attente
                </div>
              )}
            </div>
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-[#111214]">
                {asset.captureKind ? (CAPTURE_KIND_LABELS[asset.captureKind] ?? asset.captureKind) : "Photo"}
              </p>
              <p className="mt-1 text-xs text-[#111214]/50">{asset.fileName}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!detail) {
    return (
      <DashboardLayout fullName={auth.user?.fullName ?? "Patient"} onLogout={handleLogout}>
        <div className="rounded-[2rem] bg-white/80 p-8 text-center text-sm text-[#111214]/58">
          Chargement du dossier télé-derm...
        </div>
      </DashboardLayout>
    );
  }

  const statusStyle = TELEDERM_STATUS_STYLES[detail.case.status];
  const StatusIcon = statusStyle.icon;
  const progressSteps = buildPatientProgress(detail);

  return (
    <DashboardLayout fullName={auth.user?.fullName ?? "Patient"} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.tone}`}>
              <StatusIcon size={12} />
              {TELEDERM_STATUS_LABELS[detail.case.status]}
            </span>
            <span className="text-[11px] uppercase tracking-[0.16em] text-white/36">
              {detail.case.bodyArea ?? "Zone non précisée"}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            {detail.case.patientSummary || "Cas télé-derm"}
          </h1>
          <p className="mt-4 text-sm text-white/66">
            Dernière activité {formatTeledermDate(detail.case.latestMessageAt ?? detail.case.updatedAt)}
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Progression du dossier
              </p>
              <p className="mt-2 text-sm text-[#111214]/58">
                Suivez chaque étape du traitement asynchrone de votre cas.
              </p>
            </div>
            {detail.case.slaDueAt ? (
              <span className="rounded-full bg-[#FEF0D5] px-3 py-1 text-xs font-medium text-[#111214]/62">
                Réponse estimée avant le {formatTeledermDate(detail.case.slaDueAt)}
              </span>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {progressSteps.map((step) => (
              <div
                key={step.key}
                className={`rounded-[1.5rem] border px-4 py-4 ${
                  step.state === "current"
                    ? "border-[#5B1112]/18 bg-[#5B1112]/[0.04]"
                    : step.state === "completed"
                      ? "border-emerald-200 bg-emerald-50/70"
                      : "border-[#111214]/6 bg-[#111214]/[0.02]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${
                      step.state === "current"
                        ? "bg-[#5B1112] text-white"
                        : step.state === "completed"
                          ? "bg-emerald-600 text-white"
                          : "bg-[#111214]/6 text-[#111214]/32"
                    }`}
                  >
                    {step.state === "completed" ? (
                      <CheckCircle2 size={16} />
                    ) : step.state === "current" ? (
                      <Clock3 size={16} />
                    ) : (
                      <Circle size={14} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#111214]">{step.label}</p>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/32">
                        {step.state === "completed"
                          ? "Terminé"
                          : step.state === "current"
                            ? "En cours"
                            : "À venir"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-[#111214]/58">{step.description}</p>
                    {step.occurredAt ? (
                      <p className="mt-2 text-xs text-[#111214]/42">
                        {formatTeledermDate(step.occurredAt)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Photos du cas
              </p>
              <div className="mt-5">
                {renderMediaGrid(detail.mediaAssets)}
              </div>
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
                        {message.authorRole === "practitioner"
                          ? "Dermatologue"
                          : message.authorRole === "system"
                            ? "Système"
                            : "Patient"}
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

            {detail.comparisonGroups.length > 0 ? (
              <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                  Comparaison chronologique
                </p>
                <div className="mt-5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-3">
                    {detail.comparisonGroups[0].mediaAssets.map((asset) => (
                      <div key={asset.id} className="w-44 flex-shrink-0">
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
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Sorties cliniques
              </p>
              <div className="mt-5 space-y-3">
                {detail.documents.length === 0 ? (
                  <p className="text-sm text-[#111214]/58">
                    Les documents apparaîtront ici dès qu&apos;une réponse sera publiée.
                  </p>
                ) : (
                  detail.documents.map((document) => (
                    <Link
                      key={document.id}
                      to={`/patient-flow/auth/dashboard/documents/${document.id}`}
                      className="flex items-center justify-between rounded-[1.25rem] bg-[#FEF0D5]/55 px-4 py-3 text-sm font-medium text-[#111214]"
                    >
                      <span>{document.title}</span>
                      <ArrowRight size={15} className="text-[#5B1112]" />
                    </Link>
                  ))
                )}
              </div>
            </div>

            {detail.case.status === "waiting_for_patient" ? (
              <div className="rounded-[2rem] border border-[#5B1112]/10 bg-white/90 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="flex items-center gap-2 text-[#5B1112]">
                  <MessageCircleMore size={18} />
                  <p className="text-sm font-semibold">Répondre au dermatologue</p>
                </div>
                <textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  rows={4}
                  className="mt-4 w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                  placeholder="Apportez les précisions demandées..."
                />
                <label className="mt-4 block rounded-[1rem] border border-dashed border-[#111214]/12 px-4 py-4 text-sm text-[#111214]/56">
                  Ajouter des photos complémentaires
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="mt-3 block w-full text-xs"
                    onChange={(event) => {
                      replyPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
                      const files = Array.from(event.target.files ?? []).slice(0, 4).map((file) => ({
                        id: `${file.name}_${Date.now()}`,
                        file,
                        url: URL.createObjectURL(file),
                      }));
                      setReplyPhotos(files);
                    }}
                  />
                </label>
                {replyPhotos.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {replyPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="overflow-hidden rounded-[1rem] border border-[#111214]/8 bg-[#111214]/[0.03]"
                      >
                        <div className="aspect-[4/3] bg-[#FEF0D5]/70">
                          <img src={photo.url} alt={photo.file.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="px-3 py-2 text-xs text-[#111214]/54">{photo.file.name}</div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {replyError ? (
                  <div className="mt-4 rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {replyError}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleReply()}
                  disabled={isSubmitting || replyBody.trim().length < 4}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Envoi..." : "Envoyer la réponse"}
                  <Send size={15} />
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
