import { useState } from "react";
import { motion } from "motion/react";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  selected?: boolean;
  onSelect?: () => void;
}

export function OptionCard({
  icon,
  title,
  description,
  selected = false,
  onSelect,
}: OptionCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      onClick={onSelect}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      animate={{
        scale: isPressed ? 0.98 : 1,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        w-full h-full flex items-center gap-[16px] p-[20px] rounded-[28px] text-left
        transition-all duration-200 cursor-pointer
        ${
          selected
            ? "bg-white ring-[1.5px] ring-[#5B1112]/20"
            : "bg-white hover:bg-[#FFFDF8] hover:shadow-md"
        }
      `}
      style={{
        boxShadow: selected
          ? "0 2px 8px rgba(91, 17, 18, 0.08), 0 1px 3px rgba(17, 18, 20, 0.04)"
          : isPressed
            ? "0 1px 2px rgba(17, 18, 20, 0.03)"
            : "0 1px 3px rgba(17, 18, 20, 0.04), 0 4px 12px rgba(17, 18, 20, 0.03)",
        minHeight: "88px",
      }}
    >
      {/* Icon container */}
      <div
        className={`
          flex-shrink-0 w-[44px] h-[44px] rounded-[14px] flex items-center justify-center
          transition-colors duration-200
          ${
            selected
              ? "bg-[#5B1112]/10"
              : "bg-[#FEF0D5]/60"
          }
        `}
      >
        <div
          className={`transition-colors duration-200 ${
            selected ? "text-[#5B1112]" : "text-[#111214]/70"
          }`}
        >
          {icon}
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-[16px] leading-[1.3] tracking-[-0.1px] transition-colors duration-200
            ${selected ? "text-[#5B1112]" : "text-[#111214]"}
          `}
          style={{ fontWeight: 600 }}
        >
          {title}
        </p>
        <p className="mt-[4px] text-[14px] leading-[1.4] text-[rgba(17,18,20,0.5)]">
          {description}
        </p>
      </div>

      {/* Selected indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex-shrink-0 w-[22px] h-[22px] rounded-full bg-[#5B1112] flex items-center justify-center"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="white"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      )}
    </motion.button>
  );
}