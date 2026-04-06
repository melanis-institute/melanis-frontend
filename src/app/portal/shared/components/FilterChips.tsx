import { motion } from "motion/react";

interface FilterChip {
  key: string;
  label: string;
}

interface FilterChipsProps {
  filters: FilterChip[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export function FilterChips({ filters, activeKey, onSelect }: FilterChipsProps) {
  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: "none" }}
      role="tablist"
      aria-label="Périodes de la journée"
    >
      {filters.map((filter) => {
        const isActive = activeKey === filter.key;
        return (
          <motion.button
            key={filter.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(filter.key)}
            role="tab"
            aria-selected={isActive}
            aria-label={`Filtrer par ${filter.label}`}
            className={`
              flex-shrink-0 px-3.5 py-[7px] rounded-full text-[13px] tracking-[-0.1px]
              cursor-pointer transition-all duration-200
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA]
              ${
                isActive
                  ? "bg-[#111214] text-white"
                  : "bg-white text-[rgba(17,18,20,0.6)] hover:bg-[rgba(17,18,20,0.06)]"
              }
            `}
            style={{
              fontWeight: 500,
              boxShadow: isActive
                ? "none"
                : "0 1px 2px rgba(17, 18, 20, 0.04)",
              minHeight: 34,
            }}
          >
            {filter.label}
          </motion.button>
        );
      })}
    </div>
  );
}
