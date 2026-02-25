import type { BookingFlowContext } from "../types/flow";
import type { UserRole } from "./roles";

export type AuthCountryCode = "+221";
export type OtpPurpose = "login" | "signup" | "reset_pin";
export type AuthSocialProvider = "google" | "facebook";
export type AuthDraftType = "signup" | "recovery";

export interface AuthUser {
  id: string;
  fullName: string;
  phoneE164: string;
  countryCode: AuthCountryCode;
  email?: string;
  roles: UserRole[];
  practitionerId?: string;
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

export type AuthFlowContext = BookingFlowContext;

export interface AuthDraftRecord {
  type: AuthDraftType;
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
  socialProvider?: AuthSocialProvider;
  tempToken?: string;
}
