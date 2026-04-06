import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Sensitive skin — feather with subtle reaction dots */
export function IconSensible(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Feather */}
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" strokeWidth="1.4" />
      <path d="M16 8L2 22" strokeWidth="1.4" />
      <path d="M17.5 15H9" strokeWidth="1.2" opacity="0.4" />
      {/* Reaction dots */}
      <circle cx="20" cy="4" r="0.7" fill="currentColor" stroke="none" opacity="0.35" />
      <circle cx="22" cy="7" r="0.5" fill="currentColor" stroke="none" opacity="0.25" />
    </svg>
  );
}

/** Resistant skin — shield with check */
export function IconResistant(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z" strokeWidth="1.4" />
      <path d="M9 12l2 2 4-4" strokeWidth="1.6" />
    </svg>
  );
}

/** Dry skin — cracked surface */
export function IconSeche(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Skin surface */}
      <rect x="3" y="5" width="18" height="14" rx="3" strokeWidth="1.4" />
      {/* Crack lines */}
      <path d="M8 5v4l2 2v3l-1 5" strokeWidth="1.3" />
      <path d="M15 5v3l-2 2.5v2.5l1.5 6" strokeWidth="1.3" />
      <path d="M10 11h5" strokeWidth="1.1" opacity="0.4" />
      {/* Dry flake indicators */}
      <path d="M5 9h2" strokeWidth="1.1" opacity="0.3" />
      <path d="M17 13h2" strokeWidth="1.1" opacity="0.3" />
    </svg>
  );
}

/** Oily skin — oil droplet */
export function IconGrasse(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Main droplet */}
      <path d="M12 2.5c0 0-7 7.5-7 12.5a7 7 0 0 0 14 0C19 10 12 2.5 12 2.5z" strokeWidth="1.4" />
      {/* Shine/reflection */}
      <path d="M9 14a3 3 0 0 0 3 3" strokeWidth="1.3" opacity="0.4" />
      {/* Small droplets */}
      <circle cx="7" cy="8" r="1" strokeWidth="1.1" opacity="0.35" />
      <circle cx="17.5" cy="10" r="0.7" strokeWidth="1" opacity="0.25" />
    </svg>
  );
}

/** Mixed/Combination skin — half pattern */
export function IconMixte(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Circle face outline */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      {/* T-zone divider */}
      <path d="M7 6h10" strokeWidth="1.2" opacity="0.4" />
      <path d="M12 6v12" strokeWidth="1.2" opacity="0.4" />
      {/* Oil dots on T-zone side */}
      <circle cx="10" cy="9" r="0.8" fill="currentColor" stroke="none" opacity="0.25" />
      <circle cx="14" cy="9" r="0.8" fill="currentColor" stroke="none" opacity="0.25" />
      {/* Dry indicators on cheeks */}
      <path d="M6.5 13l2 0.5" strokeWidth="1" opacity="0.3" />
      <path d="M15.5 13l2 0.5" strokeWidth="1" opacity="0.3" />
      {/* Balance symbol */}
      <circle cx="12" cy="15" r="1.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Normal skin — balanced/harmony glow */
export function IconNormale(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Circle face */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      {/* Sparkle/glow rays */}
      <path d="M12 1v2" strokeWidth="1.3" opacity="0.3" />
      <path d="M12 21v2" strokeWidth="1.3" opacity="0.3" />
      <path d="M1 12h2" strokeWidth="1.3" opacity="0.3" />
      <path d="M21 12h2" strokeWidth="1.3" opacity="0.3" />
      {/* Inner harmony */}
      <path d="M9.5 11a2.5 2.5 0 0 1 5 0" strokeWidth="1.3" />
      <path d="M9 14.5c1 1 4 1 5 0" strokeWidth="1.3" />
    </svg>
  );
}

/** Don't know — question mark with skin */
export function IconJeNeSaisPas(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Circle */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      {/* Question mark */}
      <path d="M9.5 9a2.5 2.5 0 0 1 4.85.8c0 1.7-2.35 2.4-2.35 4.2" strokeWidth="1.6" />
      <circle cx="12" cy="17" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Phototype/skin tone — palette */
export function IconPhototype(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Palette shape */}
      <path d="M12 2a10 10 0 0 0-7.07 17.07A10 10 0 0 0 12 22a2.5 2.5 0 0 0 2.5-2.5c0-.65-.25-1.24-.66-1.67a.98.98 0 0 1 .72-1.67h1.94A5.5 5.5 0 0 0 22 10.5 10 10 0 0 0 12 2z" strokeWidth="1.4" />
      {/* Color dots */}
      <circle cx="8" cy="10" r="1.5" strokeWidth="1.2" />
      <circle cx="12" cy="7.5" r="1.5" strokeWidth="1.2" />
      <circle cx="16" cy="10" r="1.5" strokeWidth="1.2" />
      <circle cx="9" cy="14" r="1.5" strokeWidth="1.2" />
    </svg>
  );
}

/** Skin helper/guide — magnifying glass on skin */
export function IconSkinHelper(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Magnifying glass */}
      <circle cx="11" cy="11" r="7" strokeWidth="1.4" />
      <path d="M21 21l-4.35-4.35" strokeWidth="1.8" />
      {/* Skin texture inside */}
      <circle cx="9" cy="10" r="1" strokeWidth="1" opacity="0.4" />
      <circle cx="13" cy="9.5" r="0.8" strokeWidth="1" opacity="0.3" />
      <circle cx="11" cy="13" r="0.9" strokeWidth="1" opacity="0.35" />
    </svg>
  );
}
