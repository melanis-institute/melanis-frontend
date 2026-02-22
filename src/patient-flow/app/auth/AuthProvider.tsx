/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthAdapter } from "./adapter";
import type { AuthFlowContext, AuthSession, AuthUser } from "./types";
import {
  clearFlowContext,
  loadFlowContext,
  resolvePostAuthRoute,
  saveFlowContext,
} from "./flow";
import { mockAuthAdapter } from "./mockAuthAdapter";

interface AuthContextValue {
  adapter: AuthAdapter;
  session: AuthSession | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  flowContext: AuthFlowContext | null;
  login: (nextSession: AuthSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshFromStorage: () => Promise<void>;
  setFlowContext: (context: AuthFlowContext | null) => void;
  clearBookingFlowContext: () => void;
  resolvePostAuthRoute: (context?: AuthFlowContext | null) => string;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [flowContext, setFlowContextState] = useState<AuthFlowContext | null>(() =>
    loadFlowContext()
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
  }, []);

  const login = useCallback(async (nextSession: AuthSession) => {
    setSession(nextSession);
    const sessionUser = await mockAuthAdapter.getUserById(nextSession.userId);
    setUser(sessionUser);
  }, []);

  const logout = useCallback(async () => {
    await mockAuthAdapter.signOut();
    setSession(null);
    setUser(null);
  }, []);

  const setFlowContext = useCallback((context: AuthFlowContext | null) => {
    setFlowContextState(context);
    saveFlowContext(context);
  }, []);

  const clearBookingFlowContext = useCallback(() => {
    setFlowContextState(null);
    clearFlowContext();
  }, []);

  const resolveRoute = useCallback(
    (context?: AuthFlowContext | null) => resolvePostAuthRoute(context ?? flowContext),
    [flowContext]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshFromStorage();
  }, [refreshFromStorage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      adapter: mockAuthAdapter,
      session,
      user,
      isAuthenticated: Boolean(session && user),
      flowContext,
      login,
      logout,
      refreshFromStorage,
      setFlowContext,
      clearBookingFlowContext,
      resolvePostAuthRoute: resolveRoute,
    }),
    [
      session,
      user,
      flowContext,
      login,
      logout,
      refreshFromStorage,
      setFlowContext,
      clearBookingFlowContext,
      resolveRoute,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
