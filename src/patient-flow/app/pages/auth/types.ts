import type {
  AuthSocialProvider,
  OtpPurpose,
  PendingAuthState,
} from "../../auth/types";
import type { PatientProfile } from "../../types/flow";
import type { LucideIcon } from "lucide-react";

export interface AuthLocationState {
  prefillPhone?: string;
  socialProvider?: AuthSocialProvider;
  flowContext?: unknown;
  resetSuccess?: boolean;
  resumeDraft?: boolean;
}

export type VerificationMode = OtpPurpose;

export type PinMode = "setup" | "login" | "reset";

export interface PinRouteState {
  phoneE164?: string;
  tempToken?: string;
}

export interface AuthDraftStatuses {
  signup: boolean;
  recovery: boolean;
}

export type AuthProfileOptionKey = PatientProfile;

export interface AuthProfileOption {
  key: AuthProfileOptionKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}

export interface AuthLoginStepDescriptor {
  id: "phone" | "verify" | "access";
  title: string;
  description: string;
}

export const LOGIN_STEP_DESCRIPTORS: ReadonlyArray<AuthLoginStepDescriptor> = [
  {
    id: "phone",
    title: "Numéro + méthode",
    description: "Entrez votre numéro puis choisissez OTP ou PIN.",
  },
  {
    id: "verify",
    title: "Vérification",
    description: "Validez le code OTP ou votre PIN 4 chiffres.",
  },
  {
    id: "access",
    title: "Accès au profil",
    description: "Choisissez le profil patient puis poursuivez le parcours.",
  },
];

export type VerificationRouteState = PendingAuthState | null;
