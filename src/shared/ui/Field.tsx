import type { ReactNode } from "react";

interface FieldProps {
  children: ReactNode;
  helperText?: ReactNode;
  htmlFor?: string;
  label?: string;
}

export function Field({ children, helperText, htmlFor, label }: FieldProps) {
  return (
    <div>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-[13px] font-medium text-melanis-semantic-text-secondary"
        >
          {label}
        </label>
      ) : null}
      {children}
      {helperText ? (
        <p className="mt-1.5 px-1 text-[12px] font-medium text-melanis-semantic-text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
