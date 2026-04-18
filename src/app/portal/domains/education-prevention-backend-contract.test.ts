import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendAccountAdapter } from "./account/backendAccountAdapter";
import { removeStorageValue, writeStorageJson } from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";
const API_BASE_URL = "http://localhost:8000";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Education and prevention backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the education, check-in, prevention, and practitioner engagement backend contracts", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p4" });

    const baseProgram = {
      id: "program-1",
      conditionKey: "acne",
      title: "Acne : bases durables",
      description: "Programme de routine et de suivi entre deux consultations.",
      audience: ["patient", "caregiver"],
      status: "published",
      version: 1,
      estimatedMinutes: 13,
      coverTone: "clarte",
      createdAt: "2026-04-18T10:00:00.000Z",
      updatedAt: "2026-04-18T10:00:00.000Z",
      modulesCount: 4,
    } as const;

    const enrollment = {
      id: "enrollment-1",
      profileId: "profile-1",
      programId: "program-1",
      conditionKey: "acne",
      assignedByUserId: "user-practitioner",
      assignedByPractitionerId: "pract-001",
      status: "active",
      startedAt: "2026-04-18T10:05:00.000Z",
      nextCheckInDueAt: "2026-05-20T09:00:00.000Z",
      checkInCadence: "monthly",
      progressPercent: 0,
      createdAt: "2026-04-18T10:05:00.000Z",
      updatedAt: "2026-04-18T10:05:00.000Z",
    } as const;

    const educationDetail = {
      program: { ...baseProgram, enrollment },
      modules: [
        {
          id: "module-1",
          programId: "program-1",
          title: "Lire ses boutons",
          summary: "Differencier inflammation et irritation.",
          moduleType: "article",
          orderIndex: 1,
          estimatedMinutes: 3,
          body: "Objectif : garder une routine simple.",
          checklistItems: [],
          routineMoments: [],
          tags: ["acne"],
          extra: {},
          createdAt: "2026-04-18T10:00:00.000Z",
          updatedAt: "2026-04-18T10:00:00.000Z",
        },
      ],
      progress: [
        {
          id: "progress-1",
          profileId: "profile-1",
          enrollmentId: "enrollment-1",
          programId: "program-1",
          moduleId: "module-1",
          status: "not_started",
          createdAt: "2026-04-18T10:05:00.000Z",
          updatedAt: "2026-04-18T10:05:00.000Z",
        },
      ],
      recentCheckIns: [],
      messages: [],
    } as const;

    const practitionerMessageDetail = {
      ...educationDetail,
      messages: [
        {
          id: "message-1",
          profileId: "profile-1",
          enrollmentId: "enrollment-1",
          programId: "program-1",
          actorUserId: "user-practitioner",
          authorRole: "practitioner",
          body: "Commencez par la routine simple cette semaine.",
          meta: { requestAppointment: false },
          createdAt: "2026-04-18T10:10:00.000Z",
          updatedAt: "2026-04-18T10:10:00.000Z",
        },
      ],
    } as const;

    const patientMessageDetail = {
      ...practitionerMessageDetail,
      messages: [
        ...practitionerMessageDetail.messages,
        {
          id: "message-2",
          profileId: "profile-1",
          enrollmentId: "enrollment-1",
          programId: "program-1",
          actorUserId: "user-1",
          authorRole: "patient",
          body: "Je peux garder ce rythme si la peau tire un peu ?",
          meta: { requestAppointment: true },
          createdAt: "2026-04-18T10:20:00.000Z",
          updatedAt: "2026-04-18T10:20:00.000Z",
        },
      ],
    } as const;

    const progressedDetail = {
      ...patientMessageDetail,
      program: {
        ...patientMessageDetail.program,
        enrollment: {
          ...patientMessageDetail.program.enrollment,
          progressPercent: 25,
          updatedAt: "2026-04-18T10:25:00.000Z",
        },
      },
      progress: [
        {
          ...patientMessageDetail.progress[0],
          status: "completed",
          startedAt: "2026-04-18T10:24:00.000Z",
          completedAt: "2026-04-18T10:25:00.000Z",
          updatedAt: "2026-04-18T10:25:00.000Z",
        },
      ],
    } as const;

    const submittedCheckIn = {
      id: "checkin-1",
      profileId: "profile-1",
      enrollmentId: "enrollment-1",
      programId: "program-1",
      templateId: "template-1",
      submittedByUserId: "user-1",
      questionnaireData: { irritation: 2, poussee: false },
      measurements: [{ label: "Inflammation", value: "2", unit: "/5" }],
      mediaAssetIds: [],
      submittedAt: "2026-04-18T10:35:00.000Z",
      createdAt: "2026-04-18T10:35:00.000Z",
      updatedAt: "2026-04-18T10:35:00.000Z",
    } as const;

    const preventionSettings = {
      id: "prevention-settings-1",
      profileId: "profile-1",
      latitude: 14.7167,
      longitude: -17.4677,
      locationLabel: "Dakar Plateau",
      source: "manual",
      resolvedAt: "2026-04-18T10:40:00.000Z",
      createdAt: "2026-04-18T10:40:00.000Z",
      updatedAt: "2026-04-18T10:40:00.000Z",
    } as const;

    const preventionCurrent = {
      settings: preventionSettings,
      snapshot: {
        id: "snapshot-1",
        profileId: "profile-1",
        latitude: 14.7167,
        longitude: -17.4677,
        locationLabel: "Dakar Plateau",
        source: "fallback",
        observedAt: "2026-04-18T10:41:00.000Z",
        inputs: { temperature: 31, uv_index: 8 },
        createdAt: "2026-04-18T10:41:00.000Z",
        updatedAt: "2026-04-18T10:41:00.000Z",
      },
      alerts: [
        {
          id: "alert-1",
          profileId: "profile-1",
          ruleId: "rule-1",
          snapshotId: "snapshot-1",
          title: "Routine SPF prioritaire",
          body: "Renforcez la photoprotection aujourd'hui.",
          severity: "info",
          status: "active",
          startsAt: "2026-04-18T10:41:00.000Z",
          expiresAt: "2026-04-18T22:41:00.000Z",
          meta: { category: "custom" },
          createdAt: "2026-04-18T10:41:00.000Z",
          updatedAt: "2026-04-18T10:41:00.000Z",
        },
      ],
    } as const;

    const reminder = {
      id: "reminder-1",
      profileId: "profile-1",
      screeningType: "Controle prevention UV",
      cadence: "quarterly",
      status: "active",
      nextDueAt: "2026-06-15T09:30:00.000Z",
      channels: { sms: true, whatsapp: true, email: false },
      updatedAt: "2026-04-18T10:42:00.000Z",
    } as const;

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([baseProgram]))
      .mockResolvedValueOnce(jsonResponse(educationDetail))
      .mockResolvedValueOnce(jsonResponse([{ ...baseProgram, enrollment }]))
      .mockResolvedValueOnce(jsonResponse(educationDetail))
      .mockResolvedValueOnce(jsonResponse(practitionerMessageDetail))
      .mockResolvedValueOnce(jsonResponse([{ ...baseProgram, enrollment }]))
      .mockResolvedValueOnce(jsonResponse(practitionerMessageDetail))
      .mockResolvedValueOnce(jsonResponse(progressedDetail))
      .mockResolvedValueOnce(jsonResponse(patientMessageDetail))
      .mockResolvedValueOnce(jsonResponse([submittedCheckIn]))
      .mockResolvedValueOnce(jsonResponse(submittedCheckIn))
      .mockResolvedValueOnce(jsonResponse(preventionSettings))
      .mockResolvedValueOnce(jsonResponse(preventionSettings))
      .mockResolvedValueOnce(jsonResponse(preventionCurrent))
      .mockResolvedValueOnce(jsonResponse(preventionCurrent.alerts))
      .mockResolvedValueOnce(jsonResponse(preventionCurrent))
      .mockResolvedValueOnce(jsonResponse(reminder));
    vi.stubGlobal("fetch", fetchMock);

    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const practitionerPrograms = await accountAdapter.listPractitionerEducationPrograms(
      "user-practitioner",
    );
    const assignedProgram = await accountAdapter.assignEducationProgram({
      actorUserId: "user-practitioner",
      profileId: "profile-1",
      programId: "program-1",
      checkInCadence: "monthly",
      nextCheckInDueAt: "2026-05-20T09:00:00.000Z",
    });
    const practitionerAssignedPrograms = await accountAdapter.listProfileEducationProgramsForPractitioner(
      "user-practitioner",
      "profile-1",
    );
    const practitionerProgramDetail = await accountAdapter.getEducationProgramForPractitioner(
      "user-practitioner",
      "profile-1",
      "program-1",
    );
    const practitionerMessage = await accountAdapter.createEducationThreadMessageForPractitioner({
      actorUserId: "user-practitioner",
      profileId: "profile-1",
      programId: "program-1",
      body: "Commencez par la routine simple cette semaine.",
      requestAppointment: false,
    });
    const patientPrograms = await accountAdapter.listEducationPrograms("user-1", "profile-1");
    const patientProgramDetail = await accountAdapter.getEducationProgram(
      "user-1",
      "profile-1",
      "program-1",
    );
    const progressedProgram = await accountAdapter.markEducationModuleProgress({
      actorUserId: "user-1",
      profileId: "profile-1",
      moduleId: "module-1",
      status: "completed",
    });
    const patientMessage = await accountAdapter.createEducationThreadMessage({
      actorUserId: "user-1",
      profileId: "profile-1",
      programId: "program-1",
      body: "Je peux garder ce rythme si la peau tire un peu ?",
      requestAppointment: true,
    });
    const listedCheckIns = await accountAdapter.listCheckIns(
      "user-1",
      "profile-1",
      "enrollment-1",
    );
    const createdCheckIn = await accountAdapter.submitCheckIn({
      actorUserId: "user-1",
      profileId: "profile-1",
      enrollmentId: "enrollment-1",
      templateId: "template-1",
      questionnaireData: { irritation: 2, poussee: false },
      measurements: [{ label: "Inflammation", value: "2", unit: "/5" }],
      mediaAssetIds: [],
    });
    const updatedLocation = await accountAdapter.updatePreventionLocation({
      actorUserId: "user-1",
      profileId: "profile-1",
      latitude: 14.7167,
      longitude: -17.4677,
      locationLabel: "Dakar Plateau",
      source: "manual",
    });
    const preventionLocation = await accountAdapter.getPreventionLocation("user-1", "profile-1");
    const patientPrevention = await accountAdapter.getPreventionCurrent("user-1", "profile-1");
    const preventionAlerts = await accountAdapter.listPreventionAlerts("user-1", "profile-1");
    const practitionerPrevention = await accountAdapter.getProfilePreventionCurrentForPractitioner(
      "user-practitioner",
      "profile-1",
    );
    const createdReminder = await accountAdapter.createScreeningReminderForPractitioner({
      actorUserId: "user-practitioner",
      profileId: "profile-1",
      screeningType: "Controle prevention UV",
      cadence: "quarterly",
      nextDueAt: "2026-06-15T09:30:00.000Z",
    });

    expect(practitionerPrograms[0].conditionKey).toBe("acne");
    expect(assignedProgram.program.enrollment?.checkInCadence).toBe("monthly");
    expect(practitionerAssignedPrograms[0].enrollment?.profileId).toBe("profile-1");
    expect(practitionerProgramDetail.program.id).toBe("program-1");
    expect(practitionerMessage.messages[0].authorRole).toBe("practitioner");
    expect(patientPrograms[0].enrollment?.id).toBe("enrollment-1");
    expect(patientProgramDetail.messages[0].body).toContain("routine simple");
    expect(progressedProgram.program.enrollment?.progressPercent).toBe(25);
    expect(patientMessage.messages.at(-1)?.meta.requestAppointment).toBe(true);
    expect(listedCheckIns[0].id).toBe("checkin-1");
    expect(createdCheckIn.templateId).toBe("template-1");
    expect(updatedLocation.locationLabel).toBe("Dakar Plateau");
    expect(preventionLocation.source).toBe("manual");
    expect(patientPrevention.alerts[0].title).toBe("Routine SPF prioritaire");
    expect(preventionAlerts[0].ruleId).toBe("rule-1");
    expect(practitionerPrevention.settings.locationLabel).toBe("Dakar Plateau");
    expect(createdReminder.screeningType).toBe("Controle prevention UV");

    const practitionerProgramsCall = fetchMock.mock.calls[0];
    expect(String(practitionerProgramsCall[0])).toContain("/api/v1/practitioner/education/programs");

    const assignProgramCall = fetchMock.mock.calls[1];
    expect(String(assignProgramCall[0])).toContain(
      "/api/v1/practitioner/education/program-assignments",
    );
    expect(JSON.parse(String((assignProgramCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      programId: "program-1",
      checkInCadence: "monthly",
      nextCheckInDueAt: "2026-05-20T09:00:00.000Z",
    });

    const practitionerAssignedProgramsCall = fetchMock.mock.calls[2];
    expect(String(practitionerAssignedProgramsCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/education/programs",
    );

    const practitionerProgramDetailCall = fetchMock.mock.calls[3];
    expect(String(practitionerProgramDetailCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/education/programs/program-1",
    );

    const practitionerMessageCall = fetchMock.mock.calls[4];
    expect(String(practitionerMessageCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/education/programs/program-1/messages",
    );
    expect(JSON.parse(String((practitionerMessageCall[1] as RequestInit).body))).toMatchObject({
      body: "Commencez par la routine simple cette semaine.",
      requestAppointment: false,
    });

    const patientProgramsCall = fetchMock.mock.calls[5];
    expect(String(patientProgramsCall[0])).toContain("/api/v1/patients/education/programs");
    expect(String(patientProgramsCall[0])).toContain("profileId=profile-1");

    const patientProgramDetailCall = fetchMock.mock.calls[6];
    expect(String(patientProgramDetailCall[0])).toContain(
      "/api/v1/patients/education/programs/program-1",
    );
    expect(String(patientProgramDetailCall[0])).toContain("profileId=profile-1");

    const progressCall = fetchMock.mock.calls[7];
    expect(String(progressCall[0])).toContain("/api/v1/patients/education/modules/module-1/progress");
    expect(JSON.parse(String((progressCall[1] as RequestInit).body))).toMatchObject({
      status: "completed",
    });

    const patientMessageCall = fetchMock.mock.calls[8];
    expect(String(patientMessageCall[0])).toContain(
      "/api/v1/patients/education/programs/program-1/messages",
    );
    expect(JSON.parse(String((patientMessageCall[1] as RequestInit).body))).toMatchObject({
      body: "Je peux garder ce rythme si la peau tire un peu ?",
      requestAppointment: true,
    });

    const listCheckInsCall = fetchMock.mock.calls[9];
    expect(String(listCheckInsCall[0])).toContain("/api/v1/patients/check-ins");
    expect(String(listCheckInsCall[0])).toContain("profileId=profile-1");
    expect(String(listCheckInsCall[0])).toContain("enrollmentId=enrollment-1");

    const createCheckInCall = fetchMock.mock.calls[10];
    expect(String(createCheckInCall[0])).toContain("/api/v1/patients/check-ins");
    expect(JSON.parse(String((createCheckInCall[1] as RequestInit).body))).toMatchObject({
      enrollmentId: "enrollment-1",
      templateId: "template-1",
      questionnaireData: { irritation: 2, poussee: false },
    });

    const updateLocationCall = fetchMock.mock.calls[11];
    expect(String(updateLocationCall[0])).toContain("/api/v1/patients/prevention/location");
    expect(JSON.parse(String((updateLocationCall[1] as RequestInit).body))).toMatchObject({
      latitude: 14.7167,
      longitude: -17.4677,
      locationLabel: "Dakar Plateau",
      source: "manual",
    });

    const getLocationCall = fetchMock.mock.calls[12];
    expect(String(getLocationCall[0])).toContain("/api/v1/patients/prevention/location");
    expect(String(getLocationCall[0])).toContain("profileId=profile-1");

    const getCurrentCall = fetchMock.mock.calls[13];
    expect(String(getCurrentCall[0])).toContain("/api/v1/patients/prevention/current");
    expect(String(getCurrentCall[0])).toContain("profileId=profile-1");

    const listAlertsCall = fetchMock.mock.calls[14];
    expect(String(listAlertsCall[0])).toContain("/api/v1/patients/prevention/alerts");
    expect(String(listAlertsCall[0])).toContain("profileId=profile-1");

    const practitionerPreventionCall = fetchMock.mock.calls[15];
    expect(String(practitionerPreventionCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/prevention/current",
    );

    const createReminderCall = fetchMock.mock.calls[16];
    expect(String(createReminderCall[0])).toContain(
      "/api/v1/practitioner/patients/profile-1/screening-reminders",
    );
    expect(JSON.parse(String((createReminderCall[1] as RequestInit).body))).toMatchObject({
      screeningType: "Controle prevention UV",
      cadence: "quarterly",
      nextDueAt: "2026-06-15T09:30:00.000Z",
    });

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p4",
      );
    }
  });
});
