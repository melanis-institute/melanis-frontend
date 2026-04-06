import type { ReactNode } from "react";

interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}

export function SectionHeader({ description, eyebrow, title }: SectionHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-melanis-semantic-text-muted">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-heading-h4 text-melanis-semantic-text-primary">{title}</h2>
      {description ? (
        <p className="text-body-s text-melanis-semantic-text-secondary">{description}</p>
      ) : null}
    </div>
  );
}
