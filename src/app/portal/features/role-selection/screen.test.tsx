import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import type * as ReactRouterModule from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../../session/AuthProvider";
import { makeAuthContextValue } from "../../../../test/renderWithAuthRouter";
import AU12SelectRole from "./screen";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof ReactRouterModule>("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const user = {
  id: "u1",
  fullName: "Dr. Mariama Sy",
  phoneE164: "+221770000006",
  countryCode: "+221" as const,
  roles: ["patient", "practitioner"] as const,
  practitionerId: "prac_dr_mariama_sy",
  hasPin: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe("AU12SelectRole", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("sets active role and navigates to practitioner workspace", async () => {
    const setActiveRole = vi.fn();
    const authValue = makeAuthContextValue({
      isAuthenticated: true,
      isAuthReady: true,
      user,
      availableRoles: ["patient", "practitioner"],
      activeRole: null,
      setActiveRole,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <AU12SelectRole />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await userEvent.click(screen.getByRole("button", { name: /praticien/i }));

    expect(setActiveRole).toHaveBeenCalledWith("practitioner");
    expect(mockNavigate).toHaveBeenCalledWith("/patient-flow/practitioner", { replace: true });
  });

  it("auto-selects and redirects for single-role accounts", async () => {
    const setActiveRole = vi.fn();
    const authValue = makeAuthContextValue({
      isAuthenticated: true,
      isAuthReady: true,
      user: {
        ...user,
        roles: ["staff"],
        practitionerId: undefined,
      },
      availableRoles: ["staff"],
      activeRole: null,
      setActiveRole,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <AU12SelectRole />
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => expect(setActiveRole).toHaveBeenCalledWith("staff"));
    expect(mockNavigate).toHaveBeenCalledWith("/patient-flow/staff", { replace: true });
  });
});
