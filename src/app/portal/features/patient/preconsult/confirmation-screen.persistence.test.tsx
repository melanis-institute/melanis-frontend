import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import PF04 from "./confirmation-screen";
import { AuthContext } from "../../../session/AuthProvider";
import { makeAuthContextValue } from "../../../../../test/renderWithAuthRouter";
import type { PractitionerDirectoryEntry } from "@portal/domains/scheduling/types";

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

const practitioner: PractitionerDirectoryEntry = {
  id: "directory-1",
  practitionerId: "pract-awa-001",
  displayName: "Dr. Awa Ndiaye",
  specialty: "Dermatologie",
  location: "Cabinet Mermoz, Dakar",
  appointmentTypes: ["presentiel", "video"],
  priceFromLabel: "15 000 FCFA",
  rating: 4.9,
  reviewCount: 12,
  photoUrl: undefined,
  availableToday: true,
};

describe("PF04 booking persistence", () => {
  it("persists the appointment and pre-consult before navigating to success", async () => {
    const createAppointmentFromBooking = vi.fn().mockResolvedValue({
      id: "appt-123",
      bookingSourceRef: "booking:1",
      profileId: "profile-1",
      patientLabel: "Fatou Diop",
      practitionerId: practitioner.practitionerId,
      practitionerName: practitioner.displayName,
      practitionerLocation: practitioner.location,
      practitionerSpecialty: practitioner.specialty,
      appointmentType: "presentiel",
      scheduledFor: "2026-02-25T10:30:00.000Z",
      dateLabel: "Mercredi 25 février 2026",
      timeLabel: "10:30",
      status: "scheduled",
      createdByUserId: user.id,
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-01T09:00:00.000Z",
      measurements: [],
    });
    const createPreConsultSubmission = vi.fn().mockResolvedValue({
      id: "pre-123",
      profileId: "profile-1",
      appointmentId: "appt-123",
      createdByUserId: user.id,
      practitionerId: practitioner.practitionerId,
      appointmentType: "presentiel",
      questionnaireData: { motif: "acne", photos: [] },
      mediaAssetIds: [],
      mediaAssets: [],
      submittedAt: "2026-02-01T09:00:00.000Z",
      createdAt: "2026-02-01T09:00:00.000Z",
      updatedAt: "2026-02-01T09:00:00.000Z",
    });

    const authValue = makeAuthContextValue({
      isAuthenticated: true,
      user,
      profiles: [
        {
          id: "profile-1",
          ownerUserId: user.id,
          relationship: "moi",
          firstName: "Fatou",
          lastName: "Diop",
          dateOfBirth: "",
          isDependent: false,
          createdAt: "2026-02-01T09:00:00.000Z",
          updatedAt: "2026-02-01T09:00:00.000Z",
        },
      ],
      actingProfileId: "profile-1",
      actingProfile: {
        id: "profile-1",
        ownerUserId: user.id,
        relationship: "moi",
        firstName: "Fatou",
        lastName: "Diop",
        dateOfBirth: "",
        isDependent: false,
        createdAt: "2026-02-01T09:00:00.000Z",
        updatedAt: "2026-02-01T09:00:00.000Z",
      },
      accountAdapter: {
        createPreConsultSubmission,
      } as never,
      appointmentAdapter: {
        createAppointmentFromBooking,
      } as never,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/patient-flow/detail-confirmation",
              state: {
                appointmentType: "presentiel",
                practitioner,
                selectedSlot: {
                  date: "Mercredi 25 février 2026",
                  time: "10:30",
                  startsAt: "2026-02-25T10:30:00.000Z",
                },
                availabilitySlotId: "slot-1",
                date: "2026-02-25",
                time: "10:30",
                preConsultData: {
                  motif: "acne",
                  photos: [],
                },
              },
            },
          ]}
        >
          <Routes>
            <Route path="/patient-flow/detail-confirmation" element={<PF04 />} />
            <Route path="/patient-flow/confirmation-succes" element={<div>Success route</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    const userInput = userEvent.setup();
    const confirmButton = await screen.findByRole("button", {
      name: /confirmer le rendez-vous/i,
    });

    await waitFor(() => expect(confirmButton).toBeEnabled());
    await userInput.click(confirmButton);

    await waitFor(() => expect(createAppointmentFromBooking).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(createPreConsultSubmission).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("Success route")).toBeInTheDocument();

    expect(createAppointmentFromBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile-1",
        createdByUserId: user.id,
        availabilitySlotId: "slot-1",
        practitionerId: practitioner.practitionerId,
      }),
    );
    expect(createPreConsultSubmission).toHaveBeenCalledWith(
      expect.objectContaining({
        profileId: "profile-1",
        appointmentId: "appt-123",
        practitionerId: practitioner.practitionerId,
        mediaAssetIds: [],
      }),
    );
  });
});
