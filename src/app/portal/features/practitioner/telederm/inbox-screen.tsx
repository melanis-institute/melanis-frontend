import type { AsyncCaseDetailRecord, AsyncCaseRecord } from "@portal/domains/account/types";
import {
  TELEDERM_STATUS_LABELS,
  TELEDERM_STATUS_STYLES,
  formatTeledermDate,
} from "@portal/features/telederm/shared";
import { useAuth } from "@portal/session/useAuth";
import { PractitionerDashboardLayout } from "@portal/shared/layouts/PractitionerDashboardLayout";
import {
  ArrowRight,
  Check,
  FileText,
  MessageSquareMore,
  Pill,
  Plus,
  Send,
  Stethoscope,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";

// ── Types ──────────────────────────────────────────────────────────────────

type FilterKey = "all" | "nouveaux" | "in_review" | "responded" | "closed";
type ActivePanel = "complements" | "ordonnance" | "reponse";

interface DrugEntry {
  id: string;
  name: string;
  posologie: string;
  duree: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "nouveaux", label: "Nouveaux" },
  { key: "in_review", label: "En revue" },
  { key: "responded", label: "Réponses" },
  { key: "closed", label: "Clôturés" },
];

const BODY_AREA_LABELS: Record<string, string> = {
  visage: "Visage",
  "cuir-chevelu": "Cuir chevelu",
  bras: "Bras & épaules",
  jambes: "Jambes & pieds",
  torse: "Torse & dos",
  intime: "Zone intime",
  ongles: "Ongles",
  autre: "Autre zone",
};

const BODY_AREA_POSITIONS: Record<string, { cx: number; cy: number }> = {
  visage: { cx: 50, cy: 10 },
  "cuir-chevelu": { cx: 50, cy: 5 },
  bras: { cx: 18, cy: 40 },
  jambes: { cx: 50, cy: 80 },
  torse: { cx: 50, cy: 37 },
  intime: { cx: 50, cy: 57 },
  ongles: { cx: 74, cy: 88 },
  autre: { cx: 50, cy: 50 },
};

const FITZPATRICK_TONES = [
  { id: "I", bg: "#F5E6D0", ring: "#E8CCA8" },
  { id: "II", bg: "#EDD5B3", ring: "#D4B07A" },
  { id: "III", bg: "#D4A574", ring: "#B87D45" },
  { id: "IV", bg: "#C68642", ring: "#A86A28" },
  { id: "V", bg: "#8D5524", ring: "#6B3D18" },
  { id: "VI", bg: "#4A2512", ring: "#2E1509" },
];

const COMPLEMENT_PRESETS = [
  "Photo sous lumière naturelle diffuse",
  "Photo rapprochée de la lésion",
  "Vue de profil ou angle différent",
  "Description précise des sensations",
  "Historique complet des traitements",
  "Photo comparative d'une zone saine",
];

const CLINICAL_SNIPPETS = [
  { label: "Pas d'urgence", text: "Pas d'argument visuel pour une urgence dermatologique immédiate." },
  { label: "Dermatose inflam.", text: "Tableau compatible avec une dermatose inflammatoire superficielle." },
  { label: "Examen limité", text: "Analyse limitée par l'absence d'examen clinique présentiel." },
  { label: "Suivi 3–4 sem.", text: "Un suivi à 3–4 semaines est recommandé pour réévaluer l'évolution." },
];

const PATIENT_SNIPPETS = [
  { label: "Pas de grattage", text: "Évitez de gratter ou de manipuler la zone concernée." },
  { label: "Stop irritants", text: "Suspendez les nouveaux produits irritants jusqu'à amélioration." },
  { label: "Photos de contrôle", text: "Prenez des photos si l'aspect évolue dans les prochains jours." },
  { label: "Consult. si extension", text: "Une consultation en présentiel est recommandée si la lésion s'étend." },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function filterCases(all: AsyncCaseRecord[], filter: FilterKey): AsyncCaseRecord[] {
  if (filter === "all") return all;
  if (filter === "nouveaux")
    return all.filter((c) =>
      ["submitted", "patient_replied", "waiting_for_patient"].includes(c.status),
    );
  return all.filter((c) => c.status === filter);
}

function urgencyDotColor(status: AsyncCaseRecord["status"]): string {
  if (status === "submitted") return "bg-[#5B1112]";
  if (status === "patient_replied" || status === "waiting_for_patient") return "bg-amber-500";
  if (status === "in_review") return "bg-[#00415E]";
  if (status === "responded") return "bg-emerald-500";
  return "bg-[#111214]/20";
}

function appendSnippet(current: string, snippet: string): string {
  const trimmed = current.trim();
  if (!trimmed) return snippet;
  if (trimmed.includes(snippet)) return current;
  return `${trimmed}\n\n${snippet}`;
}

function getSkinType(q: Record<string, unknown>): string {
  const medical = q.medical as Record<string, unknown> | undefined;
  const symptoms = q.symptoms as Record<string, unknown> | undefined;
  return (
    (medical?.skinType as string | undefined) ??
    (symptoms?.skinType as string | undefined) ??
    (q.skinType as string | undefined) ??
    ""
  );
}

// ── Body Mannequin ─────────────────────────────────────────────────────────

function BodyMannequin({ bodyAreas }: { bodyAreas: string[] }) {
  const markers = bodyAreas
    .map((a) => BODY_AREA_POSITIONS[a])
    .filter((p): p is { cx: number; cy: number } => Boolean(p));

  return (
    <svg viewBox="0 0 100 110" className="h-full w-full" aria-hidden>
      <ellipse cx={50} cy={11} rx={9} ry={9.5} fill="#111214" opacity={0.08} />
      <rect x={46} y={20} width={8} height={6} rx={2.5} fill="#111214" opacity={0.06} />
      <rect x={31} y={25} width={38} height={32} rx={7} fill="#111214" opacity={0.07} />
      <rect
        x={12} y={26} width={18} height={9} rx={4.5}
        fill="#111214" opacity={0.06}
        transform="rotate(18 21 30)"
      />
      <rect
        x={70} y={26} width={18} height={9} rx={4.5}
        fill="#111214" opacity={0.06}
        transform="rotate(-18 79 30)"
      />
      <rect x={31} y={56} width={16} height={40} rx={6} fill="#111214" opacity={0.07} />
      <rect x={53} y={56} width={16} height={40} rx={6} fill="#111214" opacity={0.07} />
      {markers.map((pos, i) => (
        <g key={i}>
          <circle cx={pos.cx} cy={pos.cy} r={8} fill="#5B1112" opacity={0.12} />
          <circle cx={pos.cx} cy={pos.cy} r={4} fill="#5B1112" opacity={0.65} />
          <circle cx={pos.cx} cy={pos.cy} r={1.8} fill="white" opacity={0.85} />
        </g>
      ))}
    </svg>
  );
}

// ── Severity Arc Gauge ─────────────────────────────────────────────────────

function SeverityGauge({ value }: { value: number }) {
  const r = 36;
  const cx = 50;
  const cy = 52;
  // Arc from left (180°) to right (0°) sweeping through top (counter-clockwise in SVG)
  const startX = cx - r;
  const startY = cy;
  const fullX = cx + r;
  const fullY = cy;
  // End point for current value
  const svgAngle = ((180 + (value / 10) * 180) % 360) * (Math.PI / 180);
  const endX = cx + r * Math.cos(svgAngle);
  const endY = cy + r * Math.sin(svgAngle);
  const color = value >= 8 ? "#DC2626" : value >= 5 ? "#F59E0B" : "#5B1112";

  return (
    <svg viewBox="0 0 100 62" className="w-full">
      <path
        d={`M ${startX} ${startY} A ${r} ${r} 0 0 0 ${fullX} ${fullY}`}
        fill="none"
        stroke="#111214"
        strokeOpacity={0.07}
        strokeWidth={5}
        strokeLinecap="round"
      />
      {value > 0 ? (
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX.toFixed(2)} ${endY.toFixed(2)}`}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeLinecap="round"
        />
      ) : null}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fontSize={20}
        fontWeight="700"
        fill="#111214"
        opacity={0.85}
        fontFamily="serif"
      >
        {value}
      </text>
      <text x={cx} y={cy + 7} textAnchor="middle" fontSize={8} fill="#111214" opacity={0.35}>
        /10
      </text>
    </svg>
  );
}

// ── Fitzpatrick Display ────────────────────────────────────────────────────

function FitzpatrickDisplay({ skinType }: { skinType: string }) {
  const normalized = skinType.toUpperCase();
  const match = FITZPATRICK_TONES.find((t) => normalized.includes(t.id));

  return (
    <div className="flex items-end gap-1.5">
      {FITZPATRICK_TONES.map((t) => {
        const isActive = match?.id === t.id;
        return (
          <div key={t.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`aspect-square w-full rounded-full transition-all duration-200 ${
                isActive ? "scale-125 shadow-md" : "opacity-40"
              }`}
              style={{
                backgroundColor: t.bg,
                outline: isActive ? `2px solid #5B1112` : `1px solid ${t.ring}`,
                outlineOffset: isActive ? "2px" : "0px",
              }}
            />
            {isActive ? (
              <span className="text-[8px] font-bold text-[#5B1112]">{t.id}</span>
            ) : (
              <span className="text-[7px] text-[#111214]/20">{t.id}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Drug Row ───────────────────────────────────────────────────────────────

function DrugRow({
  drug,
  onChange,
  onDelete,
}: {
  drug: DrugEntry;
  onChange: (id: string, field: keyof Omit<DrugEntry, "id">, value: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="relative mb-2 space-y-2 rounded-2xl border border-[#111214]/[0.05] bg-[#FEF0D5]/50 p-3"
    >
      <button
        type="button"
        onClick={() => onDelete(drug.id)}
        className="absolute right-2.5 top-2.5 rounded-lg p-1 text-[#111214]/25 transition hover:bg-white hover:text-[#111214]/60"
      >
        <Trash2 size={11} />
      </button>
      <input
        value={drug.name}
        onChange={(e) => onChange(drug.id, "name", e.target.value)}
        placeholder="Médicament ou soin..."
        className="w-full rounded-xl border border-[#111214]/8 bg-white/80 px-3 py-2 pr-7 text-[11.5px] text-[#111214] outline-none placeholder:text-[#111214]/30 focus:border-[#5B1112]/20 focus:bg-white transition-colors"
      />
      <div className="flex gap-2">
        <input
          value={drug.posologie}
          onChange={(e) => onChange(drug.id, "posologie", e.target.value)}
          placeholder="Posologie"
          className="min-w-0 flex-1 rounded-xl border border-[#111214]/8 bg-white/80 px-3 py-2 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/30 focus:border-[#5B1112]/20 focus:bg-white transition-colors"
        />
        <input
          value={drug.duree}
          onChange={(e) => onChange(drug.id, "duree", e.target.value)}
          placeholder="Durée"
          className="w-20 rounded-xl border border-[#111214]/8 bg-white/80 px-3 py-2 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/30 focus:border-[#5B1112]/20 focus:bg-white transition-colors"
        />
      </div>
    </motion.div>
  );
}

// ── Snippet Pill ───────────────────────────────────────────────────────────

function SnippetPill({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1 rounded-full border border-[#5B1112]/10 bg-[#5B1112]/[0.04] px-2.5 py-1 text-[9.5px] font-medium text-[#5B1112]/70 transition hover:border-[#5B1112]/18 hover:bg-[#5B1112]/[0.08]"
    >
      <Zap size={8} />
      {label}
    </motion.button>
  );
}

// ── Prescription Preview Modal ─────────────────────────────────────────────

function PrescriptionPreview({
  drugs,
  practitionerName,
  onClose,
}: {
  drugs: DrugEntry[];
  practitionerName: string;
  onClose: () => void;
}) {
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  const validDrugs = drugs.filter((d) => d.name.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[400px] max-w-[90vw] overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#111214]/30 transition hover:bg-[#111214]/5 hover:text-[#111214]"
        >
          <X size={16} />
        </button>
        <div className="p-7">
          <div className="mb-5 border-b border-[#111214]/8 pb-5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/50">
              Ordonnance médicale
            </p>
            <p className="mt-1 font-serif text-xl leading-tight text-[#111214]">{practitionerName}</p>
            <p className="text-[11px] text-[#111214]/40">Dermatologue · Melanis</p>
            <p className="mt-2 text-[11px] text-[#111214]/35">{today}</p>
          </div>
          <div className="space-y-4">
            {validDrugs.map((drug, i) => (
              <div key={drug.id}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold text-[#111214]/30">{i + 1}.</span>
                  <p className="text-[13px] font-semibold text-[#111214]">{drug.name}</p>
                </div>
                {drug.posologie ? (
                  <p className="ml-4 text-[11px] text-[#111214]/55">{drug.posologie}</p>
                ) : null}
                {drug.duree ? (
                  <p className="ml-4 text-[11px] text-[#111214]/38">Durée : {drug.duree}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-7 border-t border-[#111214]/8 pt-4">
            <p className="text-[9px] text-[#111214]/22">
              Ordonnance générée via Melanis · Usage médical uniquement
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────

export default function PractitionerTeledermInboxScreen() {
  const auth = useAuth();
  const navigate = useNavigate();

  // Case list
  const [cases, setCases] = useState<AsyncCaseRecord[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AsyncCaseDetailRecord | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Right panel
  const [activePanel, setActivePanel] = useState<ActivePanel | null>(null);

  // COMPLÉMENTS
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [complementMsg, setComplementMsg] = useState("");
  const [sendingComplement, setSendingComplement] = useState(false);

  // ORDONNANCE
  const [drugs, setDrugs] = useState<DrugEntry[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // RÉPONSE
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalSummary, setClinicalSummary] = useState("");
  const [responseBody, setResponseBody] = useState("");
  const [publishing, setPublishing] = useState(false);

  // ── Load all cases
  useEffect(() => {
    if (!auth.user) return;
    void auth.accountAdapter.listPractitionerAsyncCases(auth.user.id).then(setCases);
  }, [auth.accountAdapter, auth.user]);

  // ── Load case detail
  const loadDetail = useCallback(
    async (caseId: string) => {
      if (!auth.user) return;
      setLoadingDetail(true);
      try {
        const next = await auth.accountAdapter.getAsyncCase(auth.user.id, caseId);
        setDetail(next);
      } finally {
        setLoadingDetail(false);
      }
    },
    [auth.accountAdapter, auth.user],
  );

  useEffect(() => {
    if (!selectedCaseId) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedCaseId);
    // Reset panels when switching cases
    setActivePanel(null);
    setDiagnosis("");
    setClinicalSummary("");
    setResponseBody("");
    setDrugs([]);
    setSelectedPresets(new Set());
    setComplementMsg("");
  }, [selectedCaseId, loadDetail]);

  async function handleLogout() {
    await auth.logout();
    navigate("/patient-flow/auth/connexion");
  }

  async function handleClaim(caseId: string) {
    if (!auth.user) return;
    await auth.accountAdapter.claimAsyncCase(auth.user.id, caseId);
    if (selectedCaseId === caseId) await loadDetail(caseId);
    const next = await auth.accountAdapter.listPractitionerAsyncCases(auth.user.id);
    setCases(next);
  }

  async function handleClose(caseId: string) {
    if (!auth.user) return;
    await auth.accountAdapter.closeAsyncCase(auth.user.id, caseId);
    await loadDetail(caseId);
    const next = await auth.accountAdapter.listPractitionerAsyncCases(auth.user.id);
    setCases(next);
  }

  async function handleSendComplements() {
    if (!auth.user || !detail) return;
    const presetsText = Array.from(selectedPresets).join("\n- ");
    const fullBody = [
      presetsText ? `Merci de fournir :\n- ${presetsText}` : "",
      complementMsg.trim(),
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!fullBody.trim()) return;
    setSendingComplement(true);
    try {
      await auth.accountAdapter.requestMoreInfo({
        actorUserId: auth.user.id,
        caseId: detail.case.id,
        body: fullBody,
      });
      setSelectedPresets(new Set());
      setComplementMsg("");
      await loadDetail(detail.case.id);
    } finally {
      setSendingComplement(false);
    }
  }

  async function handlePublish() {
    if (!auth.user || !detail) return;
    setPublishing(true);
    try {
      const next = await auth.accountAdapter.respondToAsyncCase({
        actorUserId: auth.user.id,
        caseId: detail.case.id,
        diagnosis,
        clinicalSummary,
        body: responseBody,
        prescriptionItems: drugs
          .filter((d) => d.name.trim())
          .map((d) => ({
            name: d.name,
            instructions: [d.posologie, d.duree ? `Durée : ${d.duree}` : ""]
              .filter(Boolean)
              .join(" · "),
            isMedication: true,
          })),
      });
      setDetail(next);
      const updated = await auth.accountAdapter.listPractitionerAsyncCases(auth.user.id);
      setCases(updated);
    } finally {
      setPublishing(false);
    }
  }

  function togglePanel(panel: ActivePanel) {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }

  function addDrug() {
    setDrugs((prev) => [...prev, { id: crypto.randomUUID(), name: "", posologie: "", duree: "" }]);
  }
  function updateDrug(id: string, field: keyof Omit<DrugEntry, "id">, value: string) {
    setDrugs((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }
  function deleteDrug(id: string) {
    setDrugs((prev) => prev.filter((d) => d.id !== id));
  }

  // ── Derived data
  const displayed = filterCases(cases, filter);
  const urgentCount = cases.filter((c) =>
    ["submitted", "patient_replied"].includes(c.status),
  ).length;

  const questionnaire = (detail?.case.questionnaireData ?? {}) as Record<string, unknown>;
  const symptomsObj = (questionnaire.symptoms ?? {}) as Record<string, unknown>;
  const medicalObj = (questionnaire.medical ?? {}) as Record<string, unknown>;

  const bodyAreas = Array.isArray(questionnaire.bodyAreas)
    ? (questionnaire.bodyAreas as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const sensations = Array.isArray(symptomsObj.sensations)
    ? (symptomsObj.sensations as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const severity = typeof symptomsObj.severity === "number" ? symptomsObj.severity : 0;
  const duration = typeof symptomsObj.duration === "string" ? symptomsObj.duration : "";
  const evolution = typeof symptomsObj.evolution === "string" ? symptomsObj.evolution : "";
  const spreading = typeof symptomsObj.spreading === "string" ? symptomsObj.spreading : "";
  const previousTreatment =
    typeof medicalObj.previousTreatment === "string" ? medicalObj.previousTreatment : "";
  const allergies = typeof medicalObj.allergies === "string" ? medicalObj.allergies : "";
  const medications = typeof medicalObj.medications === "string" ? medicalObj.medications : "";
  const skinType = getSkinType(questionnaire);

  const canRespond = detail
    ? ["in_review", "patient_replied"].includes(detail.case.status)
    : false;
  const step1Done = diagnosis.trim().length >= 3;
  const step2Done = clinicalSummary.trim().length >= 12;
  const step3Done = responseBody.trim().length >= 12;
  const publishDisabled = !canRespond || !step1Done || !step2Done || !step3Done;
  const complementValid = selectedPresets.size > 0 || complementMsg.trim().length >= 4;

  return (
    <PractitionerDashboardLayout fullName={auth.user?.fullName ?? "Praticien"} onLogout={handleLogout}>
      <div className="flex flex-col gap-4" style={{ height: "calc(100svh - 7.5rem)" }}>
        {/* ── Top bar ── */}
        <div className="flex flex-shrink-0 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-[1.65rem] leading-none tracking-tight text-[#111214]">
              Télé-derm
            </h1>
            {urgentCount > 0 ? (
              <span className="rounded-full bg-[#5B1112] px-2.5 py-0.5 text-[11px] font-bold text-white">
                {urgentCount} urgent{urgentCount > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 rounded-full border border-white/70 bg-white/50 p-1 shadow-sm backdrop-blur-sm">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  filter === tab.key
                    ? "bg-[#111214] text-white shadow-sm"
                    : "text-[#111214]/42 hover:text-[#111214]/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3-column workspace ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/70 bg-white/40 shadow-[0_12px_40px_rgba(17,18,20,0.07)] backdrop-blur-md">
          {/* ── LEFT: case list ── */}
          <div className="flex w-[17rem] flex-shrink-0 flex-col overflow-hidden border-r border-[#111214]/[0.05]">
            <div className="flex-shrink-0 border-b border-[#111214]/[0.05] px-4 py-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                {displayed.length} dossier{displayed.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="space-y-1.5">
                {displayed.map((item) => {
                  const isSelected = selectedCaseId === item.id;
                  const ss = TELEDERM_STATUS_STYLES[item.status];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedCaseId(item.id)}
                      className={`w-full rounded-[1.25rem] p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-[#111214] shadow-md"
                          : "border border-[#111214]/[0.04] bg-white/50 hover:bg-white/80"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`mt-[3px] h-2 w-2 flex-shrink-0 rounded-full ${
                            isSelected ? "bg-white/60" : urgencyDotColor(item.status)
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-[12px] font-semibold leading-snug ${
                              isSelected ? "text-white" : "text-[#111214]"
                            }`}
                          >
                            {item.patientSummary || "Cas sans résumé"}
                          </p>
                          <p
                            className={`mt-0.5 truncate text-[10px] ${
                              isSelected ? "text-white/50" : "text-[#111214]/40"
                            }`}
                          >
                            {item.conditionKey ?? item.bodyArea ?? "Zone non précisée"}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${
                                isSelected ? "bg-white/14 text-white/75" : ss.tone
                              }`}
                            >
                              {TELEDERM_STATUS_LABELS[item.status]}
                            </span>
                            <span
                              className={`flex-shrink-0 text-[9px] ${
                                isSelected ? "text-white/35" : "text-[#111214]/25"
                              }`}
                            >
                              {formatTeledermDate(item.latestMessageAt ?? item.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {displayed.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[#111214]/10 py-10 text-center text-[11px] text-[#111214]/32">
                    Aucun dossier pour ce filtre.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* ── CENTER: clinical data ── */}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {!selectedCaseId || (!detail && !loadingDetail) ? (
              <div className="flex flex-1 items-center justify-center p-8">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-[#5B1112]/[0.06]">
                    <FileText size={22} className="text-[#5B1112]/38" />
                  </div>
                  <p className="text-sm font-medium text-[#111214]/42">Sélectionnez un dossier</p>
                  <p className="mt-1 text-[11px] text-[#111214]/26">
                    Les données cliniques apparaîtront ici.
                  </p>
                </div>
              </div>
            ) : loadingDetail ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex items-center gap-3 text-[12px] text-[#111214]/38">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#5B1112]/20 border-t-[#5B1112]" />
                  Chargement...
                </div>
              </div>
            ) : detail ? (
              <>
                {/* Sub-header */}
                <div className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-[#111214]/[0.05] px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const ss = TELEDERM_STATUS_STYLES[detail.case.status];
                        const Icon = ss.icon;
                        return (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ss.tone}`}
                          >
                            <Icon size={10} />
                            {TELEDERM_STATUS_LABELS[detail.case.status]}
                          </span>
                        );
                      })()}
                      {detail.case.bodyArea ? (
                        <span className="rounded-full bg-[#FEF0D5] px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#111214]/42">
                          {detail.case.bodyArea}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-[13px] font-semibold text-[#111214]">
                      {detail.case.patientSummary || "Cas télé-derm"}
                    </p>
                  </div>
                  {/* Action buttons */}
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    {["submitted", "patient_replied"].includes(detail.case.status) ? (
                      <button
                        type="button"
                        onClick={() => void handleClaim(detail.case.id)}
                        className="rounded-full bg-[#5B1112] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#7B2224]"
                      >
                        Réclamer
                      </button>
                    ) : null}
                    {detail.case.status === "responded" ? (
                      <button
                        type="button"
                        onClick={() => void handleClose(detail.case.id)}
                        className="rounded-full border border-[#111214]/10 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-[#111214]/55 transition hover:bg-white"
                      >
                        Clôturer
                      </button>
                    ) : null}
                    {canRespond ? (
                      <>
                        <button
                          type="button"
                          onClick={() => togglePanel("complements")}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                            activePanel === "complements"
                              ? "bg-[#111214] text-white"
                              : "border border-[#111214]/10 bg-white/80 text-[#111214]/60 hover:bg-white"
                          }`}
                        >
                          <MessageSquareMore size={12} />
                          Compléments
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePanel("ordonnance")}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                            activePanel === "ordonnance"
                              ? "bg-[#111214] text-white"
                              : "border border-[#111214]/10 bg-white/80 text-[#111214]/60 hover:bg-white"
                          }`}
                        >
                          <Pill size={12} />
                          Ordonnance
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePanel("reponse")}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                            activePanel === "reponse"
                              ? "bg-[#5B1112] text-white shadow-md shadow-[#5B1112]/25"
                              : "border border-[#5B1112]/15 bg-[#5B1112]/[0.04] text-[#5B1112] hover:bg-[#5B1112]/10"
                          }`}
                        >
                          <Send size={12} />
                          Réponse
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Clinical content */}
                <div className="flex-1 overflow-y-auto p-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                    {/* Left: body + severity + Fitzpatrick */}
                    <div className="space-y-3">
                      {/* Body mannequin */}
                      <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                          Localisation
                        </p>
                        <div className="flex items-start gap-3">
                          <div className="h-[110px] w-[70px] flex-shrink-0">
                            <BodyMannequin bodyAreas={bodyAreas} />
                          </div>
                          <div className="flex flex-1 flex-wrap gap-1.5 pt-1">
                            {bodyAreas.map((area) => (
                              <span
                                key={area}
                                className="rounded-full bg-[#5B1112]/[0.07] px-2.5 py-1 text-[10px] font-semibold text-[#5B1112]/70"
                              >
                                {BODY_AREA_LABELS[area] ?? area}
                              </span>
                            ))}
                            {bodyAreas.length === 0 ? (
                              <span className="text-[10px] italic text-[#111214]/28">
                                Non précisée
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Severity gauge */}
                      {severity > 0 ? (
                        <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                          <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                            Sévérité déclarée
                          </p>
                          <div className="h-14">
                            <SeverityGauge value={severity} />
                          </div>
                        </div>
                      ) : null}

                      {/* Fitzpatrick */}
                      {skinType ? (
                        <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                            Phototype Fitzpatrick
                          </p>
                          <FitzpatrickDisplay skinType={skinType} />
                        </div>
                      ) : null}
                    </div>

                    {/* Right: clinical details */}
                    <div className="space-y-3">
                      {/* Tableau clinique */}
                      {(sensations.length > 0 || spreading) ? (
                        <div className="rounded-[1.75rem] border border-[#5B1112]/[0.07] bg-gradient-to-br from-[#5B1112]/[0.025] to-[#FEF0D5]/60 p-4">
                          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/40">
                            Tableau clinique
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {sensations.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-[#5B1112]/10 bg-[#5B1112]/[0.06] px-2.5 py-1 text-[10.5px] font-semibold text-[#5B1112]/72"
                              >
                                {s}
                              </span>
                            ))}
                            {spreading ? (
                              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10.5px] font-semibold text-amber-700">
                                Extension : {spreading}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {/* Duration / Evolution */}
                      {(duration || evolution) ? (
                        <div className="grid grid-cols-2 gap-2">
                          {duration ? (
                            <div className="rounded-[1.5rem] border border-[#111214]/[0.05] bg-white/70 p-3">
                              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#111214]/25">
                                Durée
                              </p>
                              <p className="mt-1 text-[12.5px] font-semibold text-[#111214]/72">
                                {duration}
                              </p>
                            </div>
                          ) : null}
                          {evolution ? (
                            <div className="rounded-[1.5rem] border border-[#111214]/[0.05] bg-white/70 p-3">
                              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#111214]/25">
                                Évolution
                              </p>
                              <p className="mt-1 text-[12.5px] font-semibold text-[#111214]/72">
                                {evolution}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      {/* Medical context */}
                      {(previousTreatment || allergies || medications) ? (
                        <div className="grid gap-2 sm:grid-cols-3">
                          {[
                            { label: "Traitements antérieurs", value: previousTreatment },
                            { label: "Allergies", value: allergies },
                            { label: "Médicaments actuels", value: medications },
                          ]
                            .filter((item) => item.value)
                            .map((item) => (
                              <div
                                key={item.label}
                                className="rounded-[1.5rem] border border-[#111214]/[0.05] bg-white/70 p-3"
                              >
                                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#111214]/25">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-[11px] leading-relaxed text-[#111214]/62">
                                  {item.value}
                                </p>
                              </div>
                            ))}
                        </div>
                      ) : null}

                      {/* Photos */}
                      {detail.mediaAssets.length > 0 ? (
                        <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                              Photos cliniques
                            </p>
                            <span className="rounded-full bg-[#FEF0D5] px-2 py-0.5 text-[9.5px] font-semibold text-[#111214]/48">
                              {detail.mediaAssets.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 lg:grid-cols-4">
                            {detail.mediaAssets.map((asset) => (
                              <div
                                key={asset.id}
                                className="group overflow-hidden rounded-[1.25rem] border border-[#111214]/[0.04] shadow-sm"
                              >
                                <div className="relative aspect-square bg-[#FEF0D5]/70">
                                  {asset.downloadUrl ? (
                                    <img
                                      src={asset.downloadUrl}
                                      alt={asset.fileName}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center">
                                      <FileText size={14} className="text-[#111214]/20" />
                                    </div>
                                  )}
                                </div>
                                <div className="bg-white/80 px-2 py-1.5">
                                  <p className="truncate text-[9px] text-[#111214]/40">
                                    {formatTeledermDate(asset.uploadedAt ?? asset.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {/* Message thread */}
                      {detail.messages.length > 0 ? (
                        <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                            Fil d&apos;échange · {detail.messages.length}
                          </p>
                          <div className="space-y-2">
                            {detail.messages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`rounded-[1.25rem] p-3 ${
                                  msg.authorRole === "practitioner"
                                    ? "border border-[#5B1112]/10 bg-[#5B1112]/[0.04]"
                                    : "border border-[#111214]/[0.04] bg-[#FEF0D5]/50"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`text-[9px] font-bold uppercase tracking-wide ${
                                      msg.authorRole === "practitioner"
                                        ? "text-[#5B1112]/60"
                                        : "text-[#111214]/38"
                                    }`}
                                  >
                                    {msg.authorRole === "practitioner" ? "Vous" : "Patient"}
                                  </span>
                                  <span className="text-[9px] text-[#111214]/25">
                                    {formatTeledermDate(msg.createdAt)}
                                  </span>
                                </div>
                                {msg.body ? (
                                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#111214]/58">
                                    {msg.body}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* ── RIGHT: action panel ── */}
          <AnimatePresence>
            {activePanel && detail ? (
              <motion.div
                key="panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 310, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-shrink-0 flex-col overflow-hidden border-l border-[#111214]/[0.05]"
              >
                {/* Panel tabs + close */}
                <div className="flex flex-shrink-0 items-center gap-1 border-b border-[#111214]/[0.05] px-3 py-2.5">
                  <div className="flex flex-1 gap-0.5 rounded-xl bg-[#111214]/[0.04] p-0.5">
                    {(
                      [
                        { key: "complements", label: "Compléments" },
                        { key: "ordonnance", label: "Ordonnance" },
                        { key: "reponse", label: "Réponse" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActivePanel(tab.key)}
                        className={`flex-1 rounded-[0.6rem] py-1.5 text-[9.5px] font-bold uppercase tracking-wide transition-all duration-200 ${
                          activePanel === tab.key
                            ? "bg-white text-[#111214] shadow-sm"
                            : "text-[#111214]/35 hover:text-[#111214]/62"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePanel(null)}
                    className="ml-1 flex-shrink-0 rounded-lg p-1.5 text-[#111214]/25 transition hover:bg-[#111214]/5 hover:text-[#111214]/55"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Panel body */}
                <div className="flex-1 overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {/* ── COMPLÉMENTS ── */}
                  {activePanel === "complements" ? (
                    <div className="space-y-4">
                      <div>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                          Informations manquantes
                        </p>
                        <div className="space-y-1.5">
                          {COMPLEMENT_PRESETS.map((preset) => {
                            const checked = selectedPresets.has(preset);
                            return (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setSelectedPresets((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(preset)) next.delete(preset);
                                    else next.add(preset);
                                    return next;
                                  })
                                }
                                className={`flex w-full items-center gap-2.5 rounded-[1rem] border p-2.5 text-left text-[11px] transition-all ${
                                  checked
                                    ? "border-[#5B1112]/20 bg-[#5B1112]/[0.05] text-[#5B1112]/78"
                                    : "border-[#111214]/[0.04] bg-white/50 text-[#111214]/55 hover:border-[#111214]/8 hover:bg-white/70"
                                }`}
                              >
                                <div
                                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-md border transition-all ${
                                    checked
                                      ? "border-[#5B1112] bg-[#5B1112]"
                                      : "border-[#111214]/15 bg-white"
                                  }`}
                                >
                                  {checked ? (
                                    <Check size={9} className="text-white" strokeWidth={3} />
                                  ) : null}
                                </div>
                                {preset}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                          Message personnalisé
                        </p>
                        <textarea
                          value={complementMsg}
                          onChange={(e) => setComplementMsg(e.target.value)}
                          rows={3}
                          placeholder="Ajoutez une précision spécifique..."
                          className="w-full resize-none rounded-[1.25rem] border border-[#111214]/[0.06] bg-white/70 px-3 py-2.5 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/28 focus:border-[#5B1112]/15 focus:bg-white transition-colors"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleSendComplements()}
                        disabled={!complementValid || sendingComplement}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#1c1e21] disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {sendingComplement ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                        ) : (
                          <Send size={12} />
                        )}
                        Envoyer la demande
                      </button>
                    </div>
                  ) : null}

                  {/* ── ORDONNANCE ── */}
                  {activePanel === "ordonnance" ? (
                    <div className="space-y-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                        Médicaments prescrits
                      </p>
                      <AnimatePresence mode="sync">
                        {drugs.map((drug) => (
                          <DrugRow
                            key={drug.id}
                            drug={drug}
                            onChange={updateDrug}
                            onDelete={deleteDrug}
                          />
                        ))}
                      </AnimatePresence>
                      {drugs.length === 0 ? (
                        <div className="rounded-[1.25rem] border border-dashed border-[#111214]/10 py-6 text-center text-[10.5px] text-[#111214]/30">
                          Aucun médicament ajouté.
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={addDrug}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-[#111214]/10 bg-white/70 py-2.5 text-[11px] font-semibold text-[#111214]/60 transition hover:bg-white"
                      >
                        <Plus size={12} />
                        Ajouter un médicament
                      </button>
                      {drugs.some((d) => d.name.trim()) ? (
                        <button
                          type="button"
                          onClick={() => setShowPreview(true)}
                          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111214] py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#1c1e21]"
                        >
                          <FileText size={12} />
                          Aperçu de l&apos;ordonnance
                        </button>
                      ) : null}
                    </div>
                  ) : null}

                  {/* ── RÉPONSE ── */}
                  {activePanel === "reponse" ? (
                    <div className="space-y-4">
                      {/* Progress */}
                      <div
                        className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-semibold transition-all ${
                          step1Done && step2Done && step3Done
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-[#111214]/[0.04] text-[#111214]/38"
                        }`}
                      >
                        <div className="flex gap-1">
                          {[step1Done, step2Done, step3Done].map((done, i) => (
                            <div
                              key={i}
                              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                done ? "bg-emerald-500" : "bg-[#111214]/12"
                              }`}
                            />
                          ))}
                        </div>
                        {[step1Done, step2Done, step3Done].filter(Boolean).length}/3 sections
                      </div>

                      {/* Step 1: Diagnosis */}
                      <div>
                        <div
                          className={`mb-1.5 flex items-center gap-1.5 ${
                            step1Done ? "text-emerald-600" : "text-[#111214]/38"
                          }`}
                        >
                          {step1Done ? (
                            <Check size={11} strokeWidth={3} />
                          ) : (
                            <Stethoscope size={11} />
                          )}
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                            Impression diagnostique
                          </p>
                        </div>
                        <input
                          value={diagnosis}
                          onChange={(e) => setDiagnosis(e.target.value)}
                          placeholder="Ex : dermatite irritative, acné inflammatoire..."
                          className="w-full rounded-[1.25rem] border border-[#111214]/[0.06] bg-white/70 px-3 py-2.5 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/25 focus:border-[#5B1112]/15 focus:bg-white transition-colors"
                        />
                      </div>

                      {/* Step 2: Clinical summary */}
                      <div>
                        <div
                          className={`mb-1.5 flex items-center gap-1.5 ${
                            step2Done ? "text-emerald-600" : "text-[#111214]/38"
                          }`}
                        >
                          {step2Done ? (
                            <Check size={11} strokeWidth={3} />
                          ) : (
                            <FileText size={11} />
                          )}
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                            Synthèse clinique
                          </p>
                        </div>
                        <textarea
                          value={clinicalSummary}
                          onChange={(e) => setClinicalSummary(e.target.value)}
                          rows={4}
                          placeholder="Éléments cliniques saillants, niveau de confiance..."
                          className="w-full resize-none rounded-[1.25rem] border border-[#111214]/[0.06] bg-white/70 px-3 py-2.5 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/25 focus:border-[#5B1112]/15 focus:bg-white transition-colors"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {CLINICAL_SNIPPETS.map((s) => (
                            <SnippetPill
                              key={s.label}
                              label={s.label}
                              onClick={() => setClinicalSummary((c) => appendSnippet(c, s.text))}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Step 3: Patient message */}
                      <div>
                        <div
                          className={`mb-1.5 flex items-center gap-1.5 ${
                            step3Done ? "text-emerald-600" : "text-[#111214]/38"
                          }`}
                        >
                          {step3Done ? (
                            <Check size={11} strokeWidth={3} />
                          ) : (
                            <Send size={11} />
                          )}
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em]">
                            Message patient
                          </p>
                        </div>
                        <textarea
                          value={responseBody}
                          onChange={(e) => setResponseBody(e.target.value)}
                          rows={4}
                          placeholder="Conseils, recommandations, instructions..."
                          className="w-full resize-none rounded-[1.25rem] border border-[#111214]/[0.06] bg-white/70 px-3 py-2.5 text-[11px] text-[#111214] outline-none placeholder:text-[#111214]/25 focus:border-[#5B1112]/15 focus:bg-white transition-colors"
                        />
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {PATIENT_SNIPPETS.map((s) => (
                            <SnippetPill
                              key={s.label}
                              label={s.label}
                              onClick={() => setResponseBody((c) => appendSnippet(c, s.text))}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Publish */}
                      <button
                        type="button"
                        onClick={() => void handlePublish()}
                        disabled={publishDisabled || publishing}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-[#5B1112] to-[#7B2224] py-3 text-[11px] font-bold text-white shadow-md shadow-[#5B1112]/22 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        {publishing ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                        ) : (
                          <ArrowRight size={12} />
                        )}
                        Publier la réponse
                      </button>
                    </div>
                  ) : null}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Prescription preview modal */}
      {showPreview ? (
        <PrescriptionPreview
          drugs={drugs}
          practitionerName={auth.user?.fullName ?? "Praticien"}
          onClose={() => setShowPreview(false)}
        />
      ) : null}
    </PractitionerDashboardLayout>
  );
}
