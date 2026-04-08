import type { AccountAdapter } from "./adapter.types";
import type {
  CreateAsyncCaseInput,
  CreateAsyncCaseUploadIntentsInput,
  AppendTimelineEventInput,
  CompleteMediaUploadInput,
  CreateMediaUploadIntentsInput,
  CreateOrLinkDependentInput,
  CreatePreConsultSubmissionInput,
  EnsureSelfProfileInput,
  ReplyAsyncCaseInput,
  RequestMoreInfoInput,
  RespondAsyncCaseInput,
  RevokeConsentInput,
  SignConsentInput,
  SubmitAsyncCaseInput,
  UpdateAsyncCaseInput,
  UpdateNotificationPreferencesInput,
  UpdateProfileInput,
  UpdateScreeningReminderInput,
} from "./adapter.types";
import type {
  AppNotificationRecord,
  AsyncCaseDetailRecord,
  AsyncCaseRecord,
  AuditEvent,
  CaregiverLink,
  ClinicalDocumentRecord,
  ConsentRecord,
  MediaAssetRecord,
  MediaUploadIntent,
  NotificationPreference,
  PatientProfileRecord,
  PatientRecordEvent,
  PreConsultSubmissionRecord,
  ScreeningReminder,
  SkinScoreRecord,
} from "./types";
import { createApiClient } from "../api/client";

export class BackendAccountAdapter implements AccountAdapter {
  private readonly http;

  constructor(baseUrl: string) {
    this.http = createApiClient(baseUrl);
  }

  async ensureSelfProfile(_input: EnsureSelfProfileInput): Promise<PatientProfileRecord> {
    return this.http.post<PatientProfileRecord>("/api/v1/patients/profiles/self");
  }

  async listProfiles(_userId: string): Promise<PatientProfileRecord[]> {
    return this.http.get<PatientProfileRecord[]>("/api/v1/patients/profiles");
  }

  async getProfile(profileId: string): Promise<PatientProfileRecord | null> {
    return this.http.get<PatientProfileRecord | null>(`/api/v1/patients/profiles/${profileId}`);
  }

  async updateProfile(input: UpdateProfileInput): Promise<PatientProfileRecord> {
    return this.http.patch<PatientProfileRecord>(
      `/api/v1/patients/profiles/${input.profileId}`,
      undefined,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
      },
    );
  }

  async createOrLinkDependent(
    input: CreateOrLinkDependentInput,
  ): Promise<{ profile: PatientProfileRecord; link: CaregiverLink }> {
    return this.http.post<{ profile: PatientProfileRecord; link: CaregiverLink }>(
      "/api/v1/patients/dependents",
      undefined,
      {
        relationship: input.relationship,
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        existingProfileId: input.existingProfileId,
        relationLabel: input.relationLabel,
      },
    );
  }

  async unlinkDependent(_userId: string, profileId: string): Promise<void> {
    await this.http.delete<unknown>(`/api/v1/patients/dependents/${profileId}/link`);
  }

  async listConsents(_actorUserId: string, profileId: string): Promise<ConsentRecord[]> {
    return this.http.get<ConsentRecord[]>("/api/v1/patients/consents", { profileId });
  }

  async getConsent(_actorUserId: string, consentId: string): Promise<ConsentRecord | null> {
    return this.http.get<ConsentRecord | null>(`/api/v1/patients/consents/${consentId}`);
  }

  async signConsent(input: SignConsentInput): Promise<ConsentRecord> {
    return this.http.post<ConsentRecord>(`/api/v1/patients/consents/${input.consentId}/sign`);
  }

  async revokeConsent(input: RevokeConsentInput): Promise<ConsentRecord> {
    return this.http.post<ConsentRecord>(`/api/v1/patients/consents/${input.consentId}/revoke`);
  }

  async getNotificationPreferences(
    _actorUserId: string,
    profileId: string,
  ): Promise<NotificationPreference> {
    return this.http.get<NotificationPreference>("/api/v1/patients/notification-preferences", {
      profileId,
    });
  }

  async updateNotificationPreferences(
    input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreference> {
    return this.http.patch<NotificationPreference>(
      "/api/v1/patients/notification-preferences",
      input.patch,
      { profileId: input.profileId },
    );
  }

  async listSkinScores(
    _actorUserId: string,
    profileId: string,
    days?: number,
  ): Promise<SkinScoreRecord[]> {
    return this.http.get<SkinScoreRecord[]>("/api/v1/patients/skin-scores", { profileId, days });
  }

  async listClinicalDocuments(
    _actorUserId: string,
    profileId: string,
    appointmentId?: string,
    kind?: string,
  ): Promise<ClinicalDocumentRecord[]> {
    return this.http.get<ClinicalDocumentRecord[]>("/api/v1/patients/clinical-documents", {
      profileId,
      appointmentId,
      kind,
    });
  }

  async listTimelineEvents(
    _actorUserId: string,
    profileId: string,
    limit?: number,
  ): Promise<PatientRecordEvent[]> {
    return this.http.get<PatientRecordEvent[]>("/api/v1/patients/timeline-events", {
      profileId,
      limit,
    });
  }

  async appendTimelineEvent(input: AppendTimelineEventInput): Promise<PatientRecordEvent> {
    return this.http.post<PatientRecordEvent>(
      "/api/v1/patients/timeline-events",
      undefined,
      {
        profileId: input.profileId,
        type: input.type,
        title: input.title,
        source: input.source,
        description: input.description,
        sourceRef: input.sourceRef,
      },
    );
  }

  async listScreeningReminders(
    _actorUserId: string,
    profileId: string,
  ): Promise<ScreeningReminder[]> {
    return this.http.get<ScreeningReminder[]>("/api/v1/patients/screening-reminders", {
      profileId,
    });
  }

  async updateScreeningReminder(input: UpdateScreeningReminderInput): Promise<ScreeningReminder> {
    return this.http.patch<ScreeningReminder>(
      `/api/v1/patients/screening-reminders/${input.reminderId}`,
      input.patch,
      { profileId: input.profileId },
    );
  }

  async createMediaUploadIntents(
    input: CreateMediaUploadIntentsInput,
  ): Promise<MediaUploadIntent[]> {
    return this.http.post<MediaUploadIntent[]>("/api/v1/preconsult/media-assets/upload-intents", {
      profileId: input.profileId,
      files: input.files,
    });
  }

  async completeMediaUpload(input: CompleteMediaUploadInput): Promise<MediaAssetRecord> {
    return this.http.post<MediaAssetRecord>(
      `/api/v1/preconsult/media-assets/${input.assetId}/complete`,
    );
  }

  async createPreConsultSubmission(
    input: CreatePreConsultSubmissionInput,
  ): Promise<PreConsultSubmissionRecord> {
    return this.http.post<PreConsultSubmissionRecord>("/api/v1/preconsult/submissions", {
      profileId: input.profileId,
      appointmentId: input.appointmentId,
      practitionerId: input.practitionerId,
      appointmentType: input.appointmentType,
      questionnaireData: input.questionnaireData,
      mediaAssetIds: input.mediaAssetIds,
    });
  }

  async getPreConsultSubmissionForAppointment(
    _actorUserId: string,
    appointmentId: string,
  ): Promise<PreConsultSubmissionRecord | null> {
    return this.http.get<PreConsultSubmissionRecord | null>(
      `/api/v1/preconsult/submissions/appointment/${appointmentId}`,
    );
  }

  async listNotifications(
    _actorUserId: string,
    limit?: number,
  ): Promise<AppNotificationRecord[]> {
    return this.http.get<AppNotificationRecord[]>("/api/v1/notifications", { limit });
  }

  async markNotificationRead(
    _actorUserId: string,
    notificationId: string,
  ): Promise<AppNotificationRecord> {
    return this.http.post<AppNotificationRecord>(
      `/api/v1/notifications/${notificationId}/read`,
    );
  }

  async markAllNotificationsRead(_actorUserId: string): Promise<void> {
    await this.http.post<unknown>("/api/v1/notifications/read-all");
  }

  async listAsyncCases(
    _actorUserId: string,
    profileId: string,
  ): Promise<AsyncCaseRecord[]> {
    return this.http.get<AsyncCaseRecord[]>("/api/v1/telederm/cases", { profileId });
  }

  async createAsyncCase(input: CreateAsyncCaseInput): Promise<AsyncCaseRecord> {
    return this.http.post<AsyncCaseRecord>("/api/v1/telederm/cases", {
      profileId: input.profileId,
      conditionKey: input.conditionKey,
      bodyArea: input.bodyArea,
      patientSummary: input.patientSummary,
      questionnaireData: input.questionnaireData,
    });
  }

  async updateAsyncCase(input: UpdateAsyncCaseInput): Promise<AsyncCaseRecord> {
    return this.http.patch<AsyncCaseRecord>(`/api/v1/telederm/cases/${input.caseId}`, {
      conditionKey: input.conditionKey,
      bodyArea: input.bodyArea,
      patientSummary: input.patientSummary,
      questionnaireData: input.questionnaireData,
    });
  }

  async createAsyncCaseUploadIntents(
    input: CreateAsyncCaseUploadIntentsInput,
  ): Promise<MediaUploadIntent[]> {
    const result = await this.http.post<{ intents: MediaUploadIntent[] }>(
      `/api/v1/telederm/cases/${input.caseId}/media/upload-intents`,
      {
        files: input.files,
        captureSessionId: input.captureSessionId,
        captureKind: input.captureKind,
        bodyArea: input.bodyArea,
        conditionKey: input.conditionKey,
      },
    );
    return result.intents;
  }

  async completeAsyncCaseMediaUpload(
    _actorUserId: string,
    assetId: string,
  ): Promise<MediaAssetRecord> {
    return this.http.post<MediaAssetRecord>(`/api/v1/telederm/media-assets/${assetId}/complete`);
  }

  async submitAsyncCase(input: SubmitAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    const result = await this.http.post<{
      case: AsyncCaseRecord;
      messages: unknown[];
    }>(`/api/v1/telederm/cases/${input.caseId}/submit`, {
      message: input.message,
    });
    return this.getAsyncCase(input.actorUserId, result.case.id);
  }

  async getAsyncCase(
    _actorUserId: string,
    caseId: string,
  ): Promise<AsyncCaseDetailRecord> {
    return this.http.get<AsyncCaseDetailRecord>(`/api/v1/telederm/cases/${caseId}`);
  }

  async replyToAsyncCase(input: ReplyAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    return this.http.post<AsyncCaseDetailRecord>(`/api/v1/telederm/cases/${input.caseId}/reply`, {
      body: input.body,
      mediaAssetIds: input.mediaAssetIds,
    });
  }

  async listPractitionerAsyncCases(
    _actorUserId: string,
    status?: string,
  ): Promise<AsyncCaseRecord[]> {
    return this.http.get<AsyncCaseRecord[]>("/api/v1/practitioner/telederm/cases", {
      status,
    });
  }

  async claimAsyncCase(_actorUserId: string, caseId: string): Promise<AsyncCaseRecord> {
    return this.http.post<AsyncCaseRecord>(`/api/v1/practitioner/telederm/cases/${caseId}/claim`);
  }

  async requestMoreInfo(input: RequestMoreInfoInput): Promise<void> {
    await this.http.post<unknown>(
      `/api/v1/practitioner/telederm/cases/${input.caseId}/request-more-info`,
      { body: input.body },
    );
  }

  async respondToAsyncCase(input: RespondAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    return this.http.post<AsyncCaseDetailRecord>(
      `/api/v1/practitioner/telederm/cases/${input.caseId}/respond`,
      {
        diagnosis: input.diagnosis,
        clinicalSummary: input.clinicalSummary,
        body: input.body,
        prescriptionItems: input.prescriptionItems,
      },
    );
  }

  async closeAsyncCase(_actorUserId: string, caseId: string): Promise<AsyncCaseRecord> {
    return this.http.post<AsyncCaseRecord>(`/api/v1/practitioner/telederm/cases/${caseId}/close`);
  }

  async recordProfileSwitch(_userId: string, profileId: string): Promise<void> {
    await this.http.post<unknown>("/api/v1/patients/profile-switch", undefined, { profileId });
  }

  async listAuditEvents(_userId: string): Promise<AuditEvent[]> {
    return this.http.get<AuditEvent[]>("/api/v1/patients/audit-events");
  }
}
