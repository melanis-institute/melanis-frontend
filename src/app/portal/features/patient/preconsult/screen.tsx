import { AlertTriangle, Save } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { HeaderBack } from "@portal/shared/components/HeaderBack";
import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import { PageLayout } from "@portal/shared/layouts/PageLayout";
import { PersistentContextBar } from "@portal/shared/components/PersistentContextBar";
import { StepHistorique } from "./components/StepHistorique";
import { StepIntro } from "./components/StepIntro";
import { StepLocalisation } from "./components/StepLocalisation";
import { StepMotif } from "./components/StepMotif";
import { StepObjectifs } from "./components/StepObjectifs";
import { StepPeau } from "./components/StepPeau";
import { StepPhotos } from "./components/StepPhotos";
import { StepRecap } from "./components/StepRecap";
import { StepSymptomes } from "./components/StepSymptomes";
import { SubStepProgress } from "./components/SubStepProgress";
import type { PreConsultData } from "./components/types";
import { TOTAL_SUBSTEPS } from "./components/types";
import { usePersistedPreConsult } from "./components/usePersistedPreConsult";
import { QuestionBubble } from "@portal/shared/components/QuestionBubble";
import { StepIndicator } from "@portal/shared/components/StepIndicator";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

type RoutePractitioner = {
  displayName?: string;
  name?: string;
};

const STEP_META: Record<number, { title: string; subtitle?: string }> = {
  1: {
    title: "Quel est le motif de votre consultation ?",
    subtitle: "Sélectionnez ce qui correspond le mieux.",
  },
  2: {
    title: "Où est le problème ?",
    subtitle: "Sélectionnez une ou plusieurs zones.",
  },
  3: {
    title: "Décrivez vos symptômes",
    subtitle: "Sélectionnez tout ce qui s'applique.",
  },
  4: {
    title: "Votre historique médical",
    subtitle: "Quelques questions rapides.",
  },
  5: {
    title: "Votre type de peau",
    subtitle: "Aide à personnaliser le diagnostic.",
  },
  6: {
    title: "Ajoutez des photos",
    subtitle: "Pour aider le dermatologue.",
  },
  7: {
    title: "Vos attentes",
    subtitle: "Qu'attendez-vous de cette consultation ?",
  },
  8: {
    title: "Vérifiez vos réponses",
    subtitle: "Tout est modifiable avant validation.",
  },
};

const VALIDATION_MESSAGES: Record<number, string> = {
  1: "Choisissez un motif de consultation pour continuer.",
  2: "Sélectionnez au moins une zone concernée.",
  3: "Renseignez les symptômes et la durée pour continuer.",
  5: "Indiquez si votre peau est sensible.",
  7: "Sélectionnez au moins un objectif de consultation.",
  8: "Vérifiez votre récapitulatif pour finaliser.",
};

const STAGE_MAP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 2,
  4: 3,
  5: 3,
  6: 4,
  7: 5,
  8: 5,
};

function formatDateLabel(date?: string) {
  if (!date) return "À définir";
  const parsed = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(parsed);
}

function formatRelativeSavedLabel(savedAt: number | null, now: number) {
  if (!savedAt) return "Brouillon non enregistré";
  const diffSeconds = Math.max(0, Math.floor((now - savedAt) / 1000));
  if (diffSeconds < 60) {
    return `Brouillon enregistré il y a ${diffSeconds} sec`;
  }
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Brouillon enregistré il y a ${diffMinutes} min`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  return `Brouillon enregistré il y a ${diffHours} h`;
}

function getRemainingEstimate(stage: number) {
  if (stage >= 5) return "moins d'1 min";
  return `${Math.max(1, 5 - stage)} min restantes`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Impossible de lire le fichier"));
    };
    reader.onerror = () => reject(new Error("Impossible de lire le fichier"));
    reader.readAsDataURL(file);
  });
}

export default function PF03() {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const routeState = useMemo(
    () =>
      (location.state ?? {}) as {
        appointmentType?: "presentiel" | "video";
        date?: string;
        time?: string;
        practitioner?: RoutePractitioner;
        actingProfileId?: string;
        actingRelationship?: "moi" | "enfant" | "proche";
      },
    [location.state],
  );

  const appointmentType = routeState.appointmentType ?? "presentiel";
  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));

  const {
    data,
    setData,
    updateData: persistedUpdate,
    updateSubStep,
    hasDraft,
    lastSavedAt,
    restoredStep,
    clearDraft,
  } = usePersistedPreConsult();

  const [subStep, setSubStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showDraftBanner, setShowDraftBanner] = useState(
    hasDraft && restoredStep > 0,
  );
  const [showValidationError, setShowValidationError] = useState(false);
  const [now, setNow] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lastSavedAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [lastSavedAt]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [subStep]);

  const updateData = useCallback(
    (patch: Partial<PreConsultData>) => {
      persistedUpdate(patch);
      if (showValidationError) setShowValidationError(false);
    },
    [persistedUpdate, showValidationError],
  );

  const toggleArray = useCallback(
    (field: keyof PreConsultData, value: string) => {
      setData((prev) => {
        const arr = prev[field] as string[];
        return {
          ...prev,
          [field]: arr.includes(value)
            ? arr.filter((entry) => entry !== value)
            : [...arr, value],
        };
      });
      if (showValidationError) setShowValidationError(false);
    },
    [setData, showValidationError],
  );

  const handleAddPhotos = useCallback(
    (files: FileList) => {
      void Promise.all(
        Array.from(files).map(async (file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          url: await readFileAsDataUrl(file),
          name: file.name,
          contentType: file.type || "application/octet-stream",
        })),
      ).then((newPhotos) => {
        setData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...newPhotos].slice(0, 4),
        }));
      });
    },
    [setData],
  );

  const handleRemovePhoto = useCallback(
    (id: string) => {
      setData((prev) => ({
        ...prev,
        photos: prev.photos.filter((photo) => photo.id !== id),
      }));
    },
    [setData],
  );

  const skipHistorique =
    data.intensite <= 2 && data.duree === "1w" && data.motif !== "grain";
  const skipPhotos =
    appointmentType === "presentiel" &&
    data.intensite <= 2 &&
    data.motif !== "grain" &&
    !data.zones.includes("Visage");

  const isStepSkipped = useCallback(
    (step: number) => {
      if (step === 4) return skipHistorique;
      if (step === 6) return skipPhotos;
      return false;
    },
    [skipHistorique, skipPhotos],
  );

  const visibleSubSteps = useMemo(
    () =>
      Array.from(
        { length: TOTAL_SUBSTEPS - 1 },
        (_, index) => index + 1,
      ).filter((step) => !isStepSkipped(step)),
    [isStepSkipped],
  );

  const canContinue = useMemo(() => {
    switch (subStep) {
      case 0:
        return true;
      case 1:
        return (
          data.motif !== null &&
          (data.motif !== "autre" || data.motifAutre.trim().length > 0)
        );
      case 2:
        return data.zones.length > 0;
      case 3:
        return data.symptomes.length > 0 && data.duree !== null;
      case 4:
        return true;
      case 5:
        return data.peauSensible !== null;
      case 6:
        return true;
      case 7:
        return data.objectifs.length > 0;
      case 8:
        return true;
      default:
        return false;
    }
  }, [subStep, data]);

  const getNextStep = useCallback(
    (fromStep: number) => {
      if (fromStep >= TOTAL_SUBSTEPS - 1) return TOTAL_SUBSTEPS - 1;
      let next = fromStep + 1;
      while (next < TOTAL_SUBSTEPS - 1 && isStepSkipped(next)) {
        next += 1;
      }
      return next;
    },
    [isStepSkipped],
  );

  const getPrevStep = useCallback(
    (fromStep: number) => {
      if (fromStep <= 0) return 0;
      let prev = fromStep - 1;
      while (prev > 0 && isStepSkipped(prev)) {
        prev -= 1;
      }
      return prev;
    },
    [isStepSkipped],
  );

  const goNext = useCallback(() => {
    if (subStep < TOTAL_SUBSTEPS - 1) {
      const nextStep = getNextStep(subStep);
      setDirection(1);
      setSubStep(nextStep);
      updateSubStep(nextStep);
      return;
    }

    clearDraft();
    navigate("/patient-flow/detail-confirmation", {
      state: {
        ...routeState,
        actingProfileId: auth.actingProfileId,
        actingRelationship: auth.actingProfile?.relationship,
        preConsultData: data,
      },
    });
  }, [
    subStep,
    getNextStep,
    updateSubStep,
    clearDraft,
    navigate,
    routeState,
    auth.actingProfile?.relationship,
    auth.actingProfileId,
    data,
  ]);

  const goBack = useCallback(() => {
    if (subStep > 0) {
      const prevStep = getPrevStep(subStep);
      setDirection(-1);
      setSubStep(prevStep);
      updateSubStep(prevStep);
      return;
    }
    navigate(-1);
  }, [subStep, getPrevStep, updateSubStep, navigate]);

  const goToStep = useCallback(
    (step: number) => {
      setDirection(step > subStep ? 1 : -1);
      setSubStep(step);
      updateSubStep(step);
      setShowValidationError(false);
    },
    [subStep, updateSubStep],
  );

  const handleSkip = useCallback(() => {
    navigate("/patient-flow/detail-confirmation", {
      state: {
        ...routeState,
        actingProfileId: auth.actingProfileId,
        actingRelationship: auth.actingProfile?.relationship,
        preConsultSkipped: true,
      },
    });
  }, [navigate, routeState, auth.actingProfileId, auth.actingProfile?.relationship]);

  const handleContinue = useCallback(() => {
    if (!canContinue) {
      setShowValidationError(true);
      return;
    }
    setShowValidationError(false);
    goNext();
  }, [canContinue, goNext]);

  const ctaLabel = useMemo(() => {
    if (subStep === 0) return "Commencer";
    if (subStep === TOTAL_SUBSTEPS - 1) return "Continuer";
    return "Suivant";
  }, [subStep]);

  const renderStepContent = () => {
    switch (subStep) {
      case 1:
        return (
          <StepMotif
            selected={data.motif}
            autreText={data.motifAutre}
            onSelect={(key) => updateData({ motif: key })}
            onAutreChange={(text) => updateData({ motifAutre: text })}
          />
        );
      case 2:
        return (
          <StepLocalisation
            selected={data.zones}
            onToggle={(zone) => toggleArray("zones", zone)}
          />
        );
      case 3:
        return (
          <StepSymptomes
            symptomes={data.symptomes}
            duree={data.duree}
            intensite={data.intensite}
            notesSymptomes={data.notesSymptomes}
            onToggleSymptome={(symptome) => toggleArray("symptomes", symptome)}
            onDureeChange={(duree) => updateData({ duree })}
            onIntensiteChange={(intensite) => updateData({ intensite })}
            onNotesChange={(notesSymptomes) => updateData({ notesSymptomes })}
          />
        );
      case 4:
        return <StepHistorique data={data} onUpdate={updateData} />;
      case 5:
        return (
          <StepPeau
            peauSensible={data.peauSensible}
            typePeau={data.typePeau}
            phototype={data.phototype}
            onSensibleChange={(peauSensible) => updateData({ peauSensible })}
            onTypeChange={(typePeau) => updateData({ typePeau })}
            onPhototypeChange={(phototype) => updateData({ phototype })}
          />
        );
      case 6:
        return (
          <StepPhotos
            photos={data.photos}
            appointmentType={appointmentType}
            motif={data.motif}
            zones={data.zones}
            onAddPhotos={handleAddPhotos}
            onRemovePhoto={handleRemovePhoto}
          />
        );
      case 7:
        return (
          <StepObjectifs
            objectifs={data.objectifs}
            preferences={data.preferences}
            notesObjectifs={data.notesObjectifs}
            motif={data.motif}
            onToggleObjectif={(objectif) => toggleArray("objectifs", objectif)}
            onTogglePreference={(preference) =>
              toggleArray("preferences", preference)
            }
            onNotesChange={(notesObjectifs) =>
              setData((prev) => ({ ...prev, notesObjectifs }))
            }
          />
        );
      case 8:
        return (
          <StepRecap
            data={data}
            onEdit={goToStep}
            practitionerName={practitionerName}
          />
        );
      default:
        return null;
    }
  };

  const slideVariants = {
    enter: (d: number) => ({
      x: d > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (d: number) => ({
      x: d > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  const meta = STEP_META[subStep] ?? STEP_META[1];
  const stage = STAGE_MAP[subStep] ?? 1;
  const draftLabel = formatRelativeSavedLabel(lastSavedAt, now);
  const validationMessage =
    VALIDATION_MESSAGES[subStep] ??
    "Complétez les informations requises pour continuer.";

  const dateLabel = formatDateLabel(routeState.date);
  const practitionerName =
    routeState.practitioner?.displayName ??
    routeState.practitioner?.name ??
    "Praticien";

  if (subStep === 0) {
    return (
      <PageLayout>
        <div className="pf-page flex flex-col h-full">
          <div className="shrink-0">
            <div className="px-5 pt-3">
              <PersistentContextBar
                profileId={auth.actingProfileId}
                profileLabel={
                  auth.actingProfile
                    ? `${auth.actingProfile.firstName} ${auth.actingProfile.lastName}`
                    : null
                }
                profileOptions={profileOptions}
                onProfileChange={(profileId) => {
                  void auth.setActingProfile(profileId);
                }}
                appointmentType={appointmentType}
                practitionerName={practitionerName}
                dateLabel={dateLabel}
                timeLabel={routeState.time ?? "À définir"}
              />
            </div>

            <AnimatePresence>
              {showDraftBanner && (
                <motion.div
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="px-5 pt-3"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(0, 65, 94, 0.04) 0%, rgba(254, 240, 213, 0.2) 100%)",
                      border: "1px solid rgba(0, 65, 94, 0.08)",
                    }}
                  >
                    <Save
                      className="w-[16px] h-[16px] text-[#00415E]/60 flex-shrink-0"
                      strokeWidth={1.7}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[13px] text-[#00415E]/70 tracking-[-0.1px]"
                        style={{ fontWeight: 560 }}
                      >
                        Reprendre le brouillon
                      </p>
                      <p
                        className="text-[11.5px] text-[#00415E]/45 mt-0.5"
                        style={{ fontWeight: 430 }}
                      >
                        {draftLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDraftBanner(false);
                        setDirection(1);
                        setSubStep(restoredStep);
                        updateSubStep(restoredStep);
                      }}
                      className="px-3 py-1.5 rounded-full text-[12px] cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
                      style={{
                        background: "rgba(0, 65, 94, 0.08)",
                        color: "#00415E",
                        fontWeight: 560,
                      }}
                    >
                      Reprendre
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1 min-h-0 pt-2">
            <StepIntro onStart={goNext} onSkip={handleSkip} />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="pf-page flex flex-col h-full">
        <div className="shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="pf-header flex items-center justify-between px-4 md:px-8 pt-2 md:pt-6"
          >
            <HeaderBack onBack={goBack} />
            <StepIndicator current={3} total={5} />
            <div className="w-[44px]" aria-hidden="true" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.04, ease: "easeOut" }}
            className="px-5 md:px-8 mt-2"
          >
            <PersistentContextBar
              profileId={auth.actingProfileId}
              profileLabel={
                auth.actingProfile
                  ? `${auth.actingProfile.firstName} ${auth.actingProfile.lastName}`
                  : null
              }
              profileOptions={profileOptions}
              onProfileChange={(profileId) => {
                void auth.setActingProfile(profileId);
              }}
              appointmentType={appointmentType}
              practitionerName={practitionerName}
              dateLabel={dateLabel}
              timeLabel={routeState.time ?? "À définir"}
            />
          </motion.div>

          <div className="px-5 md:px-8 mt-3">
            <SubStepProgress
              current={Math.max(1, visibleSubSteps.indexOf(subStep) + 1)}
              total={Math.max(1, visibleSubSteps.length)}
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p
                className="text-[11.5px] text-[rgba(17,18,20,0.45)]"
                style={{ fontWeight: 520 }}
              >
                Étape {stage}/5
              </p>
              <p
                className="text-[11.5px] text-[rgba(17,18,20,0.4)]"
                style={{ fontWeight: 500 }}
              >
                {getRemainingEstimate(stage)}
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="flex items-center mt-4 md:mt-5 pl-5 pr-0 md:pl-8 md:pr-2"
          >
            <div className="flex-1 mr-2 overflow-visible">
              <QuestionBubble
                title={meta.title}
                subtitle={meta.subtitle}
                tailSide="right"
              />
            </div>
            <div className="pf-mascot flex-shrink-0 -mr-2.5 md:mr-2">
              <MelaniaMascot size={62} />
            </div>
          </motion.div>

          {showValidationError && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-5 md:px-8 mt-3"
            >
              <div
                className="rounded-[14px] px-3.5 py-3 flex items-start gap-2.5"
                style={{
                  background: "rgba(91,17,18,0.08)",
                  border: "1px solid rgba(91,17,18,0.14)",
                }}
                role="alert"
                aria-live="polite"
              >
                <AlertTriangle
                  className="h-4 w-4 text-[#5B1112] mt-[1px]"
                  strokeWidth={1.9}
                />
                <p
                  className="text-[12.5px] text-[#5B1112]"
                  style={{ fontWeight: 520 }}
                >
                  {validationMessage}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div
          ref={scrollRef}
          className="pf-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-5 md:px-8 pt-5 pb-6 md:pb-8"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={subStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div
          className="pf-cta shrink-0 px-5 md:px-8 pt-3"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          }}
        >
          <motion.button
            initial={false}
            animate={{
              opacity: canContinue ? 1 : 0.74,
              scale: canContinue ? 1 : 0.99,
            }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={handleContinue}
            className={`
              pf-primary-cta
              w-full h-[52px] rounded-[16px] text-white text-[16px] tracking-[-0.2px]
              transition-all duration-200 cursor-pointer active:scale-[0.98]
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
            `}
            style={{
              background: canContinue
                ? "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)"
                : "#5B1112",
              boxShadow: canContinue
                ? "0 2px 8px rgba(91, 17, 18, 0.2), 0 1px 3px rgba(17, 18, 20, 0.06)"
                : "none",
              fontWeight: 600,
            }}
          >
            {ctaLabel}
          </motion.button>

          {/* {subStep > 0 && subStep < TOTAL_SUBSTEPS - 1 && (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 mt-2.5 py-2.5 text-[13px] text-[rgba(17,18,20,0.38)] hover:text-[rgba(17,18,20,0.55)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
                style={{ fontWeight: 500 }}
              >
                <Save className="w-[14px] h-[14px]" strokeWidth={1.6} />
                Sauvegarder et continuer plus tard
              </motion.button>
              <p
                className="mt-1.5 text-center text-[11.5px] text-[rgba(17,18,20,0.35)]"
                style={{ fontWeight: 500 }}
              >
                {draftLabel}
              </p>
            </>
          )} */}

          {subStep > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.34 }}
              onClick={handleSkip}
              className="w-full mt-1.5 py-2 text-[13px] text-[rgba(17,18,20,0.42)] hover:text-[rgba(17,18,20,0.62)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
              style={{ fontWeight: 520 }}
            >
              Passer la pré-consultation
            </motion.button>
          )}

          {showValidationError && (
            <p
              className="mt-1.5 text-center text-[12px] text-[#5B1112]"
              style={{ fontWeight: 520 }}
            >
              Vos réponses restent intactes, complétez simplement cette étape.
            </p>
          )}

          <div className="flex justify-center pt-1.5 md:hidden">
            <div className="w-[134px] h-[5px] bg-[rgba(17,18,20,0.12)] rounded-full" />
          </div>
        </div>
      </div>

    </PageLayout>
  );
}
