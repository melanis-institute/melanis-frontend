import { render } from "@testing-library/react";
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from "react-router";
import { mockAccountAdapter } from "@portal/domains/account/mockAccountAdapter";
import { mockAppointmentAdapter } from "@portal/domains/appointments/mockAppointmentAdapter";
import { AuthContext } from "@portal/session/AuthProvider";
import { mockAuthAdapter } from "@portal/domains/auth/mockAuthAdapter";
import type { AuthContextValue } from "@portal/session/provider.types";

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export function makeAuthContextValue(
  overrides: DeepPartial<AuthContextValue> = {},
): AuthContextValue {
  const base: AuthContextValue = {
    adapter: mockAuthAdapter,
    accountAdapter: mockAccountAdapter,
    appointmentAdapter: mockAppointmentAdapter,
    session: null,
    user: null,
    isAuthenticated: false,
    isAuthReady: true,
    isAccountLoading: false,
    flowContext: null,
    profiles: [],
    actingProfileId: null,
    actingProfile: null,
    activeRole: null,
    availableRoles: ["patient"],
    consentSnapshot: {},
    login: async () => undefined,
    logout: async () => undefined,
    refreshFromStorage: async () => undefined,
    refreshAccountData: async () => undefined,
    refreshConsentSnapshot: async () => undefined,
    setActingProfile: async () => undefined,
    clearActingProfile: () => undefined,
    setActiveRole: () => undefined,
    clearActiveRole: () => undefined,
    setFlowContext: () => undefined,
    clearBookingFlowContext: () => undefined,
    resolvePostAuthRoute: () => "/patient-flow/auth/dashboard",
  };

  return {
    ...base,
    ...overrides,
  } as AuthContextValue;
}

export function renderWithAuthRouter(options: {
  routes: RouteObject[];
  initialEntries?: string[];
  authOverrides?: DeepPartial<AuthContextValue>;
}) {
  const authValue = makeAuthContextValue(options.authOverrides);
  const router = createMemoryRouter(
    [
      {
        element: (
          <AuthContext.Provider value={authValue}>
            <Outlet />
          </AuthContext.Provider>
        ),
        children: options.routes,
      },
    ],
    {
      initialEntries: options.initialEntries ?? ["/"],
    },
  );

  return {
    authValue,
    router,
    ...render(<RouterProvider router={router} />),
  };
}
