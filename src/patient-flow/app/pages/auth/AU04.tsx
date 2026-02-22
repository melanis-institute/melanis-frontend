import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Save } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import {
  ErrorSummary,
  FieldLabel,
  HelperText,
  PhoneInput221,
  PrimaryButton,
  SecondaryButton,
} from "../../components/auth/AuthPrimitives";
import {
  clearAuthDraft,
  formatDraftAge,
  loadAuthDraft,
  saveAuthDraft,
  savePendingAuthState,
  toFlowContext,
} from "../../auth/flow";
import { useAuth } from "../../auth/useAuth";
import { isValidPhone221, mapAuthErrorToMessage, normalizePhone221, toE164 } from "../../auth/validation";
import { AuthAdapterError } from "../../auth/adapter";

type LocationState = {
  prefillPhone?: string;
  resumeDraft?: boolean;
  flowContext?: unknown;
};

export default function AU04() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { flowContext, setFlowContext } = auth;
  const locationState = (location.state ?? {}) as LocationState;

  const [phone, setPhone] = useState(locationState.prefillPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const hasLoadedDraft = useRef(false);

  const incomingFlow = useMemo(
    () => toFlowContext(locationState.flowContext) ?? flowContext,
    [locationState.flowContext, flowContext]
  );

  useEffect(() => {
    if (!incomingFlow) return;

    const current = JSON.stringify(flowContext ?? {});
    const next = JSON.stringify(incomingFlow);
    if (current !== next) {
      setFlowContext(incomingFlow);
    }
  }, [incomingFlow, flowContext, setFlowContext]);

  useEffect(() => {
    if (hasLoadedDraft.current) return;

    const draft = loadAuthDraft("recovery");
    if (!draft) {
      hasLoadedDraft.current = true;
      return;
    }

    if (locationState.resumeDraft || !phone) {
      setPhone(String(draft.payload.phone ?? ""));
      setDraftSavedAt(draft.savedAt);
    }
    hasLoadedDraft.current = true;
  }, [locationState.resumeDraft, phone]);

  useEffect(() => {
    if (!phone) return;
    saveAuthDraft("recovery", { phone });
    setDraftSavedAt(Date.now());
  }, [phone]);

  const canSubmit = useMemo(() => isValidPhone221(normalizePhone221(phone)), [phone]);

  const handleSubmit = async () => {
    setError(null);

    const localPhone = normalizePhone221(phone);
    if (!isValidPhone221(localPhone)) {
      setError("Saisissez un numéro sénégalais valide.");
      return;
    }

    const phoneE164 = toE164(localPhone);

    try {
      setLoading(true);

      const challenge = await auth.adapter.requestOtp({
        phoneE164,
        purpose: "reset_pin",
      });

      const pending = {
        purpose: "reset_pin" as const,
        challengeId: challenge.challengeId,
        phoneE164,
        createdAt: Date.now(),
      };

      savePendingAuthState(pending);

      navigate("/patient-flow/auth/verification?mode=reset_pin", {
        state: pending,
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible d'envoyer le code OTP. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      panelTagline={"Réinitialiser\nmon PIN"}
      panelSubtitle="Vérifiez votre numéro avec OTP puis définissez un nouveau PIN."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          PIN oublié
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          Aucun email requis. Entrez votre numéro +221 et recevez un code OTP.
        </p>

        {draftSavedAt ? (
          <div className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(0,65,94,0.15)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[#00415E]">
            <Save className="h-[13px] w-[13px]" strokeWidth={1.9} />
            <span style={{ fontWeight: 500 }}>Brouillon enregistré il y a {formatDraftAge(draftSavedAt)}</span>
          </div>
        ) : null}
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.06, ease: "easeOut" }}
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <div>
          <FieldLabel htmlFor="recovery-phone">Numéro de téléphone</FieldLabel>
          <PhoneInput221
            id="recovery-phone"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (error) setError(null);
            }}
            hasError={Boolean(error)}
          />
          <HelperText>Un code OTP sera envoyé pour sécuriser la réinitialisation.</HelperText>
        </div>

        <ErrorSummary message={error} />

        <PrimaryButton type="submit" disabled={!canSubmit} loading={loading}>
          <span className="inline-flex items-center gap-2">
            Continuer
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </span>
        </PrimaryButton>

        <SecondaryButton
          onClick={() => {
            clearAuthDraft("recovery");
            setPhone("");
            setDraftSavedAt(null);
          }}
        >
          Effacer le brouillon
        </SecondaryButton>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.1, ease: "easeOut" }}
        className="mt-5"
      >
        <p className="text-center text-[13px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 500 }}>
          Retour à la connexion?{" "}
          <button
            onClick={() =>
              navigate("/patient-flow/auth/connexion", {
                state: {
                  prefillPhone: normalizePhone221(phone),
                  flowContext: incomingFlow,
                },
              })
            }
            className="text-[#00415E] underline underline-offset-2"
            style={{ fontWeight: 500 }}
          >
            Se connecter
          </button>
        </p>
      </motion.div>
    </AuthLayout>
  );
}
