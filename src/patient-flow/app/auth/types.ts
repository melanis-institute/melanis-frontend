export type AuthCountryCode = "+221";
export type OtpPurpose = "login" | "signup" | "reset_pin";

export interface AuthUser {
  id: string;
  fullName: string;
  phoneE164: string;
  countryCode: AuthCountryCode;
  email?: string;
  hasPin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  trustedDevice: boolean;
}

export interface OtpChallenge {
  challengeId: string;
  phoneE164: string;
  purpose: OtpPurpose;
  expiresAt: string;
  resendAt: string;
  attemptsRemaining: number;
}

export interface AuthFlowContext {
  returnTo?: string;
  appointmentType?: "presentiel" | "video";
  date?: string;
  time?: string;
  selectedSlot?: {
    date?: string;
    time?: string;
  };
  practitioner?: {
    name?: string;
    specialty?: string;
    location?: string;
    fee?: string;
    [key: string]: unknown;
  };
  preConsultData?: unknown;
  patientProfile?: string;
  [key: string]: unknown;
}

export interface AuthDraftRecord {
  type: "signup" | "recovery";
  payload: Record<string, unknown>;
  savedAt: number;
  expiresAt: number;
}

export interface PendingAuthState {
  purpose: OtpPurpose;
  challengeId: string;
  phoneE164: string;
  createdAt: number;
  fullName?: string;
  email?: string;
  termsAccepted?: boolean;
  socialProvider?: "google" | "facebook";
  tempToken?: string;
}
