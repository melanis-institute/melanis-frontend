import type {
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

  recordProfileSwitch(userId: string, profileId: string): Promise<void>;
  listAuditEvents(userId: string): Promise<AuditEvent[]>;
}
