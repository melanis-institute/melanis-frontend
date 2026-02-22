import type { ReactNode } from "react";
import { CalendarDays, Clock3, Stethoscope, UserRound, Video } from "lucide-react";

type AppointmentType = "presentiel" | "video";
export type PatientProfile = "moi" | "enfant" | "proche";

interface PersistentContextBarProps {
  profile?: PatientProfile | string | null;
  onProfileChange?: (profile: PatientProfile) => void;
  appointmentType?: AppointmentType | null;
  practitionerName?: string | null;
  dateLabel?: string | null;
  timeLabel?: string | null;
}

const PROFILE_OPTIONS: Array<{ key: PatientProfile; label: string }> = [
  { key: "moi", label: "Pour moi" },
  { key: "enfant", label: "Mon enfant" },
  { key: "proche", label: "Un proche" },
];

function normalizeProfile(profile?: string | null): PatientProfile {
  if (profile === "enfant" || profile === "proche" || profile === "moi") {
    return profile;
  }
  return "moi";
}

function profileToLabel(profile?: string | null) {
  return PROFILE_OPTIONS.find((item) => item.key === normalizeProfile(profile))?.label ?? "Pour moi";
}

export function PersistentContextBar({
  profile,
  onProfileChange,
  appointmentType,
  practitionerName,
  dateLabel,
  timeLabel,
}: PersistentContextBarProps) {
  const safeProfile = normalizeProfile(profile);
  const typeLabel =
    appointmentType === "video"
      ? "Vidéo"
      : appointmentType === "presentiel"
        ? "Présentiel"
        : "Type à définir";

  return (
    <div
      className="rounded-[16px] border border-[rgba(17,18,20,0.08)] bg-white/95 px-3 py-2.5"
      role="region"
      aria-label="Contexte du rendez-vous"
      style={{
        boxShadow: "0 1px 3px rgba(17,18,20,0.03)",
      }}
    >
      <div
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[rgba(17,18,20,0.05)] px-2.5 py-1.5 text-[11.5px] text-[rgba(17,18,20,0.72)]">
          <span className="text-[#00415E]">
            <UserRound className="h-3.5 w-3.5" strokeWidth={1.8} />
          </span>
          <span className="whitespace-nowrap text-[rgba(17,18,20,0.55)]">
            Agir pour:
          </span>
          {onProfileChange ? (
            <label className="sr-only" htmlFor="profile-switcher">
              Choisir le profil patient
            </label>
          ) : null}
          {onProfileChange ? (
            <select
              id="profile-switcher"
              value={safeProfile}
              onChange={(event) =>
                onProfileChange(event.target.value as PatientProfile)
              }
              className="rounded-full bg-transparent pr-1 text-[#111214] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-1 focus-visible:ring-offset-white"
              style={{ fontWeight: 520 }}
              aria-label="Agir pour"
            >
              {PROFILE_OPTIONS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="whitespace-nowrap text-[#111214]" style={{ fontWeight: 520 }}>
              {profileToLabel(safeProfile)}
            </span>
          )}
        </div>
        <ContextPill
          icon={
            appointmentType === "video" ? (
              <Video className="h-3.5 w-3.5" strokeWidth={1.8} />
            ) : (
              <Stethoscope className="h-3.5 w-3.5" strokeWidth={1.8} />
            )
          }
          label={`Type: ${typeLabel}`}
        />
        <ContextPill
          icon={<Stethoscope className="h-3.5 w-3.5" strokeWidth={1.8} />}
          label={`Praticien: ${practitionerName ?? "À définir"}`}
        />
        <ContextPill
          icon={<CalendarDays className="h-3.5 w-3.5" strokeWidth={1.8} />}
          label={`Date: ${dateLabel ?? "À définir"}`}
        />
        <ContextPill
          icon={<Clock3 className="h-3.5 w-3.5" strokeWidth={1.8} />}
          label={`Heure: ${timeLabel ?? "À définir"}`}
        />
      </div>
    </div>
  );
}

function ContextPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div
      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-full bg-[rgba(17,18,20,0.05)] px-2.5 py-1.5 text-[11.5px] text-[rgba(17,18,20,0.72)]"
      style={{ fontWeight: 500 }}
    >
      <span className="text-[#00415E]">{icon}</span>
      <span className="whitespace-nowrap">{label}</span>
    </div>
  );
}
