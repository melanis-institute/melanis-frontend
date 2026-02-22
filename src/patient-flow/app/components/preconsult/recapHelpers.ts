// Re-export constants used by StepRecap for label lookups
export { MOTIFS, DUREES, TYPES_PEAU } from "./types";

export const INTENSITE_LABELS: Record<number, string> = {
  1: "Léger",
  2: "Modéré",
  3: "Moyen",
  4: "Important",
  5: "Sévère",
};
