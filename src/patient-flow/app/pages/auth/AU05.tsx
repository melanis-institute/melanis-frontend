import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Baby, Heart, User, UserCircle2 } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { PrimaryButton } from "../../components/auth/AuthPrimitives";
import { toFlowContext } from "../../auth/flow";
import { useAuth } from "../../auth/useAuth";
import { formatPhoneE164ToReadable } from "../../auth/validation";

type ProfileOption = {
  key: "moi" | "enfant" | "proche";
  title: string;
  subtitle: string;
  icon: typeof User;
};

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    key: "moi",
    title: "Pour moi",
    subtitle: "Consultation personnelle",
    icon: User,
  },
  {
    key: "enfant",
    title: "Mon enfant",
    subtitle: "Consultation pédiatrique",
    icon: Baby,
  },
  {
    key: "proche",
    title: "Un proche",
    subtitle: "Consultation pour un tiers",
    icon: Heart,
  },
];

export default function AU05() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const locationFlow = useMemo(() => toFlowContext(location.state), [location.state]);

  const [selectedProfile, setSelectedProfile] = useState<"moi" | "enfant" | "proche">(
    (auth.flowContext?.patientProfile as "moi" | "enfant" | "proche") ?? "moi"
  );

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
      return;
    }

    if (locationFlow) {
      const current = JSON.stringify(auth.flowContext ?? {});
      const next = JSON.stringify(locationFlow);
      if (current !== next) {
        auth.setFlowContext(locationFlow);
      }
    }
  }, [auth, navigate, locationFlow]);

  const handleContinue = () => {
    const effectiveFlow = locationFlow ?? auth.flowContext;

    if (!effectiveFlow) {
      navigate("/patient-flow/auth/dashboard", { replace: true });
      return;
    }

    const returnTo = typeof effectiveFlow.returnTo === "string"
      ? effectiveFlow.returnTo
      : "/patient-flow/confirmation-succes";

    auth.clearBookingFlowContext();

    navigate(returnTo, {
      state: {
        ...effectiveFlow,
        patientProfile: selectedProfile,
      },
    });
  };

  return (
    <AuthLayout
      panelTagline={"Agir pour\nquel patient ?"}
      panelSubtitle="Ce choix est conservé pour finaliser votre rendez-vous."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          Profil patient
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          Sélectionnez pour qui vous prenez ce rendez-vous.
        </p>
      </motion.div>

      {auth.user ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: 0.04, ease: "easeOut" }}
          className="mt-5 rounded-[14px] border border-[rgba(17,18,20,0.1)] bg-white px-3.5 py-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[rgba(0,65,94,0.08)]">
              <UserCircle2 className="h-[18px] w-[18px] text-[#00415E]" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[14px] text-[#111214]" style={{ fontWeight: 600 }}>
                {auth.user.fullName}
              </p>
              <p className="text-[12px] text-[rgba(17,18,20,0.55)]" style={{ fontWeight: 500 }}>
                {formatPhoneE164ToReadable(auth.user.phoneE164)}
              </p>
            </div>
          </div>
        </motion.div>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.07, ease: "easeOut" }}
        className="mt-5 space-y-3"
      >
        {PROFILE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const selected = selectedProfile === option.key;

          return (
            <button
              key={option.key}
              onClick={() => setSelectedProfile(option.key)}
              className="w-full rounded-[16px] border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
              style={{
                borderColor: selected ? "rgba(91,17,18,0.26)" : "rgba(17,18,20,0.12)",
                background: selected ? "rgba(91,17,18,0.08)" : "white",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[11px] bg-[rgba(254,240,213,0.75)]">
                  <Icon
                    className="h-[16px] w-[16px]"
                    style={{ color: selected ? "#5B1112" : "rgba(17,18,20,0.6)" }}
                    strokeWidth={1.8}
                  />
                </div>
                <div>
                  <p className="text-[14px] text-[#111214]" style={{ fontWeight: 600 }}>
                    {option.title}
                  </p>
                  <p className="text-[12px] text-[rgba(17,18,20,0.55)]" style={{ fontWeight: 500 }}>
                    {option.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1, ease: "easeOut" }}
        className="mt-6"
      >
        <PrimaryButton onClick={handleContinue}>Continuer</PrimaryButton>
      </motion.div>
    </AuthLayout>
  );
}
