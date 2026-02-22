import { useRef, useState } from "react";
import { ChevronRight, CalendarDays } from "lucide-react";
import { motion } from "motion/react";

interface DateChip {
  key: string;
  dayLabel: string;
  dateNum: number;
  monthLabel: string;
  isToday?: boolean;
  hasSlots?: boolean;
}

interface DateChipSelectorProps {
  dates: DateChip[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onShowMore?: () => void;
}

export function DateChipSelector({
  dates,
  selectedKey,
  onSelect,
  onShowMore,
}: DateChipSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 160, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Scrollable date chips */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        role="listbox"
        aria-label="Sélection de dates"
      >
        {dates.map((date) => {
          const isSelected = selectedKey === date.key;
          return (
            <motion.button
              key={date.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(date.key)}
              aria-label={`${date.dayLabel} ${date.dateNum} ${date.monthLabel}`}
              aria-selected={isSelected}
              className={`
                flex-shrink-0 flex flex-col items-center justify-center
                w-[62px] h-[72px] rounded-[18px] cursor-pointer
                transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
                ${
                  isSelected
                    ? "bg-[#5B1112] text-white shadow-md"
                    : date.hasSlots === false
                      ? "bg-[rgba(17,18,20,0.03)] text-[rgba(17,18,20,0.25)] cursor-not-allowed"
                      : "bg-white text-[#111214] hover:bg-[#FFFDF8] hover:shadow-sm"
                }
              `}
              style={{
                boxShadow: isSelected
                  ? "0 4px 14px rgba(91, 17, 18, 0.2)"
                  : date.hasSlots === false
                    ? "none"
                    : "0 1px 3px rgba(17, 18, 20, 0.04)",
                minWidth: 62,
              }}
              disabled={date.hasSlots === false}
            >
              <span
                className={`text-[11px] uppercase tracking-[0.5px] ${
                  isSelected
                    ? "text-white/70"
                    : date.hasSlots === false
                      ? "text-[rgba(17,18,20,0.2)]"
                      : "text-[rgba(17,18,20,0.45)]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {date.dayLabel}
              </span>
              <span
                className="text-[20px] leading-[1.2] mt-0.5"
                style={{ fontWeight: 600 }}
              >
                {date.dateNum}
              </span>
              <span
                className={`text-[10px] ${
                  isSelected
                    ? "text-white/60"
                    : date.hasSlots === false
                      ? "text-[rgba(17,18,20,0.15)]"
                      : "text-[rgba(17,18,20,0.35)]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {date.isToday ? "Auj." : date.monthLabel}
              </span>
            </motion.button>
          );
        })}

        {/* "Voir plus" chip */}
        {onShowMore && (
          <button
            onClick={onShowMore}
            aria-label="Voir plus de dates"
            className="
              flex-shrink-0 flex flex-col items-center justify-center
              w-[62px] h-[72px] rounded-[18px] cursor-pointer
              bg-transparent border border-dashed border-[rgba(17,18,20,0.15)]
              text-[rgba(17,18,20,0.4)] hover:border-[rgba(17,18,20,0.3)]
              hover:text-[rgba(17,18,20,0.6)] transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
            "
            style={{ minWidth: 62 }}
          >
            <CalendarDays className="w-[16px] h-[16px] mb-0.5" strokeWidth={1.6} />
            <span className="text-[10px]" style={{ fontWeight: 500 }}>
              Plus
            </span>
          </button>
        )}
      </div>

      {/* Scroll fade + arrow (right edge) */}
      {canScrollRight && dates.length > 5 && (
        <button
          onClick={scrollRight}
          aria-label="Faire défiler les dates vers la droite"
          className="
            absolute right-0 top-0 bottom-1 w-[44px]
            flex items-center justify-end
            cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FAFAFA]
          "
          style={{
            background:
              "linear-gradient(to right, transparent, #FAFAFA 70%)",
          }}
        >
          <ChevronRight
            className="w-[18px] h-[18px] text-[rgba(17,18,20,0.4)]"
            strokeWidth={2}
          />
        </button>
      )}
    </div>
  );
}
