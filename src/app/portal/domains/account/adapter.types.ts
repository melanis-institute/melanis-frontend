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
  PreConsultSubmissionRecord,
  PatientRecordEvent,
  PatientRecordEventType,
  PatientProfileRecord,
  ProfileRelationship,
  ScreeningReminder,
  SkinScoreRecord,
} from "./types";

export interface CreateOrLinkDependentInput {
  userId: string;
  relationship: Extract<ProfileRelationship, "enfant" | "proche">;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  existingProfileId?: string;
  relationLabel?: string;
}

export interface UpdateProfileInput {
  actorUserId: string;
  profileId: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export interface SignConsentInput {
  consentId: string;
  actorUserId: string;
}

export interface RevokeConsentInput {
  consentId: string;
  actorUserId: string;
}

export interface UpdateNotificationPreferencesInput {
  actorUserId: string;
  profileId: string;
  patch: Partial<Omit<NotificationPreference, "id" | "profileId" | "updatedAt">>;
}

export interface EnsureSelfProfileInput {
  userId: string;
  fullName?: string;
}

export interface AppendTimelineEventInput {
  actorUserId: string;
  profileId: string;
  type: PatientRecordEventType;
  title: string;
  description?: string;
  occurredAt?: string;
  source: string;
  sourceRef?: string;
  meta?: Record<string, unknown>;
}

export interface UpdateScreeningReminderInput {
  actorUserId: string;
  profileId: string;
  reminderId: string;
  patch: Partial<
    Pick<ScreeningReminder, "cadence" | "status" | "nextDueAt" | "channels">
  >;
}

export interface CreateMediaUploadIntentsInput {
  actorUserId: string;
  profileId: string;
  files: Array<{
    fileName: string;
    contentType: string;
  }>;
}

export interface CompleteMediaUploadInput {
  actorUserId: string;
  assetId: string;
}

export interface CreatePreConsultSubmissionInput {
  actorUserId: string;
  profileId: string;
  appointmentId: string;
  practitionerId: string;
  appointmentType: "presentiel" | "video";
  questionnaireData: Record<string, unknown>;
  mediaAssetIds: string[];
}

export interface CreateAsyncCaseInput {
  actorUserId: string;
  profileId: string;
  conditionKey?: string;
  bodyArea?: string;
  patientSummary?: string;
  questionnaireData: Record<string, unknown>;
}

export interface UpdateAsyncCaseInput {
  actorUserId: string;
  caseId: string;
  conditionKey?: string;
  bodyArea?: string;
  patientSummary?: string;
  questionnaireData?: Record<string, unknown>;
}

export interface CreateAsyncCaseUploadIntentsInput {
  actorUserId: string;
  caseId: string;
  captureSessionId: string;
  captureKind: "close" | "context" | "detail" | "follow_up";
  bodyArea?: string;
  conditionKey?: string;
  files: Array<{
    fileName: string;
    contentType: string;
  }>;
}

export interface SubmitAsyncCaseInput {
  actorUserId: string;
  caseId: string;
  message?: string;
}

export interface ReplyAsyncCaseInput {
  actorUserId: string;
  caseId: string;
  body: string;
  mediaAssetIds: string[];
}

export interface RequestMoreInfoInput {
  actorUserId: string;
  caseId: string;
  body: string;
}

export interface RespondAsyncCaseInput {
  actorUserId: string;
  caseId: string;
  diagnosis?: string;
  clinicalSummary?: string;
  body?: string;
  prescriptionItems: Array<{
    name: string;
    instructions: string;
    isMedication: boolean;
  }>;
}

export interface AccountAdapter {
  ensureSelfProfile(input: EnsureSelfProfileInput): Promise<PatientProfileRecord>;
  listProfiles(userId: string): Promise<PatientProfileRecord[]>;
  getProfile(profileId: string): Promise<PatientProfileRecord | null>;
  updateProfile(input: UpdateProfileInput): Promise<PatientProfileRecord>;

  createOrLinkDependent(
    input: CreateOrLinkDependentInput,
  ): Promise<{ profile: PatientProfileRecord; link: CaregiverLink }>;
  unlinkDependent(userId: string, profileId: string): Promise<void>;

  listConsents(actorUserId: string, profileId: string): Promise<ConsentRecord[]>;
  getConsent(actorUserId: string, consentId: string): Promise<ConsentRecord | null>;
  signConsent(input: SignConsentInput): Promise<ConsentRecord>;
  revokeConsent(input: RevokeConsentInput): Promise<ConsentRecord>;

  getNotificationPreferences(
    actorUserId: string,
    profileId: string,
  ): Promise<NotificationPreference>;
  updateNotificationPreferences(
    input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreference>;

  listSkinScores(actorUserId: string, profileId: string, days?: number): Promise<SkinScoreRecord[]>;
  listClinicalDocuments(
    actorUserId: string,
    profileId: string,
    appointmentId?: string,
    kind?: string,
  ): Promise<ClinicalDocumentRecord[]>;
  listTimelineEvents(
    actorUserId: string,
    profileId: string,
    limit?: number,
  ): Promise<PatientRecordEvent[]>;
  appendTimelineEvent(input: AppendTimelineEventInput): Promise<PatientRecordEvent>;
  listScreeningReminders(
    actorUserId: string,
    profileId: string,
  ): Promise<ScreeningReminder[]>;
  updateScreeningReminder(input: UpdateScreeningReminderInput): Promise<ScreeningReminder>;
  createMediaUploadIntents(input: CreateMediaUploadIntentsInput): Promise<MediaUploadIntent[]>;
  completeMediaUpload(input: CompleteMediaUploadInput): Promise<MediaAssetRecord>;
  createPreConsultSubmission(
    input: CreatePreConsultSubmissionInput,
  ): Promise<PreConsultSubmissionRecord>;
  getPreConsultSubmissionForAppointment(
    actorUserId: string,
    appointmentId: string,
  ): Promise<PreConsultSubmissionRecord | null>;
  listNotifications(actorUserId: string, limit?: number): Promise<AppNotificationRecord[]>;
  markNotificationRead(
    actorUserId: string,
    notificationId: string,
  ): Promise<AppNotificationRecord>;
  markAllNotificationsRead(actorUserId: string): Promise<void>;
  listAsyncCases(actorUserId: string, profileId: string): Promise<AsyncCaseRecord[]>;
  createAsyncCase(input: CreateAsyncCaseInput): Promise<AsyncCaseRecord>;
  updateAsyncCase(input: UpdateAsyncCaseInput): Promise<AsyncCaseRecord>;
  createAsyncCaseUploadIntents(
    input: CreateAsyncCaseUploadIntentsInput,
  ): Promise<MediaUploadIntent[]>;
  completeAsyncCaseMediaUpload(
    actorUserId: string,
    assetId: string,
  ): Promise<MediaAssetRecord>;
  submitAsyncCase(input: SubmitAsyncCaseInput): Promise<AsyncCaseDetailRecord>;
  getAsyncCase(actorUserId: string, caseId: string): Promise<AsyncCaseDetailRecord>;
  replyToAsyncCase(input: ReplyAsyncCaseInput): Promise<AsyncCaseDetailRecord>;
  listPractitionerAsyncCases(
    actorUserId: string,
    status?: string,
  ): Promise<AsyncCaseRecord[]>;
  claimAsyncCase(actorUserId: string, caseId: string): Promise<AsyncCaseRecord>;
  requestMoreInfo(input: RequestMoreInfoInput): Promise<void>;
  respondToAsyncCase(input: RespondAsyncCaseInput): Promise<AsyncCaseDetailRecord>;
  closeAsyncCase(actorUserId: string, caseId: string): Promise<AsyncCaseRecord>;

  recordProfileSwitch(userId: string, profileId: string): Promise<void>;
  listAuditEvents(userId: string): Promise<AuditEvent[]>;
}
