import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendAccountAdapter } from "./account/backendAccountAdapter";
import { BackendAppointmentAdapter } from "./appointments/backendAppointmentAdapter";
import { removeStorageValue, writeStorageJson } from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";
const API_BASE_URL = "http://localhost:8000";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Longitudinal care backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the clinical outcome, reminder, and dashboard longitudinal-care contracts", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p2" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          appointment: {
            id: "appt-1",
            bookingSourceRef: "booking-p2-001",
            profileId: "profile-1",
            patientLabel: "Awa Ndiaye",
            availabilitySlotId: "slot-1",
            practitionerId: "pract-001",
            practitionerName: "Dr. Awa Ndiaye",
            appointmentType: "presentiel",
            scheduledFor: "2026-05-01T10:00:00.000Z",
            dateLabel: "01/05/2026",
            timeLabel: "10:00",
            status: "in_consultation",
            createdByUserId: "user-1",
            createdAt: "2026-04-18T10:00:00.000Z",
            updatedAt: "2026-04-18T10:05:00.000Z",
            diagnosis: "Acné inflammatoire modérée",
            clinicalSummary: "Routine anti-inflammatoire et suivi trimestriel.",
            measurements: [{ label: "Hydratation", value: "62", unit: "%" }],
            followUpCadence: "quarterly",
            followUpDueAt: "2026-06-15T09:30:00.000Z",
            carePlanUpdatedAt: "2026-04-18T10:05:00.000Z",
          },
          documents: [
            {
              id: "doc-1",
              profileId: "profile-1",
              appointmentId: "appt-1",
              practitionerId: "pract-001",
              createdByUserId: "user-practitioner",
              kind: "report",
              status: "published",
              title: "Compte-rendu de consultation",
              summary: "Routine anti-inflammatoire et suivi trimestriel.",
              body: "Diagnostic: Acné inflammatoire modérée",
              prescriptionItems: [],
              version: 1,
              publishedAt: "2026-04-18T10:05:00.000Z",
              createdAt: "2026-04-18T10:05:00.000Z",
              updatedAt: "2026-04-18T10:05:00.000Z",
            },
          ],
          followUpReminder: {
            id: "reminder-1",
            profileId: "profile-1",
            screeningType: "Suivi dermatologique",
            cadence: "quarterly",
            status: "active",
            nextDueAt: "2026-06-15T09:30:00.000Z",
            channels: { sms: true, whatsapp: true, email: false },
            updatedAt: "2026-04-18T10:05:00.000Z",
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "doc-1",
            profileId: "profile-1",
            appointmentId: "appt-1",
            practitionerId: "pract-001",
            createdByUserId: "user-practitioner",
            kind: "report",
            status: "published",
            title: "Compte-rendu de consultation",
            summary: "Routine anti-inflammatoire et suivi trimestriel.",
            body: "Diagnostic: Acné inflammatoire modérée",
            prescriptionItems: [],
            version: 1,
            publishedAt: "2026-04-18T10:05:00.000Z",
            createdAt: "2026-04-18T10:05:00.000Z",
            updatedAt: "2026-04-18T10:05:00.000Z",
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "event-1",
            profileId: "profile-1",
            type: "follow_up_scheduled",
            title: "Suivi dermatologique",
            description: "Prochaine échéance le 15/06/2026",
            occurredAt: "2026-04-18T10:05:00.000Z",
            source: "screening_reminder",
            sourceRef: "reminder-1",
            meta: { cadence: "quarterly" },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "reminder-1",
            profileId: "profile-1",
            screeningType: "Suivi dermatologique",
            cadence: "quarterly",
            status: "active",
            nextDueAt: "2026-06-15T09:30:00.000Z",
            channels: { sms: true, whatsapp: true, email: false },
            updatedAt: "2026-04-18T10:05:00.000Z",
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "reminder-1",
          profileId: "profile-1",
          screeningType: "Suivi dermatologique",
          cadence: "quarterly",
          status: "completed",
          nextDueAt: "2026-06-15T09:30:00.000Z",
          lastCompletedAt: "2026-06-15T09:35:00.000Z",
          channels: { sms: true, whatsapp: true, email: false },
          updatedAt: "2026-06-15T09:35:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "program-1",
            conditionKey: "acne",
            title: "Routine acne",
            description: "Programme de suivi de routine",
            audience: ["patient"],
            status: "published",
            version: 1,
            estimatedMinutes: 20,
            createdAt: "2026-04-18T10:00:00.000Z",
            updatedAt: "2026-04-18T10:00:00.000Z",
            modulesCount: 3,
            enrollment: {
              id: "enrollment-1",
              profileId: "profile-1",
              programId: "program-1",
              conditionKey: "acne",
              assignedByUserId: "user-practitioner",
              assignedByPractitionerId: "pract-001",
              status: "active",
              startedAt: "2026-04-18T10:00:00.000Z",
              nextCheckInDueAt: "2026-05-15T09:00:00.000Z",
              checkInCadence: "monthly",
              progressPercent: 40,
              createdAt: "2026-04-18T10:00:00.000Z",
              updatedAt: "2026-04-18T10:00:00.000Z",
            },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          settings: {
            id: "prevention-settings-1",
            profileId: "profile-1",
            latitude: 14.7167,
            longitude: -17.4677,
            locationLabel: "Dakar",
            source: "device",
            resolvedAt: "2026-04-18T10:00:00.000Z",
            createdAt: "2026-04-18T10:00:00.000Z",
            updatedAt: "2026-04-18T10:00:00.000Z",
          },
          snapshot: {
            id: "snapshot-1",
            profileId: "profile-1",
            latitude: 14.7167,
            longitude: -17.4677,
            locationLabel: "Dakar",
            source: "device",
            observedAt: "2026-04-18T10:00:00.000Z",
            inputs: { uvIndex: 8 },
            createdAt: "2026-04-18T10:00:00.000Z",
            updatedAt: "2026-04-18T10:00:00.000Z",
          },
          alerts: [
            {
              id: "alert-1",
              profileId: "profile-1",
              ruleId: "rule-1",
              snapshotId: "snapshot-1",
              title: "UV élevé cet après-midi",
              body: "Protection SPF renforcée recommandée.",
              severity: "attention",
              status: "active",
              startsAt: "2026-04-18T12:00:00.000Z",
              expiresAt: "2026-04-18T18:00:00.000Z",
              meta: {},
              createdAt: "2026-04-18T10:00:00.000Z",
              updatedAt: "2026-04-18T10:00:00.000Z",
            },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const appointmentAdapter = new BackendAppointmentAdapter(API_BASE_URL);
    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const outcome = await appointmentAdapter.createClinicalOutcome({
      actorUserId: "user-practitioner",
      appointmentId: "appt-1",
      diagnosis: "Acné inflammatoire modérée",
      clinicalSummary: "Routine anti-inflammatoire et suivi trimestriel.",
      measurements: [{ label: "Hydratation", value: "62", unit: "%" }],
      followUpCadence: "quarterly",
      followUpDueAt: "2026-06-15T09:30:00.000Z",
      notifyPatient: true,
    });
    const documents = await accountAdapter.listClinicalDocuments(
      "user-1",
      "profile-1",
      "appt-1",
      "report",
    );
    const timeline = await accountAdapter.listTimelineEvents("user-1", "profile-1", 20);
    const reminders = await accountAdapter.listScreeningReminders("user-1", "profile-1");
    const updatedReminder = await accountAdapter.updateScreeningReminderForPractitioner({
      actorUserId: "user-practitioner",
      profileId: "profile-1",
      reminderId: "reminder-1",
      patch: {
        status: "completed",
        cadence: "quarterly",
        nextDueAt: "2026-06-15T09:30:00.000Z",
      },
    });
    const programs = await accountAdapter.listEducationPrograms("user-1", "profile-1");
    const prevention = await accountAdapter.getPreventionCurrent("user-1", "profile-1");

    expect(outcome.followUpReminder?.id).toBe("reminder-1");
    expect(documents[0].kind).toBe("report");
    expect(timeline[0].type).toBe("follow_up_scheduled");
    expect(reminders[0].screeningType).toBe("Suivi dermatologique");
    expect(updatedReminder.status).toBe("completed");
    expect(programs[0].enrollment?.nextCheckInDueAt).toBe("2026-05-15T09:00:00.000Z");
    expect(prevention.alerts[0].title).toBe("UV élevé cet après-midi");

    const outcomeCall = fetchMock.mock.calls[0];
    expect(String(outcomeCall[0])).toContain("/api/v1/appointments/appt-1/clinical-outcome");
    expect((outcomeCall[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((outcomeCall[1] as RequestInit).body))).toMatchObject({
      diagnosis: "Acné inflammatoire modérée",
      followUpCadence: "quarterly",
      followUpDueAt: "2026-06-15T09:30:00.000Z",
    });

    const documentsCall = fetchMock.mock.calls[1];
    expect(String(documentsCall[0])).toContain("/api/v1/patients/clinical-documents");
    expect(String(documentsCall[0])).toContain("profileId=profile-1");
    expect(String(documentsCall[0])).toContain("appointmentId=appt-1");
    expect(String(documentsCall[0])).toContain("kind=report");

    const timelineCall = fetchMock.mock.calls[2];
    expect(String(timelineCall[0])).toContain("/api/v1/patients/timeline-events");
    expect(String(timelineCall[0])).toContain("profileId=profile-1");
    expect(String(timelineCall[0])).toContain("limit=20");

    const remindersCall = fetchMock.mock.calls[3];
    expect(String(remindersCall[0])).toContain("/api/v1/patients/screening-reminders");
    expect(String(remindersCall[0])).toContain("profileId=profile-1");

    const updateReminderCall = fetchMock.mock.calls[4];
    expect(String(updateReminderCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/screening-reminders/reminder-1",
    );
    expect((updateReminderCall[1] as RequestInit).method).toBe("PATCH");
    expect(JSON.parse(String((updateReminderCall[1] as RequestInit).body))).toMatchObject({
      status: "completed",
      cadence: "quarterly",
      next_due_at: "2026-06-15T09:30:00.000Z",
    });
    expect(JSON.parse(String((updateReminderCall[1] as RequestInit).body))).not.toHaveProperty(
      "nextDueAt",
    );

    const programsCall = fetchMock.mock.calls[5];
    expect(String(programsCall[0])).toContain("/api/v1/patients/education/programs");
    expect(String(programsCall[0])).toContain("profileId=profile-1");

    const preventionCall = fetchMock.mock.calls[6];
    expect(String(preventionCall[0])).toContain("/api/v1/patients/prevention/current");
    expect(String(preventionCall[0])).toContain("profileId=profile-1");

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p2",
      );
    }
  });
});
