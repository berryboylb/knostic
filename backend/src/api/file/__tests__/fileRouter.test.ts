import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { StatusCodes } from "http-status-codes";
import type { Express } from "express";

import { app } from "@/server";
import { fileService } from "@/api/file/fileService";
import type { StringsCSVRow, ClassificationsCSVRow } from "@/types/csv.types";

// Mock the file service
vi.mock("@/api/file/fileService");

describe("FileRouter Integration Tests", () => {
  const mockFileService = fileService as any;

  // Test fixtures
  const validStringsCSV = `Tier,Industry,Topic,Subtopic,Prefix,Fuzzing-Idx,Prompt,Risks,Keywords
1,Tech,AI,ML,test,1,test prompt,low,ai,ml
2,Finance,Blockchain,DeFi,defi,2,defi prompt,medium,blockchain,defi`;

  const validClassificationsCSV = `Topic,SubTopic,Industry,Classification
AI,ML,Tech,safe
Blockchain,DeFi,Finance,risky`;

  const invalidStringsCSV = `Tier,Industry
1,Tech`;

  const mockUploadResponse = {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Files uploaded successfully",
    responseObject: {
      strings: {
        data: [],
        rowCount: 2,
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
        originalFilename: "strings.csv",
      },
    },
  };

  const mockValidationResponse = {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Validation successful",
    responseObject: {
      isValid: true,
      summary: {
        totalStringsRows: 2,
        validRows: 2,
        invalidRows: 0,
        validationPercentage: 100,
      },
      invalidCombinations: [],
      missingClassifications: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /upload", () => {
    it("should upload valid CSV files successfully", async () => {
      mockFileService.upload.mockResolvedValue(mockUploadResponse);

      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from(validStringsCSV), "strings.csv")
        .attach(
          "classifications",
          Buffer.from(validClassificationsCSV),
          "classifications.csv"
        );

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockFileService.upload).toHaveBeenCalledTimes(1);
    });

    it("should handle file upload with only strings file", async () => {
      const partialUploadResponse = {
        ...mockUploadResponse,
        responseObject: {
          strings: mockUploadResponse.responseObject.strings,
        },
      };

      mockFileService.upload.mockResolvedValue(partialUploadResponse);

      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from(validStringsCSV), "strings.csv");

      expect(response.status).toBe(StatusCodes.OK);
      expect(mockFileService.upload).toHaveBeenCalled();
    });

    it("should reject non-CSV files", async () => {
      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from("not csv content"), "document.txt");

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      // Should be caught by multer fileFilter before reaching service
    });

    it("should handle files exceeding size limit", async () => {
      const largeCsvContent = "header\n" + "data,".repeat(9000000); // > 5MB

      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from(largeCsvContent), "large.csv");

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });

    it("should handle service upload errors", async () => {
      mockFileService.upload.mockResolvedValue({
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid CSV structure",
        responseObject: null,
      });

      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from(invalidStringsCSV), "invalid.csv");

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
    });

    it("should handle upload with dynamic field names", async () => {
      mockFileService.upload.mockResolvedValue(mockUploadResponse);

      const response = await request(app)
        .post("/files/upload")
        .attach("file1", Buffer.from(validStringsCSV), "data1.csv")
        .attach("file2", Buffer.from(validClassificationsCSV), "data2.csv");

      expect(response.status).toBe(StatusCodes.OK);
      expect(mockFileService.upload).toHaveBeenCalled();
    });

    it("should handle server errors gracefully", async () => {
      mockFileService.upload.mockRejectedValue(new Error("Server error"));

      const response = await request(app)
        .post("/files/upload")
        .attach("strings", Buffer.from(validStringsCSV), "strings.csv");

      expect(response.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    });
  });

  describe("POST /validate", () => {
    const validValidationRequest = {
      stringsData: [
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
      ],
      classificationsData: [
        {
          Topic: "AI",
          SubTopic: "ML",
          Industry: "Tech",
          Classification: "safe",
        },
      ],
      includeRowDetails: true,
    };

    it("should validate data successfully", async () => {
      mockFileService.validate.mockResolvedValue(mockValidationResponse);

      const response = await request(app)
        .post("/files/validate")
        .send(validValidationRequest);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockFileService.validate).toHaveBeenCalledTimes(1);
    });

    it("should handle validation with stored data", async () => {
      mockFileService.validate.mockResolvedValue(mockValidationResponse);

      const response = await request(app)
        .post("/files/validate")
        .send({ includeRowDetails: false });

      expect(response.status).toBe(StatusCodes.OK);
      expect(mockFileService.validate).toHaveBeenCalled();
    });

    it("should validate request schema", async () => {
      const invalidRequest = {
        stringsData: "invalid", // Should be array
        includeRowDetails: "true", // Should be boolean
      };

      const response = await request(app)
        .post("/files/validate")
        .send(invalidRequest);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.message).toContain("Validation error");
    });

    it("should handle validation errors from service", async () => {
      mockFileService.validate.mockResolvedValue({
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "No data available for validation",
        responseObject: null,
      });

      const response = await request(app).post("/files/validate").send({});

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });

    it("should handle empty request body", async () => {
      const response = await request(app).post("/files/validate").send();

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.message).toContain("request body is empty");
    });
  });

  describe("GET /", () => {
    it("should retrieve all data successfully", async () => {
      const mockGetDataResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Data retrieved successfully",
        responseObject: {
          strings: {
            fileType: "strings",
            data: [],
            rowCount: 2,
            headers: [],
            lastModified: new Date().toISOString(),
          },
          classifications: {
            fileType: "classifications",
            data: [],
            rowCount: 1,
            headers: [],
            lastModified: new Date().toISOString(),
          },
        },
      };

      mockFileService.getData.mockResolvedValue(mockGetDataResponse);

      const response = await request(app).get("/files/");

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockFileService.getData).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /validate/stats", () => {
    it("should get validation statistics", async () => {
      const mockStatsResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Stats retrieved",
        responseObject: {
          totalCombinations: 5,
          uniqueCombinations: 4,
          validCombinations: 3,
          invalidCombinations: 1,
          duplicateRows: 1,
        },
      };

      const validValidationRequest = {
        stringsData: [
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
        ],
        classificationsData: [
          {
            Topic: "AI",
            SubTopic: "ML",
            Industry: "Tech",
            Classification: "safe",
          },
        ],
        includeRowDetails: true,
      };

      mockFileService.validationStats.mockResolvedValue(mockStatsResponse);

      const response = await request(app)
        .get("/files/validate/stats")
        .send(validValidationRequest);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /validate/status", () => {
    it("should get validation status", async () => {
      const mockStatusResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Status retrieved",
        responseObject: {
          canValidate: true,
          hasStrings: true,
          hasClassifications: true,
          dataInfo: {
            stringsRows: 2,
            classificationsRows: 1,
          },
        },
      };

      mockFileService.validationStatus.mockResolvedValue(mockStatusResponse);

      const response = await request(app).get("/files/validate/status");

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });
  });

  describe("GET /:fileType", () => {
    it("should retrieve specific file type data", async () => {
      const mockFileResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "File retrieved",
        responseObject: {
          fileType: "strings",
          data: [],
          rowCount: 2,
          headers: [],
          lastModified: new Date().toISOString(),
        },
      };

      mockFileService.getFile.mockResolvedValue(mockFileResponse);

      const response = await request(app).get("/files/strings");

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockFileService.getFile).toHaveBeenCalledTimes(1);
    });

    it("should handle invalid file type", async () => {
      mockFileService.getFile.mockResolvedValue({
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Invalid file type",
        responseObject: null,
      });

      const response = await request(app).get("/files/invalid");

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
    });
  });

  describe("PUT /:fileType", () => {
    const validUpdateRequest = {
      data: [
        {
          Tier: "1",
          Industry: "Tech",
          Topic: "AI",
          Subtopic: "ML",
          Prefix: "updated",
          "Fuzzing-Idx": "1",
          Prompt: "updated prompt",
          Risks: "low",
          Keywords: "ai,ml",
        },
      ],
      validateReferences: true,
    };

    it("should update file data successfully", async () => {
      const mockUpdateResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Data updated successfully",
        responseObject: {
          fileType: "strings",
          updatedRows: 1,
          data: validUpdateRequest.data,
        },
      };

      mockFileService.update.mockResolvedValue(mockUpdateResponse);

      const response = await request(app)
        .put("/files/strings")
        .send(validUpdateRequest);

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
      expect(mockFileService.update).toHaveBeenCalledTimes(1);
    });

    it("should validate update request schema", async () => {
      const invalidRequest = {
        data: "not an array",
        validateReferences: "not a boolean",
      };

      const response = await request(app)
        .put("/files/strings")
        .send(invalidRequest);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.message).toContain("Validation error");
    });

    it("should handle update validation failures", async () => {
      mockFileService.update.mockResolvedValue({
        statusCode: StatusCodes.BAD_REQUEST,
        success: false,
        message: "Update validation failed",
        responseObject: null,
      });

      const response = await request(app)
        .put("/files/strings")
        .send(validUpdateRequest);

      expect(response.status).toBe(StatusCodes.BAD_REQUEST);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /export/*", () => {
    it("should export all files metadata", async () => {
      const mockExportResponse = {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Export data prepared",
        responseObject: {
          available: { strings: true, classifications: true },
          totalRows: 3,
          downloadLinks: {
            strings: "/api/export/strings",
            classifications: "/api/export/classifications",
          },
        },
      };

      mockFileService.exportAll.mockResolvedValue(mockExportResponse);

      const response = await request(app).get("/files/export");

      expect(response.status).toBe(StatusCodes.OK);
      expect(response.body.success).toBe(true);
    });

    it("should export single file", async () => {
      // Mock the actual CSV content response
      mockFileService.exportSingle.mockImplementation((req: any, res: any) => {
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="strings.csv"'
        );
        res.send("Tier,Industry\n1,Tech");
        return Promise.resolve();
      });

      const response = await request(app).get("/files/export/strings");

      expect(response.headers["content-type"]).toContain("text/csv");
      expect(mockFileService.exportSingle).toHaveBeenCalled();
    });

    it("should export with custom parameters", async () => {
      mockFileService.exportSingle.mockImplementation((req: any, res: any) => {
        res.send("Tier;Industry\n1;Tech"); // Custom delimiter
        return Promise.resolve();
      });

      const response = await request(app)
        .get("/files/export/strings")
        .query({ delimiter: ";", includeHeaders: "false" });

      expect(mockFileService.exportSingle).toHaveBeenCalled();
    });
  });
});
