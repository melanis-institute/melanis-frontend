import type { AuthErrorCode } from "./adapter";

const PHONE_221_REGEX = /^7\d{8}$/;
const OTP_REGEX = /^\d{6}$/;
const PIN_REGEX = /^\d{4}$/;

export function normalizePhone221(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (digits.startsWith("221")) {
    return digits.slice(3, 12);
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return digits.slice(1, 10);
  }

  return digits.slice(0, 9);
}

export function isValidPhone221(localPhone: string): boolean {
  return PHONE_221_REGEX.test(localPhone);
}

export function toE164(phoneInput: string): string {
  const local = normalizePhone221(phoneInput);
  return `+221${local}`;
}

export function isValidOtpCode(code: string): boolean {
  return OTP_REGEX.test(code);
}

export function isValidPin(pin: string): boolean {
  return PIN_REGEX.test(pin);
}

export function formatPhoneE164ToReadable(phoneE164: string): string {
  const digits = phoneE164.replace(/\D/g, "").replace(/^221/, "");
  if (digits.length !== 9) {
    return phoneE164;
  }

  return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`;
}

export function mapAuthErrorToMessage(
  code: AuthErrorCode,
  meta?: Record<string, unknown>
): string {
  const attemptsRemaining =
    typeof meta?.attemptsRemaining === "number"
      ? meta.attemptsRemaining
      : undefined;

  switch (code) {
    case "INVALID_PHONE":
      return "Numéro invalide. Saisissez un numéro sénégalais valide.";
    case "PHONE_NOT_REGISTERED":
      return "Ce numéro n'a pas encore de compte. Créez votre compte pour continuer.";
    case "PHONE_ALREADY_REGISTERED":
      return "Ce numéro est déjà enregistré. Connectez-vous pour continuer.";
    case "OTP_INVALID":
      return attemptsRemaining != null
        ? `Code incorrect. Il vous reste ${attemptsRemaining} tentative(s).`
        : "Code OTP incorrect.";
    case "OTP_EXPIRED":
      return "Ce code a expiré. Demandez un nouveau code.";
    case "OTP_RESEND_BLOCKED":
      return "Veuillez patienter avant de renvoyer un code.";
    case "OTP_ATTEMPTS_EXCEEDED":
      return "Trop de tentatives OTP. Demandez un nouveau code.";
    case "PIN_INVALID":
      return attemptsRemaining != null
        ? `PIN incorrect. Il vous reste ${attemptsRemaining} tentative(s).`
        : "PIN incorrect.";
    case "PIN_LOCKED":
      return "Trop d'essais. Réessayez plus tard ou utilisez OTP.";
    case "PIN_NOT_SET":
      return "Aucun PIN configuré pour ce compte. Utilisez OTP.";
    case "PIN_WEAK":
      return "Le PIN doit contenir exactement 4 chiffres.";
    case "TEMP_TOKEN_INVALID":
      return "Session de vérification expirée. Recommencez la vérification.";
    case "TERMS_REQUIRED":
      return "Vous devez accepter les conditions pour créer un compte.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
}
