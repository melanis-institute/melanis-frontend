import { AuthAdapterError, type AuthAdapter } from "./adapter";
import type {
  CompleteOtpLoginInput,
  CreateAccountInput,
  LoginWithPinInput,
  RequestOtpInput,
  ResetPinInput,
  SetPinInput,
  VerifyOtpInput,
  VerifyOtpResult,
} from "./adapter.types";
import type { AuthSession, AuthUser, OtpChallenge } from "@portal/session/types";
import type { AuthErrorCode } from "./error.types";
import { createApiClient, isApiError } from "../api/client";
import {
  readStorageJson,
  removeStorageValue,
  writeStorageJson,
} from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";

const ERROR_CODE_MAP: Record<string, AuthErrorCode> = {
  OTP_INVALID: "OTP_INVALID",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_COOLDOWN: "OTP_RESEND_BLOCKED",
  OTP_MAX_ATTEMPTS: "OTP_ATTEMPTS_EXCEEDED",
  ACCOUNT_NOT_FOUND: "PHONE_NOT_REGISTERED",
  ACCOUNT_EXISTS: "PHONE_ALREADY_REGISTERED",
  PIN_WRONG: "PIN_INVALID",
  PIN_LOCKED: "PIN_LOCKED",
  TEMP_TOKEN_INVALID: "TEMP_TOKEN_INVALID",
  TEMP_TOKEN_EXPIRED: "TEMP_TOKEN_INVALID",
  RATE_LIMITED: "RATE_LIMITED",
  TERMS_NOT_ACCEPTED: "TERMS_REQUIRED",
};

function mapErrorCode(backendCode: string): AuthErrorCode {
  return ERROR_CODE_MAP[backendCode] ?? "UNKNOWN_ERROR";
}

function rethrowAsAuthError(err: unknown): never {
  if (isApiError(err)) {
    throw new AuthAdapterError(mapErrorCode(err.error_code), err.detail);
  }
  throw err;
}

function writeSession(session: AuthSession | null): void {
  if (!session) {
    removeStorageValue(SESSION_KEY);
    return;
  }
  writeStorageJson(SESSION_KEY, session);
}

function parseServerDate(value: string): number | null {
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const normalized = hasTimezone ? value : `${value}Z`;
  const timestamp = Date.parse(normalized);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export class BackendAuthAdapter implements AuthAdapter {
  private readonly http;

  constructor(baseUrl: string) {
    this.http = createApiClient(baseUrl);
  }

  async requestOtp(input: RequestOtpInput): Promise<OtpChallenge> {
    try {
      return await this.http.post<OtpChallenge>("/api/v1/auth/otp/request", {
        phoneE164: input.phoneE164,
        purpose: input.purpose,
        forceNew: input.forceNew,
      });
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    try {
      return await this.http.post<VerifyOtpResult>("/api/v1/auth/otp/verify", {
        challengeId: input.challengeId,
        code: input.code,
      });
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async createAccount(input: CreateAccountInput): Promise<AuthSession> {
    try {
      const session = await this.http.post<AuthSession>("/api/v1/auth/accounts", {
        tempToken: input.tempToken,
        fullName: input.fullName,
        phoneE164: input.phoneE164,
        countryCode: input.countryCode,
        email: input.email,
        termsAccepted: input.termsAccepted,
      });
      writeSession(session);
      return session;
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async setPin(input: SetPinInput): Promise<void> {
    try {
      await this.http.post<unknown>("/api/v1/auth/pin/set", {
        phoneE164: input.phoneE164,
        pin: input.pin,
        tempToken: input.tempToken,
      });
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async loginWithPin(input: LoginWithPinInput): Promise<AuthSession> {
    try {
      const session = await this.http.post<AuthSession>("/api/v1/auth/pin/login", {
        phoneE164: input.phoneE164,
        pin: input.pin,
        trustedDevice: input.trustedDevice,
      });
      writeSession(session);
      return session;
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async completeOtpLogin(input: CompleteOtpLoginInput): Promise<AuthSession> {
    try {
      const session = await this.http.post<AuthSession>("/api/v1/auth/otp/login/complete", {
        tempToken: input.tempToken,
        phoneE164: input.phoneE164,
        trustedDevice: input.trustedDevice,
      });
      writeSession(session);
      return session;
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async resetPin(input: ResetPinInput): Promise<void> {
    try {
      await this.http.post<unknown>("/api/v1/auth/pin/reset", {
        tempToken: input.tempToken,
        phoneE164: input.phoneE164,
        newPin: input.newPin,
      });
    } catch (err) {
      rethrowAsAuthError(err);
    }
  }

  async getSession(): Promise<AuthSession | null> {
    const session = readStorageJson<AuthSession | null>(SESSION_KEY, null);
    if (!session) {
      return null;
    }
    const expiresAt = parseServerDate(session.expiresAt);
    if (expiresAt === null || expiresAt <= Date.now()) {
      writeSession(null);
      return null;
    }
    return session;
  }

  async signOut(): Promise<void> {
    try {
      await this.http.post<unknown>("/api/v1/auth/logout");
    } catch {
      // Best-effort: always clear local session even if the request fails
    } finally {
      writeSession(null);
    }
  }

  async getUserByPhone(phoneE164: string): Promise<AuthUser | null> {
    try {
      return await this.http.get<AuthUser | null>("/api/v1/auth/users/by-phone", { phoneE164 });
    } catch (err) {
      if (isApiError(err) && err.status === 404) return null;
      rethrowAsAuthError(err);
    }
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      return await this.http.get<AuthUser | null>(`/api/v1/auth/users/${userId}`);
    } catch (err) {
      if (isApiError(err) && err.status === 404) return null;
      rethrowAsAuthError(err);
    }
  }
}
