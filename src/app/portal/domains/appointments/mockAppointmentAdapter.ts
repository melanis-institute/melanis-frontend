import type {
  AppointmentAdapter,
  CreateClinicalOutcomeInput,
  CreateAppointmentFromBookingInput,
  TransitionAppointmentStatusInput,
} from "./adapter.types";
export { practitionerIdFromName } from "./practitioner";
import {
  NEXT_STATUS_BY_CURRENT,
  type AppointmentAuditEvent,
  type AppointmentRecord,
  type ClinicalOutcomeRecord,
  type VideoTokenRecord,
} from "./types";
import type { ClinicalDocumentRecord, ScreeningReminder } from "@portal/domains/account/types";
import { readStorageJson, writeStorageJson } from "@shared/lib/storage";

const APPOINTMENTS_KEY = "melanis_appointments_v1";
const APPOINTMENT_AUDIT_KEY = "melanis_appointments_audit_v1";
const CLINICAL_DOCUMENTS_KEY = "melanis_account_clinical_documents_v1";
const SCREENING_REMINDERS_KEY = "melanis_account_screening_reminders_v1";
const TIMELINE_KEY = "melanis_account_timeline_v1";

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

function deterministicRoomName(appointmentId: string): string {
  return `consult_demo_${appointmentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
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

function readClinicalDocuments() {
  return safeRead<ClinicalDocumentRecord[]>(CLINICAL_DOCUMENTS_KEY, []);
}

function writeClinicalDocuments(documents: ClinicalDocumentRecord[]) {
  safeWrite(CLINICAL_DOCUMENTS_KEY, documents);
}

function readScreeningReminders() {
  return safeRead<ScreeningReminder[]>(SCREENING_REMINDERS_KEY, []);
}

function writeScreeningReminders(reminders: ScreeningReminder[]) {
  safeWrite(SCREENING_REMINDERS_KEY, reminders);
}

function readTimelineEvents() {
  return safeRead(TIMELINE_KEY, []);
}

function writeTimelineEvents(events: unknown[]) {
  safeWrite(TIMELINE_KEY, events);
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
      measurements: [],
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

  async createClinicalOutcome(
    input: CreateClinicalOutcomeInput,
  ): Promise<ClinicalOutcomeRecord> {
    const appointments = readAppointments();
    const target = appointments.find((item) => item.id === input.appointmentId);

    if (!target) {
      throw new Error("Rendez-vous introuvable");
    }
    if (target.status !== "in_consultation" && target.status !== "completed") {
      throw new Error("Le compte-rendu n'est disponible qu'après le début de consultation");
    }

    const now = nowIso();
    target.diagnosis = input.diagnosis?.trim() || undefined;
    target.clinicalSummary = input.clinicalSummary?.trim() || undefined;
    target.measurements = input.measurements;
    target.followUpCadence = input.followUpCadence;
    target.followUpDueAt = input.followUpDueAt;
    target.carePlanUpdatedAt = now;
    target.updatedAt = now;
    writeAppointments(appointments);

    const documents = readClinicalDocuments();
    const nextDocuments: ClinicalDocumentRecord[] = [];

    if (input.prescriptionItems.length > 0) {
      nextDocuments.push({
        id: randomId("doc"),
        profileId: target.profileId,
        appointmentId: target.id,
        practitionerId: target.practitionerId,
        createdByUserId: input.actorUserId,
        kind: "prescription",
        status: "published",
        title: "Ordonnance dermatologique",
        summary: target.diagnosis ?? target.clinicalSummary,
        body: input.prescriptionItems.map((item) => `${item.name}: ${item.instructions}`).join("\n"),
        prescriptionItems: input.prescriptionItems,
        version: 1,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (target.diagnosis || target.clinicalSummary || input.measurements.length > 0) {
      nextDocuments.push({
        id: randomId("doc"),
        profileId: target.profileId,
        appointmentId: target.id,
        practitionerId: target.practitionerId,
        createdByUserId: input.actorUserId,
        kind: "report",
        status: "published",
        title: "Compte-rendu de consultation",
        summary: target.clinicalSummary ?? target.diagnosis,
        body: [target.diagnosis, target.clinicalSummary].filter(Boolean).join("\n\n"),
        prescriptionItems: [],
        version: 1,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    const mergedDocuments = [...documents, ...nextDocuments];
    writeClinicalDocuments(mergedDocuments);

    const reminders = readScreeningReminders();
    let followUpReminder: ScreeningReminder | undefined;
    if (input.followUpCadence && input.followUpDueAt) {
      followUpReminder = {
        id: randomId("screening"),
        profileId: target.profileId,
        screeningType: "Suivi dermatologique",
        cadence: input.followUpCadence,
        status: "active",
        nextDueAt: input.followUpDueAt,
        channels: { sms: true, whatsapp: true, email: false },
        updatedAt: now,
      };
      writeScreeningReminders([...reminders, followUpReminder]);
    }

    const timeline = readTimelineEvents() as Array<Record<string, unknown>>;
    const timelineEvents = [...timeline];
    for (const document of nextDocuments) {
      timelineEvents.push({
        id: randomId("timeline"),
        profileId: target.profileId,
        type: document.kind === "prescription" ? "prescription_issued" : "document_shared",
        title: document.title,
        occurredAt: now,
        source: "clinical_document",
        sourceRef: document.id,
      });
    }
    if (followUpReminder) {
      timelineEvents.push({
        id: randomId("timeline"),
        profileId: target.profileId,
        type: "follow_up_scheduled",
        title: "Suivi dermatologique",
        description: `Prochaine échéance le ${input.followUpDueAt}`,
        occurredAt: now,
        source: "screening_reminder",
        sourceRef: followUpReminder.id,
      });
    }
    writeTimelineEvents(timelineEvents);

    return {
      appointment: target,
      documents: nextDocuments as ClinicalOutcomeRecord["documents"],
      followUpReminder: followUpReminder as ClinicalOutcomeRecord["followUpReminder"],
    };
  }

  async issueVideoToken(appointmentId: string): Promise<VideoTokenRecord> {
    const target = readAppointments().find((item) => item.id === appointmentId);

    if (!target) {
      throw new Error("Rendez-vous introuvable");
    }
    if (target.appointmentType !== "video") {
      throw new Error("Ce rendez-vous n'est pas une consultation vidéo");
    }
    if (target.status === "completed") {
      throw new Error("Cette consultation est terminée");
    }

    const joinAvailableAt = new Date(Date.parse(target.scheduledFor) - 30 * 60 * 1000);
    if (Date.now() < joinAvailableAt.getTime()) {
      throw new Error("La consultation vidéo n'est pas encore disponible");
    }

    return {
      domain: "meet.jit.si",
      roomName: deterministicRoomName(appointmentId),
      jwt: "mock-jitsi-token",
      expiresAt: Math.floor(Date.now() / 1000) + 900,
      joinAvailableAt: joinAvailableAt.toISOString(),
      userInfo: {
        displayName: target.patientLabel,
      },
    };
  }
}

export const mockAppointmentAdapter = new MockAppointmentAdapter();
