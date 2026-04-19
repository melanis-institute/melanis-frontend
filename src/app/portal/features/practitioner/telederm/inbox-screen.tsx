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
  Download,
  FileText,
  MessageSquareMore,
  Pill,
  Plus,
  Printer,
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

// ── Body Silhouette (from patient telederm compose) ───────────────────────

function BodySilhouette({ selectedAreas }: { selectedAreas: string[] }) {
  const has = (area: string) => selectedAreas.includes(area);
  const SK = "#F4E8D2";
  const OL = "#BBA07A";
  const HR = "#C8A67A";
  const DT = "rgba(187,160,122,0.42)";
  const SF = "rgba(91,17,18,0.14)";
  const SS = "#7B2324";

  const f = (z: string) => (has(z) ? SF : SK);
  const s = (z: string) => (has(z) ? SS : OL);
  const d = (z: string) => (has(z) ? "rgba(123,35,36,0.28)" : DT);

  return (
    <svg viewBox="0 0 260 444" fill="none" className="mx-auto w-full drop-shadow-sm" aria-hidden>
      {/* HAIR */}
      <path
        d="M100 50 C99 30 111 18 130 18 C149 18 161 30 160 50 C156 38 146 30 130 30 C114 30 104 38 100 50Z"
        fill={has("cuir-chevelu") ? SF : HR}
        stroke={s("cuir-chevelu")}
        strokeWidth="1.6"
        className="transition-colors duration-300"
      />
      {/* FACE */}
      <ellipse cx="130" cy="57" rx="27" ry="33"
        fill={f("visage")} stroke={s("visage")} strokeWidth="2"
        className="transition-colors duration-300"
      />
      {/* NECK */}
      <path d="M116 88 L144 88 L146 104 L114 104Z"
        fill={f("torse")} stroke="none"
        className="transition-colors duration-300"
      />
      {/* LEFT ARM */}
      <path
        d="M78 112 C70 112 60 116 52 126 C46 134 44 150 44 168 L44 222 C44 238 46 252 48 264 C50 272 52 280 52 286 C52 294 55 301 62 304 C69 307 75 302 77 296 C79 289 77 280 75 272 C73 262 73 246 73 230 L73 188 C75 166 79 146 83 128 C85 120 83 114 78 112Z"
        fill={f("bras")} stroke={s("bras")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />
      {/* RIGHT ARM */}
      <path
        d="M182 112 C190 112 200 116 208 126 C214 134 216 150 216 168 L216 222 C216 238 214 252 212 264 C210 272 208 280 208 286 C208 294 205 301 198 304 C191 307 185 302 183 296 C181 289 183 280 185 272 C187 262 187 246 187 230 L187 188 C185 166 181 146 177 128 C175 120 177 114 182 112Z"
        fill={f("bras")} stroke={s("bras")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />
      {/* TORSO */}
      <path
        d="M114 104 C104 106 90 112 78 120 C74 123 73 126 75 130 C79 116 81 116 83 120 C87 138 89 160 89 182 C89 200 87 214 85 224 C83 232 82 240 84 250 C86 260 92 268 106 272 L154 272 C168 268 174 260 176 250 C178 240 177 232 175 224 C173 214 171 200 171 182 C171 160 173 138 177 120 C179 116 181 116 185 130 C187 126 186 123 182 120 C170 112 156 106 146 104Z"
        fill={f("torse")} stroke={s("torse")} strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
        className="transition-colors duration-300"
      />
      {/* INTIME */}
      <path
        d="M106 272 C98 264 88 256 84 248 C82 256 84 266 92 276 C102 284 116 288 130 288 C144 288 158 284 168 276 C176 266 178 256 176 248 C172 256 162 264 154 272Z"
        fill={has("intime") ? "rgba(0,65,94,0.14)" : SK}
        stroke={has("intime") ? "#00415E" : OL}
        strokeWidth="1.5"
        className="transition-colors duration-300"
      />
      <path d="M106 272 C114 276 122 278 130 278 C138 278 146 276 154 272"
        stroke={has("intime") ? "#00415E" : DT} strokeWidth="1.2" strokeLinecap="round"
      />
      {/* LEFT LEG */}
      <path
        d="M106 272 C98 274 90 282 87 295 L85 323 C85 335 85 343 87 354 C91 370 93 388 93 404 C93 414 91 422 89 430 C87 436 91 440 101 440 L122 440 C130 440 132 436 131 430 C130 424 126 415 123 406 C120 394 120 378 120 362 C120 345 118 328 116 314 L114 295 C112 283 110 275 106 272Z"
        fill={f("jambes")} stroke={s("jambes")} strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />
      {/* RIGHT LEG */}
      <path
        d="M154 272 C162 274 170 282 173 295 L175 323 C175 335 175 343 173 354 C169 370 167 388 167 404 C167 414 169 422 171 430 C173 436 169 440 159 440 L138 440 C130 440 128 436 129 430 C130 424 134 415 137 406 C140 394 140 378 140 362 C140 345 142 328 144 314 L146 295 C148 283 150 275 154 272Z"
        fill={f("jambes")} stroke={s("jambes")} strokeWidth="2"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />
      {/* DETAIL LINES */}
      <path d="M130 106 L130 224" stroke={d("torse")} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M93 130 C101 126 112 126 121 130" stroke={d("torse")} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M139 130 C148 126 159 126 167 130" stroke={d("torse")} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M118 162 C121 159 126 159 130 159 C134 159 139 159 142 162" stroke={d("torse")} strokeWidth="1" strokeLinecap="round" />
      <path d="M118 184 C121 181 126 181 130 181 C134 181 139 181 142 184" stroke={d("torse")} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="100" cy="342" rx="13" ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={s("jambes")} strokeWidth="1.2"
        className="transition-colors duration-300"
      />
      <ellipse cx="160" cy="342" rx="13" ry="10"
        fill={has("jambes") ? "rgba(91,17,18,0.07)" : "rgba(244,232,210,0.7)"}
        stroke={s("jambes")} strokeWidth="1.2"
        className="transition-colors duration-300"
      />
      <path d="M48 224 C50 230 52 234 54 238" stroke={has("bras") ? "rgba(122,35,36,0.2)" : DT} strokeWidth="1" strokeLinecap="round" />
      <path d="M212 224 C210 230 208 234 206 238" stroke={has("bras") ? "rgba(122,35,36,0.2)" : DT} strokeWidth="1" strokeLinecap="round" />
      <path d="M55 292 C56 298 58 302 62 304" stroke={has("ongles") ? SS : OL} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M205 292 C204 298 202 302 198 304" stroke={has("ongles") ? SS : OL} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M100 436 C104 439 110 440 116 440" stroke={has("ongles") ? SS : OL} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
      <path d="M160 436 C156 439 150 440 144 440" stroke={has("ongles") ? SS : OL} strokeWidth={has("ongles") ? 1.8 : 1.1} strokeLinecap="round" />
    </svg>
  );
}

// ── Severity Indicator ─────────────────────────────────────────────────────

function SeverityIndicator({ value }: { value: number }) {
  const label =
    value <= 2 ? "Très légère" :
    value <= 4 ? "Légère" :
    value <= 6 ? "Modérée" :
    value <= 8 ? "Intense" : "Sévère";

  const palette =
    value >= 8
      ? { dot: "bg-red-500", numBg: "bg-red-50", numText: "text-red-600", labelText: "text-red-500/80" }
      : value >= 5
      ? { dot: "bg-amber-500", numBg: "bg-amber-50", numText: "text-amber-600", labelText: "text-amber-500/80" }
      : { dot: "bg-[#5B1112]", numBg: "bg-[#5B1112]/[0.07]", numText: "text-[#5B1112]", labelText: "text-[#5B1112]/60" };

  return (
    <div className="flex items-center gap-3">
      {/* Large number */}
      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ${palette.numBg}`}>
        <span className={`font-serif text-[1.5rem] font-bold leading-none ${palette.numText}`}>
          {value}
        </span>
      </div>
      {/* Bar + label */}
      <div className="min-w-0 flex-1">
        <div className="flex gap-[3px]">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`h-[6px] flex-1 rounded-full transition-colors duration-300 ${
                i < value ? palette.dot : "bg-[#111214]/8"
              }`}
            />
          ))}
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`text-[9px] font-bold uppercase tracking-wider ${palette.labelText}`}>
            {label}
          </span>
          <span className="text-[9px] text-[#111214]/25">{value}/10</span>
        </div>
      </div>
    </div>
  );
}

// ── Fitzpatrick Display ────────────────────────────────────────────────────

function FitzpatrickDisplay({ skinType }: { skinType: string }) {
  const normalized = skinType.toUpperCase();
  const match = FITZPATRICK_TONES.find((t) => normalized.includes(t.id));

  return (
    <div className="flex items-center gap-2">
      {FITZPATRICK_TONES.map((t) => {
        const isActive = match?.id === t.id;
        return (
          <div key={t.id} className="flex flex-col items-center gap-1">
            <div
              className={`h-7 w-7 rounded-full transition-all duration-200 ${
                isActive ? "shadow-md ring-2 ring-[#5B1112] ring-offset-2" : "opacity-55"
              }`}
              style={{ backgroundColor: t.bg, border: `1px solid ${t.ring}` }}
            />
            <span
              className={`text-[8px] font-semibold ${
                isActive ? "text-[#5B1112]" : "text-[#111214]/25"
              }`}
            >
              {t.id}
            </span>
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

// ── Print / Download helper ────────────────────────────────────────────────

function openPrescriptionPrint(drugs: DrugEntry[], practitionerName: string) {
  const today = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date());
  const valid = drugs.filter((d) => d.name.trim());

  const rows = valid
    .map(
      (d, i) => `
      <div class="drug">
        <span class="drug-num">${i + 1}.</span>
        <strong class="drug-name">${d.name}</strong>
        ${d.posologie ? `<p class="drug-pos">${d.posologie}</p>` : ""}
        ${d.duree ? `<p class="drug-dur">Durée : ${d.duree}</p>` : ""}
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ordonnance — ${practitionerName}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;padding:56px 64px;max-width:640px;margin:auto}
    .header{border-bottom:1.5px solid #e5e5e5;padding-bottom:28px;margin-bottom:36px}
    .lbl{font-size:8.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#5B1112;margin-bottom:6px}
    .prac{font-size:22px;font-family:Georgia,serif;font-weight:600}
    .sub{font-size:12px;color:#888;margin-top:3px}
    .date{font-size:12px;color:#aaa;margin-top:14px}
    .drug{margin-bottom:22px;padding-left:12px;border-left:2px solid #f0e0c8}
    .drug-num{font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#bbb;display:block;margin-bottom:3px}
    .drug-name{font-size:14px;font-weight:600;display:block}
    .drug-pos{font-size:12px;color:#555;margin-top:3px}
    .drug-dur{font-size:11px;color:#999;margin-top:2px}
    .footer{border-top:1px solid #eee;padding-top:16px;margin-top:56px;font-size:9px;color:#ccc}
    @media print{
      body{padding:32px 40px}
      @page{size:A4;margin:20mm}
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="lbl">Ordonnance médicale</div>
    <div class="prac">${practitionerName}</div>
    <div class="sub">Dermatologue · Melanis</div>
    <div class="date">${today}</div>
  </div>
  ${rows}
  <div class="footer">Ordonnance générée via Melanis · Usage médical uniquement</div>
  <script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=680,height=860");
  if (!win) return;
  win.document.write(html);
  win.document.close();
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
        className="relative w-[440px] max-w-[92vw] overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.14)]"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-[#111214]/8 px-6 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/55">
            Aperçu ordonnance
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#111214]/30 transition hover:bg-[#111214]/5 hover:text-[#111214]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Prescription body */}
        <div className="px-7 pb-2 pt-6">
          <div className="mb-5 border-b border-[#111214]/8 pb-5">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#5B1112]/45">
              Ordonnance médicale
            </p>
            <p className="mt-1 font-serif text-[1.25rem] leading-tight text-[#111214]">
              {practitionerName}
            </p>
            <p className="text-[11px] text-[#111214]/40">Dermatologue · Melanis</p>
            <p className="mt-2 text-[11px] text-[#111214]/32">{today}</p>
          </div>
          <div className="space-y-4">
            {validDrugs.map((drug, i) => (
              <div key={drug.id} className="border-l-2 border-[#F0E0C8] pl-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wide text-[#111214]/28">
                    {i + 1}.
                  </span>
                  <p className="text-[13.5px] font-semibold text-[#111214]">{drug.name}</p>
                </div>
                {drug.posologie ? (
                  <p className="mt-1 text-[11.5px] text-[#111214]/55">{drug.posologie}</p>
                ) : null}
                {drug.duree ? (
                  <p className="mt-0.5 text-[11px] text-[#111214]/35">Durée : {drug.duree}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-[#111214]/8 pt-4">
            <p className="text-[8.5px] text-[#111214]/20">
              Ordonnance générée via Melanis · Usage médical uniquement
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 px-6 pb-6 pt-4">
          <button
            type="button"
            onClick={() => openPrescriptionPrint(drugs, practitionerName)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#111214]/10 bg-white py-2.5 text-[11.5px] font-semibold text-[#111214]/65 shadow-sm transition hover:bg-[#111214]/[0.03] hover:text-[#111214]"
          >
            <Printer size={13} />
            Imprimer
          </button>
          <button
            type="button"
            onClick={() => openPrescriptionPrint(drugs, practitionerName)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#111214] py-2.5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-[#1c1e21]"
          >
            <Download size={13} />
            Télécharger PDF
          </button>
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
                <div className="flex-shrink-0 border-b border-[#111214]/[0.05] px-5 py-3 space-y-2">
                  {/* Row 1: badges + title */}
                  <div className="flex items-center gap-2 min-w-0">
                    {(() => {
                      const ss = TELEDERM_STATUS_STYLES[detail.case.status];
                      const Icon = ss.icon;
                      return (
                        <span
                          className={`inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${ss.tone}`}
                        >
                          <Icon size={10} />
                          {TELEDERM_STATUS_LABELS[detail.case.status]}
                        </span>
                      );
                    })()}
                    {detail.case.bodyArea ? (
                      <span className="flex-shrink-0 whitespace-nowrap rounded-full bg-[#FEF0D5] px-2.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-[#111214]/42">
                        {detail.case.bodyArea}
                      </span>
                    ) : null}
                    <p className="min-w-0 truncate text-[13px] font-semibold text-[#111214]">
                      {detail.case.patientSummary || "Cas télé-derm"}
                    </p>
                  </div>
                  {/* Row 2: action buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                      {/* Body silhouette */}
                      <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                        <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                          Localisation
                        </p>
                        <div className="w-28 mx-auto">
                          <BodySilhouette selectedAreas={bodyAreas} />
                        </div>
                        {bodyAreas.length > 0 ? (
                          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                            {bodyAreas.map((area) => (
                              <span
                                key={area}
                                className="rounded-full bg-[#5B1112]/[0.07] px-2.5 py-1 text-[9.5px] font-semibold text-[#5B1112]/70"
                              >
                                {BODY_AREA_LABELS[area] ?? area}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-center text-[10px] italic text-[#111214]/28">
                            Zone non précisée
                          </p>
                        )}
                      </div>

                      {/* Severity indicator */}
                      {severity > 0 ? (
                        <div className="rounded-[1.75rem] border border-[#111214]/[0.05] bg-white/70 p-4">
                          <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.2em] text-[#111214]/28">
                            Sévérité déclarée
                          </p>
                          <SeverityIndicator value={severity} />
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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowPreview(true)}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#111214]/10 bg-white/80 py-2.5 text-[11px] font-semibold text-[#111214]/60 transition hover:bg-white"
                          >
                            <FileText size={12} />
                            Aperçu
                          </button>
                          <button
                            type="button"
                            onClick={() => openPrescriptionPrint(drugs, auth.user?.fullName ?? "Praticien")}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#111214] py-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-[#1c1e21]"
                          >
                            <Printer size={12} />
                            Imprimer / PDF
                          </button>
                        </div>
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
