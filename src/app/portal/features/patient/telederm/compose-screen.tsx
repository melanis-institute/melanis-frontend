import { useEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Eye,
  FileText,
  HelpCircle,
  Lock,
  MinusCircle,
  RefreshCw,
  Send,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import {
  IconAllergies,
  IconConsultation,
  IconMedicaments,
  IconGrossesse,
} from "@portal/features/patient/preconsult/components/historique-icons";
import {
  IconDemangeaisons,
  IconDouleur,
  IconBrulure,
  IconSaignement,
  IconSuintement,
  IconSecheresse,
  IconGonflement,
  IconRougeur,
  IconDesquamation,
} from "@portal/features/patient/preconsult/components/symptom-icons";
import { useNavigate } from "react-router";
import { MelaniaMascot } from "@portal/shared/components/MelaniaMascot";
import { useAuth } from "@portal/session/useAuth";
import type { AccountAdapter } from "@portal/domains/account/adapter.types";

type Step =
  | "concern"
  | "body-area"
  | "symptoms"
  | "photo-guide"
  | "photo-upload"
  | "photo-review"
  | "medical-history"
  | "consent"
  | "review"
  | "success";

const STEP_ORDER: Step[] = [
  "body-area",
  "symptoms",
  "photo-guide",
  "photo-upload",
  "photo-review",
  "medical-history",
  "consent",
  "review",
  "success",
];

const STEP_LABELS: Record<Step, string> = {
  "concern": "Motif de consultation",
  "body-area": "Zone corporelle",
  "symptoms": "Symptômes",
  "photo-guide": "Guide photo",
  "photo-upload": "Capture photos",
  "photo-review": "Révision photos",
  "medical-history": "Contexte médical",
  "consent": "Consentement",
  "review": "Récapitulatif",
  "success": "Dossier envoyé",
};

interface FlowData {
  concern: string;
  concernOther: string;
  bodyAreas: string[];
  symptoms: {
    duration: string;
    evolution: string;
    sensations: string[];
    severity: number;
    spreading: string;
    previousTreatment: string;
  };
  photos: {
    overview: string | null;
    medium: string | null;
    closeup: string | null;
  };
  medical: {
    skinType: string;
    allergies: string;
    previousDiagnosis: string;
    medications: string;
    pregnancy: string;
    chronicCondition: string;
  };
  consent: {
    caseReview: boolean;
    photoUse: boolean;
  };
}

interface PhotoFiles {
  overview: File | null;
  medium: File | null;
  closeup: File | null;
}

const INITIAL_DATA: FlowData = {
  concern: "",
  concernOther: "",
  bodyAreas: [],
  symptoms: {
    duration: "",
    evolution: "",
    sensations: [],
    severity: 5,
    spreading: "",
    previousTreatment: "",
  },
  photos: { overview: null, medium: null, closeup: null },
  medical: {
    skinType: "",
    allergies: "",
    previousDiagnosis: "",
    medications: "",
    pregnancy: "",
    chronicCondition: "",
  },
  consent: { caseReview: false, photoUse: false },
};

const stepVariants = {
  enter: (direction: number) => ({ x: direction * 36, opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({ x: direction * -36, opacity: 0, scale: 0.97 }),
};

// ── Concern colour palettes ────────────────────────────────────────────────
const CONCERN_PALETTES: Record<
  string,
  {
    idle: string;
    active: string;
    iconIdle: string;
    iconActive: string;
    dot: string;
  }
> = {
  acne: {
    idle: "border-amber-100 bg-amber-50/70",
    active: "border-amber-400 bg-amber-500 shadow-lg shadow-amber-400/25",
    iconIdle: "bg-amber-100 text-amber-600",
    iconActive: "bg-white/20 text-white",
    dot: "bg-amber-400",
  },
  taches: {
    idle: "border-stone-100 bg-stone-50/70",
    active: "border-stone-500 bg-stone-600 shadow-lg shadow-stone-500/20",
    iconIdle: "bg-stone-100 text-stone-600",
    iconActive: "bg-white/20 text-white",
    dot: "bg-stone-400",
  },
  irritation: {
    idle: "border-red-100 bg-red-50/70",
    active: "border-red-500 bg-red-500 shadow-lg shadow-red-400/25",
    iconIdle: "bg-red-100 text-red-500",
    iconActive: "bg-white/20 text-white",
    dot: "bg-red-400",
  },
  demangeaisons: {
    idle: "border-violet-100 bg-violet-50/70",
    active: "border-violet-500 bg-violet-600 shadow-lg shadow-violet-400/20",
    iconIdle: "bg-violet-100 text-violet-600",
    iconActive: "bg-white/20 text-white",
    dot: "bg-violet-400",
  },
  chevelure: {
    idle: "border-teal-100 bg-teal-50/70",
    active: "border-teal-600 bg-teal-600 shadow-lg shadow-teal-500/20",
    iconIdle: "bg-teal-100 text-teal-600",
    iconActive: "bg-white/20 text-white",
    dot: "bg-teal-400",
  },
  eruption: {
    idle: "border-rose-100 bg-rose-50/70",
    active: "border-rose-500 bg-rose-500 shadow-lg shadow-rose-400/20",
    iconIdle: "bg-rose-100 text-rose-500",
    iconActive: "bg-white/20 text-white",
    dot: "bg-rose-400",
  },
  ongles: {
    idle: "border-slate-100 bg-slate-50/70",
    active: "border-slate-500 bg-slate-600 shadow-lg shadow-slate-400/15",
    iconIdle: "bg-slate-100 text-slate-500",
    iconActive: "bg-white/20 text-white",
    dot: "bg-slate-400",
  },
  autre: {
    idle: "border-[#111214]/8 bg-white/70",
    active: "border-[#5B1112] bg-[#5B1112] shadow-lg shadow-[#5B1112]/25",
    iconIdle: "bg-[#5B1112]/8 text-[#5B1112]/60",
    iconActive: "bg-white/20 text-white",
    dot: "bg-[#5B1112]/50",
  },
};

const CONCERNS = [
  {
    id: "acne",
    label: "Acné & Boutons",
    desc: "Points noirs, kystes, comédons",
    icon: IconRougeur,
  },
  {
    id: "taches",
    label: "Taches & Hyperpig.",
    desc: "Taches brunes, mélasma, cicatrices",
    icon: IconDesquamation,
  },
  {
    id: "irritation",
    label: "Irritation & Rougeurs",
    desc: "Peau réactive, eczéma léger",
    icon: IconBrulure,
  },
  {
    id: "demangeaisons",
    label: "Démangeaisons",
    desc: "Prurit, urticaire, cuir chevelu",
    icon: IconDemangeaisons,
  },
  {
    id: "chevelure",
    label: "Chute de cheveux",
    desc: "Perte capillaire, zones clairsemées",
    icon: IconSecheresse,
  },
  {
    id: "eruption",
    label: "Éruption cutanée",
    desc: "Lésions, plaques, boutons diffus",
    icon: IconSuintement,
  },
  {
    id: "ongles",
    label: "Problème d'ongles",
    desc: "Mycose, fragilité, décoloration",
    icon: IconSaignement,
  },
  {
    id: "autre",
    label: "Autre",
    desc: "Décrivez votre situation",
    icon: IconDouleur,
  },
] as const;

const BODY_AREAS = [
  { id: "visage", label: "Visage", desc: "Joues, front, nez, menton" },
  { id: "cuir-chevelu", label: "Cuir chevelu", desc: "Zones capillaires, nuque" },
  { id: "bras", label: "Bras & Épaules", desc: "Avant-bras, coudes, épaules" },
  { id: "jambes", label: "Jambes & Pieds", desc: "Cuisses, genoux, chevilles" },
  { id: "torse", label: "Torse & Dos", desc: "Poitrine, ventre, dos" },
  { id: "intime", label: "Zone intime", desc: "Traitée avec discrétion totale" },
  { id: "ongles", label: "Ongles", desc: "Mains ou pieds" },
  { id: "autre", label: "Autre zone", desc: "Précisez au besoin" },
] as const;

const BODY_AREA_LABELS: Record<string, string> = Object.fromEntries(
  BODY_AREAS.map((item) => [item.id, item.label]),
);

const BODY_AREA_EMOJIS: Record<string, string> = {
  visage: "😊",
  "cuir-chevelu": "💆",
  bras: "💪",
  jambes: "🦵",
  torse: "👕",
  intime: "🔒",
  ongles: "💅",
  autre: "📌",
};

const PHOTO_TIPS = [
  {
    icon: "☀️",
    title: "Lumière naturelle",
    desc: "Approchez-vous d'une fenêtre. Évitez le flash et les éclairages artificiels colorés.",
  },
  {
    icon: "📐",
    title: "Distance adaptée",
    desc: "Variez les distances : lointaine, rapprochée, et en gros plan pour les détails.",
  },
  {
    icon: "🔍",
    title: "Mise au point nette",
    desc: "Assurez-vous que la zone concernée est parfaitement nette. Attendez la stabilisation.",
  },
] as const;

const PHOTO_SLOTS = [
  {
    key: "overview",
    label: "Vue d'ensemble",
    hint: "La zone concernée visible en contexte",
    sublabel: "Distance : 50–80 cm",
    captureKind: "context",
    emoji: "🌐",
  },
  {
    key: "medium",
    label: "Vue rapprochée",
    hint: "La lésion bien cadrée, bien nette",
    sublabel: "Distance : 20–30 cm",
    captureKind: "detail",
    emoji: "🔎",
  },
  {
    key: "closeup",
    label: "Gros plan",
    hint: "Les détails de texture et couleur",
    sublabel: "Distance : 5–10 cm",
    captureKind: "close",
    emoji: "🔬",
  },
] as const;

const SKIN_TYPES = [
  { id: "I-II", label: "Type I–II", desc: "Très claire, rosée" },
  { id: "III", label: "Type III", desc: "Claire à beige" },
  { id: "IV", label: "Type IV", desc: "Beige à mate" },
  { id: "V", label: "Type V", desc: "Brune" },
  { id: "VI", label: "Type VI", desc: "Très foncée" },
] as const;

const SYMPTOM_QUESTIONS = [
  {
    key: "duration",
    label: "Depuis quand observez-vous ces symptômes ?",
    type: "chips",
    options: [
      "Moins d'une semaine",
      "1 à 4 semaines",
      "1 à 6 mois",
      "Plus de 6 mois",
    ],
  },
  {
    key: "evolution",
    label: "Comment ont-ils évolué récemment ?",
    type: "chips",
    options: ["Stable", "En amélioration", "En aggravation", "Variable"],
  },
  {
    key: "sensations",
    label: "Quelles sensations ressentez-vous ?",
    type: "multi",
    options: [
      "Démangeaisons",
      "Douleur",
      "Brûlure",
      "Rougeur",
      "Sécheresse",
      "Saignement",
      "Gonflement",
      "Suintement",
      "Desquamation",
      "Aucune",
    ],
  },
  {
    key: "severity",
    label: "Quelle est l'intensité ? (1 = légère, 10 = très sévère)",
    type: "slider",
  },
  {
    key: "spreading",
    label: "La lésion évolue-t-elle géographiquement ?",
    type: "chips",
    options: ["Elle reste stable", "Elle s'étend", "Elle disparaît par endroits"],
  },
  {
    key: "previousTreatment",
    label: "Avez-vous essayé un traitement ?",
    type: "text",
    placeholder: "Crème, médicament, remède traditionnel... (facultatif)",
  },
] as const;

type SensationOption = (typeof SYMPTOM_QUESTIONS)[2]["options"][number];

const SENSATION_ICON_MAP: Record<
  SensationOption,
  React.ElementType | null
> = {
  Démangeaisons: IconDemangeaisons,
  Douleur: IconDouleur,
  Brûlure: IconBrulure,
  Rougeur: IconRougeur,
  Sécheresse: IconSecheresse,
  Saignement: IconSaignement,
  Gonflement: IconGonflement,
  Suintement: IconSuintement,
  Desquamation: IconDesquamation,
  Aucune: null,
};

const PHOTOTYPE_COLORS: Record<string, string> = {
  "I-II": "#FAD9C5",
  "III": "#EFBA8A",
  "IV": "#C8884E",
  "V": "#8A5424",
  "VI": "#4A2208",
};

const MEDICAL_QUESTIONS: Array<{
  key: keyof FlowData["medical"];
  type: "phototype" | "binary" | "pregnancy";
  label: string;
  subtitle: string;
  Icon: React.ElementType | null;
  placeholder?: string;
}> = [
  {
    key: "skinType",
    type: "phototype",
    label: "Quel est votre phototype ?",
    subtitle: "Aide à calibrer les recommandations selon votre teinte de peau naturelle.",
    Icon: null,
  },
  {
    key: "allergies",
    type: "binary",
    label: "Avez-vous des allergies connues ?",
    subtitle: "Médicaments, cosmétiques, aliments, latex...",
    Icon: IconAllergies,
    placeholder: "Ex : pénicilline, parfums synthétiques, nickel...",
  },
  {
    key: "previousDiagnosis",
    type: "binary",
    label: "Antécédent dermatologique ?",
    subtitle: "Diagnostic ou condition dermatologique déjà traitée.",
    Icon: IconConsultation,
    placeholder: "Ex : psoriasis, dermite atopique, eczéma chronique...",
  },
  {
    key: "medications",
    type: "binary",
    label: "Prenez-vous des médicaments ?",
    subtitle: "Traitements en cours, y compris topiques et remèdes traditionnels.",
    Icon: IconMedicaments,
    placeholder: "Ex : cortisone, antihistaminiques, isotrétinoïne...",
  },
  {
    key: "chronicCondition",
    type: "binary",
    label: "Avez-vous une condition chronique ?",
    subtitle: "Pouvant influencer votre peau ou limiter certains traitements.",
    Icon: null,
    placeholder: "Ex : diabète, asthme, lupus, maladie auto-immune...",
  },
  {
    key: "pregnancy",
    type: "pregnancy",
    label: "Grossesse ou allaitement ?",
    subtitle: "Cette information influence les recommandations thérapeutiques.",
    Icon: IconGrossesse,
  },
];

// ── Utility functions ──────────────────────────────────────────────────────

function createCaseReference(caseId: string | null) {
  if (!caseId) return "ML-EN-ATTENTE";
  return `ML-${new Date().getFullYear()}-${caseId.slice(-6).toUpperCase()}`;
}

function bodyAreaToBackendLabel(areaId: string) {
  if (areaId === "cuir-chevelu") return "Cuir chevelu";
  if (areaId === "torse") return "Corps";
  if (areaId === "bras") return "Corps";
  if (areaId === "jambes") return "Pieds";
  if (areaId === "intime") return "Zones intimes";
  return BODY_AREA_LABELS[areaId] ?? "Corps";
}

function buildPatientSummary(data: FlowData) {
  const bodyAreaLabel = data.bodyAreas.length
    ? data.bodyAreas.map((area) => BODY_AREA_LABELS[area] ?? area).join(", ")
    : "zone non précisée";
  const sensations = data.symptoms.sensations.length
    ? `Sensations: ${data.symptoms.sensations.join(", ")}.`
    : "";

  return [
    sensations,
    `Zone: ${bodyAreaLabel}.`,
    data.symptoms.duration ? `Depuis: ${data.symptoms.duration}.` : "",
    data.symptoms.evolution ? `Évolution: ${data.symptoms.evolution}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

async function uploadPhotoSlot(
  accountAdapter: AccountAdapter,
  actorUserId: string,
  caseId: string,
  bodyArea: string,
  conditionKey: string,
  slot: (typeof PHOTO_SLOTS)[number],
  file: File | null,
) {
  if (!file) return null;

  const result = await accountAdapter.createAsyncCaseUploadIntents({
    actorUserId,
    caseId,
    captureSessionId: `${slot.key}_${Date.now()}`,
    captureKind: slot.captureKind,
    bodyArea,
    conditionKey,
    files: [{ fileName: file.name, contentType: file.type || "image/jpeg" }],
  });
  const intent = result[0];
  if (!intent) {
    throw new Error("Intent de téléversement télé-derm manquant.");
  }

  const isMockUpload = intent.uploadUrl.startsWith("mock");
  if (!isMockUpload) {
    const response = await fetch(intent.uploadUrl, {
      method: intent.uploadMethod,
      headers: { "Content-Type": intent.contentType },
      body: file,
    });
    if (!response.ok) {
      throw new Error("Impossible de téléverser la photo.");
    }
  }

  return accountAdapter.completeAsyncCaseMediaUpload(actorUserId, intent.id);
}

// ── Illustration components ────────────────────────────────────────────────

function BodySilhouette({ selectedAreas }: { selectedAreas: string[] }) {
  const has = (area: string) => selectedAreas.includes(area);
  const SK = "#F4E8D2";      // skin
  const OL = "#BBA07A";      // outline
  const HR = "#C8A67A";      // hair
  const DT = "rgba(187,160,122,0.42)"; // detail lines
  const SF = "rgba(91,17,18,0.14)";   // selected fill
  const SS = "#7B2324";               // selected stroke

  const f = (z: string) => (has(z) ? SF : SK);
  const s = (z: string) => (has(z) ? SS : OL);
  const d = (z: string) => (has(z) ? "rgba(123,35,36,0.28)" : DT);

  return (
    <svg viewBox="0 0 260 444" fill="none" className="mx-auto w-40 drop-shadow-sm" aria-hidden>

      {/* ── HAIR ──────────────────────────────────────────────── */}
      <path
        d="M100 50
           C99 30 111 18 130 18
           C149 18 161 30 160 50
           C156 38 146 30 130 30
           C114 30 104 38 100 50Z"
        fill={has("cuir-chevelu") ? SF : HR}
        stroke={s("cuir-chevelu")}
        strokeWidth="1.6"
        className="transition-colors duration-300"
      />

      {/* ── HEAD / FACE ───────────────────────────────────────── */}
      <ellipse cx="130" cy="57" rx="27" ry="33"
        fill={f("visage")} stroke={s("visage")} strokeWidth="2"
        className="transition-colors duration-300"
      />

      {/* ── NECK (fills gap head→torso) ───────────────────────── */}
      <path d="M116 88 L144 88 L146 104 L114 104Z"
        fill={f("torse")} stroke="none"
        className="transition-colors duration-300"
      />

      {/* ── LEFT ARM ──────────────────────────────────────────── */}
      {/* Outer path: shoulder → elbow → wrist → hand → back up inner edge */}
      <path
        d="M78 112
           C70 112 60 116 52 126
           C46 134 44 150 44 168
           L44 222
           C44 238 46 252 48 264
           C50 272 52 280 52 286
           C52 294 55 301 62 304
           C69 307 75 302 77 296
           C79 289 77 280 75 272
           C73 262 73 246 73 230
           L73 188
           C75 166 79 146 83 128
           C85 120 83 114 78 112Z"
        fill={f("bras")} stroke={s("bras")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* ── RIGHT ARM ─────────────────────────────────────────── */}
      <path
        d="M182 112
           C190 112 200 116 208 126
           C214 134 216 150 216 168
           L216 222
           C216 238 214 252 212 264
           C210 272 208 280 208 286
           C208 294 205 301 198 304
           C191 307 185 302 183 296
           C181 289 183 280 185 272
           C187 262 187 246 187 230
           L187 188
           C185 166 181 146 177 128
           C175 120 177 114 182 112Z"
        fill={f("bras")} stroke={s("bras")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* ── TORSO ─────────────────────────────────────────────── */}
      {/* Neck base → shoulders → sides (waist taper) → hips → briefs top */}
      <path
        d="M114 104
           C104 106 90 112 78 120
           C74 123 73 126 75 130
           C79 116 81 116 83 120
           C87 138 89 160 89 182
           C89 200 87 214 85 224
           C83 232 82 240 84 250
           C86 260 92 268 106 272
           L154 272
           C168 268 174 260 176 250
           C178 240 177 232 175 224
           C173 214 171 200 171 182
           C171 160 173 138 177 120
           C179 116 181 116 185 130
           C187 126 186 123 182 120
           C170 112 156 106 146 104Z"
        fill={f("torse")} stroke={s("torse")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />

      {/* ── BRIEFS / INTIME ───────────────────────────────────── */}
      <path
        d="M106 272
           C98 264 88 256 84 248
           C82 256 84 266 92 276
           C102 284 116 288 130 288
           C144 288 158 284 168 276
           C176 266 178 256 176 248
           C172 256 162 264 154 272Z"
        fill={has("intime") ? "rgba(0,65,94,0.14)" : SK}
        stroke={has("intime") ? "#00415E" : OL}
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      {/* Waistband line */}
      <path d="M106 272 C114 276 122 278 130 278 C138 278 146 276 154 272"
        stroke={has("intime") ? "#00415E" : DT}
        strokeWidth="1.2" strokeLinecap="round"
      />

      {/* ── LEFT LEG ──────────────────────────────────────────── */}
      <path
        d="M106 272
           C98 274 90 282 87 295
           L85 323
           C85 335 85 343 87 354
           C91 370 93 388 93 404
           C93 414 91 422 89 430
           C87 436 91 440 101 440
           L122 440
           C130 440 132 436 131 430
           C130 424 126 415 123 406
           C120 394 120 378 120 362
           C120 345 118 328 116 314
           L114 295
           C112 283 110 275 106 272Z"
        fill={f("jambes")} stroke={s("jambes")} strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />

      {/* ── RIGHT LEG ─────────────────────────────────────────── */}
      <path
        d="M154 272
           C162 274 170 282 173 295
           L175 323
           C175 335 175 343 173 354
           C169 370 167 388 167 404
           C167 414 169 422 171 430
           C173 436 169 440 159 440
           L138 440
           C130 440 128 436 129 430
           C130 424 134 415 137 406
           C140 394 140 378 140 362
           C140 345 142 328 144 314
           L146 295
           C148 283 150 275 154 272Z"
        fill={f("jambes")} stroke={s("jambes")} strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />

      {/* ── DETAIL LINES ──────────────────────────────────────── */}

      {/* Sternum / center line */}
      <path d="M130 106 L130 224"
        stroke={d("torse")} strokeWidth="1.2" strokeLinecap="round"
      />

      {/* Left pec arc */}
      <path d="M93 130 C101 126 112 126 121 130"
        stroke={d("torse")} strokeWidth="1.1" strokeLinecap="round"
      />
      {/* Right pec arc */}
      <path d="M139 130 C148 126 159 126 167 130"
        stroke={d("torse")} strokeWidth="1.1" strokeLinecap="round"
      />

      {/* Abs row 1 */}
      <path d="M118 162 C121 159 126 159 130 159 C134 159 139 159 142 162"
        stroke={d("torse")} strokeWidth="1" strokeLinecap="round"
      />
      {/* Abs row 2 */}
      <path d="M118 184 C121 181 126 181 130 181 C134 181 139 181 142 184"
        stroke={d("torse")} strokeWidth="1" strokeLinecap="round"
      />

      {/* Left knee cap */}
      <ellipse cx="100" cy="342" rx="13" ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={s("jambes")} strokeWidth="1.2"
        className="transition-colors duration-300"
      />
      {/* Right knee cap */}
      <ellipse cx="160" cy="342" rx="13" ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={s("jambes")} strokeWidth="1.2"
        className="transition-colors duration-300"
      />

      {/* Left elbow crease */}
      <path d="M48 224 C50 230 52 234 54 238"
        stroke={has("bras") ? "rgba(122,35,36,0.2)" : DT}
        strokeWidth="1" strokeLinecap="round"
      />
      {/* Right elbow crease */}
      <path d="M212 224 C210 230 208 234 206 238"
        stroke={has("bras") ? "rgba(122,35,36,0.2)" : DT}
        strokeWidth="1" strokeLinecap="round"
      />

      {/* Nail / finger accent left hand */}
      <path d="M55 292 C56 298 58 302 62 304"
        stroke={has("ongles") ? SS : OL}
        strokeWidth={has("ongles") ? 1.8 : 1.1}
        strokeLinecap="round"
      />
      {/* Nail / finger accent right hand */}
      <path d="M205 292 C204 298 202 302 198 304"
        stroke={has("ongles") ? SS : OL}
        strokeWidth={has("ongles") ? 1.8 : 1.1}
        strokeLinecap="round"
      />
      {/* Toe accent left */}
      <path d="M100 436 C104 439 110 440 116 440"
        stroke={has("ongles") ? SS : OL}
        strokeWidth={has("ongles") ? 1.8 : 1.1}
        strokeLinecap="round"
      />
      {/* Toe accent right */}
      <path d="M160 436 C156 439 150 440 144 440"
        stroke={has("ongles") ? SS : OL}
        strokeWidth={has("ongles") ? 1.8 : 1.1}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneCameraIllustration({ filled = 0 }: { filled?: number }) {
  return (
    <div className="relative mx-auto flex h-56 w-36 items-center justify-center">
      {/* Phone body */}
      <div className="absolute inset-0 rounded-[2.2rem] border-[3px] border-[#111214]/12 bg-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-sm" />
      {/* Speaker */}
      <div className="absolute top-3 left-1/2 h-1.5 w-8 -translate-x-1/2 rounded-full bg-[#111214]/10" />
      {/* Screen / viewfinder */}
      <div className="absolute inset-x-3 bottom-8 top-7 rounded-[1.75rem] bg-[#111214]/5 overflow-hidden">
        {/* Corner focus brackets */}
        <div className="absolute top-4 left-4 h-5 w-5 border-t-2 border-l-2 border-[#5B1112]/50 rounded-tl-sm" />
        <div className="absolute top-4 right-4 h-5 w-5 border-t-2 border-r-2 border-[#5B1112]/50 rounded-tr-sm" />
        <div className="absolute bottom-4 left-4 h-5 w-5 border-b-2 border-l-2 border-[#5B1112]/50 rounded-bl-sm" />
        <div className="absolute bottom-4 right-4 h-5 w-5 border-b-2 border-r-2 border-[#5B1112]/50 rounded-br-sm" />
        {/* Center focus dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-5 w-5 rounded-full border border-[#5B1112]/40"
          />
        </div>
        {/* Photo count indicator */}
        {filled > 0 ? (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                  i < filled ? "bg-[#5B1112]" : "bg-[#111214]/20"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      {/* Home button */}
      <div className="absolute bottom-2.5 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full border border-[#111214]/15 bg-white/60" />
    </div>
  );
}

function SkinTextureIllustration() {
  return (
    <div className="relative mx-auto h-32 w-full overflow-hidden rounded-[2rem]"
      style={{ background: "linear-gradient(135deg, #FEF0D5 0%, #fde4b8 50%, #f5d5a0 100%)" }}
    >
      {/* Abstract skin molecules */}
      {[
        { cx: 22, cy: 40, r: 18, op: 0.12 },
        { cx: 60, cy: 25, r: 24, op: 0.1 },
        { cx: 85, cy: 55, r: 20, op: 0.14 },
        { cx: 15, cy: 80, r: 14, op: 0.09 },
        { cx: 45, cy: 72, r: 16, op: 0.11 },
        { cx: 75, cy: 85, r: 12, op: 0.08 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#5B1112]"
          style={{
            left: `${dot.cx}%`,
            top: `${dot.cy}%`,
            width: dot.r * 2,
            height: dot.r * 2,
            opacity: dot.op,
            translateX: "-50%",
            translateY: "-50%",
          }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="rounded-[1.5rem] border border-white/60 bg-white/50 px-5 py-3 backdrop-blur-sm">
          <p className="text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-[#5B1112]/65">
            Télé-Dermatologie Async
          </p>
          <p className="mt-0.5 text-center font-serif text-sm text-[#111214]/70">
            Votre dermatologue vous répond sous 48h
          </p>
        </div>
      </div>
    </div>
  );
}

function ShieldIllustration() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-[#00415E]/5"
      />
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        className="absolute inset-4 rounded-full bg-[#00415E]/8"
      />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#00415E]/10">
        <Shield size={32} className="text-[#00415E]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

function ReviewIllustration() {
  return (
    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-[#5B1112]/5" />
      <div className="absolute inset-4 rounded-full bg-[#5B1112]/8" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#5B1112]/10">
        <FileText size={28} className="text-[#5B1112]" strokeWidth={1.5} />
      </div>
    </div>
  );
}

// ── Shared UI components ────────────────────────────────────────────────────

function StepTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
        {eyebrow}
      </p>
      <h2
        className="mb-2 font-serif text-[#111214]"
        style={{ fontSize: 24, lineHeight: 1.2 }}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="text-xs leading-relaxed text-[#111214]/50">{subtitle}</p>
      ) : null}
    </div>
  );
}

function ContinueButton({
  label = "Continuer",
  onClick,
  disabled = false,
  icon: Icon = ArrowRight,
}: {
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: ElementType;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.015, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.975 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`mt-6 flex w-full items-center justify-center gap-2.5 rounded-[1.5rem] py-4 text-sm font-semibold transition-all duration-200 ${
        disabled
          ? "cursor-not-allowed bg-[#111214]/[0.06] text-[#111214]/22"
          : "bg-gradient-to-br from-[#5B1112] to-[#7B2224] text-white shadow-lg shadow-[#5B1112]/30 hover:shadow-xl hover:shadow-[#5B1112]/35"
      }`}
    >
      <span>{label}</span>
      <Icon size={15} strokeWidth={2.2} />
    </motion.button>
  );
}

function Chip({
  label,
  selected,
  onClick,
  multi = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  multi?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-[1rem] border px-4 py-2.5 text-xs font-medium transition-all duration-200 ${
        selected
          ? "border-[#5B1112] bg-[#5B1112] text-white shadow-md shadow-[#5B1112]/20"
          : "border-white bg-white/70 text-[#111214]/65 hover:border-[#5B1112]/20 hover:bg-white"
      }`}
    >
      <span className="flex items-center gap-1.5">
        {multi && selected ? <Check size={10} /> : null}
        {label}
      </span>
    </motion.button>
  );
}

function SensationCard({
  label,
  selected,
  onClick,
}: {
  label: SensationOption;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = SENSATION_ICON_MAP[label];
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.90 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3.5 transition-all duration-200 ${
        selected
          ? "border-[#5B1112]/20 bg-gradient-to-br from-[#5B1112] to-[#7B2224] text-white shadow-xl shadow-[#5B1112]/25"
          : "border-white/90 bg-white/85 text-[#111214]/45 shadow-sm hover:border-[#5B1112]/15 hover:bg-white hover:text-[#5B1112]/70 hover:shadow-md"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
          selected ? "bg-white/15" : "bg-[#5B1112]/6"
        }`}
      >
        {Icon ? (
          <Icon className="h-6 w-6" />
        ) : (
          <MinusCircle size={24} />
        )}
      </div>
      <span className="text-center text-[10px] font-semibold leading-tight">{label}</span>
      {selected ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/35"
        >
          <Check size={8} strokeWidth={3.5} />
        </motion.div>
      ) : null}
    </motion.button>
  );
}

// ── Step: Concern ──────────────────────────────────────────────────────────

function StepConcern({
  data,
  onUpdate,
  onNext,
}: {
  data: FlowData;
  onUpdate: (updates: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  return (
    <div>
      {/* Hero illustration */}
      <div className="mb-6 overflow-hidden rounded-[2rem]">
        <SkinTextureIllustration />
      </div>

      <StepTitle
        eyebrow="Motif de consultation"
        title="Qu'est-ce qui vous préoccupe ?"
        subtitle="Sélectionnez le motif principal. Votre dermatologue pourra aborder d'autres points lors de la revue."
      />

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {CONCERNS.map((concern) => {
          const palette = CONCERN_PALETTES[concern.id] ?? CONCERN_PALETTES["autre"];
          const isSelected = data.concern === concern.id;
          const Icon = concern.icon;

          return (
            <motion.button
              key={concern.id}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onUpdate({ concern: concern.id, concernOther: "" })}
              className={`relative w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                isSelected ? palette.active : palette.idle
              }`}
            >
              {/* Color dot */}
              <div className={`absolute right-3 top-3 h-2 w-2 rounded-full ${
                isSelected ? "bg-white/60" : palette.dot
              }`} />

              <div
                className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-[0.9rem] transition-all ${
                  isSelected ? palette.iconActive : palette.iconIdle
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>

              <p className={`text-sm font-medium leading-snug ${isSelected ? "text-white" : "text-[#111214]"}`}>
                {concern.label}
              </p>
              <p className={`mt-0.5 text-[10px] leading-relaxed ${
                isSelected ? "text-white/55" : "text-[#111214]/38"
              }`}>
                {concern.desc}
              </p>

              {isSelected ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white/25"
                >
                  <Check size={11} className="text-white" />
                </motion.div>
              ) : null}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {data.concern === "autre" ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-2 overflow-hidden"
          >
            <textarea
              rows={2}
              placeholder="Décrivez brièvement votre préoccupation..."
              value={data.concernOther}
              onChange={(event) => onUpdate({ concernOther: event.target.value })}
              className="w-full resize-none rounded-[1.25rem] border border-white bg-white/80 px-4 py-3 text-sm text-[#111214] outline-none transition-colors placeholder:text-[#111214]/30 focus:border-[#5B1112]/20"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ContinueButton
        onClick={onNext}
        disabled={!data.concern || (data.concern === "autre" && !data.concernOther.trim())}
      />
    </div>
  );
}

// ── Step: Body Area ────────────────────────────────────────────────────────

function StepBodyArea({
  data,
  onUpdate,
  onNext,
}: {
  data: FlowData;
  onUpdate: (updates: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const toggleArea = (areaId: string) => {
    const next = data.bodyAreas.includes(areaId)
      ? data.bodyAreas.filter((item) => item !== areaId)
      : [...data.bodyAreas, areaId];
    onUpdate({ bodyAreas: next });
  };

  return (
    <div>
      <StepTitle
        eyebrow="Zone corporelle"
        title="Où se situe la zone concernée ?"
        subtitle="Vous pouvez sélectionner plusieurs zones. Cela aide votre dermatologue à orienter son analyse."
      />

      {/* Body silhouette illustration */}
      <div className="mb-6 flex items-center justify-center gap-8 overflow-hidden rounded-[2rem] border border-white bg-white/50 py-6 shadow-sm backdrop-blur-sm">
        <BodySilhouette selectedAreas={data.bodyAreas} />
        {data.bodyAreas.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-1.5"
          >
            {data.bodyAreas.slice(0, 4).map((area) => (
              <div key={area} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-[#5B1112]" />
                <span className="text-xs text-[#111214]/60">
                  {BODY_AREA_LABELS[area] ?? area}
                </span>
              </div>
            ))}
            {data.bodyAreas.length > 4 ? (
              <span className="text-[10px] text-[#111214]/35">
                +{data.bodyAreas.length - 4} autre{data.bodyAreas.length - 4 > 1 ? "s" : ""}
              </span>
            ) : null}
          </motion.div>
        ) : (
          <p className="text-xs text-[#111214]/30 italic">
            Sélectionnez une zone<br />à gauche
          </p>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2.5">
        {BODY_AREAS.map((area) => (
          <div key={area.id} className="relative">
            {area.id === "intime" ? (
              <div className="absolute right-3 top-3 z-10">
                <Lock
                  size={11}
                  className={
                    data.bodyAreas.includes(area.id) ? "text-white/60" : "text-[#00415E]/40"
                  }
                />
              </div>
            ) : null}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleArea(area.id)}
              className={`relative w-full rounded-[1.5rem] border p-4 text-left transition-all duration-200 ${
                data.bodyAreas.includes(area.id)
                  ? area.id === "intime"
                    ? "border-[#00415E]/60 bg-gradient-to-br from-[#00415E] to-[#005a80] shadow-lg shadow-[#00415E]/20"
                    : "border-[#5B1112]/30 bg-gradient-to-br from-[#5B1112] to-[#7B2224] shadow-lg shadow-[#5B1112]/22"
                  : area.id === "intime"
                    ? "border-[#00415E]/15 bg-white/80 shadow-sm hover:border-[#00415E]/30 hover:bg-white hover:shadow-md"
                    : "border-white/90 bg-white/80 shadow-sm hover:border-[#5B1112]/15 hover:bg-white hover:shadow-md"
              }`}
            >
              <span className="mb-2 block text-xl">{BODY_AREA_EMOJIS[area.id]}</span>
              <p className={`text-sm font-semibold leading-snug ${
                data.bodyAreas.includes(area.id) ? "text-white" : "text-[#111214]"
              }`}>
                {area.label}
              </p>
              <p className={`mt-0.5 text-[10px] leading-relaxed ${
                data.bodyAreas.includes(area.id) ? "text-white/55" : "text-[#111214]/35"
              }`}>
                {area.desc}
              </p>
              {data.bodyAreas.includes(area.id) ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white/25"
                >
                  <Check size={11} className="text-white" strokeWidth={2.5} />
                </motion.div>
              ) : null}
            </motion.button>
          </div>
        ))}
      </div>

      {data.bodyAreas.includes("intime") ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-[1.25rem] border border-[#00415E]/10 bg-[#00415E]/4 p-4"
        >
          <Shield size={14} className="mt-0.5 flex-shrink-0 text-[#00415E]/60" />
          <p className="text-[10px] leading-relaxed text-[#111214]/50">
            Vos photos et informations relatives aux zones intimes sont traitées avec une
            confidentialité renforcée. Seul votre dermatologue assigné y aura accès.
          </p>
        </motion.div>
      ) : null}

      <ContinueButton onClick={onNext} disabled={data.bodyAreas.length === 0} />
    </div>
  );
}

// ── Step: Symptoms ─────────────────────────────────────────────────────────

function StepSymptoms({
  data,
  onUpdate,
  onNext,
}: {
  data: FlowData;
  onUpdate: (updates: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const [subStep, setSubStep] = useState(0);
  const currentQuestion = SYMPTOM_QUESTIONS[subStep];

  const getValue = () => {
    return data.symptoms[currentQuestion.key];
  };

  const setValue = (value: string | number | string[]) => {
    onUpdate({
      symptoms: {
        ...data.symptoms,
        [currentQuestion.key]: value,
      },
    });
  };

  const toggleMultiValue = (value: string) => {
    const next = data.symptoms.sensations.includes(value)
      ? data.symptoms.sensations.filter((item) => item !== value)
      : [...data.symptoms.sensations, value];
    onUpdate({ symptoms: { ...data.symptoms, sensations: next } });
  };

  const canAdvance = () => {
    if (currentQuestion.type === "chips") return Boolean(getValue());
    if (currentQuestion.type === "multi") return data.symptoms.sensations.length > 0;
    if (currentQuestion.type === "slider") return true;
    return true;
  };

  const handleNext = () => {
    if (subStep < SYMPTOM_QUESTIONS.length - 1) {
      setSubStep((value) => value + 1);
      return;
    }
    onNext();
  };

  return (
    <div>
      <StepTitle
        eyebrow="Questions ciblées"
        title="Quelques précisions utiles"
        subtitle="Répondez à quelques questions pour aider votre dermatologue à qualifier votre cas."
      />

      {/* Sub-step progress dots */}
      <div className="mb-5 flex items-center gap-2">
        {SYMPTOM_QUESTIONS.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              width: index === subStep ? 20 : 6,
              opacity: index <= subStep ? 1 : 0.3,
            }}
            transition={{ duration: 0.3 }}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              index < subStep
                ? "bg-[#5B1112]"
                : index === subStep
                  ? "bg-[#5B1112]"
                  : "bg-[#111214]/12"
            }`}
          />
        ))}
        <span className="ml-1 text-[9px] uppercase tracking-wider text-[#111214]/30">
          {subStep + 1}/{SYMPTOM_QUESTIONS.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-sm backdrop-blur-sm"
        >
          {/* Question number badge */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#5B1112]/8 px-3 py-1">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-[#5B1112]/60">
              Question {subStep + 1}
            </span>
          </div>

          <p className="mb-4 text-sm font-medium leading-snug text-[#111214]">
            {currentQuestion.label}
          </p>

          {currentQuestion.type === "chips" ? (
            <div className="flex flex-wrap gap-2">
              {currentQuestion.options.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={getValue() === option}
                  onClick={() => setValue(option)}
                />
              ))}
            </div>
          ) : null}

          {currentQuestion.type === "multi" ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {currentQuestion.options.map((option) => (
                <SensationCard
                  key={option}
                  label={option as SensationOption}
                  selected={data.symptoms.sensations.includes(option)}
                  onClick={() => toggleMultiValue(option)}
                />
              ))}
            </div>
          ) : null}

          {currentQuestion.type === "slider" ? (
            <div className="px-1">
              <div className="mb-3 flex justify-between">
                <span className="text-[10px] text-[#111214]/40">Légère</span>
                <div className="text-center">
                  <motion.span
                    key={data.symptoms.severity}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="font-serif text-[#5B1112]"
                    style={{ fontSize: 32 }}
                  >
                    {data.symptoms.severity}
                  </motion.span>
                  <span className="text-xs text-[#111214]/35">/10</span>
                </div>
                <span className="text-[10px] text-[#111214]/40">Sévère</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={data.symptoms.severity}
                onChange={(event) => setValue(Number(event.target.value))}
                className="w-full cursor-pointer accent-[#5B1112]"
              />
              <div className="mt-2 flex justify-between px-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 w-1 rounded-full transition-colors ${
                      i < data.symptoms.severity ? "bg-[#5B1112]/50" : "bg-[#111214]/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {currentQuestion.type === "text" ? (
            <textarea
              rows={3}
              placeholder={currentQuestion.placeholder}
              value={data.symptoms.previousTreatment}
              onChange={(event) => setValue(event.target.value)}
              className="w-full resize-none rounded-[1.25rem] border border-[#111214]/6 bg-[#FEF0D5]/40 px-4 py-3 text-sm text-[#111214] outline-none transition-colors placeholder:text-[#111214]/25 focus:border-[#5B1112]/20"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
        {subStep > 0 ? (
          <button
            type="button"
            onClick={() => setSubStep((value) => value - 1)}
            className="text-[10px] text-[#111214]/40 transition-colors hover:text-[#111214]/70"
          >
            ← Précédent
          </button>
        ) : (
          <div />
        )}
        <div />
      </div>

      <ContinueButton
        label={
          subStep < SYMPTOM_QUESTIONS.length - 1
            ? "Question suivante"
            : "Continuer vers les photos"
        }
        onClick={handleNext}
        disabled={!canAdvance()}
      />
    </div>
  );
}

// ── Step: Photo Guide ──────────────────────────────────────────────────────

function StepPhotoGuide({ onNext }: { onNext: () => void }) {
  return (
    <div>
      <StepTitle
        eyebrow="Guide photo"
        title="Préparez vos photos"
        subtitle="Des images de qualité permettent une analyse dermatologique précise. Voici comment les réussir."
      />

      {/* Phone illustration */}
      <div className="mb-6 flex items-center justify-center gap-6 overflow-hidden rounded-[2rem] border border-white bg-white/50 py-5">
        <PhoneCameraIllustration />
        <div className="flex flex-col gap-2.5 pr-2">
          {[
            { num: "1", label: "Lumière naturelle", color: "bg-amber-50 border-amber-100 text-amber-600" },
            { num: "2", label: "Distance adaptée", color: "bg-sky-50 border-sky-100 text-sky-600" },
            { num: "3", label: "Mise au point nette", color: "bg-emerald-50 border-emerald-100 text-emerald-600" },
          ].map((item) => (
            <div key={item.num} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 ${item.color}`}>
              <span className="text-[9px] font-bold">{item.num}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mb-5 space-y-3">
        {PHOTO_TIPS.map((tip, index) => (
          <motion.div
            key={tip.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.35 }}
            className="flex items-start gap-4 rounded-[1.5rem] border border-white bg-white/70 p-4 shadow-sm"
          >
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1rem] bg-[#FEF0D5] text-xl">
              {tip.icon}
            </div>
            <div>
              <p className="mb-0.5 text-sm font-medium text-[#111214]">{tip.title}</p>
              <p className="text-[10px] leading-relaxed text-[#111214]/45">{tip.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Photos needed */}
      <div className="mb-5 rounded-[1.5rem] border border-[#FEF0D5] bg-[#FEF0D5]/60 p-5">
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          3 photos demandées
        </p>
        <div className="space-y-2.5">
          {PHOTO_SLOTS.map((slot, index) => (
            <div key={slot.key} className="flex items-center gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl bg-[#5B1112]/10">
                <span className="text-[10px] font-bold text-[#5B1112]/65">{index + 1}</span>
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#111214]/70">{slot.label}</p>
                <p className="text-[10px] text-[#111214]/40">{slot.hint}</p>
              </div>
              <span className="ml-auto text-base">{slot.emoji}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-start gap-3 rounded-[1.25rem] border border-[#00415E]/10 bg-[#00415E]/4 p-4">
        <Shield size={14} className="mt-0.5 flex-shrink-0 text-[#00415E]/55" />
        <p className="text-[10px] leading-relaxed text-[#111214]/45">
          Vos photos sont chiffrées de bout en bout et accessibles uniquement à votre
          dermatologue. Elles ne sont jamais utilisées à des fins commerciales.
        </p>
      </div>

      <ContinueButton label="Commencer la capture" onClick={onNext} icon={Camera} />
    </div>
  );
}

// ── Photo Slot ─────────────────────────────────────────────────────────────

function PhotoSlot({
  slot,
  photoUrl,
  onUpload,
  index,
}: {
  slot: (typeof PHOTO_SLOTS)[number];
  photoUrl: string | null;
  onUpload: (file: File, url: string) => void;
  index?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onUpload(file, URL.createObjectURL(file));
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }}
        className="sr-only"
      />
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => inputRef.current?.click()}
        className={`relative w-full overflow-hidden rounded-[2rem] transition-all ${
          photoUrl
            ? "border border-[#5B1112]/12 shadow-md"
            : "border-2 border-dashed border-[#111214]/10 bg-white/60 hover:border-[#5B1112]/20 hover:bg-white/80"
        }`}
        style={{ aspectRatio: "4 / 3" }}
      >
        {photoUrl ? (
          <>
            <img src={photoUrl} alt={slot.label} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-xs font-medium text-white/90">{slot.label}</p>
              <p className="text-[9px] text-white/55">{slot.hint}</p>
            </div>
            <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#5B1112] shadow-lg">
              <Check size={14} className="text-white" />
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1">
              <div className="flex items-center gap-1">
                <RefreshCw size={9} className="text-[#111214]/60" />
                <span className="text-[9px] font-medium text-[#111214]/60">Reprendre</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6">
            {index !== undefined ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[#5B1112]/20 bg-[#5B1112]/5">
                <span className="text-sm font-bold text-[#5B1112]/35">{index + 1}</span>
              </div>
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[#5B1112]/6">
                <Camera size={22} className="text-[#5B1112]/35" />
              </div>
            )}
            <div className="text-center">
              <p className="mb-0.5 text-sm font-medium text-[#111214]/60">{slot.label}</p>
              <p className="text-[10px] leading-relaxed text-[#111214]/30">{slot.hint}</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-[#5B1112]/5 px-3 py-1">
              <span className="text-base">{slot.emoji}</span>
              <p className="text-[9px] font-medium text-[#5B1112]/55">{slot.sublabel}</p>
            </div>
          </div>
        )}
      </motion.button>
    </>
  );
}

// ── Step: Photo Upload ─────────────────────────────────────────────────────

function StepPhotoUpload({
  data,
  onPhotoUpload,
  onNext,
}: {
  data: FlowData;
  onPhotoUpload: (slotKey: keyof FlowData["photos"], file: File, url: string) => void;
  onNext: () => void;
}) {
  const uploadedCount = Object.values(data.photos).filter(Boolean).length;

  return (
    <div>
      {/* Progress header */}
      <div className="mb-5 flex items-center justify-between rounded-[1.5rem] border border-white bg-white/70 px-5 py-3.5 shadow-sm">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
            Capture photos
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#111214]">
            {uploadedCount === 0
              ? "3 photos à prendre"
              : uploadedCount < 3
                ? `${3 - uploadedCount} photo${3 - uploadedCount > 1 ? "s" : ""} restante${3 - uploadedCount > 1 ? "s" : ""}`
                : "Toutes les photos prises ! ✓"}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`h-2 w-2 rounded-full transition-all duration-400 ${
                index < uploadedCount
                  ? "scale-110 bg-[#5B1112]"
                  : "bg-[#111214]/12"
              }`}
            />
          ))}
        </div>
      </div>

      <StepTitle
        eyebrow="Photographiez la zone"
        title="Suivez chaque mission"
        subtitle="Appuyez sur un cadre pour ouvrir votre appareil photo."
      />

      <div className="mb-4 space-y-3">
        {PHOTO_SLOTS.map((slot, index) => (
          <PhotoSlot
            key={slot.key}
            slot={slot}
            photoUrl={data.photos[slot.key]}
            onUpload={(file, url) => onPhotoUpload(slot.key, file, url)}
            index={index}
          />
        ))}
      </div>

      <ContinueButton
        label={
          uploadedCount === 0
            ? "Capturer plus tard"
            : uploadedCount < 3
              ? `Continuer (${uploadedCount}/3)`
              : "Réviser mes photos"
        }
        onClick={onNext}
        icon={uploadedCount === 3 ? Eye : ArrowRight}
      />
    </div>
  );
}

// ── Step: Photo Review ─────────────────────────────────────────────────────

function StepPhotoReview({
  data,
  onPhotoUpload,
  onNext,
}: {
  data: FlowData;
  onPhotoUpload: (slotKey: keyof FlowData["photos"], file: File, url: string) => void;
  onNext: () => void;
}) {
  const uploadedCount = Object.values(data.photos).filter(Boolean).length;

  return (
    <div>
      <StepTitle
        eyebrow="Révision photos"
        title="Vérifiez vos images"
        subtitle="Assurez-vous que chaque photo est nette, bien éclairée et montre clairement la zone concernée."
      />

      {uploadedCount === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center py-10 text-center"
        >
          <PhoneCameraIllustration />
          <p className="mt-4 text-sm text-[#111214]/40">Aucune photo ajoutée</p>
          <p className="mt-1 text-[10px] text-[#111214]/25">
            Vous pourrez en ajouter après la création du dossier
          </p>
        </motion.div>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PHOTO_SLOTS.map((slot, index) => (
            <PhotoSlot
              key={slot.key}
              slot={slot}
              photoUrl={data.photos[slot.key]}
              onUpload={(file, url) => onPhotoUpload(slot.key, file, url)}
              index={index}
            />
          ))}
        </div>
      )}

      {uploadedCount > 0 ? (
        <div className="mb-2 flex items-start gap-3 rounded-[1.25rem] border border-[#00415E]/8 bg-[#00415E]/4 p-4">
          <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-[#00415E]/60" />
          <p className="text-[10px] leading-relaxed text-[#111214]/45">
            Vos {uploadedCount} photo{uploadedCount > 1 ? "s" : ""} semblent complètes.
            Votre dermatologue pourra vous demander des photos complémentaires si nécessaire.
          </p>
        </div>
      ) : null}

      <ContinueButton label="Continuer" onClick={onNext} />
    </div>
  );
}

// ── Step: Medical History ──────────────────────────────────────────────────

function StepMedicalHistory({
  data,
  onUpdate,
  onNext,
}: {
  data: FlowData;
  onUpdate: (updates: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const [subStep, setSubStep] = useState(0);

  const updateMedical = (key: keyof FlowData["medical"], value: string) =>
    onUpdate({ medical: { ...data.medical, [key]: value } });

  const handleContinue = () => {
    if (subStep < MEDICAL_QUESTIONS.length - 1) setSubStep((s) => s + 1);
    else onNext();
  };

  const q = MEDICAL_QUESTIONS[subStep];
  const currentValue = data.medical[q.key];

  const getBinaryState = (val: string): "oui" | "non" | "nsp" | null => {
    if (!val) return null;
    if (val === "Non") return "non";
    if (val === "Non mentionné") return "nsp";
    return "oui";
  };

  const binaryState = getBinaryState(currentValue);
  const binaryText =
    binaryState === "oui" && currentValue !== "Oui" ? currentValue : "";

  const QuestionIcon = q.Icon;

  return (
    <div>
      <StepTitle
        eyebrow="Contexte médical"
        title="Quelques précisions utiles"
        subtitle="Tout est facultatif — plus vous partagez, plus l'avis sera précis."
      />

      {/* Sub-step progress */}
      <div className="mb-5 flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {MEDICAL_QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= subStep ? "bg-[#5B1112]" : "bg-[#111214]/10"
              }`}
            />
          ))}
        </div>
        <span className="text-[9px] font-semibold text-[#5B1112]/55">
          {subStep + 1} / {MEDICAL_QUESTIONS.length}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subStep}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
        >
          {/* Question header */}
          <div className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B1112]/[0.07]">
                {QuestionIcon ? (
                  <QuestionIcon className="h-5 w-5 text-[#5B1112]/60" />
                ) : (
                  <Sparkles size={17} className="text-[#5B1112]/60" />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/50">
                Question {subStep + 1}
              </span>
            </div>
            <p className="text-[15px] font-medium leading-snug text-[#111214]">
              {q.label}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#111214]/42">
              {q.subtitle}
            </p>
          </div>

          {/* ── Phototype swatches ── */}
          {q.type === "phototype" && (
            <div className="grid grid-cols-5 gap-2">
              {SKIN_TYPES.map((st) => {
                const active = data.medical.skinType === st.id;
                return (
                  <motion.button
                    key={st.id}
                    type="button"
                    whileTap={{ scale: 0.93 }}
                    onClick={() => updateMedical("skinType", st.id)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                      active
                        ? "border-[#5B1112]/30 bg-[#5B1112]/[0.06] shadow-sm"
                        : "border-white bg-white/70 hover:bg-white"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-full shadow-md transition-all ${
                        active
                          ? "ring-2 ring-[#5B1112]/50 ring-offset-1"
                          : ""
                      }`}
                      style={{
                        background:
                          PHOTOTYPE_COLORS[st.id] ?? "#EFBA8A",
                      }}
                    />
                    <span
                      className={`text-center text-[9px] font-semibold leading-tight ${
                        active ? "text-[#5B1112]" : "text-[#111214]/55"
                      }`}
                    >
                      {st.label}
                    </span>
                    <span
                      className={`text-center text-[8px] leading-tight ${
                        active ? "text-[#5B1112]/60" : "text-[#111214]/28"
                      }`}
                    >
                      {st.desc}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* ── Binary question (Oui / Non / NSP) ── */}
          {q.type === "binary" && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      ans: "oui" as const,
                      label: "Oui",
                      Icon: Check,
                      store: "Oui",
                      active:
                        "border-[#5B1112]/25 bg-[#5B1112] text-white shadow-lg shadow-[#5B1112]/20",
                    },
                    {
                      ans: "non" as const,
                      label: "Non",
                      Icon: X,
                      store: "Non",
                      active:
                        "border-emerald-300 bg-emerald-500 text-white shadow-lg shadow-emerald-400/20",
                    },
                    {
                      ans: "nsp" as const,
                      label: "Je ne sais pas",
                      Icon: HelpCircle,
                      store: "Non mentionné",
                      active:
                        "border-[#111214]/15 bg-white text-[#111214]/65 shadow-sm",
                    },
                  ] as const
                ).map(({ ans, label, Icon: AnsIcon, store, active }) => (
                  <motion.button
                    key={ans}
                    type="button"
                    whileTap={{ scale: 0.94 }}
                    onClick={() => updateMedical(q.key, store)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all duration-200 ${
                      binaryState === ans
                        ? active
                        : "border-white bg-white/70 text-[#111214]/45 hover:bg-white"
                    }`}
                  >
                    <AnsIcon size={22} strokeWidth={1.8} />
                    <span className="text-center text-[10px] font-medium leading-tight">
                      {label}
                    </span>
                  </motion.button>
                ))}
              </div>

              {/* Expandable text when Oui */}
              <AnimatePresence>
                {binaryState === "oui" ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <textarea
                      autoFocus
                      rows={3}
                      placeholder={q.placeholder ?? "Précisez..."}
                      value={binaryText}
                      onChange={(e) =>
                        updateMedical(q.key, e.target.value || "Oui")
                      }
                      className="w-full resize-none rounded-2xl border border-white bg-white/80 px-4 py-3 text-sm text-[#111214] outline-none transition-all placeholder:text-[#111214]/30 focus:border-[#5B1112]/25 focus:bg-white focus:shadow-sm"
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )}

          {/* ── Pregnancy question ── */}
          {q.type === "pregnancy" && (
            <div className="grid grid-cols-3 gap-2.5">
              {(
                [
                  {
                    val: "Oui",
                    label: "Oui",
                    Icon: IconGrossesse,
                    active:
                      "border-rose-300 bg-rose-500 text-white shadow-lg shadow-rose-400/20",
                  },
                  {
                    val: "Non",
                    label: "Non",
                    Icon: X,
                    active:
                      "border-emerald-300 bg-emerald-500 text-white shadow-lg shadow-emerald-400/20",
                  },
                  {
                    val: "Non applicable",
                    label: "Non\napplicable",
                    Icon: MinusCircle,
                    active:
                      "border-[#111214]/15 bg-white text-[#111214]/65 shadow-sm",
                  },
                ] as const
              ).map(({ val, label, Icon: PregIcon, active }) => (
                <motion.button
                  key={val}
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={() => updateMedical("pregnancy", val)}
                  className={`flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all duration-200 ${
                    data.medical.pregnancy === val
                      ? active
                      : "border-white bg-white/70 text-[#111214]/45 hover:bg-white"
                  }`}
                >
                  <PregIcon
                    size={24}
                    strokeWidth={1.7}
                    className="h-6 w-6 flex-shrink-0"
                  />
                  <span className="whitespace-pre-line text-[10px] font-medium leading-tight">
                    {label}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="mt-5 flex items-center gap-2.5">
        {subStep > 0 ? (
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubStep((s) => s - 1)}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white bg-white/70 text-[#111214]/40 transition-colors hover:bg-white"
          >
            <ChevronLeft size={18} />
          </motion.button>
        ) : null}
        <ContinueButton
          label={
            subStep === MEDICAL_QUESTIONS.length - 1 ? "Terminer" : "Suivant"
          }
          onClick={handleContinue}
        />
      </div>
    </div>
  );
}

// ── Step: Consent ──────────────────────────────────────────────────────────

function StepConsent({
  data,
  onUpdate,
  onNext,
}: {
  data: FlowData;
  onUpdate: (updates: Partial<FlowData>) => void;
  onNext: () => void;
}) {
  const toggle = (key: keyof FlowData["consent"]) => {
    onUpdate({
      consent: {
        ...data.consent,
        [key]: !data.consent[key],
      },
    });
  };

  const canContinue = data.consent.caseReview && data.consent.photoUse;

  return (
    <div>
      {/* Shield illustration */}
      <div className="mb-6 flex items-center justify-center overflow-hidden rounded-[2rem] border border-white bg-white/50 py-4 shadow-sm">
        <ShieldIllustration />
        <div className="ml-2 pr-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#00415E]/55">
            Données protégées
          </p>
          <p className="mt-1 font-serif text-base text-[#111214]/75">
            Chiffrement de bout en bout
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {["RGPD", "ISO 27001", "Données médicales"].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#00415E]/15 bg-[#00415E]/5 px-2 py-0.5 text-[8.5px] font-medium text-[#00415E]/65"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <StepTitle
        eyebrow="Consentement & confidentialité"
        title="Avant d'envoyer votre dossier"
        subtitle="Deux points importants à confirmer. Votre accord est nécessaire pour la transmission de votre dossier."
      />

      <div className="mb-5 space-y-3">
        {[
          {
            key: "caseReview" as const,
            title: "Examen de mon dossier médical",
            body: "J'autorise un dermatologue qualifié de la plateforme Melanis à analyser mes informations et photos médicales dans le cadre exclusif de cette téléconsultation.",
          },
          {
            key: "photoUse" as const,
            title: "Utilisation de mes photos",
            body: "J'accepte que mes photos soient utilisées uniquement dans le cadre de mon suivi dermatologique. Elles ne seront jamais partagées à des tiers ni utilisées à des fins commerciales.",
          },
        ].map((item) => (
          <motion.button
            key={item.key}
            whileTap={{ scale: 0.99 }}
            onClick={() => toggle(item.key)}
            className={`w-full rounded-[1.75rem] border p-5 text-left transition-all ${
              data.consent[item.key]
                ? "border-[#5B1112]/20 bg-white shadow-sm"
                : "border-white bg-white/60 hover:bg-white/80"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[0.6rem] border-2 transition-all ${
                  data.consent[item.key]
                    ? "border-[#5B1112] bg-[#5B1112]"
                    : "border-[#111214]/15 bg-transparent"
                }`}
              >
                {data.consent[item.key] ? <Check size={12} className="text-white" /> : null}
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-sm font-medium text-[#111214]">{item.title}</p>
                <p className="text-[10px] leading-relaxed text-[#111214]/45">{item.body}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mb-2 flex items-start gap-3 rounded-[1.25rem] border border-[#5B1112]/8 bg-[#5B1112]/4 p-4">
        <AlertTriangle size={14} className="mt-0.5 flex-shrink-0 text-[#5B1112]/55" />
        <p className="text-[10px] leading-relaxed text-[#111214]/50">
          Ce service de télé-dermatologie ne remplace pas une consultation d'urgence. En
          cas de symptômes aigus, veuillez consulter un médecin ou contacter le 15.
        </p>
      </div>

      <ContinueButton
        label="Confirmer et continuer"
        onClick={onNext}
        disabled={!canContinue}
      />
    </div>
  );
}

// ── Review Block ───────────────────────────────────────────────────────────

function ReviewBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-[1.75rem] border border-white bg-white/70 p-4 shadow-sm">
      <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
        {title}
      </p>
      {children}
    </div>
  );
}

// ── Step: Review ───────────────────────────────────────────────────────────

function StepReview({
  data,
  isSubmitting,
  saveState,
  hasDraft,
  onSubmit,
}: {
  data: FlowData;
  isSubmitting: boolean;
  saveState: string;
  hasDraft: boolean;
  onSubmit: () => void;
}) {
  const photoCount = Object.values(data.photos).filter(Boolean).length;
  const hasMinimumRequiredPhotos = Boolean(data.photos.overview && data.photos.closeup);

  return (
    <div>
      {/* Review illustration */}
      <div className="mb-6 flex items-center justify-center overflow-hidden rounded-[2rem] border border-white bg-white/50 py-5 shadow-sm">
        <ReviewIllustration />
        <div className="ml-2 pr-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5B1112]/55">
            Dossier prêt
          </p>
          <p className="mt-1 font-serif text-base text-[#111214]/75">
            Votre dossier est complet
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 shadow-sm">
            <FileText size={12} className="text-[#5B1112]/50" />
            <span className="text-[10px] text-[#111214]/55">
              {isSubmitting ? "Envoi en cours..." : saveState}
            </span>
          </div>
        </div>
      </div>

      <StepTitle
        eyebrow="Récapitulatif"
        title="Votre dossier en un coup d'œil"
        subtitle="Vérifiez les informations avant d'envoyer votre dossier à un dermatologue."
      />

      <ReviewBlock title="Symptômes ressentis">
        {data.symptoms.sensations.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.symptoms.sensations.map((sensation) => {
              const Icon = SENSATION_ICON_MAP[sensation as SensationOption] ?? MinusCircle;
              return (
                <div
                  key={sensation}
                  className="flex items-center gap-1.5 rounded-full border border-[#5B1112]/10 bg-[#5B1112]/6 px-3 py-1.5"
                >
                  <Icon className="h-3.5 w-3.5 text-[#5B1112]/60" />
                  <span className="text-[10px] font-medium text-[#5B1112]/80">{sensation}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-[#111214]/40">Aucun symptôme renseigné</p>
        )}
      </ReviewBlock>

      <ReviewBlock title="Zone corporelle">
        <div className="flex flex-wrap gap-1.5">
          {data.bodyAreas.map((area) => (
            <span
              key={area}
              className="rounded-full bg-[#FEF0D5] px-3 py-1.5 text-[10px] font-medium text-[#111214]/65"
            >
              {BODY_AREA_LABELS[area] ?? area}
            </span>
          ))}
        </div>
      </ReviewBlock>

      <ReviewBlock title="Évolution & intensité">
        <div className="space-y-2">
          {data.symptoms.duration ? (
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-[#111214]/30" />
              <p className="text-[10px] text-[#111214]/55">{data.symptoms.duration}</p>
            </div>
          ) : null}
          {data.symptoms.evolution ? (
            <p className="text-[10px] text-[#111214]/55">
              Évolution : {data.symptoms.evolution}
            </p>
          ) : null}
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-wider text-[#111214]/30">
              Intensité
            </span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 w-3 rounded-full ${
                    index < data.symptoms.severity ? "bg-[#5B1112]" : "bg-[#111214]/8"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] font-medium text-[#5B1112]">
              {data.symptoms.severity}/10
            </span>
          </div>
        </div>
      </ReviewBlock>

      <ReviewBlock title={`Photos (${photoCount}/3)`}>
        <div className="flex gap-2">
          {PHOTO_SLOTS.map((slot) =>
            data.photos[slot.key] ? (
              <div
                key={slot.key}
                className="relative h-16 w-16 overflow-hidden rounded-[1rem]"
              >
                <img
                  src={data.photos[slot.key] ?? ""}
                  alt={slot.label}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/15" />
              </div>
            ) : (
              <div
                key={slot.key}
                className="flex h-16 w-16 items-center justify-center rounded-[1rem] border-2 border-dashed border-[#111214]/8 bg-[#111214]/5"
              >
                <Camera size={14} className="text-[#111214]/20" />
              </div>
            ),
          )}
        </div>
        {!hasMinimumRequiredPhotos ? (
          <p className="mt-2 text-[10px] text-amber-600">
            ⚠ La vue d'ensemble et le gros plan sont requis pour soumettre.
          </p>
        ) : null}
      </ReviewBlock>

      <ReviewBlock title="Consentement">
        <div className="space-y-2">
          {[
            { key: "caseReview" as const, label: "Examen du dossier autorisé" },
            { key: "photoUse" as const, label: "Utilisation des photos acceptée" },
          ].map((item) => (
            <div key={item.key} className="flex items-center gap-2">
              <div
                className={`flex h-4 w-4 items-center justify-center rounded-full ${
                  data.consent[item.key] ? "bg-[#5B1112]" : "bg-[#111214]/10"
                }`}
              >
                {data.consent[item.key] ? <Check size={8} className="text-white" /> : null}
              </div>
              <p className="text-[10px] text-[#111214]/55">{item.label}</p>
            </div>
          ))}
        </div>
      </ReviewBlock>

      <div className="mb-2 flex items-start gap-3 rounded-[1.25rem] border border-[#00415E]/8 bg-[#00415E]/4 p-4">
        <FileText size={14} className="mt-0.5 flex-shrink-0 text-[#00415E]/55" />
        <p className="text-[10px] leading-relaxed text-[#111214]/45">
          Une fois envoyé, votre dossier sera examiné par un dermatologue qualifié dans
          un délai de 24 à 48h. Vous serez notifié dès qu'une réponse sera disponible.
        </p>
      </div>

      <ContinueButton
        label={isSubmitting ? "Envoi en cours..." : "Envoyer mon dossier"}
        onClick={onSubmit}
        disabled={!hasDraft || isSubmitting || !hasMinimumRequiredPhotos}
        icon={Send}
      />
    </div>
  );
}

// ── Step: Success ──────────────────────────────────────────────────────────

function StepSuccess({
  caseId,
  onViewCase,
  onDashboard,
}: {
  caseId: string | null;
  onViewCase: () => void;
  onDashboard: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated success rings */}
      <div className="relative mb-6 mt-2 flex items-center justify-center">
        {[80, 108, 136].map((size, i) => (
          <motion.div
            key={size}
            className="absolute rounded-full border border-[#5B1112]/10"
            style={{ width: size, height: size }}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#5B1112]"
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Check size={36} className="text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
      >
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
          Dossier envoyé avec succès
        </p>
        <h2
          className="mb-2 font-serif text-[#111214]"
          style={{ fontSize: 26, lineHeight: 1.2 }}
        >
          Votre dossier est entre de bonnes mains
        </h2>
        <p className="mx-auto mb-5 max-w-xs text-xs leading-relaxed text-[#111214]/45">
          Un dermatologue qualifié va examiner votre dossier et vous transmettre son avis
          médical personnalisé sous 48h.
        </p>

        <div className="mb-6 inline-flex items-center gap-2 rounded-[1.25rem] border border-white bg-white/80 px-4 py-2.5 shadow-sm">
          <FileText size={13} className="text-[#5B1112]/50" />
          <span className="text-xs text-[#111214]/60">Référence :</span>
          <span className="text-xs font-semibold text-[#111214]">
            {createCaseReference(caseId)}
          </span>
        </div>
      </motion.div>

      {/* Next steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.58, duration: 0.4 }}
        className="mb-5 w-full overflow-hidden rounded-[2rem] border border-white bg-white/70 shadow-sm"
      >
        <div className="border-b border-[#111214]/5 px-5 py-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
            Prochaines étapes
          </p>
        </div>
        <div className="divide-y divide-[#111214]/5">
          {[
            {
              icon: Clock,
              label: "Revue sous 24–48h",
              desc: "Votre dermatologue examine votre dossier et rédige son avis.",
              color: "bg-amber-50 text-amber-600",
            },
            {
              icon: CheckCircle2,
              label: "Notification de réponse",
              desc: "Vous recevrez une notification dès que l'avis sera disponible.",
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: FileText,
              label: "Consultation du rapport",
              desc: "Accédez au rapport médical détaillé depuis votre espace.",
              color: "bg-sky-50 text-sky-600",
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4 px-5 py-4">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[0.9rem] ${item.color}`}>
                <item.icon size={16} strokeWidth={1.8} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium text-[#111214]">{item.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-[#111214]/40">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Melanis mascot tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.72 }}
        className="mb-6 flex w-full items-start gap-3 text-left"
      >
        <MelaniaMascot size={44} delay={0.78} animated={false} />
        <div className="flex-1 rounded-[1.5rem] border border-white/80 bg-white/70 px-4 py-3 shadow-sm">
          <p className="text-[10px] italic leading-snug text-[#111214]/50">
            "En attendant la réponse, continuez votre routine habituelle et évitez
            d'expérimenter de nouveaux produits sur la zone concernée."
          </p>
          <p className="mt-1.5 text-[8.5px] font-semibold uppercase tracking-wider text-[#5B1112]/45">
            Mélania · Guide peau
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.84 }}
        className="flex w-full flex-col gap-2.5"
      >
        <motion.button
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewCase}
          className="flex items-center justify-center gap-2.5 rounded-[1.5rem] bg-[#5B1112] py-4 text-sm font-medium text-white shadow-lg shadow-[#5B1112]/25"
        >
          <Eye size={15} />
          <span>Suivre mon dossier</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onDashboard}
          className="flex items-center justify-center gap-2 rounded-[1.5rem] border border-white bg-white/70 py-4 text-sm font-medium text-[#111214]/55 transition-all hover:bg-white"
        >
          Retour à l'accueil
        </motion.button>
      </motion.div>
    </div>
  );
}

// ── Focused flow shell ──────────────────────────────────────────────────────

function TeledermFlowShell({
  step,
  isSaving,
  onBack,
  children,
}: {
  step: Step;
  isSaving: boolean;
  onBack: () => void;
  children: ReactNode;
}) {
  const showMeta = step !== "success";
  const currentIndex = STEP_ORDER.indexOf(step);
  const progressPct =
    currentIndex >= 0 ? (currentIndex / (STEP_ORDER.length - 2)) * 100 : 100;

  return (
    <div className="relative min-h-screen bg-[#FEF0D5] font-sans">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute left-[-6%] top-[-10%] h-[50vw] w-[50vw] rounded-full bg-white/65 blur-[140px]" />
        <div className="absolute bottom-[-6%] right-[-6%] h-[42vw] w-[42vw] rounded-full bg-[#5B1112]/5 blur-[130px]" />
        <div className="absolute left-1/2 top-1/3 h-[55vw] w-[55vw] -translate-x-1/2 rounded-full bg-[#FEF0D5]/30 blur-[90px]" />
      </div>

      {/* Sticky top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/40 bg-[#FEF0D5]/92 px-4 backdrop-blur-xl">
        {step !== "success" ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/70 text-[#111214]/55 shadow-sm transition hover:bg-white hover:text-[#111214]"
          >
            <ChevronLeft size={17} />
          </motion.button>
        ) : (
          <div className="h-9 w-9" />
        )}

        <div className="flex items-center gap-2">
          <MelaniaMascot size={26} animated={false} />
          <span
            className="font-serif text-[#111214]"
            style={{ fontSize: 16, letterSpacing: "-0.02em" }}
          >
            melanis
          </span>
        </div>

        {showMeta ? (
          <div className="flex h-8 items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 shadow-sm">
            <motion.div
              animate={{ opacity: isSaving ? [1, 0.3, 1] : 1 }}
              transition={isSaving ? { duration: 1.2, repeat: Infinity } : {}}
              className={`h-1.5 w-1.5 rounded-full ${isSaving ? "bg-amber-400" : "bg-emerald-400"}`}
            />
            <span className="text-[9px] font-medium text-[#111214]/40">
              {isSaving ? "Enreg." : "Sauvegardé"}
            </span>
          </div>
        ) : (
          <div className="h-8 w-[72px]" />
        )}
      </header>

      {/* Progress bar */}
      {showMeta ? (
        <div className="sticky top-14 z-30 bg-[#FEF0D5]/92 px-5 pb-3 pt-2.5 backdrop-blur-xl">
          <div className="mx-auto max-w-[480px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[8.5px] font-bold uppercase tracking-[0.24em] text-[#111214]/38">
                {STEP_LABELS[step]}
              </span>
              <span className="text-[8.5px] font-bold text-[#5B1112]/55">
                {currentIndex + 1}&thinsp;/&thinsp;{STEP_ORDER.length - 1}
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-[#111214]/[0.07]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#5B1112] to-[#9B3335]"
                initial={false}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* Content */}
      <main className="relative z-10 flex justify-center px-4 pb-28 pt-5">
        <div className="w-full max-w-[480px]">{children}</div>
      </main>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────

export default function PatientTeledermComposeScreen() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("concern");
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<FlowData>(INITIAL_DATA);
  const [photoFiles, setPhotoFiles] = useState<PhotoFiles>({
    overview: null,
    medium: null,
    closeup: null,
  });
  const [draftId, setDraftId] = useState<string | null>(null);
  const [submittedCaseId, setSubmittedCaseId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveState, setSaveState] = useState("Initialisation du brouillon...");
  const questionnaireData = useMemo(
    () => ({
      bodyAreas: data.bodyAreas,
      symptoms: data.symptoms,
      medical: data.medical,
      consent: data.consent,
      photoSlotsCompleted: PHOTO_SLOTS.map((slot) => ({
        key: slot.key,
        label: slot.label,
        present: Boolean(data.photos[slot.key]),
      })),
    }),
    [data],
  );

  const patientSummary = useMemo(() => buildPatientSummary(data), [data]);
  const primaryConditionKey = useMemo(() => {
    const s = data.symptoms.sensations;
    if (s.includes("Démangeaisons")) return "rougeurs";
    if (s.includes("Rougeur")) return "rougeurs";
    if (s.includes("Brûlure") || s.includes("Douleur")) return "eczema";
    return "autre";
  }, [data.symptoms.sensations]);
  const primaryBodyArea = useMemo(
    () => bodyAreaToBackendLabel(data.bodyAreas[0] ?? "autre"),
    [data.bodyAreas],
  );

  useEffect(() => {
    if (!auth.user || !auth.actingProfileId || draftId) return;

    let mounted = true;
    auth.accountAdapter
      .createAsyncCase({
        actorUserId: auth.user.id,
        profileId: auth.actingProfileId,
        conditionKey: primaryConditionKey,
        bodyArea: primaryBodyArea,
        patientSummary,
        questionnaireData,
      })
      .then((draft) => {
        if (!mounted) return;
        setDraftId(draft.id);
        setSaveState("Brouillon prêt");
      });

    return () => {
      mounted = false;
    };
  }, [
    auth.accountAdapter,
    auth.actingProfileId,
    auth.user,
    draftId,
    patientSummary,
    primaryBodyArea,
    primaryConditionKey,
    questionnaireData,
  ]);

  useEffect(() => {
    if (!auth.user || !draftId || step === "success") return;

    const actorUserId = auth.user.id;
    const timeout = window.setTimeout(() => {
      setIsSaving(true);
      auth.accountAdapter
        .updateAsyncCase({
          actorUserId,
          caseId: draftId,
          conditionKey: primaryConditionKey,
          bodyArea: primaryBodyArea,
          patientSummary,
          questionnaireData,
        })
        .then(() => setSaveState("Modifications enregistrées"))
        .finally(() => setIsSaving(false));
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [
    auth.accountAdapter,
    auth.user,
    draftId,
    primaryConditionKey,
    primaryBodyArea,
    patientSummary,
    questionnaireData,
    step,
  ]);

  const goTo = (nextStep: Step, nextDirection: number) => {
    setDirection(nextDirection);
    setStep(nextStep);
  };

  const goNext = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex < STEP_ORDER.length - 1) {
      goTo(STEP_ORDER[currentIndex + 1], 1);
    }
  };

  const goBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      goTo(STEP_ORDER[currentIndex - 1], -1);
      return;
    }
    navigate("/patient-flow/auth/telederm");
  };

  const updateData = (updates: Partial<FlowData>) => {
    setData((current) => ({ ...current, ...updates }));
  };

  const updatePhoto = (
    slotKey: keyof FlowData["photos"],
    file: File,
    url: string,
  ) => {
    setPhotoFiles((current) => ({ ...current, [slotKey]: file }));
    setData((current) => ({
      ...current,
      photos: { ...current.photos, [slotKey]: url },
    }));
  };

  async function handleSubmit() {
    if (!auth.user || !draftId) return;

    const actorUserId = auth.user.id;
    setIsSubmitting(true);
    try {
      const uploadedAssets = await Promise.all(
        PHOTO_SLOTS.map((slot) =>
          uploadPhotoSlot(
            auth.accountAdapter,
            actorUserId,
            draftId,
            primaryBodyArea,
            primaryConditionKey,
            slot,
            photoFiles[slot.key],
          ),
        ),
      );

      await auth.accountAdapter.updateAsyncCase({
        actorUserId,
        caseId: draftId,
        conditionKey: primaryConditionKey,
        bodyArea: primaryBodyArea,
        patientSummary,
        questionnaireData: {
          ...questionnaireData,
          uploadedAssetIds: uploadedAssets.filter(Boolean).map((item) => item?.id),
        },
      });

      await auth.accountAdapter.submitAsyncCase({
        actorUserId,
        caseId: draftId,
        message: patientSummary,
      });

      setSubmittedCaseId(draftId);
      goTo("success", 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <TeledermFlowShell step={step} isSaving={isSaving} onBack={goBack}>
      {/* Step content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === "concern" ? (
            <StepConcern data={data} onUpdate={updateData} onNext={goNext} />
          ) : null}
          {step === "body-area" ? (
            <StepBodyArea data={data} onUpdate={updateData} onNext={goNext} />
          ) : null}
          {step === "symptoms" ? (
            <StepSymptoms data={data} onUpdate={updateData} onNext={goNext} />
          ) : null}
          {step === "photo-guide" ? <StepPhotoGuide onNext={goNext} /> : null}
          {step === "photo-upload" ? (
            <StepPhotoUpload data={data} onPhotoUpload={updatePhoto} onNext={goNext} />
          ) : null}
          {step === "photo-review" ? (
            <StepPhotoReview data={data} onPhotoUpload={updatePhoto} onNext={goNext} />
          ) : null}
          {step === "medical-history" ? (
            <StepMedicalHistory data={data} onUpdate={updateData} onNext={goNext} />
          ) : null}
          {step === "consent" ? (
            <StepConsent data={data} onUpdate={updateData} onNext={goNext} />
          ) : null}
          {step === "review" ? (
            <StepReview
              data={data}
              isSubmitting={isSubmitting}
              saveState={saveState}
              hasDraft={Boolean(draftId)}
              onSubmit={() => void handleSubmit()}
            />
          ) : null}
          {step === "success" ? (
            <StepSuccess
              caseId={submittedCaseId}
              onViewCase={() =>
                navigate(`/patient-flow/auth/telederm/cases/${submittedCaseId ?? draftId ?? ""}`)
              }
              onDashboard={() => navigate("/patient-flow/auth/dashboard")}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </TeledermFlowShell>
  );
}
