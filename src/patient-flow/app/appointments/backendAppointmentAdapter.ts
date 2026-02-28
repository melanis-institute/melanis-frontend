import type { AppointmentAdapter } from "./adapter.types";
import type {
  CreateAppointmentFromBookingInput,
  TransitionAppointmentStatusInput,
} from "./adapter.types";
import type { AppointmentRecord } from "./types";
import { createApiClient } from "../api/client";

export class BackendAppointmentAdapter implements AppointmentAdapter {
  private readonly http;

  constructor(baseUrl: string) {
    this.http = createApiClient(baseUrl);
  }

  async createAppointmentFromBooking(
    input: CreateAppointmentFromBookingInput,
  ): Promise<AppointmentRecord> {
    return this.http.post<AppointmentRecord>("/api/v1/appointments/from-booking", {
      bookingSourceRef: input.bookingSourceRef,
      profileId: input.profileId,
      patientLabel: input.patientLabel,
      practitionerId: input.practitionerId,
      practitionerName: input.practitionerName,
      practitionerSpecialty: input.practitionerSpecialty,
      practitionerLocation: input.practitionerLocation,
      appointmentType: input.appointmentType,
      scheduledFor: input.scheduledFor,
      dateLabel: input.dateLabel,
      timeLabel: input.timeLabel,
      createdByUserId: input.createdByUserId,
      preConsultData: input.preConsultData,
    });
  }

  async listAppointmentsForPractitioner(practitionerId: string): Promise<AppointmentRecord[]> {
    return this.http.get<AppointmentRecord[]>(
      `/api/v1/appointments/practitioner/${practitionerId}`,
    );
  }

  async listAppointmentsForProfile(profileId: string): Promise<AppointmentRecord[]> {
    return this.http.get<AppointmentRecord[]>(`/api/v1/appointments/profile/${profileId}`);
  }

  async getAppointmentById(appointmentId: string): Promise<AppointmentRecord | null> {
    return this.http.get<AppointmentRecord | null>(`/api/v1/appointments/${appointmentId}`);
  }

  async transitionAppointmentStatus(
    input: TransitionAppointmentStatusInput,
  ): Promise<AppointmentRecord> {
    return this.http.post<AppointmentRecord>(
      `/api/v1/appointments/${input.appointmentId}/transition`,
      { toStatus: input.toStatus },
    );
  }
}
