import type {
  AuthCountryCode,
  AuthSession,
  OtpChallenge,
  OtpPurpose,
} from "./types";

export interface RequestOtpInput {
  phoneE164: string;
  purpose: OtpPurpose;
  forceNew?: boolean;
}

export interface VerifyOtpInput {
  challengeId: string;
  code: string;
}

export interface VerifyOtpResult {
  verified: true;
  userExists: boolean;
  tempToken: string;
}

export interface CreateAccountInput {
  tempToken: string;
  fullName: string;
  phoneE164: string;
  countryCode: AuthCountryCode;
  email?: string;
  termsAccepted: boolean;
}

export interface SetPinInput {
  phoneE164: string;
  pin: string;
  tempToken?: string;
}

export interface LoginWithPinInput {
  phoneE164: string;
  pin: string;
  trustedDevice?: boolean;
}

export interface CompleteOtpLoginInput {
  tempToken: string;
  phoneE164: string;
  trustedDevice?: boolean;
}

export interface ResetPinInput {
  tempToken: string;
  phoneE164: string;
  newPin: string;
}

export interface AuthAdapter {
  requestOtp(input: RequestOtpInput): Promise<OtpChallenge>;
  verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult>;
  createAccount(input: CreateAccountInput): Promise<AuthSession>;
  setPin(input: SetPinInput): Promise<void>;
  loginWithPin(input: LoginWithPinInput): Promise<AuthSession>;
  completeOtpLogin(input: CompleteOtpLoginInput): Promise<AuthSession>;
  resetPin(input: ResetPinInput): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  signOut(): Promise<void>;
  getUserByPhone(phoneE164: string): Promise<AuthUser | null>;
  getUserById(userId: string): Promise<AuthUser | null>;
}
