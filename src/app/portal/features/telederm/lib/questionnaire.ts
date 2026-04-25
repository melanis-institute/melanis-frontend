export function getTeledermSkinType(questionnaire: Record<string, unknown>): string {
  const medical = questionnaire.medical as Record<string, unknown> | undefined;
  const symptoms = questionnaire.symptoms as Record<string, unknown> | undefined;

  return (
    (medical?.skinType as string | undefined) ??
    (symptoms?.skinType as string | undefined) ??
    (questionnaire.skinType as string | undefined) ??
    ""
  );
}

export function stringArrayFromQuestionnaire(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
