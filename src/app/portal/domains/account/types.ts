export type ProfileRelationship = "moi" | "enfant" | "proche";

export type ConsentType =
  | "medical_record"
  | "media_share"
  | "telederm"
  | "ai_assist"
  | "before_after"
  | "inter_practitioner"
  | "caregiver_access";

export type ConsentStatus = "pending" | "signed" | "revoked";

export interface PatientProfileRecord {
  id: string;
  ownerUserId: string;
  relationship: ProfileRelationship;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isDependent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaregiverLink {
  id: string;
  caregiverUserId: string;
  patientProfileId: string;
  relationLabel: string;
  status: "active" | "revoked";
  createdAt: string;
  revokedAt?: string;
}

export interface ConsentRecord {
  id: string;
  profileId: string;
  type: ConsentType;
  title: string;
  version: string;
  status: ConsentStatus;
  signedByUserId?: string;
  signedAt?: string;
  revokedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationChannelPreference {
  sms: boolean;
  whatsapp: boolean;
  email: boolean;
}

export interface NotificationPreference {
  id: string;
  profileId: string;
  reminders: NotificationChannelPreference;
  prevention: NotificationChannelPreference;
  screening: NotificationChannelPreference;
  telederm: NotificationChannelPreference;
  billing: NotificationChannelPreference;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actorUserId: string;
  profileId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export type MediaAssetStatus = "pending" | "uploaded" | "failed";

export interface MediaUploadIntent {
  id: string;
  profileId: string;
  fileName: string;
  contentType: string;
  status: MediaAssetStatus;
  uploadMethod: "PUT";
  uploadUrl: string;
  createdAt: string;
}

export interface MediaAssetRecord {
  id: string;
  profileId: string;
  appointmentId?: string;
  preconsultSubmissionId?: string;
  fileName: string;
  contentType: string;
  status: MediaAssetStatus;
  uploadedAt?: string;
  downloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PreConsultSubmissionRecord {
  id: string;
  profileId: string;
  appointmentId: string;
  createdByUserId: string;
  practitionerId: string;
  appointmentType: "presentiel" | "video";
  questionnaireData: Record<string, unknown>;
  mediaAssetIds: string[];
  mediaAssets: MediaAssetRecord[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SkinScoreRecord {
  id: string;
  profileId: string;
  score: number;
  measuredAt: string;
  source: "derived" | "scan" | "manual";
}

export interface PrescriptionItem {
  name: string;
  instructions: string;
  isMedication: boolean;
}

export interface ClinicalMeasurement {
  label: string;
  value: string;
  unit?: string;
  recordedAt?: string;
}

export type ClinicalDocumentKind = "prescription" | "document" | "report";
export type ClinicalDocumentStatus = "draft" | "published";

export interface ClinicalDocumentRecord {
  id: string;
  profileId: string;
  appointmentId?: string;
  practitionerId?: string;
  createdByUserId: string;
  kind: ClinicalDocumentKind;
  status: ClinicalDocumentStatus;
  title: string;
  summary?: string;
  body?: string;
  prescriptionItems: PrescriptionItem[];
  version: number;
  replacesDocumentId?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type PatientRecordEventType =
  | "appointment_booked"
  | "appointment_checked_in"
  | "consultation_started"
  | "consultation_completed"
  | "consent_signed"
  | "consent_revoked"
  | "profile_updated"
  | "dependent_created"
  | "dependent_unlinked"
  | "prescription_issued"
  | "document_shared"
  | "follow_up_scheduled"
  | "measurement_recorded";

export interface PatientRecordEvent {
  id: string;
  profileId: string;
  type: PatientRecordEventType;
  title: string;
  description?: string;
  occurredAt: string;
  source: string;
  sourceRef?: string;
  meta?: Record<string, unknown>;
}

export type ScreeningCadence = "monthly" | "quarterly" | "semiannual" | "annual";
export type ScreeningReminderStatus = "active" | "snoozed" | "completed";

export interface ScreeningReminder {
  id: string;
  profileId: string;
  screeningType: string;
  cadence: ScreeningCadence;
  status: ScreeningReminderStatus;
  nextDueAt: string;
  lastCompletedAt?: string;
  channels: NotificationChannelPreference;
  updatedAt: string;
}

export type ConsentSnapshot = Partial<Record<ConsentType, ConsentRecord>>;
