import { screen } from "@testing-library/react";
import type {
  ClinicalDocumentRecord,
  PatientRecordEvent,
  ScreeningReminder,
  SkinScoreRecord,
} from "@portal/domains/account/types";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuthRouter } from "../../../../../test/renderWithAuthRouter";
import { DashboardHome } from "./screen";

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
});
