import type { ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function Tabs<T extends string>({ className, items, label, onChange, value }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={classNames(
        "inline-flex rounded-full border border-melanis-semantic-border-default bg-white p-1",
        className,
      )}
    >
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={classNames(
              "rounded-full px-4 py-2 text-button-s transition",
              selected
                ? "bg-melanis-action-primary-default text-melanis-semantic-text-inverse"
                : "text-melanis-semantic-text-muted hover:bg-melanis-action-ghost-hover",
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
