import type {
  AuthDraftRecord,
  AuthDraftType,
  AuthFlowContext,
  PendingAuthState,
} from "./types";
import type { UserRole } from "./roles";
import { normalizeRoles, roleHomeRoute } from "./roles";

const FLOW_CONTEXT_KEY = "melanis_auth_flow_context_v1";
const PENDING_AUTH_KEY = "melanis_auth_pending_v1";
const DRAFTS_KEY = "melanis_auth_drafts_v1";
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

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

function safeWrite(key: string, value: unknown) {
  if (!hasWindow()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function safeRemove(key: string) {
  if (!hasWindow()) return;
  localStorage.removeItem(key);
}

export function isBookingFlowContext(value: unknown): value is AuthFlowContext {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.appointmentType === "string" ||
    typeof record.date === "string" ||
    typeof record.time === "string" ||
    record.selectedSlot != null ||
    record.preConsultData != null
  );
}

export function toFlowContext(value: unknown): AuthFlowContext | null {
  if (!isBookingFlowContext(value)) return null;
  const incoming = value as AuthFlowContext;

  return {
    returnTo: incoming.returnTo ?? "/patient-flow/confirmation-succes",
    ...incoming,
  };
}

export function loadFlowContext(): AuthFlowContext | null {
  if (!hasWindow()) return null;
  return safeParse<AuthFlowContext>(localStorage.getItem(FLOW_CONTEXT_KEY));
}

export function saveFlowContext(context: AuthFlowContext | null) {
  if (!context) {
    safeRemove(FLOW_CONTEXT_KEY);
    return;
  }

  safeWrite(FLOW_CONTEXT_KEY, context);
}

export function clearFlowContext() {
  safeRemove(FLOW_CONTEXT_KEY);
}

interface ResolvePostAuthRouteOptions {
  availableRoles?: UserRole[];
  activeRole?: UserRole | null;
}

export function resolvePostAuthRoute(
  _flowContext: AuthFlowContext | null,
  options?: ResolvePostAuthRouteOptions,
): string {
  void _flowContext;
  const availableRoles = normalizeRoles(options?.availableRoles);

  if (
    options?.activeRole &&
    availableRoles.includes(options.activeRole)
  ) {
    return roleHomeRoute(options.activeRole);
  }

  if (availableRoles.length > 1) {
    return "/patient-flow/auth/select-role";
  }

  return roleHomeRoute(availableRoles[0]);
}

export function savePendingAuthState(state: PendingAuthState) {
  safeWrite(PENDING_AUTH_KEY, state);
}

export function loadPendingAuthState(): PendingAuthState | null {
  if (!hasWindow()) return null;

  const data = safeParse<PendingAuthState>(localStorage.getItem(PENDING_AUTH_KEY));
  if (!data) return null;

  const maxAgeMs = 20 * 60 * 1000;
  if (Date.now() - data.createdAt > maxAgeMs) {
    clearPendingAuthState();
    return null;
  }

  return data;
}

export function clearPendingAuthState() {
  safeRemove(PENDING_AUTH_KEY);
}

function readDrafts(): Record<string, AuthDraftRecord> {
  if (!hasWindow()) return {};
  const raw = safeParse<Record<string, AuthDraftRecord>>(localStorage.getItem(DRAFTS_KEY));
  if (!raw) return {};

  const now = Date.now();
  const cleanedEntries = Object.entries(raw).filter(([, draft]) => draft.expiresAt > now);
  const cleaned = Object.fromEntries(cleanedEntries);

  if (Object.keys(cleaned).length !== Object.keys(raw).length) {
    safeWrite(DRAFTS_KEY, cleaned);
  }

  return cleaned;
}

function writeDrafts(drafts: Record<string, AuthDraftRecord>) {
  safeWrite(DRAFTS_KEY, drafts);
}

export function saveAuthDraft(type: AuthDraftType, payload: Record<string, unknown>) {
  const drafts = readDrafts();
  const now = Date.now();
  drafts[type] = {
    type,
    payload,
    savedAt: now,
    expiresAt: now + DRAFT_TTL_MS,
  };
  writeDrafts(drafts);
}

export function loadAuthDraft(type: AuthDraftType): AuthDraftRecord | null {
  const drafts = readDrafts();
  return drafts[type] ?? null;
}

export function clearAuthDraft(type: AuthDraftType) {
  const drafts = readDrafts();
  if (!drafts[type]) return;
  delete drafts[type];
  writeDrafts(drafts);
}

export function getDraftStatuses() {
  const drafts = readDrafts();
  return {
    signup: Boolean(drafts.signup),
    recovery: Boolean(drafts.recovery),
  };
}

export function formatDraftAge(savedAt: number): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
  if (diffSeconds < 60) {
    return `${diffSeconds} sec`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} h`;
}
