import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, LockKeyhole, RotateCcw } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import {
  ErrorSummary,
  FieldLabel,
  HelperText,
  PhoneCaption,
  PrimaryButton,
  SecondaryButton,
  TextInput,
} from "../../components/auth/AuthPrimitives";
import { AuthAdapterError } from "../../auth/adapter";
import {
  clearAuthDraft,
  clearPendingAuthState,
  loadPendingAuthState,
  savePendingAuthState,
} from "../../auth/flow";
import { useAuth } from "../../auth/useAuth";
import { isValidPin, mapAuthErrorToMessage } from "../../auth/validation";

type PinMode = "setup" | "login" | "reset";

type PinRouteState = {
  phoneE164?: string;
  tempToken?: string;
};

function parseMode(value: string | null): PinMode {
  if (value === "setup" || value === "reset") return value;
  return "login";
}

export default function AUPin() {
  const [searchParams] = useSearchParams();
  const mode = parseMode(searchParams.get("mode"));
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();

  const state = (location.state ?? {}) as PinRouteState;
  const pending = loadPendingAuthState();

  const phoneE164 = useMemo(
    () => state.phoneE164 ?? pending?.phoneE164 ?? auth.user?.phoneE164 ?? null,
    [state.phoneE164, pending?.phoneE164, auth.user?.phoneE164]
  );
  const tempToken = state.tempToken ?? pending?.tempToken;

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pinInput = pin.replace(/\D/g, "").slice(0, 4);
  const confirmPinInput = confirmPin.replace(/\D/g, "").slice(0, 4);

  const requireConfirmation = mode === "setup" || mode === "reset";

  const canSubmit = useMemo(() => {
    if (!isValidPin(pinInput)) return false;
    if (!requireConfirmation) return true;
    return isValidPin(confirmPinInput) && pinInput === confirmPinInput;
  }, [pinInput, confirmPinInput, requireConfirmation]);

  const runSubmit = async () => {
    if (!phoneE164) {
      setError("Numéro manquant. Reprenez la connexion.");
      return;
    }

    if (!isValidPin(pinInput)) {
      setError("Le PIN doit contenir exactement 4 chiffres.");
      return;
    }

    if (requireConfirmation && pinInput !== confirmPinInput) {
      setError("Les deux PIN ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (mode === "login") {
        const session = await auth.adapter.loginWithPin({
          phoneE164,
          pin: pinInput,
          trustedDevice: true,
        });

        await auth.login(session);
        clearPendingAuthState();
        navigate(auth.resolvePostAuthRoute(), { replace: true });
        return;
      }

      if (mode === "setup") {
        if (!auth.isAuthenticated) {
          navigate("/patient-flow/auth/connexion", { replace: true });
          return;
        }

        await auth.adapter.setPin({
          phoneE164,
          pin: pinInput,
        });

        clearPendingAuthState();
        navigate(auth.resolvePostAuthRoute(), { replace: true });
        return;
      }

      if (!tempToken) {
        setError("Session de réinitialisation expirée. Recommencez.");
        return;
      }

      await auth.adapter.resetPin({
        tempToken,
        phoneE164,
        newPin: pinInput,
      });

      clearAuthDraft("recovery");
      clearPendingAuthState();

      navigate("/patient-flow/auth/connexion", {
        replace: true,
        state: {
          prefillPhone: phoneE164.replace("+221", ""),
          resetSuccess: true,
        },
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de valider le PIN.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fallbackToOtp = async () => {
    if (!phoneE164) {
      navigate("/patient-flow/auth/connexion", { replace: true });
      return;
    }

    try {
      const challenge = await auth.adapter.requestOtp({
        phoneE164,
        purpose: "login",
      });

      const pendingState = {
        purpose: "login" as const,
        challengeId: challenge.challengeId,
        phoneE164,
        createdAt: Date.now(),
      };

      savePendingAuthState(pendingState);

      navigate("/patient-flow/auth/verification?mode=login", {
        state: pendingState,
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible d'activer la connexion OTP.");
      }
    }
  };

  const titleByMode: Record<PinMode, string> = {
    setup: "Créer un PIN (optionnel)",
    login: "Se connecter avec PIN",
    reset: "Nouveau PIN",
  };

  const subtitleByMode: Record<PinMode, string> = {
    setup: "Ajoutez un PIN 4 chiffres pour les prochaines connexions rapides.",
    login: "Entrez votre PIN 4 chiffres. Sinon, vous pouvez repasser par OTP.",
    reset: "Définissez un nouveau PIN après la vérification OTP.",
  };

  return (
    <AuthLayout
      panelTagline={"PIN\n4 chiffres"}
      panelSubtitle="Simple, rapide, et toujours avec OTP en secours."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="space-y-2"
      >
        <h1 className="text-[30px] text-[#111214]" style={{ fontWeight: 600, letterSpacing: "-0.02em" }}>
          {titleByMode[mode]}
        </h1>
        <p className="text-[14px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
          {subtitleByMode[mode]}
        </p>
        {phoneE164 ? <PhoneCaption phoneE164={phoneE164} /> : null}
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.04, ease: "easeOut" }}
        className="mt-6 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void runSubmit();
        }}
      >
        <div>
          <FieldLabel htmlFor="pin-input">PIN (4 chiffres)</FieldLabel>
          <TextInput
            id="pin-input"
            value={pinInput}
            onChange={(value) => {
              setPin(value.replace(/\D/g, "").slice(0, 4));
              if (error) setError(null);
            }}
            placeholder="0000"
            inputMode="numeric"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            maxLength={4}
            hasError={Boolean(error)}
          />
        </div>

        {requireConfirmation ? (
          <div>
            <FieldLabel htmlFor="pin-confirm">Confirmer le PIN</FieldLabel>
            <TextInput
              id="pin-confirm"
              value={confirmPinInput}
              onChange={(value) => {
                setConfirmPin(value.replace(/\D/g, "").slice(0, 4));
                if (error) setError(null);
              }}
              placeholder="0000"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              hasError={Boolean(error)}
            />
          </div>
        ) : null}

        <ErrorSummary message={error} />

        <PrimaryButton type="submit" disabled={!canSubmit} loading={loading}>
          <span className="inline-flex items-center gap-2">
            {mode === "login" ? "Se connecter" : "Continuer"}
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </span>
        </PrimaryButton>

        {mode === "setup" ? (
          <SecondaryButton
            onClick={() => {
              if (!auth.isAuthenticated) {
                navigate("/patient-flow/auth/connexion", { replace: true });
                return;
              }

              navigate(auth.resolvePostAuthRoute(), { replace: true });
            }}
          >
            Passer pour l'instant
          </SecondaryButton>
        ) : null}

        {mode === "login" ? (
          <SecondaryButton onClick={() => void fallbackToOtp()}>
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="h-[14px] w-[14px]" strokeWidth={1.9} />
              Utiliser OTP à la place
            </span>
          </SecondaryButton>
        ) : null}

        <HelperText>
          {mode === "reset"
            ? "Après validation, vous pourrez vous reconnecter avec ce nouveau PIN."
            : "Votre PIN n'est jamais stocké en clair (hash sécurisé en mode mock)."}
        </HelperText>

        <div className="flex items-center gap-2 rounded-[12px] border border-[rgba(17,18,20,0.1)] bg-white px-3 py-2 text-[12px] text-[rgba(17,18,20,0.58)]">
          <LockKeyhole className="h-[13px] w-[13px] text-[#00415E]" strokeWidth={1.8} />
          <span style={{ fontWeight: 500 }}>Utilisez uniquement des chiffres. Minimum 44px de cible tactile respecté.</span>
        </div>
      </motion.form>
    </AuthLayout>
  );
}
