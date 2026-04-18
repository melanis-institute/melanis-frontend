import type { AppointmentType } from "@portal/shared/types/flow";
import type { SchedulingAdapter, ListAvailabilityInput } from "./adapter.types";
import type { AvailabilitySlotRecord, PractitionerDirectoryEntry } from "./types";

const MOCK_PRACTITIONERS: PractitionerDirectoryEntry[] = [
  {
    id: "mock-pract-001",
    practitionerId: "pract-001",
    displayName: "Dr. Aissatou Ly",
    specialty: "Dermatologie clinique",
    location: "Cabinet Mermoz, Dakar",
    appointmentTypes: ["presentiel", "video"],
    priceFromLabel: "À partir de 15 000 FCFA",
    rating: 4.9,
    reviewCount: 214,
    availableToday: true,
  },
  {
    id: "mock-pract-003",
    practitionerId: "pract-003",
    displayName: "Dr. Mariama Sy",
    specialty: "Dermatologie esthétique",
    location: "Plateau, Dakar",
    appointmentTypes: ["presentiel", "video"],
    priceFromLabel: "À partir de 20 000 FCFA",
    rating: 4.8,
    reviewCount: 126,
    availableToday: true,
  },
];

const SLOT_TEMPLATES: Record<string, Record<AppointmentType, string[]>> = {
  "pract-001": {
    presentiel: ["09:00", "09:30", "10:00", "10:30", "14:00", "14:30"],
    video: ["16:00", "16:30", "17:00"],
  },
  "pract-003": {
    presentiel: ["15:00", "15:30", "18:00"],
    video: ["08:30", "09:00", "11:00", "11:30"],
  },
};

function toIso(dateKey: string, timeLabel: string): string {
  return `${dateKey}T${timeLabel}:00.000Z`;
}

function addThirtyMinutes(dateKey: string, timeLabel: string): string {
  const start = new Date(toIso(dateKey, timeLabel));
  start.setUTCMinutes(start.getUTCMinutes() + 30);
  return start.toISOString();
}

export class MockSchedulingAdapter implements SchedulingAdapter {
  async listPractitioners(appointmentType?: AppointmentType): Promise<PractitionerDirectoryEntry[]> {
    if (!appointmentType) return MOCK_PRACTITIONERS;
    return MOCK_PRACTITIONERS.filter((entry) =>
      entry.appointmentTypes.includes(appointmentType),
    );
  }

  async listAvailability(input: ListAvailabilityInput): Promise<AvailabilitySlotRecord[]> {
    const templates = SLOT_TEMPLATES[input.practitionerId];
    if (!templates) return [];

    const start = new Date(`${input.dateFrom}T00:00:00.000Z`);
    const slots: AvailabilitySlotRecord[] = [];
    for (let offset = 0; offset < input.days; offset += 1) {
      const current = new Date(start);
      current.setUTCDate(start.getUTCDate() + offset);
      if (current.getUTCDay() === 0) {
        continue;
      }

      const dateKey = current.toISOString().slice(0, 10);
      const appointmentTypes = input.appointmentType
        ? [input.appointmentType]
        : (Object.keys(templates) as AppointmentType[]);

      for (const appointmentType of appointmentTypes) {
        for (const timeLabel of templates[appointmentType] ?? []) {
          slots.push({
            id: `${input.practitionerId}:${appointmentType}:${dateKey}:${timeLabel}`,
            practitionerId: input.practitionerId,
            appointmentType,
            startsAt: toIso(dateKey, timeLabel),
            endsAt: addThirtyMinutes(dateKey, timeLabel),
            dateKey,
            timeLabel,
            isAvailable: !timeLabel.endsWith("30") || appointmentType === "video",
          });
        }
      }
    }

    return slots.filter((slot) => slot.isAvailable);
  }
}

export const mockSchedulingAdapter = new MockSchedulingAdapter();
