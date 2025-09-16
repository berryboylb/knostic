import { vi } from "vitest";
import type { StringsCSVRow, ClassificationsCSVRow } from "@/types";

export const mockStringsData: StringsCSVRow[] = [
  {
    Tier: "1",
    Industry: "Tech",
    Topic: "AI",
    Subtopic: "ML",
    Prefix: "test",
    "Fuzzing-Idx": "1",
    Prompt: "Test prompt for ML",
    Risks: "low",
    Keywords: "ai,ml,test",
  },
  {
    Tier: "2",
    Industry: "Finance",
    Topic: "Blockchain",
    Subtopic: "DeFi",
    Prefix: "defi",
    "Fuzzing-Idx": "2",
    Prompt: "Test prompt for DeFi",
    Risks: "medium",
    Keywords: "blockchain,defi,finance",
  },
];

export const mockClassificationsData: ClassificationsCSVRow[] = [
  {
    Topic: "AI",
    SubTopic: "ML",
    Industry: "Tech",
    Classification: "safe",
  },
  {
    Topic: "Blockchain",
    SubTopic: "DeFi",
    Industry: "Finance",
    Classification: "risky",
  },
];

export const mockApiResponses = {
  getAllData: vi.fn().mockResolvedValue({
    success: true,
    responseObject: {
      strings: {
        data: mockStringsData,
        rowCount: mockStringsData.length,
        originalFilename: "strings.csv",
        headers: [
          "Tier",
          "Industry",
          "Topic",
          "Subtopic",
          "Prefix",
          "Fuzzing-Idx",
          "Prompt",
          "Risks",
          "Keywords",
        ],
        lastModified: "2024-01-01T00:00:00.000Z",
      },
      classifications: {
        data: mockClassificationsData,
        rowCount: mockClassificationsData.length,
        originalFilename: "classifications.csv",
        headers: ["Topic", "SubTopic", "Industry", "Classification"],
        lastModified: "2024-01-01T00:00:00.000Z",
      },
    },
  }),

  getValidationStatus: vi.fn().mockResolvedValue({
    canValidate: true,
    hasStrings: true,
    hasClassifications: true,
    error: undefined,
  }),

  uploadFiles: vi.fn().mockResolvedValue({
    success: true,
    message: "Files uploaded successfully",
    strings: {
      data: mockStringsData,
      rowCount: mockStringsData.length,
      originalFilename: "strings.csv",
    },
    classifications: {
      data: mockClassificationsData,
      rowCount: mockClassificationsData.length,
      originalFilename: "classifications.csv",
    },
  }),

  updateData: vi.fn().mockResolvedValue({
    success: true,
    message: "Data updated successfully",
  }),

  downloadFile: vi.fn().mockResolvedValue({
    blob: new Blob(["test,data\n1,2"], { type: "text/csv" }),
    filename: "test.csv",
  }),
};

// Mock the entire API module
vi.mock("@/services/api", () => ({
  api: mockApiResponses,
}));
