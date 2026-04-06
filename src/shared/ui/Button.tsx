import type { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@shared/lib/classNames";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-melanis-action-primary-default text-melanis-semantic-text-inverse hover:bg-melanis-action-primary-hover",
  secondary:
    "border border-melanis-semantic-border-default bg-white text-melanis-semantic-text-primary hover:bg-melanis-action-ghost-hover",
  ghost:
    "bg-transparent text-melanis-semantic-text-primary hover:bg-melanis-action-ghost-hover",
};

export function Button({
  children,
  className,
  disabled,
  fullWidth = true,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classNames(
        "inline-flex h-[50px] items-center justify-center rounded-[14px] px-4 text-[15px] font-semibold transition active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-melanis-action-disabled-bg disabled:text-melanis-action-disabled-text",
        VARIANT_CLASSES[variant],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
