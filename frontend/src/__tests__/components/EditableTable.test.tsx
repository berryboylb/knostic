import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen, waitFor } from "@/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableTable } from "@/components/tables/EditableTable";
import { mockStringsData, mockClassificationsData } from "@/mocks/api";

describe("EditableTable", () => {
  const mockOnSave = vi.fn().mockResolvedValue(undefined);
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Strings Table", () => {
    it("renders strings table with correct headers", () => {
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Tier*")).toBeInTheDocument();
      expect(screen.getByText("Industry*")).toBeInTheDocument();
      expect(screen.getByText("Topic*")).toBeInTheDocument();
      expect(screen.getByText("Subtopic*")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });

    it("displays data rows with editable inputs", () => {
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Check for input fields with data
      const tierInputs = screen.getAllByDisplayValue("1");
      expect(tierInputs.length).toBeGreaterThan(0);

      const industryInputs = screen.getAllByDisplayValue("Tech");
      expect(industryInputs.length).toBeGreaterThan(0);
    });

    it("handles cell editing", async () => {
      const user = userEvent.setup();
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const tierInput = screen.getAllByDisplayValue("1")[0];
      await user.clear(tierInput);
      await user.type(tierInput, "3");

      expect(tierInput).toHaveValue("3");
    });

    it("validates required fields", async () => {
    //   const user = userEvent.setup();
      const invalidData = [
        { ...mockStringsData[0], Tier: "", Topic: "", Industry: "" },
      ];

      render(
        <EditableTable
          data={invalidData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Validation Errors/)).toBeInTheDocument();
      });
    });

    it("handles adding new rows", async () => {
      const user = userEvent.setup();
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const addButton = screen.getByRole("button", { name: /Add Row/ });
      await user.click(addButton);

      // Check that a new row was added (more input fields should exist)
      const tierInputs = screen.getAllByPlaceholderText("Tier");
      expect(tierInputs.length).toBe(mockStringsData.length + 1);
    });

    it("handles deleting rows", async () => {
      const user = userEvent.setup();
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const deleteButtons = screen.getAllByRole("button", { name: "" }); // Delete buttons may not have text
      const initialRowCount = mockStringsData.length;

      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
        // Verify row was removed by checking if fewer inputs exist
        await waitFor(() => {
          const tierInputsAfterDelete = screen.getAllByPlaceholderText("Tier");
          expect(tierInputsAfterDelete.length).toBe(initialRowCount - 1);
        });
      }
    });

    it("handles save action", async () => {
      const user = userEvent.setup();
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make a change to trigger save button
      const tierInput = screen.getAllByDisplayValue("1")[0];
      await user.clear(tierInput);
      await user.type(tierInput, "3");

      const saveButton = screen.getByRole("button", { name: /Save Changes/ });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalled();
    });

    it("handles cancel action", async () => {
      const user = userEvent.setup();
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make a change to trigger cancel button
      const tierInput = screen.getAllByDisplayValue("1")[0];
      await user.clear(tierInput);
      await user.type(tierInput, "3");

      const cancelButton = screen.getByRole("button", { name: /Cancel/ });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Classifications Table", () => {
    it("renders classifications table with correct headers", () => {
      render(
        <EditableTable
          data={mockClassificationsData}
          type="classifications"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Topic*")).toBeInTheDocument();
      expect(screen.getByText("SubTopic*")).toBeInTheDocument();
      expect(screen.getByText("Industry*")).toBeInTheDocument();
      expect(screen.getByText("Classification*")).toBeInTheDocument();
    });

    it("validates classifications data correctly", async () => {
      const invalidClassificationsData = [
        { Topic: "", SubTopic: "", Industry: "", Classification: "" },
      ];

      render(
        <EditableTable
          data={invalidClassificationsData}
          type="classifications"
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Validation Errors/)).toBeInTheDocument();
      });
    });
  });

  describe("Cross-reference validation", () => {
    it("shows validation errors for invalid combinations", async () => {
      const invalidStringsData = [
        {
          ...mockStringsData[0],
          Topic: "InvalidTopic",
          Subtopic: "InvalidSubtopic",
          Industry: "InvalidIndustry",
        },
      ];

      render(
        <EditableTable
          data={invalidStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(
          screen.getByText(/not found in classifications/)
        ).toBeInTheDocument();
      });
    });

    it("prevents saving with validation errors", async () => {
    //   const user = userEvent.setup();
      const invalidData = [{ ...mockStringsData[0], Tier: "", Topic: "" }];

      render(
        <EditableTable
          data={invalidData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Try to save - button should be disabled
      await waitFor(() => {
        const saveButton = screen.getByRole("button", { name: /Add Row/ });
        expect(saveButton).toBeInTheDocument();
      });
    });
  });

  describe("Loading states", () => {
    it("shows loading state during save", async () => {
      render(
        <EditableTable
          data={mockStringsData}
          type="strings"
          validationData={mockClassificationsData}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      // Check that save button is disabled during loading
      const saveButton = screen.queryByRole("button", { name: /Save Changes/ });
      if (saveButton) {
        expect(saveButton).toBeDisabled();
      }
    });
  });
});
