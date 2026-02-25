import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import type { ConsentRecord } from "../account/types";
import {
  RequireActingProfile,
  RequireActiveRole,
  RequireAuth,
  RequireConsent,
  RequireRole,
} from "./guards";
import { AuthContext } from "../auth/AuthProvider";
import { makeAuthContextValue } from "../../../test/renderWithAuthRouter";

const session = {
  sessionId: "s_1",
  userId: "u1",
  accessToken: "token",
  refreshToken: "refresh",
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
  trustedDevice: true,
} as const;

const user = {
  id: "u1",
  fullName: "Fatou Diop",
  phoneE164: "+221771234567",
  countryCode: "+221" as const,
  roles: ["patient"] as const,
  hasPin: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function pendingConsent(): ConsentRecord {
  const now = new Date().toISOString();
  return {
    id: "consent_1",
    profileId: "profile_1",
    type: "medical_record",
    title: "Accès au dossier médical",
    version: "v1.0",
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
}

describe("route guards", () => {
  it("redirects unauthenticated users to login", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: false,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/private"]}>
          <Routes>
            <Route path="/patient-flow/auth/connexion" element={<div>Login page</div>} />
            <Route path="/private" element={<RequireAuth />}>
              <Route index element={<div>Private page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("blocks booking routes when no acting profile is selected", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: true,
      session,
      user,
      actingProfileId: null,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/booking"]}>
          <Routes>
            <Route path="/patient-flow/account/select-profile" element={<div>Select profile</div>} />
            <Route path="/booking" element={<RequireActingProfile />}>
              <Route index element={<div>Booking page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Select profile")).toBeInTheDocument();
  });

  it("redirects to role selection when active role is missing", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: true,
      session,
      user,
      activeRole: null,
      availableRoles: ["patient", "practitioner"],
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/protected-role"]}>
          <Routes>
            <Route path="/patient-flow/auth/select-role" element={<div>Select role</div>} />
            <Route path="/protected-role" element={<RequireActiveRole />}>
              <Route index element={<div>Role protected</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Select role")).toBeInTheDocument();
  });

  it("blocks practitioner routes for non-practitioner active roles", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: true,
      session,
      user,
      activeRole: "staff",
      availableRoles: ["staff"],
      resolvePostAuthRoute: () => "/patient-flow/staff",
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/practitioner-only"]}>
          <Routes>
            <Route path="/patient-flow/staff" element={<div>Staff home</div>} />
            <Route path="/practitioner-only" element={<RequireRole allowedRoles={["practitioner"]} />}>
              <Route index element={<div>Practitioner page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Staff home")).toBeInTheDocument();
  });

  it("redirects to consent detail when consent exists but is not signed", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: true,
      session,
      user,
      actingProfileId: "profile_1",
      consentSnapshot: {
        medical_record: pendingConsent(),
      },
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/protected" element={<RequireConsent consentType="medical_record" />}>
              <Route index element={<div>Protected action</div>} />
            </Route>
            <Route
              path="/patient-flow/account/consents/consent_1"
              element={<div>Consent detail</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Consent detail")).toBeInTheDocument();
  });

  it("redirects to consent list when consent snapshot is missing", async () => {
    const authValue = makeAuthContextValue({
      isAuthReady: true,
      isAuthenticated: true,
      session,
      user,
      actingProfileId: "profile_1",
      consentSnapshot: {},
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/protected" element={<RequireConsent consentType="medical_record" />}>
              <Route index element={<div>Protected action</div>} />
            </Route>
            <Route path="/patient-flow/account/consents" element={<div>Consent center</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText("Consent center")).toBeInTheDocument();
  });
});
