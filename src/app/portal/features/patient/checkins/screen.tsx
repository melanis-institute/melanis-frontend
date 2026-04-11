import type {
  CheckInSubmissionRecord,
  EducationProgramRecord,
} from "@portal/domains/account/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { ArrowRight, ClipboardList, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

interface CheckInPhotoDraft {
  file: File;
  previewUrl: string;
}

function parseMeasurements(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((part) => part.trim()))
    .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
    .map(([label, value, unit = ""]) => ({ label, value, unit }));
}

export default function PatientCheckInsScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [programs, setPrograms] = useState<EducationProgramRecord[]>([]);
  const [checkIns, setCheckIns] = useState<CheckInSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(
    searchParams.get("enrollmentId") ?? "",
  );
  const [symptomLevel, setSymptomLevel] = useState("stable");
  const [routineAdherence, setRoutineAdherence] = useState("bonne");
  const [sleepImpact, setSleepImpact] = useState("faible");
  const [note, setNote] = useState("");
  const [measurementText, setMeasurementText] = useState("");
  const [photos, setPhotos] = useState<CheckInPhotoDraft[]>([]);

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setLoading(true);
    });
    Promise.all([
      auth.accountAdapter.listEducationPrograms(auth.user.id, auth.actingProfileId),
      auth.accountAdapter.listCheckIns(
        auth.user.id,
        auth.actingProfileId,
        searchParams.get("enrollmentId") ?? undefined,
      ),
    ])
      .then(([programItems, checkInItems]) => {
        if (!active) return;
        setPrograms(programItems);
        setCheckIns(checkInItems);
        if (!selectedEnrollmentId && programItems[0]?.enrollment?.id) {
          setSelectedEnrollmentId(programItems[0].enrollment.id);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    auth.accountAdapter,
    auth.actingProfileId,
    auth.user,
    searchParams,
    selectedEnrollmentId,
  ]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  const fullName = auth.user?.fullName ?? "Patient";
  const selectedProgram = useMemo(
    () =>
      programs.find((program) => program.enrollment?.id === selectedEnrollmentId),
    [programs, selectedEnrollmentId],
  );

  const handleSubmit = async () => {
    if (!auth.user || !auth.actingProfileId || !selectedEnrollmentId) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const intents =
        photos.length > 0
          ? await auth.accountAdapter.createMediaUploadIntents({
              actorUserId: auth.user.id,
              profileId: auth.actingProfileId,
              files: photos.map((photo) => ({
                fileName: photo.file.name,
                contentType: photo.file.type || "application/octet-stream",
              })),
            })
          : [];
      const mediaAssetIds: string[] = [];
      for (const [index, photo] of photos.entries()) {
        const intent = intents[index];
        if (!intent) throw new Error("Intent de téléversement manquant.");
        const isMockUpload = intent.uploadUrl.startsWith("mock://");
        if (!isMockUpload) {
          const uploadResponse = await fetch(intent.uploadUrl, {
            method: intent.uploadMethod,
            headers: {
              "Content-Type": intent.contentType,
            },
            body: photo.file,
          });
          if (!uploadResponse.ok) {
            throw new Error("Impossible de téléverser les photos du check-in.");
          }
        }
        const asset = await auth.accountAdapter.completeMediaUpload({
          actorUserId: auth.user.id,
          assetId: intent.id,
        });
        mediaAssetIds.push(asset.id);
      }

      const created = await auth.accountAdapter.submitCheckIn({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        enrollmentId: selectedEnrollmentId,
        questionnaireData: {
          symptomLevel,
          routineAdherence,
          sleepImpact,
          note,
        },
        measurements: parseMeasurements(measurementText),
        mediaAssetIds,
      });
      setCheckIns((prev) => [created, ...prev]);
      setFeedback("Check-in enregistré avec succès.");
      setNote("");
      setMeasurementText("");
      for (const photo of photos) {
        URL.revokeObjectURL(photo.previewUrl);
      }
      setPhotos([]);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Impossible d'enregistrer le check-in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-6">
        <section className="rounded-[2rem] bg-[#111214] p-6 text-white shadow-[0_18px_48px_rgba(17,18,20,0.18)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/42">
            Check-ins chroniques
          </p>
          <h1 className="mt-3 font-serif text-[2rem] leading-none">
            Faites le point en moins de deux minutes.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/68">
            Un check-in rapide aide votre praticien à suivre l'évolution réelle de votre peau entre deux échanges.
          </p>
        </section>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <ClipboardList size={17} className="text-[#5B1112]" />
              <h2 className="font-serif text-[1.5rem] text-[#111214]">
                Nouveau check-in
              </h2>
            </div>

            {loading ? (
              <div className="mt-5 rounded-[1.25rem] bg-[#111214]/[0.03] px-4 py-8 text-center text-sm text-[#111214]/56">
                Chargement...
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-[#111214]/68">Programme</span>
                  <select
                    value={selectedEnrollmentId}
                    onChange={(event) => setSelectedEnrollmentId(event.currentTarget.value)}
                    className="mt-1.5 w-full rounded-xl border border-[#111214]/10 bg-white px-3 py-2.5 text-sm text-[#111214]"
                  >
                    <option value="">Sélectionner un programme</option>
                    {programs.map((program) => (
                      <option key={program.id} value={program.enrollment?.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                </label>

                {[
                  {
                    label: "Évolution des symptômes",
                    value: symptomLevel,
                    setValue: setSymptomLevel,
                    options: ["stable", "en amélioration", "en aggravation"],
                  },
                  {
                    label: "Régularité de la routine",
                    value: routineAdherence,
                    setValue: setRoutineAdherence,
                    options: ["bonne", "irrégulière", "difficile"],
                  },
                  {
                    label: "Impact sur le confort / sommeil",
                    value: sleepImpact,
                    setValue: setSleepImpact,
                    options: ["faible", "modéré", "important"],
                  },
                ].map((field) => (
                  <label key={field.label} className="block">
                    <span className="text-xs font-medium text-[#111214]/68">{field.label}</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.options.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.setValue(option)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            field.value === option
                              ? "bg-[#5B1112] text-white"
                              : "border border-[#111214]/10 bg-white text-[#111214]/62"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </label>
                ))}

                <label className="block">
                  <span className="text-xs font-medium text-[#111214]/68">Note libre</span>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.currentTarget.value)}
                    rows={4}
                    placeholder="Décrivez en une phrase ce qui a changé cette semaine."
                    className="mt-1.5 w-full rounded-xl border border-[#111214]/10 bg-white px-3 py-2.5 text-sm text-[#111214]"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#111214]/68">Mesures optionnelles</span>
                  <textarea
                    value={measurementText}
                    onChange={(event) => setMeasurementText(event.currentTarget.value)}
                    rows={3}
                    placeholder={"Ex. : Hydratation | 62 | %\nRougeur | 3 | /10"}
                    className="mt-1.5 w-full rounded-xl border border-[#111214]/10 bg-white px-3 py-2.5 text-sm text-[#111214]"
                  />
                  <p className="mt-1 text-[11px] text-[#111214]/42">
                    Une ligne par mesure, au format libellé | valeur | unité.
                  </p>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-[#111214]/68">Photos optionnelles</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => {
                      const nextFiles = Array.from(event.currentTarget.files ?? []).slice(0, 4);
                      for (const photo of photos) {
                        URL.revokeObjectURL(photo.previewUrl);
                      }
                      setPhotos(
                        nextFiles.map((file) => ({
                          file,
                          previewUrl: URL.createObjectURL(file),
                        })),
                      );
                    }}
                    className="mt-1.5 block w-full rounded-xl border border-[#111214]/10 bg-white px-3 py-2.5 text-sm text-[#111214]"
                  />
                  {photos.length > 0 ? (
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      {photos.map((photo) => (
                        <div key={photo.previewUrl} className="overflow-hidden rounded-[1rem] border border-[#111214]/8">
                          <img
                            src={photo.previewUrl}
                            alt={photo.file.name}
                            className="h-28 w-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </label>

                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!selectedEnrollmentId || submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
                >
                  <Send size={15} />
                  {submitting ? "Enregistrement..." : "Envoyer mon check-in"}
                </button>
                {selectedProgram ? (
                  <Link
                    to={`/patient-flow/auth/programs/${selectedProgram.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#5B1112]"
                  >
                    Revenir au programme
                    <ArrowRight size={14} />
                  </Link>
                ) : null}
                {feedback ? <p className="text-sm text-[#111214]/64">{feedback}</p> : null}
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/70 bg-white/82 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)] backdrop-blur-xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#111214]/35">
              Historique
            </p>
            <h2 className="mt-2 font-serif text-[1.5rem] text-[#111214]">
              Derniers check-ins
            </h2>
            <div className="mt-5 space-y-3">
              {checkIns.length === 0 ? (
                <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 px-4 py-10 text-center text-sm text-[#111214]/56">
                  Aucun check-in enregistré pour le moment.
                </div>
              ) : (
                checkIns.map((item) => (
                  <div key={item.id} className="relative rounded-[1.5rem] border border-[#111214]/6 bg-[#111214]/[0.02] p-4 pl-6">
                    <div className="absolute bottom-4 left-3 top-4 w-px bg-[#111214]/10" />
                    <div className="absolute left-[7px] top-5 h-3 w-3 rounded-full bg-[#5B1112]" />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[#111214]">
                          {new Date(item.submittedAt).toLocaleString("fr-FR")}
                        </p>
                        <p className="mt-1 text-sm text-[#111214]/58">
                          {Object.entries(item.questionnaireData)
                            .map(([key, value]) => `${key} : ${String(value)}`)
                            .join(" · ")}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {item.measurements.length > 0 ? (
                            <span className="rounded-full bg-[#FEF0D5] px-3 py-1 text-xs font-medium text-[#111214]/68">
                              {item.measurements.length} mesure{item.measurements.length > 1 ? "s" : ""}
                            </span>
                          ) : null}
                          {item.mediaAssetIds.length > 0 ? (
                            <span className="rounded-full bg-[#E9F1F7] px-3 py-1 text-xs font-medium text-[#00415E]">
                              {item.mediaAssetIds.length} photo{item.mediaAssetIds.length > 1 ? "s" : ""}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
