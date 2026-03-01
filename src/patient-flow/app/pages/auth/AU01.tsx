import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Baby,
  Bell,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  Loader2,
  LogOut,
  Pill,
  Sparkles,
  Stethoscope,
  ShieldCheck,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { AuthAdapterError } from "../../auth/adapter";
import {
  clearAuthDraft,
  clearPendingAuthState,
  getDraftStatuses,
  loadAuthDraft,
  loadPendingAuthState,
  resolvePostAuthRoute,
  saveAuthDraft,
  savePendingAuthState,
  toFlowContext,
} from "../../auth/flow";
import type { AuthFlowContext, AuthUser, OtpPurpose, PendingAuthState } from "../../auth/types";
import { useAuth } from "../../auth/useAuth";
import {
  formatPhoneE164ToReadable,
  isValidOtpCode,
  isValidPhone221,
  isValidPin,
  mapAuthErrorToMessage,
  normalizePhone221,
  toE164,
} from "../../auth/validation";
import type {
  AuthDraftStatuses,
  AuthLocationState,
  PinMode,
  VerificationMode,
  VerificationRouteState,
} from "./types";
import type { PatientProfile } from "../../types/flow";

type AuthStep =
  | "PHONE"
  | "IDENTITY"
  | "EMAIL"
  | "OTP"
  | "PIN"
  | "PROFILE"
  | "DASHBOARD";

type ProfileType = "SELF" | "CHILD" | "RELATIVE";
type IdentityFlowMode = "signup" | "patient_profile";

interface PhoneStepProps {
  phoneNumber: string;
  setPhoneNumber: (value: string) => void;
  onContinue: () => void;
  onUsePin: () => void;
  onSwitchToLogin: () => void;
  onSwitchToSignup: () => void;
  onSwitchToRecovery: () => void;
  onResumeSignup: () => void;
  onResumeRecovery: () => void;
  entryMode: OtpPurpose;
  isLoading: boolean;
  error: string | null;
  status: string | null;
  drafts: AuthDraftStatuses;
}

interface OtpStepProps {
  otp: string[];
  setOtp: (value: string[]) => void;
  phoneE164: string;
  mode: VerificationMode;
  onBack: () => void;
  onNext: () => void;
  onResend: () => void;
  isLoading: boolean;
  isResending: boolean;
  error: string | null;
  secondsLeft: number;
  expiryLeft: number;
  debugCode: string | null;
}

interface PinStepProps {
  pin: string[];
  setPin: (value: string[]) => void;
  mode: PinMode;
  phoneE164: string;
  onNext: () => void;
  onSkip: () => void;
  onFallbackOtp: () => void;
  isLoading: boolean;
  error: string | null;
}

interface ProfileStepProps {
  selectedProfile: ProfileType | null;
  onNext: (profile: ProfileType) => void;
}

interface IdentityStepProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  mode: IdentityFlowMode;
  relationshipLabel: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  setDateOfBirth: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  error: string | null;
}

interface EmailStepProps {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  acceptedTerms: boolean;
  setEmail: (value: string) => void;
  setAcceptedTerms: (value: boolean) => void;
  onFinish: () => void;
  onSkip: () => void;
  isLoading: boolean;
  error: string | null;
}

interface DashboardUpcomingAppointment {
  appointmentType: "presentiel" | "video";
  dateLabel: string;
  timeLabel: string;
  practitionerName: string;
  locationLabel: string;
}

interface DashboardStepProps {
  fullName: string;
  patientLabel: string;
  upcoming: DashboardUpcomingAppointment;
  onBook: () => void;
  onProfiles: () => void;
  onNotifications: () => void;
  onLogout: () => void;
  status: string | null;
}

interface ValueItemProps {
  icon: LucideIcon;
  text: string;
}

interface ProfileCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  selected?: boolean;
  onClick: () => void;
}

function parseVerificationMode(value: string | null): VerificationMode {
  if (value === "signup" || value === "reset_pin") return value;
  return "login";
}

function parsePinMode(value: string | null): PinMode {
  if (value === "setup" || value === "reset") return value;
  return "login";
}

function toProfileType(profile: PatientProfile): ProfileType {
  if (profile === "enfant") return "CHILD";
  if (profile === "proche") return "RELATIVE";
  return "SELF";
}

function toPatientProfile(profile: ProfileType): PatientProfile {
  if (profile === "CHILD") return "enfant";
  if (profile === "RELATIVE") return "proche";
  return "moi";
}

function profileToRelationshipLabel(profile: ProfileType): string {
  if (profile === "CHILD") return "Mon enfant";
  if (profile === "RELATIVE") return "Un proche";
  return "Moi";
}

function areFlowContextsEqual(
  first: AuthFlowContext | null,
  second: AuthFlowContext | null,
) {
  return JSON.stringify(first ?? {}) === JSON.stringify(second ?? {});
}

export default function AU01() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const locationState = (location.state ?? {}) as AuthLocationState;

  const incomingFlow = useMemo(
    () =>
      toFlowContext(location.state) ??
      toFlowContext(locationState.flowContext) ??
      auth.flowContext,
    [location.state, locationState.flowContext, auth.flowContext],
  );

  const [step, setStep] = useState<AuthStep>("PHONE");
  const [entryMode, setEntryMode] = useState<OtpPurpose>("login");
  const [pinMode, setPinMode] = useState<PinMode>("login");
  const [identityFlowMode, setIdentityFlowMode] = useState<IdentityFlowMode>("signup");

  const [phoneNumber, setPhoneNumber] = useState<string>(
    locationState.prefillPhone ?? "",
  );
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);

  const [selectedProfile, setSelectedProfile] = useState<ProfileType>(
    toProfileType(
      (auth.flowContext?.actingRelationship ?? "moi") as PatientProfile,
    ),
  );

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const [pending, setPending] = useState<PendingAuthState | null>(() =>
    loadPendingAuthState(),
  );
  const [tempToken, setTempToken] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResending, setIsResending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(
    locationState.resetSuccess ? "PIN mis à jour. Connectez-vous." : null,
  );

  const [drafts, setDrafts] = useState<AuthDraftStatuses>(() => getDraftStatuses());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [expiryLeft, setExpiryLeft] = useState(0);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  const relationshipLabel = useMemo(
    () => profileToRelationshipLabel(selectedProfile),
    [selectedProfile],
  );

  const phoneE164 = useMemo(() => {
    const normalized = normalizePhone221(phoneNumber);
    if (!isValidPhone221(normalized)) return null;
    return toE164(normalized);
  }, [phoneNumber]);

  const refreshDrafts = useCallback(() => {
    setDrafts(getDraftStatuses());
  }, []);

  const goToStep = useCallback(
    (
      nextStep: AuthStep,
      opts?: { replace?: boolean; identityMode?: IdentityFlowMode },
    ) => {
      setStep(nextStep);
      setError(null);
      if (nextStep === "PHONE") {
        navigate("/patient-flow/auth", { replace: opts?.replace ?? false, state: { flowContext: incomingFlow } });
      }
      if (nextStep === "IDENTITY") {
        navigate("/patient-flow/auth/inscription", {
          replace: opts?.replace ?? false,
          state: { flowContext: incomingFlow, prefillPhone: normalizePhone221(phoneNumber) },
        });
      }
      if (nextStep === "EMAIL") {
        navigate("/patient-flow/auth/inscription", {
          replace: opts?.replace ?? false,
          state: { flowContext: incomingFlow, prefillPhone: normalizePhone221(phoneNumber) },
        });
      }
      if (nextStep === "OTP") {
        navigate(`/patient-flow/auth/verification?mode=${entryMode}`, {
          replace: opts?.replace ?? false,
          state: pending,
        });
      }
      if (nextStep === "PIN") {
        navigate(`/patient-flow/auth/pin?mode=${pinMode}`, {
          replace: opts?.replace ?? false,
          state: {
            phoneE164,
            tempToken: tempToken ?? pending?.tempToken,
          },
        });
      }
      if (nextStep === "PROFILE") {
        navigate("/patient-flow/account/select-profile", {
          replace: opts?.replace ?? false,
          state: { flowContext: incomingFlow },
        });
      }
      if (nextStep === "DASHBOARD") {
        navigate(auth.resolvePostAuthRoute(incomingFlow), {
          replace: opts?.replace ?? false,
          state: { flowContext: incomingFlow },
        });
      }
    },
    [
      navigate,
      incomingFlow,
      phoneNumber,
      entryMode,
      pinMode,
      pending,
      phoneE164,
      tempToken,
      auth,
    ],
  );

  const routeAfterAuth = useCallback((roles?: AuthUser["roles"]) => {
    const destination = resolvePostAuthRoute(incomingFlow, {
      availableRoles: roles,
      activeRole: null,
    });

    navigate(destination, {
      replace: true,
      state: { flowContext: incomingFlow },
    });
  }, [incomingFlow, navigate]);

  useEffect(() => {
    refreshDrafts();
  }, [location.key, refreshDrafts]);

  useEffect(() => {
    if (!incomingFlow) return;
    if (!areFlowContextsEqual(auth.flowContext, incomingFlow)) {
      auth.setFlowContext(incomingFlow);
    }
  }, [incomingFlow, auth]);

  useEffect(() => {
    const path = location.pathname;

    if (path.endsWith("/auth/connexion")) {
      setEntryMode("login");
      setStep("PHONE");
    } else if (path.endsWith("/auth/inscription")) {
      setEntryMode("signup");
      setIdentityFlowMode("signup");
      const draft = loadAuthDraft("signup");
      if (locationState.resumeDraft && draft) {
        setFirstName(String(draft.payload.firstName ?? ""));
        setLastName(String(draft.payload.lastName ?? ""));
        setDateOfBirth(String(draft.payload.dateOfBirth ?? ""));
        setEmail(String(draft.payload.email ?? ""));
        setAcceptedTerms(Boolean(draft.payload.acceptedTerms));
        setPhoneNumber(String(draft.payload.phone ?? phoneNumber));
      }
      setStep("IDENTITY");
    } else if (path.endsWith("/auth/mot-de-passe-oublie")) {
      setEntryMode("reset_pin");
      const draft = loadAuthDraft("recovery");
      if (locationState.resumeDraft && draft) {
        setPhoneNumber(String(draft.payload.phone ?? phoneNumber));
      }
      setStep("PHONE");
    } else if (path.endsWith("/auth/verification")) {
      setEntryMode(parseVerificationMode(searchParams.get("mode")));
      const statePending = (location.state ?? null) as VerificationRouteState;
      const resolvedPending =
        statePending && typeof statePending === "object" && "challengeId" in statePending
          ? statePending
          : loadPendingAuthState();
      setPending(resolvedPending);
      setStep("OTP");
    } else if (path.endsWith("/auth/pin")) {
      setPinMode(parsePinMode(searchParams.get("mode")));
      setStep("PIN");
    } else if (path.endsWith("/auth/dashboard")) {
      setStep("DASHBOARD");
    } else {
      setStep("PHONE");
    }
  }, [location.pathname, location.state, searchParams, locationState.resumeDraft, phoneNumber]);

  useEffect(() => {
    if (entryMode !== "signup") return;
    if (!firstName && !lastName && !email && !dateOfBirth && !phoneNumber && !acceptedTerms) {
      return;
    }
    saveAuthDraft("signup", {
      firstName,
      lastName,
      dateOfBirth,
      email,
      phone: phoneNumber,
      acceptedTerms,
    });
    refreshDrafts();
  }, [
    entryMode,
    firstName,
    lastName,
    dateOfBirth,
    email,
    phoneNumber,
    acceptedTerms,
    refreshDrafts,
  ]);

  useEffect(() => {
    if (entryMode !== "reset_pin") return;
    if (!phoneNumber) return;
    saveAuthDraft("recovery", { phone: phoneNumber });
    refreshDrafts();
  }, [entryMode, phoneNumber, refreshDrafts]);

  useEffect(() => {
    if (step !== "OTP" || !pending?.challengeId) return;

    const tick = () => {
      if (!pending.resendAt || !pending.expiresAt) return;
      const resendAt = Date.parse(pending.resendAt);
      const expiresAt = Date.parse(pending.expiresAt);
      setSecondsLeft(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
      setExpiryLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [step, pending?.challengeId, pending?.resendAt, pending?.expiresAt]);

  const requestOtp = useCallback(
    async (purpose: OtpPurpose) => {
      const localPhone = normalizePhone221(phoneNumber);
      if (!isValidPhone221(localPhone)) {
        setError("Saisissez un numéro sénégalais valide (77 123 45 67).");
        return;
      }

      const nextPhoneE164 = toE164(localPhone);
      try {
        setIsLoading(true);
        setError(null);
        setStatus(null);

        const challenge = await auth.adapter.requestOtp({
          phoneE164: nextPhoneE164,
          purpose,
        });

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const nextPending: PendingAuthState = {
          purpose,
          challengeId: challenge.challengeId,
          phoneE164: nextPhoneE164,
          createdAt: Date.now(),
          resendAt: challenge.resendAt,
          expiresAt: challenge.expiresAt,
          fullName: fullName || undefined,
          email: email.trim() || undefined,
          termsAccepted: purpose === "signup" ? acceptedTerms : undefined,
        };

        setEntryMode(purpose);
        setPending(nextPending);
        setDebugCode(challenge.devCode ?? null);
        setOtp(["", "", "", "", "", ""]);
        savePendingAuthState(nextPending);
        goToStep("OTP");
      } catch (authError) {
        if (authError instanceof AuthAdapterError) {
          setError(mapAuthErrorToMessage(authError.code, authError.meta));
        } else {
          setError("Impossible d'envoyer le code OTP. Réessayez.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      phoneNumber,
      auth.adapter,
      firstName,
      lastName,
      email,
      acceptedTerms,
      goToStep,
    ],
  );

  const handlePhoneContinue = async () => {
    if (entryMode === "signup") {
      setIdentityFlowMode("signup");
      goToStep("IDENTITY", { identityMode: "signup" });
      return;
    }

    await requestOtp(entryMode);
  };

  const handleLoginWithPin = () => {
    const localPhone = normalizePhone221(phoneNumber);
    if (!isValidPhone221(localPhone)) {
      setError("Saisissez un numéro valide pour utiliser le PIN.");
      return;
    }
    setPin(["", "", "", ""]);
    setPinMode("login");
    setStatus(null);
    goToStep("PIN");
  };

  const handleOtpBack = () => {
    if (entryMode === "signup") {
      goToStep("EMAIL");
      return;
    }
    goToStep("PHONE");
  };

  const handleVerifyOtp = async () => {
    if (!pending) {
      setError("Session OTP expirée. Recommencez.");
      goToStep("PHONE", { replace: true });
      return;
    }

    const code = otp.join("");
    if (!isValidOtpCode(code)) {
      setError("Entrez un code OTP valide à 6 chiffres.");
      return;
    }

    try {
      setIsLoading(true);
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
      setPending(nextPending);
      setTempToken(verification.tempToken);
      savePendingAuthState(nextPending);

      if (entryMode === "login") {
        if (!verification.userExists) {
          setEntryMode("signup");
          setStatus("Ce numéro n'est pas inscrit. Créons votre compte.");
          goToStep("IDENTITY");
          return;
        }

        const session = await auth.adapter.completeOtpLogin({
          tempToken: verification.tempToken,
          phoneE164: pending.phoneE164,
          trustedDevice: true,
        });

        await auth.login(session);
        const user = await auth.adapter.getUserByPhone(pending.phoneE164);
        clearPendingAuthState();
        setPending(null);

        if (user?.hasPin) {
          routeAfterAuth(user.roles);
          return;
        }

        setPinMode("setup");
        setPin(["", "", "", ""]);
        goToStep("PIN");
        return;
      }

      if (entryMode === "signup") {
        if (verification.userExists) {
          setEntryMode("login");
          setStatus("Ce numéro est déjà associé à un compte. Connectez-vous.");
          goToStep("PHONE");
          return;
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        await auth.adapter.createAccount({
          tempToken: verification.tempToken,
          fullName: fullName || "Nouveau patient",
          phoneE164: pending.phoneE164,
          countryCode: "+221",
          email: email.trim() || undefined,
          termsAccepted: acceptedTerms,
        });

        const session = await auth.adapter.completeOtpLogin({
          tempToken: verification.tempToken,
          phoneE164: pending.phoneE164,
          trustedDevice: true,
        });

        await auth.login(session);
        clearAuthDraft("signup");
        clearPendingAuthState();
        refreshDrafts();
        setPending(null);

        setPinMode("setup");
        setPin(["", "", "", ""]);
        goToStep("PIN");
        return;
      }

      setPinMode("reset");
      setPin(["", "", "", ""]);
      goToStep("PIN");
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de vérifier le code OTP.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pending) return;

    try {
      setIsResending(true);
      setError(null);

      const challenge = await auth.adapter.requestOtp({
        phoneE164: pending.phoneE164,
        purpose: entryMode,
        forceNew: true,
      });

      const nextPending: PendingAuthState = {
        ...pending,
        challengeId: challenge.challengeId,
        createdAt: Date.now(),
        resendAt: challenge.resendAt,
        expiresAt: challenge.expiresAt,
      };

      setPending(nextPending);
      savePendingAuthState(nextPending);
      setOtp(["", "", "", "", "", ""]);
      setDebugCode(challenge.devCode ?? null);
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de renvoyer le code OTP.");
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleIdentityNext = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Prénom et nom requis (2 caractères minimum). ");
      return;
    }

    if (identityFlowMode === "patient_profile") {
      if (!dateOfBirth) {
        setError("La date de naissance du profil patient est requise.");
        return;
      }

      if (!auth.user) {
        setError("Session invalide. Reconnectez-vous.");
        return;
      }

      const actingRelationship = toPatientProfile(selectedProfile);

      try {
        setIsLoading(true);
        const result = await auth.accountAdapter.createOrLinkDependent({
          userId: auth.user.id,
          relationship: actingRelationship === "enfant" ? "enfant" : "proche",
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth,
        });
        await auth.refreshAccountData();
        await auth.setActingProfile(result.profile.id);
        auth.setFlowContext({
          ...(auth.flowContext ?? {}),
          actingProfileId: result.profile.id,
          actingRelationship,
        });
        setStatus(`Profil patient enregistré: ${relationshipLabel}.`);
        routeAfterAuth();
      } catch (adapterError) {
        setError(
          adapterError instanceof Error
            ? adapterError.message
            : "Impossible d'enregistrer ce profil patient.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const localPhone = normalizePhone221(phoneNumber);
    if (!isValidPhone221(localPhone)) {
      setError("Ajoutez un numéro sénégalais valide avant de continuer.");
      return;
    }

    goToStep("EMAIL");
  };

  const handleSignupSubmit = async () => {
    const localPhone = normalizePhone221(phoneNumber);
    if (!isValidPhone221(localPhone)) {
      setError("Numéro invalide. Exemple: 77 123 45 67.");
      return;
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError("Prénom et nom requis.");
      return;
    }

    if (email.trim().length > 0 && !email.includes("@")) {
      setError("Adresse email invalide.");
      return;
    }

    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions pour continuer.");
      return;
    }

    await requestOtp("signup");
  };

  const handlePinSubmit = async () => {
    const pinValue = pin.join("");

    if (!isValidPin(pinValue)) {
      setError("Le PIN doit contenir exactement 4 chiffres.");
      return;
    }

    if (!phoneE164) {
      setError("Numéro manquant. Reprenez la connexion.");
      goToStep("PHONE");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (pinMode === "login") {
        const session = await auth.adapter.loginWithPin({
          phoneE164,
          pin: pinValue,
          trustedDevice: true,
        });

        await auth.login(session);
        const currentUser = await auth.adapter.getUserByPhone(phoneE164);
        clearPendingAuthState();
        setPending(null);
        routeAfterAuth(currentUser?.roles);
        return;
      }

      if (pinMode === "setup") {
        if (!auth.isAuthenticated) {
          setError("Session invalide. Connectez-vous puis réessayez.");
          goToStep("PHONE");
          return;
        }

        await auth.adapter.setPin({
          phoneE164,
          pin: pinValue,
        });

        const currentUser = await auth.adapter.getUserByPhone(phoneE164);
        clearPendingAuthState();
        setPending(null);
        routeAfterAuth(currentUser?.roles);
        return;
      }

      const token = tempToken ?? pending?.tempToken;
      if (!token) {
        setError("Session de réinitialisation expirée.");
        goToStep("PHONE");
        return;
      }

      await auth.adapter.resetPin({
        tempToken: token,
        phoneE164,
        newPin: pinValue,
      });

      clearAuthDraft("recovery");
      clearPendingAuthState();
      refreshDrafts();
      setPending(null);
      setEntryMode("login");
      setStatus("PIN mis à jour. Connectez-vous maintenant.");
      setPin(["", "", "", ""]);
      goToStep("PHONE");
    } catch (authError) {
      if (authError instanceof AuthAdapterError) {
        setError(mapAuthErrorToMessage(authError.code, authError.meta));
      } else {
        setError("Impossible de valider le PIN.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSkip = () => {
    if (pinMode !== "setup") return;
    routeAfterAuth();
  };

  const handlePinFallbackOtp = async () => {
    if (!phoneE164) {
      setError("Numéro manquant. Reprenez la connexion.");
      goToStep("PHONE");
      return;
    }

    await requestOtp("login");
  };

  const handleProfileContinue = async (profile: ProfileType) => {
    setSelectedProfile(profile);
    setIdentityFlowMode("patient_profile");
    setError(null);
    setStatus(null);

    if (profile === "SELF") {
      if (!auth.user) {
        setError("Session invalide. Reconnectez-vous.");
        return;
      }

      try {
        setIsLoading(true);
        const selfProfile = await auth.accountAdapter.ensureSelfProfile({
          userId: auth.user.id,
          fullName: auth.user.fullName,
        });
        await auth.refreshAccountData();
        await auth.setActingProfile(selfProfile.id);
        auth.setFlowContext({
          ...(auth.flowContext ?? {}),
          actingProfileId: selfProfile.id,
          actingRelationship: "moi",
        });
        routeAfterAuth();
      } catch (adapterError) {
        setError(
          adapterError instanceof Error
            ? adapterError.message
            : "Impossible d'activer votre profil principal.",
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setFirstName("");
    setLastName("");
    setDateOfBirth("");

    goToStep("IDENTITY", { identityMode: "patient_profile" });
  };

  const fullName = useMemo(() => {
    const fromFields = `${firstName.trim()} ${lastName.trim()}`.trim();
    return fromFields || auth.user?.fullName || "Patient";
  }, [firstName, lastName, auth.user?.fullName]);

  const dashboardUpcoming = useMemo<DashboardUpcomingAppointment>(() => {
    const flow = auth.flowContext;
    const appointmentType =
      flow?.appointmentType === "video" ? "video" : "presentiel";

    const selectedDate =
      typeof flow?.selectedSlot?.date === "string"
        ? flow.selectedSlot.date
        : typeof flow?.date === "string"
          ? flow.date
          : "Date à confirmer";
    const selectedTime =
      typeof flow?.selectedSlot?.time === "string"
        ? flow.selectedSlot.time
        : typeof flow?.time === "string"
          ? flow.time
          : "Heure à confirmer";

    return {
      appointmentType,
      dateLabel: selectedDate,
      timeLabel: selectedTime,
      practitionerName:
        typeof flow?.practitioner?.name === "string"
          ? flow.practitioner.name
          : "Dr. Aïssatou Diallo",
      locationLabel:
        typeof flow?.practitioner?.location === "string"
          ? flow.practitioner.location
          : appointmentType === "video"
            ? "Consultation vidéo sécurisée"
            : "Cabinet Melanis, Dakar",
    };
  }, [auth.flowContext]);

  const otpPhone = pending?.phoneE164 ?? phoneE164 ?? "+221";

  return (
    <div className="min-h-screen w-full bg-[#FEF0D5] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10">
      <div
        className="mx-auto w-full max-w-[1220px] overflow-hidden rounded-[38px] bg-white lg:rounded-[48px]"
        style={{ boxShadow: "0 24px 60px rgba(59, 28, 11, 0.12)" }}
      >
        <div className="flex min-h-[calc(100vh-2rem)] lg:min-h-[760px] xl:min-h-[820px]">
          <div className="relative hidden w-[50.5%] overflow-hidden bg-[#111214] lg:block">
            <img
              src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=80&w=1200&auto=format&fit=crop"
              alt="Médecin accueillant une patiente"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            <Link
              to="/"
              className="absolute left-10 top-10 text-[44px] text-white transition-opacity hover:opacity-85"
              style={{ fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              melanis
            </Link>

            <div className="absolute bottom-10 left-10 right-10 text-white">
              <h2
                className="max-w-[320px] text-[64px] leading-[1.05]"
                style={{ fontWeight: 500, letterSpacing: "-0.03em" }}
              >
                Votre santé,
                <br />
                votre priorité.
              </h2>
              <p
                className="mt-5 max-w-[460px] text-[33px] leading-[1.5] text-white/75"
                style={{ fontWeight: 400 }}
              >
                Rejoignez la première communauté de soins dermatologiques dédiée
                aux peaux noires et métissées.
              </p>
            </div>
          </div>

          <div className="relative w-full overflow-y-auto lg:w-[49.5%]">
            <div className="mx-auto w-full max-w-[620px] px-6 pb-10 pt-8 sm:px-10 sm:pb-12 sm:pt-10 lg:px-14 lg:pb-14 lg:pt-14">
              <AnimatePresence mode="wait">
                {step === "PHONE" && (
                  <PhoneStep
                    key="phone"
                    phoneNumber={phoneNumber}
                    setPhoneNumber={setPhoneNumber}
                    onContinue={() => void handlePhoneContinue()}
                    onUsePin={handleLoginWithPin}
                    onSwitchToLogin={() => {
                      setEntryMode("login");
                      setStatus(null);
                      setError(null);
                    }}
                    onSwitchToSignup={() => {
                      setEntryMode("signup");
                      setStatus(null);
                      setError(null);
                    }}
                    onSwitchToRecovery={() => {
                      setEntryMode("reset_pin");
                      setStatus(null);
                      setError(null);
                    }}
                    onResumeSignup={() => {
                      setEntryMode("signup");
                      setIdentityFlowMode("signup");
                      goToStep("IDENTITY", { identityMode: "signup" });
                    }}
                    onResumeRecovery={() => {
                      setEntryMode("reset_pin");
                      const draft = loadAuthDraft("recovery");
                      if (draft?.payload.phone) {
                        setPhoneNumber(String(draft.payload.phone));
                      }
                    }}
                    entryMode={entryMode}
                    isLoading={isLoading}
                    error={error}
                    status={status}
                    drafts={drafts}
                  />
                )}

                {step === "IDENTITY" && (
                  <IdentityStep
                    key="identity"
                    firstName={firstName}
                    lastName={lastName}
                    dateOfBirth={dateOfBirth}
                    mode={identityFlowMode}
                    relationshipLabel={relationshipLabel}
                    setFirstName={(value) => {
                      setFirstName(value);
                      if (error) setError(null);
                    }}
                    setLastName={(value) => {
                      setLastName(value);
                      if (error) setError(null);
                    }}
                    setDateOfBirth={(value) => {
                      setDateOfBirth(value);
                      if (error) setError(null);
                    }}
                    onBack={() =>
                      identityFlowMode === "patient_profile"
                        ? goToStep("PROFILE")
                        : goToStep("PHONE")
                    }
                    onNext={handleIdentityNext}
                    error={error}
                  />
                )}

                {step === "EMAIL" && (
                  <EmailStep
                    key="email"
                    firstName={firstName}
                    lastName={lastName}
                    dateOfBirth={dateOfBirth}
                    email={email}
                    acceptedTerms={acceptedTerms}
                    setEmail={(value) => {
                      setEmail(value);
                      if (error) setError(null);
                    }}
                    setAcceptedTerms={(value) => {
                      setAcceptedTerms(value);
                      if (error) setError(null);
                    }}
                    onFinish={() => void handleSignupSubmit()}
                    onSkip={() => {
                      setEmail("");
                      void handleSignupSubmit();
                    }}
                    isLoading={isLoading}
                    error={error}
                  />
                )}

                {step === "OTP" && (
                  <OtpStep
                    key="otp"
                    otp={otp}
                    setOtp={setOtp}
                    phoneE164={otpPhone}
                    mode={entryMode}
                    onBack={handleOtpBack}
                    onNext={() => void handleVerifyOtp()}
                    onResend={() => void handleResendOtp()}
                    isLoading={isLoading}
                    isResending={isResending}
                    error={error}
                    secondsLeft={secondsLeft}
                    expiryLeft={expiryLeft}
                    debugCode={debugCode}
                  />
                )}

                {step === "PIN" && (
                  <PinStep
                    key="pin"
                    pin={pin}
                    setPin={setPin}
                    mode={pinMode}
                    phoneE164={phoneE164 ?? pending?.phoneE164 ?? "+221"}
                    onNext={() => void handlePinSubmit()}
                    onSkip={handlePinSkip}
                    onFallbackOtp={() => void handlePinFallbackOtp()}
                    isLoading={isLoading}
                    error={error}
                  />
                )}

                {step === "PROFILE" && (
                  <ProfileStep
                    key="profile"
                    selectedProfile={selectedProfile}
                    onNext={handleProfileContinue}
                  />
                )}

                {step === "DASHBOARD" && (
                  <DashboardStep
                    key="dashboard"
                    fullName={fullName}
                    patientLabel={relationshipLabel}
                    upcoming={dashboardUpcoming}
                    onBook={() => navigate("/patient-flow")}
                    onProfiles={() => goToStep("PROFILE")}
                    onNotifications={() =>
                      setStatus("Centre de préférences prêt pour l'intégration API.")
                    }
                    onLogout={() => {
                      void auth.logout();
                      setEntryMode("login");
                      goToStep("PHONE", { replace: true });
                    }}
                    status={status}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneStep({
  phoneNumber,
  setPhoneNumber,
  onContinue,
  onUsePin,
  onSwitchToLogin,
  onSwitchToSignup,
  onSwitchToRecovery,
  onResumeSignup,
  onResumeRecovery,
  entryMode,
  isLoading,
  error,
  status,
  drafts,
}: PhoneStepProps) {
  const ctaLabel =
    entryMode === "signup"
      ? "Créer mon compte"
      : entryMode === "reset_pin"
        ? "Réinitialiser mon PIN"
        : "Continuer avec mon numéro";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <div className="mb-4 lg:hidden">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[15px] text-[#111214]/65 transition-colors hover:text-[#5B1112]"
          style={{ fontWeight: 500 }}
        >
          <ArrowLeft size={19} /> Retour
        </Link>
      </div>

      <span
        className="mb-5 block text-[12px] uppercase text-[#5B1112] sm:text-[13px]"
        style={{ fontWeight: 700, letterSpacing: "0.18em" }}
      >
        Espace Melanis
      </span>
      <h1
        className="text-[56px] leading-[1.05] text-[#111214] sm:text-[62px] lg:text-[64px]"
        style={{ fontWeight: 600, letterSpacing: "-0.03em" }}
      >
        Accédez à votre espace
      </h1>
      <p
        className="mb-8 mt-4 text-[20px] leading-[1.45] text-[#70737A] sm:text-[21px]"
        style={{ fontWeight: 500 }}
      >
        Sécurisez vos informations et suivez vos soins en toute confidentialité.
      </p>

      <div className="mb-10 space-y-5 lg:space-y-4">
        <ValueItem icon={Calendar} text="Gérer vos rendez-vous" />
        <ValueItem icon={ImageIcon} text="Retrouver vos photos & suivi" />
        <ValueItem
          icon={FileText}
          text="Accéder à votre dossier patient (vous / enfant / proche)"
        />
      </div>

      <div className="space-y-5">
        <div className="relative flex items-center">
          <div className="absolute left-0 top-0 bottom-0 flex items-center border-r border-[#D6D9DE] pl-4 pr-3">
            <span className="flex items-center gap-2 text-[17px] text-[#22252A]">
              🇸🇳 +221 <ChevronDown size={18} className="text-[#8A8D92]" />
            </span>
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value.replace(/[^0-9\s]/g, ""))}
            placeholder="77 000 00 00"
            className="h-[72px] w-full rounded-[18px] border border-[#D6D9DE] bg-[#EFF1F5] pl-[136px] pr-4 text-[17px] tracking-[0.01em] text-[#23262B] placeholder:text-[#BCC0C5] focus:border-[#A8ADB6] focus:bg-white focus:outline-none"
            autoFocus
            inputMode="numeric"
            autoComplete="tel"
          />
        </div>

        {error ? <InlineNotice tone="error" message={error} /> : null}
        {status ? <InlineNotice tone="info" message={status} /> : null}

        <button
          onClick={onContinue}
          disabled={isLoading || phoneNumber.length < 5}
          className="flex h-[72px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#965E5E] text-[20px] text-white transition-colors enabled:hover:bg-[#825151] disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            boxShadow: "0 14px 24px rgba(88, 30, 29, 0.18)",
            fontWeight: 500,
          }}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : ctaLabel}
        </button>

        {entryMode === "login" ? (
          <button
            onClick={onUsePin}
            className="w-full rounded-[14px] border border-[#111214]/12 bg-white py-3 text-[16px] text-[#111214]/78 transition hover:border-[#5B1112]/30 hover:text-[#5B1112]"
            style={{ fontWeight: 550 }}
          >
            Se connecter avec PIN
          </button>
        ) : null}

        <p
          className="pt-2 text-center text-[15px] text-[#8B8E93]"
          style={{ fontWeight: 500 }}
        >
          Sans email. En ~30 secondes.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {drafts.signup ? (
          <button
            onClick={onResumeSignup}
            className="rounded-full border border-[#111214]/15 bg-white px-3 py-1.5 text-[12px] text-[#111214]/75"
            style={{ fontWeight: 520 }}
          >
            Reprendre inscription
          </button>
        ) : null}
        {drafts.recovery ? (
          <button
            onClick={onResumeRecovery}
            className="rounded-full border border-[#111214]/15 bg-white px-3 py-1.5 text-[12px] text-[#111214]/75"
            style={{ fontWeight: 520 }}
          >
            Reprendre PIN oublié
          </button>
        ) : null}
      </div>

      <div className="mt-8 space-y-6 text-center">
        <div className="flex items-center justify-center gap-5 text-[16px] sm:text-[17px]">
          <button
            onClick={onSwitchToLogin}
            className={`transition-colors ${entryMode === "login" ? "text-[#5B1112]" : "text-[#93969C] hover:text-[#6F7278]"}`}
          >
            J&apos;ai déjà un compte
          </button>
          <button
            onClick={onSwitchToSignup}
            className={`transition-colors ${entryMode === "signup" ? "text-[#5B1112]" : "text-[#93969C] hover:text-[#6F7278]"}`}
          >
            Créer un compte
          </button>
          <button
            onClick={onSwitchToRecovery}
            className={`transition-colors ${entryMode === "reset_pin" ? "text-[#5B1112]" : "text-[#93969C] hover:text-[#6F7278]"}`}
          >
            PIN oublié
          </button>
        </div>

        <div
          className="mx-auto flex max-w-[360px] items-center justify-center gap-2 text-[13px] leading-[1.4] text-[#B4B6BA]"
          style={{ fontWeight: 500 }}
        >
          <ShieldCheck size={14} />
          <span>
            Nous utilisons votre numéro uniquement pour sécuriser votre accès.
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function OtpStep({
  otp,
  setOtp,
  phoneE164,
  mode,
  onBack,
  onNext,
  onResend,
  isLoading,
  isResending,
  error,
  secondsLeft,
  expiryLeft,
  debugCode,
}: OtpStepProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const isComplete = otp.every((digit) => digit !== "");

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace") return;

    if (otp[index]) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next = [...otp];
      next[index - 1] = "";
      setOtp(next);
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
    setOtp(next);

    const nextFocus = Math.min(pasted.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  const subtitleByMode: Record<VerificationMode, string> = {
    login: "Confirmez votre connexion avec le code reçu par SMS.",
    signup: "Confirmez votre numéro pour finaliser la création du compte.",
    reset_pin: "Confirmez votre identité avant de réinitialiser le PIN.",
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
      onPaste={handlePaste}
    >
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-[#111214]/40 transition-colors hover:text-[#111214]"
      >
        <ArrowLeft size={16} /> Retour
      </button>

      <h1 className="text-3xl font-semibold text-[#111214] mb-2">Entrez le code</h1>
      <p className="text-[#111214]/60 text-lg mb-8">
        {subtitleByMode[mode]}
        <br />
        <span className="font-semibold text-[#111214]">{formatPhoneE164ToReadable(phoneE164)}</span>
      </p>

      <div className="flex justify-between gap-2 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold bg-[#F9FAFB] border border-[#111214]/10 rounded-xl focus:outline-none focus:border-[#5B1112] focus:bg-white transition-all caret-[#5B1112]"
          />
        ))}
      </div>

      {error ? <InlineNotice tone="error" message={error} /> : null}

      <button
        onClick={onNext}
        disabled={!isComplete || isLoading}
        className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "Vérifier"}
      </button>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-[#111214]/40">
          Renvoyer le code dans <span className="font-mono text-[#111214]">00:{String(secondsLeft).padStart(2, "0")}</span>
        </p>
        <button
          onClick={onResend}
          disabled={secondsLeft > 0 || isResending}
          className="text-sm font-medium text-[#5B1112] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? "Renvoi..." : "Renvoyer le code"}
        </button>
        <p className="text-xs text-[#111214]/35">Expire dans {expiryLeft}s</p>
        {debugCode ? (
          <div
            role="status"
            aria-label="Code OTP de débogage"
            style={{
              marginTop: "12px",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1.5px dashed rgba(180,120,0,0.4)",
              background: "rgba(255,200,0,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "11px", color: "rgba(120,80,0,0.7)", fontWeight: 600, letterSpacing: "0.03em" }}>
              DEV — Code OTP
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "22px", fontWeight: 700, letterSpacing: "0.18em", color: "#7a5000" }}>
              {debugCode}
            </span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(debugCode)}
              style={{ fontSize: "11px", color: "rgba(120,80,0,0.6)", border: "1px solid rgba(120,80,0,0.25)", borderRadius: "6px", padding: "2px 8px", background: "transparent", cursor: "pointer" }}
            >
              Copier
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

function PinStep({
  pin,
  setPin,
  mode,
  phoneE164,
  onNext,
  onSkip,
  onFallbackOtp,
  isLoading,
  error,
}: PinStepProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    if (value !== "" && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && pin[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isComplete = pin.every((digit) => digit !== "");

  const titleByMode: Record<PinMode, string> = {
    setup: "Créez un code PIN",
    login: "Connexion par PIN",
    reset: "Nouveau PIN",
  };

  const subtitleByMode: Record<PinMode, string> = {
    setup: "Pour vous connecter plus vite et sécuriser vos données médicales.",
    login: "Entrez votre PIN 4 chiffres pour accéder rapidement à votre compte.",
    reset: "Définissez un nouveau PIN pour finaliser la réinitialisation.",
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">{titleByMode[mode]}</h1>
      <p className="text-[#111214]/60 text-lg mb-2">{subtitleByMode[mode]}</p>
      <p className="text-sm text-[#111214]/45 mb-10">{formatPhoneE164ToReadable(phoneE164)}</p>

      <div className="flex justify-center gap-4 mb-10">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="w-16 h-16 text-center text-3xl font-bold bg-[#F9FAFB] border border-[#111214]/10 rounded-2xl focus:outline-none focus:border-[#5B1112] focus:bg-white transition-all caret-[#5B1112]"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        ))}
      </div>

      {error ? <InlineNotice tone="error" message={error} /> : null}

      <div className="space-y-3">
        <button
          onClick={onNext}
          disabled={!isComplete || isLoading}
          className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Continuer"}
        </button>

        {mode === "setup" ? (
          <button
            onClick={onSkip}
            className="w-full py-3 text-[#111214]/60 font-medium hover:text-[#111214] transition-colors"
          >
            Plus tard
          </button>
        ) : null}

        {mode === "login" ? (
          <button
            onClick={onFallbackOtp}
            className="w-full py-3 text-[#5B1112] font-medium hover:text-[#421011] transition-colors"
          >
            Utiliser OTP à la place
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

function ProfileStep({ selectedProfile, onNext }: ProfileStepProps) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">Vous agissez pour...</h1>
      <p className="text-[#111214]/60 text-lg mb-8">
        Sélectionnez le sujet de soin, puis renseignez son identité.
      </p>

      <div className="space-y-4 mb-8">
        <ProfileCard
          icon={User}
          title="Moi-même"
          subtitle="Profil principal"
          selected={selectedProfile === "SELF"}
          onClick={() => onNext("SELF")}
        />
        <ProfileCard
          icon={Baby}
          title="Mon enfant"
          subtitle="Géré par un parent"
          selected={selectedProfile === "CHILD"}
          onClick={() => onNext("CHILD")}
        />
        <ProfileCard
          icon={Heart}
          title="Un proche"
          subtitle="Accompagnant"
          selected={selectedProfile === "RELATIVE"}
          onClick={() => onNext("RELATIVE")}
        />
      </div>

      <p className="text-center text-xs text-[#111214]/40">
        Vous pourrez ajouter d'autres profils plus tard dans les réglages.
      </p>
    </motion.div>
  );
}

function IdentityStep({
  firstName,
  lastName,
  dateOfBirth,
  mode,
  relationshipLabel,
  setFirstName,
  setLastName,
  setDateOfBirth,
  onBack,
  onNext,
  error,
}: IdentityStepProps) {
  const canContinue =
    firstName.trim().length >= 2 &&
    lastName.trim().length >= 2 &&
    (mode === "signup" || dateOfBirth.length > 0);

  const title =
    mode === "patient_profile" ? "Identité du profil patient" : "Vos informations";
  const subtitle =
    mode === "patient_profile"
      ? `Renseignez prénom, nom et date de naissance pour ${relationshipLabel.toLowerCase()}.`
      : "Complétez les informations de base pour créer votre compte.";
  const backLabel =
    mode === "patient_profile" ? "Choisir un autre profil" : "Retour à la connexion";

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-medium text-[#111214]/40 transition-colors hover:text-[#111214]"
      >
        <ArrowLeft size={16} /> {backLabel}
      </button>

      <h1 className="mb-2 text-3xl font-semibold text-[#111214]">{title}</h1>
      <p className="mb-8 text-lg text-[#111214]/60">{subtitle}</p>

      <div className="mb-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111214]/60">Prénom</label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Ex: Awa"
              autoComplete="given-name"
              className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg transition-all placeholder:text-[#111214]/20 focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#111214]/60">Nom</label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Ex: Ndiaye"
              autoComplete="family-name"
              className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg transition-all placeholder:text-[#111214]/20 focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-[#111214]/60">
            Date de naissance {mode === "signup" ? "(optionnel)" : ""}
          </label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            className="w-full rounded-xl border border-[#111214]/10 bg-[#F9FAFB] px-4 py-4 text-lg text-[#111214] transition-all focus:border-[#5B1112]/30 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {error ? <InlineNotice tone="error" message={error} /> : null}

      <button
        onClick={onNext}
        disabled={!canContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B1112] py-4 text-lg font-medium text-white transition-all hover:bg-[#4a0e0f] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Continuer
      </button>
    </motion.div>
  );
}

function EmailStep({
  firstName,
  lastName,
  dateOfBirth,
  email,
  acceptedTerms,
  setEmail,
  setAcceptedTerms,
  onFinish,
  onSkip,
  isLoading,
  error,
}: EmailStepProps) {
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
  const hasValidEmail =
    email.trim().length === 0 ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const canContinue = hasValidEmail && acceptedTerms;

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-3xl font-semibold text-[#111214] mb-2">Ajouter un email</h1>
      <p className="text-[#111214]/60 text-lg mb-10">
        (Facultatif) Pour recevoir vos confirmations, ordonnances et documents
        médicaux.
      </p>

      <div className="mb-8 rounded-xl border border-[#111214]/10 bg-[#F9FAFB] p-4">
        <p className="text-xs uppercase tracking-[0.14em] text-[#111214]/45">Profil</p>
        <p className="mt-1 text-base font-semibold text-[#111214]">
          {displayName || "Utilisateur"} {dateOfBirth ? `• Né(e) le ${dateOfBirth}` : ""}
        </p>
      </div>

      <div className="space-y-2 mb-6">
        <label className="text-sm font-medium text-[#111214]/60">Email</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="exemple@email.com"
          className="w-full px-4 py-4 bg-[#F9FAFB] border border-[#111214]/10 rounded-xl focus:outline-none focus:border-[#5B1112]/30 focus:bg-white transition-all placeholder:text-[#111214]/20 text-lg"
        />
        {!hasValidEmail ? (
          <p className="text-sm text-[#A84040]">
            Entrez un email valide ou laissez ce champ vide.
          </p>
        ) : null}
      </div>

      <label className="mb-8 flex cursor-pointer items-start gap-3 rounded-xl border border-[#111214]/10 bg-[#F9FAFB] p-4">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-1 h-4 w-4 accent-[#5B1112]"
        />
        <span className="text-sm text-[#111214]/68" style={{ fontWeight: 500 }}>
          J&apos;accepte les conditions d&apos;utilisation et la politique de confidentialité Melanis.
        </span>
      </label>

      {error ? <InlineNotice tone="error" message={error} /> : null}

      <div className="space-y-3">
        <button
          onClick={onFinish}
          disabled={isLoading || !canContinue}
          className="w-full py-4 bg-[#5B1112] text-white rounded-xl font-medium text-lg hover:bg-[#4a0e0f] transition-all shadow-lg shadow-[#5B1112]/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Continuer avec OTP"}
        </button>
        <button
          onClick={onSkip}
          disabled={isLoading || !acceptedTerms}
          className="w-full py-3 text-[#111214]/60 font-medium hover:text-[#111214] transition-colors disabled:opacity-50"
        >
          Continuer sans email
        </button>
      </div>
    </motion.div>
  );
}

function DashboardStep({
  fullName,
  patientLabel,
  upcoming,
  onBook,
  onProfiles,
  onNotifications,
  onLogout,
  status,
}: DashboardStepProps) {
  const [habitState, setHabitState] = useState({
    routine: true,
    medication: false,
    hydration: true,
  });

  const completedHabits = useMemo(
    () => Object.values(habitState).filter(Boolean).length,
    [habitState],
  );
  const adherenceScore = useMemo(
    () => Math.round((completedHabits / 3) * 100),
    [completedHabits],
  );

  const toggleHabit = (key: keyof typeof habitState) => {
    setHabitState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="mb-5 rounded-[26px] p-5 text-white"
        style={{
          background:
            "linear-gradient(141deg, #5B1112 0%, #7A2E2D 42%, #00415E 100%)",
          boxShadow: "0 20px 36px rgba(34, 17, 17, 0.22)",
        }}
      >
        <p className="text-[12px] uppercase tracking-[0.16em] text-white/75" style={{ fontWeight: 700 }}>
          Tableau de bord patient
        </p>
        <h1 className="mt-2 text-[32px] leading-[1.06]" style={{ fontWeight: 620, letterSpacing: "-0.02em" }}>
          Bonjour {fullName}
        </h1>
        <p className="mt-2 text-[14px] text-white/80" style={{ fontWeight: 500 }}>
          Agir pour: <span style={{ fontWeight: 700 }}>{patientLabel}</span> • Votre suivi du jour est prêt.
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <DashboardKpi label="Observance" value={`${adherenceScore}%`} icon={Activity} />
          <DashboardKpi label="Rappels" value="2 actifs" icon={Bell} />
          <DashboardKpi label="Messages" value="1 non lu" icon={MessageSquare} />
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="rounded-[22px] border border-[#111214]/8 bg-white p-4"
          style={{ boxShadow: "0 10px 20px rgba(17,18,20,0.05)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] uppercase tracking-[0.12em] text-[#111214]/42" style={{ fontWeight: 700 }}>
                Prochain rendez-vous
              </p>
              <h2 className="mt-1 text-[20px] text-[#111214]" style={{ fontWeight: 620 }}>
                {upcoming.dateLabel} · {upcoming.timeLabel}
              </h2>
              <p className="mt-1 text-[13px] text-[#111214]/62" style={{ fontWeight: 520 }}>
                {upcoming.practitionerName}
              </p>
              <p className="text-[13px] text-[#111214]/52" style={{ fontWeight: 500 }}>
                {upcoming.appointmentType === "video" ? "Consultation vidéo" : "Consultation présentielle"} • {upcoming.locationLabel}
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F6EAD5] text-[#5B1112]">
              <CalendarCheck2 className="h-[20px] w-[20px]" strokeWidth={1.9} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onBook}
              className="rounded-[12px] bg-[#5B1112] px-3.5 py-2 text-[13px] text-white transition hover:bg-[#4a0e0f]"
              style={{ fontWeight: 600 }}
            >
              Gérer mon RDV
            </button>
            <button
              onClick={onNotifications}
              className="rounded-[12px] border border-[#111214]/12 bg-white px-3.5 py-2 text-[13px] text-[#111214]/75 transition hover:border-[#5B1112]/35 hover:text-[#5B1112]"
              style={{ fontWeight: 600 }}
            >
              Rappels
            </button>
          </div>
        </div>

        <div
          className="rounded-[22px] border border-[#111214]/8 bg-white p-4"
          style={{ boxShadow: "0 10px 20px rgba(17,18,20,0.05)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[12px] uppercase tracking-[0.12em] text-[#111214]/42" style={{ fontWeight: 700 }}>
                Plan du jour
              </p>
              <p className="text-[14px] text-[#111214]/62" style={{ fontWeight: 520 }}>
                {completedHabits}/3 actions validées aujourd&apos;hui
              </p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-[#F1F6F8] px-3 py-1 text-[12px] text-[#00415E]" style={{ fontWeight: 700 }}>
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2} />
              {adherenceScore}%
            </div>
          </div>

          <div className="space-y-2.5">
            <HabitRow
              icon={Stethoscope}
              label="Routine de soins appliquée"
              done={habitState.routine}
              onToggle={() => toggleHabit("routine")}
            />
            <HabitRow
              icon={Pill}
              label="Traitement pris"
              done={habitState.medication}
              onToggle={() => toggleHabit("medication")}
            />
            <HabitRow
              icon={Clock3}
              label="Check-in photo hebdomadaire planifié"
              done={habitState.hydration}
              onToggle={() => toggleHabit("hydration")}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <DashboardActionTile
            icon={CalendarCheck2}
            title="Réserver un RDV"
            subtitle="Nouveau parcours"
            onClick={onBook}
          />
          <DashboardActionTile
            icon={UsersRound}
            title="Profils patients"
            subtitle="Moi, enfant, proche"
            onClick={onProfiles}
          />
          <DashboardActionTile
            icon={Bell}
            title="Préférences"
            subtitle="SMS, WhatsApp, rappels"
            onClick={onNotifications}
          />
        </div>

        <div
          className="rounded-[20px] border border-[#111214]/8 bg-[linear-gradient(138deg,#F8EFE3_0%,#F5EEE4_52%,#EDF4F8_100%)] p-4"
        >
          <p className="text-[12px] uppercase tracking-[0.12em] text-[#111214]/42" style={{ fontWeight: 700 }}>
            Timeline express
          </p>
          <div className="mt-3 space-y-2">
            <TimelineItem
              icon={CheckCircle2}
              title="Pré-consult complétée"
              meta="Aujourd'hui · données enregistrées"
            />
            <TimelineItem
              icon={FileText}
              title="Ordonnance disponible"
              meta="Dernière consultation"
            />
            <TimelineItem
              icon={MessageSquare}
              title="Message praticien"
              meta="Réponse en attente"
            />
          </div>
        </div>
      </div>

      {status ? <div className="mt-4"><InlineNotice tone="info" message={status} /></div> : null}

      <button
        onClick={onLogout}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#111214]/12 bg-white py-3 text-[#111214]/75 transition hover:bg-[#F9FAFB]"
        style={{ fontWeight: 550 }}
      >
        <LogOut className="h-4 w-4" />
        Se déconnecter
      </button>
    </motion.div>
  );
}

function DashboardActionTile({
  icon: Icon,
  title,
  subtitle,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#111214]/10 bg-white p-4 text-left transition hover:border-[#5B1112]/30 hover:shadow-sm"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F6EAD5] text-[#6A1D1F]">
          <Icon size={17} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[14px] text-[#111214]" style={{ fontWeight: 620 }}>
            {title}
          </p>
          <p className="text-[12px] text-[#111214]/52" style={{ fontWeight: 500 }}>
            {subtitle}
          </p>
        </div>
      </div>
    </button>
  );
}

function DashboardKpi({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[14px] border border-white/20 bg-white/12 p-2.5 backdrop-blur-[2px]">
      <div className="mb-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/18">
        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2} />
      </div>
      <p className="text-[14px] text-white" style={{ fontWeight: 700 }}>{value}</p>
      <p className="text-[11px] text-white/78" style={{ fontWeight: 600 }}>{label}</p>
    </div>
  );
}

function HabitRow({
  icon: Icon,
  label,
  done,
  onToggle,
}: {
  icon: LucideIcon;
  label: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full rounded-[14px] border border-[#111214]/10 bg-[#FAFAFA] px-3 py-2.5 text-left transition hover:bg-[#F5F5F5]"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0E6D6] text-[#5B1112]">
          <Icon className="h-4 w-4" strokeWidth={1.8} />
        </div>
        <p className="flex-1 text-[13px] text-[#111214]/78" style={{ fontWeight: 560 }}>
          {label}
        </p>
        <div
          className="inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px]"
          style={{
            background: done ? "rgba(0,65,94,0.12)" : "rgba(17,18,20,0.08)",
            color: done ? "#00415E" : "rgba(17,18,20,0.55)",
            fontWeight: 700,
          }}
        >
          {done ? "OK" : "En attente"}
        </div>
      </div>
    </button>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  meta,
}: {
  icon: LucideIcon;
  title: string;
  meta: string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-white/75 px-3 py-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFFFFF] text-[#5B1112]">
        <Icon className="h-4 w-4" strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-[13px] text-[#111214]" style={{ fontWeight: 620 }}>{title}</p>
        <p className="text-[12px] text-[#111214]/50" style={{ fontWeight: 500 }}>{meta}</p>
      </div>
    </div>
  );
}

function InlineNotice({
  tone,
  message,
}: {
  tone: "error" | "info";
  message: string;
}) {
  const isError = tone === "error";
  return (
    <div
      className="rounded-xl border px-3 py-2.5 text-[13px]"
      style={{
        borderColor: isError ? "rgba(168,64,64,0.25)" : "rgba(0,65,94,0.18)",
        background: isError ? "rgba(168,64,64,0.06)" : "rgba(0,65,94,0.06)",
        color: isError ? "#8A2E2E" : "#00415E",
        fontWeight: 520,
      }}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}

function ValueItem({ icon: Icon, text }: ValueItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E6D3B6] bg-[#F6EAD5] text-[#6A1D1F]">
        <Icon size={20} strokeWidth={1.8} />
      </div>
      <span
        className="pt-1 text-[18px] leading-[1.35] text-[#373A40] lg:text-[16px]"
        style={{ fontWeight: 520 }}
      >
        {text}
      </span>
    </div>
  );
}

function ProfileCard({
  icon: Icon,
  title,
  subtitle,
  selected = false,
  onClick,
}: ProfileCardProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
        selected
          ? "border-[#5B1112] bg-[#FFF9F6] shadow-md"
          : "border-[#111214]/10 bg-white hover:border-[#5B1112] hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-[#111214]/5 transition-colors ${
          selected
            ? "bg-[#FEF0D5] text-[#5B1112]"
            : "bg-[#F9FAFB] text-[#111214] group-hover:bg-[#FEF0D5] group-hover:text-[#5B1112]"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-semibold text-[#111214] text-lg">{title}</h3>
        <p className="text-[#111214]/50 text-sm">{subtitle}</p>
      </div>
      <div
        className={`ml-auto text-[#5B1112] transition-opacity ${
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <ArrowRight size={20} />
      </div>
    </button>
  );
}
