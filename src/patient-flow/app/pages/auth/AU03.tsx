import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, Clock3, Save } from "lucide-react";
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
  TextInput,
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
import {
  isValidPhone221,
  mapAuthErrorToMessage,
  normalizePhone221,
  toE164,
} from "../../auth/validation";
import { AuthAdapterError } from "../../auth/adapter";

type LocationState = {
  prefillPhone?: string;
  resumeDraft?: boolean;
  flowContext?: unknown;
};

export default function AU03() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const { flowContext, setFlowContext } = auth;
  const locationState = (location.state ?? {}) as LocationState;

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState(locationState.prefillPhone ?? "");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

    const existingDraft = loadAuthDraft("signup");
    if (!existingDraft) {
      hasLoadedDraft.current = true;
      return;
    }

    if (
      locationState.resumeDraft ||
      (!fullName && !phone && !email && !acceptedTerms)
    ) {
      setFullName(String(existingDraft.payload.fullName ?? ""));
      setPhone(String(existingDraft.payload.phone ?? ""));
      setEmail(String(existingDraft.payload.email ?? ""));
      setAcceptedTerms(Boolean(existingDraft.payload.acceptedTerms));
      setDraftSavedAt(existingDraft.savedAt);
    }
    hasLoadedDraft.current = true;
  }, [locationState.resumeDraft, fullName, phone, email, acceptedTerms]);

  useEffect(() => {
    if (!fullName && !phone && !email && !acceptedTerms) {
      return;
    }

    saveAuthDraft("signup", {
      fullName,
      phone,
      email,
      acceptedTerms,
    });
    setDraftSavedAt(Date.now());
  }, [fullName, phone, email, acceptedTerms]);

  const canSubmit = useMemo(() => {
    const localPhone = normalizePhone221(phone);
    const validPhone = isValidPhone221(localPhone);
    const validName = fullName.trim().length >= 2;
    const validEmail = email.length === 0 || email.includes("@");

    return validPhone && validName && validEmail && acceptedTerms;
  }, [fullName, phone, email, acceptedTerms]);

  const handleSubmit = async () => {
    setError(null);

    const localPhone = normalizePhone221(phone);
    if (fullName.trim().length < 2) {
      setError("Ajoutez votre nom complet (2 caractères minimum).");
      return;
    }

    if (!isValidPhone221(localPhone)) {
      setError("Numéro invalide. Exemple attendu: 77 123 45 67.");
      return;
    }

    if (email && !email.includes("@")) {
      setError("L'adresse e-mail optionnelle est invalide.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions pour continuer.");
      return;
    }

    const phoneE164 = toE164(localPhone);

    try {
      setLoading(true);

      const challenge = await auth.adapter.requestOtp({
        phoneE164,
        purpose: "signup",
      });

      const pending = {
        purpose: "signup" as const,
        challengeId: challenge.challengeId,
        phoneE164,
        createdAt: Date.now(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        termsAccepted: true,
      };

      savePendingAuthState(pending);

      navigate("/patient-flow/auth/verification?mode=signup", {
        state: pending,
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de démarrer l'inscription. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const clearDraftAndForm = () => {
    clearAuthDraft("signup");
    setFullName("");
    setPhone("");
    setEmail("");
    setAcceptedTerms(false);
    setDraftSavedAt(null);
  };

  const draftLabel = draftSavedAt
    ? `Brouillon enregistré il y a ${formatDraftAge(draftSavedAt)}`
    : null;

  return (
    <AuthLayout
      panelTagline={"Inscription\nrapide"}
      panelSubtitle="Nom, numéro, et vous êtes prêt pour votre prochaine consultation."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          Créer mon compte
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          Identité minimale: nom, numéro et consentement.
        </p>

        {draftLabel ? (
          <div className="inline-flex items-center gap-2 rounded-[12px] border border-[rgba(0,65,94,0.15)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[#00415E]">
            <Save className="h-[13px] w-[13px]" strokeWidth={1.9} />
            <span style={{ fontWeight: 500 }}>{draftLabel}</span>
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
          <FieldLabel htmlFor="signup-full-name">Nom complet</FieldLabel>
          <TextInput
            id="signup-full-name"
            value={fullName}
            onChange={(value) => {
              setFullName(value);
              if (error) setError(null);
            }}
            placeholder="Prénom et nom"
            autoComplete="name"
            hasError={Boolean(error)}
          />
        </div>

        <div>
          <FieldLabel htmlFor="signup-phone">Numéro de téléphone</FieldLabel>
          <PhoneInput221
            id="signup-phone"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              if (error) setError(null);
            }}
            hasError={Boolean(error)}
          />
        </div>

        <div>
          <FieldLabel htmlFor="signup-email">Email (optionnel)</FieldLabel>
          <TextInput
            id="signup-email"
            value={email}
            onChange={(value) => {
              setEmail(value);
              if (error) setError(null);
            }}
            placeholder="nom@exemple.com"
            type="email"
            autoComplete="email"
            hasError={Boolean(error)}
          />
        </div>

        <label
          htmlFor="signup-terms"
          className="flex min-h-[44px] cursor-pointer items-start gap-2 rounded-[12px] border border-[rgba(17,18,20,0.1)] bg-white px-3 py-2.5"
        >
          <input
            id="signup-terms"
            type="checkbox"
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked);
              if (error) setError(null);
            }}
            className="mt-0.5 h-[16px] w-[16px] accent-[#5B1112]"
          />
          <span className="text-[13px] text-[rgba(17,18,20,0.7)]" style={{ fontWeight: 500 }}>
            J'accepte les conditions d'utilisation et la politique de confidentialité Melanis.
          </span>
        </label>

        <ErrorSummary message={error} />

        <PrimaryButton type="submit" disabled={!canSubmit} loading={loading}>
          <span className="inline-flex items-center gap-2">
            Continuer avec OTP
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </span>
        </PrimaryButton>

        <SecondaryButton onClick={clearDraftAndForm}>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-[15px] w-[15px]" strokeWidth={1.9} />
            Recommencer
          </span>
        </SecondaryButton>

        <HelperText>Après OTP, vous pourrez configurer un PIN 4 chiffres (optionnel).</HelperText>
      </motion.form>

      <Divider />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.12, ease: "easeOut" }}
        className="space-y-3"
      >
        <SocialButtons
          onGoogle={() =>
            navigate("/patient-flow/auth/connexion", {
              state: { socialProvider: "google", flowContext: incomingFlow },
            })
          }
          onFacebook={() =>
            navigate("/patient-flow/auth/connexion", {
              state: { socialProvider: "facebook", flowContext: incomingFlow },
            })
          }
        />

        <p className="text-center text-[13px] text-[rgba(17,18,20,0.45)]" style={{ fontWeight: 500 }}>
          Déjà inscrit?{" "}
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
