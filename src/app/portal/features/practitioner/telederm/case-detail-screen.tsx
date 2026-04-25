import type { AsyncCaseDetailRecord } from "@portal/domains/account/types";
import {
  TELEDERM_STATUS_LABELS,
  TELEDERM_STATUS_STYLES,
  formatTeledermDate,
} from "@portal/features/telederm/shared";
import { BODY_AREA_LABELS } from "@portal/features/telederm/lib/bodyAreas";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  FileText,
  MessageSquareMore,
  Pill,
  Plus,
  Send,
  Stethoscope,
  Trash2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";

// ── Constants ──────────────────────────────────────────────────────────────

const QUESTION_LABELS: Record<string, string> = {
  duration: "Durée",
  evolution: "Évolution",
  sensations: "Sensations",
  severity: "Intensité",
  spreading: "Extension",
  previousTreatment: "Traitement déjà essayé",
  skinType: "Phototype",
  allergies: "Allergies",
  previousDiagnosis: "Antécédent dermatologique",
  medications: "Médicaments actuels",
  pregnancy: "Grossesse ou allaitement",
  chronicCondition: "Terrain chronique",
  caseReview: "Examen du dossier autorisé",
  photoUse: "Usage médical des photos autorisé",
  uploadedAssetIds: "Photos téléversées",
};

const CLINICAL_SNIPPETS = [
  {
    label: "Pas d'urgence",
    text: "Pas d'argument visuel pour une urgence dermatologique immédiate.",
  },
  {
    label: "Dermatose inflam.",
    text: "Tableau compatible avec une dermatose inflammatoire superficielle.",
  },
  {
    label: "Examen limité",
    text: "Analyse limitée par l'absence d'examen clinique présentiel.",
  },
  {
    label: "Suivi recommandé",
    text: "Un suivi à 3-4 semaines est recommandé pour réévaluer l'évolution.",
  },
];

const PATIENT_SNIPPETS = [
  { label: "Pas de grattage", text: "Évitez de gratter ou de manipuler la zone concernée." },
  {
    label: "Stop produits irritants",
    text: "Suspendez les nouveaux produits irritants jusqu'à amélioration.",
  },
  {
    label: "Photos de contrôle",
    text: "Prenez des photos de contrôle si l'aspect évolue dans les prochains jours.",
  },
  {
    label: "Consult. si extension",
    text: "Une consultation en présentiel est recommandée si la lésion s'étend rapidement.",
  },
];

const PRESCRIPTION_SNIPPETS = [
  { label: "1× le soir / 7j", text: "Appliquer une fine couche 1 fois le soir pendant 7 jours." },
  { label: "Matin & soir / 14j", text: "Appliquer matin et soir sur peau propre pendant 14 jours." },
  { label: "Stop si irritation", text: "Arrêter immédiatement en cas d'irritation importante." },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function appendSnippet(current: string, snippet: string) {
  const trimmed = current.trim();
  if (!trimmed) return snippet;
  if (trimmed.includes(snippet)) return current;
  return `${trimmed}\n\n${snippet}`;
}

function formatQuestionValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "Non renseigné";
  if (typeof value === "boolean") return value ? "Oui" : "Non";
  if (typeof value === "number")
    return key === "severity" ? `${value}/10` : String(value);
  if (typeof value === "string") return value.trim() || "Non renseigné";
  if (Array.isArray(value)) {
    if (value.length === 0) return "Non renseigné";
    return value
      .map((item) => {
        if (typeof item === "string") return BODY_AREA_LABELS[item] ?? item;
        if (
          item &&
          typeof item === "object" &&
          "label" in item &&
          typeof item.label === "string" &&
          "present" in item
        ) {
          return `${item.label} : ${(item as { present: boolean }).present ? "ajoutée" : "manquante"}`;
        }
        return null;
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") return "Voir section détaillée";
  return String(value);
}

// ── Small reusable components ──────────────────────────────────────────────

function QuestionnaireField({ label, value }: { label: string; value: string }) {
  const isEmpty = value === "Non renseigné";
  const isShort = !isEmpty && value.length < 36 && !value.includes("\n");
  return (
    <div className="flex flex-col gap-2 rounded-[1.25rem] border border-[#111214]/[0.04] bg-white/85 p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
      <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#111214]/25">
        {label}
      </p>
      {isEmpty ? (
        <span className="text-[10px] italic text-[#111214]/25">—</span>
      ) : isShort ? (
        <span className="inline-flex self-start rounded-full bg-[#FEF0D5] px-3 py-1 text-[11px] font-semibold text-[#111214]/65">
          {value}
        </span>
      ) : (
        <p className="text-[11px] leading-relaxed text-[#111214]/60">{value}</p>
      )}
    </div>
  );
}

function QuestionnaireSection({
  title,
  entries,
}: {
  title: string;
  entries: Array<[string, unknown]>;
}) {
  if (entries.length === 0) return null;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-[1px] w-3 rounded-full bg-[#5B1112]/20" />
        <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-[#5B1112]/50">
          {title}
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <QuestionnaireField
            key={key}
            label={QUESTION_LABELS[key] ?? key}
            value={formatQuestionValue(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

function SnippetPill({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-[#5B1112]/10 bg-[#5B1112]/[0.05] px-2.5 py-1 text-[10px] font-medium text-[#5B1112]/75 transition hover:border-[#5B1112]/20 hover:bg-[#5B1112]/10"
    >
      <Zap size={9} />
      {label}
    </motion.button>
  );
}

function WordCount({ text, min }: { text: string; min: number }) {
  const len = text.trim().length;
  const done = len >= min;
  return (
    <span
      className={`text-[9px] font-medium transition-colors ${done ? "text-emerald-600" : "text-[#111214]/25"}`}
    >
      {len} car.{done ? " ✓" : ` / ${min} min`}
    </span>
  );
}

// ── Patient digest card ────────────────────────────────────────────────────

function PatientDigest({
  bodyAreas,
  sensations,
  questionnaire,
}: {
  bodyAreas: string[];
  sensations: string[];
  questionnaire: Record<string, unknown>;
}) {
  const symptoms = (
    questionnaire.symptoms && typeof questionnaire.symptoms === "object"
      ? questionnaire.symptoms
      : {}
  ) as Record<string, unknown>;

  const duration = typeof symptoms.duration === "string" ? symptoms.duration : "";
  const severity = typeof symptoms.severity === "number" ? symptoms.severity : 0;

  const groups = [
    { label: "Zones", items: bodyAreas, color: "bg-[#FEF0D5] text-[#111214]/65 border border-[#111214]/[0.06]" },
    { label: "Sensations", items: sensations, color: "bg-[#5B1112]/[0.06] text-[#5B1112]/75 border border-[#5B1112]/10" },
    ...(severity > 0 ? [{ label: "Intensité", items: [`${severity}/10`], color: "bg-amber-50 text-amber-700 border border-amber-100" }] : []),
    ...(duration ? [{ label: "Durée", items: [duration], color: "bg-sky-50 text-sky-700 border border-sky-100" }] : []),
  ].filter(g => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="rounded-[1.75rem] border border-[#5B1112]/8 bg-gradient-to-br from-[#5B1112]/[0.03] to-[#FEF0D5]/60 p-4">
      <p className="mb-3 text-[8.5px] font-bold uppercase tracking-[0.22em] text-[#5B1112]/45">
        Contexte du patient
      </p>
      <div className="space-y-2">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-wrap items-center gap-1.5">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#111214]/28 w-16 flex-shrink-0">
              {group.label}
            </span>
            {group.items.map((item) => (
              <span
                key={item}
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${group.color}`}
              >
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Response section card ──────────────────────────────────────────────────

function ResponseSection({
  step,
  done,
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  step: number;
  done: boolean;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.75rem] border p-5 shadow-sm transition-all duration-300 ${
        done
          ? "border-emerald-200/70 bg-gradient-to-br from-white/95 to-emerald-50/30"
          : "border-white/90 bg-white/88"
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <motion.div
          animate={done ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 ${
            done
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-400/30"
              : "bg-[#111214]/[0.06] text-[#111214]/38"
          }`}
        >
          {done ? <Check size={12} strokeWidth={2.5} /> : step}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon
              size={13}
              className={done ? "text-emerald-600" : "text-[#5B1112]/50"}
            />
            <p className="text-sm font-semibold text-[#111214]">{title}</p>
          </div>
          <p className="mt-0.5 text-[10px] leading-relaxed text-[#111214]/38">
            {subtitle}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Prescription row ───────────────────────────────────────────────────────

interface PrescriptionItem {
  id: string;
  name: string;
  instructions: string;
}

function PrescriptionRow({
  item,
  onChange,
  onDelete,
}: {
  item: PrescriptionItem;
  onChange: (id: string, field: "name" | "instructions", value: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative rounded-2xl border border-[#111214]/6 bg-[#FEF0D5]/40 p-4"
    >
      <button
        type="button"
        onClick={() => onDelete(item.id)}
        className="absolute right-3 top-3 rounded-lg p-1 text-[#111214]/25 transition hover:bg-white hover:text-[#111214]/60"
      >
        <Trash2 size={13} />
      </button>
      <input
        value={item.name}
        onChange={(e) => onChange(item.id, "name", e.target.value)}
        className="mb-2.5 w-full rounded-xl border border-[#111214]/8 bg-white/70 px-3 py-2.5 pr-8 text-sm text-[#111214] outline-none placeholder:text-[#111214]/30 focus:border-[#5B1112]/20 focus:bg-white transition-colors"
        placeholder="Nom du médicament ou soin prescrit"
      />
      <textarea
        value={item.instructions}
        onChange={(e) => onChange(item.id, "instructions", e.target.value)}
        rows={2}
        className="w-full resize-none rounded-xl border border-[#111214]/8 bg-white/70 px-3 py-2.5 text-sm text-[#111214] outline-none placeholder:text-[#111214]/30 focus:border-[#5B1112]/20 focus:bg-white transition-colors"
        placeholder="Posologie, durée, fréquence, précautions..."
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {PRESCRIPTION_SNIPPETS.map((s) => (
          <SnippetPill
            key={s.label}
            label={s.label}
            onClick={() =>
              onChange(item.id, "instructions", appendSnippet(item.instructions, s.text))
            }
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PractitionerTeledermCaseDetailScreen() {
  const { caseId = "" } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<AsyncCaseDetailRecord | null>(null);
  const [requestBody, setRequestBody] = useState("");

  // Response fields
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [body, setBody] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  const refreshDetail = useCallback(async () => {
    if (!auth.user || !caseId) return;
    const next = await auth.accountAdapter.getAsyncCase(auth.user.id, caseId);
    setDetail(next);
  }, [auth.accountAdapter, auth.user, caseId]);

  useEffect(() => {
    if (!auth.user || !caseId) return;
    let active = true;
    void auth.accountAdapter
      .getAsyncCase(auth.user.id, caseId)
      .then((next) => {
        if (active) setDetail(next);
      });
    return () => {
      active = false;
    };
  }, [auth.accountAdapter, auth.user, caseId]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleClaim() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.claimAsyncCase(auth.user.id, detail.case.id);
    await refreshDetail();
  }

  async function handleRequestMoreInfo() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.requestMoreInfo({
      actorUserId: auth.user.id,
      caseId: detail.case.id,
      body: requestBody,
    });
    setRequestBody("");
    await refreshDetail();
  }

  async function handleRespond() {
    if (!auth.user || !detail) return;
    const next = await auth.accountAdapter.respondToAsyncCase({
      actorUserId: auth.user.id,
      caseId: detail.case.id,
      diagnosis,
      clinicalSummary,
      body,
      prescriptionItems: prescriptions
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name, instructions: p.instructions, isMedication: true })),
    });
    setDetail(next);
  }

  async function handleClose() {
    if (!auth.user || !detail) return;
    await auth.accountAdapter.closeAsyncCase(auth.user.id, detail.case.id);
    await refreshDetail();
  }

  function addPrescription() {
    setPrescriptions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", instructions: "" },
    ]);
    setShowPrescriptions(true);
  }

  function updatePrescription(
    id: string,
    field: "name" | "instructions",
    value: string,
  ) {
    setPrescriptions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  }

  function deletePrescription(id: string) {
    setPrescriptions((prev) => prev.filter((p) => p.id !== id));
  }

  if (!detail) {
    return (
      <PractitionerDashboardLayout
        fullName={auth.user?.fullName ?? "Praticien"}
        onLogout={handleLogout}
      >
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-sm text-[#111214]/40">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5B1112]/20 border-t-[#5B1112]" />
            Chargement du dossier télé-derm...
          </div>
        </div>
      </PractitionerDashboardLayout>
    );
  }

  const statusStyle = TELEDERM_STATUS_STYLES[detail.case.status];
  const StatusIcon = statusStyle.icon;
  const questionnaire = detail.case.questionnaireData ?? {};

  const bodyAreaEntries = Object.entries({ bodyAreas: questionnaire.bodyAreas });
  const symptomEntries =
    questionnaire.symptoms && typeof questionnaire.symptoms === "object"
      ? Object.entries(questionnaire.symptoms as Record<string, unknown>)
      : [];
  const medicalEntries =
    questionnaire.medical && typeof questionnaire.medical === "object"
      ? Object.entries(questionnaire.medical as Record<string, unknown>)
      : [];
  const consentEntries =
    questionnaire.consent && typeof questionnaire.consent === "object"
      ? Object.entries(questionnaire.consent as Record<string, unknown>)
      : [];

  const bodyAreas = Array.isArray(questionnaire.bodyAreas)
    ? questionnaire.bodyAreas
        .map((item) =>
          typeof item === "string" ? (BODY_AREA_LABELS[item] ?? item) : null,
        )
        .filter((x): x is string => x !== null)
    : [];

  const sensations =
    questionnaire.symptoms &&
    typeof questionnaire.symptoms === "object" &&
    Array.isArray((questionnaire.symptoms as Record<string, unknown>).sensations)
      ? (
          (questionnaire.symptoms as Record<string, unknown>)
            .sensations as unknown[]
        ).filter((item): item is string => typeof item === "string")
      : [];

  // Completion
  const step1Done = diagnosis.trim().length >= 3;
  const step2Done = clinicalSummary.trim().length >= 12;
  const step3Done = body.trim().length >= 12;
  const completedCount = [step1Done, step2Done, step3Done].filter(Boolean).length;
  const publishDisabled = !step1Done || !step2Done || !step3Done;

  const canRespond = ["in_review", "patient_replied"].includes(detail.case.status);

  return (
    <PractitionerDashboardLayout
      fullName={auth.user?.fullName ?? "Praticien"}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* ── Case header ── */}
        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br from-white/90 to-white/60 shadow-[0_8px_40px_rgba(17,18,20,0.07)] backdrop-blur-sm">
          {/* Top accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-[#5B1112] via-[#9B3335] to-[#5B1112]/40" />
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyle.tone}`}
              >
                <StatusIcon size={11} />
                {TELEDERM_STATUS_LABELS[detail.case.status]}
              </span>
              {detail.case.bodyArea ? (
                <span className="rounded-full bg-[#FEF0D5] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#111214]/50">
                  {detail.case.bodyArea}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 font-serif text-[1.75rem] leading-snug text-[#111214]">
              {detail.case.patientSummary || "Cas télé-derm"}
            </h1>
            <p className="mt-2 text-[11px] text-[#111214]/40">
              Créé le {formatTeledermDate(detail.case.createdAt)} · mis à jour{" "}
              {formatTeledermDate(detail.case.latestMessageAt ?? detail.case.updatedAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["submitted", "patient_replied"].includes(detail.case.status) ? (
                <button
                  type="button"
                  onClick={() => void handleClaim()}
                  className="rounded-full bg-gradient-to-br from-[#5B1112] to-[#7B2224] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#5B1112]/25 transition hover:shadow-lg"
                >
                  Réclamer le dossier
                </button>
              ) : null}
              {detail.case.status === "responded" ? (
                <button
                  type="button"
                  onClick={() => void handleClose()}
                  className="rounded-full border border-[#111214]/12 bg-white/80 px-4 py-2 text-sm font-medium text-[#111214]/65 transition hover:border-[#111214]/20 hover:bg-white"
                >
                  Clôturer le dossier
                </button>
              ) : null}
              {canRespond ? (
                <button
                  type="button"
                  onClick={() =>
                    responseRef.current?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-full border border-[#5B1112]/15 bg-[#5B1112]/[0.05] px-4 py-2 text-sm font-medium text-[#5B1112] transition hover:bg-[#5B1112]/10"
                >
                  Rédiger la réponse ↓
                </button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ── Two-column layout ── */}
        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ── Left: patient data ── */}
          <div className="space-y-5">
            {/* Questionnaire */}
            <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
              <div className="mb-5 flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#5B1112]/[0.07]">
                  <FileText size={13} className="text-[#5B1112]/60" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111214]/40">
                  Questionnaire patient
                </p>
              </div>
              <div className="space-y-5">
                <QuestionnaireSection title="Zones concernées" entries={bodyAreaEntries} />
                <QuestionnaireSection title="Symptômes" entries={symptomEntries} />
                <QuestionnaireSection title="Contexte médical" entries={medicalEntries} />
                <QuestionnaireSection title="Consentement" entries={consentEntries} />
              </div>
            </div>

            {/* Photos */}
            {detail.mediaAssets.length > 0 ? (
              <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#5B1112]/[0.07]">
                      <Eye size={13} className="text-[#5B1112]/60" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111214]/40">
                      Photos
                    </p>
                  </div>
                  <span className="rounded-full bg-[#FEF0D5] px-2.5 py-1 text-[10px] font-semibold text-[#111214]/55">
                    {detail.mediaAssets.length} image{detail.mediaAssets.length > 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-2.5 grid-cols-2 lg:grid-cols-3">
                  {detail.mediaAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="group overflow-hidden rounded-[1.5rem] border border-[#111214]/5 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="relative aspect-square bg-[#FEF0D5]/80">
                        {asset.downloadUrl ? (
                          <img
                            src={asset.downloadUrl}
                            alt={asset.fileName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Eye size={20} className="text-[#111214]/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      </div>
                      <div className="bg-white/80 px-3 py-2">
                        <p className="text-[10px] font-semibold text-[#111214]/70">
                          {asset.captureKind ?? "Photo"}
                        </p>
                        <p className="mt-0.5 text-[9px] text-[#111214]/35">
                          {formatTeledermDate(asset.uploadedAt ?? asset.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {detail.comparisonGroups.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-[1px] w-3 rounded-full bg-[#5B1112]/20" />
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/45">
                        Historique comparatif
                      </p>
                    </div>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {detail.comparisonGroups[0].mediaAssets.map((asset) => (
                        <div key={asset.id} className="w-32 flex-shrink-0">
                          <div className="aspect-square overflow-hidden rounded-[1.25rem] bg-[#FEF0D5]/70 border border-[#111214]/5">
                            {asset.downloadUrl ? (
                              <img
                                src={asset.downloadUrl}
                                alt={asset.fileName}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <p className="mt-1.5 text-[9px] text-[#111214]/38">
                            {formatTeledermDate(asset.uploadedAt ?? asset.createdAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Message thread */}
            {detail.messages.length > 0 ? (
              <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#5B1112]/[0.07]">
                    <MessageSquareMore size={13} className="text-[#5B1112]/60" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#111214]/40">
                    Fil d'échange
                  </p>
                  <span className="ml-auto rounded-full bg-[#FEF0D5] px-2.5 py-1 text-[10px] font-semibold text-[#111214]/50">
                    {detail.messages.length}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {detail.messages.map((message) => {
                    const isPractitioner = message.authorRole === "practitioner";
                    return (
                      <div
                        key={message.id}
                        className={`rounded-[1.5rem] p-4 ${
                          isPractitioner
                            ? "border border-[#5B1112]/10 bg-[#5B1112]/[0.04]"
                            : "border border-[#111214]/[0.04] bg-[#FEF0D5]/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              isPractitioner ? "text-[#5B1112]/65" : "text-[#111214]/45"
                            }`}
                          >
                            {isPractitioner ? "Vous" : "Patient"}
                          </span>
                          <span className="text-[9px] text-[#111214]/30">
                            {formatTeledermDate(message.createdAt)}
                          </span>
                        </div>
                        {message.body ? (
                          <p className="mt-2 text-[11px] leading-relaxed text-[#111214]/60">
                            {message.body}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* ── Right: response workspace ── */}
          <div className="space-y-4" ref={responseRef}>
            {/* Request more info */}
            {canRespond ? (
              <div className="rounded-[2rem] border border-[#5B1112]/12 bg-white/90 p-5 shadow-[0_8px_32px_rgba(17,18,20,0.05)]">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-gradient-to-br from-[#5B1112]/10 to-[#5B1112]/6 text-[#5B1112]">
                    <MessageSquareMore size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">
                      Demander des précisions
                    </p>
                    <p className="text-[10px] text-[#111214]/38">
                      Le patient recevra une notification immédiate.
                    </p>
                  </div>
                </div>
                <textarea
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-[#111214]/6 bg-[#FEF0D5]/40 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[#111214]/28 transition-colors focus:border-[#5B1112]/18 focus:bg-white/70"
                  placeholder="Précisez ce que vous attendez du patient..."
                />
                <button
                  type="button"
                  onClick={() => void handleRequestMoreInfo()}
                  disabled={requestBody.trim().length < 6}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#5B1112]/15 bg-[#5B1112]/[0.04] py-2.5 text-sm font-semibold text-[#5B1112] transition hover:bg-[#5B1112]/[0.08] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Envoyer la demande
                  <ArrowRight size={14} />
                </button>
              </div>
            ) : null}

            {/* ── Response editor ── */}
            {canRespond ? (
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-sm font-semibold text-[#111214]">
                      Rédiger la réponse
                    </p>
                    <p className="text-[10px] text-[#111214]/40">
                      Structurez votre avis médical avant publication.
                    </p>
                  </div>
                  {/* Completion indicator */}
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition-all ${
                      completedCount === 3
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-[#111214]/[0.05] text-[#111214]/45"
                    }`}
                  >
                    <div className="flex gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                            i <= completedCount ? "bg-emerald-500" : "bg-[#111214]/15"
                          }`}
                        />
                      ))}
                    </div>
                    {completedCount}/3 sections
                  </div>
                </div>

                {/* Patient digest */}
                <PatientDigest
                  bodyAreas={bodyAreas}
                  sensations={sensations}
                  questionnaire={questionnaire as Record<string, unknown>}
                />

                {/* Section 1 — Diagnosis */}
                <ResponseSection
                  step={1}
                  done={step1Done}
                  icon={Stethoscope}
                  title="Impression diagnostique"
                  subtitle="Nommez le diagnostic ou l'hypothèse principale de façon concise."
                >
                  <input
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full rounded-xl border border-[#111214]/6 bg-[#FEF0D5]/35 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[#111214]/25 transition-all focus:border-[#5B1112]/22 focus:bg-white/85 focus:shadow-sm"
                    placeholder="Ex : dermatite irritative, acné inflammatoire, mycose superficielle..."
                  />
                </ResponseSection>

                {/* Section 2 — Clinical summary */}
                <ResponseSection
                  step={2}
                  done={step2Done}
                  icon={FileText}
                  title="Synthèse clinique"
                  subtitle="Résumez votre lecture dermatologique avec les éventuelles limites."
                >
                  <div className="relative">
                    <textarea
                      value={clinicalSummary}
                      onChange={(e) => setClinicalSummary(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-[#111214]/6 bg-[#FEF0D5]/35 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[#111214]/25 transition-all focus:border-[#5B1112]/22 focus:bg-white/85 focus:shadow-sm"
                      placeholder="Éléments cliniques saillants, niveau de confiance, points de vigilance..."
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {CLINICAL_SNIPPETS.map((s) => (
                          <SnippetPill
                            key={s.label}
                            label={s.label}
                            onClick={() =>
                              setClinicalSummary((c) => appendSnippet(c, s.text))
                            }
                          />
                        ))}
                      </div>
                      <WordCount text={clinicalSummary} min={12} />
                    </div>
                  </div>
                </ResponseSection>

                {/* Section 3 — Patient message */}
                <ResponseSection
                  step={3}
                  done={step3Done}
                  icon={MessageSquareMore}
                  title="Message & conduite à tenir"
                  subtitle="Partie la plus visible : conseils, surveillance et orientation pour le patient."
                >
                  <div>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={5}
                      className="w-full resize-none rounded-xl border border-[#111214]/6 bg-[#FEF0D5]/35 px-4 py-3 text-sm text-[#111214] outline-none placeholder:text-[#111214]/25 transition-all focus:border-[#5B1112]/22 focus:bg-white/85 focus:shadow-sm"
                      placeholder="Ce que le patient doit faire maintenant, surveiller, et quand reconsulter."
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5">
                        {PATIENT_SNIPPETS.map((s) => (
                          <SnippetPill
                            key={s.label}
                            label={s.label}
                            onClick={() =>
                              setBody((c) => appendSnippet(c, s.text))
                            }
                          />
                        ))}
                      </div>
                      <WordCount text={body} min={12} />
                    </div>
                  </div>
                </ResponseSection>

                {/* Prescription section */}
                <div className="rounded-[1.75rem] border border-white bg-white/85 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#111214]/[0.07]">
                        <Pill size={13} className="text-[#111214]/40" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111214]">
                          Prescription
                        </p>
                        <p className="text-[10px] text-[#111214]/38">
                          {prescriptions.length > 0
                            ? `${prescriptions.length} traitement${prescriptions.length > 1 ? "s" : ""} ajouté${prescriptions.length > 1 ? "s" : ""}`
                            : "Optionnelle — génère une ordonnance côté patient"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {prescriptions.length > 0 ? (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowPrescriptions((v) => !v)}
                          className="flex items-center gap-1 rounded-full border border-[#111214]/8 px-2.5 py-1 text-[10px] text-[#111214]/45 transition hover:bg-[#111214]/[0.04]"
                        >
                          {showPrescriptions ? <EyeOff size={10} /> : <Eye size={10} />}
                          {showPrescriptions ? "Masquer" : "Voir"}
                        </motion.button>
                      ) : null}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={addPrescription}
                        className="flex items-center gap-1 rounded-full border border-[#5B1112]/15 bg-[#5B1112]/[0.05] px-3 py-1.5 text-[10px] font-semibold text-[#5B1112] transition hover:bg-[#5B1112]/10"
                      >
                        <Plus size={11} />
                        Ajouter
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {(showPrescriptions || prescriptions.length === 0) &&
                    prescriptions.length > 0 ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        <AnimatePresence>
                          {prescriptions.map((item) => (
                            <PrescriptionRow
                              key={item.id}
                              item={item}
                              onChange={updatePrescription}
                              onDelete={deletePrescription}
                            />
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Live preview toggle */}
                <div className="rounded-[1.75rem] border border-[#5B1112]/8 bg-[#5B1112]/[0.03] p-5">
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="flex w-full items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 text-[#5B1112]">
                      <Eye size={14} />
                      <p className="text-sm font-semibold">Aperçu patient</p>
                    </div>
                    <motion.div
                      animate={{ rotate: showPreview ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={15} className="text-[#5B1112]/50" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showPreview ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 rounded-2xl bg-white/80 p-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/28">
                              Diagnostic
                            </p>
                            <p className="mt-1 text-sm font-medium text-[#111214]/75">
                              {diagnosis.trim() || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/28">
                              Synthèse clinique
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#111214]/62">
                              {clinicalSummary.trim() || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/28">
                              Conseils & conduite à tenir
                            </p>
                            <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#111214]/62">
                              {body.trim() || "—"}
                            </p>
                          </div>
                          {prescriptions.filter((p) => p.name.trim()).length > 0 ? (
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[#111214]/28">
                                Prescription(s)
                              </p>
                              <div className="mt-2 space-y-2">
                                {prescriptions
                                  .filter((p) => p.name.trim())
                                  .map((p) => (
                                    <div
                                      key={p.id}
                                      className="rounded-xl bg-[#FEF0D5]/60 px-3 py-2"
                                    >
                                      <p className="text-xs font-semibold text-[#111214]/75">
                                        {p.name}
                                      </p>
                                      {p.instructions ? (
                                        <p className="mt-0.5 text-xs text-[#111214]/50">
                                          {p.instructions}
                                        </p>
                                      ) : null}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-1.5 border-t border-[#111214]/5 pt-3">
                            {bodyAreas.map((a) => (
                              <span
                                key={a}
                                className="rounded-full bg-[#FEF0D5] px-2.5 py-1 text-[10px] font-medium text-[#111214]/55"
                              >
                                {a}
                              </span>
                            ))}
                            {sensations.map((s) => (
                              <span
                                key={s}
                                className="rounded-full bg-[#111214]/[0.04] px-2.5 py-1 text-[10px] font-medium text-[#111214]/50"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                {/* Publish button */}
                <motion.button
                  type="button"
                  onClick={() => void handleRespond()}
                  disabled={publishDisabled}
                  whileHover={!publishDisabled ? { scale: 1.015, y: -2 } : {}}
                  whileTap={!publishDisabled ? { scale: 0.975 } : {}}
                  className={`inline-flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-sm font-semibold transition-all duration-200 ${
                    publishDisabled
                      ? "cursor-not-allowed bg-[#111214]/[0.05] text-[#111214]/28"
                      : "bg-gradient-to-br from-[#5B1112] to-[#7B2224] text-white shadow-lg shadow-[#5B1112]/28 hover:shadow-xl hover:shadow-[#5B1112]/35"
                  }`}
                >
                  {publishDisabled ? (
                    <>
                      Encore {3 - completedCount} section
                      {3 - completedCount > 1 ? "s" : ""} à compléter
                    </>
                  ) : (
                    <>
                      Publier la réponse
                      <Send size={14} />
                    </>
                  )}
                </motion.button>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PractitionerDashboardLayout>
  );
}
