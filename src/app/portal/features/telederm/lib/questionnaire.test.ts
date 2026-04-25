import { describe, expect, it } from "vitest";
import { normalizeBodyAreas } from "@portal/features/telederm/lib/bodyAreas";
import {
  getTeledermSkinType,
  stringArrayFromQuestionnaire,
} from "@portal/features/telederm/lib/questionnaire";

describe("telederm questionnaire helpers", () => {
  it("normalizes body area and string-array payloads defensively", () => {
    expect(normalizeBodyAreas(["visage", 42, "bras", null])).toEqual(["visage", "bras"]);
    expect(normalizeBodyAreas("visage")).toEqual([]);
    expect(stringArrayFromQuestionnaire(["Douleur", false, "Rougeur"])).toEqual([
      "Douleur",
      "Rougeur",
    ]);
  });

  it("reads skin type from medical, symptoms, then legacy top-level payloads", () => {
    expect(getTeledermSkinType({ medical: { skinType: "V" }, skinType: "III" })).toBe("V");
    expect(getTeledermSkinType({ symptoms: { skinType: "IV" } })).toBe("IV");
    expect(getTeledermSkinType({ skinType: "II" })).toBe("II");
    expect(getTeledermSkinType({})).toBe("");
  });
});
