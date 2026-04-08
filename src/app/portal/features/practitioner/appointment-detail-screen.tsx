import type {
  ClinicalDocumentRecord,
  PreConsultSubmissionRecord,
  PrescriptionItem,
  ScreeningCadence,
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
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Copy,
  FileText,
  Loader2,
  MapPin,
  Pill,
  Plus,
  Printer,
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

export default function PRAC03AppointmentDetail() {
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

        const [foundSubmission, foundDocuments] = auth.user
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
            ])
          : [null, []];

        if (!cancelled) {
          const latestPrescription = foundDocuments.find(
            (document) => document.kind === "prescription",
          );
          const restoredDraft = loadDraft(appointmentId);

          setAppointment(found);
          setSubmission(foundSubmission);
          setDocuments(foundDocuments);
          setError(null);

          if (restoredDraft) {
            setDiagnosis(restoredDraft.diagnosis);
            setClinicalSummary(restoredDraft.clinicalSummary);
            setPrescriptionRows(
              normalizeDraftRows(restoredDraft.prescriptionRows).length > 0
                ? normalizeDraftRows(restoredDraft.prescriptionRows)
                : [createDraftRow()],
            );
            setMeasurementText(restoredDraft.measurementText);
            setFollowUpCadence(restoredDraft.followUpCadence);
            setFollowUpDueAt(restoredDraft.followUpDueAt);
            setDraftStatus("restored");
          } else {
            setDiagnosis(found.diagnosis ?? "");
            setClinicalSummary(found.clinicalSummary ?? "");
            setPrescriptionRows(
              toDraftRowsFromDocument(latestPrescription).length > 0
                ? toDraftRowsFromDocument(latestPrescription)
                : [createDraftRow()],
            );
            setMeasurementText(toMeasurementText(found));
            setFollowUpCadence(found.followUpCadence ?? "");
            setFollowUpDueAt(toDateInputValue(found.followUpDueAt));
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
    if (!appointmentId || !isHydrated) return;

    const timer = window.setTimeout(() => {
      saveDraft(appointmentId, {
        diagnosis,
        clinicalSummary,
        prescriptionRows,
        measurementText,
        followUpCadence,
        followUpDueAt,
        updatedAt: Date.now(),
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
    setDiagnosis(appointment.diagnosis ?? "");
    setClinicalSummary(appointment.clinicalSummary ?? "");
    setPrescriptionRows(
      toDraftRowsFromDocument(latestPrescription).length > 0
        ? toDraftRowsFromDocument(latestPrescription)
        : [createDraftRow()],
    );
    setMeasurementText(toMeasurementText(appointment));
    setFollowUpCadence(appointment.followUpCadence ?? "");
    setFollowUpDueAt(toDateInputValue(appointment.followUpDueAt));
    clearDraft(appointmentId);
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

  return (
    <PractitionerDashboardLayout fullName={fullName} onLogout={handleLogout}>
      <div className="space-y-5 py-2 lg:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/patient-flow/practitioner/appointments"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#111214]/10 bg-white text-[#111214]/58 shadow-sm transition hover:bg-[#FEF0D5] hover:text-[#111214]"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-[#111214]">
                Consultation praticien
              </h1>
              <p className="mt-1 text-sm text-[#111214]/55">
                Remplissez plus vite le diagnostic, l'ordonnance et imprimez au
                besoin.
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
            <section className="overflow-hidden rounded-[2rem] bg-[#5B1112] p-6 text-white shadow-[0_18px_60px_rgba(91,17,18,0.24)]">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75">
                      Contexte patient
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${statusToneOnDark(
                        appointment.status,
                      )}`}
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
                        <>
                          <Video size={13} />
                          Vidéo
                        </>
                      ) : (
                        <>
                          <MapPin size={13} />
                          {appointment.practitionerLocation ?? "Présentiel"}
                        </>
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
                      Suivi prevu le {formatDate(appointment.followUpDueAt)}
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {(preConsultRows.length > 0
                    ? preConsultRows.slice(0, 4)
                    : [
                        {
                          label: "Pré-consultation",
                          value:
                            "Aucune donnée de pré-consultation disponible.",
                        },
                      ]
                  ).map((row) => (
                    <div
                      key={row.label}
                      className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3"
                    >
                      <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {row.label}
                      </p>
                      <p className="mt-2 text-sm text-white/90">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
              <div className="space-y-5">
                <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
                  <SectionHeader
                    overline="Composer clinique"
                    title="Diagnostic et ordonnance"
                    description="Le but est d'aller vite : suggestions, templates, favoris et lignes editables."
                  />

                  <div className="mt-5 space-y-5">
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
                        onChange={(event) =>
                          setDiagnosis(event.currentTarget.value)
                        }
                        placeholder="Ex: Acne inflammatoire moderee"
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

                    <div className="rounded-2xl border border-[#5B1112]/[0.07] bg-[#5B1112]/[0.025] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111214]">
                            Templates de consultation
                          </p>
                          <p className="mt-1 text-xs text-[#111214]/55">
                            Injectez un plan de traitement editable en un clic.
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

                    <div className="rounded-2xl border border-[#5B1112]/[0.07] bg-[#5B1112]/[0.025] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111214]">
                            Favoris praticien
                          </p>
                          <p className="mt-1 text-xs text-[#111214]/55">
                            Vos lignes recurrentes, stockees localement sur cet
                            appareil.
                          </p>
                        </div>
                        <Star size={16} className="text-[#5B1112]" />
                      </div>
                      {favorites.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-[#111214]/12 px-3 py-3 text-xs text-[#111214]/48">
                          Aucun favori pour l'instant. Enregistrez une ligne
                          pour la reutiliser en un clic.
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

                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111214]">
                            Constructeur d'ordonnance
                          </p>
                          <p className="mt-1 text-xs text-[#111214]/55">
                            Produits structures, consignes rapides, duplication
                            et favoris.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => addRow("medication")}
                            className="inline-flex items-center gap-1 rounded-full border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[rgba(17,18,20,0.65)] transition hover:border-[#5B1112]/20 hover:bg-[#FEF0D5] hover:text-[#5B1112]"
                          >
                            <Plus size={12} />
                            Medicament
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
                                      type: event.currentTarget
                                        .value as PrescriptionDraftRowType,
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
                                    updateRow(row.id, {
                                      name: event.currentTarget.value,
                                    })
                                  }
                                  placeholder={
                                    row.type === "medication"
                                      ? "Ex: Adapalene gel"
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
                                    updateRow(row.id, {
                                      instructions: event.currentTarget.value,
                                    })
                                  }
                                  rows={2}
                                  placeholder="Ex: Le soir, fine couche sur les zones touchees pendant 30 jours"
                                  className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                                />
                              </label>

                              <div className="flex flex-wrap gap-2">
                                {INSTRUCTION_SNIPPETS.map((snippet) => (
                                  <button
                                    key={`${row.id}-${snippet}`}
                                    type="button"
                                    onClick={() =>
                                      applySnippet(row.id, snippet)
                                    }
                                    className="rounded-full border border-[rgba(17,18,20,0.08)] bg-white/70 px-2.5 py-1 text-[10px] font-medium text-[rgba(17,18,20,0.55)] transition hover:bg-[#FEF0D5] hover:border-[#5B1112]/20 hover:text-[#5B1112]"
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

                    <div>
                      <label
                        htmlFor="clinical-summary"
                        className="text-sm font-medium text-[#111214]"
                      >
                        Synthese clinique
                      </label>
                      <textarea
                        id="clinical-summary"
                        value={clinicalSummary}
                        onChange={(event) =>
                          setClinicalSummary(event.currentTarget.value)
                        }
                        rows={4}
                        placeholder="Note clinique rapide, conseils patient, plan de prise en charge."
                        className="mt-2 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                      />
                    </div>

                    <details className="overflow-hidden rounded-2xl border border-[rgba(17,18,20,0.08)] bg-white/50">
                      <summary className="flex cursor-pointer list-none select-none items-center justify-between px-4 py-3.5 text-sm font-semibold text-[#111214] transition-colors hover:bg-white/60">
                        <span>Mesures et suivi</span>
                        <span className="text-[rgba(17,18,20,0.38)] text-xs">
                          ▾
                        </span>
                      </summary>
                      <div className="grid gap-4 border-t border-[rgba(17,18,20,0.06)] px-4 pb-4 pt-4">
                        <label className="block">
                          <span className="text-xs font-medium text-[#111214]/68">
                            Mesures / preuves
                          </span>
                          <textarea
                            aria-label="Mesures"
                            value={measurementText}
                            onChange={(event) =>
                              setMeasurementText(event.currentTarget.value)
                            }
                            rows={3}
                            placeholder={
                              "Hydratation | 62 | %\nSebum frontal | 4 | /5"
                            }
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
                                  event.currentTarget.value as
                                    | ScreeningCadence
                                    | "",
                                )
                              }
                              className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                            >
                              <option value="">Pas de suivi planifie</option>
                              {CADENCE_OPTIONS.map((cadence) => (
                                <option key={cadence} value={cadence}>
                                  {CADENCE_LABELS[cadence]}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="block">
                            <span className="text-xs font-medium text-[#111214]/68">
                              Prochaine echeance
                            </span>
                            <input
                              type="date"
                              value={followUpDueAt}
                              onChange={(event) =>
                                setFollowUpDueAt(event.currentTarget.value)
                              }
                              className="mt-1.5 w-full rounded-xl border border-[rgba(17,18,20,0.10)] bg-white/80 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[rgba(17,18,20,0.30)] transition focus:border-[#5B1112]/40 focus:bg-white focus:shadow-sm"
                            />
                          </label>
                        </div>
                      </div>
                    </details>
                  </div>
                </section>

                <section className="rounded-3xl border border-[rgba(17,18,20,0.08)] bg-white/70 p-5 backdrop-blur-sm">
                  <SectionHeader
                    overline="Contexte patient"
                    title="Pré-consultation"
                    description="Ce que le patient a deja renseigne avant votre decision clinique."
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
                          <p className="mt-2 text-sm text-[#111214]/78">
                            {row.value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {photoPreviews.length > 0 ? (
                    <div className="mt-5">
                      <p className="text-sm font-semibold text-[#111214]">
                        Photos cliniques
                      </p>
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
                            <p className="px-3 py-2 text-xs text-[#111214]/54">
                              {photo.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-[#111214]">
                      Historique déjà publié
                    </p>
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
                                  {document.summary ||
                                    "Document clinique publié"}
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
                              {appointmentStatusLabel(appointment.status)} · v
                              {document.version} ·{" "}
                              {formatDate(
                                document.publishedAt ?? document.createdAt,
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                <section className="rounded-[2rem] border border-white bg-white/90 p-5 shadow-[0_6px_36px_rgba(0,0,0,0.04)] backdrop-blur-xl">
                  <SectionHeader
                    overline="Actions rapides"
                    title="Publication rapide"
                    description="Ce panneau reste visible pendant la saisie pour ne pas vous faire perdre du temps."
                  />

                  <div className="mt-5 space-y-4">
                    <div className="rounded-[1.5rem] bg-[#111214] px-4 py-4 text-white">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">
                            Statut du rendez-vous
                          </p>
                          <p className="mt-2 text-sm font-medium text-white/88">
                            {appointmentStatusLabel(appointment.status)}
                          </p>
                        </div>
                        {nextStatus ? (
                          <button
                            type="button"
                            onClick={() => void handleTransition()}
                            disabled={isTransitioning}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-[11px] font-semibold text-[#5B1112] disabled:opacity-60"
                          >
                            {nextStatusActionLabel(nextStatus)}
                            <ArrowRight size={12} />
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-2 text-[11px] font-medium text-emerald-200">
                            <CheckCircle2 size={12} />
                            Terminée
                          </div>
                        )}
                      </div>
                    </div>

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
                          Document imprimable
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#111214]">
                          {canPrint ? "Pret" : "Aucun"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handlePublishOutcome()}
                      disabled={!canPublishOutcome || isPublishing}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-[#5B1112] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5B1112]/20 transition hover:bg-[#6C181A] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      Publier cote patient
                      <ArrowRight size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={handlePrint}
                      disabled={!canPrint}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#111214]/12 bg-white px-4 py-3 text-sm font-semibold text-[#111214]/78 transition hover:bg-[#FEF0D5] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      <Printer size={15} />
                      Imprimer l'ordonnance
                    </button>

                    <button
                      type="button"
                      onClick={resetDraft}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-[1.35rem] border border-[#111214]/10 bg-[#FCFCFC] px-4 py-3 text-sm font-medium text-[#111214]/58 transition hover:bg-white"
                    >
                      <Trash2 size={14} />
                      Effacer le brouillon local
                    </button>

                    {feedback ? (
                      <div className="rounded-2xl border border-[#111214]/8 bg-[#FCFCFC] px-4 py-3 text-sm text-[#111214]/68">
                        {feedback}
                      </div>
                    ) : null}
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
