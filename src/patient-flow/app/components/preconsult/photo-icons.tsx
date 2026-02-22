import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Natural light — sun rays */
export function IconLumiereNaturelle(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" strokeWidth="1.4" />
      <path d="M12 2v2" strokeWidth="1.5" />
      <path d="M12 20v2" strokeWidth="1.5" />
      <path d="M4.93 4.93l1.41 1.41" strokeWidth="1.5" />
      <path d="M17.66 17.66l1.41 1.41" strokeWidth="1.5" />
      <path d="M2 12h2" strokeWidth="1.5" />
      <path d="M20 12h2" strokeWidth="1.5" />
      <path d="M6.34 17.66l-1.41 1.41" strokeWidth="1.5" />
      <path d="M19.07 4.93l-1.41 1.41" strokeWidth="1.5" />
    </svg>
  );
}

/** No filter — sparkle with slash */
export function IconPasDeFiltre(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Sparkle/wand */}
      <path d="M9.5 3l1 2.5L13 6.5l-2.5 1L9.5 10l-1-2.5L6 6.5l2.5-1L9.5 3z" strokeWidth="1.3" />
      <path d="M18 8l.5 1.5L20 10l-1.5.5L18 12l-.5-1.5L16 10l1.5-.5L18 8z" strokeWidth="1.2" opacity="0.5" />
      {/* Slash */}
      <path d="M3 21L21 3" strokeWidth="1.8" opacity="0.6" />
    </svg>
  );
}

/** Close-up photo — magnifying glass on skin */
export function IconPhotoClose(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" strokeWidth="1.4" />
      <path d="M21 21l-4.35-4.35" strokeWidth="1.8" />
      {/* Plus inside */}
      <path d="M10.5 7.5v6" strokeWidth="1.3" />
      <path d="M7.5 10.5h6" strokeWidth="1.3" />
    </svg>
  );
}

/** Wide shot — camera frame with landscape */
export function IconPhotoWide(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Frame */}
      <rect x="2" y="5" width="20" height="14" rx="2.5" strokeWidth="1.4" />
      {/* Arrows pointing outward */}
      <path d="M8 12H4.5" strokeWidth="1.3" />
      <path d="M4.5 12l2-1.5" strokeWidth="1.2" />
      <path d="M4.5 12l2 1.5" strokeWidth="1.2" />
      <path d="M16 12h3.5" strokeWidth="1.3" />
      <path d="M19.5 12l-2-1.5" strokeWidth="1.2" />
      <path d="M19.5 12l-2 1.5" strokeWidth="1.2" />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Camera — stylized camera with shutter */
export function IconCamera(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7.5 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L14.5 4z" strokeWidth="1.4" />
      <circle cx="12" cy="13" r="3.5" strokeWidth="1.4" />
      {/* Shutter sparkle */}
      <circle cx="12" cy="13" r="1" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  );
}

/** Gallery/Import — image stack */
export function IconGalerie(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Back card */}
      <rect x="5" y="2" width="16" height="14" rx="2" strokeWidth="1.2" opacity="0.35" />
      {/* Front card */}
      <rect x="3" y="5" width="16" height="14" rx="2" strokeWidth="1.4" />
      {/* Mountain landscape */}
      <path d="M3 16l4-4 3 3 4-5 5 6" strokeWidth="1.3" />
      {/* Sun */}
      <circle cx="7.5" cy="9.5" r="1.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Shield privacy — shield with lock */
export function IconPrivacy(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z" strokeWidth="1.4" />
      {/* Lock */}
      <rect x="9.5" y="11" width="5" height="4" rx="1" strokeWidth="1.3" />
      <path d="M10.5 11v-1.5a1.5 1.5 0 0 1 3 0V11" strokeWidth="1.3" />
    </svg>
  );
}

/** Skip/no photo — camera with X */
export function IconSkipPhoto(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14.5 4h-5L7.5 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L14.5 4z" strokeWidth="1.4" opacity="0.5" />
      {/* X */}
      <path d="M9.5 10.5l5 5" strokeWidth="1.6" />
      <path d="M14.5 10.5l-5 5" strokeWidth="1.6" />
    </svg>
  );
}

/** Photo slot empty — dashed circle placeholder */
export function IconPhotoSlot(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.4" />
      <path d="M12 9v6" strokeWidth="1.3" opacity="0.3" />
      <path d="M9 12h6" strokeWidth="1.3" opacity="0.3" />
    </svg>
  );
}
