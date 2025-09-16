import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { StatusCodes } from "http-status-codes";
import type { Request, Response } from "express";

import { FileService } from "@/api/file/fileService";
import { FileRepository } from "@/api/file/fileRepository";
import type {
  StringsCSVRow,
  ClassificationsCSVRow,
  CSVData,
  CrossReferenceValidationResult,
  GetDataParams,
} from "@/types/csv.types";

// Mock dependencies
vi.mock("@/api/file/fileRepository");
vi.mock("@/common/utils/csvParser");
vi.mock("@/server", () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
  },
}));


describe("FileService", () => {
  let fileService: FileService;
  let mockFileRepository: FileRepository;
  let mockReq: any; // using any cos i used locals
  let mockRes: Partial<Response>;

  // Test data fixtures
  const validStringsData: StringsCSVRow[] = [
    {
      Tier: "1",
      Industry: "Tech",
      Topic: "AI",
      Subtopic: "ML",
      Prefix: "test",
      "Fuzzing-Idx": "1",
      Prompt: "test prompt",
      Risks: "low",
      Keywords: "ai,ml",
    },
    {
      Tier: "2",
      Industry: "Finance",
      Topic: "Blockchain",
      Subtopic: "DeFi",
      Prefix: "defi",
      "Fuzzing-Idx": "2",
      Prompt: "defi prompt",
      Risks: "medium",
      Keywords: "blockchain,defi",
    },
  ];

  const validClassificationsData: ClassificationsCSVRow[] = [
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

  const invalidStringsData: StringsCSVRow[] = [
    {
      Tier: "1",
      Industry: "Tech",
      Topic: "AI",
      Subtopic: "InvalidSubtopic", // This combination doesn't exist in classifications
      Prefix: "test",
      "Fuzzing-Idx": "1",
      Prompt: "test prompt",
      Risks: "low",
      Keywords: "ai,ml",
    },
  ];

  const mockCSVData: CSVData = {
    strings: {
      data: validStringsData,
      originalFilename: "strings.csv",
      uploadedAt: "2024-01-01T00:00:00.000Z",
    },
    classifications: {
      data: validClassificationsData,
      originalFilename: "classifications.csv",
      uploadedAt: "2024-01-01T00:00:00.000Z",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFileRepository = new FileRepository();
    fileService = new FileService(mockFileRepository);

    mockReq = {
      app: {
        locals: {
          csvData: JSON.parse(JSON.stringify(mockCSVData)),
        },
      },
      params: {},
      body: {},
      files: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
  });

  describe("validateCrossReferences", () => {
    it("should validate matching combinations successfully", () => {
      const result = fileService.validateCrossReferences(
        validStringsData,
        validClassificationsData
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validRowCount).toBe(2);
      expect(result.invalidRowCount).toBe(0);
    });

    it("should detect invalid combinations", () => {
      const result = fileService.validateCrossReferences(
        invalidStringsData,
        validClassificationsData
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        row: 1,
        field: "Topic+Subtopic+Industry",
        value: "AI, InvalidSubtopic, Tech",
        reason: "Combination not found in classifications data",
      });
      expect(result.validRowCount).toBe(0);
      expect(result.invalidRowCount).toBe(1);
    });

    it("should handle empty datasets", () => {
      const result = fileService.validateCrossReferences([], []);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.validRowCount).toBe(0);
      expect(result.invalidRowCount).toBe(0);
    });

    it("should be case insensitive for validation", () => {
      const mixedCaseStrings: StringsCSVRow[] = [
        {
          ...validStringsData[0],
          Topic: "ai", // lowercase
          Subtopic: "ML", // mixed case
          Industry: "TECH", // uppercase
        },
      ];

      const result = fileService.validateCrossReferences(
        mixedCaseStrings,
        validClassificationsData
      );

      expect(result.isValid).toBe(true);
    });
  });

  describe("validateRowStructure", () => {
    it("should validate strings CSV structure correctly", () => {
      const result = fileService.validateRowStructure(
        validStringsData,
        "strings"
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate classifications CSV structure correctly", () => {
      const result = fileService.validateRowStructure(
        validClassificationsData,
        "classifications"
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty data", () => {
      const result = fileService.validateRowStructure([], "strings");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Data cannot be empty");
    });

    it("should detect missing required fields in strings data", () => {
      const incompleteData = [
        {
          Tier: "1",
          Industry: "Tech",
          // Missing other required fields
        },
      ] as StringsCSVRow[];

      const result = fileService.validateRowStructure(
        incompleteData,
        "strings"
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Missing required fields");
    });

    it("should detect missing required values", () => {
      const dataWithEmptyValues = [
        {
          ...validStringsData[0],
          Tier: "", // Empty required field
          Topic: "   ", // Whitespace only
        },
      ];

      const result = fileService.validateRowStructure(
        dataWithEmptyValues,
        "strings"
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Row 1: Tier is required");
      expect(result.errors).toContain("Row 1: Topic is required");
    });
  });

  describe("validateData", () => {
    it("should perform complete validation successfully", () => {
      const result = fileService.validateData(
        validStringsData,
        validClassificationsData,
        { includeRowDetails: true }
      );

      expect(result.isValid).toBe(true);
      expect(result.summary.totalStringsRows).toBe(2);
      expect(result.summary.validRows).toBe(2);
      expect(result.summary.invalidRows).toBe(0);
      expect(result.summary.validationPercentage).toBe(100);
      expect(result.rowDetails).toHaveLength(2);
    });

    it("should identify invalid combinations with details", () => {
      const result = fileService.validateData(
        invalidStringsData,
        validClassificationsData,
        { includeRowDetails: true, onlyShowErrors: true }
      );

      expect(result.isValid).toBe(false);
      expect(result.summary.validRows).toBe(0);
      expect(result.summary.invalidRows).toBe(1);
      expect(result.invalidCombinations).toHaveLength(1);
      expect(result.missingClassifications).toHaveLength(1);
      expect(result.rowDetails).toHaveLength(1); // Only invalid rows due to onlyShowErrors
    });

    it("should suggest classifications for missing combinations", () => {
      const result = fileService.validateData(
        invalidStringsData,
        validClassificationsData
      );

      expect(
        result.missingClassifications[0].suggestedClassification
      ).toBeDefined();
    });
  });

  describe("updateData", () => {
    it("should update strings data successfully", async () => {
      const newStringsData = [
        ...validStringsData,
        {
          ...validStringsData[0],
          Tier: "3",
        },
      ];

      const result = await fileService.updateData(
        mockCSVData,
        "strings",
        newStringsData,
        true
      );

      expect(result.success).toBe(true);
      expect(result.updatedData.strings?.data).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail update with invalid structure", async () => {
      const invalidData = [{ invalidField: "test" }] as unknown as StringsCSVRow[];

      const result = await fileService.updateData(
        mockCSVData,
        "strings",
        invalidData,
        true
      );

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should fail update with invalid cross-references", async () => {
      const result = await fileService.updateData(
        mockCSVData,
        "strings",
        invalidStringsData,
        true
      );

      expect(result.success).toBe(false);
      expect(result.validationResult?.isValid).toBe(false);
    });

    it("should skip cross-reference validation when requested", async () => {
      const result = await fileService.updateData(
        mockCSVData,
        "strings",
        invalidStringsData,
        false // Skip validation
      );

      expect(result.success).toBe(true);
      expect(result.validationResult).toBeUndefined();
    });
  });

  describe("quickValidate", () => {
    it("should confirm validation is possible with complete data", () => {
      const result = fileService.quickValidate(mockCSVData);

      expect(result.canValidate).toBe(true);
      expect(result.hasStrings).toBe(true);
      expect(result.hasClassifications).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should identify missing strings data", () => {
      const incompleteData: CSVData = {
        strings: null,
        classifications: mockCSVData.classifications,
      };

      const result = fileService.quickValidate(incompleteData);

      expect(result.canValidate).toBe(false);
      expect(result.hasStrings).toBe(false);
      expect(result.hasClassifications).toBe(true);
      expect(result.error).toContain("strings");
    });

    it("should identify missing classifications data", () => {
      const incompleteData: CSVData = {
        strings: mockCSVData.strings,
        classifications: null,
      };

      const result = fileService.quickValidate(incompleteData);

      expect(result.canValidate).toBe(false);
      expect(result.hasStrings).toBe(true);
      expect(result.hasClassifications).toBe(false);
      expect(result.error).toContain("classifications");
    });
  });

  describe("getData", () => {
    it("should retrieve all data successfully", async () => {
      const result = await fileService.getData(
        mockReq as Request,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.success).toBe(true);
      expect(result.responseObject?.strings).toBeDefined();
      expect(result.responseObject?.classifications).toBeDefined();
    });

    it("should handle missing data gracefully", async () => {
      mockReq.app!.locals.csvData = { strings: null, classifications: null };

      const result = await fileService.getData(
        mockReq as Request,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.responseObject?.strings).toBeNull();
      expect(result.responseObject?.classifications).toBeNull();
    });
  });

  describe("getFile", () => {
    it("should retrieve specific file type successfully", async () => {
      mockReq.params = { fileType: "strings" };

      const result = await fileService.getFile(
        mockReq as Request<GetDataParams>,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.OK);
      expect(result.responseObject?.fileType).toBe("strings");
      expect(result.responseObject?.data).toEqual(validStringsData);
    });

    it("should reject invalid file type", async () => {
      mockReq.params = { fileType: "invalid" };

      const result = await fileService.getFile(
        mockReq as Request<GetDataParams>,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(result.success).toBe(false);
    });

    it("should handle missing file data", async () => {
      mockReq.params = { fileType: "strings" };
      mockReq.app!.locals.csvData.strings = null;

      const result = await fileService.getFile(
        mockReq as Request<GetDataParams>,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
      expect(result.message).toContain("No data found");
    });
  });

  describe("Error Handling", () => {
    it("should handle unexpected errors in getData", async () => {
      // Force an error by making csvData undefined
      mockReq.app!.locals.csvData = undefined as any;

      const result = await fileService.getData(
        mockReq as Request,
        mockRes as Response
      );

      expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(result.success).toBe(false);
    });

    // it("should handle malformed request data", async () => {
    //   mockReq.body = null;

    //   const result = await fileService.validate(
    //     mockReq as Request,
    //     mockRes as Response
    //   );

    //   expect(result.statusCode).toBe(StatusCodes.BAD_REQUEST);
    //   expect(result.success).toBe(false);
    // });
  });
});
