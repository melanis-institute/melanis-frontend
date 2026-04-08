import { useEffect, useState } from "react";
import type { AccountAdapter } from "@portal/domains/account/adapter.types";
import type { AsyncCaseDetailRecord, MediaAssetRecord } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { Link, useNavigate, useParams } from "react-router";
import { TELEDERM_STATUS_LABELS, TELEDERM_STATUS_STYLES, formatTeledermDate } from "@portal/features/telederm/shared";
import { ArrowRight, MessageCircleMore, Send } from "lucide-react";

type ReplyPhoto = {
  id: string;
  file: File;
  url: string;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
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
        body: dataUrlToBlob(photo.url),
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

  useEffect(() => {
    if (!auth.user || !caseId) return;
    auth.accountAdapter.getAsyncCase(auth.user.id, caseId).then(setDetail);
  }, [auth.accountAdapter, auth.user, caseId]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleReply() {
    if (!auth.user || !detail) return;
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
      setReplyPhotos([]);
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
              <p className="text-sm font-medium text-[#111214]">{asset.captureKind ?? "photo"}</p>
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
                      const files = Array.from(event.target.files ?? []).map((file) => ({
                        id: `${file.name}_${Date.now()}`,
                        file,
                        url: URL.createObjectURL(file),
                      }));
                      setReplyPhotos(files);
                    }}
                  />
                </label>
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
