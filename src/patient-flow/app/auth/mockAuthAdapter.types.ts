import type { AuthUser, OtpChallenge } from "./types";

export interface StoredUser extends AuthUser {
  pinHash?: string;
  pinSalt?: string;
  failedPinAttempts?: number;
  pinLockedUntil?: number;
}

export interface StoredChallenge extends OtpChallenge {
  code: string;
  used: boolean;
  createdAt: number;
}

export interface TempTokenRecord {
  tempToken: string;
  challengeId: string;
  phoneE164: string;
  purpose: "login" | "signup" | "reset_pin";
  expiresAt: number;
  consumed: boolean;
}

export interface ChallengeStore {
  challenges: StoredChallenge[];
  tempTokens: TempTokenRecord[];
}
