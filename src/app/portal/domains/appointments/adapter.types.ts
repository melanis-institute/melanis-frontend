import type { AppointmentType } from "@portal/shared/types/flow";
import type { AppointmentRecord, AppointmentStatus } from "./types";

export interface CreateAppointmentFromBookingInput {
  bookingSourceRef: string;
  profileId: string;
  patientLabel: string;
  practitionerId: string;
  practitionerName: string;
  practitionerSpecialty?: string;
  practitionerLocation?: string;
  appointmentType: AppointmentType;
  scheduledFor: string;
  dateLabel: string;
  timeLabel: string;
  createdByUserId: string;
  preConsultData?: unknown;
}

export interface TransitionAppointmentStatusInput {
  appointmentId: string;
  actorUserId: string;
  toStatus: AppointmentStatus;
}

export interface AppointmentAdapter {
  createAppointmentFromBooking(input: CreateAppointmentFromBookingInput): Promise<AppointmentRecord>;
  listAppointmentsForPractitioner(practitionerId: string): Promise<AppointmentRecord[]>;
  listAppointmentsForProfile(profileId: string): Promise<AppointmentRecord[]>;
  getAppointmentById(appointmentId: string): Promise<AppointmentRecord | null>;
  transitionAppointmentStatus(input: TransitionAppointmentStatusInput): Promise<AppointmentRecord>;
}
