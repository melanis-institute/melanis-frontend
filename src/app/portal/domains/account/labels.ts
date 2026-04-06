import type { ProfileRelationship } from "./types";

export function relationshipToLabel(relationship: ProfileRelationship) {
  if (relationship === "moi") return "Moi";
  if (relationship === "enfant") return "Enfant";
  return "Proche";
}
