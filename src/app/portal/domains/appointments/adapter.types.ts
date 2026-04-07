import type { AppointmentType } from "@portal/shared/types/flow";
import type {
  ClinicalMeasurement,
  PrescriptionItem,
  ScreeningCadence,
} from "@portal/domains/account/types";
import type { AppointmentRecord, AppointmentStatus, ClinicalOutcomeRecord } from "./types";

export interface CreateAppointmentFromBookingInput {
  bookingSourceRef: string;
  profileId: string;
  patientLabel: string;
  availabilitySlotId?: string;
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

export interface CreateClinicalOutcomeInput {
  appointmentId: string;
  actorUserId: string;
  diagnosis?: string;
  clinicalSummary?: string;
  prescriptionItems: PrescriptionItem[];
  measurements: ClinicalMeasurement[];
  followUpCadence?: ScreeningCadence;
  followUpDueAt?: string;
  notifyPatient?: boolean;
}

export interface AppointmentAdapter {
  createAppointmentFromBooking(input: CreateAppointmentFromBookingInput): Promise<AppointmentRecord>;
  listAppointmentsForPractitioner(practitionerId: string): Promise<AppointmentRecord[]>;
  listAppointmentsForProfile(profileId: string): Promise<AppointmentRecord[]>;
  getAppointmentById(appointmentId: string): Promise<AppointmentRecord | null>;
  transitionAppointmentStatus(input: TransitionAppointmentStatusInput): Promise<AppointmentRecord>;
  createClinicalOutcome(input: CreateClinicalOutcomeInput): Promise<ClinicalOutcomeRecord>;
}
