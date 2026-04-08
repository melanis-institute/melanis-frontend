import { useEffect, useMemo, useState } from "react";
import type { AccountAdapter } from "@portal/domains/account/adapter.types";
import type { MediaUploadIntent } from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { StepPhotos } from "@portal/features/patient/preconsult/components/StepPhotos";
import { ArrowRight, CheckCircle2, SaveAll } from "lucide-react";
import { useNavigate } from "react-router";

type LocalPhoto = {
  id: string;
  url: string;
  name: string;
  file: File;
};

const MOTIF_OPTIONS = [
  ["acne", "Acné"],
  ["taches", "Taches pigmentaires"],
  ["eczema", "Eczéma / irritation"],
  ["rougeurs", "Rougeurs"],
  ["grain", "Grain de beauté"],
  ["mycose", "Mycose"],
  ["cheveux", "Chute de cheveux / cuir chevelu"],
] as const;

const BODY_AREAS = [
  "Visage",
  "Cuir chevelu",
  "Corps",
  "Mains",
  "Pieds",
  "Ongles",
  "Zones intimes",
] as const;

function randomPhotoId() {
  return `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] ?? "application/octet-stream";
  const binary = atob(data);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new Blob([bytes], { type: mimeType });
}

async function uploadFiles(
  accountAdapter: AccountAdapter,
  actorUserId: string,
  caseId: string,
  bodyArea: string,
  conditionKey: string,
  captureKind: "close" | "context" | "detail",
  photos: LocalPhoto[],
) {
  if (photos.length === 0) return [] as string[];
  const captureSessionId = `${captureKind}_${Date.now()}`;
  const intents = await accountAdapter.createAsyncCaseUploadIntents({
    actorUserId,
    caseId,
    captureSessionId,
    captureKind,
    bodyArea,
    conditionKey,
    files: photos.map((photo) => ({
      fileName: photo.name,
      contentType: photo.file.type || "image/jpeg",
    })),
  });

  const uploadedAssetIds: string[] = [];
  for (const [index, photo] of photos.entries()) {
    const intent = intents[index] as MediaUploadIntent | undefined;
    if (!intent) continue;
    const isMockUpload = intent.uploadUrl.startsWith("mock");
    if (!isMockUpload) {
      const uploadResponse = await fetch(intent.uploadUrl, {
        method: intent.uploadMethod,
        headers: { "Content-Type": intent.contentType },
        body: dataUrlToBlob(photo.url),
      });
      if (!uploadResponse.ok) {
        throw new Error("Impossible de téléverser une photo télé-derm.");
      }
    }
    const asset = await accountAdapter.completeAsyncCaseMediaUpload(actorUserId, intent.id);
    uploadedAssetIds.push(asset.id);
  }
  return uploadedAssetIds;
}

export default function PatientTeledermComposeScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState<string | null>(null);
  const [conditionKey, setConditionKey] = useState<string>("acne");
  const [bodyArea, setBodyArea] = useState<string>("Visage");
  const [patientSummary, setPatientSummary] = useState("");
  const [duration, setDuration] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [contextNotes, setContextNotes] = useState("");
  const [closePhotos, setClosePhotos] = useState<LocalPhoto[]>([]);
  const [contextPhotos, setContextPhotos] = useState<LocalPhoto[]>([]);
  const [detailPhotos, setDetailPhotos] = useState<LocalPhoto[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState("Initialisation du brouillon...");
  const fullName = auth.user?.fullName ?? "Patient";

  const questionnaireData = useMemo(
    () => ({
      duration,
      symptoms,
      contextNotes,
      selectedBodyAreas: [bodyArea],
      motif: conditionKey,
    }),
    [bodyArea, conditionKey, contextNotes, duration, symptoms],
  );

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId || draftId) return;
    let mounted = true;
    auth.accountAdapter
      .createAsyncCase({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        conditionKey,
        bodyArea,
        patientSummary,
        questionnaireData,
      })
      .then((draft) => {
        if (!mounted) return;
        setDraftId(draft.id);
        setSaveState("Brouillon prêt");
      });
    return () => {
      mounted = false;
    };
  }, [
    auth.accountAdapter,
    auth.actingProfileId,
    auth.user,
    bodyArea,
    conditionKey,
    draftId,
    patientSummary,
    questionnaireData,
  ]);

  useEffect(() => {
    if (!auth.user || !draftId) return;
    const timeout = window.setTimeout(() => {
      setIsSaving(true);
      auth.accountAdapter
        .updateAsyncCase({
          actorUserId: auth.user!.id,
          caseId: draftId,
          conditionKey,
          bodyArea,
          patientSummary,
          questionnaireData,
        })
        .then(() => setSaveState("Modifications enregistrées"))
        .finally(() => setIsSaving(false));
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [
    auth.accountAdapter,
    auth.user,
    bodyArea,
    conditionKey,
    draftId,
    patientSummary,
    questionnaireData,
  ]);

  function addPhotos(
    setter: React.Dispatch<React.SetStateAction<LocalPhoto[]>>,
    files: FileList,
  ) {
    const next = Array.from(files).map((file) => ({
      id: randomPhotoId(),
      url: URL.createObjectURL(file),
      name: file.name,
      file,
    }));
    setter((current) => [...current, ...next].slice(0, 4));
  }

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleSubmit() {
    if (!auth.user || !draftId) return;
    setIsSubmitting(true);
    try {
      const closeAssetIds = await uploadFiles(
        auth.accountAdapter,
        auth.user.id,
        draftId,
        bodyArea,
        conditionKey,
        "close",
        closePhotos,
      );
      const contextAssetIds = await uploadFiles(
        auth.accountAdapter,
        auth.user.id,
        draftId,
        bodyArea,
        conditionKey,
        "context",
        contextPhotos,
      );
      await uploadFiles(
        auth.accountAdapter,
        auth.user.id,
        draftId,
        bodyArea,
        conditionKey,
        "detail",
        detailPhotos,
      );
      await auth.accountAdapter.updateAsyncCase({
        actorUserId: auth.user.id,
        caseId: draftId,
        conditionKey,
        bodyArea,
        patientSummary,
        questionnaireData,
      });
      await auth.accountAdapter.submitAsyncCase({
        actorUserId: auth.user.id,
        caseId: draftId,
        message: `${patientSummary}\nPhotos jointes: ${closeAssetIds.length + contextAssetIds.length + detailPhotos.length}`,
      });
      navigate(`/patient-flow/auth/telederm/cases/${draftId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
            Nouveau cas télé-derm
          </p>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            Questionnaire, photos guidées, puis envoi au dermatologue.
          </h1>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/68">
            <SaveAll size={15} />
            {isSaving ? "Enregistrement..." : saveState}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Questionnaire
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#111214]/78">Motif principal</span>
                  <select
                    value={conditionKey}
                    onChange={(event) => setConditionKey(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/45 px-4 py-3 text-sm outline-none"
                  >
                    {MOTIF_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#111214]/78">Zone concernée</span>
                  <select
                    value={bodyArea}
                    onChange={(event) => setBodyArea(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/45 px-4 py-3 text-sm outline-none"
                  >
                    {BODY_AREAS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#111214]/78">Expliquez le problème</span>
                  <textarea
                    value={patientSummary}
                    onChange={(event) => setPatientSummary(event.target.value)}
                    rows={4}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Depuis quand ? Qu'est-ce qui vous inquiète ?"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#111214]/78">Depuis quand ?</span>
                  <input
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Ex. 3 semaines"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-[#111214]/78">Symptômes associés</span>
                  <input
                    value={symptoms}
                    onChange={(event) => setSymptoms(event.target.value)}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Démangeaisons, douleur, suintement..."
                  />
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-[#111214]/78">Contexte utile</span>
                  <textarea
                    value={contextNotes}
                    onChange={(event) => setContextNotes(event.target.value)}
                    rows={3}
                    className="w-full rounded-[1rem] border border-[#111214]/8 bg-[#FEF0D5]/35 px-4 py-3 text-sm outline-none"
                    placeholder="Produits utilisés, évolution, facteur déclenchant..."
                  />
                </label>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
                Photos guidées
              </p>
              <div className="mt-5 space-y-8">
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-[#111214]">1. Photo de près</h2>
                  <StepPhotos
                    photos={closePhotos}
                    appointmentType="video"
                    motif={conditionKey}
                    zones={[bodyArea]}
                    onAddPhotos={(files) => addPhotos(setClosePhotos, files)}
                    onRemovePhoto={(photoId) =>
                      setClosePhotos((current) => current.filter((item) => item.id !== photoId))
                    }
                  />
                </div>
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-[#111214]">2. Photo de contexte</h2>
                  <StepPhotos
                    photos={contextPhotos}
                    appointmentType="video"
                    motif={conditionKey}
                    zones={[bodyArea]}
                    onAddPhotos={(files) => addPhotos(setContextPhotos, files)}
                    onRemovePhoto={(photoId) =>
                      setContextPhotos((current) => current.filter((item) => item.id !== photoId))
                    }
                  />
                </div>
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-[#111214]">3. Détails optionnels</h2>
                  <StepPhotos
                    photos={detailPhotos}
                    appointmentType="presentiel"
                    motif={conditionKey}
                    zones={[bodyArea]}
                    onAddPhotos={(files) => addPhotos(setDetailPhotos, files)}
                    onRemovePhoto={(photoId) =>
                      setDetailPhotos((current) => current.filter((item) => item.id !== photoId))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-fit rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Relecture
            </p>
            <h2 className="mt-2 font-serif text-[1.6rem] text-[#111214]">
              Prêt à envoyer
            </h2>
            <div className="mt-5 space-y-3 rounded-[1.5rem] bg-[#FEF0D5]/60 p-4">
              {[
                ["Motif", conditionKey],
                ["Zone", bodyArea],
                ["Résumé", patientSummary || "À compléter"],
                ["Photos", `${closePhotos.length + contextPhotos.length + detailPhotos.length} fichier(s)`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4">
                  <span className="text-xs uppercase tracking-[0.16em] text-[#111214]/36">{label}</span>
                  <span className="text-right text-sm text-[#111214]/72">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.25rem] border border-[#5B1112]/12 bg-[#5B1112]/[0.04] p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 text-[#5B1112]" size={18} />
                <p className="text-sm leading-6 text-[#111214]/66">
                  Pour soumettre le cas, il faut au minimum une photo de près et
                  une photo de contexte.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting || !draftId || closePhotos.length === 0 || contextPhotos.length === 0 || patientSummary.trim().length < 10}
              onClick={() => void handleSubmit()}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Envoi..." : "Envoyer au dermatologue"}
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
