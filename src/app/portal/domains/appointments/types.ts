import type { AppointmentType } from "@portal/shared/types/flow";

export type AppointmentStatus =
  | "scheduled"
  | "checked_in"
  | "in_consultation"
  | "completed";

export interface AppointmentRecord {
  id: string;
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
  status: AppointmentStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  checkedInAt?: string;
  inConsultationAt?: string;
  completedAt?: string;
  preConsultData?: unknown;
}

export interface AppointmentAuditEvent {
  id: string;
  appointmentId: string;
  actorUserId: string;
  action: string;
  fromStatus?: AppointmentStatus;
  toStatus?: AppointmentStatus;
  createdAt: string;
}

export const NEXT_STATUS_BY_CURRENT: Record<AppointmentStatus, AppointmentStatus | null> = {
  scheduled: "checked_in",
  checked_in: "in_consultation",
  in_consultation: "completed",
  completed: null,
};

export function appointmentStatusLabel(status: AppointmentStatus): string {
  if (status === "scheduled") return "Planifié";
  if (status === "checked_in") return "Arrivé";
  if (status === "in_consultation") return "En consultation";
  return "Terminé";
}
