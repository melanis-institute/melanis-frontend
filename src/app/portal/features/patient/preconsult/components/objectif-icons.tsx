import type { SVGProps } from "react";

// ——— Objectif Icons ———

// Soulager rapidement — flame/lightning bolt
export function IconSoulager(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M13 2L4.09 12.27a1 1 0 0 0 .78 1.63H11l-1 8.1a.5.5 0 0 0 .86.39L19.91 12a1 1 0 0 0-.78-1.63H13l1-8.1a.5.5 0 0 0-.86-.39L13 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Comprendre la cause — magnifying glass with question mark
export function IconComprendre(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="11" cy="11" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M9.5 9a2 2 0 0 1 3.7.7c0 1.1-1.2 1.3-1.2 2.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="11" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

// Routine skincare — sparkles / bottle
export function IconRoutine(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9.5 2v2M14.5 2v2M9.5 4h5a1 1 0 0 1 1 1v1a2 2 0 0 1-.5 1.32l-.7.83A3 3 0 0 0 13 9.97V19a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2V9.97a3 3 0 0 0-.8-1.82l-.7-.83A2 2 0 0 1 7 6V5a1 1 0 0 1 1-1h1.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M18 8l.7 1.5L20.2 10l-1.5.7-.7 1.5-.5-1.5-1.5-.7 1.5-.5L18 8Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Obtenir une prescription — pill/rx
export function IconPrescription(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="4.5" y="3" width="15" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 7h8M8 10.5h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12" cy="16" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.25 17.75l3.5-3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Suivi de traitement — circular arrows / refresh
export function IconSuivi(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M21 2v6h-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 12a9 9 0 0 1 15-6.7L21 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 22v-6h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 12a9 9 0 0 1-15 6.7L3 16"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Avis spécialisé — stethoscope / expert
export function IconAvisSpecialise(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M4.8 2.3A.3.3 0 0 0 4.5 2.6v4.4a5 5 0 0 0 5 5h1v3.5a4.5 4.5 0 0 0 9 0v-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19.5 2.3a.3.3 0 0 1 .3.3v4.4a5 5 0 0 1-5 5h-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="19.5" cy="13.5" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

// ——— Preference Icons ———

// Routine simple — single leaf
export function IconRoutineSimple(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 22c-4-4-8-7.5-8-12a8 8 0 0 1 16 0c0 4.5-4 8-8 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 22V12M12 15l-3-3M12 12l3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Budget limité — wallet/coins
export function IconBudget(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16.5" cy="15" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M6 4l4 2M14 4l4 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Produits naturels — leaf
export function IconNaturel(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M17 8C8 10 5.9 16.17 3.82 20.34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5.9 18c5.08-4.9 9.14-8.54 14.1-9.91a.5.5 0 0 0 .08-.93C15.69 5.01 10.32 5.39 5.35 8.3 3.21 9.52 2 11.93 2 14.5 2 16.43 3.57 18 5.5 18h.4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Sans parfum — nose with x
export function IconSansParfum(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 3C9 3 8 6 8 9c0 2-1 3-3 4s-2 4 1 5h12c3-1 3-3 1-5s-3-2-3-4c0-3-1-6-4-6Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Produits locaux — map pin with heart
export function IconLocal(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M12 21.7C12 21.7 20 15.3 20 9.5A8 8 0 0 0 4 9.5c0 5.8 8 12.2 8 12.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.5c-1.3 0-2.4-1-2.4-2.3a2.4 2.4 0 0 1 4-1.7c.3.4.4.9.4 1.4 0 .7-.2 1.2-.6 1.6-.4.6-1 1-1.4 1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Bio/vegan — plant sprout
export function IconBioVegan(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M7 20h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 20v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M12 12c-4 0-6-3.5-6-6 0 0 3-.5 6 1.5S15 3 15 3c0 3-1 9-3 9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 8c2 0 4 1 4 4 0 0-2 .5-4-.5S14 15 14 15"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
