import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SelectableChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
  icon?: LucideIcon;
  customIcon?: ReactNode;
}

export function SelectableChip({
  label,
  selected,
  onToggle,
  size = "md",
  icon: Icon,
  customIcon,
}: SelectableChipProps) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      className={`
        inline-flex items-center gap-2 justify-center rounded-full cursor-pointer
        transition-all duration-200
        ${size === "sm" ? "px-3.5 py-[7px] text-[13px]" : "px-5 py-[11px] text-[15px]"}
        ${
          selected
            ? "bg-[#5B1112]/10 text-[#5B1112] ring-[1.5px] ring-[#5B1112]/20"
            : "bg-white text-[#111214]/70 hover:bg-[#FFFDF8]"
        }
      `}
      style={{
        boxShadow: selected
          ? "none"
          : "0 1px 3px rgba(17,18,20,0.04), 0 1px 2px rgba(17,18,20,0.02)",
        fontWeight: selected ? 600 : 500,
        minHeight: 46,
      }}
    >
      {customIcon ? (
        <span className="w-[18px] h-[18px] flex-shrink-0">{customIcon}</span>
      ) : Icon ? (
        <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.8} />
      ) : null}
      {label}
    </motion.button>
  );
}