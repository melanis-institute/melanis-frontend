import { relationshipToLabel } from "@portal/domains/account/labels";
import type {
  AuditEvent,
  ConsentRecord,
  NotificationChannelPreference,
  NotificationPreference,
  PatientProfileRecord,
  SkinScoreRecord,
} from "@portal/domains/account/types";
import type { AppointmentRecord } from "@portal/domains/appointments/types";
import { TYPES_PEAU } from "@portal/features/patient/preconsult/components/types";
import type { AuthFlowContext } from "@portal/session/types";
import { useAuth } from "@portal/session/useAuth";
import { DashboardLayout } from "@portal/shared/layouts/DashboardLayout";
import { readStorageJson } from "@shared/lib/storage";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Award,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Droplets,
  Edit3,
  FileText,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  Pill,
  Shield,
  Sun,
  TrendingUp,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

const FITZPATRICK = [
  { type: "I", color: "#FDE8C8", label: "Type I" },
  { type: "II", color: "#F0C898", label: "Type II" },
  { type: "III", color: "#C8885A", label: "Type III" },
  { type: "IV", color: "#9A5C35", label: "Type IV" },
  { type: "V", color: "#6B3520", label: "Type V" },
  { type: "VI", color: "#2E1206", label: "Type VI" },
] as const;

type PreferenceSection = Exclude<
  keyof NotificationPreference,
  "id" | "profileId" | "updatedAt"
>;

const PREFERENCE_SECTION_KEYS: PreferenceSection[] = [
  "reminders",
  "prevention",
  "screening",
  "telederm",
  "billing",
];

type ProfileStats = {
  signedConsents: number;
  pendingConsents: number;
  revokedConsents: number;
  dependentProfiles: number;
  activeChannels: number;
  totalChannels: number;
  scoreDelta: number;
  scoreTrendPercent: number;
};

type ActivityItem = {
  id: string;
  icon: LucideIcon;
  label: string;
  sub: string;
  time: string;
  color: "#5B1112" | "#111214";
};

type PreConsultSnapshot = {
  peauSensible: boolean | null;
  typePeau: string | null;
  phototype: number | null;
  symptomes: string[];
  traitements: string[];
  traitementAutre: string;
  allergies: boolean | null;
  allergiesDetail: string;
  medicaments: boolean | null;
  medicamentsDetail: string;
  dejaEuProbleme: boolean | null;
  dejaConsulte: boolean | null;
  objectifs: string[];
};

type SkinCardModel = {
  typePeauLabel: string;
  peauSensibleLabel: string;
  activeFitzIndex: number;
  phototypeLabel: string;
  sensitivities: string[];
  allergies: string[];
  sourceLabel: string;
};

type MedicalTreatmentRow = {
  name: string;
  timing: string;
  icon: LucideIcon;
  color: string;
};

type MedicalCardModel = {
  practitionerName: string | null;
  practitionerLocation: string | null;
  treatments: MedicalTreatmentRow[];
  historyLabel: string;
  sourceLabel: string;
};

type ScoreSeriesPoint = {
  day: string;
  score: number;
};

const PRECONSULT_DRAFT_STORAGE_KEY = "melanis_preconsult_draft";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [] as string[];
  return value
    .filter((entry) => typeof entry === "string")
    .map((entry) => String(entry).trim())
    .filter(Boolean);
}

function asBooleanOrNull(value: unknown) {
  if (typeof value === "boolean") return value;
  return null;
}

function asNumberOrNull(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function toPreConsultSnapshot(value: unknown): PreConsultSnapshot | null {
  const record = asRecord(value);
  if (!record) return null;

  const snapshot: PreConsultSnapshot = {
    peauSensible: asBooleanOrNull(record.peauSensible),
    typePeau: asString(record.typePeau) || null,
    phototype: asNumberOrNull(record.phototype),
    symptomes: asStringArray(record.symptomes),
    traitements: asStringArray(record.traitements),
    traitementAutre: asString(record.traitementAutre),
    allergies: asBooleanOrNull(record.allergies),
    allergiesDetail: asString(record.allergiesDetail),
    medicaments: asBooleanOrNull(record.medicaments),
    medicamentsDetail: asString(record.medicamentsDetail),
    dejaEuProbleme: asBooleanOrNull(record.dejaEuProbleme),
    dejaConsulte: asBooleanOrNull(record.dejaConsulte),
    objectifs: asStringArray(record.objectifs),
  };

  const hasData =
    snapshot.peauSensible !== null ||
    snapshot.typePeau !== null ||
    snapshot.phototype !== null ||
    snapshot.symptomes.length > 0 ||
    snapshot.traitements.length > 0 ||
    snapshot.traitementAutre.length > 0 ||
    snapshot.allergies !== null ||
    snapshot.medicaments !== null ||
    snapshot.objectifs.length > 0;

  return hasData ? snapshot : null;
}

function splitDetailText(value: string) {
  return value
    .split(/[;,/]/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function loadDraftPreConsultSnapshot(): PreConsultSnapshot | null {
  const parsed = readStorageJson<{ data?: unknown; savedAt?: unknown } | null>(
    PRECONSULT_DRAFT_STORAGE_KEY,
    null,
  );
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  if (
    typeof parsed.savedAt === "number" &&
    Date.now() - parsed.savedAt > 48 * 60 * 60 * 1000
  ) {
    return null;
  }
  return toPreConsultSnapshot(parsed.data);
}

function buildSkinCardModel(
  snapshot: PreConsultSnapshot | null,
): SkinCardModel {
  const typePeauLabel =
    snapshot?.typePeau != null
      ? (TYPES_PEAU.find((entry) => entry.key === snapshot.typePeau)?.label ??
        "Non renseigné")
      : "Non renseigné";

  const peauSensibleLabel =
    snapshot?.peauSensible === true
      ? "Peau sensible"
      : snapshot?.peauSensible === false
        ? "Peau non sensible"
        : "Sensibilité non renseignée";

  const activeFitzIndex =
    snapshot?.phototype != null &&
    snapshot.phototype >= 1 &&
    snapshot.phototype <= 6
      ? snapshot.phototype - 1
      : 4;

  const phototypeLabel =
    snapshot?.phototype != null &&
    snapshot.phototype >= 1 &&
    snapshot.phototype <= 6
      ? FITZPATRICK[snapshot.phototype - 1].label
      : "Phototype non renseigné";

  const sensitivities = [
    ...(snapshot?.peauSensible === true ? ["Peau sensible"] : []),
    ...(snapshot?.symptomes ?? []),
  ].slice(0, 4);

  if (sensitivities.length === 0) {
    sensitivities.push("Aucune sensibilité déclarée");
  }

  let allergies: string[] = ["Non renseigné"];
  if (snapshot?.allergies === false) {
    allergies = ["Aucune allergie signalée"];
  } else if (snapshot?.allergies === true) {
    const details = splitDetailText(snapshot.allergiesDetail);
    allergies =
      details.length > 0
        ? details.slice(0, 4)
        : ["Allergies signalées (détails à compléter)"];
  }

  return {
    typePeauLabel,
    peauSensibleLabel,
    activeFitzIndex,
    phototypeLabel,
    sensitivities,
    allergies,
    sourceLabel: snapshot
      ? "Basé sur votre dernière pré-consultation"
      : "Complétez une pré-consultation pour enrichir ce profil",
  };
}

function treatmentTimingLabel(name: string) {
  if (
    name.toLowerCase().includes("spf") ||
    name.toLowerCase().includes("solaire")
  )
    return "Matin";
  if (
    name.toLowerCase().includes("crème") ||
    name.toLowerCase().includes("creme")
  )
    return "Matin & soir";
  if (
    name.toLowerCase().includes("sérum") ||
    name.toLowerCase().includes("serum")
  )
    return "Le soir";
  if (name.toLowerCase().includes("antibiot")) return "Selon ordonnance";
  if (name.toLowerCase().includes("cortico")) return "Selon ordonnance";
  if (name.toLowerCase().includes("antifong")) return "Selon ordonnance";
  return "Suivi en cours";
}

function treatmentIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("spf") || lower.includes("solaire")) {
    return { icon: Sun, color: "rgba(245,158,11,0.08)" };
  }
  if (
    lower.includes("crème") ||
    lower.includes("creme") ||
    lower.includes("sérum") ||
    lower.includes("serum")
  ) {
    return { icon: Droplets, color: "rgba(91,17,18,0.07)" };
  }
  return { icon: Pill, color: "rgba(17,18,20,0.06)" };
}

function buildMedicalCardModel(
  snapshot: PreConsultSnapshot | null,
  flowContext: AuthFlowContext | null,
  latestAppointment: AppointmentRecord | null,
): MedicalCardModel {
  const practitionerName =
    latestAppointment?.practitionerName?.trim() ||
    (typeof flowContext?.practitioner?.name === "string" &&
    flowContext.practitioner.name.trim().length > 0
      ? flowContext.practitioner.name
      : null);
  const practitionerLocation =
    latestAppointment?.practitionerLocation?.trim() ||
    (typeof flowContext?.practitioner?.location === "string" &&
    flowContext.practitioner.location.trim().length > 0
      ? flowContext.practitioner.location
      : null);

  const treatmentNames: string[] = [
    ...(snapshot?.traitements ?? []),
    ...(snapshot?.traitementAutre ? [snapshot.traitementAutre] : []),
  ];

  if (snapshot?.medicaments === true) {
    const medicationDetails = splitDetailText(snapshot.medicamentsDetail);
    if (medicationDetails.length > 0) {
      treatmentNames.push(...medicationDetails);
    } else {
      treatmentNames.push("Médicaments en cours");
    }
  }

  if (
    treatmentNames.length === 0 &&
    snapshot?.objectifs.includes("Suivi de traitement")
  ) {
    treatmentNames.push("Suivi de traitement à définir");
  }

  const treatments = treatmentNames.slice(0, 4).map((name) => {
    const visual = treatmentIcon(name);
    return {
      name,
      timing: treatmentTimingLabel(name),
      icon: visual.icon,
      color: visual.color,
    };
  });

  let historyLabel = "Historique à compléter";
  if (snapshot?.dejaEuProbleme === true && snapshot?.dejaConsulte === true) {
    historyLabel = "Cas récurrent déjà suivi médicalement";
  } else if (snapshot?.dejaEuProbleme === true) {
    historyLabel = "Cas récurrent signalé";
  } else if (snapshot?.dejaEuProbleme === false) {
    historyLabel = "Premier épisode déclaré";
  }

  const sourceLabel = latestAppointment
    ? `Dernier rendez-vous enregistré le ${new Date(latestAppointment.scheduledFor).toLocaleDateString("fr-FR")}`
    : snapshot
      ? "Basé sur votre dernière pré-consultation"
      : "Aucun suivi praticien enregistré pour ce profil";

  return {
    practitionerName,
    practitionerLocation,
    treatments,
    historyLabel,
    sourceLabel,
  };
}

function profileInitials(profile: PatientProfileRecord | null) {
  if (!profile) return "MP";
  const initials = [profile.firstName, profile.lastName]
    .map((value) => value.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return initials.toUpperCase() || "MP";
}

function formatDateOfBirth(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCreatedAt(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
  });
}

function toWeekdayLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const raw = date
    .toLocaleDateString("fr-FR", { weekday: "short" })
    .replace(".", "")
    .trim();

  if (!raw) return "--";
  return `${raw.slice(0, 1).toUpperCase()}${raw.slice(1, 3).toLowerCase()}`;
}

function countEnabledChannels(preferences: NotificationPreference | null) {
  if (!preferences) return 0;

  return PREFERENCE_SECTION_KEYS.reduce((acc, key) => {
    const section = preferences[key] as NotificationChannelPreference;
    return (
      acc +
      Number(section.sms) +
      Number(section.whatsapp) +
      Number(section.email)
    );
  }, 0);
}

function relativeDate(value: string) {
  const diff = Date.now() - Date.parse(value);
  if (!Number.isFinite(diff) || diff < 0) return "à l'instant";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;

  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
}

function mapAuditToActivity(events: AuditEvent[]): ActivityItem[] {
  return events.slice(0, 6).map((event) => {
    if (event.action === "consent.signed") {
      return {
        id: event.id,
        icon: Shield,
        label: "Consentement signé",
        sub: "Autorisation mise à jour",
        time: relativeDate(event.createdAt),
        color: "#5B1112",
      };
    }

    if (event.action === "consent.revoked") {
      return {
        id: event.id,
        icon: AlertCircle,
        label: "Consentement révoqué",
        sub: "Action enregistrée",
        time: relativeDate(event.createdAt),
        color: "#111214",
      };
    }

    if (
      event.action === "dependent.created" ||
      event.action === "dependent.linked"
    ) {
      return {
        id: event.id,
        icon: Users,
        label: "Profil dépendant ajouté",
        sub: "Compte famille synchronisé",
        time: relativeDate(event.createdAt),
        color: "#5B1112",
      };
    }

    if (event.action === "dependent.unlinked") {
      return {
        id: event.id,
        icon: Users,
        label: "Lien dépendant révoqué",
        sub: "Accès tuteur mis à jour",
        time: relativeDate(event.createdAt),
        color: "#111214",
      };
    }

    if (event.action === "profile.updated") {
      return {
        id: event.id,
        icon: User,
        label: "Profil modifié",
        sub: "Données patient actualisées",
        time: relativeDate(event.createdAt),
        color: "#5B1112",
      };
    }

    if (event.action === "profile.switch") {
      return {
        id: event.id,
        icon: ArrowUpRight,
        label: "Profil actif changé",
        sub: "Contexte patient actualisé",
        time: relativeDate(event.createdAt),
        color: "#111214",
      };
    }

    return {
      id: event.id,
      icon: Activity,
      label: "Activité compte",
      sub: event.action,
      time: relativeDate(event.createdAt),
      color: "#111214",
    };
  });
}

function Sparkline({ data }: { data: Array<{ day: string; score: number }> }) {
  const safeData = data.length > 0 ? data : [{ day: "--", score: 70 }];
  const W = 340;
  const H = 72;
  const PAD = 8;

  const scores = safeData.map((d) => d.score);
  const min = Math.min(...scores) - 2;
  const max = Math.max(...scores) + 2;
  const denominator = Math.max(1, safeData.length - 1);
  const scaleX = (i: number) => PAD + (i / denominator) * (W - PAD * 2);
  const scaleY = (v: number) =>
    H - PAD - ((v - min) / (max - min)) * (H - PAD * 2);
  const points = safeData.map((d, i) => ({ x: scaleX(i), y: scaleY(d.score) }));

  const path = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const prev = points[index - 1];
    const cpx = (prev.x + point.x) / 2;
    return `${acc} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const fillPath = `${path} L ${points[points.length - 1].x} ${H} L ${points[0].x} ${H} Z`;

  return (
    <div className="relative w-full" style={{ height: H + 24 }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5B1112" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#5B1112" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={fillPath} fill="url(#sparkGrad)" />

        <motion.path
          d={path}
          fill="none"
          stroke="#5B1112"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        />

        {points.map((point, index) => (
          <motion.circle
            key={`${point.x}-${point.y}`}
            cx={point.x}
            cy={point.y}
            r={index === safeData.length - 1 ? 4 : 2.5}
            fill={index === safeData.length - 1 ? "#5B1112" : "white"}
            stroke="#5B1112"
            strokeWidth={index === safeData.length - 1 ? 0 : 1.5}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.5 + index * 0.08,
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          />
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1">
        {safeData.map((entry, index) => (
          <span
            key={`${entry.day}-${index}`}
            className={[
              "text-[9px] uppercase tracking-wider",
              index === safeData.length - 1
                ? "font-semibold text-[#5B1112]"
                : "text-[#111214]/30",
            ].join(" ")}
          >
            {entry.day}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfileHero({
  profile,
  signedConsents,
  totalConsents,
}: {
  profile: PatientProfileRecord | null;
  signedConsents: number;
  totalConsents: number;
}) {
  const [hovered, setHovered] = useState(false);

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-[#5B1112]/20 bg-[#5B1112]/5 p-5 text-[#5B1112]"
      >
        <p className="text-sm font-semibold">Aucun profil patient actif</p>
        <p className="mt-1 text-xs text-[#5B1112]/80">
          Sélectionnez un profil pour gérer les consentements, préférences et
          accès famille.
        </p>
        <Link
          to="/patient-flow/account/select-profile"
          className="mt-3 inline-flex rounded-full bg-[#5B1112] px-3.5 py-2 text-xs font-medium text-white"
        >
          Choisir un profil
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[2.5rem] p-6 md:p-8"
      style={{
        background:
          "linear-gradient(140deg, #fff9f0 0%, #FEF0D5 55%, #fde8be 100%)",
      }}
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#5B1112]/5 blur-3xl" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full bg-white/40 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8">
        <div
          className="relative flex-shrink-0 cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <motion.div
            animate={{ scale: hovered ? 1.03 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex h-28 w-28 items-center justify-center rounded-[1.75rem] border-4 border-white bg-[#5B1112]/8 shadow-xl md:h-32 md:w-32">
              <span
                className="font-serif text-[#5B1112]"
                style={{ fontSize: 34, lineHeight: 1, fontWeight: 600 }}
              >
                {profileInitials(profile)}
              </span>
            </div>

            <AnimatePresence>
              {hovered ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center rounded-[1.75rem] bg-[#111214]/40 backdrop-blur-sm"
                >
                  <Edit3 size={20} className="text-white" />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <div className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-white bg-emerald-400 shadow-sm" />
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#111214]/30">
                Profil patient actif
              </p>

              <h1
                className="font-serif text-[#111214]"
                style={{ fontSize: 30, lineHeight: 1.1 }}
              >
                {profile.firstName} {profile.lastName}
              </h1>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                <span className="flex items-center gap-1.5 text-xs text-[#111214]/45">
                  <Calendar size={11} className="text-[#5B1112]/50" />
                  {relationshipToLabel(profile.relationship)}
                </span>
                {formatDateOfBirth(profile.dateOfBirth) ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[#111214]/20" />
                    <span className="flex items-center gap-1.5 text-xs text-[#111214]/45">
                      <Clock size={11} className="text-[#5B1112]/50" />
                      Né le {formatDateOfBirth(profile.dateOfBirth)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <Link
              to={`/patient-flow/profiles/${profile.id}/edit`}
              className="self-center rounded-full bg-[#111214] px-5 py-2.5 text-xs font-medium text-white shadow-md transition-transform hover:scale-[1.02] md:self-start"
            >
              <span className="inline-flex items-center gap-2">
                <Edit3 size={12} /> Modifier le profil
              </span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span className="rounded-full bg-[#111214] px-3 py-1.5 text-[10px] font-medium text-[#FEF0D5]">
              <span className="inline-flex items-center gap-1.5">
                <User size={9} className="text-[#FEF0D5]" />{" "}
                {profile.relationship === "moi"
                  ? "Profil principal"
                  : "Profil dépendant"}
              </span>
            </span>
            {formatCreatedAt(profile.createdAt) ? (
              <span className="rounded-full border border-[#111214]/10 bg-white px-3 py-1.5 text-[10px] font-medium text-[#111214]/60">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={9} /> Profil créé en{" "}
                  {formatCreatedAt(profile.createdAt)}
                </span>
              </span>
            ) : null}
            <span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-[10px] font-medium text-amber-600">
              <span className="inline-flex items-center gap-1.5">
                <Shield size={9} /> Consentements: {signedConsents}/
                {totalConsents}
              </span>
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatsGrid({ stats }: { stats: ProfileStats }) {
  const consentRatio = `${stats.signedConsents}/${stats.signedConsents + stats.pendingConsents + stats.revokedConsents}`;
  const scoreDeltaLabel = `${stats.scoreDelta > 0 ? "+" : ""}${stats.scoreDelta}`;
  const scoreTrendLabel = `${stats.scoreTrendPercent > 0 ? "+" : ""}${stats.scoreTrendPercent}`;

  const cards = [
    {
      icon: Shield,
      label: "Consentements signés",
      value: String(stats.signedConsents),
      unit: `/${stats.signedConsents + stats.pendingConsents + stats.revokedConsents}`,
      sub: `${stats.pendingConsents} en attente`,
      color: "#5B1112",
      accent: "rgba(91,17,18,0.06)",
    },
    {
      icon: Bell,
      label: "Canaux actifs",
      value: String(stats.activeChannels),
      unit: `/${stats.totalChannels}`,
      sub: "Préférences notifications",
      color: "#5B1112",
      accent: "rgba(91,17,18,0.06)",
    },
    {
      icon: Users,
      label: "Profils famille",
      value: String(stats.dependentProfiles),
      unit: "",
      sub: "enfant/proche liés",
      color: "#111214",
      accent: "rgba(17,18,20,0.04)",
    },
    {
      icon: TrendingUp,
      label: "Progression",
      value: scoreDeltaLabel,
      unit: "pts",
      sub: `${scoreTrendLabel}% · ratio ${consentRatio}`,
      color: "rgb(16,185,129)",
      accent: "rgba(16,185,129,0.07)",
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map(
        ({ icon: Icon, label, value, unit, sub, color, accent }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.08 + index * 0.06,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex flex-col gap-3 rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{ background: accent }}
              >
                <Icon size={15} style={{ color }} />
              </div>
              <ChevronRight size={12} className="text-[#111214]/20" />
            </div>

            <div>
              <div className="flex items-baseline gap-0.5">
                <span
                  className="font-serif text-[#111214]"
                  style={{ fontSize: 26, lineHeight: 1 }}
                >
                  {value}
                </span>
                <span className="ml-0.5 text-xs text-[#111214]/35">{unit}</span>
              </div>
              <p className="mt-0.5 text-[10px] text-[#111214]/40">{label}</p>
            </div>

            <p className="text-[9px] font-medium" style={{ color }}>
              {sub}
            </p>
          </motion.div>
        ),
      )}
    </div>
  );
}

function SkinProfileCard({ model }: { model: SkinCardModel }) {
  const activeFitz = model.activeFitzIndex;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
          Profil cutané
        </p>
        <button className="flex items-center gap-1 text-[10px] font-medium text-[#5B1112]/60 transition-colors hover:text-[#5B1112]">
          <Edit3 size={10} /> Modifier
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#5B1112]/6">
          <Droplets size={16} className="text-[#5B1112]/60" />
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-wider text-[#111214]/35">
            Type de peau
          </p>
          <p className="text-sm font-medium text-[#111214]">
            {model.typePeauLabel}
          </p>
          <p className="mt-0.5 text-[10px] text-[#111214]/45">
            {model.peauSensibleLabel}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Phototype · Fitzpatrick
        </p>
        <div className="flex items-center gap-2">
          {FITZPATRICK.map((entry, index) => (
            <motion.div
              key={entry.type}
              whileHover={{ y: -2, scale: 1.08 }}
              className="relative flex cursor-pointer flex-col items-center gap-1.5"
            >
              <div
                className={[
                  "rounded-xl transition-all duration-300",
                  index === activeFitz
                    ? "h-9 w-9 ring-2 ring-[#5B1112] ring-offset-2 shadow-md"
                    : "h-7 w-7 opacity-40",
                ].join(" ")}
                style={{ background: entry.color }}
                title={entry.label}
              />
              {index === activeFitz ? (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[8px] font-semibold uppercase tracking-wider text-[#5B1112]"
                >
                  {entry.type}
                </motion.span>
              ) : null}
            </motion.div>
          ))}

          <div className="ml-2 border-l border-[#111214]/8 pl-3">
            <p className="text-xs font-medium text-[#111214]/70">
              {FITZPATRICK[activeFitz].type}
            </p>
            <p className="mt-0.5 text-[9px] text-[#111214]/35">
              {model.phototypeLabel}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Sensibilités
        </p>
        <div className="flex flex-wrap gap-2">
          {model.sensitivities.map((item) => (
            <span
              key={item}
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-medium",
                item.toLowerCase().includes("aucune")
                  ? "border border-[rgba(17,18,20,0.12)] bg-white text-[rgba(17,18,20,0.58)]"
                  : "bg-[#5B1112]/6 text-[#5B1112]/70",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle size={9} /> {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Allergies
        </p>
        <div className="flex flex-wrap gap-2">
          {model.allergies.map((item) => (
            <span
              key={item}
              className={[
                "rounded-full px-3 py-1.5 text-[10px] font-medium",
                item.toLowerCase().includes("aucune") ||
                item.toLowerCase().includes("non renseigné")
                  ? "border border-[rgba(17,18,20,0.12)] bg-white text-[rgba(17,18,20,0.58)]"
                  : "border border-amber-100 bg-amber-50 text-amber-600",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle size={9} /> {item}
              </span>
            </span>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-[#111214]/38">{model.sourceLabel}</p>
    </motion.div>
  );
}

function MedicalCard({
  model,
  consents,
}: {
  model: MedicalCardModel;
  consents: ConsentRecord[];
}) {
  const signedConsents = consents.filter(
    (consent) => consent.status === "signed",
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-5 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
        Suivi médical
      </p>

      <div className="flex items-center gap-4 rounded-[1.5rem] bg-[#111214]/3 p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1rem] bg-[#5B1112]/8">
          <Award size={18} className="text-[#5B1112]/60" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#111214]/35">
            Dernier praticien associé
          </p>
          <p className="truncate text-sm font-medium text-[#111214]">
            {model.practitionerName ?? "Aucun praticien enregistré"}
          </p>
          <p className="text-[10px] text-[#111214]/40">
            {model.practitionerLocation ?? model.sourceLabel}
          </p>
        </div>
        <Link
          to="/patient-flow/auth/dashboard#appointments"
          className="flex-shrink-0"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowUpRight size={13} className="text-[#5B1112]" />
          </motion.div>
        </Link>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
            Traitements en cours
          </p>
          <span className="text-[10px] text-[#111214]/40">
            {model.historyLabel}
          </span>
        </div>

        {model.treatments.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-[#111214]/12 bg-[#111214]/[0.02] px-4 py-3 text-[11px] text-[#111214]/45">
            Aucun traitement renseigné pour ce profil.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {model.treatments.map((treatment, index) => (
              <motion.div
                key={`${treatment.name}-${index}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.06 }}
                className="flex items-center gap-3.5 rounded-[1.25rem] bg-white px-4 py-3 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
              >
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ background: treatment.color }}
                >
                  <treatment.icon size={14} className="text-[#5B1112]/60" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-[#111214]">
                    {treatment.name}
                  </p>
                  <p className="mt-0.5 text-[9px] text-[#111214]/35">
                    {treatment.timing}
                  </p>
                </div>
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50">
                  <CheckCircle size={10} className="text-emerald-500" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[1rem] border border-[#5B1112]/12 bg-[#5B1112]/4 px-3.5 py-2.5">
        <p className="text-[10px] text-[#5B1112]/80">
          Consentements actifs:{" "}
          <span className="font-semibold">
            {signedConsents}/{consents.length}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          to="/patient-flow/account/consents"
          className="rounded-[1rem] border border-[#111214]/10 bg-[#111214]/3 px-3 py-2.5 text-xs text-[#111214]/70 hover:bg-[#111214]/5"
        >
          <span className="inline-flex items-center gap-2">
            <Shield size={12} /> Consentements
          </span>
        </Link>
        <Link
          to="/patient-flow/account/dependents"
          className="rounded-[1rem] border border-[#111214]/10 bg-[#111214]/3 px-3 py-2.5 text-xs text-[#111214]/70 hover:bg-[#111214]/5"
        >
          <span className="inline-flex items-center gap-2">
            <Users size={12} /> Gérer les dépendants
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

function ProgressCard({ data }: { data: ScoreSeriesPoint[] }) {
  const safeData = data.length > 0 ? data : [{ day: "--", score: 70 }];
  const min = Math.min(...safeData.map((entry) => entry.score));
  const max = Math.max(...safeData.map((entry) => entry.score));
  const diff = safeData[safeData.length - 1].score - safeData[0].score;
  const avg = Math.round(
    safeData.reduce((acc, entry) => acc + entry.score, 0) / safeData.length,
  );
  const currentScore = safeData[safeData.length - 1].score;
  const daysLabel = `${safeData.length} derniers jours`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-4 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
            Évolution du score
          </p>
          <p className="mt-0.5 text-xs text-[#111214]/40">{daysLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-emerald-500">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold">
              <TrendingUp size={10} /> {diff > 0 ? "+" : ""}
              {diff} pts
            </span>
          </div>
          <div className="text-right">
            <span
              className="font-serif text-[#5B1112]"
              style={{ fontSize: 22, lineHeight: 1 }}
            >
              {currentScore}
            </span>
            <p className="text-[9px] text-[#111214]/35">Score actuel</p>
          </div>
        </div>
      </div>

      <Sparkline data={safeData} />

      <div className="flex items-center justify-between border-t border-[#111214]/5 pt-1">
        <div className="text-center">
          <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#111214]/30">
            Min
          </p>
          <p className="font-serif text-[#111214]/60" style={{ fontSize: 16 }}>
            {min}
          </p>
        </div>

        <div className="mx-4 h-px flex-1 bg-gradient-to-r from-[#111214]/6 via-[#5B1112]/10 to-[#111214]/6" />

        <div className="text-center">
          <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#111214]/30">
            Moy.
          </p>
          <p className="font-serif text-[#111214]/60" style={{ fontSize: 16 }}>
            {avg}
          </p>
        </div>

        <div className="mx-4 h-px flex-1 bg-gradient-to-r from-[#111214]/6 via-[#5B1112]/10 to-[#111214]/6" />

        <div className="text-center">
          <p className="mb-0.5 text-[9px] uppercase tracking-wider text-[#111214]/30">
            Max
          </p>
          <p className="font-serif text-[#5B1112]" style={{ fontSize: 16 }}>
            {max}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function PreferencesCard({
  activeProfile,
  preferences,
}: {
  activeProfile: PatientProfileRecord | null;
  preferences: NotificationPreference | null;
}) {
  const activeNotificationChannels = countEnabledChannels(preferences);

  const items = [
    {
      Icon: Bell,
      label: "Notifications",
      sub: `${activeNotificationChannels}/15 canaux actifs`,
      to: "/patient-flow/account/notifications",
    },
    {
      Icon: Shield,
      label: "Consentements",
      sub: "Signer, révoquer, vérifier les versions",
      to: "/patient-flow/account/consents",
    },
    {
      Icon: Users,
      label: "Dépendants",
      sub: "Ajouter enfant/proche et gérer les accès",
      to: "/patient-flow/account/dependents",
    },
    {
      Icon: Globe,
      label: "Profil actif",
      sub: activeProfile
        ? `${activeProfile.firstName} ${activeProfile.lastName}`
        : "Choisir un profil patient",
      to: "/patient-flow/account/select-profile",
    },
    {
      Icon: HelpCircle,
      label: "Profils détaillés",
      sub: "Vue détaillée et gouvernance des profils",
      to: "/patient-flow/profiles",
    },
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.36, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col gap-2 rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_4px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#111214]/30">
        Préférences & accès
      </p>

      {items.map(({ Icon, label, sub, to }) => (
        <Link key={label} to={to}>
          <motion.div
            whileHover={{ x: 2 }}
            className="group flex cursor-pointer items-center gap-4 rounded-[1.5rem] px-4 py-3.5 transition-colors hover:bg-[#111214]/3"
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#111214]/4 transition-colors group-hover:bg-[#5B1112]/8">
              <Icon
                size={15}
                className="text-[#111214]/45 transition-colors group-hover:text-[#5B1112]/60"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#111214]/75">{label}</p>
              <p className="mt-0.5 truncate text-[10px] text-[#111214]/35">
                {sub}
              </p>
            </div>
            <ChevronRight
              size={14}
              className="flex-shrink-0 text-[#111214]/20 transition-colors group-hover:text-[#5B1112]/40"
            />
          </motion.div>
        </Link>
      ))}
    </motion.div>
  );
}

function ProfileRightPanel({
  activity,
  signedConsents,
  totalConsents,
}: {
  activity: ActivityItem[];
  signedConsents: number;
  totalConsents: number;
}) {
  const quickActions = [
    {
      Icon: Shield,
      label: "Consentements",
      to: "/patient-flow/account/consents",
    },
    {
      Icon: Users,
      label: "Dépendants",
      to: "/patient-flow/account/dependents",
    },
    {
      Icon: Bell,
      label: "Notifications",
      to: "/patient-flow/account/notifications",
    },
    { Icon: FileText, label: "Profils", to: "/patient-flow/profiles" },
  ] as const;

  return (
    <div className="sticky top-8 flex flex-col gap-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-[2rem] bg-[#111214] p-6 text-white"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#5B1112]/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/4 h-28 w-28 rounded-full bg-[#FEF0D5]/5 blur-2xl" />

        <div className="relative z-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#FEF0D5]/35">
                Conformité
              </p>
              <h3
                className="font-serif text-[#FEF0D5]"
                style={{ fontSize: 20 }}
              >
                Centre de consentement
              </h3>
              <p className="mt-0.5 text-xs text-white/35">
                État des autorisations patient
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#FEF0D5]/8">
              <Shield size={18} className="text-[#FEF0D5]" />
            </div>
          </div>

          <div className="mb-4">
            <div className="mb-1.5 flex justify-between">
              <span className="text-[9px] uppercase tracking-wider text-white/35">
                Consentements signés
              </span>
              <span className="text-[10px] font-medium text-[#FEF0D5]/70">
                {signedConsents} / {totalConsents}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className="h-full rounded-full bg-[#FEF0D5]/50"
                initial={{ width: 0 }}
                animate={{
                  width: `${totalConsents > 0 ? (signedConsents / totalConsents) * 100 : 0}%`,
                }}
                transition={{
                  delay: 0.8,
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            </div>
          </div>

          <Link to="/patient-flow/account/consents" className="w-full">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[#5B1112] py-2.5 text-xs font-medium text-white shadow-lg shadow-[#5B1112]/30"
            >
              Ouvrir les consentements <ArrowUpRight size={12} />
            </motion.div>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Accès rapide
        </p>
        <div className="flex flex-col gap-2">
          {quickActions.map(({ Icon, label, to }) => (
            <Link key={label} to={to}>
              <motion.div
                whileHover={{ x: 3 }}
                className="group flex cursor-pointer items-center gap-3 rounded-[1.25rem] bg-[#111214]/3 px-4 py-3 transition-colors hover:bg-[#5B1112]/5"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                  <Icon size={14} className="text-[#5B1112]/55" />
                </div>
                <p className="flex-1 text-xs font-medium text-[#111214]/65 transition-colors group-hover:text-[#111214]">
                  {label}
                </p>
                <ChevronRight
                  size={12}
                  className="text-[#111214]/18 transition-colors group-hover:text-[#5B1112]/40"
                />
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-[2rem] border border-white bg-white/70 p-6 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl"
      >
        <p className="mb-4 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#111214]/30">
          Activité récente
        </p>

        <div className="flex flex-col gap-0">
          {activity.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#111214]/15 p-3 text-[11px] text-[#111214]/45">
              Aucune activité enregistrée pour le moment.
            </p>
          ) : null}

          {activity.map(({ id, icon: Icon, label, sub, time, color }) => (
            <motion.div
              key={id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3 border-b border-[#111214]/4 py-3 last:border-0"
            >
              <div
                className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
                style={{
                  background:
                    color === "#5B1112"
                      ? "rgba(91,17,18,0.07)"
                      : "rgba(17,18,20,0.05)",
                }}
              >
                <Icon size={12} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-[#111214]/70">
                  {label}
                </p>
                <p className="mt-0.5 truncate text-[9px] text-[#111214]/35">
                  {sub}
                </p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-1">
                <Clock size={8} className="text-[#111214]/25" />
                <span className="whitespace-nowrap text-[8px] text-[#111214]/30">
                  {time}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ProfilePageContent({
  activeProfile,
  stats,
  consents,
  preferences,
  activity,
  skinModel,
  medicalModel,
  scoreSeries,
}: {
  activeProfile: PatientProfileRecord | null;
  stats: ProfileStats;
  consents: ConsentRecord[];
  preferences: NotificationPreference | null;
  activity: ActivityItem[];
  skinModel: SkinCardModel;
  medicalModel: MedicalCardModel;
  scoreSeries: ScoreSeriesPoint[];
}) {
  const totalConsents =
    stats.signedConsents + stats.pendingConsents + stats.revokedConsents;

  return (
    <div className="min-h-full xl:grid xl:grid-cols-[1fr_300px] xl:items-start xl:gap-10">
      <div className="mx-auto w-full max-w-[48rem] space-y-4 pb-28 lg:pb-12 xl:max-w-none">
        <ProfileHero
          profile={activeProfile}
          signedConsents={stats.signedConsents}
          totalConsents={totalConsents}
        />

        <StatsGrid stats={stats} />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SkinProfileCard model={skinModel} />
          <MedicalCard model={medicalModel} consents={consents} />
        </div>

        <ProgressCard data={scoreSeries} />
        <PreferencesCard
          activeProfile={activeProfile}
          preferences={preferences}
        />
      </div>

      <div className="hidden xl:block">
        <ProfileRightPanel
          activity={activity}
          signedConsents={stats.signedConsents}
          totalConsents={totalConsents}
        />
      </div>
    </div>
  );
}

export default function ProfileOverviewScreen() {
  const navigate = useNavigate();
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const [draftPreConsult, setDraftPreConsult] =
    useState<PreConsultSnapshot | null>(null);

  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(
    null,
  );
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [skinScores, setSkinScores] = useState<SkinScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigate("/patient-flow/auth/connexion", { replace: true });
    }
  }, [auth.isAuthenticated, navigate]);

  useEffect(() => {
    setDraftPreConsult(loadDraftPreConsultSnapshot());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId) {
        if (!cancelled) {
          setLoading(false);
          setConsents([]);
          setPreferences(null);
          setAuditEvents([]);
          setSkinScores([]);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const promises: Array<Promise<void>> = [
          auth.accountAdapter.listAuditEvents(userId).then((events) => {
            if (!cancelled) {
              setAuditEvents(events);
            }
          }),
        ];

        if (auth.actingProfileId) {
          promises.push(
            auth.accountAdapter
              .listConsents(userId, auth.actingProfileId)
              .then((items) => {
                if (!cancelled) {
                  setConsents(items);
                }
              }),
          );

          promises.push(
            auth.accountAdapter
              .getNotificationPreferences(userId, auth.actingProfileId)
              .then((nextPreferences) => {
                if (!cancelled) {
                  setPreferences(nextPreferences);
                }
              }),
          );

          promises.push(
            auth.accountAdapter
              .listSkinScores(userId, auth.actingProfileId, 7)
              .then((records) => {
                if (!cancelled) {
                  setSkinScores(records);
                }
              }),
          );

          promises.push(
            auth.appointmentAdapter
              .listAppointmentsForProfile(auth.actingProfileId)
              .then((records) => {
                if (!cancelled) {
                  setAppointments(records);
                }
              }),
          );
        } else {
          setConsents([]);
          setPreferences(null);
          setSkinScores([]);
          setAppointments([]);
        }

        await Promise.all(promises);
      } catch (adapterError) {
        if (!cancelled) {
          setError(
            adapterError instanceof Error
              ? adapterError.message
              : "Impossible de charger les données du profil.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    auth.accountAdapter,
    auth.appointmentAdapter,
    auth.actingProfileId,
    userId,
  ]);

  const activeProfile = useMemo(
    () => auth.actingProfile ?? auth.profiles[0] ?? null,
    [auth.actingProfile, auth.profiles],
  );

  const fullName = useMemo(() => {
    if (activeProfile) {
      return `${activeProfile.firstName} ${activeProfile.lastName}`;
    }

    return auth.user?.fullName ?? "Profil patient";
  }, [activeProfile, auth.user?.fullName]);

  const stats = useMemo<ProfileStats>(() => {
    const signedConsents = consents.filter(
      (consent) => consent.status === "signed",
    ).length;
    const pendingConsents = consents.filter(
      (consent) => consent.status === "pending",
    ).length;
    const revokedConsents = consents.filter(
      (consent) => consent.status === "revoked",
    ).length;

    const dependentProfiles = auth.profiles.filter(
      (profile) => profile.relationship !== "moi",
    ).length;
    const activeChannels = countEnabledChannels(preferences);
    const sortedScores = [...skinScores].sort((first, second) =>
      first.measuredAt.localeCompare(second.measuredAt),
    );
    const firstScore = sortedScores[0]?.score ?? 0;
    const lastScore =
      sortedScores[sortedScores.length - 1]?.score ?? firstScore;
    const scoreDelta = lastScore - firstScore;
    const scoreTrendPercent =
      firstScore > 0 ? Math.round((scoreDelta / firstScore) * 100) : 0;

    return {
      signedConsents,
      pendingConsents,
      revokedConsents,
      dependentProfiles,
      activeChannels,
      totalChannels: PREFERENCE_SECTION_KEYS.length * 3,
      scoreDelta,
      scoreTrendPercent,
    };
  }, [auth.profiles, consents, preferences, skinScores]);

  const activity = useMemo(
    () => mapAuditToActivity(auditEvents),
    [auditEvents],
  );

  const scoreSeries = useMemo<ScoreSeriesPoint[]>(() => {
    return [...skinScores]
      .sort((first, second) =>
        first.measuredAt.localeCompare(second.measuredAt),
      )
      .map((entry) => ({
        day: toWeekdayLabel(entry.measuredAt),
        score: entry.score,
      }));
  }, [skinScores]);

  const preConsultSnapshot = useMemo(
    () =>
      toPreConsultSnapshot(auth.flowContext?.preConsultData) ?? draftPreConsult,
    [auth.flowContext?.preConsultData, draftPreConsult],
  );

  const latestAppointment = useMemo<AppointmentRecord | null>(() => {
    if (appointments.length === 0) return null;
    return (
      [...appointments].sort((first, second) =>
        second.scheduledFor.localeCompare(first.scheduledFor),
      )[0] ?? null
    );
  }, [appointments]);

  const skinModel = useMemo(
    () => buildSkinCardModel(preConsultSnapshot),
    [preConsultSnapshot],
  );
  const medicalModel = useMemo(
    () =>
      buildMedicalCardModel(
        preConsultSnapshot,
        auth.flowContext,
        latestAppointment,
      ),
    [auth.flowContext, latestAppointment, preConsultSnapshot],
  );

  const handleLogout = () => {
    void auth.logout().finally(() => {
      navigate("/patient-flow/auth", { replace: true });
    });
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <DashboardLayout fullName={fullName} onLogout={handleLogout}>
      {error ? (
        <div className="mb-4 rounded-2xl border border-[#5B1112]/20 bg-[#5B1112]/5 px-4 py-3 text-sm text-[#5B1112]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[2rem] border border-white bg-white/70 p-6 text-sm text-[#111214]/55 shadow-[0_4px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl">
          Chargement de votre espace profil...
        </div>
      ) : (
        <ProfilePageContent
          activeProfile={activeProfile}
          stats={stats}
          consents={consents}
          preferences={preferences}
          activity={activity}
          skinModel={skinModel}
          medicalModel={medicalModel}
          scoreSeries={scoreSeries}
        />
      )}

      <div className="mt-4 grid grid-cols-1 gap-2 md:hidden">
        <Link
          to="/patient-flow/account/consents"
          className="rounded-xl border border-[#111214]/10 bg-white/80 px-3 py-2 text-xs text-[#111214]/70"
        >
          <span className="inline-flex items-center gap-2">
            <Shield size={12} /> Consentements
          </span>
        </Link>
        <Link
          to="/patient-flow/account/dependents"
          className="rounded-xl border border-[#111214]/10 bg-white/80 px-3 py-2 text-xs text-[#111214]/70"
        >
          <span className="inline-flex items-center gap-2">
            <Users size={12} /> Dépendants
          </span>
        </Link>
      </div>

      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => void handleLogout()}
        className="mt-4 hidden w-full rounded-[1.5rem] bg-red-50/60 px-4 py-3.5 text-left lg:block"
      >
        <span className="inline-flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
            <LogOut size={15} className="text-red-400" />
          </span>
          <span className="text-sm font-medium text-red-400">Déconnexion</span>
        </span>
      </motion.button>
    </DashboardLayout>
  );
}
