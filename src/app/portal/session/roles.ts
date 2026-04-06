export type UserRole =
  | "patient"
  | "caregiver"
  | "practitioner"
  | "staff"
  | "admin"
  | "external_practitioner";

const KNOWN_ROLES: readonly UserRole[] = [
  "patient",
  "caregiver",
  "practitioner",
  "staff",
  "admin",
  "external_practitioner",
];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && KNOWN_ROLES.includes(value as UserRole);
}

export function normalizeRoles(input: unknown): UserRole[] {
  if (!Array.isArray(input)) {
    return ["patient"];
  }

  const deduped = Array.from(new Set(input.filter(isUserRole)));
  return deduped.length > 0 ? deduped : ["patient"];
}

export function roleLabel(role: UserRole): string {
  if (role === "patient") return "Patient";
  if (role === "caregiver") return "Accompagnant";
  if (role === "practitioner") return "Praticien";
  if (role === "staff") return "Staff clinique";
  if (role === "admin") return "Admin";
  return "Praticien externe";
}

export function roleDescription(role: UserRole): string {
  if (role === "patient") return "Rendez-vous, pré-consultation, dossier et suivi.";
  if (role === "caregiver") {
    return "Actions patient pour les profils dépendants autorisés.";
  }
  if (role === "practitioner") {
    return "Agenda praticien, détail des rendez-vous, suivi clinique.";
  }
  if (role === "staff") {
    return "Check-in, assistance patient et coordination clinique.";
  }
  if (role === "admin") {
    return "Gouvernance, rôles, audits et paramètres globaux.";
  }
  return "Demandes d'avis et échanges inter-praticiens limités.";
}

export function roleHomeRoute(role: UserRole): string {
  if (role === "patient" || role === "caregiver") {
    return "/patient-flow/auth/dashboard";
  }
  if (role === "practitioner") {
    return "/patient-flow/practitioner";
  }
  if (role === "staff") {
    return "/patient-flow/staff";
  }
  if (role === "admin") {
    return "/patient-flow/admin";
  }
  return "/patient-flow/external-practitioner";
}

export function hasPatientWorkspaceAccess(roles: readonly UserRole[]): boolean {
  return roles.includes("patient") || roles.includes("caregiver");
}
