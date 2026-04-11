import type { AccountAdapter } from "./adapter.types";
import type {
  AssignEducationProgramInput,
  AppendTimelineEventInput,
  CompleteMediaUploadInput,
  CreateEventInput,
  CreateExternalPractitionerApplicationInput,
  CreateInterPractitionerCaseInput,
  CreateInterPractitionerReplyInput,
  CreateInvoiceInput,
  CreateKnowledgeArticleInput,
  CreateMediaUploadIntentsInput,
  CreateOrLinkDependentInput,
  CreatePaymentInput,
  CreateAsyncCaseInput,
  CreateAsyncCaseUploadIntentsInput,
  CreateEducationThreadMessageInput,
  CreatePreConsultSubmissionInput,
  CreateQuoteInput,
  CreateScreeningReminderInput,
  EnsureSelfProfileInput,
  MarkEducationModuleProgressInput,
  ReplyAsyncCaseInput,
  ReviewExternalPractitionerApplicationInput,
  RequestMoreInfoInput,
  RespondAsyncCaseInput,
  RevokeConsentInput,
  SignConsentInput,
  SubmitCheckInInput,
  SubmitAsyncCaseInput,
  UpdateEventInput,
  UpdateInvoiceInput,
  UpdateKnowledgeArticleInput,
  UpdateAsyncCaseInput,
  UpdateNotificationPreferencesInput,
  UpdatePreventionLocationInput,
  UpdateProfileInput,
  UpdateQuoteInput,
  UpdateSecurityPolicyInput,
  UpdateScreeningReminderInput,
  UpdateUserCapabilitiesInput,
  UpdateUserRolesInput,
} from "./adapter.types";
import type {
  AdminUserRecord,
  AppNotificationRecord,
  AsyncCaseDetailRecord,
  AsyncCaseRecord,
  AuditEvent,
  BillingOverviewRecord,
  CapabilityGrantRecord,
  CaregiverLink,
  CheckInSubmissionRecord,
  ClinicalDocumentRecord,
  ConsentRecord,
  EducationProgramDetailRecord,
  EducationProgramRecord,
  EventDetailRecord,
  EventRecord,
  EventRegistrationRecord,
  ExternalPractitionerApplicationRecord,
  InterPractitionerCaseDetailRecord,
  InterPractitionerCaseRecord,
  InvoiceRecord,
  KnowledgeArticleRecord,
  MediaAssetRecord,
  MediaUploadIntent,
  NotificationPreference,
  PaymentRecord,
  PatientProfileRecord,
  PatientRecordEvent,
  PreventionAlertRecord,
  PreventionCurrentRecord,
  PreventionSettingsRecord,
  PreConsultSubmissionRecord,
  QuoteRecord,
  ScreeningReminder,
  SecurityPolicyRecord,
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

  async listEducationPrograms(
    _actorUserId: string,
    profileId: string,
  ): Promise<EducationProgramRecord[]> {
    return this.http.get<EducationProgramRecord[]>("/api/v1/patients/education/programs", {
      profileId,
    });
  }

  async getEducationProgram(
    _actorUserId: string,
    profileId: string,
    programId: string,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.get<EducationProgramDetailRecord>(
      `/api/v1/patients/education/programs/${programId}`,
      { profileId },
    );
  }

  async createEducationThreadMessage(
    input: CreateEducationThreadMessageInput,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.post<EducationProgramDetailRecord>(
      `/api/v1/patients/education/programs/${input.programId}/messages`,
      {
        body: input.body,
        requestAppointment: input.requestAppointment ?? false,
      },
      { profileId: input.profileId },
    );
  }

  async markEducationModuleProgress(
    input: MarkEducationModuleProgressInput,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.post<EducationProgramDetailRecord>(
      `/api/v1/patients/education/modules/${input.moduleId}/progress`,
      { status: input.status },
      { profileId: input.profileId },
    );
  }

  async listCheckIns(
    _actorUserId: string,
    profileId: string,
    enrollmentId?: string,
  ): Promise<CheckInSubmissionRecord[]> {
    return this.http.get<CheckInSubmissionRecord[]>("/api/v1/patients/check-ins", {
      profileId,
      enrollmentId,
    });
  }

  async submitCheckIn(input: SubmitCheckInInput): Promise<CheckInSubmissionRecord> {
    return this.http.post<CheckInSubmissionRecord>(
      "/api/v1/patients/check-ins",
      {
        enrollmentId: input.enrollmentId,
        templateId: input.templateId,
        questionnaireData: input.questionnaireData,
        measurements: input.measurements,
        mediaAssetIds: input.mediaAssetIds,
      },
      { profileId: input.profileId },
    );
  }

  async getPreventionCurrent(
    _actorUserId: string,
    profileId: string,
  ): Promise<PreventionCurrentRecord> {
    return this.http.get<PreventionCurrentRecord>("/api/v1/patients/prevention/current", {
      profileId,
    });
  }

  async listPreventionAlerts(
    _actorUserId: string,
    profileId: string,
  ): Promise<PreventionAlertRecord[]> {
    return this.http.get<PreventionAlertRecord[]>("/api/v1/patients/prevention/alerts", {
      profileId,
    });
  }

  async getPreventionLocation(
    _actorUserId: string,
    profileId: string,
  ): Promise<PreventionSettingsRecord> {
    return this.http.get<PreventionSettingsRecord>("/api/v1/patients/prevention/location", {
      profileId,
    });
  }

  async updatePreventionLocation(
    input: UpdatePreventionLocationInput,
  ): Promise<PreventionSettingsRecord> {
    return this.http.post<PreventionSettingsRecord>(
      "/api/v1/patients/prevention/location",
      {
        latitude: input.latitude,
        longitude: input.longitude,
        locationLabel: input.locationLabel,
        source: input.source ?? "device",
      },
      { profileId: input.profileId },
    );
  }

  async listPractitionerEducationPrograms(
    _actorUserId: string,
  ): Promise<EducationProgramRecord[]> {
    return this.http.get<EducationProgramRecord[]>("/api/v1/practitioner/education/programs");
  }

  async listScreeningRemindersForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<ScreeningReminder[]> {
    return this.http.get<ScreeningReminder[]>(
      `/api/v1/practitioner/patients/${profileId}/screening-reminders`,
    );
  }

  async updateScreeningReminderForPractitioner(
    input: UpdateScreeningReminderInput,
  ): Promise<ScreeningReminder> {
    return this.http.patch<ScreeningReminder>(
      `/api/v1/practitioner/patients/${input.profileId}/screening-reminders/${input.reminderId}`,
      input.patch,
    );
  }

  async getEducationProgramForPractitioner(
    _actorUserId: string,
    profileId: string,
    programId: string,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.get<EducationProgramDetailRecord>(
      `/api/v1/practitioner/patients/${profileId}/education/programs/${programId}`,
    );
  }

  async createEducationThreadMessageForPractitioner(
    input: CreateEducationThreadMessageInput,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.post<EducationProgramDetailRecord>(
      `/api/v1/practitioner/patients/${input.profileId}/education/programs/${input.programId}/messages`,
      {
        body: input.body,
        requestAppointment: input.requestAppointment ?? false,
      },
    );
  }

  async listProfileEducationProgramsForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<EducationProgramRecord[]> {
    return this.http.get<EducationProgramRecord[]>(
      `/api/v1/practitioner/patients/${profileId}/education/programs`,
    );
  }

  async assignEducationProgram(
    input: AssignEducationProgramInput,
  ): Promise<EducationProgramDetailRecord> {
    return this.http.post<EducationProgramDetailRecord>(
      "/api/v1/practitioner/education/program-assignments",
      {
        profileId: input.profileId,
        programId: input.programId,
        checkInCadence: input.checkInCadence,
        nextCheckInDueAt: input.nextCheckInDueAt,
      },
    );
  }

  async createScreeningReminderForPractitioner(
    input: CreateScreeningReminderInput,
  ): Promise<ScreeningReminder> {
    return this.http.post<ScreeningReminder>(
      `/api/v1/practitioner/patients/${input.profileId}/screening-reminders`,
      {
        screeningType: input.screeningType,
        cadence: input.cadence,
        nextDueAt: input.nextDueAt,
      },
    );
  }

  async getProfilePreventionCurrentForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<PreventionCurrentRecord> {
    return this.http.get<PreventionCurrentRecord>(
      `/api/v1/practitioner/patients/${profileId}/prevention/current`,
    );
  }

  async createExternalPractitionerApplication(
    input: CreateExternalPractitionerApplicationInput,
  ): Promise<ExternalPractitionerApplicationRecord> {
    return this.http.post<ExternalPractitionerApplicationRecord>(
      "/api/v1/external-practitioner/applications",
      {
        specialty: input.specialty,
        organization: input.organization,
        licenseNumber: input.licenseNumber,
        motivation: input.motivation,
      },
    );
  }

  async listExternalPractitionerCases(
    _actorUserId: string,
  ): Promise<InterPractitionerCaseRecord[]> {
    return this.http.get<InterPractitionerCaseRecord[]>("/api/v1/external-practitioner/cases");
  }

  async createExternalPractitionerCase(
    input: CreateInterPractitionerCaseInput,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.post<InterPractitionerCaseDetailRecord>(
      "/api/v1/external-practitioner/cases",
      {
        subject: input.subject,
        patientLabel: input.patientLabel,
        patientAgeLabel: input.patientAgeLabel,
        clinicalContext: input.clinicalContext,
        question: input.question,
        consentAttested: input.consentAttested,
        mediaAssetIds: input.mediaAssetIds,
      },
    );
  }

  async getExternalPractitionerCase(
    _actorUserId: string,
    caseId: string,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.get<InterPractitionerCaseDetailRecord>(
      `/api/v1/external-practitioner/cases/${caseId}`,
    );
  }

  async replyToExternalPractitionerCase(
    input: CreateInterPractitionerReplyInput,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.post<InterPractitionerCaseDetailRecord>(
      `/api/v1/external-practitioner/cases/${input.caseId}/reply`,
      {
        body: input.body,
        mediaAssetIds: input.mediaAssetIds,
      },
    );
  }

  async listPractitionerInterPractitionerCases(
    _actorUserId: string,
    status?: string,
  ): Promise<InterPractitionerCaseRecord[]> {
    return this.http.get<InterPractitionerCaseRecord[]>(
      "/api/v1/practitioner/inter-practitioner/cases",
      { status },
    );
  }

  async getPractitionerInterPractitionerCase(
    _actorUserId: string,
    caseId: string,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.get<InterPractitionerCaseDetailRecord>(
      `/api/v1/practitioner/inter-practitioner/cases/${caseId}`,
    );
  }

  async claimInterPractitionerCase(
    _actorUserId: string,
    caseId: string,
  ): Promise<InterPractitionerCaseRecord> {
    return this.http.post<InterPractitionerCaseRecord>(
      `/api/v1/practitioner/inter-practitioner/cases/${caseId}/claim`,
    );
  }

  async requestMoreInfoForInterPractitionerCase(
    input: CreateInterPractitionerReplyInput,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.post<InterPractitionerCaseDetailRecord>(
      `/api/v1/practitioner/inter-practitioner/cases/${input.caseId}/request-more-info`,
      { body: input.body, mediaAssetIds: input.mediaAssetIds },
    );
  }

  async respondToInterPractitionerCase(
    input: CreateInterPractitionerReplyInput,
  ): Promise<InterPractitionerCaseDetailRecord> {
    return this.http.post<InterPractitionerCaseDetailRecord>(
      `/api/v1/practitioner/inter-practitioner/cases/${input.caseId}/respond`,
      { body: input.body, mediaAssetIds: input.mediaAssetIds },
    );
  }

  async closeInterPractitionerCase(
    _actorUserId: string,
    caseId: string,
  ): Promise<InterPractitionerCaseRecord> {
    return this.http.post<InterPractitionerCaseRecord>(
      `/api/v1/practitioner/inter-practitioner/cases/${caseId}/close`,
    );
  }

  async listEvents(_actorUserId: string): Promise<EventRecord[]> {
    return this.http.get<EventRecord[]>("/api/v1/events");
  }

  async getEvent(_actorUserId: string, eventId: string): Promise<EventDetailRecord> {
    return this.http.get<EventDetailRecord>(`/api/v1/events/${eventId}`);
  }

  async registerForEvent(
    _actorUserId: string,
    eventId: string,
    profileId?: string,
  ): Promise<EventDetailRecord> {
    return this.http.post<EventDetailRecord>(
      `/api/v1/events/${eventId}/register`,
      undefined,
      { profileId },
    );
  }

  async cancelEventRegistration(
    _actorUserId: string,
    eventId: string,
    profileId?: string,
  ): Promise<EventDetailRecord> {
    return this.http.post<EventDetailRecord>(
      `/api/v1/events/${eventId}/cancel-registration`,
      undefined,
      { profileId },
    );
  }

  async listMyEventRegistrations(_actorUserId: string): Promise<EventRegistrationRecord[]> {
    return this.http.get<EventRegistrationRecord[]>("/api/v1/events/my-registrations");
  }

  async getBillingOverview(
    _actorUserId: string,
    profileId: string,
  ): Promise<BillingOverviewRecord> {
    return this.http.get<BillingOverviewRecord>("/api/v1/patients/billing/overview", {
      profileId,
    });
  }

  async listPatientInvoices(
    _actorUserId: string,
    profileId: string,
  ): Promise<InvoiceRecord[]> {
    return this.http.get<InvoiceRecord[]>("/api/v1/patients/billing/invoices", { profileId });
  }

  async getPatientInvoice(
    _actorUserId: string,
    profileId: string,
    invoiceId: string,
  ): Promise<InvoiceRecord> {
    return this.http.get<InvoiceRecord>(`/api/v1/patients/billing/invoices/${invoiceId}`, {
      profileId,
    });
  }

  async listPatientQuotes(_actorUserId: string, profileId: string): Promise<QuoteRecord[]> {
    return this.http.get<QuoteRecord[]>("/api/v1/patients/billing/quotes", { profileId });
  }

  async getPatientQuote(
    _actorUserId: string,
    profileId: string,
    quoteId: string,
  ): Promise<QuoteRecord> {
    return this.http.get<QuoteRecord>(`/api/v1/patients/billing/quotes/${quoteId}`, {
      profileId,
    });
  }

  async createPayment(input: CreatePaymentInput): Promise<PaymentRecord> {
    return this.http.post<PaymentRecord>("/api/v1/patients/billing/payments", {
      profileId: input.profileId,
      invoiceId: input.invoiceId,
      quoteId: input.quoteId,
      eventRegistrationId: input.eventRegistrationId,
      providerKey: input.providerKey,
      method: input.method,
      amount: input.amount,
      currency: input.currency,
    });
  }

  async getPayment(_actorUserId: string, paymentId: string): Promise<PaymentRecord> {
    return this.http.get<PaymentRecord>(`/api/v1/patients/billing/payments/${paymentId}`);
  }

  async listAdminUsers(_actorUserId: string): Promise<AdminUserRecord[]> {
    return this.http.get<AdminUserRecord[]>("/api/v1/admin/users");
  }

  async getAdminUser(_actorUserId: string, userId: string): Promise<AdminUserRecord> {
    return this.http.get<AdminUserRecord>(`/api/v1/admin/users/${userId}`);
  }

  async updateUserRoles(input: UpdateUserRolesInput): Promise<AdminUserRecord> {
    return this.http.patch<AdminUserRecord>(`/api/v1/admin/users/${input.userId}/roles`, {
      roles: input.roles,
    });
  }

  async updateUserCapabilities(
    input: UpdateUserCapabilitiesInput,
  ): Promise<CapabilityGrantRecord[]> {
    return this.http.patch<CapabilityGrantRecord[]>(
      `/api/v1/admin/users/${input.userId}/capabilities`,
      { capabilities: input.capabilities },
    );
  }

  async listExternalPractitionerApplications(
    _actorUserId: string,
  ): Promise<ExternalPractitionerApplicationRecord[]> {
    return this.http.get<ExternalPractitionerApplicationRecord[]>(
      "/api/v1/admin/external-practitioner-applications",
    );
  }

  async approveExternalPractitionerApplication(
    _actorUserId: string,
    applicationId: string,
  ): Promise<ExternalPractitionerApplicationRecord> {
    return this.http.post<ExternalPractitionerApplicationRecord>(
      `/api/v1/admin/external-practitioner-applications/${applicationId}/approve`,
    );
  }

  async rejectExternalPractitionerApplication(
    input: ReviewExternalPractitionerApplicationInput,
  ): Promise<ExternalPractitionerApplicationRecord> {
    return this.http.post<ExternalPractitionerApplicationRecord>(
      `/api/v1/admin/external-practitioner-applications/${input.applicationId}/reject`,
      { rejectionReason: input.rejectionReason },
    );
  }

  async listKnowledgeArticles(_actorUserId: string): Promise<KnowledgeArticleRecord[]> {
    return this.http.get<KnowledgeArticleRecord[]>("/api/v1/admin/knowledge-articles");
  }

  async createKnowledgeArticle(
    input: CreateKnowledgeArticleInput,
  ): Promise<KnowledgeArticleRecord> {
    return this.http.post<KnowledgeArticleRecord>("/api/v1/admin/knowledge-articles", {
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body: input.body,
      category: input.category,
    });
  }

  async updateKnowledgeArticle(
    input: UpdateKnowledgeArticleInput,
  ): Promise<KnowledgeArticleRecord> {
    return this.http.patch<KnowledgeArticleRecord>(
      `/api/v1/admin/knowledge-articles/${input.articleId}`,
      {
        title: input.title,
        summary: input.summary,
        body: input.body,
        category: input.category,
        reviewNotes: input.reviewNotes,
      },
    );
  }

  async submitKnowledgeArticleForReview(
    _actorUserId: string,
    articleId: string,
  ): Promise<KnowledgeArticleRecord> {
    return this.http.post<KnowledgeArticleRecord>(
      `/api/v1/admin/knowledge-articles/${articleId}/submit-review`,
    );
  }

  async publishKnowledgeArticle(
    _actorUserId: string,
    articleId: string,
  ): Promise<KnowledgeArticleRecord> {
    return this.http.post<KnowledgeArticleRecord>(
      `/api/v1/admin/knowledge-articles/${articleId}/publish`,
    );
  }

  async listAdminAuditLogs(_actorUserId: string): Promise<AuditEvent[]> {
    return this.http.get<AuditEvent[]>("/api/v1/admin/audit-logs");
  }

  async exportAdminAuditLogsCsv(_actorUserId: string): Promise<string> {
    const result = await this.http.get<{ content: string }>("/api/v1/admin/audit-logs/export");
    return result.content;
  }

  async listSecurityPolicies(_actorUserId: string): Promise<SecurityPolicyRecord[]> {
    return this.http.get<SecurityPolicyRecord[]>("/api/v1/admin/security-policies");
  }

  async updateSecurityPolicy(
    input: UpdateSecurityPolicyInput,
  ): Promise<SecurityPolicyRecord> {
    return this.http.patch<SecurityPolicyRecord>(
      `/api/v1/admin/security-policies/${input.policyKey}`,
      { value: input.value },
    );
  }

  async listAdminEvents(_actorUserId: string): Promise<EventRecord[]> {
    return this.http.get<EventRecord[]>("/api/v1/admin/events");
  }

  async createEvent(input: CreateEventInput): Promise<EventRecord> {
    return this.http.post<EventRecord>("/api/v1/admin/events", {
      title: input.title,
      summary: input.summary,
      description: input.description,
      audience: input.audience,
      format: input.format,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      locationLabel: input.locationLabel,
      capacity: input.capacity,
      waitlistCapacity: input.waitlistCapacity,
      requiresPayment: input.requiresPayment,
      priceAmount: input.priceAmount,
      currency: input.currency,
    });
  }

  async updateEvent(input: UpdateEventInput): Promise<EventRecord> {
    return this.http.patch<EventRecord>(`/api/v1/admin/events/${input.eventId}`, {
      title: input.title,
      summary: input.summary,
      description: input.description,
      audience: input.audience,
      format: input.format,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      locationLabel: input.locationLabel,
      capacity: input.capacity,
      waitlistCapacity: input.waitlistCapacity,
      requiresPayment: input.requiresPayment,
      priceAmount: input.priceAmount,
      currency: input.currency,
    });
  }

  async publishEvent(_actorUserId: string, eventId: string): Promise<EventRecord> {
    return this.http.post<EventRecord>(`/api/v1/admin/events/${eventId}/publish`);
  }

  async cancelEvent(_actorUserId: string, eventId: string): Promise<EventRecord> {
    return this.http.post<EventRecord>(`/api/v1/admin/events/${eventId}/cancel`);
  }

  async listAdminInvoices(_actorUserId: string): Promise<InvoiceRecord[]> {
    return this.http.get<InvoiceRecord[]>("/api/v1/admin/billing/invoices");
  }

  async createInvoice(input: CreateInvoiceInput): Promise<InvoiceRecord> {
    return this.http.post<InvoiceRecord>("/api/v1/admin/billing/invoices", {
      profileId: input.profileId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      description: input.description,
      lineItems: input.lineItems,
      totalAmount: input.totalAmount,
      currency: input.currency,
      dueAt: input.dueAt,
      quoteId: input.quoteId,
    });
  }

  async updateInvoice(input: UpdateInvoiceInput): Promise<InvoiceRecord> {
    return this.http.patch<InvoiceRecord>(
      `/api/v1/admin/billing/invoices/${input.invoiceId}`,
      {
        status: input.status,
        description: input.description,
        lineItems: input.lineItems,
        totalAmount: input.totalAmount,
        dueAt: input.dueAt,
      },
    );
  }

  async listAdminQuotes(_actorUserId: string): Promise<QuoteRecord[]> {
    return this.http.get<QuoteRecord[]>("/api/v1/admin/billing/quotes");
  }

  async createQuote(input: CreateQuoteInput): Promise<QuoteRecord> {
    return this.http.post<QuoteRecord>("/api/v1/admin/billing/quotes", {
      profileId: input.profileId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      title: input.title,
      description: input.description,
      lineItems: input.lineItems,
      totalAmount: input.totalAmount,
      currency: input.currency,
      expiresAt: input.expiresAt,
    });
  }

  async updateQuote(input: UpdateQuoteInput): Promise<QuoteRecord> {
    return this.http.patch<QuoteRecord>(`/api/v1/admin/billing/quotes/${input.quoteId}`, {
      status: input.status,
      description: input.description,
      lineItems: input.lineItems,
      totalAmount: input.totalAmount,
      expiresAt: input.expiresAt,
    });
  }

  async refundPayment(_actorUserId: string, paymentId: string): Promise<PaymentRecord> {
    return this.http.post<PaymentRecord>(`/api/v1/admin/billing/payments/${paymentId}/refund`);
  }

  async recordProfileSwitch(_userId: string, profileId: string): Promise<void> {
    await this.http.post<unknown>("/api/v1/patients/profile-switch", undefined, { profileId });
  }

  async listAuditEvents(_userId: string): Promise<AuditEvent[]> {
    return this.http.get<AuditEvent[]>("/api/v1/patients/audit-events");
  }
}
