import { Clock, MapPin, Video } from "lucide-react";

interface ContextChipsProps {
  appointmentType: "presentiel" | "video";
  duration?: string;
  location?: string;
}

export function ContextChips({
  appointmentType,
  duration = "20 min",
  location,
}: ContextChipsProps) {
  const typeLabel =
    appointmentType === "presentiel" ? "Présentiel" : "Vidéo consultation";
  const typeIcon =
    appointmentType === "video" ? (
      <Video className="w-[13px] h-[13px]" strokeWidth={1.8} />
    ) : (
      <MapPin className="w-[13px] h-[13px]" strokeWidth={1.8} />
    );

  const locationLabel =
    location ??
    (appointmentType === "presentiel"
      ? "Cabinet, Dakar"
      : "Consulation en ligne");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Type chip */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] tracking-[-0.1px]"
        style={{
          background:
            appointmentType === "presentiel"
              ? "rgba(91, 17, 18, 0.06)"
              : "rgba(0, 65, 94, 0.06)",
          color: appointmentType === "presentiel" ? "#5B1112" : "#00415E",
          fontWeight: 500,
        }}
      >
        {typeIcon}
        {typeLabel}
      </span>

      {/* Duration chip */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] tracking-[-0.1px]"
        style={{
          background: "rgba(17, 18, 20, 0.05)",
          color: "rgba(17, 18, 20, 0.6)",
          fontWeight: 500,
        }}
      >
        <Clock className="w-[13px] h-[13px]" strokeWidth={1.8} />
        {duration}
      </span>

      {/* Location chip */}
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] tracking-[-0.1px]"
        style={{
          background: "rgba(17, 18, 20, 0.05)",
          color: "rgba(17, 18, 20, 0.6)",
          fontWeight: 500,
        }}
      >
        {locationLabel}
      </span>
    </div>
  );
}
