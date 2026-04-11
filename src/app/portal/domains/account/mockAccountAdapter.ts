import type {
  AccountAdapter,
  AssignEducationProgramInput,
  CreateAsyncCaseInput,
  CreateAsyncCaseUploadIntentsInput,
  CreateEducationThreadMessageInput,
  AppendTimelineEventInput,
  CompleteMediaUploadInput,
  CreateMediaUploadIntentsInput,
  CreateOrLinkDependentInput,
  CreatePreConsultSubmissionInput,
  CreateScreeningReminderInput,
  EnsureSelfProfileInput,
  MarkEducationModuleProgressInput,
  ReplyAsyncCaseInput,
  RequestMoreInfoInput,
  RespondAsyncCaseInput,
  RevokeConsentInput,
  SignConsentInput,
  SubmitCheckInInput,
  SubmitAsyncCaseInput,
  UpdateAsyncCaseInput,
  UpdateNotificationPreferencesInput,
  UpdatePreventionLocationInput,
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
  CheckInSubmissionRecord,
  ClinicalDocumentRecord,
  ConsentRecord,
  ConsentType,
  EducationModuleProgressRecord,
  EducationProgramDetailRecord,
  EducationProgramEnrollmentRecord,
  EducationProgramRecord,
  EducationThreadMessageRecord,
  MediaAssetRecord,
  MediaUploadIntent,
  NotificationChannelPreference,
  NotificationPreference,
  PatientRecordEvent,
  PatientRecordEventType,
  PatientProfileRecord,
  PreventionAlertRecord,
  PreventionCurrentRecord,
  PreventionSettingsRecord,
  PreventionSnapshotRecord,
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
const EDUCATION_PROGRAMS_KEY = "melanis_account_education_programs_v1";
const EDUCATION_ENROLLMENTS_KEY = "melanis_account_education_enrollments_v1";
const EDUCATION_PROGRESS_KEY = "melanis_account_education_progress_v1";
const EDUCATION_MESSAGES_KEY = "melanis_account_education_messages_v1";
const CHECKINS_KEY = "melanis_account_checkins_v1";
const PREVENTION_SETTINGS_KEY = "melanis_account_prevention_settings_v1";
const PREVENTION_SNAPSHOTS_KEY = "melanis_account_prevention_snapshots_v1";
const PREVENTION_ALERTS_KEY = "melanis_account_prevention_alerts_v1";

const DAKAR_LOCATION = {
  latitude: 14.6928,
  longitude: -17.4467,
  locationLabel: "Dakar",
};

const EDUCATION_PROGRAM_SEEDS: Array<{
  conditionKey: string;
  title: string;
  description: string;
  coverTone: string;
  estimatedMinutes: number;
  modules: Array<{
    title: string;
    summary: string;
    moduleType: "article" | "checklist" | "routine" | "what_if";
    estimatedMinutes: number;
    body: string;
    checklistItems?: string[];
    routineMoments?: string[];
  }>;
}> = [
  {
    conditionKey: "eczema",
    title: "Ecole de l'atopie",
    description: "Apprendre à calmer les poussées et garder une routine protectrice.",
    coverTone: "apaisant",
    estimatedMinutes: 16,
    modules: [
      {
        title: "Comprendre la poussée",
        summary: "Identifier les déclencheurs fréquents.",
        moduleType: "article",
        estimatedMinutes: 4,
        body: "Repérez chaleur, poussière, savons agressifs et frottements.",
      },
      {
        title: "Routine anti-rechute",
        summary: "Les gestes matin et soir.",
        moduleType: "routine",
        estimatedMinutes: 4,
        body: "Hydrater vite après la toilette et privilégier les nettoyants doux.",
        routineMoments: ["Matin", "Après la douche", "Soir"],
      },
      {
        title: "Checklist maison",
        summary: "Les irritants faciles à réduire.",
        moduleType: "checklist",
        estimatedMinutes: 3,
        body: "Réduisez les parfums et le frottement.",
        checklistItems: [
          "Émollient 2 fois par jour",
          "Savon sans parfum",
          "Éviter l'eau très chaude",
        ],
      },
    ],
  },
  {
    conditionKey: "melasma",
    title: "Programme taches & melasma",
    description: "Photo-protection, constance et prévention des rechutes pigmentaires.",
    coverTone: "solaire",
    estimatedMinutes: 14,
    modules: [
      {
        title: "Le soleil au quotidien",
        summary: "Pourquoi les UV comptent même les jours ordinaires.",
        moduleType: "article",
        estimatedMinutes: 3,
        body: "Même sans soleil direct, les UV entretiennent les taches.",
      },
      {
        title: "Routine anti-taches",
        summary: "Une séquence simple matin et soir.",
        moduleType: "routine",
        estimatedMinutes: 4,
        body: "Nettoyer, protéger le matin, traiter le soir.",
        routineMoments: ["Matin", "Midi si exposition", "Soir"],
      },
      {
        title: "Checklist photoprotection",
        summary: "Les réflexes de la saison chaude.",
        moduleType: "checklist",
        estimatedMinutes: 3,
        body: "Le meilleur traitement reste la régularité photoprotectrice.",
        checklistItems: [
          "SPF 50+ chaque matin",
          "Réappliquer en extérieur",
          "Ajouter une protection textile",
        ],
      },
    ],
  },
  {
    conditionKey: "acne",
    title: "Acne : bases durables",
    description: "Construire une routine courte et suivre l'évolution sans surtraiter.",
    coverTone: "clarte",
    estimatedMinutes: 13,
    modules: [
      {
        title: "Lire ses boutons",
        summary: "Différencier inflammation et irritation.",
        moduleType: "article",
        estimatedMinutes: 3,
        body: "Tous les boutons ne demandent pas la même réaction.",
      },
      {
        title: "Routine simple",
        summary: "Moins de produits, plus de régularité.",
        moduleType: "routine",
        estimatedMinutes: 4,
        body: "Nettoyant doux, actif du soir, hydratant et SPF.",
        routineMoments: ["Matin", "Soir"],
      },
      {
        title: "Checklist anti-irritation",
        summary: "Les erreurs les plus fréquentes.",
        moduleType: "checklist",
        estimatedMinutes: 3,
        body: "Évitez de superposer des actifs irritants.",
        checklistItems: [
          "Ne pas percer les lésions",
          "Introduire les actifs progressivement",
          "Limiter les produits occlusifs",
        ],
      },
    ],
  },
];

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

function readEducationPrograms() {
  return safeRead<EducationProgramRecord[]>(EDUCATION_PROGRAMS_KEY, []);
}

function writeEducationPrograms(programs: EducationProgramRecord[]) {
  safeWrite(EDUCATION_PROGRAMS_KEY, programs.slice(-200));
}

function readEducationEnrollments() {
  return safeRead<EducationProgramEnrollmentRecord[]>(EDUCATION_ENROLLMENTS_KEY, []);
}

function writeEducationEnrollments(enrollments: EducationProgramEnrollmentRecord[]) {
  safeWrite(EDUCATION_ENROLLMENTS_KEY, enrollments.slice(-1000));
}

function readEducationProgress() {
  return safeRead<EducationModuleProgressRecord[]>(EDUCATION_PROGRESS_KEY, []);
}

function writeEducationProgress(progress: EducationModuleProgressRecord[]) {
  safeWrite(EDUCATION_PROGRESS_KEY, progress.slice(-2000));
}

function readEducationMessages() {
  return safeRead<EducationThreadMessageRecord[]>(EDUCATION_MESSAGES_KEY, []);
}

function writeEducationMessages(messages: EducationThreadMessageRecord[]) {
  safeWrite(EDUCATION_MESSAGES_KEY, messages.slice(-2000));
}

function readCheckIns() {
  return safeRead<CheckInSubmissionRecord[]>(CHECKINS_KEY, []);
}

function writeCheckIns(items: CheckInSubmissionRecord[]) {
  safeWrite(CHECKINS_KEY, items.slice(-2000));
}

function readPreventionSettings() {
  return safeRead<PreventionSettingsRecord[]>(PREVENTION_SETTINGS_KEY, []);
}

function writePreventionSettings(items: PreventionSettingsRecord[]) {
  safeWrite(PREVENTION_SETTINGS_KEY, items.slice(-2000));
}

function readPreventionSnapshots() {
  return safeRead<PreventionSnapshotRecord[]>(PREVENTION_SNAPSHOTS_KEY, []);
}

function writePreventionSnapshots(items: PreventionSnapshotRecord[]) {
  safeWrite(PREVENTION_SNAPSHOTS_KEY, items.slice(-2000));
}

function readPreventionAlerts() {
  return safeRead<PreventionAlertRecord[]>(PREVENTION_ALERTS_KEY, []);
}

function writePreventionAlerts(items: PreventionAlertRecord[]) {
  safeWrite(PREVENTION_ALERTS_KEY, items.slice(-2000));
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

function moduleIdFor(programId: string, index: number) {
  return `${programId}_module_${index + 1}`;
}

function ensureEducationProgramsSeeded() {
  const existing = readEducationPrograms();
  if (existing.length > 0) return;

  const createdAt = nowIso();
  const programs: EducationProgramRecord[] = [];
  for (const seed of EDUCATION_PROGRAM_SEEDS) {
    const programId = randomId(`program_${seed.conditionKey}`);
    programs.push({
      id: programId,
      conditionKey: seed.conditionKey,
      title: seed.title,
      description: seed.description,
      audience: ["patient", "caregiver"],
      status: "published",
      version: 1,
      estimatedMinutes: seed.estimatedMinutes,
      coverTone: seed.coverTone,
      createdAt,
      updatedAt: createdAt,
      modulesCount: seed.modules.length,
    });
  }
  writeEducationPrograms(programs);
}

function getProgramModules(programId: string) {
  ensureEducationProgramsSeeded();
  const program = readEducationPrograms().find((item) => item.id === programId);
  if (!program) return [];
  const seed = EDUCATION_PROGRAM_SEEDS.find((item) => item.conditionKey === program.conditionKey);
  if (!seed) return [];
  return seed.modules.map((module, index) => ({
    id: moduleIdFor(programId, index),
    programId,
    title: module.title,
    summary: module.summary,
    moduleType: module.moduleType,
    orderIndex: index + 1,
    estimatedMinutes: module.estimatedMinutes,
    body: module.body,
    checklistItems: module.checklistItems ?? [],
    routineMoments: module.routineMoments ?? [],
    tags: [program.conditionKey],
    extra: {},
    createdAt: program.createdAt,
    updatedAt: program.updatedAt,
  }));
}

function ensureProgressSkeleton(enrollment: EducationProgramEnrollmentRecord) {
  const progress = readEducationProgress();
  const modules = getProgramModules(enrollment.programId);
  let changed = false;
  for (const module of modules) {
    if (
      progress.some(
        (item) =>
          item.enrollmentId === enrollment.id &&
          item.moduleId === module.id &&
          item.profileId === enrollment.profileId,
      )
    ) {
      continue;
    }
    changed = true;
    progress.push({
      id: randomId("progress"),
      profileId: enrollment.profileId,
      enrollmentId: enrollment.id,
      programId: enrollment.programId,
      moduleId: module.id,
      status: "not_started",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  }
  if (changed) writeEducationProgress(progress);
}

function computeEnrollmentProgress(enrollment: EducationProgramEnrollmentRecord) {
  const modules = getProgramModules(enrollment.programId);
  const progress = readEducationProgress().filter(
    (item) => item.enrollmentId === enrollment.id,
  );
  const completed = progress.filter((item) => item.status === "completed").length;
  if (modules.length === 0) return 0;
  return Math.round((completed / modules.length) * 100);
}

function hydrateEnrollment(enrollment: EducationProgramEnrollmentRecord) {
  ensureProgressSkeleton(enrollment);
  const progressPercent = computeEnrollmentProgress(enrollment);
  const next: EducationProgramEnrollmentRecord = {
    ...enrollment,
    progressPercent,
    status: progressPercent >= 100 ? "completed" : enrollment.status,
    completedAt: progressPercent >= 100 ? enrollment.completedAt ?? nowIso() : undefined,
  };
  return next;
}

function getEducationMessagesForEnrollment(enrollmentId: string) {
  return readEducationMessages()
    .filter((item) => item.enrollmentId === enrollmentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function ensurePreventionSettings(profileId: string) {
  const items = readPreventionSettings();
  const existing = items.find((item) => item.profileId === profileId);
  if (existing) return existing;
  const created: PreventionSettingsRecord = {
    id: randomId("prevention_settings"),
    profileId,
    latitude: DAKAR_LOCATION.latitude,
    longitude: DAKAR_LOCATION.longitude,
    locationLabel: DAKAR_LOCATION.locationLabel,
    source: "fallback",
    resolvedAt: nowIso(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  items.push(created);
  writePreventionSettings(items);
  return created;
}

function activeConditionKeys(profileId: string) {
  return Array.from(
    new Set(
      readEducationEnrollments()
        .filter((item) => item.profileId === profileId && item.status !== "paused")
        .map((item) => item.conditionKey)
        .concat("general"),
    ),
  );
}

function createPreventionSnapshot(profileId: string): PreventionSnapshotRecord {
  const settings = ensurePreventionSettings(profileId);
  const hour = new Date().getHours();
  const uv = hour >= 11 && hour <= 15 ? 8.8 : hour >= 9 && hour < 11 ? 6.3 : 3.2;
  const snapshot: PreventionSnapshotRecord = {
    id: randomId("prevention_snapshot"),
    profileId,
    latitude: settings.latitude,
    longitude: settings.longitude,
    locationLabel: settings.locationLabel,
    source: "mock_live",
    observedAt: nowIso(),
    inputs: {
      uv_index: uv,
      temperature: 31,
      humidity: 68,
      wind_speed: 21,
      aqi: 64,
      dust: 43,
      pm10: 36,
      pm2_5: 18,
    },
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const snapshots = readPreventionSnapshots().filter((item) => item.profileId !== profileId);
  snapshots.push(snapshot);
  writePreventionSnapshots(snapshots);
  return snapshot;
}

function computePreventionAlerts(profileId: string, snapshot: PreventionSnapshotRecord) {
  const conditions = activeConditionKeys(profileId);
  const inputs = snapshot.inputs as Record<string, number>;
  const alerts: PreventionAlertRecord[] = [];
  const now = nowIso();

  if ((inputs.uv_index ?? 0) >= 7) {
    alerts.push({
      id: randomId("prevention_alert"),
      profileId,
      ruleId: "general_uv",
      snapshotId: snapshot.id,
      title: "UV élevé aujourd'hui",
      body: "Limitez l'exposition directe et renouvelez la photoprotection.",
      severity: "attention",
      status: "active",
      startsAt: now,
      expiresAt: addDays(now, 1),
      meta: { category: "uv", inputs },
      createdAt: now,
      updatedAt: now,
    });
  }
  if (conditions.includes("melasma") && (inputs.uv_index ?? 0) >= 6) {
    alerts.push({
      id: randomId("prevention_alert"),
      profileId,
      ruleId: "melasma_uv",
      snapshotId: snapshot.id,
      title: "Fenêtre à risque pigmentaire",
      body: "Renforcez la photoprotection et limitez l'exposition extérieure.",
      severity: "high",
      status: "active",
      startsAt: now,
      expiresAt: addDays(now, 1),
      meta: { category: "pigmentation", inputs },
      createdAt: now,
      updatedAt: now,
    });
  }
  if (conditions.includes("eczema") && (inputs.wind_speed ?? 0) >= 20) {
    alerts.push({
      id: randomId("prevention_alert"),
      profileId,
      ruleId: "eczema_wind",
      snapshotId: snapshot.id,
      title: "Conditions irritantes pour la peau atopique",
      body: "Renforcez l'hydratation aujourd'hui et limitez les frottements.",
      severity: "attention",
      status: "active",
      startsAt: now,
      expiresAt: addDays(now, 1),
      meta: { category: "barrier", inputs },
      createdAt: now,
      updatedAt: now,
    });
  }
  if (
    conditions.includes("acne") &&
    (inputs.temperature ?? 0) >= 30 &&
    (inputs.humidity ?? 0) >= 65
  ) {
    alerts.push({
      id: randomId("prevention_alert"),
      profileId,
      ruleId: "acne_heat",
      snapshotId: snapshot.id,
      title: "Chaleur et humidité élevées",
      body: "Gardez une routine simple, légère et non occlusive aujourd'hui.",
      severity: "info",
      status: "active",
      startsAt: now,
      expiresAt: addDays(now, 1),
      meta: { category: "acne", inputs },
      createdAt: now,
      updatedAt: now,
    });
  }

  const existing = readPreventionAlerts().filter((item) => item.profileId !== profileId);
  writePreventionAlerts([...existing, ...alerts]);
  return alerts;
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
  if (type === "education_program_assigned") return "Programme d'éducation assigné";
  if (type === "education_module_completed") return "Module éducatif complété";
  if (type === "check_in_due") return "Check-in à compléter";
  if (type === "check_in_submitted") return "Check-in patient soumis";
  if (type === "prevention_alert_triggered") return "Alerte prévention déclenchée";
  if (type === "screening_reminder_due") return "Rappel de dépistage";
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

  async listEducationPrograms(
    actorUserId: string,
    profileId: string,
  ): Promise<EducationProgramRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    ensureEducationProgramsSeeded();
    const enrollments = readEducationEnrollments()
      .filter((item) => item.profileId === profileId)
      .map((item) => hydrateEnrollment(item));
    const programs = readEducationPrograms();
    const assigned = enrollments
      .map((enrollment) => {
        const program = programs.find((item) => item.id === enrollment.programId);
        if (!program) return null;
        return {
          ...program,
          enrollment,
          modulesCount: getProgramModules(program.id).length,
        };
      })
      .filter((item) => item !== null);
    return assigned
      .sort((a, b) => a.enrollment.updatedAt.localeCompare(b.enrollment.updatedAt))
      .reverse();
  }

  async getEducationProgram(
    actorUserId: string,
    profileId: string,
    programId: string,
  ): Promise<EducationProgramDetailRecord> {
    assertProfileAccessible(actorUserId, profileId);
    ensureEducationProgramsSeeded();
    const program = readEducationPrograms().find((item) => item.id === programId);
    if (!program) throw new Error("Programme introuvable");
    const enrollment = readEducationEnrollments().find(
      (item) => item.profileId === profileId && item.programId === programId,
    );
    if (!enrollment) throw new Error("Programme non assigné");
    const hydratedEnrollment = hydrateEnrollment(enrollment);
    const modules = getProgramModules(programId);
    const progress = readEducationProgress().filter(
      (item) => item.enrollmentId === enrollment.id,
    );
    const recentCheckIns = readCheckIns()
      .filter((item) => item.enrollmentId === enrollment.id)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5);
    return {
      program: {
        ...program,
        enrollment: hydratedEnrollment,
        modulesCount: modules.length,
      },
      modules,
      progress,
      recentCheckIns,
      messages: getEducationMessagesForEnrollment(enrollment.id),
    };
  }

  async createEducationThreadMessage(
    input: CreateEducationThreadMessageInput,
  ): Promise<EducationProgramDetailRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const profile = readProfiles().find((item) => item.id === input.profileId);
    if (!profile) throw new Error("Profil introuvable");
    const enrollment = readEducationEnrollments().find(
      (item) => item.profileId === input.profileId && item.programId === input.programId,
    );
    if (!enrollment) throw new Error("Programme non assigné");
    const messages = readEducationMessages();
    const created: EducationThreadMessageRecord = {
      id: randomId("education_message"),
      profileId: input.profileId,
      enrollmentId: enrollment.id,
      programId: input.programId,
      actorUserId: input.actorUserId,
      authorRole: profile.ownerUserId === input.actorUserId ? "patient" : "caregiver",
      body: input.body.trim(),
      meta: { requestAppointment: input.requestAppointment ?? false },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    messages.push(created);
    writeEducationMessages(messages);
    createNotification({
      recipientUserId: enrollment.assignedByUserId,
      profileId: input.profileId,
      kind: "education_question_posted",
      title: "Nouvelle question de programme",
      body: "Un patient a envoyé une question depuis son programme éducatif.",
      entityType: "education_thread_message",
      entityId: created.id,
    });
    return this.getEducationProgram(input.actorUserId, input.profileId, input.programId);
  }

  async markEducationModuleProgress(
    input: MarkEducationModuleProgressInput,
  ): Promise<EducationProgramDetailRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const programId = input.moduleId.split("_module_")[0] ?? "";
    const enrollment = readEducationEnrollments().find(
      (item) => item.profileId === input.profileId && item.programId === programId,
    );
    if (!enrollment) throw new Error("Programme non assigné");
    const progress = readEducationProgress();
    const target = progress.find(
      (item) => item.enrollmentId === enrollment.id && item.moduleId === input.moduleId,
    );
    if (!target) throw new Error("Module introuvable");
    target.status = input.status;
    if (input.status !== "not_started" && !target.startedAt) {
      target.startedAt = nowIso();
    }
    target.completedAt = input.status === "completed" ? nowIso() : undefined;
    target.updatedAt = nowIso();
    writeEducationProgress(progress);

    if (input.status === "completed") {
      appendTimelineEventInternal({
        actorUserId: input.actorUserId,
        profileId: input.profileId,
        type: "education_module_completed",
        title: timelineTitleFromType("education_module_completed"),
        description: "Un module de votre programme a été terminé.",
        source: "education_program",
        sourceRef: target.id,
      });
      createNotification({
        recipientUserId: input.actorUserId,
        profileId: input.profileId,
        kind: "education_module_completed",
        title: "Module terminé",
        body: "Votre progression de programme a été mise à jour.",
        entityType: "education_module",
        entityId: input.moduleId,
      });
    }
    return this.getEducationProgram(input.actorUserId, input.profileId, programId);
  }

  async listCheckIns(
    actorUserId: string,
    profileId: string,
    enrollmentId?: string,
  ): Promise<CheckInSubmissionRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    return readCheckIns()
      .filter((item) => item.profileId === profileId)
      .filter((item) => (enrollmentId ? item.enrollmentId === enrollmentId : true))
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  }

  async submitCheckIn(input: SubmitCheckInInput): Promise<CheckInSubmissionRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const enrollment = readEducationEnrollments().find(
      (item) => item.id === input.enrollmentId && item.profileId === input.profileId,
    );
    if (!enrollment) throw new Error("Programme introuvable pour ce check-in");
    const submission: CheckInSubmissionRecord = {
      id: randomId("checkin"),
      profileId: input.profileId,
      enrollmentId: input.enrollmentId,
      programId: enrollment.programId,
      templateId: input.templateId,
      submittedByUserId: input.actorUserId,
      questionnaireData: input.questionnaireData,
      measurements: input.measurements,
      mediaAssetIds: input.mediaAssetIds,
      submittedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const checkIns = readCheckIns();
    checkIns.push(submission);
    writeCheckIns(checkIns);

    enrollment.nextCheckInDueAt = addDays(nowIso(), 30);
    enrollment.updatedAt = nowIso();
    const enrollments = readEducationEnrollments().map((item) =>
      item.id === enrollment.id ? enrollment : item,
    );
    writeEducationEnrollments(enrollments);

    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: input.profileId,
      type: "check_in_submitted",
      title: timelineTitleFromType("check_in_submitted"),
      description: "Un nouveau check-in a été enregistré.",
      source: "check_in",
      sourceRef: submission.id,
    });
    createNotification({
      recipientUserId: input.actorUserId,
      profileId: input.profileId,
      kind: "check_in_submitted",
      title: "Check-in enregistré",
      body: "Votre suivi patient a bien été enregistré.",
      entityType: "checkin_submission",
      entityId: submission.id,
    });
    return submission;
  }

  async getPreventionCurrent(
    actorUserId: string,
    profileId: string,
  ): Promise<PreventionCurrentRecord> {
    assertProfileAccessible(actorUserId, profileId);
    const settings = ensurePreventionSettings(profileId);
    const snapshot = createPreventionSnapshot(profileId);
    const alerts = computePreventionAlerts(profileId, snapshot);
    return {
      settings,
      snapshot,
      alerts,
    };
  }

  async listPreventionAlerts(
    actorUserId: string,
    profileId: string,
  ): Promise<PreventionAlertRecord[]> {
    assertProfileAccessible(actorUserId, profileId);
    await this.getPreventionCurrent(actorUserId, profileId);
    return readPreventionAlerts()
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPreventionLocation(
    actorUserId: string,
    profileId: string,
  ): Promise<PreventionSettingsRecord> {
    assertProfileAccessible(actorUserId, profileId);
    return ensurePreventionSettings(profileId);
  }

  async updatePreventionLocation(
    input: UpdatePreventionLocationInput,
  ): Promise<PreventionSettingsRecord> {
    assertProfileAccessible(input.actorUserId, input.profileId);
    const settings = ensurePreventionSettings(input.profileId);
    const updated: PreventionSettingsRecord = {
      ...settings,
      latitude: input.latitude,
      longitude: input.longitude,
      locationLabel: input.locationLabel,
      source: input.source ?? "device",
      resolvedAt: nowIso(),
      updatedAt: nowIso(),
    };
    const items = readPreventionSettings().map((item) =>
      item.id === updated.id ? updated : item,
    );
    writePreventionSettings(items);
    return updated;
  }

  async listPractitionerEducationPrograms(
    _actorUserId: string,
  ): Promise<EducationProgramRecord[]> {
    ensureEducationProgramsSeeded();
    return readEducationPrograms().sort((a, b) => a.title.localeCompare(b.title));
  }

  async listScreeningRemindersForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<ScreeningReminder[]> {
    ensureScreeningRemindersForProfile(profileId);
    return readScreeningReminders()
      .filter((item) => item.profileId === profileId)
      .sort((a, b) => a.nextDueAt.localeCompare(b.nextDueAt));
  }

  async updateScreeningReminderForPractitioner(
    input: UpdateScreeningReminderInput,
  ): Promise<ScreeningReminder> {
    return this.updateScreeningReminder(input);
  }

  async getEducationProgramForPractitioner(
    _actorUserId: string,
    profileId: string,
    programId: string,
  ): Promise<EducationProgramDetailRecord> {
    const profile = readProfiles().find((item) => item.id === profileId);
    if (!profile) throw new Error("Profil patient introuvable");
    return this.getEducationProgram(profile.ownerUserId, profileId, programId);
  }

  async createEducationThreadMessageForPractitioner(
    input: CreateEducationThreadMessageInput,
  ): Promise<EducationProgramDetailRecord> {
    const enrollment = readEducationEnrollments().find(
      (item) => item.profileId === input.profileId && item.programId === input.programId,
    );
    if (!enrollment) throw new Error("Programme non assigné");
    const profile = readProfiles().find((item) => item.id === input.profileId);
    if (!profile) throw new Error("Profil patient introuvable");
    const messages = readEducationMessages();
    const created: EducationThreadMessageRecord = {
      id: randomId("education_message"),
      profileId: input.profileId,
      enrollmentId: enrollment.id,
      programId: input.programId,
      actorUserId: input.actorUserId,
      authorRole: "practitioner",
      body: input.body.trim(),
      meta: { requestAppointment: input.requestAppointment ?? false },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    messages.push(created);
    writeEducationMessages(messages);
    createNotification({
      recipientUserId: profile.ownerUserId,
      profileId: input.profileId,
      kind: "education_answer_posted",
      title: "Réponse sur votre programme",
      body: "Votre praticien a répondu dans votre programme éducatif.",
      entityType: "education_thread_message",
      entityId: created.id,
    });
    return this.getEducationProgram(profile.ownerUserId, input.profileId, input.programId);
  }

  async listProfileEducationProgramsForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<EducationProgramRecord[]> {
    ensureEducationProgramsSeeded();
    const enrollments = readEducationEnrollments()
      .filter((item) => item.profileId === profileId)
      .map((item) => hydrateEnrollment(item));
    return enrollments
      .map((enrollment) => {
        const program = readEducationPrograms().find((item) => item.id === enrollment.programId);
        if (!program) return null;
        return {
          ...program,
          enrollment,
          modulesCount: getProgramModules(program.id).length,
        };
      })
      .filter((item) => item !== null);
  }

  async assignEducationProgram(
    input: AssignEducationProgramInput,
  ): Promise<EducationProgramDetailRecord> {
    const profile = readProfiles().find((item) => item.id === input.profileId);
    if (!profile) throw new Error("Profil patient introuvable");
    ensureEducationProgramsSeeded();
    const program = readEducationPrograms().find((item) => item.id === input.programId);
    if (!program) throw new Error("Programme introuvable");
    const enrollments = readEducationEnrollments();
    const existing = enrollments.find(
      (item) => item.profileId === input.profileId && item.programId === input.programId,
    );
    const enrollment: EducationProgramEnrollmentRecord =
      existing ?? {
        id: randomId("enrollment"),
        profileId: input.profileId,
        programId: input.programId,
        conditionKey: program.conditionKey,
        assignedByUserId: input.actorUserId,
        assignedByPractitionerId: "practitioner_demo",
        status: "active",
        startedAt: nowIso(),
        nextCheckInDueAt: input.nextCheckInDueAt,
        checkInCadence: input.checkInCadence,
        progressPercent: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };

    const nextEnrollment = {
      ...enrollment,
      assignedByUserId: input.actorUserId,
      assignedByPractitionerId: "practitioner_demo",
      checkInCadence: input.checkInCadence,
      nextCheckInDueAt: input.nextCheckInDueAt,
      updatedAt: nowIso(),
    };
    const nextEnrollments = existing
      ? enrollments.map((item) => (item.id === existing.id ? nextEnrollment : item))
      : [...enrollments, nextEnrollment];
    writeEducationEnrollments(nextEnrollments);
    ensureProgressSkeleton(nextEnrollment);

    appendTimelineEventInternal({
      actorUserId: input.actorUserId,
      profileId: input.profileId,
      type: "education_program_assigned",
      title: timelineTitleFromType("education_program_assigned"),
      description: `Programme « ${program.title} » assigné.`,
      source: "education_program",
      sourceRef: nextEnrollment.id,
    });
    createNotification({
      recipientUserId: profile.ownerUserId,
      profileId: input.profileId,
      kind: "education_program_assigned",
      title: "Nouveau programme de suivi",
      body: `Votre praticien a assigné le programme « ${program.title} ».`,
      entityType: "education_program",
      entityId: program.id,
    });
    return this.getEducationProgram(profile.ownerUserId, input.profileId, input.programId);
  }

  async createScreeningReminderForPractitioner(
    input: CreateScreeningReminderInput,
  ): Promise<ScreeningReminder> {
    const reminders = readScreeningReminders();
    const existing = reminders.find(
      (item) =>
        item.profileId === input.profileId &&
        item.screeningType.toLowerCase() === input.screeningType.toLowerCase(),
    );
    const nextReminder: ScreeningReminder =
      existing ?? {
        id: randomId("screening"),
        profileId: input.profileId,
        screeningType: input.screeningType,
        cadence: input.cadence,
        status: "active",
        nextDueAt: input.nextDueAt,
        channels: getDefaultChannels(true),
        updatedAt: nowIso(),
      };
    nextReminder.cadence = input.cadence;
    nextReminder.status = "active";
    nextReminder.nextDueAt = input.nextDueAt;
    nextReminder.updatedAt = nowIso();
    writeScreeningReminders(
      existing
        ? reminders.map((item) => (item.id === existing.id ? nextReminder : item))
        : [...reminders, nextReminder],
    );
    return nextReminder;
  }

  async getProfilePreventionCurrentForPractitioner(
    _actorUserId: string,
    profileId: string,
  ): Promise<PreventionCurrentRecord> {
    const settings = ensurePreventionSettings(profileId);
    const snapshot = createPreventionSnapshot(profileId);
    const alerts = computePreventionAlerts(profileId, snapshot);
    return {
      settings,
      snapshot,
      alerts,
    };
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
