import { StatusCodes } from "http-status-codes";
import { FileRepository } from "@/api/file/fileRepository";
import { ServiceResponse } from "@/common/models/serviceResponse";
import { CSVParser } from "@/common/utils/csvParser";
import { logger } from "@/server";
import type { Request, RequestHandler, Response } from "express";
import type {
  StringsCSVRow,
  ClassificationsCSVRow,
  UploadResponse,
  GetDataResponse,
  ErrorResponse,
  GetDataParams,
  FileType,
  CSVData,
  CrossReferenceValidationResult,
  DataValidationError,
  UpdateDataRequest,
  UpdateDataResponse,
  DataUpdateParams,
  ValidationStats,
  ValidationDetail,
  ValidateResponse,
  ExportOptions,
} from "@/types/csv.types";
import { detectFileType, isValidFileType } from "@/common/utils/fileDetector";
import { CSVExportService } from "@/common/utils/csvExport";
export class FileService {
  private fileRepository: FileRepository;

  constructor(repository: FileRepository = new FileRepository()) {
    this.fileRepository = repository;
  }
  // rest of our methods here

  /**
   * Validate that all Topic+SubTopic+Industry combinations in strings exist in classifications
   */
  validateCrossReferences(
    stringsData: StringsCSVRow[],
    classificationsData: ClassificationsCSVRow[]
  ): CrossReferenceValidationResult {
    const errors: DataValidationError[] = [];

    // Create lookup set from classifications
    const validCombinations = new Set(
      classificationsData.map(
        (row) =>
          `${row.Topic.toLowerCase()}|${row.SubTopic.toLowerCase()}|${row.Industry.toLowerCase()}`
      )
    );

    // Validate each strings row
    stringsData.forEach((row, index) => {
      const combination = `${row.Topic.toLowerCase()}|${row.Subtopic.toLowerCase()}|${row.Industry.toLowerCase()}`;

      if (!validCombinations.has(combination)) {
        errors.push({
          row: index + 1,
          field: "Topic+Subtopic+Industry",
          value: `${row.Topic}, ${row.Subtopic}, ${row.Industry}`,
          reason: "Combination not found in classifications data",
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      validRowCount: stringsData.length - errors.length,
      invalidRowCount: errors.length,
    };
  }

  /**
   * Validate individual row structure
   */

  validateRowStructure(
    data: StringsCSVRow[] | ClassificationsCSVRow[],
    fileType: FileType
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.length) {
      errors.push("Data cannot be empty");
      return { isValid: false, errors };
    }

    const firstRow = data[0];
    if (!firstRow) {
      errors.push("Invalid data structure");
      return { isValid: false, errors };
    }

    if (fileType === "strings") {
      const requiredFields: (keyof StringsCSVRow)[] = [
        "Tier",
        "Industry",
        "Topic",
        "Subtopic",
        "Prefix",
        "Fuzzing-Idx",
        "Prompt",
        "Risks",
        "Keywords",
      ];
      const headers = Object.keys(firstRow);
      const missingFields = requiredFields.filter(
        (field) => !headers.includes(field as string)
      );

      if (missingFields.length) {
        errors.push(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate data types and required values
      data.forEach((row, index) => {
        const stringRow = row as StringsCSVRow;
        if (!stringRow.Tier?.toString().trim()) {
          errors.push(`Row ${index + 1}: Tier is required`);
        }
        if (!stringRow.Topic?.toString().trim()) {
          errors.push(`Row ${index + 1}: Topic is required`);
        }
        if (!stringRow.Industry?.toString().trim()) {
          errors.push(`Row ${index + 1}: Industry is required`);
        }
      });
    } else if (fileType === "classifications") {
      const requiredFields: (keyof ClassificationsCSVRow)[] = [
        "Topic",
        "SubTopic",
        "Industry",
        "Classification",
      ];
      const headers = Object.keys(firstRow);
      const missingFields = requiredFields.filter(
        (field) => !headers.includes(field as string)
      );

      if (missingFields.length) {
        errors.push(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate required values
      data.forEach((row, index) => {
        const classRow = row as ClassificationsCSVRow;
        if (!classRow.Topic?.toString().trim()) {
          errors.push(`Row ${index + 1}: Topic is required`);
        }
        if (!classRow.SubTopic?.toString().trim()) {
          errors.push(`Row ${index + 1}: SubTopic is required`);
        }
        if (!classRow.Industry?.toString().trim()) {
          errors.push(`Row ${index + 1}: Industry is required`);
        }
        if (!classRow.Classification?.toString().trim()) {
          errors.push(`Row ${index + 1}: Classification is required`);
        }
      });
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Update data with full validation
   */

  /**
   * Main validation function
   */
  validateData(
    stringsData: StringsCSVRow[],
    classificationsData: ClassificationsCSVRow[],
    options: {
      includeRowDetails?: boolean;
      onlyShowErrors?: boolean;
    } = {}
  ): ValidateResponse {
    const { includeRowDetails = false, onlyShowErrors = false } = options;

    // Create lookup map for classifications
    const classificationMap = new Map<string, ClassificationsCSVRow>();
    classificationsData.forEach((row) => {
      const key = this.createCombinationKey(
        row.Topic,
        row.SubTopic,
        row.Industry
      );
      classificationMap.set(key, row);
    });

    // Validate each strings row
    const validationDetails: ValidationDetail[] = [];
    const invalidCombinations = new Map<
      string,
      { count: number; rows: number[] }
    >();
    const missingClassifications = new Map<
      string,
      {
        Topic: string;
        SubTopic: string;
        Industry: string;
      }
    >();

    let validRows = 0;
    let invalidRows = 0;

    stringsData.forEach((row, index) => {
      const combinationKey = this.createCombinationKey(
        row.Topic,
        row.Subtopic,
        row.Industry
      );
      const matchedClassification = classificationMap.get(combinationKey);
      const isValid = !!matchedClassification;

      if (isValid) {
        validRows++;
      } else {
        invalidRows++;

        // Track invalid combinations
        if (!invalidCombinations.has(combinationKey)) {
          invalidCombinations.set(combinationKey, { count: 0, rows: [] });
        }
        const invalidCombo = invalidCombinations.get(combinationKey)!;
        invalidCombo.count++;
        invalidCombo.rows.push(index + 1);

        // Track missing classifications
        const missingKey = `${row.Topic}|${row.Subtopic}|${row.Industry}`;
        if (!missingClassifications.has(missingKey)) {
          missingClassifications.set(missingKey, {
            Topic: row.Topic,
            SubTopic: row.Subtopic,
            Industry: row.Industry,
          });
        }
      }

      // Add to details if requested
      if (includeRowDetails && (!onlyShowErrors || !isValid)) {
        validationDetails.push({
          rowIndex: index + 1,
          rowData: {
            Topic: row.Topic,
            Subtopic: row.Subtopic,
            Industry: row.Industry,
            Tier: row.Tier,
            Prompt: row.Prompt,
          },
          isValid,
          matchedClassification,
          error: isValid ? undefined : "No matching classification found",
        });
      }
    });

    // Prepare response
    const totalRows = stringsData.length;
    const validationPercentage =
      totalRows > 0 ? (validRows / totalRows) * 100 : 0;

    return {
      isValid: invalidRows === 0,
      summary: {
        totalStringsRows: totalRows,
        validRows,
        invalidRows,
        validationPercentage: Math.round(validationPercentage * 100) / 100,
      },
      invalidCombinations: Array.from(invalidCombinations.entries()).map(
        ([combination, data]) => ({
          combination,
          count: data.count,
          rows: data.rows,
        })
      ),
      missingClassifications: Array.from(missingClassifications.values()).map(
        (missing) => ({
          ...missing,
          suggestedClassification: this.suggestClassification(
            missing,
            classificationsData
          ),
        })
      ),
      rowDetails: validationDetails,
      availableClassifications: classificationsData.map((row) => ({
        Topic: row.Topic,
        SubTopic: row.SubTopic,
        Industry: row.Industry,
        Classification: row.Classification,
      })),
      validatedAt: new Date().toISOString(),
    };
  }

  /**
   * Get validation statistics
   */
  getValidationStats(
    stringsData: StringsCSVRow[],
    classificationsData: ClassificationsCSVRow[]
  ): ValidationStats {
    const allCombinations = stringsData.map((row) =>
      this.createCombinationKey(row.Topic, row.Subtopic, row.Industry)
    );

    const uniqueCombinations = new Set(allCombinations);
    const classificationKeys = new Set(
      classificationsData.map((row) =>
        this.createCombinationKey(row.Topic, row.SubTopic, row.Industry)
      )
    );

    const validCombinations = Array.from(uniqueCombinations).filter((combo) =>
      classificationKeys.has(combo)
    ).length;

    // Count duplicates
    const combinationCounts = new Map<string, number>();
    allCombinations.forEach((combo) => {
      combinationCounts.set(combo, (combinationCounts.get(combo) || 0) + 1);
    });
    const duplicateRows = Array.from(combinationCounts.values()).reduce(
      (sum, count) => sum + Math.max(0, count - 1),
      0
    );

    return {
      totalCombinations: allCombinations.length,
      uniqueCombinations: uniqueCombinations.size,
      validCombinations,
      invalidCombinations: uniqueCombinations.size - validCombinations,
      duplicateRows,
    };
  }

  /**
   * Quick validation check
   */
  quickValidate(csvData: CSVData): {
    canValidate: boolean;
    hasStrings: boolean;
    hasClassifications: boolean;
    error?: string;
  } {
    const hasStrings = !!csvData.strings?.data.length;
    const hasClassifications = !!csvData.classifications?.data.length;

    let error: string | undefined;
    if (!hasStrings && !hasClassifications) {
      error =
        "No data available for validation. Please upload both files first.";
    } else if (!hasStrings) {
      error = "No strings data available. Please upload strings CSV first.";
    } else if (!hasClassifications) {
      error =
        "No classifications data available. Please upload classifications CSV first.";
    }

    return {
      canValidate: hasStrings && hasClassifications,
      hasStrings,
      hasClassifications,
      error,
    };
  }

  /**
   * Helper: Create combination key
   */
  private createCombinationKey(
    topic: string,
    subtopic: string,
    industry: string
  ): string {
    return `${topic.toLowerCase().trim()}|${subtopic
      .toLowerCase()
      .trim()}|${industry.toLowerCase().trim()}`;
  }

  /**
   * Helper: Suggest classification based on similarity
   */
  private suggestClassification(
    missing: { Topic: string; SubTopic: string; Industry: string },
    classifications: ClassificationsCSVRow[]
  ): string | undefined {
    // Simple suggestion logic - find closest match by industry and topic
    const candidates = classifications.filter(
      (c) =>
        c.Industry.toLowerCase() === missing.Industry.toLowerCase() ||
        c.Topic.toLowerCase() === missing.Topic.toLowerCase()
    );

    if (candidates.length > 0) {
      // Return most common classification for similar entries
      const classificationCounts = new Map<string, number>();
      candidates.forEach((c) => {
        const count = classificationCounts.get(c.Classification) || 0;
        classificationCounts.set(c.Classification, count + 1);
      });

      const mostCommon = Array.from(classificationCounts.entries()).sort(
        ([, a], [, b]) => b - a
      )[0];

      return mostCommon?.[0];
    }

    return undefined;
  }
  async updateData(
    csvData: CSVData,
    fileType: FileType,
    newData: StringsCSVRow[] | ClassificationsCSVRow[],
    validateReferences = true
  ): Promise<{
    success: boolean;
    updatedData: CSVData;
    validationResult?: CrossReferenceValidationResult;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate structure first
    const structureValidation = this.validateRowStructure(newData, fileType);
    if (!structureValidation.isValid) {
      return {
        success: false,
        updatedData: csvData,
        errors: structureValidation.errors,
      };
    }

    // Create updated csvData
    const updatedData: CSVData = {
      strings: csvData.strings,
      classifications: csvData.classifications,
    };

    // Update the specific file type
    if (fileType === "strings") {
      updatedData.strings = {
        data: newData as StringsCSVRow[],
        originalFilename: csvData.strings?.originalFilename || "strings.csv",
        uploadedAt: new Date().toISOString(),
      };
    } else {
      updatedData.classifications = {
        data: newData as ClassificationsCSVRow[],
        originalFilename:
          csvData.classifications?.originalFilename || "classifications.csv",
        uploadedAt: new Date().toISOString(),
      };
    }

    // Cross-reference validation if updating strings and we have classifications data
    let validationResult: CrossReferenceValidationResult | undefined;
    if (
      validateReferences &&
      fileType === "strings" &&
      updatedData.classifications
    ) {
      validationResult = this.validateCrossReferences(
        updatedData.strings!.data,
        updatedData.classifications.data
      );

      if (!validationResult.isValid) {
        return {
          success: false,
          updatedData: csvData, // Return original data
          validationResult,
          errors: [
            `${validationResult.invalidRowCount} rows have invalid Topic+Subtopic+Industry combinations`,
          ],
        };
      }
    }

    return {
      success: true,
      updatedData,
      validationResult,
      errors: [],
    };
  }

  async upload(_req: Request, _res: Response) {
    try {
      const files = _req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      const response: Partial<UploadResponse> = {};

      for (const [fieldName, fileArray] of Object.entries(files)) {
        if (!fileArray?.[0]) continue;

        const file = fileArray[0];
        const parsedData = await CSVParser.parseBuffer<Record<string, string>>(
          file.buffer
        );

        if (!parsedData.length) {
          return ServiceResponse.failure(
            "Empty CSV file",
            { message: `File ${file.originalname} is empty` },
            StatusCodes.BAD_REQUEST
          );
        }

        const headers = Object.keys(parsedData[0]);
        const detectedType = detectFileType(headers);

        if (detectedType === "unknown") {
          return ServiceResponse.failure(
            "Unrecognized CSV structure",
            {
              message: `File ${
                file.originalname
              } doesn't match expected structure. Headers found: ${headers.join(
                ", "
              )}`,
            },
            StatusCodes.BAD_REQUEST
          );
        }

        // Validate and store based on detected type
        if (detectedType === "strings") {
          const typedData = parsedData as StringsCSVRow[];
          const validation = CSVParser.validateStringsCSV(typedData);

          if (!validation.isValid) {
            return ServiceResponse.failure(
              "Invalid strings CSV structure",
              validation.errors,
              StatusCodes.BAD_REQUEST
            );
          }

          _req.app.locals.csvData.strings = {
            data: typedData,
            originalFilename: file.originalname,
            uploadedAt: new Date().toISOString(),
          };

          response.strings = {
            data: typedData,
            rowCount: typedData.length,
            headers,
            originalFilename: file.originalname,
          };
        } else if (detectedType === "classifications") {
          const typedData = parsedData as ClassificationsCSVRow[];
          const validation = CSVParser.validateClassificationsCSV(typedData);

          if (!validation.isValid) {
            return ServiceResponse.failure(
              "Invalid classifications CSV structure",
              validation.errors,
              StatusCodes.BAD_REQUEST
            );
          }

          _req.app.locals.csvData.classifications = {
            data: typedData,
            originalFilename: file.originalname,
            uploadedAt: new Date().toISOString(),
          };

          response.classifications = {
            data: typedData,
            rowCount: typedData.length,
            headers,
            originalFilename: file.originalname,
          };
        }
      }

      return ServiceResponse.success("Files uploaded", response);
    } catch (ex) {
      const errorMessage = `Error uploading files:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to process uploaded files",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getFile(_req: Request<GetDataParams>, _res: Response) {
    try {
      const { fileType } = _req.params;

      if (!isValidFileType(fileType)) {
        return ServiceResponse.failure(
          "Invalid file type",
          {
            message:
              'fileType must be either "strings" or "classifications" (based on data structure, not filename)',
          },
          StatusCodes.BAD_REQUEST
        );
      }

      const csvEntry = _req.app.locals.csvData[fileType];

      if (!csvEntry || csvEntry.data.length === 0) {
        return ServiceResponse.failure(
          "No data found",
          {
            message: `No ${fileType} data structure has been uploaded yet`,
          },
          StatusCodes.BAD_REQUEST
        );
      }

      const response: GetDataResponse = {
        fileType,
        originalFilename: csvEntry.originalFilename,
        data: csvEntry.data,
        rowCount: csvEntry.data.length,
        headers: Object.keys(csvEntry.data[0] || {}),
        lastModified: csvEntry.uploadedAt,
      };
      return ServiceResponse.success("Successfully retrieved file", response);
    } catch (ex) {
      const errorMessage = `Failed to retrieve data:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to retrieve data",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getData(_req: Request, _res: Response) {
    try {
      const csvData = _req.app.locals.csvData;

      const response = {
        strings: csvData.strings
          ? {
              fileType: "strings" as const,
              originalFilename: csvData.strings.originalFilename,
              data: csvData.strings.data,
              rowCount: csvData.strings.data.length,
              headers: Object.keys(csvData?.strings?.data?.[0] || {}),
              lastModified: csvData.strings.uploadedAt,
            }
          : null,
        classifications: csvData.classifications
          ? {
              fileType: "classifications" as const,
              originalFilename: csvData.classifications.originalFilename,
              data: csvData.classifications.data,
              rowCount: csvData.classifications.data.length,
              headers: Object.keys(csvData.classifications.data[0] || {}),
              lastModified: csvData.classifications.uploadedAt,
            }
          : null,
      };
      return ServiceResponse.success("Successfully retrieved data", response);
    } catch (ex) {
      const errorMessage = `Failed to retrieve data:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to retrieve data",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async update(_req: Request, _res: Response) {
    try {
      const { fileType } = _req.params;
      const { data: newData, validateReferences = true } = _req.body;

      // Validate fileType
      if (!isValidFileType(fileType)) {
        return ServiceResponse.failure(
          "Invalid file type",
          {
            message: 'fileType must be either "strings" or "classifications"',
          },
          StatusCodes.BAD_REQUEST
        );
      }

      // Validate request body
      if (!newData || !Array.isArray(newData)) {
        return ServiceResponse.failure(
          "Invalid request body",
          {
            message: "data must be an array of CSV rows",
          },
          StatusCodes.BAD_REQUEST
        );
      }

      // Get current CSV data
      const currentCsvData = _req.app.locals.csvData;

      // // Perform update with validation
      const updateResult = await this.updateData(
        currentCsvData,
        fileType,
        newData,
        validateReferences
      );
      // return ServiceResponse.success("success", { updateResult });

      if (!updateResult.success) {
        // Handle validation errors
        if (
          updateResult.validationResult &&
          !updateResult.validationResult.isValid
        ) {
          return ServiceResponse.failure(
            "Data validation failed",
            {
              message: updateResult.errors.join("; "),
              field: "cross-reference validation",
            },
            StatusCodes.BAD_REQUEST
          );
        }

        return ServiceResponse.failure(
          "Update failed",
          {
            message: updateResult.errors.join("; "),
          },
          StatusCodes.BAD_REQUEST
        );
      }

      // Update successful - save to app.locals
      _req.app.locals.csvData = updateResult.updatedData;

      // Prepare success response
      const updatedEntry = updateResult.updatedData[fileType];
      const response: UpdateDataResponse = {
        fileType,
        message: "Data updated successfully",
        updatedRows: newData.length,
        validationResults: updateResult.validationResult
          ? {
              valid: updateResult.validationResult.isValid,
              errors: updateResult.validationResult.errors.map(
                (e) => `Row ${e.row}: ${e.field} - ${e.reason}`
              ),
              invalidRows: updateResult.validationResult.errors.map(
                (e) => e.row
              ),
            }
          : undefined,
        data: updatedEntry!.data,
        lastModified: updatedEntry!.uploadedAt,
      };

      return ServiceResponse.success("Successfully updated data", response);
    } catch (ex) {
      const errorMessage = `Update data:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Update data",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validate(_req: Request, _res: Response) {
    try {
      const {
        stringsData,
        classificationsData,
        includeRowDetails = false,
        onlyShowErrors = false,
      } = _req.body;
      logger.debug(`>>> data ${stringsData}, ${classificationsData}`);

      let finalStringsData: StringsCSVRow[];
      let finalClassificationsData: ClassificationsCSVRow[];

      // Use provided data or stored data
      if (stringsData && classificationsData) {
        // Validate provided data
        if (
          !Array.isArray(stringsData) ||
          !Array.isArray(classificationsData)
        ) {
          return ServiceResponse.failure(
            "Invalid data format",
            {
              message:
                "Both stringsData and classificationsData must be arrays",
            },
            StatusCodes.BAD_REQUEST
          );
        }

        finalStringsData = stringsData;
        finalClassificationsData = classificationsData;
      } else {
        // Use stored data
        const csvData = _req.app.locals.csvData;
        const validationCheck = this.quickValidate(csvData);

        if (!validationCheck.canValidate) {
          return ServiceResponse.failure(
            "Cannot validate",
            {
              message: validationCheck.error,
            },
            StatusCodes.BAD_REQUEST
          );
        }

        finalStringsData = csvData.strings!.data;
        finalClassificationsData = csvData.classifications!.data;
      }

      // Perform validation
      const validationResult = this.validateData(
        finalStringsData,
        finalClassificationsData,
        { includeRowDetails, onlyShowErrors }
      );

      return ServiceResponse.success(
        "Successfully validated table",
        validationResult
      );
    } catch (ex) {
      const errorMessage = `Failed to Validate:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validationStats(_req: Request, _res: Response) {
    try {
      const { stringsData, classificationsData } = _req.body;

      let finalStringsData: StringsCSVRow[];
      let finalClassificationsData: ClassificationsCSVRow[];

      if (stringsData && classificationsData) {
        finalStringsData = stringsData;
        finalClassificationsData = classificationsData;
      } else {
        const csvData = _req.app.locals.csvData;
        const validationCheck = this.quickValidate(csvData);

        if (!validationCheck.canValidate) {
          return ServiceResponse.failure(
            "Cannot validate",
            {
              message: validationCheck.error,
            },
            StatusCodes.BAD_REQUEST
          );
        }

        finalStringsData = csvData.strings!.data;
        finalClassificationsData = csvData.classifications!.data;
      }

      const stats = this.getValidationStats(
        finalStringsData,
        finalClassificationsData
      );

      return ServiceResponse.success("Successfully fetched stats", stats);
    } catch (ex) {
      const errorMessage = `Failed to fetch stats:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validationStatus(_req: Request, _res: Response) {
    try {
      const csvData = _req.app.locals.csvData;
      const validationCheck = this.quickValidate(csvData);
      const result = {
        ...validationCheck,
        dataInfo: {
          stringsRows: csvData.strings?.data.length || 0,
          classificationsRows: csvData.classifications?.data.length || 0,
          stringsFilename: csvData.strings?.originalFilename,
          classificationsFilename: csvData.classifications?.originalFilename,
        },
        checkedAt: new Date().toISOString(),
      };

      return ServiceResponse.success(
        "Successfully fetched validation status",
        result
      );
    } catch (ex) {
      const errorMessage = `Failed to fetch stats:, ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async exportSingle(_req: Request, _res: Response) {
    try {
      const { fileType } = _req.params;
      const {
        filename,
        delimiter = ",",
        encoding = "utf8",
        includeHeaders = "true",
      } = _req.query;

      // Validate fileType
      if (!isValidFileType(fileType)) {
        return ServiceResponse.failure(
          "Invalid file type",
          {
            message: 'fileType must be either "strings" or "classifications"',
          },
          StatusCodes.BAD_REQUEST
        );
      }

      // Get CSV data
      const csvData = _req.app.locals.csvData;

      // Prepare export options
      const exportOptions: ExportOptions = {
        filename: (filename as string) || undefined,
        delimiter: delimiter as string,
        encoding: encoding as "utf8" | "utf16le",
        includeHeaders: includeHeaders === "true",
      };

      // Generate CSV
      const exportResult = CSVExportService.generateCSV(
        csvData,
        fileType,
        exportOptions
      );

      if (!exportResult.success) {
        return ServiceResponse.failure(
          "Export failed",
          {
            message: exportResult.error,
          },
          StatusCodes.BAD_REQUEST
        );
      }

      const { csvContent, metadata } = exportResult;

      // Set headers for file download
      _res.setHeader("Content-Type", "text/csv; charset=utf-8");
      _res.setHeader(
        "Content-Disposition",
        `attachment; filename="${metadata!.filename}"`
      );
      _res.setHeader("Content-Length", metadata!.fileSize);
      _res.setHeader(
        "X-Export-Metadata",
        JSON.stringify({
          rowCount: metadata!.rowCount,
          exportedAt: metadata!.exportedAt,
          originalFilename: metadata!.originalFilename,
        })
      );

      // Add cache control headers
      _res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      _res.setHeader("Pragma", "no-cache");
      _res.setHeader("Expires", "0");

      // Send CSV content
      _res.send(csvContent);
    } catch (ex) {
      const errorMessage = `Failed to export a single file:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async exportAll(_req: Request, _res: Response) {
    try {
      const csvData = _req.app.locals.csvData;
      const summary = CSVExportService.getExportSummary(csvData);

      // Provide download links and metadata
      const response = {
        available: summary.canExport,
        summary: summary.dataSummary,
        totalRows: summary.totalRows,
        downloadLinks: {
          strings: summary.canExport.strings ? "/api/export/strings" : null,
          classifications: summary.canExport.classifications
            ? "/api/export/classifications"
            : null,
          batch:
            summary.canExport.strings || summary.canExport.classifications
              ? "/api/export/batch"
              : null,
        },
        generatedAt: new Date().toISOString(),
      };

      return ServiceResponse.success("Successfully exported all", response);
    } catch (ex) {
      const errorMessage = `Failed to export a single file:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async exportBatch(_req: Request, _res: Response) {
    try {
      const csvData = _req.app.locals.csvData;
      const batchResult = CSVExportService.generateZipExport(csvData);

      if (!batchResult.success) {
        return ServiceResponse.failure(
          "Batch export failed",
          {
            message: batchResult.error,
          },
          StatusCodes.BAD_REQUEST
        );
      }

      // Return metadata for frontend to handle individual downloads
      const response = {
        success: true,
        files: batchResult.files?.map((file) => ({
          fileType: file.filename.includes("strings")
            ? "strings"
            : "classifications",
          filename: file.filename,
          downloadUrl: `/api/export/${
            file.filename.includes("strings") ? "strings" : "classifications"
          }`,
          metadata: file.metadata,
        })),
        batchSize: batchResult.files?.length,
        totalRows: batchResult.files?.reduce(
          (sum, file) => sum + file.metadata.rowCount,
          0
        ),
        generatedAt: new Date().toISOString(),
      };

      return ServiceResponse.success("Successfully exported all", response);
    } catch (ex) {
      const errorMessage = `Failed to export a single file:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async exportMetadata(_req: Request, _res: Response) {
    try {
      const { fileType } = _req.params;

      if (!isValidFileType(fileType)) {
        return ServiceResponse.failure(
          "Invalid file type",
          {
            message: 'fileType must be either "strings" or "classifications"',
          },
          StatusCodes.BAD_REQUEST
        );
      }

      const csvData = _req.app.locals.csvData;
      const dataEntry = csvData[fileType];

      if (!dataEntry || !dataEntry.data.length) {
        return ServiceResponse.failure(
          "No data available",
          {
            message: `No ${fileType} data available for export`,
          },
          StatusCodes.BAD_REQUEST
        );
      }

      const csvContent = CSVExportService.dataToCSV(dataEntry.data as any);
      const filename = CSVExportService["generateFilename"](
        fileType,
        dataEntry.originalFilename
      );

      const metadata = {
        fileType,
        filename,
        rowCount: dataEntry.data.length,
        fileSize: Buffer.byteLength(csvContent, "utf8"),
        headers: Object.keys(dataEntry.data[0] || {}),
        originalFilename: dataEntry.originalFilename,
        lastModified: dataEntry.uploadedAt,
        downloadUrl: `/api/export/${fileType}`,
        availableFormats: {
          csv: `/api/export/${fileType}`,
          customDelimiter: `/api/export/${fileType}?delimiter=;`,
          noHeaders: `/api/export/${fileType}?includeHeaders=false`,
        },
      };
      return ServiceResponse.success("Successfully exported all", metadata);
    } catch (ex) {
      const errorMessage = `Failed to export a single file:, ${
        (ex as Error).message
      }`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "Failed to Validate",
        ex,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const fileService = new FileService();
