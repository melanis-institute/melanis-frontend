import type { AuthErrorCode } from "./error.types";

export class AuthAdapterError extends Error {
  code: AuthErrorCode;
  meta?: Record<string, unknown>;

  constructor(code: AuthErrorCode, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = "AuthAdapterError";
    this.code = code;
    this.meta = meta;
  }
}

export type { AuthErrorCode } from "./error.types";
export type {
  AuthAdapter,
  CompleteOtpLoginInput,
  CreateAccountInput,
  LoginWithPinInput,
  RequestOtpInput,
  ResetPinInput,
  SetPinInput,
  VerifyOtpInput,
  VerifyOtpResult,
} from "./adapter.types";
