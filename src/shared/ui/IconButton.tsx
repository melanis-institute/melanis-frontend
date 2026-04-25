import type { ButtonHTMLAttributes } from "react";
import { classNames } from "@shared/lib/classNames";

type IconButtonVariant = "primary" | "secondary" | "ghost";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: IconButtonVariant;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  primary:
    "bg-melanis-action-primary-default text-melanis-semantic-text-inverse hover:bg-melanis-action-primary-hover",
  secondary:
    "border border-melanis-semantic-border-default bg-white text-melanis-semantic-text-primary hover:bg-melanis-action-ghost-hover",
  ghost:
    "bg-transparent text-melanis-semantic-text-primary hover:bg-melanis-action-ghost-hover",
};

export function IconButton({
  children,
  className,
  disabled,
  label,
  type = "button",
  variant = "secondary",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled}
      className={classNames(
        "inline-flex h-11 w-11 items-center justify-center rounded-[14px] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-melanis-action-disabled-bg disabled:text-melanis-action-disabled-text",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
