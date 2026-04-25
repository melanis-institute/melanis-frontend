import type { ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

type StatusPillTone = "neutral" | "info" | "danger" | "success" | "warning";

interface StatusPillProps {
  children: ReactNode;
  tone?: StatusPillTone;
  className?: string;
}

const TONE_CLASSES: Record<StatusPillTone, string> = {
  neutral: "bg-melanis-status-neutral-bg text-melanis-status-neutral-text",
  info: "bg-melanis-status-info-bg text-melanis-status-info-text",
  danger: "bg-melanis-status-danger-bg text-melanis-status-danger-text",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
};

export function StatusPill({ children, className, tone = "neutral" }: StatusPillProps) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-label-s",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
