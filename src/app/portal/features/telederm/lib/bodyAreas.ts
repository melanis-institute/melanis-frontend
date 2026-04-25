export const BODY_AREA_LABELS: Record<string, string> = {
  visage: "Visage",
  "cuir-chevelu": "Cuir chevelu",
  bras: "Bras & épaules",
  jambes: "Jambes & pieds",
  torse: "Torse & dos",
  intime: "Zone intime",
  ongles: "Ongles",
  autre: "Autre zone",
};

export function normalizeBodyAreas(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function bodyAreaLabel(areaId: string): string {
  return BODY_AREA_LABELS[areaId] ?? areaId;
}
