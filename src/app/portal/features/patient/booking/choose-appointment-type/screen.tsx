import { Stethoscope, Video } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { HeaderBack } from "@portal/shared/components/HeaderBack";
import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import { OptionCard } from "@portal/shared/components/OptionCard";
import { PageLayout } from "@portal/shared/layouts/PageLayout";
import { PersistentContextBar } from "@portal/shared/components/PersistentContextBar";
import { QuestionBubble } from "@portal/shared/components/QuestionBubble";
import { StepIndicator } from "@portal/shared/components/StepIndicator";
import { relationshipToLabel } from "@portal/domains/account/labels";
import { useAuth } from "@portal/session/useAuth";

type AppointmentType = "presentiel" | "video";

export default function PF01() {
  const [selected, setSelected] = useState<AppointmentType | null>(null);
  const navigate = useNavigate();
  const auth = useAuth();
  const effectiveProfileId = auth.actingProfileId ?? auth.profiles[0]?.id ?? null;
  const effectiveProfile = auth.actingProfile ?? auth.profiles[0] ?? null;
  const profileOptions = auth.profiles.map((profile) => ({
    id: profile.id,
    label: `${profile.firstName} ${profile.lastName} (${relationshipToLabel(profile.relationship)})`,
  }));

  const handleContinue = async () => {
    if (selected) {
      if (!effectiveProfileId) {
        navigate("/patient-flow/account/select-profile", {
          state: { returnTo: "/patient-flow" },
        });
        return;
      }

      if (auth.actingProfileId !== effectiveProfileId) {
        await auth.setActingProfile(effectiveProfileId);
      }

      navigate("/patient-flow/creneau", {
        state: {
          appointmentType: selected,
          actingProfileId: effectiveProfileId,
          actingRelationship: effectiveProfile?.relationship,
        },
      });
    }
  };

  return (
    <PageLayout>
      <div className="pf-page flex flex-col h-full">
        {/* Header row */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pf-header flex items-center justify-between px-4 md:px-8 pt-2 md:pt-6"
        >
          <HeaderBack onBack={() => window.history.back()} />
          <StepIndicator current={1} total={5} />
          <div className="w-[44px]" aria-hidden="true" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.03, ease: "easeOut" }}
          className="px-5 md:px-8 mt-2 md:mt-3"
        >
          <PersistentContextBar
            profileId={effectiveProfileId}
            profileOptions={profileOptions}
            profileLabel={
              effectiveProfile
                ? `${effectiveProfile.firstName} ${effectiveProfile.lastName}`
                : null
            }
            onProfileChange={(profileId) => {
              void auth.setActingProfile(profileId);
            }}
            appointmentType={selected}
          />
        </motion.div>

        <div className="pf-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-4 md:pb-5">
          {/* Mascot + Question Bubble */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
            className="flex items-center mt-5 md:mt-6 lg:mt-8 pl-5 pr-0 md:pl-8 md:pr-2"
          >
            <div className="flex-1 mr-2 overflow-visible">
              <QuestionBubble
                title="Choisir le type de rendez-vous"
                subtitle="Sélectionnez le format qui vous convient."
                tailSide="right"
              />
            </div>
            <div className="pf-mascot flex-shrink-0 -mr-2.5 md:mr-2">
              <MelaniaMascot size={68} />
            </div>
          </motion.div>

          {/* Option Cards */}
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 mt-6 md:mt-7 lg:mt-9 px-5 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: "easeOut" }}
              className="sm:flex-1"
            >
              <OptionCard
                icon={
                  <Stethoscope
                    className="w-[22px] h-[22px]"
                    strokeWidth={1.6}
                  />
                }
                title="Présentiel"
                description="Au cabinet, pour un examen dermatologique."
                selected={selected === "presentiel"}
                onSelect={() => setSelected("presentiel")}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}
              className="sm:flex-1"
            >
              <OptionCard
                icon={<Video className="w-[22px] h-[22px]" strokeWidth={1.6} />}
                title="Vidéo consultation"
                description="À distance."
                selected={selected === "video"}
                onSelect={() => setSelected("video")}
              />
            </motion.div>
          </div>
        </div>

        {/* Continue button */}
        <div
          className="pf-cta shrink-0 px-5 md:px-8 pb-2"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          }}
        >
          <motion.button
            initial={false}
            animate={{
              opacity: selected ? 1 : 0,
              y: selected ? 0 : 12,
              pointerEvents: selected ? "auto" : "none",
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={() => void handleContinue()}
            className="
              pf-primary-cta
              w-full h-[52px] rounded-[16px] text-white text-[16px] tracking-[-0.2px]
              transition-colors duration-200 cursor-pointer active:scale-[0.98]
            "
            style={{
              background: selected
                ? "linear-gradient(135deg, #5B1112 0%, #6A1D1F 100%)"
                : "#5B1112",
              boxShadow:
                "0 2px 8px rgba(91, 17, 18, 0.2), 0 1px 3px rgba(17, 18, 20, 0.06)",
              fontWeight: 600,
            }}
          >
            Continuer
          </motion.button>
        </div>

        {/* Home indicator (mobile only) */}
        <div className="flex justify-center pb-2 pt-3 md:pt-2 md:pb-4">
          <div className="w-[134px] h-[5px] bg-[rgba(17,18,20,0.12)] rounded-full md:hidden" />
        </div>
      </div>
    </PageLayout>
  );
}
