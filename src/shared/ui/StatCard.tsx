import type { ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function StatCard({ className, description, label, value }: StatCardProps) {
  return (
    <div
      className={classNames(
        "rounded-[20px] border border-melanis-semantic-border-default bg-white p-4",
        className,
      )}
    >
      <p className="text-label-s uppercase tracking-overline text-melanis-semantic-text-muted">
        {label}
      </p>
      <p className="mt-2 text-display-h3 text-melanis-semantic-text-primary">{value}</p>
      {description ? (
        <p className="mt-1 text-body-s text-melanis-semantic-text-muted">{description}</p>
      ) : null}
    </div>
  );
}
