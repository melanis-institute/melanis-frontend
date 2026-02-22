import { motion } from "motion/react";
import { Loader2, Phone, ShieldCheck } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { formatPhoneE164ToReadable } from "../../auth/validation";

export function FieldLabel({ children, htmlFor }: { children: string; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[13px] text-[rgba(17,18,20,0.76)]"
      style={{ fontWeight: 500 }}
    >
      {children}
    </label>
  );
}

export function TextInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  inputMode,
  hasError,
  maxLength,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  hasError?: boolean;
  maxLength?: number;
  disabled?: boolean;
}) {
  return (
    <input
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
      autoComplete={autoComplete}
      inputMode={inputMode}
      maxLength={maxLength}
      disabled={disabled}
      className="h-[50px] w-full rounded-[14px] bg-white px-4 text-[15px] text-[#111214] outline-none transition focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] placeholder:text-[rgba(17,18,20,0.38)] disabled:cursor-not-allowed disabled:bg-[rgba(17,18,20,0.05)]"
      style={{
        border: hasError
          ? "1px solid rgba(91,17,18,0.35)"
          : "1px solid rgba(17,18,20,0.12)",
        fontWeight: 500,
      }}
    />
  );
}

export function PhoneInput221({
  id,
  value,
  onChange,
  placeholder = "77 123 45 67",
  hasError,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-full bg-[rgba(254,240,213,0.75)] px-2 py-1 text-[12px] text-[rgba(17,18,20,0.72)]">
        <Phone className="h-[11px] w-[11px]" strokeWidth={1.8} />
        <span style={{ fontWeight: 500 }}>+221</span>
      </div>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^0-9\s]/g, ""))}
        placeholder={placeholder}
        type="tel"
        autoComplete="tel"
        inputMode="numeric"
        disabled={disabled}
        className="h-[50px] w-full rounded-[14px] bg-white pr-4 pl-[88px] text-[15px] text-[#111214] outline-none transition focus-visible:ring-2 focus-visible:ring-[#00415E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAFAFA] placeholder:text-[rgba(17,18,20,0.38)] disabled:cursor-not-allowed disabled:bg-[rgba(17,18,20,0.05)]"
        style={{
          border: hasError
            ? "1px solid rgba(91,17,18,0.35)"
            : "1px solid rgba(17,18,20,0.12)",
          fontWeight: 500,
        }}
      />
    </div>
  );
}

export function ErrorSummary({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      role="status"
      aria-live="polite"
      tabIndex={-1}
      className="rounded-[14px] border border-[rgba(91,17,18,0.2)] bg-[rgba(91,17,18,0.08)] px-3.5 py-2.5 text-[13px] text-[#5B1112]"
      style={{ fontWeight: 500 }}
    >
      {message}
    </motion.div>
  );
}

export function HelperText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 px-1 text-[12px] text-[rgba(17,18,20,0.52)]" style={{ fontWeight: 500 }}>
      {children}
    </p>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="h-[50px] w-full rounded-[14px] text-[15px] text-white transition active:scale-[0.99] disabled:cursor-not-allowed"
      style={{
        background: disabled || loading ? "rgba(17,18,20,0.3)" : "#5B1112",
        fontWeight: 600,
      }}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-[16px] w-[16px] animate-spin" />
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="h-[50px] w-full rounded-[14px] border border-[rgba(17,18,20,0.14)] bg-white text-[15px] text-[#111214] transition hover:bg-[rgba(17,18,20,0.02)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      style={{ fontWeight: 500 }}
    >
      {children}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.17-2.02H10v3.82h5.38a4.6 4.6 0 0 1-2 3.01v2.5h3.24c1.89-1.74 2.98-4.31 2.98-7.31Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.89 6.62-2.42l-3.24-2.51c-.89.6-2.04.96-3.38.96-2.6 0-4.8-1.75-5.58-4.1H1.07v2.6A9.99 9.99 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.42 11.93a6.02 6.02 0 0 1 0-3.86v-2.6H1.07a9.99 9.99 0 0 0 0 9.05l3.35-2.59Z"
        fill="#FBBC04"
      />
      <path
        d="M10 3.96a5.42 5.42 0 0 1 3.84 1.5l2.88-2.88A9.64 9.64 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.47l3.35 2.6c.78-2.36 2.98-4.11 5.58-4.11Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M20 10a10 10 0 1 0-11.56 9.88v-6.99H5.9V10h2.54V7.8c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46H13.2c-1.24 0-1.63.77-1.63 1.56V10h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 20 10Z"
        fill="#1877F2"
      />
      <path
        d="M13.9 12.89 14.34 10h-2.78V8.13c0-.8.39-1.56 1.63-1.56h1.26V4.11s-1.15-.2-2.24-.2c-2.29 0-3.78 1.39-3.78 3.89V10H5.9v2.89h2.54v6.99a10.15 10.15 0 0 0 3.12 0v-6.99h2.34Z"
        fill="white"
      />
    </svg>
  );
}

export function SocialButtons({
  onGoogle,
  onFacebook,
}: {
  onGoogle: () => void;
  onFacebook: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <SecondaryButton onClick={onGoogle}>
        <span className="inline-flex items-center gap-2.5">
          <GoogleIcon />
          Continuer avec Google
        </span>
      </SecondaryButton>
      <SecondaryButton onClick={onFacebook}>
        <span className="inline-flex items-center gap-2.5">
          <FacebookIcon />
          Continuer avec Facebook
        </span>
      </SecondaryButton>
    </div>
  );
}

export function Divider({ label = "ou" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <div className="h-px flex-1 bg-[rgba(17,18,20,0.1)]" />
      <span className="text-[12px] text-[rgba(17,18,20,0.4)]" style={{ fontWeight: 500 }}>
        {label}
      </span>
      <div className="h-px flex-1 bg-[rgba(17,18,20,0.1)]" />
    </div>
  );
}

export function SecurityHint() {
  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-[rgba(0,65,94,0.15)] bg-[rgba(0,65,94,0.06)] px-3 py-2 text-[12px] text-[rgba(0,65,94,0.88)]">
      <ShieldCheck className="h-[14px] w-[14px]" strokeWidth={1.8} />
      <span style={{ fontWeight: 500 }}>Connexion sécurisée par OTP + PIN optionnel</span>
    </div>
  );
}

export function DraftPill({ label, onResume }: { label: string; onResume: () => void }) {
  return (
    <button
      onClick={onResume}
      className="rounded-full border border-[rgba(17,18,20,0.16)] bg-white px-3 py-1.5 text-[12px] text-[rgba(17,18,20,0.8)] transition hover:bg-[rgba(17,18,20,0.03)]"
      style={{ fontWeight: 500 }}
    >
      {label}
    </button>
  );
}

export function PhoneCaption({ phoneE164 }: { phoneE164: string }) {
  return (
    <p className="text-[13px] text-[rgba(17,18,20,0.6)]" style={{ fontWeight: 500 }}>
      {formatPhoneE164ToReadable(phoneE164)}
    </p>
  );
}
