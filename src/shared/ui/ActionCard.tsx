import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

interface ActionCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  selected?: boolean;
}

export function ActionCard({
  className,
  description,
  icon,
  selected = false,
  title,
  type = "button",
  ...props
}: ActionCardProps) {
  return (
    <button
      type={type}
      className={classNames(
        "flex w-full items-center gap-4 rounded-[20px] border bg-white p-4 text-left transition hover:bg-melanis-action-ghost-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-melanis-semantic-focus-ring focus-visible:ring-offset-2",
        selected
          ? "border-melanis-action-primary-default"
          : "border-melanis-semantic-border-default",
        className,
      )}
      {...props}
    >
      {icon ? <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-melanis-status-info-bg text-melanis-status-info-text">{icon}</span> : null}
      <span className="min-w-0">
        <span className="block text-heading-h6 text-melanis-semantic-text-primary">{title}</span>
        {description ? (
          <span className="mt-1 block text-body-s text-melanis-semantic-text-muted">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
