import { Star, BadgeCheck } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PractitionerMiniCardProps {
  name: string;
  specialty: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  availableToday?: boolean;
  priceFrom?: string;
}

export function PractitionerMiniCard({
  name,
  specialty,
  rating = 4.8,
  reviewCount = 127,
  photoUrl,
  availableToday = true,
  priceFrom,
}: PractitionerMiniCardProps) {
  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-[20px] bg-white"
      style={{
        boxShadow:
          "0 1px 3px rgba(17, 18, 20, 0.03), 0 2px 8px rgba(17, 18, 20, 0.02)",
      }}
    >
      {/* Photo */}
      <div className="flex-shrink-0 w-[44px] h-[44px] rounded-[14px] overflow-hidden bg-[rgba(17,18,20,0.04)]">
        {photoUrl ? (
          <ImageWithFallback
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#5B1112] text-[16px]" style={{ fontWeight: 600 }}>
            {name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] text-[#111214] leading-[1.3] truncate"
          style={{ fontWeight: 600 }}
        >
          {name}
        </p>
        <p className="text-[12px] text-[rgba(17,18,20,0.5)] leading-[1.4] truncate">
          {specialty}
          {priceFrom && (
            <span className="text-[rgba(17,18,20,0.35)]"> · {priceFrom}</span>
          )}
        </p>
      </div>

      {/* Right side: rating + badge */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {/* Rating */}
        <div className="flex items-center gap-1">
          <Star
            className="w-[12px] h-[12px] text-[#6A1D1F] fill-[#6A1D1F]"
            strokeWidth={0}
          />
          <span className="text-[12px] text-[#111214]" style={{ fontWeight: 500 }}>
            {rating}
          </span>
          <span className="text-[11px] text-[rgba(17,18,20,0.35)]">
            ({reviewCount})
          </span>
        </div>

        {/* Available badge */}
        {availableToday && (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#00415E]" style={{ fontWeight: 500 }}>
            <BadgeCheck className="w-[11px] h-[11px]" strokeWidth={2} />
            Dispo. aujourd'hui
          </span>
        )}
      </div>
    </div>
  );
}
