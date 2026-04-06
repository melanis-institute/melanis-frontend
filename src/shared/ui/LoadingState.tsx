import { Loader2 } from "lucide-react";
import { classNames } from "@shared/lib/classNames";

interface LoadingStateProps {
  className?: string;
  label?: string;
}

export function LoadingState({
  className,
  label = "Chargement...",
}: LoadingStateProps) {
  return (
    <div
      className={classNames(
        "flex min-h-screen items-center justify-center bg-melanis-semantic-surface-page px-6",
        className,
      )}
    >
      <div className="inline-flex items-center gap-3 rounded-2xl border border-melanis-semantic-border-default bg-white px-4 py-3 text-sm text-melanis-semantic-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}
