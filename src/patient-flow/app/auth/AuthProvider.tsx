/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthFlowContext, AuthSession, AuthUser } from "./types";
import type { AuthContextValue } from "./provider.types";
import {
  clearFlowContext,
  loadFlowContext,
  resolvePostAuthRoute,
  saveFlowContext,
} from "./flow";
import { mockAuthAdapter } from "./mockAuthAdapter";
import { mockAccountAdapter } from "../account/mockAccountAdapter";
import type {
  ConsentRecord,
  ConsentSnapshot,
  PatientProfileRecord,
} from "../account/types";
import {
  hasPatientWorkspaceAccess,
  isUserRole,
  normalizeRoles,
  type UserRole,
} from "./roles";
import { mockAppointmentAdapter } from "../appointments/mockAppointmentAdapter";

const ACTING_PROFILE_KEY = "melanis_acting_profile_id_v1";
const ACTIVE_ROLE_KEY = "melanis_active_role_v1";

function hasWindow() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readActingProfileId() {
  if (!hasWindow()) return null;
  return localStorage.getItem(ACTING_PROFILE_KEY);
}

function writeActingProfileId(profileId: string | null) {
  if (!hasWindow()) return;
  if (!profileId) {
    localStorage.removeItem(ACTING_PROFILE_KEY);
    return;
  }
  localStorage.setItem(ACTING_PROFILE_KEY, profileId);
}

function readActiveRole(): UserRole | null {
  if (!hasWindow()) return null;
  const raw = localStorage.getItem(ACTIVE_ROLE_KEY);
  return isUserRole(raw) ? raw : null;
}

function writeActiveRole(role: UserRole | null) {
  if (!hasWindow()) return;
  if (!role) {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_ROLE_KEY, role);
}

function buildConsentSnapshot(consents: ConsentRecord[]): ConsentSnapshot {
  return consents.reduce<ConsentSnapshot>((acc, consent) => {
    acc[consent.type] = consent;
    return acc;
  }, {});
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [profiles, setProfiles] = useState<PatientProfileRecord[]>([]);
  const [actingProfileId, setActingProfileIdState] = useState<string | null>(() =>
    readActingProfileId(),
  );
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => readActiveRole());
  const [consentSnapshot, setConsentSnapshot] = useState<ConsentSnapshot>({});
  const [flowContext, setFlowContextState] = useState<AuthFlowContext | null>(() =>
    loadFlowContext(),
  );

  const availableRoles = useMemo(
    () => (user ? normalizeRoles(user.roles) : []),
    [user],
  );

  const refreshFromStorage = useCallback(async () => {
    const storedSession = await mockAuthAdapter.getSession();
    setSession(storedSession);

    if (!storedSession) {
      setUser(null);
      return;
    }

    const sessionUser = await mockAuthAdapter.getUserById(storedSession.userId);
    setUser(sessionUser);

    if (!sessionUser) {
      setSession(null);
    }
  }, []);

  const loadProfilesForUser = useCallback(
    async (nextUser: AuthUser) => {
      setIsAccountLoading(true);

      try {
        const roles = normalizeRoles(nextUser.roles);

        if (!hasPatientWorkspaceAccess(roles)) {
          setProfiles([]);
          setConsentSnapshot({});
          setActingProfileIdState(null);
          writeActingProfileId(null);
          return;
        }

        await mockAccountAdapter.ensureSelfProfile({
          userId: nextUser.id,
          fullName: nextUser.fullName,
        });

        const nextProfiles = await mockAccountAdapter.listProfiles(nextUser.id);
        setProfiles(nextProfiles);

        const activeProfile = nextProfiles.find((profile) => profile.id === actingProfileId);
        const resolvedProfileId =
          activeProfile?.id ??
          (nextProfiles.length === 1 ? nextProfiles[0].id : null);

        setActingProfileIdState(resolvedProfileId);
        writeActingProfileId(resolvedProfileId);
      } finally {
        setIsAccountLoading(false);
      }
    },
    [actingProfileId],
  );

  const refreshAccountData = useCallback(async () => {
    if (!user || !session) {
      setProfiles([]);
      setConsentSnapshot({});
      return;
    }

    await loadProfilesForUser(user);
  }, [loadProfilesForUser, session, user]);

  const refreshConsentSnapshot = useCallback(
    async (profileId?: string | null) => {
      const targetProfileId = profileId ?? actingProfileId;
      if (!session || !user || !targetProfileId) {
        setConsentSnapshot({});
        return;
      }

      const consents = await mockAccountAdapter.listConsents(user.id, targetProfileId);
      setConsentSnapshot(buildConsentSnapshot(consents));
    },
    [actingProfileId, session, user],
  );

  const clearActiveRole = useCallback(() => {
    setActiveRoleState(null);
    writeActiveRole(null);
  }, []);

  const login = useCallback(
    async (nextSession: AuthSession) => {
      setSession(nextSession);
      const sessionUser = await mockAuthAdapter.getUserById(nextSession.userId);
      setUser(sessionUser);
      clearActiveRole();

      if (sessionUser) {
        await loadProfilesForUser(sessionUser);
      }
    },
    [clearActiveRole, loadProfilesForUser],
  );

  const logout = useCallback(async () => {
    await mockAuthAdapter.signOut();
    setSession(null);
    setUser(null);
    setProfiles([]);
    setConsentSnapshot({});
    setActingProfileIdState(null);
    writeActingProfileId(null);
    clearActiveRole();
  }, [clearActiveRole]);

  const setFlowContext = useCallback((context: AuthFlowContext | null) => {
    setFlowContextState(context);
    saveFlowContext(context);
  }, []);

  const setActingProfile = useCallback(
    async (profileId: string | null) => {
      if (!profileId) {
        setActingProfileIdState(null);
        setConsentSnapshot({});
        writeActingProfileId(null);
        return;
      }

      const exists = profiles.some((profile) => profile.id === profileId);
      if (!exists) {
        throw new Error("Profil patient inaccessible");
      }

      setActingProfileIdState(profileId);
      writeActingProfileId(profileId);

      if (user) {
        await mockAccountAdapter.recordProfileSwitch(user.id, profileId);
        await refreshConsentSnapshot(profileId);
      }
    },
    [profiles, refreshConsentSnapshot, user],
  );

  const clearActingProfile = useCallback(() => {
    setActingProfileIdState(null);
    setConsentSnapshot({});
    writeActingProfileId(null);
  }, []);

  const setActiveRole = useCallback(
    (role: UserRole) => {
      if (!availableRoles.includes(role)) {
        throw new Error("Rôle inaccessible pour cette session");
      }

      setActiveRoleState(role);
      writeActiveRole(role);
    },
    [availableRoles],
  );

  const clearBookingFlowContext = useCallback(() => {
    setFlowContextState(null);
    clearFlowContext();
  }, []);

  const resolveRoute = useCallback(
    (context?: AuthFlowContext | null) =>
      resolvePostAuthRoute(context ?? flowContext, {
        availableRoles,
        activeRole,
      }),
    [flowContext, availableRoles, activeRole],
  );

  useEffect(() => {
    void refreshFromStorage().finally(() => setIsAuthReady(true));
  }, [refreshFromStorage]);

  useEffect(() => {
    if (!session || !user) {
      setProfiles([]);
      setConsentSnapshot({});
      if (isAuthReady) {
        clearActingProfile();
        clearActiveRole();
      }
      return;
    }

    void loadProfilesForUser(user);
  }, [clearActingProfile, clearActiveRole, isAuthReady, loadProfilesForUser, session, user]);

  useEffect(() => {
    if (!session || !user) {
      return;
    }

    if (activeRole && !availableRoles.includes(activeRole)) {
      clearActiveRole();
      return;
    }

    if (!activeRole && availableRoles.length === 1) {
      setActiveRole(availableRoles[0]);
    }
  }, [activeRole, availableRoles, clearActiveRole, session, setActiveRole, user]);

  useEffect(() => {
    void refreshConsentSnapshot();
  }, [refreshConsentSnapshot]);

  const actingProfile = useMemo(
    () => profiles.find((profile) => profile.id === actingProfileId) ?? null,
    [actingProfileId, profiles],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      adapter: mockAuthAdapter,
      accountAdapter: mockAccountAdapter,
      appointmentAdapter: mockAppointmentAdapter,
      session,
      user,
      isAuthenticated: Boolean(session && user),
      isAuthReady,
      isAccountLoading,
      flowContext,
      profiles,
      actingProfileId,
      actingProfile,
      activeRole,
      availableRoles,
      consentSnapshot,
      login,
      logout,
      refreshFromStorage,
      refreshAccountData,
      refreshConsentSnapshot,
      setActingProfile,
      clearActingProfile,
      setActiveRole,
      clearActiveRole,
      setFlowContext,
      clearBookingFlowContext,
      resolvePostAuthRoute: resolveRoute,
    }),
    [
      actingProfile,
      actingProfileId,
      activeRole,
      availableRoles,
      consentSnapshot,
      flowContext,
      isAccountLoading,
      isAuthReady,
      login,
      logout,
      profiles,
      refreshFromStorage,
      refreshAccountData,
      refreshConsentSnapshot,
      setActingProfile,
      clearActingProfile,
      setActiveRole,
      clearActiveRole,
      resolveRoute,
      session,
      user,
      setFlowContext,
      clearBookingFlowContext,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
