import type { HTMLAttributes, InputHTMLAttributes } from "react";
import { Phone } from "lucide-react";
import { classNames } from "@shared/lib/classNames";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  hasError?: boolean;
  className?: string;
}

export function Input({ className, hasError = false, ...props }: InputProps) {
  return (
    <input
      className={classNames(
        "h-[50px] w-full rounded-[14px] border bg-white px-4 text-[15px] font-medium text-melanis-semantic-text-primary outline-none transition placeholder:text-melanis-semantic-text-muted focus-visible:ring-2 focus-visible:ring-melanis-semantic-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] disabled:cursor-not-allowed disabled:bg-melanis-action-disabled-bg",
        hasError ? "border-melanis-status-danger-text" : "border-melanis-semantic-border-default",
        className,
      )}
      {...props}
    />
  );
}

interface PhoneInput221Props extends Omit<InputProps, "type" | "inputMode" | "autoComplete"> {
  onValueChange: (value: string) => void;
}

export function PhoneInput221({
  className,
  onValueChange,
  placeholder = "77 123 45 67",
  value,
  ...props
}: PhoneInput221Props) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-melanis-primitive-cream-200 px-2 py-1 text-[12px] text-melanis-semantic-text-secondary">
        <Phone className="h-[11px] w-[11px]" strokeWidth={1.8} />
        <span className="font-medium">+221</span>
      </div>
      <Input
        {...props}
        value={value}
        className={classNames("pl-[88px] pr-4", className)}
        placeholder={placeholder}
        type="tel"
        autoComplete="tel"
        inputMode={"numeric" as HTMLAttributes<HTMLInputElement>["inputMode"]}
        onChange={(event) => onValueChange(event.target.value.replace(/[^0-9\s]/g, ""))}
      />
    </div>
  );
}
