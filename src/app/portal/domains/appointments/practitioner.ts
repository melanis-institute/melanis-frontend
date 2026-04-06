export function practitionerIdFromName(name: string): string {
  const normalized = String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `prac_${normalized || "inconnu"}`;
}
