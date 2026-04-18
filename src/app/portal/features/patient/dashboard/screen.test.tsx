import { screen, waitFor } from "@testing-library/react";
import type {
  ClinicalDocumentRecord,
  EducationProgramRecord,
  PatientRecordEvent,
  PreventionCurrentRecord,
  ScreeningReminder,
  SkinScoreRecord,
} from "@portal/domains/account/types";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuthRouter } from "../../../../../test/renderWithAuthRouter";
import PatientDashboardScreen, { DashboardHome } from "./screen";

const recentDocuments: ClinicalDocumentRecord[] = [
  {
    id: "doc-1",
    profileId: "profile-1",
    appointmentId: "appt-1",
    practitionerId: "pract-001",
    createdByUserId: "user-practitioner",
    kind: "prescription",
    status: "published",
    title: "Ordonnance dermatologique",
    summary: "Routine anti-inflammatoire",
    body: "- Adapalene gel",
    prescriptionItems: [
      {
        name: "Adapalene gel",
        instructions: "Le soir pendant 30 jours",
        isMedication: true,
      },
    ],
    version: 2,
    publishedAt: "2026-04-07T15:30:00.000Z",
    createdAt: "2026-04-07T15:30:00.000Z",
    updatedAt: "2026-04-07T15:30:00.000Z",
  },
];

const timelineEvents: PatientRecordEvent[] = [
  {
    id: "event-1",
    profileId: "profile-1",
    type: "follow_up_scheduled",
    title: "Suivi dermatologique",
    description: "Prochaine échéance le 10/05/2026",
    occurredAt: "2026-04-07T16:00:00.000Z",
    source: "screening_reminder",
    sourceRef: "reminder-1",
    meta: { cadence: "monthly" },
  },
];

const screeningReminders: ScreeningReminder[] = [
  {
    id: "reminder-1",
    profileId: "profile-1",
    screeningType: "Suivi dermatologique",
    cadence: "monthly",
    status: "active",
    nextDueAt: "2026-05-10T09:00:00.000Z",
    channels: { sms: true, whatsapp: true, email: false },
    updatedAt: "2026-04-07T16:00:00.000Z",
  },
];

const skinScores: SkinScoreRecord[] = [
  {
    id: "score-1",
    profileId: "profile-1",
    score: 78,
    measuredAt: "2026-04-07T08:30:00.000Z",
    source: "scan",
  },
];

const appointments = [
  {
    id: "appt-1",
    bookingSourceRef: "booking-p2-001",
    profileId: "profile-1",
    patientLabel: "Awa Ndiaye",
    availabilitySlotId: "slot-1",
    practitionerId: "pract-001",
    practitionerName: "Dr. Aissatou Ly",
    practitionerSpecialty: "Dermatologie",
    practitionerLocation: "Cabinet Mermoz, Dakar",
    appointmentType: "presentiel",
    scheduledFor: "2026-04-08T14:30:00.000Z",
    dateLabel: "08/04/2026",
    timeLabel: "14h30",
    status: "scheduled",
    createdByUserId: "user-1",
    createdAt: "2026-04-07T08:00:00.000Z",
    updatedAt: "2026-04-07T08:00:00.000Z",
    measurements: [],
  },
];

const educationPrograms: EducationProgramRecord[] = [
  {
    id: "program-1",
    conditionKey: "acne",
    title: "Routine acne",
    description: "Programme de suivi de routine",
    audience: ["patient"],
    status: "published",
    version: 1,
    estimatedMinutes: 20,
    createdAt: "2026-04-05T08:00:00.000Z",
    updatedAt: "2026-04-05T08:00:00.000Z",
    modulesCount: 3,
    enrollment: {
      id: "enrollment-1",
      profileId: "profile-1",
      programId: "program-1",
      conditionKey: "acne",
      assignedByUserId: "user-practitioner",
      assignedByPractitionerId: "pract-001",
      status: "active",
      startedAt: "2026-04-05T08:00:00.000Z",
      nextCheckInDueAt: "2026-05-12T09:00:00.000Z",
      checkInCadence: "monthly",
      progressPercent: 40,
      createdAt: "2026-04-05T08:00:00.000Z",
      updatedAt: "2026-04-05T08:00:00.000Z",
    },
  },
];

const preventionCurrent: PreventionCurrentRecord = {
  settings: {
    id: "prevention-settings-1",
    profileId: "profile-1",
    latitude: 14.7167,
    longitude: -17.4677,
    locationLabel: "Dakar",
    source: "device",
    resolvedAt: "2026-04-07T08:00:00.000Z",
    createdAt: "2026-04-07T08:00:00.000Z",
    updatedAt: "2026-04-07T08:00:00.000Z",
  },
  snapshot: {
    id: "snapshot-1",
    profileId: "profile-1",
    latitude: 14.7167,
    longitude: -17.4677,
    locationLabel: "Dakar",
    source: "device",
    observedAt: "2026-04-07T08:00:00.000Z",
    inputs: { uvIndex: 8 },
    createdAt: "2026-04-07T08:00:00.000Z",
    updatedAt: "2026-04-07T08:00:00.000Z",
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
      startsAt: "2026-04-07T12:00:00.000Z",
      expiresAt: "2026-04-07T18:00:00.000Z",
      meta: {},
      createdAt: "2026-04-07T08:00:00.000Z",
      updatedAt: "2026-04-07T08:00:00.000Z",
    },
  ],
};

describe("patient dashboard", () => {
  it("renders a real care plan and removes placeholder dashboard modules", async () => {
    renderWithAuthRouter({
      routes: [
        {
          path: "/patient-flow/auth/dashboard",
          element: (
            <DashboardHome
              firstName="Awa"
              hasActingProfile
              upcoming={{
                practitioner: "Dr. Aissatou Ly",
                location: "Cabinet Mermoz, Dakar",
                dateLabel: "08/04/2026",
                timeLabel: "14h30",
                isVideo: false,
                scheduledFor: "2026-04-08T14:30:00.000Z",
              }}
              upcomingLoading={false}
              upcomingError={null}
              recentDocuments={recentDocuments}
              recentDocumentsLoading={false}
              recentDocumentsError={null}
              timelineEvents={timelineEvents}
              screeningReminders={screeningReminders}
              careHubLoading={false}
              careHubError={null}
              skinScores={skinScores}
              skinScoresLoading={false}
              skinScoresError={null}
            />
          ),
        },
      ],
      initialEntries: ["/patient-flow/auth/dashboard"],
      authOverrides: {
        isAuthenticated: true,
        user: {
          id: "user-1",
          fullName: "Awa Ndiaye",
          phoneE164: "+221771234567",
          countryCode: "+221",
          roles: ["patient"],
          hasPin: true,
          createdAt: "2026-04-07T08:00:00.000Z",
          updatedAt: "2026-04-07T08:00:00.000Z",
        },
        actingProfileId: "profile-1",
        accountAdapter: {
          listClinicalDocuments: vi.fn().mockResolvedValue(recentDocuments),
          listTimelineEvents: vi.fn().mockResolvedValue(timelineEvents),
          listScreeningReminders: vi.fn().mockResolvedValue(screeningReminders),
        } as never,
      },
    });

    expect(await screen.findByText("Plan de suivi")).toBeInTheDocument();
    expect((await screen.findAllByText("Adapalene gel")).length).toBeGreaterThan(0);
    expect((await screen.findAllByText("Suivi dermatologique")).length).toBeGreaterThan(0);
    expect(screen.getByText("Repères du dossier")).toBeInTheDocument();

    expect(
      screen.queryByText("Hydratation + SPF 50"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Meteo Peau · Dakar"),
    ).not.toBeInTheDocument();
  });

  it("loads the longitudinal dashboard modules from one parent-backed API pass", async () => {
    const listAppointmentsForProfile = vi.fn().mockResolvedValue(appointments);
    const listSkinScores = vi.fn().mockResolvedValue(skinScores);
    const listClinicalDocuments = vi.fn().mockResolvedValue(recentDocuments);
    const listTimelineEvents = vi.fn().mockResolvedValue(timelineEvents);
    const listScreeningReminders = vi.fn().mockResolvedValue(screeningReminders);
    const listEducationPrograms = vi.fn().mockResolvedValue(educationPrograms);
    const getPreventionCurrent = vi.fn().mockResolvedValue(preventionCurrent);

    renderWithAuthRouter({
      routes: [
        {
          path: "/patient-flow/auth/dashboard",
          element: <PatientDashboardScreen />,
        },
      ],
      initialEntries: ["/patient-flow/auth/dashboard"],
      authOverrides: {
        isAuthenticated: true,
        user: {
          id: "user-1",
          fullName: "Awa Ndiaye",
          phoneE164: "+221771234567",
          countryCode: "+221",
          roles: ["patient"],
          hasPin: true,
          createdAt: "2026-04-07T08:00:00.000Z",
          updatedAt: "2026-04-07T08:00:00.000Z",
        },
        actingProfileId: "profile-1",
        accountAdapter: {
          listSkinScores,
          listClinicalDocuments,
          listTimelineEvents,
          listScreeningReminders,
          listEducationPrograms,
          getPreventionCurrent,
        } as never,
        appointmentAdapter: {
          listAppointmentsForProfile,
        } as never,
      },
    });

    expect(await screen.findByText("Plan de suivi")).toBeInTheDocument();
    expect((await screen.findAllByText("Dr. Aissatou Ly")).length).toBeGreaterThan(0);
    expect(await screen.findByText("Parcours éducatif")).toBeInTheDocument();
    expect(await screen.findByText("UV élevé cet après-midi")).toBeInTheDocument();
    expect((await screen.findAllByText("Suivi dermatologique")).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(listAppointmentsForProfile).toHaveBeenCalledWith("profile-1");
      expect(listSkinScores).toHaveBeenCalledWith("user-1", "profile-1", 7);
      expect(listClinicalDocuments).toHaveBeenCalledWith("user-1", "profile-1");
      expect(listTimelineEvents).toHaveBeenCalledWith("user-1", "profile-1", 20);
      expect(listScreeningReminders).toHaveBeenCalledWith("user-1", "profile-1");
      expect(listEducationPrograms).toHaveBeenCalledWith("user-1", "profile-1");
      expect(getPreventionCurrent).toHaveBeenCalledWith("user-1", "profile-1");
      expect(listClinicalDocuments).toHaveBeenCalledTimes(1);
      expect(listTimelineEvents).toHaveBeenCalledTimes(1);
      expect(listScreeningReminders).toHaveBeenCalledTimes(1);
    });
  });
});
