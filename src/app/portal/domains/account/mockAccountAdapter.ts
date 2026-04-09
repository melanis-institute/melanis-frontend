import type {
  AccountAdapter,
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
  AsyncCaseMessageRecord,
  AsyncCaseRecord,
  AuditEvent,
  CaregiverLink,
  ClinicalDocumentRecord,
  ConsentRecord,
  ConsentType,
  MediaAssetRecord,
  MediaUploadIntent,
  NotificationChannelPreference,
  NotificationPreference,
  PatientRecordEvent,
  PatientRecordEventType,
  PatientProfileRecord,
  PreConsultSubmissionRecord,
  ScreeningCadence,
  ScreeningReminder,
  SkinScoreRecord,
} from "./types";
export { relationshipToLabel } from "./labels";
import { readStorageJson, writeStorageJson } from "@shared/lib/storage";

const PROFILES_KEY = "melanis_account_profiles_v1";
const LINKS_KEY = "melanis_account_caregiver_links_v1";
const CONSENTS_KEY = "melanis_account_consents_v1";
const PREFS_KEY = "melanis_account_notification_prefs_v1";
const AUDIT_KEY = "melanis_account_audit_v1";
const TIMELINE_KEY = "melanis_account_timeline_v1";
const SCREENING_REMINDERS_KEY = "melanis_account_screening_reminders_v1";
const CLINICAL_DOCUMENTS_KEY = "melanis_account_clinical_documents_v1";
const MEDIA_ASSETS_KEY = "melanis_account_media_assets_v1";
const PRECONSULT_SUBMISSIONS_KEY = "melanis_account_preconsult_submissions_v1";
const APP_NOTIFICATIONS_KEY = "melanis_account_app_notifications_v1";
const ASYNC_CASES_KEY = "melanis_account_async_cases_v1";
const ASYNC_CASE_MESSAGES_KEY = "melanis_account_async_case_messages_v1";

const CONSENT_TEMPLATES: Array<{ type: ConsentType; title: string }> = [
  { type: "medical_record", title: "Accès au dossier médical" },
  { type: "media_share", title: "Partage des médias cliniques" },
  { type: "telederm", title: "Télé-dermatologie asynchrone" },
  { type: "ai_assist", title: "IA assistive non décisionnelle" },
  { type: "before_after", title: "Avant/Après clinique" },
  { type: "inter_practitioner", title: "Partage inter-praticiens" },
  { type: "caregiver_access", title: "Accès tuteur / accompagnant" },
];

function safeRead<T>(key: string, fallback: T): T {
  return readStorageJson(key, fallback);
}

function safeWrite<T>(key: string, value: T) {
  writeStorageJson(key, value);
}

function nowIso() {
  return new Date().toISOString();
}

function randomId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function splitName(fullName?: string) {
  const fallback = { firstName: "Profil", lastName: "Principal" };
  if (!fullName) return fallback;
  const trimmed = fullName.trim();
  if (!trimmed) return fallback;
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName: firstName ?? fallback.firstName,
    lastName: rest.join(" ") || fallback.lastName,
  };
}

function readProfiles() {
  return safeRead<PatientProfileRecord[]>(PROFILES_KEY, []);
}

function writeProfiles(profiles: PatientProfileRecord[]) {
  safeWrite(PROFILES_KEY, profiles);
}

function readLinks() {
  return safeRead<CaregiverLink[]>(LINKS_KEY, []);
}

function writeLinks(links: CaregiverLink[]) {
  safeWrite(LINKS_KEY, links);
}

function readConsents() {
  return safeRead<ConsentRecord[]>(CONSENTS_KEY, []);
}

function writeConsents(consents: ConsentRecord[]) {
  safeWrite(CONSENTS_KEY, consents);
}

function readPrefs() {
  return safeRead<NotificationPreference[]>(PREFS_KEY, []);
}

function writePrefs(prefs: NotificationPreference[]) {
  safeWrite(PREFS_KEY, prefs);
}

function readAudit() {
  return safeRead<AuditEvent[]>(AUDIT_KEY, []);
}

function writeAudit(events: AuditEvent[]) {
  safeWrite(AUDIT_KEY, events.slice(-1000));
}

function readTimelineEvents() {
  return safeRead<PatientRecordEvent[]>(TIMELINE_KEY, []);
}

function writeTimelineEvents(events: PatientRecordEvent[]) {
  safeWrite(TIMELINE_KEY, events.slice(-2000));
}

function readScreeningReminders() {
  return safeRead<ScreeningReminder[]>(SCREENING_REMINDERS_KEY, []);
}

function writeScreeningReminders(reminders: ScreeningReminder[]) {
  safeWrite(SCREENING_REMINDERS_KEY, reminders.slice(-2000));
}

function readClinicalDocuments() {
  return safeRead<ClinicalDocumentRecord[]>(CLINICAL_DOCUMENTS_KEY, []);
}

function readMediaAssets() {
  return safeRead<MediaAssetRecord[]>(MEDIA_ASSETS_KEY, []);
}

function writeMediaAssets(assets: MediaAssetRecord[]) {
  safeWrite(MEDIA_ASSETS_KEY, assets.slice(-2000));
}

function readPreConsultSubmissions() {
  return safeRead<PreConsultSubmissionRecord[]>(PRECONSULT_SUBMISSIONS_KEY, []);
}

function writePreConsultSubmissions(submissions: PreConsultSubmissionRecord[]) {
  safeWrite(PRECONSULT_SUBMISSIONS_KEY, submissions.slice(-2000));
}

function readNotifications() {
  return safeRead<AppNotificationRecord[]>(APP_NOTIFICATIONS_KEY, []);
}

function writeNotifications(notifications: AppNotificationRecord[]) {
  safeWrite(APP_NOTIFICATIONS_KEY, notifications.slice(-2000));
}

function readAsyncCases() {
  return safeRead<AsyncCaseRecord[]>(ASYNC_CASES_KEY, []);
}

function writeAsyncCases(cases: AsyncCaseRecord[]) {
  safeWrite(ASYNC_CASES_KEY, cases.slice(-500));
}

function readAsyncCaseMessages() {
  return safeRead<AsyncCaseMessageRecord[]>(ASYNC_CASE_MESSAGES_KEY, []);
}

function writeAsyncCaseMessages(messages: AsyncCaseMessageRecord[]) {
  safeWrite(ASYNC_CASE_MESSAGES_KEY, messages.slice(-2000));
}

function createAuditEvent(
  actorUserId: string,
  action: string,
  entityType: string,
  entityId?: string,
  profileId?: string,
  meta?: Record<string, unknown>,
) {
  const events = readAudit();
  events.push({
    id: randomId("audit"),
    actorUserId,
    profileId,
    action,
    entityType,
    entityId,
    meta,
    createdAt: nowIso(),
  });
  writeAudit(events);
}

function getDefaultChannels(enabled = true): NotificationChannelPreference {
  return {
    sms: enabled,
    whatsapp: enabled,
    email: false,
  };
}

function addDays(baseIso: string, days: number) {
  const date = new Date(baseIso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function cadenceToDays(cadence: ScreeningCadence) {
  if (cadence === "monthly") return 30;
  if (cadence === "quarterly") return 90;
  if (cadence === "semiannual") return 182;
  return 365;
}

function createDefaultScreeningReminders(profileId: string): ScreeningReminder[] {
  const now = nowIso();
  return [
    {
      id: randomId("screening"),
      profileId,
      screeningType: "Dépistage cutané annuel",
      cadence: "annual",
      status: "active",
      nextDueAt: addDays(now, 365),
      channels: getDefaultChannels(true),
      updatedAt: now,
    },
    {
      id: randomId("screening"),
      profileId,
      screeningType: "Auto-contrôle pigmentation",
      cadence: "quarterly",
      status: "active",
      nextDueAt: addDays(now, 90),
      channels: getDefaultChannels(true),
      updatedAt: now,
    },
  ];
}

function ensureScreeningRemindersForProfile(profileId: string) {
  const reminders = readScreeningReminders();
  const hasForProfile = reminders.some((item) => item.profileId === profileId);
  if (hasForProfile) return;
  writeScreeningReminders([...reminders, ...createDefaultScreeningReminders(profileId)]);
}

function appendTimelineEventInternal(input: AppendTimelineEventInput): PatientRecordEvent {
  const events = readTimelineEvents();

  if (input.sourceRef) {
    const duplicate = events.find(
      (event) => event.profileId === input.profileId && event.sourceRef === input.sourceRef,
    );
    if (duplicate) {
      return duplicate;
    }
  }

  const event: PatientRecordEvent = {
    id: randomId("timeline"),
    profileId: input.profileId,
    type: input.type,
    title: input.title,
    description: input.description,
    occurredAt: input.occurredAt ?? nowIso(),
    source: input.source,
    sourceRef: input.sourceRef,
    meta: input.meta,
  };

  events.push(event);
  writeTimelineEvents(events);
  return event;
}

function timelineTitleFromType(type: PatientRecordEventType) {
  if (type === "appointment_booked") return "Rendez-vous confirmé";
  if (type === "appointment_checked_in") return "Patient arrivé au rendez-vous";
  if (type === "consultation_started") return "Consultation démarrée";
  if (type === "consultation_completed") return "Consultation terminée";
  if (type === "consent_signed") return "Consentement signé";
  if (type === "consent_revoked") return "Consentement révoqué";
  if (type === "profile_updated") return "Profil patient mis à jour";
  if (type === "dependent_created") return "Profil dépendant ajouté";
  if (type === "prescription_issued") return "Ordonnance disponible";
  if (type === "document_shared") return "Document clinique disponible";
  if (type === "follow_up_scheduled") return "Suivi planifié";
  if (type === "measurement_recorded") return "Mesures cliniques ajoutées";
  if (type === "telederm_case_submitted") return "Cas télé-derm soumis";
  if (type === "telederm_case_claimed") return "Cas télé-derm pris en charge";
  if (type === "telederm_more_info_requested") return "Informations complémentaires demandées";
  if (type === "telederm_patient_replied") return "Réponse patient reçue";
  if (type === "telederm_response_published") return "Réponse dermatologue disponible";
  if (type === "telederm_case_closed") return "Cas télé-derm clos";
  return "Profil dépendant dissocié";
}

function createDefaultPreferences(profileId: string): NotificationPreference {
  return {
    id: randomId("prefs"),
    profileId,
    reminders: getDefaultChannels(true),
    prevention: getDefaultChannels(true),
    screening: getDefaultChannels(true),
    telederm: getDefaultChannels(true),
    billing: getDefaultChannels(false),
    updatedAt: nowIso(),
  };
}

function isProfileAccessible(userId: string, profileId: string) {
  const profiles = readProfiles();
  const links = readLinks();
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) return false;

  if (profile.ownerUserId === userId) return true;

  return links.some(
    (link) =>
      link.caregiverUserId === userId &&
      link.patientProfileId === profileId &&
      link.status === "active",
  );
}

function assertProfileAccessible(userId: string, profileId: string) {
  if (!isProfileAccessible(userId, profileId)) {
    throw new Error("Accès refusé");
  }
}

function ensureConsentsForProfile(profileId: string) {
  const consents = readConsents();
  let mutated = false;

  for (const template of CONSENT_TEMPLATES) {
    const existing = consents.find(
      (consent) => consent.profileId === profileId && consent.type === template.type,
    );
    if (existing) continue;

    mutated = true;
    consents.push({
      id: randomId("consent"),
      profileId,
      type: template.type,
      title: template.title,
      version: "v1.0",
      status: "pending",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }

  if (mutated) {
    writeConsents(consents);
  }
}

function assertString(value: string | undefined, label: string) {
  if (!value || value.trim().length < 2) {
    throw new Error(`${label} invalide`);
  }
}

function assertDate(value: string | undefined, label: string) {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} invalide`);
  }
}

function assertConsentAccessible(
  actorUserId: string,
  consent: ConsentRecord | undefined,
) {
  if (!consent) {
    throw new Error("Consentement introuvable");
  }

  assertProfileAccessible(actorUserId, consent.profileId);
  return consent;
}

function ensureConsentSigned(profileId: string, actorUserId: string, type: ConsentType) {
  ensureConsentsForProfile(profileId);
  const consents = readConsents();
  const consent = consents.find((item) => item.profileId === profileId && item.type === type);
  if (!consent || consent.status === "signed") {
    return;
  }

  consent.status = "signed";
  consent.signedByUserId = actorUserId;
  consent.signedAt = nowIso();
  consent.revokedAt = undefined;
  consent.updatedAt = nowIso();
  writeConsents(consents);
}

function startOfDay(value: Date) {
  const next = new Date(value);
  next.setHours(0, 0, 0, 0);
  return next;
}

function clampScore(value: number) {
  return Math.max(25, Math.min(100, Math.round(value)));
}

function scoreDeltaFromAction(action: string) {
  if (action === "consent.signed") return 2;
  if (action === "consent.revoked") return -3;
  if (action === "profile.updated") return 1;
  if (action === "dependent.created" || action === "dependent.linked") return 1;
  if (action === "dependent.unlinked") return -1;
  if (action === "profile.self.created") return 1;
  return 0;
}

function countEnabledChannels(profileId: string) {
  const prefs = readPrefs().find((item) => item.profileId === profileId);
  if (!prefs) return 0;

  const sections = [
    prefs.reminders,
    prefs.prevention,
    prefs.screening,
    prefs.telederm,
    prefs.billing,
  ];

  return sections.reduce(
    (acc, section) => acc + Number(section.sms) + Number(section.whatsapp) + Number(section.email),
    0,
  );
}

function deriveInitialScore(profileId: string) {
  const consents = readConsents().filter((item) => item.profileId === profileId);
  const signed = consents.filter((item) => item.status === "signed").length;
  const revoked = consents.filter((item) => item.status === "revoked").length;
  const channels = countEnabledChannels(profileId);

  return clampScore(66 + signed * 2 - revoked * 2 + Math.round(channels / 5));
}

function deriveSkinScores(profileId: string, days: number): SkinScoreRecord[] {
  const safeDays = Number.isFinite(days) ? Math.max(3, Math.min(30, Math.floor(days))) : 7;
  const now = new Date();
  const todayStart = startOfDay(now);
  const rangeStart = new Date(todayStart);
  rangeStart.setDate(todayStart.getDate() - (safeDays - 1));

  const events = readAudit()
    .filter((item) => item.profileId === profileId || item.entityId === profileId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let currentScore = deriveInitialScore(profileId);

  for (const event of events) {
    const ts = Date.parse(event.createdAt);
    if (!Number.isFinite(ts)) continue;
    if (ts >= rangeStart.getTime()) continue;
    currentScore = clampScore(currentScore + scoreDeltaFromAction(event.action));
  }

  const result: SkinScoreRecord[] = [];

  for (let index = 0; index < safeDays; index += 1) {
    const dayStart = new Date(rangeStart);
    dayStart.setDate(rangeStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    for (const event of events) {
      const ts = Date.parse(event.createdAt);
      if (!Number.isFinite(ts)) continue;
      if (ts < dayStart.getTime() || ts >= dayEnd.getTime()) continue;
      currentScore = clampScore(currentScore + scoreDeltaFromAction(event.action));
    }

    result.push({
      id: `skin_${profileId}_${dayStart.toISOString().slice(0, 10)}`,
      profileId,
      score: currentScore,
      measuredAt: new Date(dayStart.getTime() + 12 * 60 * 60 * 1000).toISOString(),
      source: "derived",
    });
  }

  return result;
}

function appendNotification(notification: AppNotificationRecord) {
  const notifications = readNotifications();
  notifications.push(notification);
  writeNotifications(notifications);
}

function createNotification(params: Omit<AppNotificationRecord, "id" | "createdAt" | "updatedAt">) {
  const timestamp = nowIso();
  appendNotification({
    id: randomId("notif"),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...params,
  });
}

function createAsyncCaseMessage(
  asyncCaseId: string,
  profileId: string,
  authorRole: AsyncCaseMessageRecord["authorRole"],
  type: AsyncCaseMessageRecord["type"],
  body?: string,
  actorUserId?: string,
  mediaAssetIds: string[] = [],
  meta?: Record<string, unknown>,
) {
  const messages = readAsyncCaseMessages();
  const message: AsyncCaseMessageRecord = {
    id: randomId("async_msg"),
    asyncCaseId,
    profileId,
    actorUserId,
    authorRole,
    type,
    body,
    mediaAssetIds,
    meta,
    createdAt: nowIso(),
  };
  messages.push(message);
  writeAsyncCaseMessages(messages);
  return message;
}

function getAsyncCaseDetail(caseId: string): AsyncCaseDetailRecord {
  const asyncCase = readAsyncCases().find((item) => item.id === caseId);
  if (!asyncCase) {
    throw new Error("Cas télé-derm introuvable");
  }
  const mediaAssets = readMediaAssets().filter((item) => item.asyncCaseId === caseId);
  const messages = readAsyncCaseMessages().filter((item) => item.asyncCaseId === caseId);
  const documents = readClinicalDocuments().filter(
    (item) =>
      item.id === asyncCase.responseDocumentId || item.id === asyncCase.prescriptionDocumentId,
  );
  const comparisonGroups =
    asyncCase.bodyArea || asyncCase.conditionKey
      ? [
          {
            profileId: asyncCase.profileId,
            bodyArea: asyncCase.bodyArea,
            conditionKey: asyncCase.conditionKey,
            mediaAssets: readMediaAssets()
              .filter(
                (item) =>
                  item.profileId === asyncCase.profileId &&
                  item.bodyArea === asyncCase.bodyArea &&
                  item.conditionKey === asyncCase.conditionKey &&
                  item.status === "uploaded",
              )
              .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
          },
        ]
      : [];

  return {
    case: asyncCase,
    mediaAssets,
    messages,
    comparisonGroups,
    documents,
  };
}

export class MockAccountAdapter implements AccountAdapter {
  async ensureSelfProfile(input: EnsureSelfProfileInput): Promise<PatientProfileRecord> {
    const profiles = readProfiles();
    const existing = profiles.find(
      (profile) =>
        profile.ownerUserId === input.userId &&
        profile.relationship === "moi" &&
        profile.isDependent === false,
    );

    if (existing) {
      return existing;
    }

    const { firstName, lastName } = splitName(input.fullName);
    const created: PatientProfileRecord = {
      id: randomId("profile"),
      ownerUserId: input.userId,
      relationship: "moi",
      firstName,
      lastName,
      dateOfBirth: "1990-01-01",
      isDependent: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };

    profiles.push(created);
    writeProfiles(profiles);

    ensureConsentsForProfile(created.id);
    ensureScreeningRemindersForProfile(created.id);

    const prefs = readPrefs();
    prefs.push(createDefaultPreferences(created.id));
    writePrefs(prefs);

    createAuditEvent(input.userId, "profile.self.created", "profile", created.id, created.id);

    return created;
  }

  async listProfiles(userId: string): Promise<PatientProfileRecord[]> {
    const profiles = readProfiles();
    const links = readLinks();

    const linkedProfileIds = links
      .filter((link) => link.caregiverUserId === userId && link.status === "active")
      .map((link) => link.patientProfileId);

    const result = profiles.filter(
      (profile) =>
        profile.ownerUserId === userId || linkedProfileIds.includes(profile.id),
    );

    for (const profile of result) {
      ensureConsentsForProfile(profile.id);
      ensureScreeningRemindersForProfile(profile.id);
    }

    return result.sort((a, b) => {
      if (a.relationship === "moi" && b.relationship !== "moi") return -1;
      if (b.relationship === "moi" && a.relationship !== "moi") return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }

  async getProfile(profileId: string): Promise<PatientProfileRecord | null> {
    const profile = readProfiles().find((item) => item.id === profileId);
    return profile ?? null;
  }

  async updateProfile(input: UpdateProfileInput): Promise<PatientProfileRecord> {
    const profiles = readProfiles();
    const target = profiles.find((profile) => profile.id === input.profileId);

    if (!target) {
      throw new Error("Profil introuvable");
    }

    assertProfileAccessible(input.actorUserId, input.profileId);

    if (input.firstName != null) {
      assertString(input.firstName, "Prénom");
      target.firstName = input.firstName.trim();
    }

    if (input.lastName != null) {
      assertString(input.lastName, "Nom");
      target.lastName = input.lastName.trim();
    }

    if (input.dateOfBirth != null) {
      assertDate(input.dateOfBirth, "Date de naissance");
      target.dateOfBirth = input.dateOfBirth;
    }

    target.updatedAt = nowIso();
    writeProfiles(profiles);

    createAuditEvent(
      input.actorUserId,
      "profile.updated",
      "profile",
      target.id,
      target.id,
      {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
      },
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: target.id,
      type: "profile_updated",
      title: timelineTitleFromType("profile_updated"),
      description: "Les informations du profil ont été modifiées.",
      source: "profile",
      sourceRef: `profile_updated:${target.id}:${target.updatedAt}`,
      meta: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
      },
    });

    return target;
  }

  async createOrLinkDependent(
    input: CreateOrLinkDependentInput,
  ): Promise<{ profile: PatientProfileRecord; link: CaregiverLink }> {
    const profiles = readProfiles();
    const links = readLinks();

    let profile: PatientProfileRecord | undefined;

    if (input.existingProfileId) {
      profile = profiles.find((item) => item.id === input.existingProfileId);
      if (!profile) {
        throw new Error("Profil à lier introuvable");
      }
    } else {
      assertString(input.firstName, "Prénom");
      assertString(input.lastName, "Nom");
      assertDate(input.dateOfBirth, "Date de naissance");

      profile = {
        id: randomId("profile"),
        ownerUserId: input.userId,
        relationship: input.relationship,
        firstName: input.firstName!.trim(),
        lastName: input.lastName!.trim(),
        dateOfBirth: input.dateOfBirth!,
        isDependent: true,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      profiles.push(profile);
      writeProfiles(profiles);
      ensureConsentsForProfile(profile.id);
    }

    ensureScreeningRemindersForProfile(profile.id);

    const existingLink = links.find(
      (link) =>
        link.caregiverUserId === input.userId &&
        link.patientProfileId === profile.id &&
        link.status === "active",
    );

    const link: CaregiverLink =
      existingLink ?? {
        id: randomId("caregiver_link"),
        caregiverUserId: input.userId,
        patientProfileId: profile.id,
        relationLabel:
          input.relationLabel ??
          (input.relationship === "enfant" ? "Parent / tuteur" : "Accompagnant"),
        status: "active",
        createdAt: nowIso(),
      };

    if (!existingLink) {
      links.push(link);
      writeLinks(links);
    }

    const prefs = readPrefs();
    if (!prefs.some((item) => item.profileId === profile.id)) {
      prefs.push(createDefaultPreferences(profile.id));
      writePrefs(prefs);
    }

    createAuditEvent(
      input.userId,
      input.existingProfileId ? "dependent.linked" : "dependent.created",
      "profile",
      profile.id,
      profile.id,
      {
        relationship: input.relationship,
        relationLabel: link.relationLabel,
      },
    );
    appendTimelineEventInternal({
      actorUserId: input.userId,
      profileId: profile.id,
      type: "dependent_created",
      title: timelineTitleFromType("dependent_created"),
      description: input.existingProfileId
        ? "Profil existant lié à votre espace."
        : "Nouveau profil dépendant créé.",
      source: "profile",
      sourceRef: input.existingProfileId
        ? `dependent_linked:${input.userId}:${profile.id}`
        : `dependent_created:${input.userId}:${profile.id}:${profile.createdAt}`,
      meta: {
        relationship: input.relationship,
        relationLabel: link.relationLabel,
      },
    });

    return { profile, link };
  }

  async unlinkDependent(userId: string, profileId: string): Promise<void> {
    const links = readLinks();
    const link = links.find(
      (item) =>
        item.caregiverUserId === userId &&
        item.patientProfileId === profileId &&
        item.status === "active",
    );

    if (!link) {
      return;
    }

    link.status = "revoked";
    link.revokedAt = nowIso();
    writeLinks(links);

    createAuditEvent(userId, "dependent.unlinked", "caregiver_link", link.id, profileId);
    appendTimelineEventInternal({
      actorUserId: userId,
      profileId,
      type: "dependent_unlinked",
      title: timelineTitleFromType("dependent_unlinked"),
      description: "Le profil dépendant a été dissocié.",
      source: "profile",
      sourceRef: `dependent_unlinked:${link.id}:${link.revokedAt ?? nowIso()}`,
      meta: { caregiverLinkId: link.id },
    });
  }

  async listConsents(actorUserId: string, profileId: string): Promise<ConsentRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    ensureConsentsForProfile(profileId);
    const consents = readConsents()
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => a.title.localeCompare(b.title));

    return consents;
  }

  async getConsent(actorUserId: string, consentId: string): Promise<ConsentRecord | null> {
    const consent = readConsents().find((item) => item.id === consentId);
    if (!consent) return null;
    assertProfileAccessible(actorUserId, consent.profileId);
    return consent;
  }

  async signConsent(input: SignConsentInput): Promise<ConsentRecord> {
    const consents = readConsents();
    const consent = assertConsentAccessible(
      input.actorUserId,
      consents.find((item) => item.id === input.consentId),
    );

    consent.status = "signed";
    consent.signedByUserId = input.actorUserId;
    consent.signedAt = nowIso();
    consent.revokedAt = undefined;
    consent.updatedAt = nowIso();
    writeConsents(consents);

    createAuditEvent(
      input.actorUserId,
      "consent.signed",
      "consent",
      consent.id,
      consent.profileId,
      { type: consent.type, version: consent.version },
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: consent.profileId,
      type: "consent_signed",
      title: timelineTitleFromType("consent_signed"),
      description: `${consent.title} (${consent.version})`,
      source: "consent",
      sourceRef: `consent_signed:${consent.id}:${consent.updatedAt}`,
      meta: { consentId: consent.id, consentType: consent.type, version: consent.version },
    });

    return consent;
  }

  async revokeConsent(input: RevokeConsentInput): Promise<ConsentRecord> {
    const consents = readConsents();
    const consent = assertConsentAccessible(
      input.actorUserId,
      consents.find((item) => item.id === input.consentId),
    );

    consent.status = "revoked";
    consent.revokedAt = nowIso();
    consent.updatedAt = nowIso();
    writeConsents(consents);

    createAuditEvent(
      input.actorUserId,
      "consent.revoked",
      "consent",
      consent.id,
      consent.profileId,
      { type: consent.type, version: consent.version },
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: consent.profileId,
      type: "consent_revoked",
      title: timelineTitleFromType("consent_revoked"),
      description: `${consent.title} (${consent.version})`,
      source: "consent",
      sourceRef: `consent_revoked:${consent.id}:${consent.updatedAt}`,
      meta: { consentId: consent.id, consentType: consent.type, version: consent.version },
    });

    return consent;
  }

  async getNotificationPreferences(
    actorUserId: string,
    profileId: string,
  ): Promise<NotificationPreference> {
    assertProfileAccessible(actorUserId, profileId);
    const prefs = readPrefs();
    let existing = prefs.find((item) => item.profileId === profileId);

    if (!existing) {
      existing = createDefaultPreferences(profileId);
      prefs.push(existing);
      writePrefs(prefs);
    }

    return existing;
  }

  async updateNotificationPreferences(
    input: UpdateNotificationPreferencesInput,
  ): Promise<NotificationPreference> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const prefs = readPrefs();
    const existingIndex = prefs.findIndex((item) => item.profileId === input.profileId);
    const existing =
      existingIndex >= 0 ? prefs[existingIndex] : createDefaultPreferences(input.profileId);

    const next: NotificationPreference = {
      ...existing,
      ...input.patch,
      reminders: {
        ...existing.reminders,
        ...input.patch.reminders,
      },
      prevention: {
        ...existing.prevention,
        ...input.patch.prevention,
      },
      screening: {
        ...existing.screening,
        ...input.patch.screening,
      },
      telederm: {
        ...existing.telederm,
        ...input.patch.telederm,
      },
      billing: {
        ...existing.billing,
        ...input.patch.billing,
      },
      updatedAt: nowIso(),
    };

    if (existingIndex >= 0) {
      prefs[existingIndex] = next;
    } else {
      prefs.push(next);
    }

    writePrefs(prefs);

    return next;
  }

  async listSkinScores(
    actorUserId: string,
    profileId: string,
    days = 7,
  ): Promise<SkinScoreRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    ensureConsentsForProfile(profileId);
    return deriveSkinScores(profileId, days);
  }

  async listClinicalDocuments(
    actorUserId: string,
    profileId: string,
    appointmentId?: string,
    kind?: string,
  ): Promise<ClinicalDocumentRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    return readClinicalDocuments()
      .filter((document) => {
        if (document.profileId !== profileId) return false;
        if (appointmentId && document.appointmentId !== appointmentId) return false;
        if (kind && document.kind !== kind) return false;
        return true;
      })
      .sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));
  }

  async listTimelineEvents(
    actorUserId: string,
    profileId: string,
    limit = 25,
  ): Promise<PatientRecordEvent[]> {
    assertProfileAccessible(actorUserId, profileId);
    const maxItems = Number.isFinite(limit)
      ? Math.max(1, Math.min(200, Math.floor(limit)))
      : 25;

    return readTimelineEvents()
      .filter((event) => event.profileId === profileId)
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, maxItems);
  }

  async appendTimelineEvent(input: AppendTimelineEventInput): Promise<PatientRecordEvent> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const safeTitle = input.title.trim() || timelineTitleFromType(input.type);
    return appendTimelineEventInternal({
      ...input,
      title: safeTitle,
    });
  }

  async listScreeningReminders(
    actorUserId: string,
    profileId: string,
  ): Promise<ScreeningReminder[]> {
    assertProfileAccessible(actorUserId, profileId);
    ensureScreeningRemindersForProfile(profileId);
    return readScreeningReminders()
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
  }

  async updateScreeningReminder(
    input: UpdateScreeningReminderInput,
  ): Promise<ScreeningReminder> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    ensureScreeningRemindersForProfile(input.profileId);
    const reminders = readScreeningReminders();
    const target = reminders.find(
      (item) => item.profileId === input.profileId && item.id === input.reminderId,
    );

    if (!target) {
      throw new Error("Rappel introuvable");
    }

    const previousStatus = target.status;
    const nextCadence = input.patch.cadence ?? target.cadence;
    const nextStatus = input.patch.status ?? target.status;
    const now = nowIso();

    target.cadence = nextCadence;
    target.status = nextStatus;
    target.channels = {
      ...target.channels,
      ...input.patch.channels,
    };
    target.nextDueAt =
      input.patch.nextDueAt ??
      (nextStatus === "completed" ? addDays(now, cadenceToDays(nextCadence)) : target.nextDueAt);

    if (nextStatus === "completed") {
      target.lastCompletedAt = now;
    } else if (previousStatus === "completed") {
      target.lastCompletedAt = input.patch.nextDueAt ? undefined : target.lastCompletedAt;
    }

    target.updatedAt = now;
    writeScreeningReminders(reminders);

    createAuditEvent(
      input.actorUserId,
      "screening.reminder.updated",
      "screening_reminder",
      target.id,
      target.profileId,
      {
        cadence: target.cadence,
        status: target.status,
        nextDueAt: target.nextDueAt,
      },
    );

    return target;
  }

  async createMediaUploadIntents(
    input: CreateMediaUploadIntentsInput,
  ): Promise<MediaUploadIntent[]> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    ensureConsentSigned(input.profileId, input.actorUserId, "medical_record");
    ensureConsentSigned(input.profileId, input.actorUserId, "media_share");

    const assets = readMediaAssets();
    const intents = input.files.map((file) => {
      const id = randomId("media");
      const createdAt = nowIso();
      assets.push({
        id,
        profileId: input.profileId,
        fileName: file.fileName,
        contentType: file.contentType,
        status: "pending",
        createdAt,
        updatedAt: createdAt,
      });
      return {
        id,
        profileId: input.profileId,
        fileName: file.fileName,
        contentType: file.contentType,
        status: "pending" as const,
        uploadMethod: "PUT" as const,
        uploadUrl: `mock://media/${id}`,
        createdAt,
      };
    });
    writeMediaAssets(assets);
    return intents;
  }

  async completeMediaUpload(input: CompleteMediaUploadInput): Promise<MediaAssetRecord> {
    const assets = readMediaAssets();
    const asset = assets.find((item) => item.id === input.assetId);
    if (!asset) {
      throw new Error("Média introuvable");
    }
    assertProfileAccessible(input.actorUserId, asset.profileId);

    asset.status = "uploaded";
    asset.uploadedAt = nowIso();
    asset.updatedAt = nowIso();
    writeMediaAssets(assets);
    return asset;
  }

  async createPreConsultSubmission(
    input: CreatePreConsultSubmissionInput,
  ): Promise<PreConsultSubmissionRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    ensureConsentSigned(input.profileId, input.actorUserId, "medical_record");
    if (input.mediaAssetIds.length > 0) {
      ensureConsentSigned(input.profileId, input.actorUserId, "media_share");
    }

    const existing = readPreConsultSubmissions().find(
      (item) => item.appointmentId === input.appointmentId,
    );
    if (existing) {
      return existing;
    }

    const assets = readMediaAssets();
    const questionnairePayload = input.questionnaireData as { photos?: unknown };
    const questionnairePhotos = Array.isArray(questionnairePayload.photos)
      ? questionnairePayload.photos
      : [];

    const selectedAssets = input.mediaAssetIds.map((assetId) => {
      const asset = assets.find((item) => item.id === assetId);
      if (!asset) {
        throw new Error("Média introuvable");
      }
      if (asset.status !== "uploaded") {
        throw new Error("Téléversement incomplet");
      }

      const matchingPhoto = questionnairePhotos.find(
        (photo) =>
          typeof photo === "object" &&
          photo !== null &&
          "assetId" in photo &&
          photo.assetId === assetId &&
          "url" in photo &&
          typeof photo.url === "string",
      ) as { url?: string } | undefined;

      asset.appointmentId = input.appointmentId;
      asset.downloadUrl = matchingPhoto?.url;
      asset.updatedAt = nowIso();
      return asset;
    });

    const createdAt = nowIso();
    const submissionId = randomId("preconsult");
    const submission: PreConsultSubmissionRecord = {
      id: submissionId,
      profileId: input.profileId,
      appointmentId: input.appointmentId,
      createdByUserId: input.actorUserId,
      practitionerId: input.practitionerId,
      appointmentType: input.appointmentType,
      questionnaireData: input.questionnaireData,
      mediaAssetIds: input.mediaAssetIds,
      mediaAssets: selectedAssets.map((asset) => ({
        ...asset,
        preconsultSubmissionId: submissionId,
      })),
      submittedAt: createdAt,
      createdAt,
      updatedAt: createdAt,
    };

    for (const asset of assets) {
      if (input.mediaAssetIds.includes(asset.id)) {
        asset.preconsultSubmissionId = submissionId;
      }
    }
    writeMediaAssets(assets);

    const submissions = readPreConsultSubmissions();
    submissions.push(submission);
    writePreConsultSubmissions(submissions);
    return submission;
  }

  async getPreConsultSubmissionForAppointment(
    _actorUserId: string,
    appointmentId: string,
  ): Promise<PreConsultSubmissionRecord | null> {
    return (
      readPreConsultSubmissions().find((item) => item.appointmentId === appointmentId) ?? null
    );
  }

  async listNotifications(
    actorUserId: string,
    _limit?: number,
  ): Promise<AppNotificationRecord[]> {
    return readNotifications()
      .filter((item) => item.recipientUserId === actorUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async markNotificationRead(
    actorUserId: string,
    notificationId: string,
  ): Promise<AppNotificationRecord> {
    const notifications = readNotifications();
    const notification = notifications.find(
      (item) => item.id === notificationId && item.recipientUserId === actorUserId,
    );
    if (!notification) {
      throw new Error("Notification introuvable");
    }
    notification.readAt = nowIso();
    notification.updatedAt = nowIso();
    writeNotifications(notifications);
    return notification;
  }

  async markAllNotificationsRead(actorUserId: string): Promise<void> {
    const notifications = readNotifications();
    const timestamp = nowIso();
    for (const notification of notifications) {
      if (notification.recipientUserId !== actorUserId) continue;
      notification.readAt = timestamp;
      notification.updatedAt = timestamp;
    }
    writeNotifications(notifications);
  }

  async listAsyncCases(actorUserId: string, profileId: string): Promise<AsyncCaseRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    return readAsyncCases()
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createAsyncCase(input: CreateAsyncCaseInput): Promise<AsyncCaseRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    ensureConsentSigned(input.profileId, input.actorUserId, "medical_record");
    ensureConsentSigned(input.profileId, input.actorUserId, "telederm");
    const timestamp = nowIso();
    const asyncCase: AsyncCaseRecord = {
      id: randomId("async_case"),
      profileId: input.profileId,
      createdByUserId: input.actorUserId,
      status: "draft",
      conditionKey: input.conditionKey,
      bodyArea: input.bodyArea,
      patientSummary: input.patientSummary,
      questionnaireData: input.questionnaireData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const cases = readAsyncCases();
    cases.push(asyncCase);
    writeAsyncCases(cases);
    return asyncCase;
  }

  async updateAsyncCase(input: UpdateAsyncCaseInput): Promise<AsyncCaseRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    assertProfileAccessible(input.actorUserId, asyncCase.profileId);
    asyncCase.conditionKey = input.conditionKey ?? asyncCase.conditionKey;
    asyncCase.bodyArea = input.bodyArea ?? asyncCase.bodyArea;
    asyncCase.patientSummary = input.patientSummary ?? asyncCase.patientSummary;
    asyncCase.questionnaireData = input.questionnaireData ?? asyncCase.questionnaireData;
    asyncCase.updatedAt = nowIso();
    writeAsyncCases(cases);
    return asyncCase;
  }

  async createAsyncCaseUploadIntents(
    input: CreateAsyncCaseUploadIntentsInput,
  ): Promise<MediaUploadIntent[]> {
    const asyncCase = readAsyncCases().find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    assertProfileAccessible(input.actorUserId, asyncCase.profileId);
    ensureConsentSigned(asyncCase.profileId, input.actorUserId, "media_share");

    const timestamp = nowIso();
    const assets = readMediaAssets();
    const intents: MediaUploadIntent[] = input.files.map((file, index) => {
      const assetId = randomId("media");
      assets.push({
        id: assetId,
        profileId: asyncCase.profileId,
        asyncCaseId: asyncCase.id,
        captureSessionId: input.captureSessionId,
        captureKind: input.captureKind,
        bodyArea: input.bodyArea ?? asyncCase.bodyArea,
        conditionKey: input.conditionKey ?? asyncCase.conditionKey,
        fileName: file.fileName,
        contentType: file.contentType,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
        downloadUrl: `blob:mock-${assetId}-${index}`,
      });
      return {
        id: assetId,
        profileId: asyncCase.profileId,
        fileName: file.fileName,
        contentType: file.contentType,
        status: "pending",
        uploadMethod: "PUT",
        uploadUrl: `mock-upload://${assetId}`,
        createdAt: timestamp,
      };
    });
    writeMediaAssets(assets);
    return intents;
  }

  async completeAsyncCaseMediaUpload(
    actorUserId: string,
    assetId: string,
  ): Promise<MediaAssetRecord> {
    const assets = readMediaAssets();
    const asset = assets.find((item) => item.id === assetId);
    if (!asset || !asset.asyncCaseId) throw new Error("Média télé-derm introuvable");
    assertProfileAccessible(actorUserId, asset.profileId);
    asset.status = "uploaded";
    asset.uploadedAt = nowIso();
    asset.updatedAt = nowIso();
    writeMediaAssets(assets);
    return asset;
  }

  async submitAsyncCase(input: SubmitAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    assertProfileAccessible(input.actorUserId, asyncCase.profileId);
    const timestamp = nowIso();
    asyncCase.status = "submitted";
    asyncCase.submittedAt = timestamp;
    asyncCase.latestMessageAt = timestamp;
    asyncCase.slaDueAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    asyncCase.updatedAt = timestamp;
    writeAsyncCases(cases);
    createAsyncCaseMessage(
      asyncCase.id,
      asyncCase.profileId,
      "patient",
      "submission",
      input.message ?? asyncCase.patientSummary,
      input.actorUserId,
      readMediaAssets()
        .filter((item) => item.asyncCaseId === asyncCase.id)
        .map((item) => item.id),
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: asyncCase.profileId,
      type: "telederm_case_submitted",
      title: timelineTitleFromType("telederm_case_submitted"),
      source: "telederm",
      sourceRef: asyncCase.id,
    });
    createNotification({
      recipientUserId: "mock-practitioner",
      profileId: asyncCase.profileId,
      kind: "telederm_case_submitted",
      title: "Nouveau cas télé-derm",
      body: "Un dossier asynchrone attend une prise en charge.",
      entityType: "async_case",
      entityId: asyncCase.id,
    });
    return getAsyncCaseDetail(asyncCase.id);
  }

  async getAsyncCase(actorUserId: string, caseId: string): Promise<AsyncCaseDetailRecord> {
    const detail = getAsyncCaseDetail(caseId);
    assertProfileAccessible(actorUserId, detail.case.profileId);
    return detail;
  }

  async replyToAsyncCase(input: ReplyAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    assertProfileAccessible(input.actorUserId, asyncCase.profileId);
    asyncCase.status = "patient_replied";
    asyncCase.latestMessageAt = nowIso();
    asyncCase.updatedAt = asyncCase.latestMessageAt;
    writeAsyncCases(cases);
    createAsyncCaseMessage(
      asyncCase.id,
      asyncCase.profileId,
      "patient",
      "patient_reply",
      input.body,
      input.actorUserId,
      input.mediaAssetIds,
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: asyncCase.profileId,
      type: "telederm_patient_replied",
      title: timelineTitleFromType("telederm_patient_replied"),
      source: "telederm",
      sourceRef: asyncCase.id,
    });
    return getAsyncCaseDetail(asyncCase.id);
  }

  async listPractitionerAsyncCases(
    _actorUserId: string,
    status?: string,
  ): Promise<AsyncCaseRecord[]> {
    return readAsyncCases()
      .filter((item) => item.status !== "draft")
      .filter((item) => (status ? item.status === status : true))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async claimAsyncCase(_actorUserId: string, caseId: string): Promise<AsyncCaseRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    asyncCase.status = "in_review";
    asyncCase.claimedByUserId = "mock-practitioner";
    asyncCase.assignedPractitionerId = "practitioner_demo";
    asyncCase.updatedAt = nowIso();
    writeAsyncCases(cases);
    return asyncCase;
  }

  async requestMoreInfo(input: RequestMoreInfoInput): Promise<void> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    asyncCase.status = "waiting_for_patient";
    asyncCase.updatedAt = nowIso();
    writeAsyncCases(cases);
    createAsyncCaseMessage(
      asyncCase.id,
      asyncCase.profileId,
      "practitioner",
      "request_more_info",
      input.body,
      input.actorUserId,
    );
    createNotification({
      recipientUserId: asyncCase.createdByUserId,
      profileId: asyncCase.profileId,
      kind: "telederm_more_info_requested",
      title: "Informations complémentaires demandées",
      body: input.body,
      entityType: "async_case",
      entityId: asyncCase.id,
    });
  }

  async respondToAsyncCase(input: RespondAsyncCaseInput): Promise<AsyncCaseDetailRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === input.caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    const timestamp = nowIso();
    const documents = readClinicalDocuments();
    const reportId = randomId("clinical_doc");
    documents.push({
      id: reportId,
      profileId: asyncCase.profileId,
      createdByUserId: input.actorUserId,
      practitionerId: "practitioner_demo",
      kind: "report",
      status: "published",
      title: "Compte-rendu télé-dermatologie",
      summary: input.clinicalSummary ?? input.diagnosis,
      body: input.body ?? input.clinicalSummary,
      prescriptionItems: [],
      version: 1,
      publishedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (input.prescriptionItems.length > 0) {
      documents.push({
        id: randomId("clinical_doc"),
        profileId: asyncCase.profileId,
        createdByUserId: input.actorUserId,
        practitionerId: "practitioner_demo",
        kind: "prescription",
        status: "published",
        title: "Ordonnance télé-dermatologie",
        summary: "Prescription issue après revue asynchrone.",
        body: input.clinicalSummary,
        prescriptionItems: input.prescriptionItems,
        version: 1,
        publishedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
    safeWrite(CLINICAL_DOCUMENTS_KEY, documents.slice(-2000));
    asyncCase.status = "responded";
    asyncCase.respondedAt = timestamp;
    asyncCase.responseDocumentId = reportId;
    asyncCase.prescriptionDocumentId = documents
      .find((item) => item.title === "Ordonnance télé-dermatologie" && item.profileId === asyncCase.profileId)
      ?.id;
    asyncCase.updatedAt = timestamp;
    writeAsyncCases(cases);
    createAsyncCaseMessage(
      asyncCase.id,
      asyncCase.profileId,
      "practitioner",
      "practitioner_response",
      input.clinicalSummary ?? input.diagnosis,
      input.actorUserId,
    );
    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: asyncCase.profileId,
      type: "telederm_response_published",
      title: timelineTitleFromType("telederm_response_published"),
      source: "telederm",
      sourceRef: asyncCase.id,
    });
    createNotification({
      recipientUserId: asyncCase.createdByUserId,
      profileId: asyncCase.profileId,
      kind: "telederm_response_ready",
      title: "Votre réponse dermatologue est disponible",
      body: "Consultez le compte-rendu dans votre dossier.",
      entityType: "async_case",
      entityId: asyncCase.id,
    });
    return getAsyncCaseDetail(asyncCase.id);
  }

  async closeAsyncCase(_actorUserId: string, caseId: string): Promise<AsyncCaseRecord> {
    const cases = readAsyncCases();
    const asyncCase = cases.find((item) => item.id === caseId);
    if (!asyncCase) throw new Error("Cas télé-derm introuvable");
    asyncCase.status = "closed";
    asyncCase.closedAt = nowIso();
    asyncCase.updatedAt = asyncCase.closedAt;
    writeAsyncCases(cases);
    return asyncCase;
  }

  async recordProfileSwitch(userId: string, profileId: string): Promise<void> {
    createAuditEvent(
      userId,
      "profile.switch",
      "profile",
      profileId,
      profileId,
    );
  }

  async listAuditEvents(userId: string): Promise<AuditEvent[]> {
    return readAudit()
      .filter((item) => item.actorUserId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function profileDisplayLabel(profile: Pick<PatientProfileRecord, "relationship" | "firstName" | "lastName">) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();

  if (profile.relationship === "moi") {
    return `${fullName} (Moi)`;
  }

  if (profile.relationship === "enfant") {
    return `${fullName} (Enfant)`;
  }

  return `${fullName} (Proche)`;
}

export const mockAccountAdapter = new MockAccountAdapter();
