import type { ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

type BadgeTone = "info" | "neutral" | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  info: "bg-melanis-status-info-bg text-melanis-status-info-text",
  neutral: "bg-melanis-status-neutral-bg text-melanis-status-neutral-text",
  danger: "bg-melanis-status-danger-bg text-melanis-status-danger-text",
};

interface BadgeProps {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}

export function Badge({ children, className, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
