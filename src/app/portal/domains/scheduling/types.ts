import type { AppointmentType } from "@portal/shared/types/flow";

export interface PractitionerDirectoryEntry {
  id: string;
  practitionerId: string;
  displayName: string;
  specialty: string;
  location: string;
  appointmentTypes: AppointmentType[];
  priceFromLabel?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  availableToday: boolean;
}

export interface AvailabilitySlotRecord {
  id: string;
  practitionerId: string;
  appointmentType: AppointmentType;
  startsAt: string;
  endsAt: string;
  dateKey: string;
  timeLabel: string;
  isAvailable: boolean;
}
