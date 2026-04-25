import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BodySilhouette } from "./BodySilhouette";

describe("BodySilhouette", () => {
  it("renders a non-interactive body map with selected area styling", () => {
    const { container } = render(
      <BodySilhouette selectedAreas={["visage", "bras"]} className="w-40" />,
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveClass("w-40");
    expect(container.querySelector('[fill="rgba(91,17,18,0.14)"]')).toBeInTheDocument();
  });
});
