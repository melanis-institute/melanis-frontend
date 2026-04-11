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
  asyncCaseId?: string;
  captureSessionId?: string;
  captureKind?: string;
  bodyArea?: string;
  conditionKey?: string;
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
  | "measurement_recorded"
  | "telederm_case_submitted"
  | "telederm_case_claimed"
  | "telederm_more_info_requested"
  | "telederm_patient_replied"
  | "telederm_response_published"
  | "telederm_case_closed"
  | "education_program_assigned"
  | "education_module_completed"
  | "check_in_due"
  | "check_in_submitted"
  | "prevention_alert_triggered"
  | "screening_reminder_due";

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

export type AppNotificationKind =
  | "telederm_case_submitted"
  | "telederm_more_info_requested"
  | "telederm_response_ready"
  | "telederm_case_claimed"
  | "telederm_patient_replied"
  | "education_program_assigned"
  | "education_module_completed"
  | "education_question_posted"
  | "education_answer_posted"
  | "check_in_due"
  | "check_in_submitted"
  | "prevention_alert_triggered"
  | "screening_reminder_due";

export interface AppNotificationRecord {
  id: string;
  recipientUserId: string;
  profileId?: string;
  kind: AppNotificationKind;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AsyncCaseStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "waiting_for_patient"
  | "patient_replied"
  | "responded"
  | "closed";

export type AsyncCaseMessageType =
  | "submission"
  | "request_more_info"
  | "patient_reply"
  | "practitioner_response"
  | "status_change";

export interface AsyncCaseRecord {
  id: string;
  profileId: string;
  createdByUserId: string;
  assignedPractitionerId?: string;
  claimedByUserId?: string;
  status: AsyncCaseStatus;
  conditionKey?: string;
  bodyArea?: string;
  patientSummary?: string;
  questionnaireData: Record<string, unknown>;
  submittedAt?: string;
  latestMessageAt?: string;
  respondedAt?: string;
  closedAt?: string;
  slaDueAt?: string;
  responseDocumentId?: string;
  prescriptionDocumentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AsyncCaseMessageRecord {
  id: string;
  asyncCaseId: string;
  profileId: string;
  actorUserId?: string;
  authorRole: "patient" | "caregiver" | "practitioner" | "system";
  type: AsyncCaseMessageType;
  body?: string;
  mediaAssetIds: string[];
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface AsyncCaseComparisonGroup {
  profileId: string;
  bodyArea?: string;
  conditionKey?: string;
  mediaAssets: MediaAssetRecord[];
}

export interface AsyncCaseDetailRecord {
  case: AsyncCaseRecord;
  mediaAssets: MediaAssetRecord[];
  messages: AsyncCaseMessageRecord[];
  comparisonGroups: AsyncCaseComparisonGroup[];
  documents: ClinicalDocumentRecord[];
}

export type ConsentSnapshot = Partial<Record<ConsentType, ConsentRecord>>;

export type EducationModuleType = "article" | "checklist" | "routine" | "what_if";
export type EducationProgramStatus = "draft" | "published" | "archived";
export type EducationEnrollmentStatus = "active" | "completed" | "paused";
export type EducationModuleProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export interface EducationModuleRecord {
  id: string;
  programId: string;
  title: string;
  summary: string;
  moduleType: EducationModuleType;
  orderIndex: number;
  estimatedMinutes: number;
  body: string;
  checklistItems: string[];
  routineMoments: string[];
  tags: string[];
  extra: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface EducationModuleProgressRecord {
  id: string;
  profileId: string;
  enrollmentId: string;
  programId: string;
  moduleId: string;
  status: EducationModuleProgressStatus;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationProgramEnrollmentRecord {
  id: string;
  profileId: string;
  programId: string;
  conditionKey: string;
  assignedByUserId: string;
  assignedByPractitionerId?: string;
  status: EducationEnrollmentStatus;
  startedAt: string;
  completedAt?: string;
  nextCheckInDueAt?: string;
  checkInCadence?: string;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface EducationProgramRecord {
  id: string;
  conditionKey: string;
  title: string;
  description: string;
  audience: string[];
  status: EducationProgramStatus;
  version: number;
  estimatedMinutes: number;
  coverTone?: string;
  createdAt: string;
  updatedAt: string;
  enrollment?: EducationProgramEnrollmentRecord;
  modulesCount: number;
}

export interface EducationThreadMessageRecord {
  id: string;
  profileId: string;
  enrollmentId: string;
  programId: string;
  actorUserId?: string;
  authorRole: "patient" | "caregiver" | "practitioner" | "system";
  body: string;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInSubmissionRecord {
  id: string;
  profileId: string;
  enrollmentId: string;
  programId: string;
  templateId?: string;
  submittedByUserId: string;
  questionnaireData: Record<string, unknown>;
  measurements: Array<{ [key: string]: string }>;
  mediaAssetIds: string[];
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EducationProgramDetailRecord {
  program: EducationProgramRecord;
  modules: EducationModuleRecord[];
  progress: EducationModuleProgressRecord[];
  recentCheckIns: CheckInSubmissionRecord[];
  messages: EducationThreadMessageRecord[];
}

export interface PreventionSettingsRecord {
  id: string;
  profileId: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  source: string;
  resolvedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type PreventionSeverity = "info" | "attention" | "high";
export type PreventionAlertStatus = "active" | "dismissed" | "expired";

export interface PreventionAlertRecord {
  id: string;
  profileId: string;
  ruleId: string;
  snapshotId: string;
  title: string;
  body: string;
  severity: PreventionSeverity;
  status: PreventionAlertStatus;
  startsAt: string;
  expiresAt?: string;
  meta: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PreventionSnapshotRecord {
  id: string;
  profileId: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  source: string;
  observedAt: string;
  inputs: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PreventionCurrentRecord {
  settings: PreventionSettingsRecord;
  snapshot: PreventionSnapshotRecord;
  alerts: PreventionAlertRecord[];
}
