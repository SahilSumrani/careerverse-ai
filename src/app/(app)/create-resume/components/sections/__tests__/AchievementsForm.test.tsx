import { render, screen, fireEvent } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { AchievementsForm } from "../AchievementsForm";
import { ResumeData } from "../../../types/resume";
import { describe, it, expect } from "vitest";

function WrapperComponent({ defaultValues }: { defaultValues?: Partial<ResumeData> }) {
  const { register, control } = useForm<ResumeData>({
    defaultValues: defaultValues || {
      keyAchievements: [
        { title: "First Achievement", description: "Desc 1" }
      ]
    }
  });

  return <AchievementsForm register={register} control={control} />;
}

describe("AchievementsForm Component", () => {
  it("renders existing achievements correctly", () => {
    render(<WrapperComponent />);

    const titleInput = screen.getByPlaceholderText(/Winner - National Hackathon 2024/i);
    expect(titleInput).toHaveValue("First Achievement");

    const descInput = screen.getByPlaceholderText(/Built an AI healthcare triage tool/i);
    expect(descInput).toHaveValue("Desc 1");
  });

  it("appends a new achievement entry when clicking add button", async () => {
    render(<WrapperComponent />);

    const addButton = screen.getByRole("button", { name: /Add key achievement entry/i });
    fireEvent.click(addButton);

    const titleInputs = screen.getAllByPlaceholderText(/Winner - National Hackathon 2024/i);
    expect(titleInputs).toHaveLength(2);
  });

  it("removes an achievement entry when remove button is clicked", () => {
    render(<WrapperComponent />);

    const removeButton = screen.getByRole("button", { name: /Remove achievement 1/i });
    fireEvent.click(removeButton);

    const titleInput = screen.queryByPlaceholderText(/Winner - National Hackathon 2024/i);
    expect(titleInput).not.toBeInTheDocument();
  });
});
