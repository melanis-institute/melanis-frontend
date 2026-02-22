import {
  AuthAdapterError,
  type AuthAdapter,
  type CompleteOtpLoginInput,
  type CreateAccountInput,
  type LoginWithPinInput,
  type RequestOtpInput,
  type ResetPinInput,
  type SetPinInput,
  type VerifyOtpInput,
  type VerifyOtpResult,
} from "./adapter";
import type { AuthSession, AuthUser, OtpChallenge } from "./types";
import { isValidOtpCode, isValidPhone221, isValidPin } from "./validation";

const USERS_KEY = "melanis_auth_users_v1";
const SESSION_KEY = "melanis_auth_session_v1";
const CHALLENGES_KEY = "melanis_auth_challenges_v1";

const OTP_EXPIRY_MS = 120_000;
const OTP_RESEND_MS = 30_000;
const OTP_ATTEMPTS_MAX = 5;
const TEMP_TOKEN_EXPIRY_MS = 10 * 60_000;
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60_000;
const PIN_LOCK_MS = 5 * 60_000;

interface StoredUser extends AuthUser {
  pinHash?: string;
  pinSalt?: string;
  failedPinAttempts?: number;
  pinLockedUntil?: number;
}

interface StoredChallenge extends OtpChallenge {
  code: string;
  used: boolean;
  createdAt: number;
}

interface TempTokenRecord {
  tempToken: string;
  challengeId: string;
  phoneE164: string;
  purpose: "login" | "signup" | "reset_pin";
  expiresAt: number;
  consumed: boolean;
}

interface ChallengeStore {
  challenges: StoredChallenge[];
  tempTokens: TempTokenRecord[];
}

function hasWindow() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeRead<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  const parsed = safeParse<T>(localStorage.getItem(key));
  return parsed ?? fallback;
}

function safeWrite<T>(key: string, value: T) {
  if (!hasWindow()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function nowIso() {
  return new Date().toISOString();
}

function randomDigits(length: number) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return `${Math.floor(min + Math.random() * (max - min))}`;
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function randomToken() {
  return `${randomId("tok")}_${Math.random().toString(36).slice(2, 14)}`;
}

function readUsers(): StoredUser[] {
  return safeRead<StoredUser[]>(USERS_KEY, []);
}

function writeUsers(users: StoredUser[]) {
  safeWrite(USERS_KEY, users);
}

function readSession(): AuthSession | null {
  return safeRead<AuthSession | null>(SESSION_KEY, null);
}

function writeSession(session: AuthSession | null) {
  if (!hasWindow()) return;
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  safeWrite(SESSION_KEY, session);
}

function readChallengeStore(): ChallengeStore {
  const store = safeRead<ChallengeStore>(CHALLENGES_KEY, {
    challenges: [],
    tempTokens: [],
  });

  const now = Date.now();
  return {
    challenges: store.challenges.filter((item) => Date.parse(item.expiresAt) > now - 60_000),
    tempTokens: store.tempTokens.filter((item) => item.expiresAt > now - 60_000 && !item.consumed),
  };
}

function writeChallengeStore(store: ChallengeStore) {
  safeWrite(CHALLENGES_KEY, store);
}

async function sha256Hex(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);

  if (typeof crypto !== "undefined" && crypto.subtle) {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }

  return value;
}

async function hashPin(pin: string, salt: string) {
  return sha256Hex(`${salt}:${pin}`);
}

function ensureLocalPhone(phoneE164: string) {
  const digits = phoneE164.replace(/\D/g, "");
  const local = digits.replace(/^221/, "");
  if (!isValidPhone221(local)) {
    throw new AuthAdapterError("INVALID_PHONE", "Invalid +221 phone");
  }
  return `+221${local}`;
}

function findUserByPhone(users: StoredUser[], phoneE164: string) {
  return users.find((user) => user.phoneE164 === phoneE164) ?? null;
}

async function createSession(userId: string, trustedDevice = true): Promise<AuthSession> {
  const session: AuthSession = {
    sessionId: randomId("session"),
    userId,
    accessToken: randomToken(),
    refreshToken: randomToken(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MS).toISOString(),
    trustedDevice,
  };

  writeSession(session);
  return session;
}

function readTempTokenOrThrow(
  tempToken: string,
  expectedPurpose: "login" | "signup" | "reset_pin",
  phoneE164: string
) {
  const store = readChallengeStore();
  const token = store.tempTokens.find((entry) => entry.tempToken === tempToken);

  if (
    !token ||
    token.consumed ||
    token.expiresAt < Date.now() ||
    token.purpose !== expectedPurpose ||
    token.phoneE164 !== phoneE164
  ) {
    throw new AuthAdapterError("TEMP_TOKEN_INVALID", "Invalid verification token");
  }

  return { store, token };
}

function consumeTempToken(store: ChallengeStore, tempToken: string) {
  store.tempTokens = store.tempTokens.map((entry) =>
    entry.tempToken === tempToken ? { ...entry, consumed: true } : entry
  );
  writeChallengeStore(store);
}

export function getMockOtpCode(challengeId: string): string | null {
  const store = readChallengeStore();
  const challenge = store.challenges.find((item) => item.challengeId === challengeId);
  if (!challenge) return null;
  return challenge.code;
}

export function getMockOtpChallenge(challengeId: string): OtpChallenge | null {
  const store = readChallengeStore();
  const challenge = store.challenges.find((item) => item.challengeId === challengeId);
  if (!challenge) return null;
  return {
    challengeId: challenge.challengeId,
    phoneE164: challenge.phoneE164,
    purpose: challenge.purpose,
    expiresAt: challenge.expiresAt,
    resendAt: challenge.resendAt,
    attemptsRemaining: challenge.attemptsRemaining,
  };
}

export class MockAuthAdapter implements AuthAdapter {
  async requestOtp(input: RequestOtpInput): Promise<OtpChallenge> {
    const phoneE164 = ensureLocalPhone(input.phoneE164);
    const store = readChallengeStore();

    const activeChallenge = store.challenges.find(
      (entry) =>
        entry.phoneE164 === phoneE164 &&
        entry.purpose === input.purpose &&
        !entry.used &&
        Date.parse(entry.expiresAt) > Date.now()
    );

    if (activeChallenge && !input.forceNew) {
      return activeChallenge;
    }

    if (activeChallenge && Date.parse(activeChallenge.resendAt) > Date.now()) {
      throw new AuthAdapterError("OTP_RESEND_BLOCKED", "Resend cooldown active", {
        resendAt: activeChallenge.resendAt,
      });
    }

    const createdAt = Date.now();
    const challenge: StoredChallenge = {
      challengeId: randomId("otp"),
      phoneE164,
      purpose: input.purpose,
      expiresAt: new Date(createdAt + OTP_EXPIRY_MS).toISOString(),
      resendAt: new Date(createdAt + OTP_RESEND_MS).toISOString(),
      attemptsRemaining: OTP_ATTEMPTS_MAX,
      code: randomDigits(6),
      used: false,
      createdAt,
    };

    store.challenges = [challenge, ...store.challenges].slice(0, 20);
    writeChallengeStore(store);

    return challenge;
  }

  async verifyOtp(input: VerifyOtpInput): Promise<VerifyOtpResult> {
    if (!isValidOtpCode(input.code)) {
      throw new AuthAdapterError("OTP_INVALID", "OTP format invalid", {
        attemptsRemaining: OTP_ATTEMPTS_MAX,
      });
    }

    const store = readChallengeStore();
    const challenge = store.challenges.find((entry) => entry.challengeId === input.challengeId);

    if (!challenge) {
      throw new AuthAdapterError("OTP_EXPIRED", "OTP challenge missing");
    }

    if (challenge.attemptsRemaining <= 0) {
      throw new AuthAdapterError("OTP_ATTEMPTS_EXCEEDED", "OTP attempts exceeded");
    }

    if (Date.parse(challenge.expiresAt) < Date.now()) {
      throw new AuthAdapterError("OTP_EXPIRED", "OTP expired");
    }

    if (challenge.code !== input.code) {
      challenge.attemptsRemaining -= 1;
      writeChallengeStore(store);

      throw new AuthAdapterError("OTP_INVALID", "OTP mismatch", {
        attemptsRemaining: challenge.attemptsRemaining,
      });
    }

    challenge.used = true;
    challenge.attemptsRemaining = Math.max(0, challenge.attemptsRemaining);

    const tempToken = randomToken();
    const tokenRecord: TempTokenRecord = {
      tempToken,
      challengeId: challenge.challengeId,
      phoneE164: challenge.phoneE164,
      purpose: challenge.purpose,
      expiresAt: Date.now() + TEMP_TOKEN_EXPIRY_MS,
      consumed: false,
    };

    store.tempTokens = [tokenRecord, ...store.tempTokens].slice(0, 30);
    writeChallengeStore(store);

    const userExists = Boolean(findUserByPhone(readUsers(), challenge.phoneE164));

    return {
      verified: true,
      userExists,
      tempToken,
    };
  }

  async createAccount(input: CreateAccountInput): Promise<AuthUser> {
    if (!input.termsAccepted) {
      throw new AuthAdapterError("TERMS_REQUIRED", "Terms must be accepted");
    }

    const phoneE164 = ensureLocalPhone(input.phoneE164);
    readTempTokenOrThrow(input.tempToken, "signup", phoneE164);

    const users = readUsers();
    if (findUserByPhone(users, phoneE164)) {
      throw new AuthAdapterError("PHONE_ALREADY_REGISTERED", "Phone already exists");
    }

    const user: StoredUser = {
      id: randomId("user"),
      fullName: input.fullName.trim(),
      phoneE164,
      countryCode: "+221",
      email: input.email?.trim() || undefined,
      hasPin: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      failedPinAttempts: 0,
    };

    users.push(user);
    writeUsers(users);

    return user;
  }

  async setPin(input: SetPinInput): Promise<void> {
    const phoneE164 = ensureLocalPhone(input.phoneE164);

    if (!isValidPin(input.pin)) {
      throw new AuthAdapterError("PIN_WEAK", "PIN format invalid");
    }

    if (input.tempToken) {
      const { store } = readTempTokenOrThrow(input.tempToken, "signup", phoneE164);
      consumeTempToken(store, input.tempToken);
    }

    const users = readUsers();
    const user = findUserByPhone(users, phoneE164);

    if (!user) {
      throw new AuthAdapterError("PHONE_NOT_REGISTERED", "Unknown phone");
    }

    const salt = randomToken();
    const pinHash = await hashPin(input.pin, salt);

    user.pinSalt = salt;
    user.pinHash = pinHash;
    user.hasPin = true;
    user.failedPinAttempts = 0;
    user.pinLockedUntil = undefined;
    user.updatedAt = nowIso();

    writeUsers(users);
  }

  async loginWithPin(input: LoginWithPinInput): Promise<AuthSession> {
    const phoneE164 = ensureLocalPhone(input.phoneE164);

    if (!isValidPin(input.pin)) {
      throw new AuthAdapterError("PIN_WEAK", "PIN format invalid");
    }

    const users = readUsers();
    const user = findUserByPhone(users, phoneE164);

    if (!user) {
      throw new AuthAdapterError("PHONE_NOT_REGISTERED", "Unknown phone");
    }

    if (!user.hasPin || !user.pinHash || !user.pinSalt) {
      throw new AuthAdapterError("PIN_NOT_SET", "No pin configured");
    }

    const lockUntil = user.pinLockedUntil ?? 0;
    if (lockUntil > Date.now()) {
      throw new AuthAdapterError("PIN_LOCKED", "PIN temporarily locked", {
        retryAt: new Date(lockUntil).toISOString(),
      });
    }

    const hash = await hashPin(input.pin, user.pinSalt);
    if (hash !== user.pinHash) {
      const currentAttempts = user.failedPinAttempts ?? 0;
      const nextAttempts = currentAttempts + 1;
      user.failedPinAttempts = nextAttempts;

      const maxAttempts = 5;
      const attemptsRemaining = Math.max(0, maxAttempts - nextAttempts);
      if (attemptsRemaining === 0) {
        user.pinLockedUntil = Date.now() + PIN_LOCK_MS;
        user.failedPinAttempts = 0;
      }

      writeUsers(users);

      throw new AuthAdapterError(
        attemptsRemaining === 0 ? "PIN_LOCKED" : "PIN_INVALID",
        "PIN mismatch",
        { attemptsRemaining }
      );
    }

    user.failedPinAttempts = 0;
    user.pinLockedUntil = undefined;
    writeUsers(users);

    return createSession(user.id, input.trustedDevice ?? true);
  }

  async completeOtpLogin(input: CompleteOtpLoginInput): Promise<AuthSession> {
    const phoneE164 = ensureLocalPhone(input.phoneE164);

    const { store } = readTempTokenOrThrow(input.tempToken, "login", phoneE164);
    const users = readUsers();
    const user = findUserByPhone(users, phoneE164);

    if (!user) {
      throw new AuthAdapterError("PHONE_NOT_REGISTERED", "Unknown phone");
    }

    consumeTempToken(store, input.tempToken);
    return createSession(user.id, input.trustedDevice ?? true);
  }

  async resetPin(input: ResetPinInput): Promise<void> {
    const phoneE164 = ensureLocalPhone(input.phoneE164);

    if (!isValidPin(input.newPin)) {
      throw new AuthAdapterError("PIN_WEAK", "PIN format invalid");
    }

    const { store } = readTempTokenOrThrow(input.tempToken, "reset_pin", phoneE164);

    const users = readUsers();
    const user = findUserByPhone(users, phoneE164);

    if (!user) {
      throw new AuthAdapterError("PHONE_NOT_REGISTERED", "Unknown phone");
    }

    const salt = randomToken();
    user.pinSalt = salt;
    user.pinHash = await hashPin(input.newPin, salt);
    user.hasPin = true;
    user.failedPinAttempts = 0;
    user.pinLockedUntil = undefined;
    user.updatedAt = nowIso();

    writeUsers(users);
    consumeTempToken(store, input.tempToken);
  }

  async getSession(): Promise<AuthSession | null> {
    const session = readSession();
    if (!session) return null;

    if (Date.parse(session.expiresAt) <= Date.now()) {
      writeSession(null);
      return null;
    }

    return session;
  }

  async signOut(): Promise<void> {
    writeSession(null);
  }

  async getUserByPhone(phoneE164: string): Promise<AuthUser | null> {
    const normalized = ensureLocalPhone(phoneE164);
    return findUserByPhone(readUsers(), normalized);
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    return readUsers().find((user) => user.id === userId) ?? null;
  }
}

export const mockAuthAdapter = new MockAuthAdapter();
