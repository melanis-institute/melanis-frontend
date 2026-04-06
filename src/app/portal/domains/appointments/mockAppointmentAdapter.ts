import type {
  AppointmentAdapter,
  CreateAppointmentFromBookingInput,
  TransitionAppointmentStatusInput,
} from "./adapter.types";
export { practitionerIdFromName } from "./practitioner";
import {
  NEXT_STATUS_BY_CURRENT,
  type AppointmentAuditEvent,
  type AppointmentRecord,
} from "./types";
import { readStorageJson, writeStorageJson } from "@shared/lib/storage";

const APPOINTMENTS_KEY = "melanis_appointments_v1";
const APPOINTMENT_AUDIT_KEY = "melanis_appointments_audit_v1";

function safeRead<T>(key: string, fallback: T): T {
  return readStorageJson(key, fallback);
}

function safeWrite<T>(key: string, value: T) {
  writeStorageJson(key, value);
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function deterministicAppointmentId(sourceRef: string): string {
  const normalized = sourceRef
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `appt_${(normalized || randomId("fallback")).slice(0, 100)}`;
}

function readAppointments() {
  return safeRead<AppointmentRecord[]>(APPOINTMENTS_KEY, []);
}

function writeAppointments(appointments: AppointmentRecord[]) {
  safeWrite(APPOINTMENTS_KEY, appointments.slice(-5000));
}

function readAuditEvents() {
  return safeRead<AppointmentAuditEvent[]>(APPOINTMENT_AUDIT_KEY, []);
}

function writeAuditEvents(events: AppointmentAuditEvent[]) {
  safeWrite(APPOINTMENT_AUDIT_KEY, events.slice(-8000));
}

function appendAuditEvent(event: Omit<AppointmentAuditEvent, "id" | "createdAt">) {
  const events = readAuditEvents();
  events.push({
    id: randomId("appt_audit"),
    createdAt: nowIso(),
    ...event,
  });
  writeAuditEvents(events);
}

function sortByScheduleAsc(records: AppointmentRecord[]) {
  return [...records].sort((a, b) => {
    const aTs = Date.parse(a.scheduledFor);
    const bTs = Date.parse(b.scheduledFor);

    if (Number.isFinite(aTs) && Number.isFinite(bTs)) {
      return aTs - bTs;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function assertValidIsoDate(value: string, fieldLabel: string) {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new Error(`${fieldLabel} invalide`);
  }
}

export class MockAppointmentAdapter implements AppointmentAdapter {
  async createAppointmentFromBooking(
    input: CreateAppointmentFromBookingInput,
  ): Promise<AppointmentRecord> {
    assertValidIsoDate(input.scheduledFor, "Date de rendez-vous");

    const appointments = readAppointments();
    const existing = appointments.find((item) => item.bookingSourceRef === input.bookingSourceRef);
    if (existing) {
      return existing;
    }

    const createdAt = nowIso();
    const appointment: AppointmentRecord = {
      id: deterministicAppointmentId(input.bookingSourceRef),
      bookingSourceRef: input.bookingSourceRef,
      profileId: input.profileId,
      patientLabel: input.patientLabel,
      availabilitySlotId: input.availabilitySlotId,
      practitionerId: input.practitionerId,
      practitionerName: input.practitionerName,
      practitionerSpecialty: input.practitionerSpecialty,
      practitionerLocation: input.practitionerLocation,
      appointmentType: input.appointmentType,
      scheduledFor: input.scheduledFor,
      dateLabel: input.dateLabel,
      timeLabel: input.timeLabel,
      status: "scheduled",
      createdByUserId: input.createdByUserId,
      createdAt,
      updatedAt: createdAt,
      preConsultData: input.preConsultData,
    };

    appointments.push(appointment);
    writeAppointments(appointments);

    appendAuditEvent({
      appointmentId: appointment.id,
      actorUserId: input.createdByUserId,
      action: "appointment.created",
      toStatus: appointment.status,
    });

    return appointment;
  }

  async listAppointmentsForPractitioner(practitionerId: string): Promise<AppointmentRecord[]> {
    return sortByScheduleAsc(
      readAppointments().filter((item) => item.practitionerId === practitionerId),
    );
  }

  async listAppointmentsForProfile(profileId: string): Promise<AppointmentRecord[]> {
    return sortByScheduleAsc(
      readAppointments().filter((item) => item.profileId === profileId),
    );
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentRecord | null> {
    return readAppointments().find((item) => item.id === appointmentId) ?? null;
  }

  async transitionAppointmentStatus(
    input: TransitionAppointmentStatusInput,
  ): Promise<AppointmentRecord> {
    const appointments = readAppointments();
    const target = appointments.find((item) => item.id === input.appointmentId);

    if (!target) {
      throw new Error("Rendez-vous introuvable");
    }

    const expectedNext = NEXT_STATUS_BY_CURRENT[target.status];
    if (!expectedNext || input.toStatus !== expectedNext) {
      throw new Error("Transition de statut invalide");
    }

    const previousStatus = target.status;
    const now = nowIso();

    target.status = input.toStatus;
    target.updatedAt = now;

    if (input.toStatus === "checked_in") {
      target.checkedInAt = now;
    }
    if (input.toStatus === "in_consultation") {
      target.inConsultationAt = now;
    }
    if (input.toStatus === "completed") {
      target.completedAt = now;
    }

    writeAppointments(appointments);

    appendAuditEvent({
      appointmentId: target.id,
      actorUserId: input.actorUserId,
      action: "appointment.status.transition",
      fromStatus: previousStatus,
      toStatus: input.toStatus,
    });

    return target;
  }
}

export const mockAppointmentAdapter = new MockAppointmentAdapter();
