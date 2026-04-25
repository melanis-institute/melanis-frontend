import type {
  ClinicalDocumentRecord,
  EducationProgramDetailRecord,
  EducationProgramRecord,
  PreventionCurrentRecord,
  PreConsultSubmissionRecord,
  PrescriptionItem,
  ScreeningCadence,
  ScreeningReminder,
} from "@portal/domains/account/types";
import {
  NEXT_STATUS_BY_CURRENT,
  appointmentStatusLabel,
  type AppointmentRecord,
  type AppointmentStatus,
} from "@portal/domains/appointments/types";
import {
  DUREES,
  MOTIFS,
  type PreConsultData,
} from "@portal/features/patient/preconsult/components/types";
import { useAuth } from "@portal/session/useAuth";
import { Tabs, type TabItem } from "@shared/ui";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import {
  readStorageJson,
  removeStorageValue,
  writeStorageJson,
} from "@shared/lib/storage";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  FileText,
  Loader2,
  MapPin,
  MessageSquareText,
  Pill,
  Plus,
  Printer,
  Send,
  Sparkles,
  Star,
  Stethoscope,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

type PrescriptionDraftRowType = "medication" | "care";
type DraftStatus = "idle" | "restored" | "saved" | "published" | "favorite";

interface PrescriptionDraftRow {
  id: string;
  type: PrescriptionDraftRowType;
  name: string;
  instructions: string;
}

interface ConsultationDraft {
  diagnosis: string;
  clinicalSummary: string;
  prescriptionRows: PrescriptionDraftRow[];
  measurementText: string;
  followUpCadence: ScreeningCadence | "";
  followUpDueAt: string;
  updatedAt: number;
}

interface DraftSnapshot {
  signature: string;
  storage: "present" | "cleared";
}

interface FavoritePrescriptionItem {
  id: string;
  type: PrescriptionDraftRowType;
  name: string;
  instructions: string;
}

interface PrescriptionTemplate {
  id: string;
  label: string;
  description: string;
  diagnosisHint?: string;
  summaryHint?: string;
  rows: Array<Omit<PrescriptionDraftRow, "id">>;
}

const CADENCE_OPTIONS: ScreeningCadence[] = [
  "monthly",
  "quarterly",
  "semiannual",
  "annual",
];

const CADENCE_LABELS: Record<ScreeningCadence, string> = {
  monthly: "Mensuel",
  quarterly: "Trimestriel",
  semiannual: "Semestriel",
  annual: "Annuel",
};

const DIAGNOSIS_SUGGESTIONS = [
  "Acne inflammatoire moderee",
  "Eczema atopique",
  "Melasma",
  "Dermatite seborrheique",
  "Folliculite",
  "Intertrigo mycosique",
] as const;

const INSTRUCTION_SNIPPETS = [
  "Matin",
  "Soir",
  "1 fois/jour",
  "2 fois/jour",
  "7 jours",
  "30 jours",
  "Application locale",
  "Eviter le soleil",
] as const;

const PRESCRIPTION_TEMPLATES: PrescriptionTemplate[] = [
  {
    id: "acne-basic",
    label: "Acne simple",
    description: "Routine acne de base, editable en un clic.",
    diagnosisHint: "Acne inflammatoire moderee",
    summaryHint:
      "Plan de traitement initial avec nettoyage doux, topique du soir et photoprotection quotidienne.",
    rows: [
      {
        type: "care",
        name: "Gel nettoyant doux",
        instructions: "Matin et soir sur peau humide pendant 30 jours",
      },
      {
        type: "medication",
        name: "Adapalene gel",
        instructions:
          "Le soir, fine couche sur les zones touchees pendant 30 jours",
      },
      {
        type: "care",
        name: "Ecran solaire SPF 50+",
        instructions:
          "Tous les matins, reappliquer a midi si exposition solaire",
      },
    ],
  },
  {
    id: "eczema-flare",
    label: "Poussee eczema",
    description: "Soulagement rapide et routine de relai.",
    diagnosisHint: "Eczema atopique en poussee",
    summaryHint:
      "Calmer l'inflammation, restaurer la barriere cutanee et reduire les facteurs irritants.",
    rows: [
      {
        type: "medication",
        name: "Dermocorticoide local",
        instructions: "Application locale le soir pendant 7 jours",
      },
      {
        type: "care",
        name: "Baume emollient relipidant",
        instructions: "Matin et soir sur tout le corps pendant 30 jours",
      },
    ],
  },
  {
    id: "pigmentation-care",
    label: "Taches pigmentaires",
    description: "Routine anti-taches avec photo-protection.",
    diagnosisHint: "Melasma",
    summaryHint:
      "Prise en charge des hyperpigmentations avec photoprotection stricte et actifs depigmentants.",
    rows: [
      {
        type: "care",
        name: "Serum depigmentant",
        instructions: "Le soir sur les zones concernees pendant 30 jours",
      },
      {
        type: "care",
        name: "Ecran solaire teinte SPF 50+",
        instructions: "Tous les matins, reappliquer si exposition prolongee",
      },
    ],
  },
];

const EMPTY_DRAFT_ROW: Omit<PrescriptionDraftRow, "id"> = {
  type: "medication",
  name: "",
  instructions: "",
};

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function toDateInputValue(value?: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function statusToneOnDark(status: AppointmentStatus) {
  if (status === "scheduled") return "bg-white/[0.15] text-white/80";
  if (status === "checked_in") return "bg-amber-400/20 text-amber-200";
  if (status === "in_consultation") return "bg-blue-400/20 text-blue-200";
  return "bg-emerald-400/20 text-emerald-200";
}

function nextStatusActionLabel(status: AppointmentStatus | null): string {
  if (status === "checked_in") return "Marquer patient arrive";
  if (status === "in_consultation") return "Demarrer la consultation";
  if (status === "completed") return "Terminer la consultation";
  return "";
}

function toDisplayRows(
  preConsultData: unknown,
): Array<{ label: string; value: string }> {
  if (!preConsultData || typeof preConsultData !== "object") return [];

  const data = preConsultData as Partial<PreConsultData>;
  const rows: Array<{ label: string; value: string }> = [];

  if (typeof data.motif === "string") {
    const motif = MOTIFS.find((item) => item.key === data.motif)?.label;
    if (motif) rows.push({ label: "Motif", value: motif });
  }
  if (
    typeof data.motifAutre === "string" &&
    data.motifAutre.trim().length > 0
  ) {
    rows.push({ label: "Motif (autre)", value: data.motifAutre.trim() });
  }
  if (Array.isArray(data.zones) && data.zones.length > 0) {
    rows.push({ label: "Zones", value: data.zones.join(", ") });
  }
  if (Array.isArray(data.symptomes) && data.symptomes.length > 0) {
    rows.push({ label: "Symptomes", value: data.symptomes.join(", ") });
  }
  if (typeof data.duree === "string") {
    const duration = DUREES.find((item) => item.key === data.duree)?.label;
    if (duration) rows.push({ label: "Depuis", value: duration });
  }
  if (typeof data.intensite === "number") {
    rows.push({ label: "Intensite", value: `${data.intensite}/5` });
  }
  if (Array.isArray(data.objectifs) && data.objectifs.length > 0) {
    rows.push({ label: "Objectifs", value: data.objectifs.join(", ") });
  }
  if (Array.isArray(data.photos)) {
    rows.push({ label: "Photos", value: `${data.photos.length} ajoutee(s)` });
  }

  return rows;
}

function toPhotoPreviews(
  submission: PreConsultSubmissionRecord | null,
  appointment: AppointmentRecord | null,
): Array<{ url: string; name: string }> {
  if (submission) {
    return submission.mediaAssets
      .filter(
        (asset) =>
          typeof asset.downloadUrl === "string" && asset.downloadUrl.length > 0,
      )
      .map((asset) => ({
        url: asset.downloadUrl as string,
        name: asset.fileName,
      }));
  }

  const data = appointment?.preConsultData;
  if (!data || typeof data !== "object") return [];
  const payload = data as { photos?: unknown };
  if (!Array.isArray(payload.photos)) return [];

  return payload.photos
    .filter(
      (photo): photo is { url: string; name?: string } =>
        typeof photo === "object" &&
        photo !== null &&
        "url" in photo &&
        typeof photo.url === "string" &&
        photo.url.length > 0,
    )
    .map((photo, index) => ({
      url: photo.url,
      name:
        typeof photo.name === "string" && photo.name.length > 0
          ? photo.name
          : `Photo ${index + 1}`,
    }));
}

function parseMeasurements(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, rawValue, unit] = line
        .split("|")
        .map((part) => part.trim());
      if (!label || !rawValue) return null;
      return { label, value: rawValue, unit: unit || undefined };
    })
    .filter(
      (
        item,
      ): item is { label: string; value: string; unit: string | undefined } =>
        item !== null,
    );
}

function toMeasurementText(appointment: AppointmentRecord | null) {
  if (!appointment || appointment.measurements.length === 0) return "";
  return appointment.measurements
    .map((measurement) =>
      [measurement.label, measurement.value, measurement.unit]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");
}

function toDraftRowsFromDocument(
  document: ClinicalDocumentRecord | undefined,
): PrescriptionDraftRow[] {
  if (!document || document.prescriptionItems.length === 0) return [];
  return document.prescriptionItems.map((item) => ({
    id: createRowId(),
    type: item.isMedication ? "medication" : "care",
    name: item.name,
    instructions: item.instructions,
  }));
}

function createRowId() {
  return `row_${Math.random().toString(36).slice(2, 10)}`;
}

function createDraftRow(
  partial: Partial<Omit<PrescriptionDraftRow, "id">> = {},
): PrescriptionDraftRow {
  return {
    id: createRowId(),
    type: partial.type ?? EMPTY_DRAFT_ROW.type,
    name: partial.name ?? "",
    instructions: partial.instructions ?? "",
  };
}

function normalizeDraftRows(rows: PrescriptionDraftRow[]) {
  return rows.map((row) => ({ ...row, id: row.id || createRowId() }));
}

function rowToPrescriptionItem(
  row: PrescriptionDraftRow,
): PrescriptionItem | null {
  const name = row.name.trim();
  const instructions = row.instructions.trim();
  if (!name || !instructions) return null;
  return {
    name,
    instructions,
    isMedication: row.type === "medication",
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function createPrintableHtml(params: {
  patientName: string;
  practitionerName: string;
  appointmentDate: string;
  diagnosis?: string;
  summary?: string;
  items: PrescriptionItem[];
}) {
  const medicationLines = params.items
    .map(
      (item, i) => `
      <div class="rx-line">
        <div class="rx-num">${i + 1}</div>
        <div class="rx-body">
          <div class="rx-name">${escapeHtml(item.name)}</div>
          ${item.instructions ? `<div class="rx-instructions">${escapeHtml(item.instructions)}</div>` : ""}
        </div>
      </div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Ordonnance — ${escapeHtml(params.patientName)}</title>
  <style>
    @page { size: A4; margin: 2.2cm 2cm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; font-size: 13px; line-height: 1.65; }
    .page { max-width: 660px; margin: 0 auto; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #5B1112; margin-bottom: 26px; }
    .prac-name { font-size: 19px; font-weight: bold; color: #5B1112; letter-spacing: -0.01em; }
    .prac-sub { font-size: 11.5px; color: #666; margin-top: 3px; }
    .date-block { text-align: right; font-size: 12px; color: #555; }
    .date-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #999; }

    /* Patient card */
    .patient-bloc { background: #fdf7ee; border: 1px solid #e8d8bc; border-radius: 10px; padding: 13px 17px; margin-bottom: 26px; display: flex; justify-content: space-between; align-items: flex-start; }
    .patient-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 4px; }
    .patient-name { font-size: 16px; font-weight: bold; color: #1a1a1a; }

    /* Diagnosis */
    .diag-bloc { border-left: 3px solid #5B1112; padding: 8px 14px; margin-bottom: 22px; background: #fafaf8; border-radius: 0 8px 8px 0; }
    .diag-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #999; margin-bottom: 3px; }
    .diag-text { font-size: 13px; font-style: italic; color: #333; }

    /* Rx symbol */
    .rx-symbol { font-size: 30px; font-style: italic; color: #5B1112; margin-bottom: 16px; line-height: 1; }

    /* Prescription lines */
    .rx-line { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dotted #ddd; }
    .rx-line:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
    .rx-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid #5B1112; color: #5B1112; font-size: 11px; font-weight: bold; display: flex; align-items: center; justify-content: center; margin-top: 2px; font-family: Arial, sans-serif; }
    .rx-body { flex: 1; }
    .rx-name { font-weight: bold; font-size: 14px; }
    .rx-instructions { font-size: 12px; color: #555; margin-top: 3px; padding-left: 10px; border-left: 2px solid #e2c9a0; }

    /* Summary */
    .summary-bloc { background: #f8f8f6; border-radius: 8px; padding: 12px 16px; margin-top: 22px; }
    .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.07em; color: #999; margin-bottom: 5px; }
    .summary-text { font-size: 12.5px; color: #444; }

    /* Signature */
    .footer { margin-top: 50px; display: flex; justify-content: flex-end; }
    .sig-box { width: 210px; text-align: center; }
    .sig-area { height: 72px; border-bottom: 1px solid #333; margin-bottom: 8px; }
    .sig-label { font-size: 11px; color: #888; font-family: Arial, sans-serif; }
    .watermark { margin-top: 32px; text-align: center; font-size: 9.5px; color: #bbb; font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="prac-name">${escapeHtml(params.practitionerName)}</div>
        <div class="prac-sub">Médecin — Espace praticien Melanis</div>
      </div>
      <div class="date-block">
        <div class="date-label">Date</div>
        <div>${escapeHtml(params.appointmentDate)}</div>
      </div>
    </div>

    <div class="patient-bloc">
      <div>
        <div class="patient-label">Patient</div>
        <div class="patient-name">${escapeHtml(params.patientName)}</div>
      </div>
    </div>

    ${params.diagnosis ? `<div class="diag-bloc"><div class="diag-label">Diagnostic</div><div class="diag-text">${escapeHtml(params.diagnosis)}</div></div>` : ""}

    <div class="rx-symbol">℞</div>

    <div>${medicationLines}</div>

    ${params.summary ? `<div class="summary-bloc"><div class="summary-label">Note clinique</div><div class="summary-text">${escapeHtml(params.summary)}</div></div>` : ""}

    <div class="footer">
      <div class="sig-box">
        <div class="sig-area"></div>
        <div class="sig-label">Signature &amp; Cachet</div>
      </div>
    </div>

    <div class="watermark">Généré via Melanis · Document à valeur médicale</div>
  </div>
</body>
</html>`;
}

function printOrdonnance(params: {
  patientName: string;
  practitionerName: string;
  appointmentDate: string;
  diagnosis?: string;
  summary?: string;
  items: PrescriptionItem[];
}) {
  const popup = window.open("", "_blank", "width=980,height=760");
  if (!popup) return false;

  popup.document.open();
  popup.document.write(createPrintableHtml(params));
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}

function getDraftStorageKey(appointmentId: string) {
  return `melanis_practitioner_consult_draft:${appointmentId}`;
}

function getFavoritesStorageKey(practitionerId: string) {
  return `melanis_practitioner_favorites:${practitionerId}`;
}

function loadDraft(appointmentId: string) {
  return readStorageJson<ConsultationDraft | null>(
    getDraftStorageKey(appointmentId),
    null,
  );
}

function saveDraft(appointmentId: string, draft: ConsultationDraft) {
  writeStorageJson(getDraftStorageKey(appointmentId), draft);
}

function clearDraft(appointmentId: string) {
  removeStorageValue(getDraftStorageKey(appointmentId));
}

function buildDraftPayload(params: {
  diagnosis: string;
  clinicalSummary: string;
  prescriptionRows: PrescriptionDraftRow[];
  measurementText: string;
  followUpCadence: ScreeningCadence | "";
  followUpDueAt: string;
  updatedAt?: number;
}): ConsultationDraft {
  return {
    diagnosis: params.diagnosis,
    clinicalSummary: params.clinicalSummary,
    prescriptionRows: params.prescriptionRows,
    measurementText: params.measurementText,
    followUpCadence: params.followUpCadence,
    followUpDueAt: params.followUpDueAt,
    updatedAt: params.updatedAt ?? Date.now(),
  };
}

function getDraftSignature(draft: ConsultationDraft) {
  return JSON.stringify({
    diagnosis: draft.diagnosis,
    clinicalSummary: draft.clinicalSummary,
    prescriptionRows: draft.prescriptionRows,
    measurementText: draft.measurementText,
    followUpCadence: draft.followUpCadence,
    followUpDueAt: draft.followUpDueAt,
  });
}

function loadFavorites(practitionerId: string) {
  return readStorageJson<FavoritePrescriptionItem[]>(
    getFavoritesStorageKey(practitionerId),
    [],
  );
}

function saveFavorites(
  practitionerId: string,
  favorites: FavoritePrescriptionItem[],
) {
  writeStorageJson(getFavoritesStorageKey(practitionerId), favorites);
}

function DraftBadge({ status }: { status: DraftStatus }) {
  if (status === "idle") return null;

  const config = {
    restored: {
      text: "Brouillon restauré",
      cls: "border-amber-200 bg-amber-50 text-amber-700",
    },
    saved: {
      text: "Brouillon sauvegardé",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    published: {
      text: "Publication effectuée",
      cls: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    favorite: {
      text: "Favori enregistré",
      cls: "border-sky-200 bg-sky-50 text-sky-700",
    },
  }[status];

  return (
    <span
      className={`rounded-full border px-3 py-1 text-[11px] font-medium ${config.cls}`}
    >
      {config.text}
    </span>
  );
}

function SectionHeader({
  overline,
  title,
  description,
}: {
  overline: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#5B1112]/60">
        {overline}
      </p>
      <h2 className="mt-0.5 text-lg font-semibold text-[#111214]">{title}</h2>
      <p className="mt-0.5 text-xs text-[rgba(17,18,20,0.50)]">{description}</p>
    </div>
  );
}

export default function PractitionerAppointmentDetailScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const params = useParams();

  const [appointment, setAppointment] = useState<AppointmentRecord | null>(
    null,
  );
  const [submission, setSubmission] =
    useState<PreConsultSubmissionRecord | null>(null);
  const [documents, setDocuments] = useState<ClinicalDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [prescriptionRows, setPrescriptionRows] = useState<
    PrescriptionDraftRow[]
  >([createDraftRow()]);
  const [measurementText, setMeasurementText] = useState("");
  const [followUpCadence, setFollowUpCadence] = useState<ScreeningCadence | "">(
    "",
  );
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [favorites, setFavorites] = useState<FavoritePrescriptionItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [draftSnapshot, setDraftSnapshot] = useState<DraftSnapshot | null>(null);
  const [availablePrograms, setAvailablePrograms] = useState<EducationProgramRecord[]>([]);
  const [assignedPrograms, setAssignedPrograms] = useState<EducationProgramRecord[]>([]);
  const [preventionCurrent, setPreventionCurrent] =
    useState<PreventionCurrentRecord | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [programCadence, setProgramCadence] = useState<ScreeningCadence | "">("");
  const [programDueAt, setProgramDueAt] = useState("");
  const [isAssigningProgram, setIsAssigningProgram] = useState(false);
  const [selectedProgramDetail, setSelectedProgramDetail] =
    useState<EducationProgramDetailRecord | null>(null);
  const [screeningReminders, setScreeningReminders] = useState<ScreeningReminder[]>([]);
  const [educationReplyBody, setEducationReplyBody] = useState("");
  const [educationReplyNeedsAppointment, setEducationReplyNeedsAppointment] =
    useState(false);
  const [isSendingEducationReply, setIsSendingEducationReply] = useState(false);
  const [screeningType, setScreeningType] = useState("Suivi dermatologique");
  const [screeningCadence, setScreeningCadence] =
    useState<ScreeningCadence>("annual");
  const [screeningDueAt, setScreeningDueAt] = useState("");
  const [isSavingScreeningReminder, setIsSavingScreeningReminder] =
    useState(false);
  const [activeTab, setActiveTab] = useState<"clinique" | "contexte" | "suivi">("clinique");

  const appointmentId = params.appointmentId ?? "";
  const practitionerId = auth.user?.practitionerId ?? "";

  useEffect(() => {
    if (!practitionerId) {
      setFavorites([]);
      return;
    }
    setFavorites(loadFavorites(practitionerId));
  }, [practitionerId]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (draftStatus === "idle") return;
    const timer = window.setTimeout(() => setDraftStatus("idle"), 2200);
    return () => window.clearTimeout(timer);
  }, [draftStatus]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setIsHydrated(false);

        const found =
          await auth.appointmentAdapter.getAppointmentById(appointmentId);

        if (!found) {
          if (!cancelled) {
            setError("Rendez-vous introuvable.");
            setAppointment(null);
          }
          return;
        }

        if (
          auth.user?.practitionerId &&
          found.practitionerId !== auth.user.practitionerId
        ) {
          if (!cancelled) {
            setError("Acces refuse a ce rendez-vous.");
            setAppointment(null);
          }
          return;
        }

        const [
          foundSubmission,
          foundDocuments,
          availableProgramItems,
          assignedProgramItems,
          preventionPayload,
        ] = auth.user
          ? await Promise.all([
              found.preConsultSubmission
                ? Promise.resolve(found.preConsultSubmission)
                : auth.accountAdapter.getPreConsultSubmissionForAppointment(
                    auth.user.id,
                    appointmentId,
                  ),
              auth.accountAdapter.listClinicalDocuments(
                auth.user.id,
                found.profileId,
                appointmentId,
              ),
              typeof auth.accountAdapter.listPractitionerEducationPrograms ===
              "function"
                ? auth.accountAdapter.listPractitionerEducationPrograms(auth.user.id)
                : Promise.resolve([]),
              typeof auth.accountAdapter.listProfileEducationProgramsForPractitioner ===
              "function"
                ? auth.accountAdapter.listProfileEducationProgramsForPractitioner(
                    auth.user.id,
                    found.profileId,
                  )
                : Promise.resolve([]),
              typeof auth.accountAdapter.getProfilePreventionCurrentForPractitioner ===
              "function"
                ? auth.accountAdapter.getProfilePreventionCurrentForPractitioner(
                    auth.user.id,
                    found.profileId,
                  )
                : Promise.resolve(null),
            ])
          : [null, [], [], [], null];

        if (!cancelled) {
          const latestPrescription = foundDocuments.find(
            (document) => document.kind === "prescription",
          );
          const restoredDraft = loadDraft(appointmentId);

          setAppointment(found);
          setSubmission(foundSubmission);
          setDocuments(foundDocuments);
          setAvailablePrograms(availableProgramItems);
          setAssignedPrograms(assignedProgramItems);
          setPreventionCurrent(preventionPayload);
          setSelectedProgramId(
            assignedProgramItems[0]?.id ??
              availableProgramItems[0]?.id ??
              "",
          );
          setProgramCadence(
            (assignedProgramItems[0]?.enrollment?.checkInCadence as ScreeningCadence | "") ??
              "",
          );
          setProgramDueAt(
            toDateInputValue(assignedProgramItems[0]?.enrollment?.nextCheckInDueAt),
          );
          setError(null);

          if (restoredDraft) {
            const normalizedRows =
              normalizeDraftRows(restoredDraft.prescriptionRows).length > 0
                ? normalizeDraftRows(restoredDraft.prescriptionRows)
                : [createDraftRow()];
            const restoredPayload = buildDraftPayload({
              diagnosis: restoredDraft.diagnosis,
              clinicalSummary: restoredDraft.clinicalSummary,
              prescriptionRows: normalizedRows,
              measurementText: restoredDraft.measurementText,
              followUpCadence: restoredDraft.followUpCadence,
              followUpDueAt: restoredDraft.followUpDueAt,
              updatedAt: restoredDraft.updatedAt,
            });
            setDiagnosis(restoredDraft.diagnosis);
            setClinicalSummary(restoredDraft.clinicalSummary);
            setPrescriptionRows(normalizedRows);
            setMeasurementText(restoredDraft.measurementText);
            setFollowUpCadence(restoredDraft.followUpCadence);
            setFollowUpDueAt(restoredDraft.followUpDueAt);
            setDraftSnapshot({
              signature: getDraftSignature(restoredPayload),
              storage: "present",
            });
            setDraftStatus("restored");
          } else {
            const nextPrescriptionRows =
              toDraftRowsFromDocument(latestPrescription).length > 0
                ? toDraftRowsFromDocument(latestPrescription)
                : [createDraftRow()];
            const nextMeasurementText = toMeasurementText(found);
            const nextFollowUpCadence = found.followUpCadence ?? "";
            const nextFollowUpDueAt = toDateInputValue(found.followUpDueAt);
            const baselinePayload = buildDraftPayload({
              diagnosis: found.diagnosis ?? "",
              clinicalSummary: found.clinicalSummary ?? "",
              prescriptionRows: nextPrescriptionRows,
              measurementText: nextMeasurementText,
              followUpCadence: nextFollowUpCadence,
              followUpDueAt: nextFollowUpDueAt,
            });
            setDiagnosis(found.diagnosis ?? "");
            setClinicalSummary(found.clinicalSummary ?? "");
            setPrescriptionRows(nextPrescriptionRows);
            setMeasurementText(nextMeasurementText);
            setFollowUpCadence(nextFollowUpCadence);
            setFollowUpDueAt(nextFollowUpDueAt);
            setDraftSnapshot({
              signature: getDraftSignature(baselinePayload),
              storage: "cleared",
            });
          }

          setIsHydrated(true);
        }
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger ce rendez-vous.",
          );
          setAppointment(null);
          setSubmission(null);
          setDocuments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    appointmentId,
    auth.accountAdapter,
    auth.appointmentAdapter,
    auth.user,
    auth.user?.practitionerId,
  ]);

  useEffect(() => {
    const currentUser = auth.user;
    const profileId = appointment?.profileId;
    if (!currentUser || !profileId) return;
    let cancelled = false;

    const run = async () => {
      try {
        const [programDetail, reminders] = await Promise.all([
          selectedProgramId &&
          typeof auth.accountAdapter.getEducationProgramForPractitioner ===
            "function"
            ? auth.accountAdapter.getEducationProgramForPractitioner(
                currentUser.id,
                profileId,
                selectedProgramId,
              )
            : Promise.resolve(null),
          typeof auth.accountAdapter.listScreeningRemindersForPractitioner ===
            "function"
            ? auth.accountAdapter.listScreeningRemindersForPractitioner(
                currentUser.id,
                profileId,
              )
            : Promise.resolve([]),
        ]);

        if (cancelled) return;
        setSelectedProgramDetail(programDetail);
        setScreeningReminders(reminders);
        if (!screeningDueAt && reminders[0]) {
          setScreeningType(reminders[0].screeningType);
          setScreeningCadence(reminders[0].cadence);
          setScreeningDueAt(toDateInputValue(reminders[0].nextDueAt));
        }
      } catch {
        if (!cancelled) {
          setSelectedProgramDetail(null);
          setScreeningReminders([]);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    appointment?.profileId,
    auth.accountAdapter,
    auth.user,
    screeningDueAt,
    selectedProgramId,
  ]);

  useEffect(() => {
    if (!appointmentId || !isHydrated) return;

    const timer = window.setTimeout(() => {
      const payload = buildDraftPayload({
        diagnosis,
        clinicalSummary,
        prescriptionRows,
        measurementText,
        followUpCadence,
        followUpDueAt,
      });
      const signature = getDraftSignature(payload);
      if (draftSnapshot?.signature === signature) {
        return;
      }
      saveDraft(appointmentId, {
        ...payload,
        updatedAt: Date.now(),
      });
      setDraftSnapshot({
        signature,
        storage: "present",
      });
      setDraftStatus("saved");
    }, 450);

    return () => window.clearTimeout(timer);
  }, [
    appointmentId,
    clinicalSummary,
    diagnosis,
    followUpCadence,
    followUpDueAt,
    isHydrated,
    measurementText,
    prescriptionRows,
    draftSnapshot,
  ]);

  const handleLogout = async () => {
    await auth.logout();
    navigate("/patient-flow/auth/connexion", { replace: true });
  };

  const fullName = auth.user?.fullName ?? "Praticien";
  const nextStatus = appointment
    ? NEXT_STATUS_BY_CURRENT[appointment.status]
    : null;
  const preConsultRows = useMemo(
    () =>
      toDisplayRows(
        submission?.questionnaireData ?? appointment?.preConsultData,
      ),
    [appointment?.preConsultData, submission?.questionnaireData],
  );
  const photoPreviews = useMemo(
    () => toPhotoPreviews(submission, appointment),
    [appointment, submission],
  );
  const previousDocuments = useMemo(
    () =>
      [...documents]
        .sort((first, second) =>
          (second.publishedAt ?? second.createdAt).localeCompare(
            first.publishedAt ?? first.createdAt,
          ),
        )
        .slice(0, 4),
    [documents],
  );
  const latestPublishedPrescription = useMemo(
    () => documents.find((document) => document.kind === "prescription"),
    [documents],
  );
  const parsedPrescriptionItems = useMemo(
    () =>
      prescriptionRows
        .map((row) => rowToPrescriptionItem(row))
        .filter((item): item is PrescriptionItem => item !== null),
    [prescriptionRows],
  );
  const hasPublishableContent =
    diagnosis.trim().length > 0 ||
    clinicalSummary.trim().length > 0 ||
    parsedPrescriptionItems.length > 0 ||
    measurementText.trim().length > 0 ||
    Boolean(followUpCadence) ||
    Boolean(followUpDueAt);
  const canPublishOutcome =
    (appointment?.status === "in_consultation" ||
      appointment?.status === "completed") &&
    hasPublishableContent;
  const canPrint =
    parsedPrescriptionItems.length > 0 ||
    Boolean(latestPublishedPrescription?.prescriptionItems.length);

  const addRow = (type: PrescriptionDraftRowType) => {
    setPrescriptionRows((prev) => [...prev, createDraftRow({ type })]);
  };

  const updateRow = (
    rowId: string,
    patch: Partial<Omit<PrescriptionDraftRow, "id">>,
  ) => {
    setPrescriptionRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row)),
    );
  };

  const duplicateRow = (rowId: string) => {
    setPrescriptionRows((prev) => {
      const target = prev.find((row) => row.id === rowId);
      if (!target) return prev;
      return [...prev, createDraftRow(target)];
    });
  };

  const removeRow = (rowId: string) => {
    setPrescriptionRows((prev) => {
      if (prev.length === 1) return [createDraftRow()];
      return prev.filter((row) => row.id !== rowId);
    });
  };

  const applySnippet = (rowId: string, snippet: string) => {
    setPrescriptionRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const nextInstructions = row.instructions.trim().length
          ? `${row.instructions.trim()} · ${snippet}`
          : snippet;
        return { ...row, instructions: nextInstructions };
      }),
    );
  };

  const applyTemplate = (template: PrescriptionTemplate) => {
    setPrescriptionRows((prev) => [
      ...prev,
      ...template.rows.map((row) => createDraftRow(row)),
    ]);
    if (!diagnosis.trim() && template.diagnosisHint) {
      setDiagnosis(template.diagnosisHint);
    }
    if (!clinicalSummary.trim() && template.summaryHint) {
      setClinicalSummary(template.summaryHint);
    }
    setFeedback(`Template ajoute : ${template.label}.`);
  };

  const saveFavoriteFromRow = (row: PrescriptionDraftRow) => {
    if (!practitionerId) return;
    const item = rowToPrescriptionItem(row);
    if (!item) {
      setFeedback(
        "Remplissez produit et consigne avant d'enregistrer un favori.",
      );
      return;
    }

    setFavorites((prev) => {
      const exists = prev.some(
        (favorite) =>
          favorite.type === row.type &&
          favorite.name === item.name &&
          favorite.instructions === item.instructions,
      );
      if (exists) return prev;
      const next = [
        ...prev,
        {
          id: `fav_${Math.random().toString(36).slice(2, 10)}`,
          type: row.type,
          name: item.name,
          instructions: item.instructions,
        },
      ];
      saveFavorites(practitionerId, next);
      return next;
    });
    setDraftStatus("favorite");
  };

  const insertFavorite = (favorite: FavoritePrescriptionItem) => {
    setPrescriptionRows((prev) => [...prev, createDraftRow(favorite)]);
  };

  const removeFavorite = (favoriteId: string) => {
    if (!practitionerId) return;
    setFavorites((prev) => {
      const next = prev.filter((favorite) => favorite.id !== favoriteId);
      saveFavorites(practitionerId, next);
      return next;
    });
  };

  const resetDraft = () => {
    if (!appointment) return;
    const latestPrescription = previousDocuments.find(
      (document) => document.kind === "prescription",
    );
    const nextDiagnosis = appointment.diagnosis ?? "";
    const nextClinicalSummary = appointment.clinicalSummary ?? "";
    const nextPrescriptionRows =
      toDraftRowsFromDocument(latestPrescription).length > 0
        ? toDraftRowsFromDocument(latestPrescription)
        : [createDraftRow()];
    const nextMeasurementText = toMeasurementText(appointment);
    const nextFollowUpCadence = appointment.followUpCadence ?? "";
    const nextFollowUpDueAt = toDateInputValue(appointment.followUpDueAt);
    const clearedPayload = buildDraftPayload({
      diagnosis: nextDiagnosis,
      clinicalSummary: nextClinicalSummary,
      prescriptionRows: nextPrescriptionRows,
      measurementText: nextMeasurementText,
      followUpCadence: nextFollowUpCadence,
      followUpDueAt: nextFollowUpDueAt,
    });
    setDiagnosis(nextDiagnosis);
    setClinicalSummary(nextClinicalSummary);
    setPrescriptionRows(nextPrescriptionRows);
    setMeasurementText(nextMeasurementText);
    setFollowUpCadence(nextFollowUpCadence);
    setFollowUpDueAt(nextFollowUpDueAt);
    clearDraft(appointmentId);
    setDraftSnapshot({
      signature: getDraftSignature(clearedPayload),
      storage: "cleared",
    });
    setFeedback("Brouillon local effacé.");
  };

  const handleTransition = async () => {
    if (!appointment || !nextStatus || !auth.user) return;

    try {
      setIsTransitioning(true);
      const updated = await auth.appointmentAdapter.transitionAppointmentStatus(
        {
          appointmentId: appointment.id,
          actorUserId: auth.user.id,
          toStatus: nextStatus,
        },
      );
      setAppointment(updated);
      setFeedback(
        `Statut mis a jour : ${appointmentStatusLabel(updated.status)}.`,
      );
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de mettre a jour le statut.",
      );
    } finally {
      setIsTransitioning(false);
    }
  };

  const handlePrint = () => {
    if (!appointment) return;
    const items =
      parsedPrescriptionItems.length > 0
        ? parsedPrescriptionItems
        : (latestPublishedPrescription?.prescriptionItems ?? []);
    if (items.length === 0) return;

    const success = printOrdonnance({
      patientName: appointment.patientLabel,
      practitionerName: appointment.practitionerName,
      appointmentDate: formatDateTime(appointment.scheduledFor),
      diagnosis:
        diagnosis.trim() ||
        appointment.diagnosis ||
        latestPublishedPrescription?.summary,
      summary:
        clinicalSummary.trim() || appointment.clinicalSummary || undefined,
      items,
    });

    if (!success) {
      setFeedback("Impossible d'ouvrir la fenetre d'impression.");
    }
  };

  const handlePublishOutcome = async () => {
    if (!appointment || !auth.user) return;

    try {
      setIsPublishing(true);
      setFeedback(null);
      const result = await auth.appointmentAdapter.createClinicalOutcome({
        appointmentId: appointment.id,
        actorUserId: auth.user.id,
        diagnosis: diagnosis.trim() || undefined,
        clinicalSummary: clinicalSummary.trim() || undefined,
        prescriptionItems: parsedPrescriptionItems,
        measurements: parseMeasurements(measurementText),
        followUpCadence: followUpCadence || undefined,
        followUpDueAt: followUpDueAt || undefined,
        notifyPatient: true,
      });

      setAppointment(result.appointment);
      setDocuments((prev) => {
        const nextIds = new Set(prev.map((document) => document.id));
        return [
          ...result.documents.filter((document) => !nextIds.has(document.id)),
          ...prev,
        ];
      });
      setFollowUpCadence(result.appointment.followUpCadence ?? "");
      setFollowUpDueAt(toDateInputValue(result.appointment.followUpDueAt));
      setMeasurementText(toMeasurementText(result.appointment));
      clearDraft(appointment.id);
      setDraftSnapshot({
        signature: getDraftSignature(
          buildDraftPayload({
            diagnosis,
            clinicalSummary,
            prescriptionRows,
            measurementText: toMeasurementText(result.appointment),
            followUpCadence: result.appointment.followUpCadence ?? "",
            followUpDueAt: toDateInputValue(result.appointment.followUpDueAt),
          }),
        ),
        storage: "cleared",
      });
      setDraftStatus("published");
      setFeedback("Compte-rendu clinique publié et visible côté patient.");
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de publier le compte-rendu clinique.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAssignProgram = async () => {
    if (!appointment || !auth.user || !selectedProgramId) return;
    try {
      setIsAssigningProgram(true);
      const detail = await auth.accountAdapter.assignEducationProgram({
        actorUserId: auth.user.id,
        profileId: appointment.profileId,
        programId: selectedProgramId,
        checkInCadence: programCadence || undefined,
        nextCheckInDueAt: programDueAt || undefined,
      });
      const refreshedAssigned =
        typeof auth.accountAdapter.listProfileEducationProgramsForPractitioner ===
        "function"
          ? await auth.accountAdapter.listProfileEducationProgramsForPractitioner(
              auth.user.id,
              appointment.profileId,
            )
          : [];
      setAssignedPrograms(refreshedAssigned);
      setSelectedProgramId(detail.program.id);
      setFeedback(`Programme assigné : ${detail.program.title}.`);
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible d'assigner le programme.",
      );
    } finally {
      setIsAssigningProgram(false);
    }
  };

  const handleSendEducationReply = async () => {
    if (!appointment || !auth.user || !selectedProgramId || !educationReplyBody.trim()) {
      return;
    }
    if (
      typeof auth.accountAdapter.createEducationThreadMessageForPractitioner !==
      "function"
    ) {
      setFeedback("Messagerie éducative indisponible.");
      return;
    }
    try {
      setIsSendingEducationReply(true);
      const next = await auth.accountAdapter.createEducationThreadMessageForPractitioner({
        actorUserId: auth.user.id,
        profileId: appointment.profileId,
        programId: selectedProgramId,
        body: educationReplyBody.trim(),
        requestAppointment: educationReplyNeedsAppointment,
      });
      setSelectedProgramDetail(next);
      setEducationReplyBody("");
      setEducationReplyNeedsAppointment(false);
      setFeedback("Réponse envoyée dans le programme patient.");
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible d'envoyer la réponse programme.",
      );
    } finally {
      setIsSendingEducationReply(false);
    }
  };

  const handleSaveScreeningReminder = async () => {
    if (!appointment || !auth.user || !screeningType.trim() || !screeningDueAt) {
      return;
    }
    if (
      typeof auth.accountAdapter.createScreeningReminderForPractitioner !==
      "function"
    ) {
      setFeedback("Création de rappel indisponible.");
      return;
    }
    try {
      setIsSavingScreeningReminder(true);
      const reminder = await auth.accountAdapter.createScreeningReminderForPractitioner({
        actorUserId: auth.user.id,
        profileId: appointment.profileId,
        screeningType: screeningType.trim(),
        cadence: screeningCadence,
        nextDueAt: screeningDueAt,
      });
      setScreeningReminders((prev) => {
        const exists = prev.some((item) => item.id === reminder.id);
        const next = exists
          ? prev.map((item) => (item.id === reminder.id ? reminder : item))
          : [...prev, reminder];
        return next.sort((first, second) =>
          first.nextDueAt.localeCompare(second.nextDueAt),
        );
      });
      setFeedback("Rappel de dépistage enregistré.");
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible d'enregistrer le rappel.",
      );
    } finally {
      setIsSavingScreeningReminder(false);
    }
  };

  const updateExistingReminder = async (
    reminder: ScreeningReminder,
    patch: Partial<Pick<ScreeningReminder, "status" | "cadence" | "nextDueAt">>,
  ) => {
    if (!appointment || !auth.user) return;
    if (
      typeof auth.accountAdapter.updateScreeningReminderForPractitioner !==
      "function"
    ) {
      setFeedback("Modification de rappel indisponible.");
      return;
    }
    try {
      const updated = await auth.accountAdapter.updateScreeningReminderForPractitioner({
        actorUserId: auth.user.id,
        profileId: appointment.profileId,
        reminderId: reminder.id,
        patch,
      });
      setScreeningReminders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (adapterError) {
      setFeedback(
        adapterError instanceof Error
          ? adapterError.message
          : "Impossible de modifier le rappel.",
      );
    }
  };

  const TAB_ITEMS: TabItem<"clinique" | "contexte" | "suivi">[] = [
    { value: "clinique", label: "Clinique" },
    { value: "contexte", label: "Contexte patient" },
    { value: "suivi", label: "Suivi & Prévention" },
  ];

  return (
    <PractitionerDashboardLayout fullName={fullName} onLogout={handleLogout}>
      {/* Floating toast */}
      {feedback ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-[#111214] px-5 py-3 text-sm font-medium text-white shadow-2xl shadow-black/20">
            {feedback}
          </div>
        </div>
      ) : null}

      <div className="space-y-5 py-2 lg:py-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/patient-flow/practitioner/appointments"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#111214]/10 bg-white text-[#111214]/58 shadow-sm transition hover:bg-[#FEF0D5] hover:text-[#111214]"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold text-[#111214]">
                {appointment ? appointment.patientLabel : "Consultation praticien"}
              </h1>
              <p className="mt-0.5 text-sm text-[#111214]/55">
                {appointment
                  ? formatDateTime(appointment.scheduledFor)
                  : "Chargement..."}
              </p>
            </div>
          </div>
          <DraftBadge status={draftStatus} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={24} className="animate-spin text-[#5B1112]/45" />
          </div>
        ) : error ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#E9B3B3] bg-[#FFF2F2] px-4 py-3 text-sm text-[#8A2E2E]">
            <AlertTriangle size={15} />
            {error}
          </div>
        ) : appointment ? (
          <>
            {/* Patient hero card — status action front and center */}
            <section className="overflow-hidden rounded-[2rem] bg-[#5B1112] p-6 text-white shadow-[0_18px_60px_rgba(91,17,18,0.24)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      Rendez-vous
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusToneOnDark(appointment.status)}`}
                    >
                      {appointmentStatusLabel(appointment.status)}
                    </span>
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold">
                    {appointment.patientLabel}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock3 size={13} />
                      {formatDateTime(appointment.scheduledFor)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      {appointment.appointmentType === "video" ? (
                        <><Video size={13} />Vidéo</>
                      ) : (
                        <><MapPin size={13} />{appointment.practitionerLocation ?? "Présentiel"}</>
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Stethoscope size={13} />
                      {appointment.practitionerName}
                    </span>
                  </div>
                  {appointment.followUpDueAt ? (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm text-white/78">
                      <CalendarCheck2 size={14} />
                      Suivi prévu le {formatDate(appointment.followUpDueAt)}
                    </div>
                  ) : null}
                </div>

                {/* Status transition — primary CTA in the hero */}
                <div className="flex shrink-0 flex-col items-end gap-3">
                  {nextStatus ? (
                    <button
                      type="button"
                      onClick={() => void handleTransition()}
                      disabled={isTransitioning}
                      className="inline-flex items-center gap-2 rounded-[1.25rem] bg-white px-5 py-3 text-sm font-semibold text-[#5B1112] shadow-lg shadow-black/10 transition hover:bg-[#FEF0D5] disabled:opacity-60"
                    >
                      {isTransitioning ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : null}
                      {nextStatusActionLabel(nextStatus)}
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-2 rounded-[1.25rem] bg-emerald-400/15 px-5 py-3 text-sm font-semibold text-emerald-100">
                      <CheckCircle2 size={14} />
                      Consultation terminée
                    </div>
                  )}
                  {appointment.appointmentType === "video" && appointment.status !== "completed" ? (
                    <Link
                      to={`/patient-flow/practitioner/appointments/${appointment.id}/video`}
                      className="inline-flex items-center gap-2 rounded-[1.25rem] bg-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/25"
                    >
                      <Video size={13} />
                      Rejoindre la consultation vidéo
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Main grid */}
            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              {/* Left: tabbed content */}
              <div className="space-y-4">
                <Tabs
                  label="Navigation consultation"
                  items={TAB_ITEMS}
                  value={activeTab}
                  onChange={setActiveTab}
                />

                {/* ── TAB: CLINIQUE ── */}
                {activeTab === "clinique" && (
                  <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
                    <SectionHeader
                      overline="Composer clinique"
                      title="Diagnostic et ordonnance"
                      description="Le but est d'aller vite : suggestions, templates, favoris et lignes éditables."
                    />

                    <div className="mt-5 space-y-5">
                      {/* Diagnosis */}
                      <div>
                        <label
                          htmlFor="diagnosis-input"
                          className="text-sm font-medium text-[#111214]"
                        >
                          Diagnostic principal
                        </label>
                        <input
                          id="diagnosis-input"
                          value={diagnosis}
                          onChange={(event) => setDiagnosis(event.currentTarget.value)}
                          placeholder="Ex: Acné inflammatoire modérée"
                          className="mt-2 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                        />
                        <div className="mt-3 flex flex-wrap gap-2">
                          {DIAGNOSIS_SUGGESTIONS.map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => setDiagnosis(suggestion)}
                              className="rounded-full border border-[#111214]/12 bg-[#FCFCFC] px-3 py-1.5 text-[11px] font-medium text-[#111214]/62 transition hover:bg-[#FEF0D5]"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Templates */}
                      <div className="rounded-2xl border border-[#5B1112]/[0.07] bg-[#5B1112]/[0.025] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111214]">
                              Templates de consultation
                            </p>
                            <p className="mt-1 text-xs text-[#111214]/55">
                              Injectez un plan de traitement éditable en un clic.
                            </p>
                          </div>
                          <Sparkles size={16} className="text-[#5B1112]" />
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                          {PRESCRIPTION_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => applyTemplate(template)}
                              className="rounded-2xl border border-[rgba(17,18,20,0.08)] bg-white/80 p-3 text-left backdrop-blur-sm transition hover:border-[#5B1112]/25 hover:bg-[#FEF0D5]/50 hover:shadow-sm"
                            >
                              <p className="text-sm font-medium text-[#111214]">
                                {template.label}
                              </p>
                              <p className="mt-1 text-xs text-[#111214]/55">
                                {template.description}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Favorites */}
                      <div className="rounded-2xl border border-[#5B1112]/[0.07] bg-[#5B1112]/[0.025] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111214]">
                              Favoris praticien
                            </p>
                            <p className="mt-1 text-xs text-[#111214]/55">
                              Vos lignes récurrentes, stockées localement.
                            </p>
                          </div>
                          <Star size={16} className="text-[#5B1112]" />
                        </div>
                        {favorites.length === 0 ? (
                          <div className="mt-4 rounded-xl border border-dashed border-[#111214]/12 px-3 py-3 text-xs text-[#111214]/48">
                            Aucun favori pour l'instant. Enregistrez une ligne pour la réutiliser en un clic.
                          </div>
                        ) : (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {favorites.map((favorite) => (
                              <div
                                key={favorite.id}
                                className="inline-flex items-center gap-1 rounded-full border border-[#111214]/10 bg-white px-3 py-1.5"
                              >
                                <button
                                  type="button"
                                  onClick={() => insertFavorite(favorite)}
                                  className="text-[11px] font-medium text-[#111214]/72"
                                >
                                  {favorite.name}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeFavorite(favorite.id)}
                                  className="rounded-full p-0.5 text-[#111214]/38 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                                  aria-label={`Supprimer ${favorite.name}`}
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Prescription builder */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-[#111214]">
                              Constructeur d'ordonnance
                            </p>
                            <p className="mt-1 text-xs text-[#111214]/55">
                              Produits structurés, consignes rapides, duplication et favoris.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => addRow("medication")}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[rgba(17,18,20,0.65)] transition hover:border-[#5B1112]/20 hover:bg-[#FEF0D5] hover:text-[#5B1112]"
                            >
                              <Plus size={12} />
                              Médicament
                            </button>
                            <button
                              type="button"
                              onClick={() => addRow("care")}
                              className="inline-flex items-center gap-1 rounded-full border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[rgba(17,18,20,0.65)] transition hover:border-[#5B1112]/20 hover:bg-[#FEF0D5] hover:text-[#5B1112]"
                            >
                              <Plus size={12} />
                              Soin
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {prescriptionRows.map((row, index) => (
                            <div
                              key={row.id}
                              className="rounded-2xl border border-[rgba(17,18,20,0.08)] bg-white/80 p-4 backdrop-blur-sm transition-shadow hover:shadow-sm"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#5B1112]/8 text-[11px] font-semibold text-[#5B1112]">
                                    {index + 1}
                                  </span>
                                  <select
                                    aria-label={`Type de ligne ${index + 1}`}
                                    value={row.type}
                                    onChange={(event) =>
                                      updateRow(row.id, {
                                        type: event.currentTarget.value as PrescriptionDraftRowType,
                                      })
                                    }
                                    className="rounded-full border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[rgba(17,18,20,0.70)] outline-none transition hover:bg-white"
                                  >
                                    <option value="medication">Médicament</option>
                                    <option value="care">Soin</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => saveFavoriteFromRow(row)}
                                    className="rounded-full p-2 text-[#111214]/38 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                                    aria-label={`Enregistrer la ligne ${index + 1} en favori`}
                                  >
                                    <Star size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => duplicateRow(row.id)}
                                    className="rounded-full p-2 text-[#111214]/38 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                                    aria-label={`Dupliquer la ligne ${index + 1}`}
                                  >
                                    <Copy size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeRow(row.id)}
                                    className="rounded-full p-2 text-[#111214]/38 transition hover:bg-[#FEF0D5] hover:text-[#111214]"
                                    aria-label={`Supprimer la ligne ${index + 1}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-3">
                                <label className="block">
                                  <span className="text-xs font-medium text-[#111214]/68">
                                    Produit
                                  </span>
                                  <input
                                    aria-label={`Produit ligne ${index + 1}`}
                                    value={row.name}
                                    onChange={(event) =>
                                      updateRow(row.id, { name: event.currentTarget.value })
                                    }
                                    placeholder={
                                      row.type === "medication"
                                        ? "Ex: Adapalène gel"
                                        : "Ex: Nettoyant doux"
                                    }
                                    className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                                  />
                                </label>

                                <label className="block">
                                  <span className="text-xs font-medium text-[#111214]/68">
                                    Consigne
                                  </span>
                                  <textarea
                                    aria-label={`Consigne ligne ${index + 1}`}
                                    value={row.instructions}
                                    onChange={(event) =>
                                      updateRow(row.id, { instructions: event.currentTarget.value })
                                    }
                                    rows={2}
                                    placeholder="Ex: Le soir, fine couche sur les zones touchées pendant 30 jours"
                                    className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                                  />
                                </label>

                                <div className="flex flex-wrap gap-2">
                                  {INSTRUCTION_SNIPPETS.map((snippet) => (
                                    <button
                                      key={`${row.id}-${snippet}`}
                                      type="button"
                                      onClick={() => applySnippet(row.id, snippet)}
                                      className="rounded-full border border-[rgba(17,18,20,0.08)] bg-white/70 px-2.5 py-1 text-[10px] font-medium text-[rgba(17,18,20,0.55)] transition hover:border-[#5B1112]/20 hover:bg-[#FEF0D5] hover:text-[#5B1112]"
                                    >
                                      {snippet}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Clinical summary */}
                      <div>
                        <label
                          htmlFor="clinical-summary"
                          className="text-sm font-medium text-[#111214]"
                        >
                          Synthèse clinique
                        </label>
                        <textarea
                          id="clinical-summary"
                          value={clinicalSummary}
                          onChange={(event) => setClinicalSummary(event.currentTarget.value)}
                          rows={4}
                          placeholder="Note clinique rapide, conseils patient, plan de prise en charge."
                          className="mt-2 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                        />
                      </div>

                      {/* Measurements & follow-up accordion */}
                      <details className="overflow-hidden rounded-2xl border border-[rgba(17,18,20,0.08)] bg-white/50">
                        <summary className="flex cursor-pointer list-none select-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-[#111214] transition-colors hover:bg-white/60">
                          <span>Mesures et suivi</span>
                          <ChevronDown size={15} className="text-[rgba(17,18,20,0.38)]" />
                        </summary>
                        <div className="grid gap-4 border-t border-[rgba(17,18,20,0.06)] px-4 pb-4 pt-4">
                          <label className="block">
                            <span className="text-xs font-medium text-[#111214]/68">
                              Mesures / preuves
                            </span>
                            <textarea
                              aria-label="Mesures"
                              value={measurementText}
                              onChange={(event) => setMeasurementText(event.currentTarget.value)}
                              rows={3}
                              placeholder={"Hydratation | 62 | %\nSébum frontal | 4 | /5"}
                              className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                            />
                          </label>

                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-medium text-[#111214]/68">
                                Cadence de suivi
                              </span>
                              <select
                                value={followUpCadence}
                                onChange={(event) =>
                                  setFollowUpCadence(
                                    event.currentTarget.value as ScreeningCadence | "",
                                  )
                                }
                                className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                              >
                                <option value="">Pas de suivi planifié</option>
                                {CADENCE_OPTIONS.map((cadence) => (
                                  <option key={cadence} value={cadence}>
                                    {CADENCE_LABELS[cadence]}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-medium text-[#111214]/68">
                                Prochaine échéance
                              </span>
                              <input
                                type="date"
                                value={followUpDueAt}
                                onChange={(event) => setFollowUpDueAt(event.currentTarget.value)}
                                className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                              />
                            </label>
                          </div>
                        </div>
                      </details>
                    </div>
                  </section>
                )}

                {/* ── TAB: CONTEXTE PATIENT ── */}
                {activeTab === "contexte" && (
                  <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
                    <SectionHeader
                      overline="Contexte patient"
                      title="Pré-consultation"
                      description="Ce que le patient a déjà renseigné avant votre décision clinique."
                    />

                    {preConsultRows.length === 0 ? (
                      <div className="mt-4 rounded-xl border border-dashed border-[#111214]/12 px-3 py-3 text-sm text-[#111214]/48">
                        Aucune donnée de pré-consultation disponible.
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {preConsultRows.map((row) => (
                          <div
                            key={row.label}
                            className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4 backdrop-blur-sm"
                          >
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/38">
                              {row.label}
                            </p>
                            <p className="mt-2 text-sm text-[#111214]/78">{row.value}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {photoPreviews.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold text-[#111214]">Photos cliniques</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          {photoPreviews.map((photo) => (
                            <div
                              key={`${photo.name}-${photo.url}`}
                              className="overflow-hidden rounded-2xl border border-[#111214]/8 bg-[#FCFCFC]"
                            >
                              <img
                                src={photo.url}
                                alt={photo.name}
                                loading="lazy"
                                className="h-52 w-full object-cover"
                              />
                              <p className="px-3 py-2 text-xs text-[#111214]/54">{photo.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <p className="text-sm font-semibold text-[#111214]">Historique déjà publié</p>
                      {previousDocuments.length === 0 ? (
                        <div className="mt-3 rounded-xl border border-dashed border-[#111214]/12 px-3 py-3 text-sm text-[#111214]/48">
                          Aucun document clinique publié pour ce rendez-vous.
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {previousDocuments.map((document) => (
                            <div
                              key={document.id}
                              className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4 backdrop-blur-sm"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-[#111214]">
                                    {document.title}
                                  </p>
                                  <p className="mt-1 text-xs text-[#111214]/48">
                                    {document.summary || "Document clinique publié"}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-[#5B1112]/8 p-2 text-[#5B1112]">
                                  {document.kind === "prescription" ? (
                                    <Pill size={13} />
                                  ) : (
                                    <FileText size={13} />
                                  )}
                                </div>
                              </div>
                              <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#111214]/32">
                                {appointmentStatusLabel(appointment.status)} · v{document.version} ·{" "}
                                {formatDate(document.publishedAt ?? document.createdAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* ── TAB: SUIVI & PRÉVENTION ── */}
                {activeTab === "suivi" && (
                  <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
                    <SectionHeader
                      overline="P4 suivi"
                      title="Programme & prévention"
                      description="Reliez l'éducation thérapeutique et les signaux environnementaux au plan de soin."
                    />

                    <div className="mt-5 space-y-5">
                      {/* Active programs */}
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                          Programmes actifs
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {assignedPrograms.length === 0 ? (
                            <span className="text-sm text-[#111214]/52">Aucun programme assigné.</span>
                          ) : (
                            assignedPrograms.map((program) => (
                              <span
                                key={program.id}
                                className="rounded-full bg-[#FEF0D5] px-3 py-1.5 text-[11px] font-medium text-[#111214]/70"
                              >
                                {program.title} · {program.enrollment?.progressPercent ?? 0}%
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Assign program */}
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                          Assigner un programme
                        </p>
                        <div className="mt-3 space-y-3">
                          <select
                            value={selectedProgramId}
                            onChange={(event) => setSelectedProgramId(event.currentTarget.value)}
                            className="w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                          >
                            <option value="">Sélectionner un programme</option>
                            {availablePrograms.map((program) => (
                              <option key={program.id} value={program.id}>
                                {program.title}
                              </option>
                            ))}
                          </select>
                          <div className="grid gap-3 md:grid-cols-2">
                            <select
                              value={programCadence}
                              onChange={(event) =>
                                setProgramCadence(
                                  event.currentTarget.value as ScreeningCadence | "",
                                )
                              }
                              className="rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                            >
                              <option value="">Cadence check-in</option>
                              {CADENCE_OPTIONS.map((cadence) => (
                                <option key={cadence} value={cadence}>
                                  {CADENCE_LABELS[cadence]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={programDueAt}
                              onChange={(event) => setProgramDueAt(event.currentTarget.value)}
                              className="rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleAssignProgram()}
                            disabled={!selectedProgramId || isAssigningProgram}
                            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-[#5B1112]/15 bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
                          >
                            {isAssigningProgram ? "Assignation..." : "Assigner au patient"}
                          </button>
                        </div>
                      </div>

                      {/* Program messaging */}
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4">
                        <div className="flex items-center gap-2">
                          <MessageSquareText size={16} className="text-[#5B1112]" />
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                            Questions liées au programme
                          </p>
                        </div>
                        <p className="mt-2 text-sm font-medium text-[#111214]">
                          {selectedProgramDetail?.program.title ?? "Sélectionnez un programme assigné"}
                        </p>
                        <p className="mt-1 text-xs text-[#111214]/54">
                          Répondez ici aux questions d'application du programme. Si nécessaire,
                          signalez qu'un rendez-vous est préférable.
                        </p>

                        <div className="mt-4 space-y-3">
                          {selectedProgramDetail?.messages.length ? (
                            selectedProgramDetail.messages.map((message) => (
                              <div
                                key={message.id}
                                className={`rounded-[1rem] px-3 py-3 text-sm ${
                                  message.authorRole === "practitioner"
                                    ? "bg-[#111214] text-white"
                                    : "border border-[rgba(17,18,20,0.07)] bg-white"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <p
                                    className={`text-[11px] font-semibold ${
                                      message.authorRole === "practitioner"
                                        ? "text-white/82"
                                        : "text-[#111214]"
                                    }`}
                                  >
                                    {message.authorRole === "practitioner"
                                      ? "Praticien"
                                      : "Patient / accompagnant"}
                                  </p>
                                  <p
                                    className={`text-[10px] ${
                                      message.authorRole === "practitioner"
                                        ? "text-white/55"
                                        : "text-[#111214]/38"
                                    }`}
                                  >
                                    {new Date(message.createdAt).toLocaleString("fr-FR")}
                                  </p>
                                </div>
                                <p
                                  className={`mt-2 leading-6 ${
                                    message.authorRole === "practitioner"
                                      ? "text-white/76"
                                      : "text-[#111214]/66"
                                  }`}
                                >
                                  {message.body}
                                </p>
                                {message.meta.requestAppointment ? (
                                  <p
                                    className={`mt-2 text-[11px] ${
                                      message.authorRole === "practitioner"
                                        ? "text-white/60"
                                        : "text-[#5B1112]"
                                    }`}
                                  >
                                    Escalade rendez-vous suggérée.
                                  </p>
                                ) : null}
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[1rem] border border-dashed border-[rgba(17,18,20,0.10)] px-3 py-4 text-sm text-[#111214]/54">
                              Aucun échange pour ce programme pour le moment.
                            </div>
                          )}
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-[rgba(17,18,20,0.08)] bg-white p-3">
                          <textarea
                            value={educationReplyBody}
                            onChange={(event) => setEducationReplyBody(event.currentTarget.value)}
                            rows={3}
                            placeholder="Clarifiez la routine, les déclencheurs ou conseillez un rendez-vous si le cadre du programme ne suffit plus."
                            className="w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                          />
                          <label className="mt-3 flex items-center gap-2 text-xs text-[#111214]/58">
                            <input
                              type="checkbox"
                              checked={educationReplyNeedsAppointment}
                              onChange={(event) =>
                                setEducationReplyNeedsAppointment(event.currentTarget.checked)
                              }
                            />
                            Suggérer explicitement un rendez-vous.
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleSendEducationReply()}
                            disabled={
                              !selectedProgramId || !educationReplyBody.trim() || isSendingEducationReply
                            }
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
                          >
                            <Send size={14} />
                            {isSendingEducationReply ? "Envoi..." : "Répondre dans le programme"}
                          </button>
                        </div>
                      </div>

                      {/* Screening reminders */}
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4">
                        <div className="flex items-center gap-2">
                          <BellRing size={16} className="text-[#5B1112]" />
                          <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                            Rappels de dépistage
                          </p>
                        </div>
                        <p className="mt-2 text-sm text-[#111214]/60">
                          Planifiez, ajustez ou clôturez les rappels de suivi préventif pour ce patient.
                        </p>

                        <div className="mt-4 space-y-3">
                          {screeningReminders.length === 0 ? (
                            <div className="rounded-[1rem] border border-dashed border-[rgba(17,18,20,0.10)] px-3 py-4 text-sm text-[#111214]/54">
                              Aucun rappel configuré pour le moment.
                            </div>
                          ) : (
                            screeningReminders.map((reminder) => (
                              <div
                                key={reminder.id}
                                className="rounded-[1rem] border border-[rgba(17,18,20,0.07)] bg-white px-3 py-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-[#111214]">
                                      {reminder.screeningType}
                                    </p>
                                    <p className="mt-1 text-xs text-[#111214]/48">
                                      Échéance :{" "}
                                      {new Date(reminder.nextDueAt).toLocaleDateString("fr-FR")}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void updateExistingReminder(reminder, {
                                        status:
                                          reminder.status === "completed" ? "active" : "completed",
                                      })
                                    }
                                    className="rounded-full border border-[rgba(17,18,20,0.10)] px-3 py-1.5 text-[11px] font-medium text-[#111214]/64"
                                  >
                                    {reminder.status === "completed" ? "Réactiver" : "Marquer fait"}
                                  </button>
                                </div>
                                <select
                                  value={reminder.cadence}
                                  onChange={(event) =>
                                    void updateExistingReminder(reminder, {
                                      cadence: event.currentTarget.value as ScreeningCadence,
                                    })
                                  }
                                  className="mt-3 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2 text-sm text-[#111214]"
                                >
                                  {CADENCE_OPTIONS.map((cadence) => (
                                    <option key={cadence} value={cadence}>
                                      {CADENCE_LABELS[cadence]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))
                          )}
                        </div>

                        <div className="mt-4 rounded-[1rem] border border-[rgba(17,18,20,0.08)] bg-white p-3">
                          <input
                            value={screeningType}
                            onChange={(event) => setScreeningType(event.currentTarget.value)}
                            placeholder="Type de dépistage"
                            className="w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                          />
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <select
                              value={screeningCadence}
                              onChange={(event) =>
                                setScreeningCadence(event.currentTarget.value as ScreeningCadence)
                              }
                              className="rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                            >
                              {CADENCE_OPTIONS.map((cadence) => (
                                <option key={cadence} value={cadence}>
                                  {CADENCE_LABELS[cadence]}
                                </option>
                              ))}
                            </select>
                            <input
                              type="date"
                              value={screeningDueAt}
                              onChange={(event) => setScreeningDueAt(event.currentTarget.value)}
                              className="rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214]"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleSaveScreeningReminder()}
                            disabled={
                              !screeningType.trim() || !screeningDueAt || isSavingScreeningReminder
                            }
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#111214] px-4 py-3 text-sm font-semibold text-white disabled:opacity-55"
                          >
                            {isSavingScreeningReminder
                              ? "Enregistrement..."
                              : "Créer ou mettre à jour le rappel"}
                          </button>
                        </div>
                      </div>

                      {/* Active prevention */}
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                          Prévention active
                        </p>
                        <p className="mt-2 text-sm font-medium text-[#111214]">
                          {preventionCurrent?.settings.locationLabel ?? "Dakar"}
                        </p>
                        <p className="mt-1 text-sm text-[#111214]/58">
                          {(preventionCurrent?.alerts.length ?? 0) > 0
                            ? preventionCurrent?.alerts[0]?.title
                            : "Aucune alerte active pour le moment."}
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </div>

              {/* Right: sticky quick actions only */}
              <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <section className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_6px_36px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                  <SectionHeader
                    overline="Actions rapides"
                    title="Publication"
                    description="Ce panneau reste visible pendant la saisie pour ne pas perdre de temps."
                  />

                  <div className="mt-5 space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                          Lignes valides
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-[#111214]">
                          {parsedPrescriptionItems.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[rgba(17,18,20,0.07)] bg-white/70 p-4 backdrop-blur-sm">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/35">
                          Imprimable
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#111214]">
                          {canPrint ? "Prêt" : "Aucun"}
                        </p>
                      </div>
                    </div>

                    {/* Publish */}
                    <button
                      type="button"
                      onClick={() => void handlePublishOutcome()}
                      disabled={!canPublishOutcome || isPublishing}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[#5B1112] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5B1112]/20 transition hover:bg-[#6C181A] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {isPublishing ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : null}
                      {isPublishing ? "Publication..." : "Publier côté patient"}
                      {!isPublishing ? <ArrowRight size={15} /> : null}
                    </button>

                    {/* Print */}
                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={!canPrint}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#111214]/12 bg-white px-4 py-3 text-sm font-semibold text-[#111214]/78 transition hover:bg-[#FEF0D5] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Printer size={15} />
                      Imprimer l'ordonnance
                    </button>

                    {/* Reset draft */}
                    <button
                      type="button"
                      onClick={resetDraft}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#111214]/10 bg-[#FCFCFC] px-4 py-3 text-sm font-medium text-[#111214]/58 transition hover:bg-white"
                    >
                      <Trash2 size={14} />
                      Effacer le brouillon local
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </PractitionerDashboardLayout>
  );
}
