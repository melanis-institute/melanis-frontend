import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, KeyRound, MessageSquareMore } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import {
  Divider,
  ErrorSummary,
  FieldLabel,
  HelperText,
  PhoneInput221,
  PrimaryButton,
  SecondaryButton,
  SocialButtons,
} from "../../components/auth/AuthPrimitives";
import { savePendingAuthState, toFlowContext } from "../../auth/flow";
import { useAuth } from "../../auth/useAuth";
import { mapAuthErrorToMessage, normalizePhone221, toE164, isValidPhone221 } from "../../auth/validation";
import { AuthAdapterError } from "../../auth/adapter";

type LocationState = {
  prefillPhone?: string;
  socialProvider?: "google" | "facebook";
  flowContext?: unknown;
  resetSuccess?: boolean;
};

export default function AU02() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { flowContext, setFlowContext } = auth;
  const state = (location.state ?? {}) as LocationState;

  const incomingFlow = useMemo(
    () => toFlowContext(state.flowContext) ?? flowContext,
    [state.flowContext, flowContext]
  );

  useEffect(() => {
    if (!incomingFlow) return;

    const current = JSON.stringify(flowContext ?? {});
    const next = JSON.stringify(incomingFlow);
    if (current !== next) {
      setFlowContext(incomingFlow);
    }
  }, [incomingFlow, flowContext, setFlowContext]);

  const [phone, setPhone] = useState(state.prefillPhone ?? "");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingPin, setLoadingPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceed = useMemo(() => {
    return isValidPhone221(normalizePhone221(phone));
  }, [phone]);

  const goToVerification = async () => {
    setError(null);

    const localPhone = normalizePhone221(phone);
    if (!isValidPhone221(localPhone)) {
      setError("Saisissez un numéro sénégalais valide (format 77 123 45 67).");
      return;
    }

    const phoneE164 = toE164(localPhone);

    try {
      setLoadingOtp(true);
      const challenge = await auth.adapter.requestOtp({
        phoneE164,
        purpose: "login",
      });

      const pending = {
        purpose: "login" as const,
        challengeId: challenge.challengeId,
        phoneE164,
        createdAt: Date.now(),
        socialProvider: state.socialProvider,
      };

      savePendingAuthState(pending);

      navigate("/patient-flow/auth/verification?mode=login", {
        state: pending,
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible d'envoyer le code OTP. Réessayez.");
      }
    } finally {
      setLoadingOtp(false);
    }
  };

  const goToPin = async () => {
    setError(null);

    const localPhone = normalizePhone221(phone);
    if (!isValidPhone221(localPhone)) {
      setError("Saisissez un numéro valide pour utiliser le PIN.");
      return;
    }

    const phoneE164 = toE164(localPhone);

    try {
      setLoadingPin(true);
      const user = await auth.adapter.getUserByPhone(phoneE164);

      if (!user) {
        setError("Ce numéro n'est pas encore inscrit. Créez votre compte.");
        return;
      }

      if (!user.hasPin) {
        setError("Aucun PIN configuré. Utilisez OTP pour vous connecter.");
        return;
      }

      navigate("/patient-flow/auth/pin?mode=login", {
        state: { phoneE164 },
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Connexion PIN indisponible pour le moment.");
      }
    } finally {
      setLoadingPin(false);
    }
  };

  const toSignup = () => {
    navigate("/patient-flow/auth/inscription", {
      state: {
        prefillPhone: normalizePhone221(phone),
        flowContext: incomingFlow,
      },
    });
  };

  return (
    <AuthLayout
      panelTagline={"Connexion\npar numéro"}
      panelSubtitle="Un code OTP en quelques secondes, puis PIN en option."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          Connexion
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          Saisissez votre numéro pour recevoir un code OTP.
        </p>

        {state.socialProvider ? (
          <div className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(0,65,94,0.15)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[#00415E]">
            <MessageSquareMore className="h-[13px] w-[13px]" strokeWidth={1.9} />
            <span style={{ fontWeight: 500 }}>
              Encore une étape: vérifiez votre numéro pour finaliser avec {state.socialProvider}.
            </span>
          </div>
        ) : null}

        {state.resetSuccess ? (
          <div className="inline-flex rounded-[12px] border border-[rgba(0,65,94,0.18)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[#00415E]" style={{ fontWeight: 500 }}>
            PIN mis à jour. Connectez-vous avec ce numéro.
          </div>
        ) : null}
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.05, ease: "easeOut" }}
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void goToVerification();
        }}
      >
        <div>
          <FieldLabel htmlFor="login-phone">Numéro de téléphone</FieldLabel>
          <PhoneInput221
            id="login-phone"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (error) setError(null);
            }}
            hasError={Boolean(error)}
          />
          <HelperText>Un SMS OTP sera envoyé sur ce numéro.</HelperText>
        </div>

        <ErrorSummary message={error} />

        <PrimaryButton type="submit" disabled={!canProceed} loading={loadingOtp}>
          <span className="inline-flex items-center gap-2">
            Recevoir un code OTP
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </span>
        </PrimaryButton>

        <SecondaryButton onClick={() => void goToPin()} disabled={!canProceed || loadingPin}>
          <span className="inline-flex items-center gap-2">
            <KeyRound className="h-[15px] w-[15px]" strokeWidth={1.9} />
            {loadingPin ? "Vérification..." : "Se connecter avec PIN"}
          </span>
        </SecondaryButton>
      </motion.form>

      <Divider />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.09, ease: "easeOut" }}
        className="space-y-3"
      >
        <SocialButtons
          onGoogle={() =>
            navigate("/patient-flow/auth/connexion", {
              state: { ...state, socialProvider: "google", flowContext: incomingFlow },
            })
          }
          onFacebook={() =>
            navigate("/patient-flow/auth/connexion", {
              state: { ...state, socialProvider: "facebook", flowContext: incomingFlow },
            })
          }
        />

        <p className="text-center text-[13px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 500 }}>
          Pas encore de compte?{" "}
          <button
            onClick={toSignup}
            className="text-[#00415E] underline underline-offset-2"
            style={{ fontWeight: 500 }}
          >
            Créer mon compte
          </button>
        </p>

        <p className="text-center text-[13px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 500 }}>
          PIN oublié?{" "}
          <button
            onClick={() =>
              navigate("/patient-flow/auth/mot-de-passe-oublie", {
                state: {
                  prefillPhone: normalizePhone221(phone),
                  flowContext: incomingFlow,
                },
              })
            }
            className="text-[#00415E] underline underline-offset-2"
            style={{ fontWeight: 500 }}
          >
            Réinitialiser par OTP
          </button>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
