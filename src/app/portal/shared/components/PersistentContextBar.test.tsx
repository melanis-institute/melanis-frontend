import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PersistentContextBar } from "./PersistentContextBar";

describe("PersistentContextBar accessibility smoke", () => {
  it("exposes labelled profile selector and supports keyboard focus", async () => {
    const user = userEvent.setup();
    const onProfileChange = vi.fn();

    render(
      <PersistentContextBar
        profileId="profile_1"
        profileOptions={[
          { id: "profile_1", label: "Fatou Diop" },
          { id: "profile_2", label: "Amina Diop" },
        ]}
        onProfileChange={onProfileChange}
        appointmentType="video"
        practitionerName="Dr. Ndiaye"
        dateLabel="Mer 12 mars"
        timeLabel="14h30"
      />,
    );

    const selector = screen.getByLabelText("Choisir le profil patient");
    expect(selector).toBeInTheDocument();

    await user.tab();
    expect(selector).toHaveFocus();

    fireEvent.change(selector, { target: { value: "profile_2" } });
    expect(onProfileChange).toHaveBeenCalledWith("profile_2");
  });
});
