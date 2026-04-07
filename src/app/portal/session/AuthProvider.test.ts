import { describe, expect, it } from "vitest";
import type { PatientProfileRecord } from "@portal/domains/account/types";
import { resolvePreferredActingProfileId } from "./AuthProvider";

function makeProfile(
  id: string,
  relationship: PatientProfileRecord["relationship"],
): PatientProfileRecord {
  const now = new Date().toISOString();
  return {
    id,
    ownerUserId: "user_1",
    relationship,
    firstName: relationship === "moi" ? "Abdoul" : "Proche",
    lastName: "Diop",
    dateOfBirth: "1990-01-01",
    isDependent: relationship !== "moi",
    createdAt: now,
    updatedAt: now,
  };
}

describe("resolvePreferredActingProfileId", () => {
  it("keeps the current acting profile when it is still available", () => {
    const profiles = [makeProfile("self_profile", "moi"), makeProfile("child_profile", "enfant")];

    expect(resolvePreferredActingProfileId(profiles, "child_profile")).toBe("child_profile");
  });

  it("falls back to the self profile when the stored profile is missing", () => {
    const profiles = [makeProfile("child_profile", "enfant"), makeProfile("self_profile", "moi")];

    expect(resolvePreferredActingProfileId(profiles, "missing_profile")).toBe("self_profile");
  });

  it("falls back to the first profile when there is no self profile", () => {
    const profiles = [makeProfile("child_profile", "enfant"), makeProfile("relative_profile", "proche")];

    expect(resolvePreferredActingProfileId(profiles, null)).toBe("child_profile");
  });

  it("returns null when there are no profiles", () => {
    expect(resolvePreferredActingProfileId([], null)).toBeNull();
  });
});
