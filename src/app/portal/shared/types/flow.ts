export type AppointmentType = "presentiel" | "video";

export type PatientProfile = "moi" | "enfant" | "proche";
export type ActingRelationship = PatientProfile;

export interface SelectedSlot {
  date?: string;
  time?: string;
}

export interface PractitionerSummary {
  name?: string;
  specialty?: string;
  location?: string;
  fee?: string;
  [key: string]: unknown;
}

export interface BookingFlowContext {
  returnTo?: string;
  appointmentType?: AppointmentType;
  date?: string;
  time?: string;
  selectedSlot?: SelectedSlot;
  practitioner?: PractitionerSummary;
  preConsultData?: unknown;
  actingProfileId?: string;
  actingRelationship?: ActingRelationship;
  [key: string]: unknown;
}
