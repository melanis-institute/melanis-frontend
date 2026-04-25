import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

interface PageSectionProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageSection({
  actions,
  children,
  className,
  description,
  title,
  ...props
}: PageSectionProps) {
  return (
    <section className={classNames("space-y-4", className)} {...props}>
      {title || description || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {title ? (
              <h2 className="text-heading-h4 text-melanis-semantic-text-primary">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-body-s text-melanis-semantic-text-muted">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
