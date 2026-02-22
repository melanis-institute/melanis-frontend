import { type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/** Récurrence — circular arrow around skin patch (has this happened before?) */
export function IconRecurrence(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Circular arrows */}
      <path d="M21 3v5h-5" strokeWidth="1.6" />
      <path d="M3 21v-5h5" strokeWidth="1.6" />
      <path d="M21 8A9 9 0 0 0 6.3 5.3L3 8" strokeWidth="1.5" />
      <path d="M3 16a9 9 0 0 0 14.7 2.7L21 16" strokeWidth="1.5" />
      {/* Skin dot in center */}
      <circle cx="12" cy="12" r="2.5" strokeWidth="1.4" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Première fois — sparkle/new indicator */
export function IconPremiereFois(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Main star/sparkle */}
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="1.4" />
      {/* Center circle */}
      <circle cx="12" cy="12" r="3" strokeWidth="1.5" />
      {/* Inner highlight */}
      <path d="M12 10v4M10 12h4" strokeWidth="1.3" />
    </svg>
  );
}

/** Consultation doctor — stethoscope */
export function IconConsultation(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Stethoscope earpieces */}
      <path d="M6 3v7" strokeWidth="1.5" />
      <path d="M14 3v7" strokeWidth="1.5" />
      {/* Y connector */}
      <path d="M6 10c0 3.5 2.5 6 4 6s4-2.5 4-6" strokeWidth="1.5" />
      {/* Chest piece */}
      <circle cx="10" cy="18" r="2.5" strokeWidth="1.5" />
      <circle cx="10" cy="18" r="0.8" fill="currentColor" stroke="none" />
      {/* Ear tips */}
      <circle cx="6" cy="3" r="1" strokeWidth="1.3" />
      <circle cx="14" cy="3" r="1" strokeWidth="1.3" />
    </svg>
  );
}

/** No consultation — person with X */
export function IconPasConsulte(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Person head */}
      <circle cx="10" cy="7" r="3.5" strokeWidth="1.4" />
      {/* Body */}
      <path d="M3 21c0-4 3-7 7-7s7 3 7 7" strokeWidth="1.4" />
      {/* X mark */}
      <path d="M18 8l4 4M22 8l-4 4" strokeWidth="1.8" />
    </svg>
  );
}

/** Crème hydratante — tube */
export function IconCreme(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Tube body */}
      <rect x="5" y="8" width="10" height="13" rx="2" strokeWidth="1.4" />
      {/* Tube cap */}
      <rect x="7" y="4" width="6" height="4" rx="1.5" strokeWidth="1.4" />
      {/* Cream squeeze lines */}
      <path d="M15 12c1 0 2.5 0.5 3.5 0" strokeWidth="1.2" />
      <path d="M15 15c1.5-0.5 3 0 4 0.5" strokeWidth="1.2" />
      {/* Label line */}
      <path d="M7.5 14h5" strokeWidth="1.2" opacity="0.4" />
      <path d="M7.5 16.5h3" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}

/** Corticoïdes — medicine jar with cross */
export function IconCorticoides(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Jar body */}
      <rect x="4" y="7" width="12" height="14" rx="2.5" strokeWidth="1.4" />
      {/* Lid */}
      <rect x="5.5" y="4" width="9" height="3" rx="1.5" strokeWidth="1.4" />
      {/* Medical cross */}
      <path d="M10 11v5" strokeWidth="1.5" />
      <path d="M7.5 13.5h5" strokeWidth="1.5" />
      {/* Rx symbol */}
      <path d="M17 10l2.5-2" strokeWidth="1.3" opacity="0.5" />
      <path d="M17 8h3" strokeWidth="1.3" opacity="0.5" />
    </svg>
  );
}

/** Antibiotiques — capsule pill */
export function IconAntibiotiques(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Capsule shape */}
      <rect x="3" y="8" width="18" height="8" rx="4" strokeWidth="1.4" />
      {/* Divider line */}
      <path d="M12 8v8" strokeWidth="1.3" />
      {/* Dots on one side */}
      <circle cx="7.5" cy="12" r="1" fill="currentColor" stroke="none" opacity="0.3" />
      {/* Lines on other side */}
      <path d="M14.5 10.5h3" strokeWidth="1.1" opacity="0.4" />
      <path d="M14.5 13.5h3" strokeWidth="1.1" opacity="0.4" />
    </svg>
  );
}

/** Antifongiques — shield with fungus block */
export function IconAntifongiques(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Shield */}
      <path d="M12 2L4 6v5c0 5.25 3.4 10.15 8 11.4 4.6-1.25 8-6.15 8-11.4V6l-8-4z" strokeWidth="1.4" />
      {/* Block/stop line */}
      <circle cx="12" cy="12" r="3.5" strokeWidth="1.3" />
      <path d="M9.5 14.5l5-5" strokeWidth="1.4" />
    </svg>
  );
}

/** Produits naturels — leaf */
export function IconNaturel(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Main leaf */}
      <path d="M12 22c-4-4-8-8-8-14C8 4 12 2 12 2s4 2 8 6c0 6-4 10-8 14z" strokeWidth="1.4" />
      {/* Leaf vein */}
      <path d="M12 2v20" strokeWidth="1.2" opacity="0.4" />
      {/* Side veins */}
      <path d="M12 8l-3 3" strokeWidth="1.1" opacity="0.3" />
      <path d="M12 8l3 3" strokeWidth="1.1" opacity="0.3" />
      <path d="M12 13l-2.5 2.5" strokeWidth="1.1" opacity="0.3" />
      <path d="M12 13l2.5 2.5" strokeWidth="1.1" opacity="0.3" />
    </svg>
  );
}

/** Compléments — vitamin capsule with sparkle */
export function IconComplements(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Bottle */}
      <rect x="6" y="7" width="9" height="14" rx="2" strokeWidth="1.4" />
      {/* Cap */}
      <rect x="7.5" y="4" width="6" height="3" rx="1" strokeWidth="1.3" />
      {/* Vitamin label */}
      <path d="M8.5 12h4" strokeWidth="1.2" opacity="0.4" />
      <path d="M8.5 14.5h3" strokeWidth="1.2" opacity="0.4" />
      {/* Sparkle */}
      <path d="M19 4v3M17.5 5.5h3" strokeWidth="1.4" />
      <path d="M18 10v2M17 11h2" strokeWidth="1.1" />
    </svg>
  );
}

/** Allergies — skin reaction/warning */
export function IconAllergies(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Warning triangle outline */}
      <path d="M12 3L2 20h20L12 3z" strokeWidth="1.4" />
      {/* Exclamation */}
      <path d="M12 9v5" strokeWidth="1.8" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none" />
      {/* Reaction dots */}
      <circle cx="4" cy="6" r="0.6" fill="currentColor" stroke="none" opacity="0.4" />
      <circle cx="20" cy="6" r="0.5" fill="currentColor" stroke="none" opacity="0.3" />
      <circle cx="2" cy="10" r="0.4" fill="currentColor" stroke="none" opacity="0.3" />
    </svg>
  );
}

/** Médicaments actuels — pill grid/box */
export function IconMedicaments(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Pill box */}
      <rect x="3" y="5" width="18" height="14" rx="2.5" strokeWidth="1.4" />
      {/* Dividers */}
      <path d="M9 5v14" strokeWidth="1.2" />
      <path d="M15 5v14" strokeWidth="1.2" />
      <path d="M3 12h18" strokeWidth="1.2" />
      {/* Pills in compartments */}
      <circle cx="6" cy="8.5" r="1.2" strokeWidth="1" />
      <ellipse cx="12" cy="8.5" rx="1.5" ry="1" strokeWidth="1" />
      <circle cx="18" cy="15.5" r="1.2" strokeWidth="1" />
    </svg>
  );
}

/** Grossesse — heart with baby/care symbol */
export function IconGrossesse(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Heart */}
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.02-1.08a5.5 5.5 0 0 0-7.78 7.78l1.02 1.08L12 21.23l7.78-7.78 1.02-1.08a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.4" />
      {/* Small sparkle inside */}
      <circle cx="12" cy="12" r="1.5" strokeWidth="1.2" />
      <path d="M12 9v1.5" strokeWidth="1.1" />
      <path d="M12 13.5V15" strokeWidth="1.1" />
      <path d="M10 12h1.5" strokeWidth="1.1" />
      <path d="M12.5 12H14" strokeWidth="1.1" />
    </svg>
  );
}

/** Pas de grossesse — simple circle check */
export function IconNonConcerne(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {/* Circle */}
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      {/* Dash */}
      <path d="M8 12h8" strokeWidth="1.8" />
    </svg>
  );
}

/** Check mark — for "Oui" responses */
export function IconCheck(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      <path d="M8 12l3 3 5-5" strokeWidth="1.8" />
    </svg>
  );
}

/** X mark — for "Non" responses */
export function IconCross(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="1.4" />
      <path d="M15 9l-6 6M9 9l6 6" strokeWidth="1.6" />
    </svg>
  );
}
