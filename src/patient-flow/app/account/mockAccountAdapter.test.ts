import { beforeEach, describe, expect, it } from "vitest";
import { MockAccountAdapter } from "./mockAccountAdapter";

describe("MockAccountAdapter", () => {
  let adapter: MockAccountAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    adapter = new MockAccountAdapter();
  });

  it("creates dependent profiles and keeps them selectable in user scope", async () => {
    await adapter.ensureSelfProfile({ userId: "u1", fullName: "Fatou Diop" });

    const dependent = await adapter.createOrLinkDependent({
      userId: "u1",
      relationship: "enfant",
      firstName: "Amina",
      lastName: "Diop",
      dateOfBirth: "2017-03-10",
    });

    const profiles = await adapter.listProfiles("u1");
    expect(profiles.some((profile) => profile.id === dependent.profile.id)).toBe(true);
  });

  it("blocks cross-profile access for consents and score history", async () => {
    const self1 = await adapter.ensureSelfProfile({ userId: "u1", fullName: "User One" });
    await adapter.ensureSelfProfile({ userId: "u2", fullName: "User Two" });

    const consents = await adapter.listConsents("u1", self1.id);
    expect(consents.length).toBeGreaterThan(0);

    await expect(adapter.listConsents("u2", self1.id)).rejects.toThrow("Accès refusé");
    await expect(adapter.getConsent("u2", consents[0].id)).rejects.toThrow("Accès refusé");
    await expect(adapter.listSkinScores("u2", self1.id, 7)).rejects.toThrow("Accès refusé");
    await expect(adapter.listTimelineEvents("u2", self1.id)).rejects.toThrow("Accès refusé");
    await expect(adapter.listScreeningReminders("u2", self1.id)).rejects.toThrow("Accès refusé");
  });

  it("updates consent status and writes timeline events", async () => {
    const self = await adapter.ensureSelfProfile({ userId: "u1", fullName: "Fatou Diop" });
    const consents = await adapter.listConsents("u1", self.id);

    await adapter.signConsent({
      consentId: consents[0].id,
      actorUserId: "u1",
    });
    await adapter.revokeConsent({
      consentId: consents[0].id,
      actorUserId: "u1",
    });

    const timeline = await adapter.listTimelineEvents("u1", self.id);
    expect(timeline.some((event) => event.type === "consent_signed")).toBe(true);
    expect(timeline.some((event) => event.type === "consent_revoked")).toBe(true);
  });

  it("deduplicates booking timeline events and keeps notification settings isolated per profile", async () => {
    const self = await adapter.ensureSelfProfile({ userId: "u1", fullName: "Fatou Diop" });
    const dependent = await adapter.createOrLinkDependent({
      userId: "u1",
      relationship: "proche",
      firstName: "Mariama",
      lastName: "Ndiaye",
      dateOfBirth: "1998-08-14",
    });

    await adapter.appendTimelineEvent({
      actorUserId: "u1",
      profileId: self.id,
      type: "appointment_booked",
      title: "Rendez-vous confirmé",
      source: "booking_flow",
      sourceRef: `booking:${self.id}:2026-02-25:10:30`,
    });
    await adapter.appendTimelineEvent({
      actorUserId: "u1",
      profileId: self.id,
      type: "appointment_booked",
      title: "Rendez-vous confirmé",
      source: "booking_flow",
      sourceRef: `booking:${self.id}:2026-02-25:10:30`,
    });

    const timeline = await adapter.listTimelineEvents("u1", self.id);
    const bookings = timeline.filter((event) => event.type === "appointment_booked");
    expect(bookings).toHaveLength(1);

    const selfPrefsBefore = await adapter.getNotificationPreferences("u1", self.id);
    const dependentPrefsBefore = await adapter.getNotificationPreferences(
      "u1",
      dependent.profile.id,
    );
    const dependentReminders = await adapter.listScreeningReminders("u1", dependent.profile.id);

    await adapter.updateNotificationPreferences({
      actorUserId: "u1",
      profileId: dependent.profile.id,
      patch: {
        telederm: {
          ...dependentPrefsBefore.telederm,
          whatsapp: !dependentPrefsBefore.telederm.whatsapp,
        },
      },
    });
    await adapter.updateScreeningReminder({
      actorUserId: "u1",
      profileId: dependent.profile.id,
      reminderId: dependentReminders[0].id,
      patch: {
        channels: {
          sms: false,
          whatsapp: true,
          email: true,
        },
      },
    });

    const selfPrefsAfter = await adapter.getNotificationPreferences("u1", self.id);
    const dependentPrefsAfter = await adapter.getNotificationPreferences(
      "u1",
      dependent.profile.id,
    );

    expect(selfPrefsAfter.telederm.whatsapp).toBe(selfPrefsBefore.telederm.whatsapp);
    expect(dependentPrefsAfter.telederm.whatsapp).not.toBe(
      dependentPrefsBefore.telederm.whatsapp,
    );
    const selfReminders = await adapter.listScreeningReminders("u1", self.id);
    const dependentRemindersAfter = await adapter.listScreeningReminders(
      "u1",
      dependent.profile.id,
    );
    expect(selfReminders[0].channels.sms).not.toBe(dependentRemindersAfter[0].channels.sms);
  });
});
