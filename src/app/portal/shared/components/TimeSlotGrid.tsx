import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { Clock, WifiOff, CalendarX2 } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onSelect: (time: string) => void;
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  selectedDateLabel?: string;
  onRetry?: () => void;
  onNextDays?: () => void;
}

// Skeleton slot for loading state
function SkeletonSlot() {
  return (
    <div className="h-[48px] rounded-[14px] bg-[rgba(17,18,20,0.04)] animate-pulse" />
  );
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  loading = false,
  error = false,
  errorMessage,
  selectedDateLabel,
  onRetry,
  onNextDays,
}: TimeSlotGridProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [columnCount, setColumnCount] = useState(3);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const syncColumns = () => {
      setColumnCount(mediaQuery.matches ? 4 : 3);
    };
    syncColumns();
    mediaQuery.addEventListener("change", syncColumns);
    return () => mediaQuery.removeEventListener("change", syncColumns);
  }, []);

  const moveFocus = (currentIndex: number, offset: number) => {
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= slots.length) return;
    buttonRefs.current[targetIndex]?.focus();
  };

  const handleGridKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    slot: TimeSlot,
    index: number
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (slot.available) onSelect(slot.time);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(index, 1);
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(index, -1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveFocus(index, columnCount);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveFocus(index, -columnCount);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Clock
            className="w-[14px] h-[14px] text-[rgba(17,18,20,0.3)]"
            strokeWidth={1.8}
          />
          <span
            className="text-[13px] text-[rgba(17,18,20,0.4)]"
            style={{ fontWeight: 500 }}
          >
            Heures disponibles
          </span>
        </div>
        <div
          className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          aria-busy="true"
          aria-label="Chargement des créneaux"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonSlot key={i} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center py-8 px-4 text-center">
        <div className="w-[48px] h-[48px] rounded-full bg-[rgba(91,17,18,0.08)] flex items-center justify-center mb-3">
          <WifiOff className="w-[22px] h-[22px] text-[#6A1D1F]" strokeWidth={1.6} />
        </div>
        <p
          className="text-[15px] text-[#111214] mb-1"
          style={{ fontWeight: 500 }}
        >
          Impossible de charger les disponibilités
        </p>
        <p className="text-[13px] text-[rgba(17,18,20,0.45)] mb-4">
          {errorMessage ?? "Vérifiez votre connexion et réessayez."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              px-5 py-2.5 rounded-[12px] text-[14px] text-[#5B1112]
              bg-[rgba(91,17,18,0.07)] hover:bg-[rgba(91,17,18,0.11)]
              transition-colors cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
            "
            style={{ fontWeight: 500 }}
          >
            Réessayer
          </button>
        )}
      </div>
    );
  }

  // Empty state (no slots available)
  const availableSlots = slots.filter((s) => s.available);
  if (slots.length === 0 || availableSlots.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 px-4 text-center">
        <div className="w-[48px] h-[48px] rounded-full bg-[rgba(254,240,213,0.5)] flex items-center justify-center mb-3">
          <CalendarX2
            className="w-[22px] h-[22px] text-[rgba(17,18,20,0.35)]"
            strokeWidth={1.6}
          />
        </div>
        <p
          className="text-[15px] text-[#111214] mb-1"
          style={{ fontWeight: 500 }}
        >
          Aucun créneau disponible
        </p>
        <p className="text-[13px] text-[rgba(17,18,20,0.45)] mb-4">
          {selectedDateLabel
            ? `${selectedDateLabel}: aucune disponibilité pour cette période.`
            : "Essayez un autre jour pour trouver une disponibilité."}
        </p>
        {onNextDays && (
          <button
            onClick={onNextDays}
            className="
              px-5 py-2.5 rounded-[12px] text-[14px] text-[#00415E]
              bg-[rgba(0,65,94,0.06)] hover:bg-[rgba(0,65,94,0.1)]
              transition-colors cursor-pointer
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
            "
            style={{ fontWeight: 500 }}
          >
            Voir +7 jours
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Clock
          className="w-[14px] h-[14px] text-[rgba(17,18,20,0.3)]"
          strokeWidth={1.8}
        />
        <span
          className="text-[13px] text-[rgba(17,18,20,0.4)]"
          style={{ fontWeight: 500 }}
        >
          Heures disponibles
        </span>
      </div>

      <div
        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
        role="grid"
        aria-label="Grille des créneaux horaires"
      >
        {slots.map((slot, index) => {
          const isSelected = selectedTime === slot.time;
          return (
            <motion.button
              key={slot.time}
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.25,
                delay: index * 0.025,
                ease: "easeOut",
              }}
              whileTap={slot.available ? { scale: 0.95 } : undefined}
              onClick={() => slot.available && onSelect(slot.time)}
              onKeyDown={(event) => handleGridKeyDown(event, slot, index)}
              aria-label={`Créneau ${slot.time}${slot.available ? "" : " indisponible"}`}
              aria-selected={isSelected}
              disabled={!slot.available}
              className={`
                h-[48px] rounded-[14px] text-[15px] tracking-[-0.1px]
                cursor-pointer transition-all duration-200
                flex items-center justify-center
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
                ${
                  isSelected
                    ? "bg-[#5B1112] text-white shadow-md"
                    : slot.available
                      ? "bg-white text-[#111214] hover:bg-[#FFFDF8] hover:shadow-sm"
                      : "bg-[rgba(17,18,20,0.02)] text-[rgba(17,18,20,0.2)] cursor-not-allowed"
                }
              `}
              style={{
                fontWeight: isSelected ? 600 : 500,
                boxShadow: isSelected
                  ? "0 4px 12px rgba(91, 17, 18, 0.2)"
                  : slot.available
                    ? "0 1px 3px rgba(17, 18, 20, 0.04)"
                    : "none",
                minHeight: 48,
              }}
            >
              {slot.time}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
