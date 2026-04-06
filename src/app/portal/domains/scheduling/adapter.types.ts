import type { AppointmentType } from "@portal/shared/types/flow";
import type { AvailabilitySlotRecord, PractitionerDirectoryEntry } from "./types";

export interface ListAvailabilityInput {
  practitionerId: string;
  appointmentType?: AppointmentType;
  dateFrom: string;
  days: number;
}

export interface SchedulingAdapter {
  listPractitioners(appointmentType?: AppointmentType): Promise<PractitionerDirectoryEntry[]>;
  listAvailability(input: ListAvailabilityInput): Promise<AvailabilitySlotRecord[]>;
}
