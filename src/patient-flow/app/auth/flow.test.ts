import { describe, expect, it } from "vitest";
import { resolvePostAuthRoute } from "./flow";

describe("auth flow routing", () => {
  it("routes single-role accounts directly to their workspace", () => {
    expect(resolvePostAuthRoute(null, { availableRoles: ["patient"] })).toBe(
      "/patient-flow/auth/dashboard",
    );
    expect(resolvePostAuthRoute(null, { availableRoles: ["practitioner"] })).toBe(
      "/patient-flow/practitioner",
    );
  });

  it("routes multi-role accounts to role selection when active role is not set", () => {
    expect(resolvePostAuthRoute(null, { availableRoles: ["patient", "practitioner"] })).toBe(
      "/patient-flow/auth/select-role",
    );
  });

  it("routes to the active role workspace when role is selected", () => {
    expect(
      resolvePostAuthRoute(
        { returnTo: "/patient-flow/confirmation" },
        {
          availableRoles: ["patient", "practitioner"],
          activeRole: "practitioner",
        },
      ),
    ).toBe("/patient-flow/practitioner");
  });
});
