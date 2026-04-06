import { render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";
import PF05 from "./success-screen";
import { AuthContext } from "../../../session/AuthProvider";
import { MockAccountAdapter } from "@portal/domains/account/mockAccountAdapter";
import { MockAppointmentAdapter } from "@portal/domains/appointments/mockAppointmentAdapter";
import { makeAuthContextValue } from "../../../../../test/renderWithAuthRouter";

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

describe("PF05 timeline logging", () => {
  it("appends appointment booking once with deterministic sourceRef", async () => {
    const adapter = new MockAccountAdapter();
    const profile = await adapter.ensureSelfProfile({
      userId: user.id,
      fullName: user.fullName,
    });

    const appendSpy = vi.spyOn(adapter, "appendTimelineEvent");
    const appointmentAdapter = new MockAppointmentAdapter();
    const appointmentCreateSpy = vi.spyOn(appointmentAdapter, "createAppointmentFromBooking");
    const authValue = makeAuthContextValue({
      isAuthenticated: true,
      user,
      profiles: [profile],
      actingProfileId: profile.id,
      actingProfile: profile,
      accountAdapter: adapter,
      appointmentAdapter,
    });

    render(
      <AuthContext.Provider value={authValue}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/patient-flow/confirmation-succes",
              state: {
                appointmentType: "presentiel",
                selectedSlot: {
                  date: "2026-02-25",
                  time: "10:30",
                },
                practitioner: {
                  id: "pract-awa-001",
                  name: "Dr. Awa Ndiaye",
                  specialty: "Dermatologie",
                  location: "Cabinet Mermoz, Dakar",
                  fee: "15 000 FCFA",
                },
                date: "2026-02-25",
                time: "10:30",
              },
            },
          ]}
        >
          <Routes>
            <Route path="/patient-flow/confirmation-succes" element={<PF05 />} />
            <Route path="/patient-flow/detail-confirmation" element={<div>Détail confirmation</div>} />
            <Route path="/patient-flow/confirmation" element={<div>Pré-consultation</div>} />
            <Route path="/patient-flow" element={<div>Flow PF</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );

    await waitFor(() => expect(appendSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(appointmentCreateSpy).toHaveBeenCalledTimes(1));
    expect(appendSpy.mock.calls[0][0]).toMatchObject({
      actorUserId: user.id,
      profileId: profile.id,
      type: "appointment_booked",
      source: "booking_flow",
      sourceRef: `booking:${profile.id}:2026-02-25:10:30:dr._awa_ndiaye:presentiel`,
    });
    expect(appointmentCreateSpy.mock.calls[0][0]).toMatchObject({
      bookingSourceRef: `booking:${profile.id}:2026-02-25:10:30:dr._awa_ndiaye:presentiel`,
      profileId: profile.id,
      createdByUserId: user.id,
      practitionerId: "pract-awa-001",
    });
  });
});
