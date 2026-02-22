import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import {
  ErrorSummary,
  HelperText,
  PhoneCaption,
  PrimaryButton,
  SecondaryButton,
} from "../../components/auth/AuthPrimitives";
import { AuthAdapterError } from "../../auth/adapter";
import { clearAuthDraft, clearPendingAuthState, loadPendingAuthState, savePendingAuthState } from "../../auth/flow";
import { getMockOtpChallenge, getMockOtpCode } from "../../auth/mockAuthAdapter";
import type { PendingAuthState } from "../../auth/types";
import { useAuth } from "../../auth/useAuth";
import { mapAuthErrorToMessage } from "../../auth/validation";

type VerificationMode = "login" | "signup" | "reset_pin";

function parseMode(value: string | null): VerificationMode {
  if (value === "signup" || value === "reset_pin") return value;
  return "login";
}

export default function AUVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const mode = parseMode(searchParams.get("mode"));

  const statePending = (location.state ?? null) as PendingAuthState | null;
  const initialPending = useMemo(() => {
    if (statePending?.challengeId) return statePending;
    return loadPendingAuthState();
  }, [statePending]);

  const [pending, setPending] = useState<PendingAuthState | null>(initialPending);
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expiryLeft, setExpiryLeft] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!pending) {
      navigate("/patient-flow/auth/connexion", { replace: true });
      return;
    }

    if (pending.purpose !== mode) {
      setError("Le contexte de vérification ne correspond plus. Recommencez.");
    }

    setDebugCode(getMockOtpCode(pending.challengeId));

    const challenge = getMockOtpChallenge(pending.challengeId);
    if (!challenge) {
      setError("Le code OTP n'est plus disponible. Demandez-en un nouveau.");
      return;
    }

    const tick = () => {
      const resendAt = Date.parse(challenge.resendAt);
      const expiresAt = Date.parse(challenge.expiresAt);
      setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
      setExpiryLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [pending, mode, navigate]);

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  const updateDigit = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace") return;

    if (digits[index]) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    event.preventDefault();
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((char, index) => {
      next[index] = char;
    });
    setDigits(next);

    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const submit = async () => {
    if (!pending) return;

    const code = digits.join("");
    if (code.length !== 6) {
      setError("Saisissez le code OTP complet à 6 chiffres.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const verification = await auth.adapter.verifyOtp({
        challengeId: pending.challengeId,
        code,
      });

      const nextPending: PendingAuthState = {
        ...pending,
        tempToken: verification.tempToken,
        createdAt: Date.now(),
      };
      savePendingAuthState(nextPending);
      setPending(nextPending);

      if (mode === "login") {
        if (!verification.userExists) {
          navigate("/patient-flow/auth/inscription", {
            state: {
              prefillPhone: pending.phoneE164.replace("+221", ""),
            },
          });
          return;
        }

        const user = await auth.adapter.getUserByPhone(pending.phoneE164);
        const session = await auth.adapter.completeOtpLogin({
          tempToken: verification.tempToken,
          phoneE164: pending.phoneE164,
          trustedDevice: true,
        });

        await auth.login(session);
        clearPendingAuthState();

        if (user?.hasPin) {
          navigate(auth.resolvePostAuthRoute(), { replace: true });
          return;
        }

        navigate("/patient-flow/auth/pin?mode=setup", {
          state: {
            phoneE164: pending.phoneE164,
          },
        });
        return;
      }

      if (mode === "signup") {
        if (verification.userExists) {
          navigate("/patient-flow/auth/connexion", {
            state: {
              prefillPhone: pending.phoneE164.replace("+221", ""),
            },
          });
          return;
        }

        await auth.adapter.createAccount({
          tempToken: verification.tempToken,
          fullName: pending.fullName ?? "Nouveau patient",
          phoneE164: pending.phoneE164,
          countryCode: "+221",
          email: pending.email,
          termsAccepted: Boolean(pending.termsAccepted),
        });

        const session = await auth.adapter.completeOtpLogin({
          tempToken: verification.tempToken,
          phoneE164: pending.phoneE164,
          trustedDevice: true,
        });

        await auth.login(session);
        clearAuthDraft("signup");
        clearPendingAuthState();

        navigate("/patient-flow/auth/pin?mode=setup", {
          state: {
            phoneE164: pending.phoneE164,
          },
        });
        return;
      }

      navigate("/patient-flow/auth/pin?mode=reset", {
        state: {
          phoneE164: pending.phoneE164,
          tempToken: verification.tempToken,
        },
      });
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de vérifier le code OTP.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!pending) return;

    try {
      setResending(true);
      setError(null);

      const challenge = await auth.adapter.requestOtp({
        phoneE164: pending.phoneE164,
        purpose: mode,
        forceNew: true,
      });

      const nextPending = {
        ...pending,
        challengeId: challenge.challengeId,
        createdAt: Date.now(),
      };

      setPending(nextPending);
      savePendingAuthState(nextPending);
      setDigits(["", "", "", "", "", ""]);
      setDebugCode(getMockOtpCode(challenge.challengeId));
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de renvoyer le code OTP.");
      }
    } finally {
      setResending(false);
    }
  };

  const titleByMode: Record<VerificationMode, string> = {
    login: "Vérification OTP",
    signup: "Vérifier votre numéro",
    reset_pin: "Sécurité de réinitialisation",
  };

  const subtitleByMode: Record<VerificationMode, string> = {
    login: "Entrez le code reçu par SMS pour vous connecter.",
    signup: "Entrez le code reçu pour créer votre compte.",
    reset_pin: "Entrez le code reçu pour définir un nouveau PIN.",
  };

  return (
    <AuthLayout
      panelTagline={"Code OTP\nà 6 chiffres"}
      panelSubtitle="Saisie rapide, contrôle des erreurs, et reprise sans perte de données."
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
        {pending ? <PhoneCaption phoneE164={pending.phoneE164} /> : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, delay: 0.04, ease: "easeOut" }}
        className="mt-6 space-y-3"
      >
        <div onPaste={handlePaste} className="flex items-center justify-between gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => {
                updateDigit(index, event.target.value.slice(-1));
                if (error) setError(null);
              }}
              onKeyDown={(event) => handleBackspace(index, event)}
              inputMode="numeric"
              aria-label={`Chiffre ${index + 1} du code OTP`}
              className="h-[52px] w-[52px] rounded-[14px] border border-[rgba(17,18,20,0.14)] bg-white text-center text-[20px] text-[#111214] outline-none transition focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]"
              style={{ fontWeight: 600 }}
            />
          ))}
        </div>

        <div className="flex items-center justify-between text-[12px] text-[rgba(17,18,20,0.55)]" style={{ fontWeight: 500 }}>
          <span>Expire dans {expiryLeft > 0 ? `${expiryLeft}s` : "0s"}</span>
          <span>Renvoi dans {secondsLeft > 0 ? `${secondsLeft}s` : "0s"}</span>
        </div>

        {debugCode ? (
          <HelperText>Mode démo: utilisez le code {debugCode}</HelperText>
        ) : null}

        <div ref={errorRef}>
          <ErrorSummary message={error} />
        </div>

        <PrimaryButton onClick={() => void submit()} loading={loading}>
          <span className="inline-flex items-center gap-2">
            Vérifier le code
            <ArrowRight className="h-[15px] w-[15px]" strokeWidth={2} />
          </span>
        </PrimaryButton>

        <SecondaryButton onClick={() => void resend()} disabled={secondsLeft > 0 || resending || expiryLeft <= 0}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className={`h-[14px] w-[14px] ${resending ? "animate-spin" : ""}`} strokeWidth={1.9} />
            Renvoyer un code
          </span>
        </SecondaryButton>
      </motion.div>
    </AuthLayout>
  );
}
