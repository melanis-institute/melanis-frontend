import { render } from "@testing-library/react";
import { Outlet, RouterProvider, createMemoryRouter, type RouteObject } from "react-router";
import { AuthContext } from "../patient-flow/app/auth/AuthProvider";
import { mockAccountAdapter } from "../patient-flow/app/account/mockAccountAdapter";
import { mockAppointmentAdapter } from "../patient-flow/app/appointments/mockAppointmentAdapter";
import { mockAuthAdapter } from "../patient-flow/app/auth/mockAuthAdapter";
import type { AuthContextValue } from "../patient-flow/app/auth/provider.types";

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
