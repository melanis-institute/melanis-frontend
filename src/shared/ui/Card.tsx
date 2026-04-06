import type { HTMLAttributes, ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-[20px] border border-melanis-semantic-border-default bg-melanis-semantic-surface-card",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
