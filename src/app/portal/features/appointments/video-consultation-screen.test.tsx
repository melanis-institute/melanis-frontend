import { screen, waitFor } from "@testing-library/react";
import type { AppointmentRecord } from "@portal/domains/appointments/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithAuthRouter } from "../../../../test/renderWithAuthRouter";
import VideoConsultationScreen from "./video-consultation-screen";

const appointment: AppointmentRecord = {
  id: "appt-video-1",
  bookingSourceRef: "booking-video-1",
  profileId: "profile-1",
  patientLabel: "Awa Ndiaye",
  practitionerId: "pract-001",
  practitionerName: "Dr. Aissatou Ly",
  practitionerSpecialty: "Dermatologie",
  practitionerLocation: "Consultation video",
  appointmentType: "video",
  scheduledFor: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  dateLabel: "Aujourd'hui",
  timeLabel: "14:30",
  status: "scheduled",
  createdByUserId: "user-1",
  createdAt: "2026-04-07T08:00:00.000Z",
  updatedAt: "2026-04-07T08:00:00.000Z",
  measurements: [],
};

function renderScreen(options?: {
  getAppointmentById?: ReturnType<typeof vi.fn>;
  issueVideoToken?: ReturnType<typeof vi.fn>;
}) {
  const getAppointmentById =
    options?.getAppointmentById ?? vi.fn().mockResolvedValue(appointment);
  const issueVideoToken =
    options?.issueVideoToken ??
    vi.fn().mockResolvedValue({
      domain: "meet.melanis.test",
      roomName: "consult_abc123",
      jwt: "signed-token",
      expiresAt: 1770000000,
      joinAvailableAt: "2026-04-07T14:00:00.000Z",
      userInfo: {
        displayName: "Awa Ndiaye",
      },
    });

  renderWithAuthRouter({
    routes: [
      {
        path: "/patient-flow/auth/appointments/:appointmentId/video",
        element: <VideoConsultationScreen role="patient" />,
      },
      {
        path: "/patient-flow/auth/dashboard",
        element: <div>Dashboard</div>,
      },
    ],
    initialEntries: ["/patient-flow/auth/appointments/appt-video-1/video"],
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
      appointmentAdapter: {
        getAppointmentById,
        issueVideoToken,
      } as never,
    },
  });

  return { getAppointmentById, issueVideoToken };
}

describe("video consultation screen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.JitsiMeetExternalAPI;
  });

  it("mounts the embedded Jitsi room with the issued token", async () => {
    const constructor = vi.fn().mockImplementation(() => ({ dispose: vi.fn() }));
    window.JitsiMeetExternalAPI = constructor as never;

    const { getAppointmentById, issueVideoToken } = renderScreen();

    expect(await screen.findByText("Salle sécurisée Melanis")).toBeInTheDocument();
    await waitFor(() => {
      expect(getAppointmentById).toHaveBeenCalledWith("appt-video-1");
      expect(issueVideoToken).toHaveBeenCalledWith("appt-video-1");
      expect(constructor).toHaveBeenCalledWith(
        "meet.melanis.test",
        expect.objectContaining({
          roomName: "consult_abc123",
          jwt: "signed-token",
        }),
      );
    });
  });

  it("shows a clear message when the backend rejects an early join", async () => {
    window.JitsiMeetExternalAPI = vi.fn() as never;

    renderScreen({
      issueVideoToken: vi.fn().mockRejectedValue({
        status: 400,
        error_code: "APPOINTMENT_VIDEO_NOT_AVAILABLE",
        detail: "Video consultation is not available yet",
      }),
    });

    expect(
      await screen.findByText(
        "La consultation vidéo sera disponible 30 minutes avant le rendez-vous.",
      ),
    ).toBeInTheDocument();
  });
});
