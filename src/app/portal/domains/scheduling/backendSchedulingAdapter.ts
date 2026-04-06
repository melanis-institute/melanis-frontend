import type { SchedulingAdapter, ListAvailabilityInput } from "./adapter.types";
import type { AvailabilitySlotRecord, PractitionerDirectoryEntry } from "./types";
import { createApiClient } from "../api/client";

export class BackendSchedulingAdapter implements SchedulingAdapter {
  private readonly http;

  constructor(baseUrl: string) {
    this.http = createApiClient(baseUrl);
  }

  async listPractitioners(appointmentType?: "presentiel" | "video"): Promise<PractitionerDirectoryEntry[]> {
    return this.http.get<PractitionerDirectoryEntry[]>("/api/v1/practitioners", {
      appointmentType,
    });
  }

  async listAvailability(input: ListAvailabilityInput): Promise<AvailabilitySlotRecord[]> {
    return this.http.get<AvailabilitySlotRecord[]>(
      `/api/v1/practitioners/${input.practitionerId}/availability`,
      {
        appointmentType: input.appointmentType,
        dateFrom: input.dateFrom,
        days: input.days,
      },
    );
  }
}
