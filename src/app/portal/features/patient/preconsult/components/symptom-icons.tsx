import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Démangeaisons — fingers scratching skin with irritation lines */
export function IconDemangeaisons(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Hand/fingers scratching */}
      <path d="M8 4.5V11" />
      <path d="M11 3v8" />
      <path d="M14 4.5V11" />
      <path d="M5.5 7V11" />
      {/* Fingertips */}
      <path d="M8 4.5a1 1 0 0 0-2 0" />
      <path d="M11 3a1 1 0 0 0-2 0" />
      <path d="M14 4.5a1 1 0 0 0-2 0" />
      <path d="M5.5 7a1 1 0 0 0-2 0" />
      {/* Skin surface with scratch marks */}
      <path d="M3 14c3-2 6-3.5 9-3.5s6 1.5 9 3.5" strokeWidth="1.4" />
      {/* Irritation/itch lines */}
      <path d="M16.5 8l1.5-1.5" strokeWidth="1.4" />
      <path d="M18 10.5l2-0.5" strokeWidth="1.4" />
      <path d="M17 6l1-2" strokeWidth="1.4" />
      {/* Redness dots under skin */}
      <circle cx="8" cy="17" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="16" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="10" cy="19" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="19.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Douleur — skin patch with pain radiating outward */
export function IconDouleur(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Lightning/pain bolt */}
      <path d="M13 2L9.5 10H14l-3.5 8" strokeWidth="1.8" />
      {/* Pain radiating waves */}
      <path d="M5.5 6.5c-1.2 1.8-2 4-2 6.5 0 2.5 0.8 4.7 2 6.5" strokeWidth="1.3" />
      <path d="M3 4.5c-1.5 2.5-2.5 5.5-2.5 8.5S1.5 19 3 21.5" strokeWidth="1.3" opacity="0.5" />
      <path d="M18.5 6.5c1.2 1.8 2 4 2 6.5 0 2.5-0.8 4.7-2 6.5" strokeWidth="1.3" />
      <path d="M21 4.5c1.5 2.5 2.5 5.5 2.5 8.5S22.5 19 21 21.5" strokeWidth="1.3" opacity="0.5" />
    </svg>
  );
}

/** Brûlure — flame on skin surface */
export function IconBrulure(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Skin line at bottom */}
      <path d="M3 20c2-1 5-2 9-2s7 1 9 2" strokeWidth="1.4" />
      {/* Main flame */}
      <path d="M12 17c-3 0-5-2.5-5-6 0-2.5 2-5 3.5-7 0.5 2.5 2 3.5 3 3.5-0.5-2 1-5 1.5-5.5 1 2 3 4.5 3 7.5 0 4.5-2.5 7.5-6 7.5z" strokeWidth="1.5" />
      {/* Inner flame */}
      <path d="M12 17c-1.5 0-2.5-1.2-2.5-3 0-1.2 0.8-2.5 1.5-3.5 0.3 1 0.8 1.5 1.2 1.5 0.4-0.8 0.8-1.5 1.2-2 0.5 1.2 1.1 2.2 1.1 3.5 0 2.2-1 3.5-2.5 3.5z" strokeWidth="1.2" />
      {/* Heat waves */}
      <path d="M7 18.5c0.5-0.3 1-0.5 1.5-0.7" strokeWidth="1" opacity="0.5" />
      <path d="M15.5 17.8c0.5 0.2 1 0.4 1.5 0.7" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

/** Saignement — blood drops */
export function IconSaignement(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Main large drop */}
      <path d="M12 2.5C12 2.5 6 10 6 14.5c0 3.3 2.7 6 6 6s6-2.7 6-6C18 10 12 2.5 12 2.5z" strokeWidth="1.5" />
      {/* Shine on drop */}
      <path d="M9.5 13c0-1.5 1-3.5 2-5" strokeWidth="1.2" opacity="0.4" />
      {/* Small secondary drop */}
      <path d="M19.5 5c0 0-2 2.5-2 4a2 2 0 0 0 4 0c0-1.5-2-4-2-4z" strokeWidth="1.3" />
      {/* Tiny splash drop */}
      <circle cx="4.5" cy="8" r="1.2" strokeWidth="1.3" />
      <circle cx="4.5" cy="8" r="0.3" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Suintement — oozing/weeping wound with moisture */
export function IconSuintement(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Skin patch/wound */}
      <ellipse cx="12" cy="9" rx="7" ry="4.5" strokeWidth="1.5" />
      {/* Moisture/oozing drops dripping down */}
      <path d="M7 12.5c0 0-0.5 2-0.5 3.2a1.2 1.2 0 0 0 2.4 0c0-1.2-0.5-3.2-0.5-3.2" strokeWidth="1.3" />
      <path d="M11 13c0 0-0.5 2.5-0.5 4a1.2 1.2 0 0 0 2.4 0c0-1.5-0.5-4-0.5-4" strokeWidth="1.3" />
      <path d="M15.5 12c0 0-0.5 2-0.5 3a1.2 1.2 0 0 0 2.4 0c0-1-0.5-3-0.5-3" strokeWidth="1.3" />
      {/* Wetness dots on surface */}
      <circle cx="9" cy="8" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.5" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Sécheresse — cracked dry skin texture */
export function IconSecheresse(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Skin outline */}
      <rect x="3" y="3" width="18" height="18" rx="4" strokeWidth="1.4" />
      {/* Crack lines */}
      <path d="M8 3v4l2 2.5-1.5 3L10 16l-2 2v3" strokeWidth="1.3" />
      <path d="M15 3l-1 3 1.5 2.5-1 3L16 15l1 2.5V21" strokeWidth="1.3" />
      {/* Horizontal cracks */}
      <path d="M3 10h3l1.5 1H13l1.5-1h2.5l1 0.5H21" strokeWidth="1.1" opacity="0.6" />
      <path d="M3 16h2l1-0.5h3.5l1 0.5H14l1.5-0.5H19l1 0.5h1" strokeWidth="1.1" opacity="0.6" />
      {/* Flake/peel marks */}
      <circle cx="6" cy="7" r="0.5" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="18" cy="8" r="0.5" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="12" cy="19" r="0.5" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}

/** Gonflement — swollen/puffy skin area */
export function IconGonflement(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Flat skin baseline */}
      <path d="M2 18h5" strokeWidth="1.4" />
      <path d="M17 18h5" strokeWidth="1.4" />
      {/* Swollen bump */}
      <path d="M7 18c0 0 0-4 2-6.5s3-3 3-3 1 0.5 3 3 2 6.5 2 6.5" strokeWidth="1.5" />
      {/* Expansion arrows */}
      <path d="M5 11l-2 2m2 0l-2-2" strokeWidth="1.3" />
      <path d="M19 11l2 2m-2 0l2-2" strokeWidth="1.3" />
      {/* Upward pressure arrow */}
      <path d="M12 4v3" strokeWidth="1.4" />
      <path d="M10.5 5.5L12 4l1.5 1.5" strokeWidth="1.4" />
      {/* Internal tension dots */}
      <circle cx="10" cy="14" r="0.6" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="12" cy="12.5" r="0.6" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="14" cy="14" r="0.6" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}

/** Rougeur — reddened skin patch with heat */
export function IconRougeur(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Skin patch - irregular shape */}
      <path d="M6 10c-1 2-1.5 4-0.5 6 1 2 3 3.5 6.5 3.5s5.5-1.5 6.5-3.5c1-2 0.5-4-0.5-6-1-1.8-3-3-6-3s-5 1.2-6 3z" strokeWidth="1.5" />
      {/* Inner redness circles */}
      <circle cx="12" cy="13" r="3.5" strokeWidth="1.2" opacity="0.5" />
      <circle cx="12" cy="13" r="1.5" strokeWidth="1" fill="currentColor" fillOpacity="0.15" />
      {/* Heat lines rising */}
      <path d="M9 5.5c0.5-1 0.3-1.5 0.8-2.5" strokeWidth="1.2" />
      <path d="M12 4.5c0.5-1 0.3-1.5 0.8-2.5" strokeWidth="1.2" />
      <path d="M15 5.5c0.5-1 0.3-1.5 0.8-2.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Desquamation — peeling/flaking skin layers */
export function IconDesquamation(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Base skin layer */}
      <path d="M3 19c3-1.5 6-2.5 9-2.5s6 1 9 2.5" strokeWidth="1.4" />
      {/* Peeling flake 1 — large, curling up */}
      <path d="M8 16.5c-0.5-1 0-3 1.5-4.5 1.5-1.5 3.5-2 5-1.5" strokeWidth="1.4" />
      <path d="M14.5 10.5c1 0.5 1.2 2 0.5 3.5" strokeWidth="1.4" />
      {/* Peeling flake 2 — smaller, above */}
      <path d="M10 11c-0.3-0.8 0.2-2 1.2-3 1-1 2.2-1.3 3-1" strokeWidth="1.3" />
      <path d="M14.2 7c0.5 0.5 0.5 1.2 0 2" strokeWidth="1.3" />
      {/* Tiny flake particles floating */}
      <path d="M6 12l-1.5-1.5" strokeWidth="1.1" />
      <path d="M5 10l-0.8-0.3" strokeWidth="1.1" />
      <circle cx="4" cy="7.5" r="0.8" strokeWidth="1.1" />
      <circle cx="7" cy="5" r="0.6" strokeWidth="1" />
      <circle cx="17" cy="6" r="0.5" fill="currentColor" stroke="none" opacity="0.5" />
      <circle cx="19" cy="8" r="0.4" fill="currentColor" stroke="none" opacity="0.4" />
    </svg>
  );
}
