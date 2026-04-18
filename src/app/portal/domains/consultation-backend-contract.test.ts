import { afterEach, describe, expect, it, vi } from "vitest";
import { BackendAccountAdapter } from "./account/backendAccountAdapter";
import { BackendAppointmentAdapter } from "./appointments/backendAppointmentAdapter";
import { BackendSchedulingAdapter } from "./scheduling/backendSchedulingAdapter";
import { removeStorageValue, writeStorageJson } from "@shared/lib/storage";

const SESSION_KEY = "melanis_auth_session_v1";
const API_BASE_URL = "http://localhost:8000";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Consultation backend adapter contracts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    removeStorageValue(SESSION_KEY);
  });

  it("uses the practitioner directory and availability backend contract", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p1" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "directory-1",
            practitionerId: "pract-001",
            displayName: "Dr. Awa Ndiaye",
            specialty: "Dermatologie",
            location: "Cabinet Mermoz, Dakar",
            appointmentTypes: ["presentiel", "video"],
            availableToday: true,
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "slot-1",
            practitionerId: "pract-001",
            appointmentType: "presentiel",
            startsAt: "2026-05-01T10:00:00.000Z",
            endsAt: "2026-05-01T10:30:00.000Z",
            dateKey: "2026-05-01",
            timeLabel: "10:00",
            isAvailable: true,
          },
        ]),
      );
    vi.stubGlobal("fetch", fetchMock);

    const schedulingAdapter = new BackendSchedulingAdapter(API_BASE_URL);
    const practitioners = await schedulingAdapter.listPractitioners("presentiel");
    const slots = await schedulingAdapter.listAvailability({
      practitionerId: "pract-001",
      appointmentType: "presentiel",
      dateFrom: "2026-05-01",
      days: 7,
    });

    expect(practitioners[0].practitionerId).toBe("pract-001");
    expect(slots[0].id).toBe("slot-1");

    const [directoryCall, availabilityCall] = fetchMock.mock.calls;
    expect(String(directoryCall[0])).toContain("/api/v1/practitioners");
    expect(String(directoryCall[0])).toContain("appointmentType=presentiel");
    expect((directoryCall[1] as RequestInit).headers).toBeInstanceOf(Headers);
    expect(((directoryCall[1] as RequestInit).headers as Headers).get("Authorization")).toBe(
      "Bearer token-p1",
    );

    expect(String(availabilityCall[0])).toContain(
      "/api/v1/practitioners/pract-001/availability",
    );
    expect(String(availabilityCall[0])).toContain("dateFrom=2026-05-01");
    expect(String(availabilityCall[0])).toContain("days=7");
  });

  it("persists booking, media upload intents, pre-consult submission, and practitioner review payloads", async () => {
    writeStorageJson(SESSION_KEY, { accessToken: "token-p1" });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          id: "appt-1",
          bookingSourceRef: "booking:profile-1:2026-05-01:10:00:dr_awa_ndiaye:presentiel",
          profileId: "profile-1",
          patientLabel: "Fatou Diop",
          availabilitySlotId: "slot-1",
          practitionerId: "pract-001",
          practitionerName: "Dr. Awa Ndiaye",
          practitionerSpecialty: "Dermatologie",
          practitionerLocation: "Cabinet Mermoz, Dakar",
          appointmentType: "presentiel",
          scheduledFor: "2026-05-01T10:00:00.000Z",
          dateLabel: "01/05/2026",
          timeLabel: "10:00",
          status: "scheduled",
          createdByUserId: "user-1",
          createdAt: "2026-04-18T10:00:00.000Z",
          updatedAt: "2026-04-18T10:00:00.000Z",
          preConsultData: {
            motif: "acne",
            photos: [{ assetId: "asset-1" }],
          },
          measurements: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: "asset-1",
            profileId: "profile-1",
            fileName: "lesion.jpg",
            contentType: "image/jpeg",
            status: "pending",
            uploadMethod: "PUT",
            uploadUrl: "http://public-storage.test/upload",
            createdAt: "2026-04-18T10:01:00.000Z",
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "asset-1",
          profileId: "profile-1",
          fileName: "lesion.jpg",
          contentType: "image/jpeg",
          status: "uploaded",
          uploadedAt: "2026-04-18T10:02:00.000Z",
          downloadUrl: "http://public-storage.test/download",
          createdAt: "2026-04-18T10:01:00.000Z",
          updatedAt: "2026-04-18T10:02:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "pre-1",
          profileId: "profile-1",
          appointmentId: "appt-1",
          createdByUserId: "user-1",
          practitionerId: "pract-001",
          appointmentType: "presentiel",
          questionnaireData: { motif: "acne", zones: ["Visage"] },
          mediaAssetIds: ["asset-1"],
          mediaAssets: [
            {
              id: "asset-1",
              profileId: "profile-1",
              appointmentId: "appt-1",
              preconsultSubmissionId: "pre-1",
              fileName: "lesion.jpg",
              contentType: "image/jpeg",
              status: "uploaded",
              uploadedAt: "2026-04-18T10:02:00.000Z",
              downloadUrl: "http://public-storage.test/download",
              createdAt: "2026-04-18T10:01:00.000Z",
              updatedAt: "2026-04-18T10:02:00.000Z",
            },
          ],
          submittedAt: "2026-04-18T10:03:00.000Z",
          createdAt: "2026-04-18T10:03:00.000Z",
          updatedAt: "2026-04-18T10:03:00.000Z",
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "appt-1",
          bookingSourceRef: "booking:profile-1:2026-05-01:10:00:dr_awa_ndiaye:presentiel",
          profileId: "profile-1",
          patientLabel: "Fatou Diop",
          availabilitySlotId: "slot-1",
          practitionerId: "pract-001",
          practitionerName: "Dr. Awa Ndiaye",
          practitionerSpecialty: "Dermatologie",
          practitionerLocation: "Cabinet Mermoz, Dakar",
          appointmentType: "presentiel",
          scheduledFor: "2026-05-01T10:00:00.000Z",
          dateLabel: "01/05/2026",
          timeLabel: "10:00",
          status: "scheduled",
          createdByUserId: "user-1",
          createdAt: "2026-04-18T10:00:00.000Z",
          updatedAt: "2026-04-18T10:03:00.000Z",
          preConsultData: {
            motif: "acne",
            photos: [{ assetId: "asset-1" }],
          },
          preConsultSubmission: {
            id: "pre-1",
            profileId: "profile-1",
            appointmentId: "appt-1",
            createdByUserId: "user-1",
            practitionerId: "pract-001",
            appointmentType: "presentiel",
            questionnaireData: { motif: "acne", zones: ["Visage"] },
            mediaAssetIds: ["asset-1"],
            mediaAssets: [
              {
                id: "asset-1",
                profileId: "profile-1",
                appointmentId: "appt-1",
                preconsultSubmissionId: "pre-1",
                fileName: "lesion.jpg",
                contentType: "image/jpeg",
                status: "uploaded",
                uploadedAt: "2026-04-18T10:02:00.000Z",
                downloadUrl: "http://public-storage.test/download",
                createdAt: "2026-04-18T10:01:00.000Z",
                updatedAt: "2026-04-18T10:02:00.000Z",
              },
            ],
            submittedAt: "2026-04-18T10:03:00.000Z",
            createdAt: "2026-04-18T10:03:00.000Z",
            updatedAt: "2026-04-18T10:03:00.000Z",
          },
          measurements: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: "pre-1",
          profileId: "profile-1",
          appointmentId: "appt-1",
          createdByUserId: "user-1",
          practitionerId: "pract-001",
          appointmentType: "presentiel",
          questionnaireData: { motif: "acne", zones: ["Visage"] },
          mediaAssetIds: ["asset-1"],
          mediaAssets: [
            {
              id: "asset-1",
              profileId: "profile-1",
              appointmentId: "appt-1",
              preconsultSubmissionId: "pre-1",
              fileName: "lesion.jpg",
              contentType: "image/jpeg",
              status: "uploaded",
              uploadedAt: "2026-04-18T10:02:00.000Z",
              downloadUrl: "http://public-storage.test/download",
              createdAt: "2026-04-18T10:01:00.000Z",
              updatedAt: "2026-04-18T10:02:00.000Z",
            },
          ],
          submittedAt: "2026-04-18T10:03:00.000Z",
          createdAt: "2026-04-18T10:03:00.000Z",
          updatedAt: "2026-04-18T10:03:00.000Z",
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const appointmentAdapter = new BackendAppointmentAdapter(API_BASE_URL);
    const accountAdapter = new BackendAccountAdapter(API_BASE_URL);

    const appointment = await appointmentAdapter.createAppointmentFromBooking({
      bookingSourceRef: "booking:profile-1:2026-05-01:10:00:dr_awa_ndiaye:presentiel",
      profileId: "profile-1",
      patientLabel: "Fatou Diop",
      availabilitySlotId: "slot-1",
      practitionerId: "pract-001",
      practitionerName: "Dr. Awa Ndiaye",
      practitionerSpecialty: "Dermatologie",
      practitionerLocation: "Cabinet Mermoz, Dakar",
      appointmentType: "presentiel",
      scheduledFor: "2026-05-01T10:00:00.000Z",
      dateLabel: "01/05/2026",
      timeLabel: "10:00",
      createdByUserId: "user-1",
      preConsultData: { motif: "acne", photos: [{ assetId: "asset-1" }] },
    });
    const intents = await accountAdapter.createMediaUploadIntents({
      actorUserId: "user-1",
      profileId: "profile-1",
      files: [{ fileName: "lesion.jpg", contentType: "image/jpeg" }],
    });
    const completedAsset = await accountAdapter.completeMediaUpload({
      actorUserId: "user-1",
      assetId: "asset-1",
    });
    const submission = await accountAdapter.createPreConsultSubmission({
      actorUserId: "user-1",
      profileId: "profile-1",
      appointmentId: appointment.id,
      practitionerId: "pract-001",
      appointmentType: "presentiel",
      questionnaireData: { motif: "acne", zones: ["Visage"] },
      mediaAssetIds: ["asset-1"],
    });
    const practitionerViewAppointment = await appointmentAdapter.getAppointmentById("appt-1");
    const practitionerViewSubmission =
      await accountAdapter.getPreConsultSubmissionForAppointment("user-practitioner", "appt-1");

    expect(appointment.practitionerId).toBe("pract-001");
    expect(intents[0].uploadUrl).toContain("public-storage.test");
    expect(completedAsset.status).toBe("uploaded");
    expect(submission.mediaAssets[0].downloadUrl).toContain("public-storage.test");
    expect(practitionerViewAppointment?.preConsultSubmission?.id).toBe("pre-1");
    expect(practitionerViewSubmission?.mediaAssetIds).toEqual(["asset-1"]);

    const bookingCall = fetchMock.mock.calls[0];
    expect(String(bookingCall[0])).toContain("/api/v1/appointments/from-booking");
    expect((bookingCall[1] as RequestInit).method).toBe("POST");
    expect(JSON.parse(String((bookingCall[1] as RequestInit).body))).toMatchObject({
      profileId: "profile-1",
      availabilitySlotId: "slot-1",
      practitionerId: "pract-001",
    });

    const uploadIntentCall = fetchMock.mock.calls[1];
    expect(String(uploadIntentCall[0])).toContain("/api/v1/preconsult/media-assets/upload-intents");

    const submissionCall = fetchMock.mock.calls[3];
    expect(String(submissionCall[0])).toContain("/api/v1/preconsult/submissions");
    expect(JSON.parse(String((submissionCall[1] as RequestInit).body))).toMatchObject({
      appointmentId: "appt-1",
      practitionerId: "pract-001",
      mediaAssetIds: ["asset-1"],
    });

    const appointmentDetailCall = fetchMock.mock.calls[4];
    expect(String(appointmentDetailCall[0])).toContain("/api/v1/appointments/appt-1");

    const preconsultDetailCall = fetchMock.mock.calls[5];
    expect(String(preconsultDetailCall[0])).toContain(
      "/api/v1/preconsult/submissions/appointment/appt-1",
    );

    for (const [, init] of fetchMock.mock.calls) {
      expect(((init as RequestInit).headers as Headers).get("Authorization")).toBe(
        "Bearer token-p1",
      );
    }
  });
});
