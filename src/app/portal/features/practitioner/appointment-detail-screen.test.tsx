import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type {
  ClinicalDocumentRecord,
  ClinicalMeasurement,
  ScreeningReminder,
} from "@portal/domains/account/types";
import type { AppointmentRecord, ClinicalOutcomeRecord } from "@portal/domains/appointments/types";
import { describe, expect, it, vi } from "vitest";
import { renderWithAuthRouter } from "../../../../test/renderWithAuthRouter";
import Screen from "./appointment-detail-screen";

const appointmentId = "appt-1";
const practitionerId = "pract-001";

function buildAppointment(
  overrides: Partial<AppointmentRecord> = {},
): AppointmentRecord {
  return {
    id: appointmentId,
    bookingSourceRef: "booking:1",
    profileId: "profile-1",
    patientLabel: "Abdou Aziz Ndiaye",
    practitionerId,
    practitionerName: "Dr. Aissatou Ly",
    practitionerLocation: "Cabinet Mermoz, Dakar",
    practitionerSpecialty: "Dermatologie",
    appointmentType: "presentiel",
    scheduledFor: "2026-04-07T14:30:00.000Z",
    dateLabel: "07/04/2026",
    timeLabel: "14:30",
    status: "in_consultation",
    createdByUserId: "patient-1",
    createdAt: "2026-04-07T10:00:00.000Z",
    updatedAt: "2026-04-07T10:00:00.000Z",
    measurements: [],
    ...overrides,
  };
}

function renderScreen(options?: {
  appointment?: AppointmentRecord;
  documents?: ClinicalDocumentRecord[];
  createClinicalOutcomeResult?: ClinicalOutcomeRecord;
}) {
  const appointment = options?.appointment ?? buildAppointment();
  const documents = options?.documents ?? [];
  const createClinicalOutcomeResult =
    options?.createClinicalOutcomeResult ?? {
      appointment,
      documents,
      followUpReminder: undefined as ScreeningReminder | undefined,
    };

  const appointmentAdapter = {
    getAppointmentById: vi.fn().mockResolvedValue(appointment),
    transitionAppointmentStatus: vi.fn().mockResolvedValue(appointment),
    createClinicalOutcome: vi.fn().mockResolvedValue(createClinicalOutcomeResult),
  };

  const accountAdapter = {
    getPreConsultSubmissionForAppointment: vi.fn().mockResolvedValue(null),
    listClinicalDocuments: vi.fn().mockResolvedValue(documents),
  };

  renderWithAuthRouter({
    routes: [
      {
        path: "/patient-flow/practitioner/appointments/:appointmentId",
        element: <Screen />,
      },
      {
        path: "/patient-flow/auth/connexion",
        element: <div>Connexion</div>,
      },
    ],
    initialEntries: [`/patient-flow/practitioner/appointments/${appointmentId}`],
    authOverrides: {
      isAuthenticated: true,
      user: {
        id: "user-practitioner",
        fullName: "Dr. Aissatou Ly",
        phoneE164: "+221770000001",
        countryCode: "+221",
        roles: ["practitioner"],
        practitionerId,
        hasPin: true,
        createdAt: "2026-04-07T10:00:00.000Z",
        updatedAt: "2026-04-07T10:00:00.000Z",
      },
      appointmentAdapter: appointmentAdapter as never,
      accountAdapter: accountAdapter as never,
    },
  });

  return { appointmentAdapter, accountAdapter, appointment };
}

describe("practitioner appointment detail screen", () => {
  it("restores a saved draft for the same appointment", async () => {
    window.localStorage.setItem(
      `melanis_practitioner_consult_draft:${appointmentId}`,
      JSON.stringify({
        diagnosis: "Acne restauree",
        clinicalSummary: "Resume restaure",
        prescriptionRows: [
          {
            id: "row-1",
            type: "medication",
            name: "Adapalene gel",
            instructions: "Le soir pendant 30 jours",
          },
        ],
        measurementText: "Hydratation | 62 | %",
        followUpCadence: "monthly",
        followUpDueAt: "2026-05-07",
        updatedAt: Date.now(),
      }),
    );

    renderScreen();

    expect(await screen.findByDisplayValue("Acne restauree")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Resume restaure")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Adapalene gel")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Le soir pendant 30 jours")).toBeInTheDocument();
    expect(screen.getByText("Brouillon restauré")).toBeInTheDocument();
  });

  it("publishes structured prescription rows and clears the local draft", async () => {
    window.localStorage.setItem(
      `melanis_practitioner_consult_draft:${appointmentId}`,
      JSON.stringify({
        diagnosis: "Dermatite de contact",
        clinicalSummary: "Routine anti-inflammatoire",
        prescriptionRows: [
          {
            id: "row-1",
            type: "medication",
            name: "Dermocorticoide local",
            instructions: "Le soir pendant 7 jours",
          },
          {
            id: "row-2",
            type: "care",
            name: "Baume emollient",
            instructions: "Matin et soir pendant 30 jours",
          },
        ],
        measurementText: "Hydratation | 62 | %",
        followUpCadence: "monthly",
        followUpDueAt: "2026-05-07",
        updatedAt: Date.now(),
      }),
    );

    const { appointmentAdapter } = renderScreen();
    const user = userEvent.setup();

    await screen.findByDisplayValue("Dermatite de contact");
    await user.click(screen.getByRole("button", { name: /publier cote patient/i }));

    await waitFor(() =>
      expect(appointmentAdapter.createClinicalOutcome).toHaveBeenCalledWith({
        appointmentId,
        actorUserId: "user-practitioner",
        diagnosis: "Dermatite de contact",
        clinicalSummary: "Routine anti-inflammatoire",
        prescriptionItems: [
          {
            name: "Dermocorticoide local",
            instructions: "Le soir pendant 7 jours",
            isMedication: true,
          },
          {
            name: "Baume emollient",
            instructions: "Matin et soir pendant 30 jours",
            isMedication: false,
          },
        ],
        measurements: [
          {
            label: "Hydratation",
            value: "62",
            unit: "%",
          } satisfies ClinicalMeasurement,
        ],
        followUpCadence: "monthly",
        followUpDueAt: "2026-05-07",
        notifyPatient: true,
      }),
    );

    await waitFor(() =>
      expect(
        window.localStorage.getItem(
          `melanis_practitioner_consult_draft:${appointmentId}`,
        ),
      ).toBeNull(),
    );
  });

  it("disables printing when there is no draft row and no published ordonnance", async () => {
    renderScreen({
      appointment: buildAppointment({ status: "scheduled" }),
      documents: [],
    });

    const button = await screen.findByRole("button", {
      name: /imprimer l'ordonnance/i,
    });
    expect(button).toBeDisabled();
  });

  it("enables printing when a published ordonnance already exists", async () => {
    renderScreen({
      documents: [
        {
          id: "doc-1",
          profileId: "profile-1",
          appointmentId,
          practitionerId,
          createdByUserId: "user-practitioner",
          kind: "prescription",
          status: "published",
          title: "Ordonnance dermatologique",
          summary: "Plan de traitement",
          body: "- Adapalene gel",
          prescriptionItems: [
            {
              name: "Adapalene gel",
              instructions: "Le soir pendant 30 jours",
              isMedication: true,
            },
          ],
          version: 1,
          publishedAt: "2026-04-07T15:30:00.000Z",
          createdAt: "2026-04-07T15:30:00.000Z",
          updatedAt: "2026-04-07T15:30:00.000Z",
        },
      ],
    });

    const button = await screen.findByRole("button", {
      name: /imprimer l'ordonnance/i,
    });
    expect(button).toBeEnabled();
  });
});
