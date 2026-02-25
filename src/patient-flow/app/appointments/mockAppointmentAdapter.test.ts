import { beforeEach, describe, expect, it } from "vitest";
import { MockAppointmentAdapter, practitionerIdFromName } from "./mockAppointmentAdapter";

describe("MockAppointmentAdapter", () => {
  let adapter: MockAppointmentAdapter;

  beforeEach(() => {
    window.localStorage.clear();
    adapter = new MockAppointmentAdapter();
  });

  it("creates bookings idempotently by bookingSourceRef", async () => {
    const input = {
      bookingSourceRef: "booking:profile_1:2026-02-25:10:30:dr_awa:presentiel",
      profileId: "profile_1",
      patientLabel: "Amina Diop",
      practitionerId: "prac_dr_awa_ndiaye",
      practitionerName: "Dr. Awa Ndiaye",
      appointmentType: "presentiel" as const,
      scheduledFor: "2026-02-25T10:30:00.000Z",
      dateLabel: "2026-02-25",
      timeLabel: "10:30",
      createdByUserId: "u_patient",
    };

    const first = await adapter.createAppointmentFromBooking(input);
    const second = await adapter.createAppointmentFromBooking(input);

    expect(second.id).toBe(first.id);
    const list = await adapter.listAppointmentsForProfile("profile_1");
    expect(list).toHaveLength(1);
  });

  it("lists appointments for the targeted practitioner", async () => {
    await adapter.createAppointmentFromBooking({
      bookingSourceRef: "booking:a",
      profileId: "profile_1",
      patientLabel: "Amina",
      practitionerId: "prac_1",
      practitionerName: "Dr. One",
      appointmentType: "video",
      scheduledFor: "2026-02-25T10:30:00.000Z",
      dateLabel: "2026-02-25",
      timeLabel: "10:30",
      createdByUserId: "u1",
    });

    await adapter.createAppointmentFromBooking({
      bookingSourceRef: "booking:b",
      profileId: "profile_2",
      patientLabel: "Mariama",
      practitionerId: "prac_2",
      practitionerName: "Dr. Two",
      appointmentType: "presentiel",
      scheduledFor: "2026-02-26T09:00:00.000Z",
      dateLabel: "2026-02-26",
      timeLabel: "09:00",
      createdByUserId: "u2",
    });

    const forPracOne = await adapter.listAppointmentsForPractitioner("prac_1");
    expect(forPracOne).toHaveLength(1);
    expect(forPracOne[0].patientLabel).toBe("Amina");
  });

  it("supports valid lifecycle transitions in strict order", async () => {
    const appointment = await adapter.createAppointmentFromBooking({
      bookingSourceRef: "booking:lifecycle",
      profileId: "profile_1",
      patientLabel: "Amina",
      practitionerId: "prac_1",
      practitionerName: "Dr. One",
      appointmentType: "presentiel",
      scheduledFor: "2026-02-25T10:30:00.000Z",
      dateLabel: "2026-02-25",
      timeLabel: "10:30",
      createdByUserId: "u1",
    });

    const checkedIn = await adapter.transitionAppointmentStatus({
      appointmentId: appointment.id,
      actorUserId: "u_prac",
      toStatus: "checked_in",
    });
    expect(checkedIn.status).toBe("checked_in");

    const inConsultation = await adapter.transitionAppointmentStatus({
      appointmentId: appointment.id,
      actorUserId: "u_prac",
      toStatus: "in_consultation",
    });
    expect(inConsultation.status).toBe("in_consultation");

    const completed = await adapter.transitionAppointmentStatus({
      appointmentId: appointment.id,
      actorUserId: "u_prac",
      toStatus: "completed",
    });
    expect(completed.status).toBe("completed");
  });

  it("rejects invalid status transitions", async () => {
    const appointment = await adapter.createAppointmentFromBooking({
      bookingSourceRef: "booking:invalid-transition",
      profileId: "profile_1",
      patientLabel: "Amina",
      practitionerId: "prac_1",
      practitionerName: "Dr. One",
      appointmentType: "presentiel",
      scheduledFor: "2026-02-25T10:30:00.000Z",
      dateLabel: "2026-02-25",
      timeLabel: "10:30",
      createdByUserId: "u1",
    });

    await expect(
      adapter.transitionAppointmentStatus({
        appointmentId: appointment.id,
        actorUserId: "u_prac",
        toStatus: "completed",
      }),
    ).rejects.toThrow("Transition de statut invalide");
  });

  it("derives deterministic practitioner IDs from names", () => {
    expect(practitionerIdFromName("Dr. Awa Ndiaye")).toBe("prac_dr_awa_ndiaye");
  });
});
