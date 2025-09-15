import type {
  StringsCSVRow,
  ClassificationsCSVRow,
  FileType,
  ExportOptions,
  ExportMetadata,
  CSVData,
} from "@/types/csv.types.js";

export class CSVExportService {
  /**
   * Convert data to CSV string
   */
  static dataToCSV<T extends Record<string, any>>(
    data: T[],
    options: ExportOptions = {}
  ): string {
    const {
      includeHeaders = true,
      delimiter = ",",
      encoding = "utf8",
    } = options;

    if (!data.length) {
      return includeHeaders
        ? this.getHeadersForType(data).join(delimiter) + "\n"
        : "";
    }

    const headers = Object.keys(data[0]);
    const csvRows: string[] = [];

    // Add headers if requested
    if (includeHeaders) {
      csvRows.push(
        headers
          .map((header) => this.escapeCsvValue(header, delimiter))
          .join(delimiter)
      );
    }

    // Add data rows
    data.forEach((row) => {
      const csvRow = headers
        .map((header) => {
          const value = row[header];
          return this.escapeCsvValue(value, delimiter);
        })
        .join(delimiter);
      csvRows.push(csvRow);
    });

    return csvRows.join("\n") + "\n";
  }

  /**
   * Generate CSV for specific file type
   */
  static generateCSV(
    csvData: CSVData,
    fileType: FileType,
    options: ExportOptions = {}
  ): {
    success: boolean;
    csvContent?: string;
    metadata?: ExportMetadata;
    error?: string;
  } {
    const dataEntry = csvData[fileType];

    if (!dataEntry || !dataEntry.data.length) {
      return {
        success: false,
        error: `No ${fileType} data available for export`,
      };
    }

    const csvContent = this.dataToCSV(dataEntry.data as any, options);
    const filename =
      options.filename ||
      this.generateFilename(fileType, dataEntry.originalFilename);

    const metadata: ExportMetadata = {
      filename,
      rowCount: dataEntry.data.length,
      fileSize: Buffer.byteLength(csvContent, "utf8"),
      exportedAt: new Date().toISOString(),
      originalFilename: dataEntry.originalFilename,
      contentType: "text/csv",
    };

    return {
      success: true,
      csvContent,
      metadata,
    };
  }

  /**
   * Generate both files as ZIP (bonus feature)
   */
  static generateZipExport(csvData: CSVData): {
    success: boolean;
    files?: { filename: string; content: string; metadata: ExportMetadata }[];
    error?: string;
  } {
    const files: {
      filename: string;
      content: string;
      metadata: ExportMetadata;
    }[] = [];
    const errors: string[] = [];

    // Export strings
    if (csvData.strings?.data.length) {
      const stringsResult = this.generateCSV(csvData, "strings");
      if (
        stringsResult.success &&
        stringsResult.csvContent &&
        stringsResult.metadata
      ) {
        files.push({
          filename: stringsResult.metadata.filename,
          content: stringsResult.csvContent,
          metadata: stringsResult.metadata,
        });
      } else {
        errors.push(`Failed to export strings: ${stringsResult.error}`);
      }
    }

    // Export classifications
    if (csvData.classifications?.data.length) {
      const classificationsResult = this.generateCSV(
        csvData,
        "classifications"
      );
      if (
        classificationsResult.success &&
        classificationsResult.csvContent &&
        classificationsResult.metadata
      ) {
        files.push({
          filename: classificationsResult.metadata.filename,
          content: classificationsResult.csvContent,
          metadata: classificationsResult.metadata,
        });
      } else {
        errors.push(
          `Failed to export classifications: ${classificationsResult.error}`
        );
      }
    }

    if (files.length === 0) {
      return {
        success: false,
        error: errors.length
          ? errors.join("; ")
          : "No data available for export",
      };
    }

    return {
      success: true,
      files,
    };
  }

  /**
   * Get export summary
   */
  static getExportSummary(csvData: CSVData): {
    canExport: { strings: boolean; classifications: boolean };
    dataSummary: {
      strings?: { rows: number; filename?: string; lastModified?: string };
      classifications?: {
        rows: number;
        filename?: string;
        lastModified?: string;
      };
    };
    totalRows: number;
  } {
    const canExport = {
      strings: !!csvData.strings?.data.length,
      classifications: !!csvData.classifications?.data.length,
    };

    const dataSummary: any = {};
    let totalRows = 0;

    if (csvData.strings?.data.length) {
      dataSummary.strings = {
        rows: csvData.strings.data.length,
        filename: csvData.strings.originalFilename,
        lastModified: csvData.strings.uploadedAt,
      };
      totalRows += csvData.strings.data.length;
    }

    if (csvData.classifications?.data.length) {
      dataSummary.classifications = {
        rows: csvData.classifications.data.length,
        filename: csvData.classifications.originalFilename,
        lastModified: csvData.classifications.uploadedAt,
      };
      totalRows += csvData.classifications.data.length;
    }

    return {
      canExport,
      dataSummary,
      totalRows,
    };
  }

  /**
   * Helper: Escape CSV values
   */
  private static escapeCsvValue(value: any, delimiter: string = ","): string {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // If value contains delimiter, newline, or quote, wrap in quotes and escape quotes
    if (
      stringValue.includes(delimiter) ||
      stringValue.includes("\n") ||
      stringValue.includes("\r") ||
      stringValue.includes('"')
    ) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Helper: Generate filename
   */
  private static generateFilename(
    fileType: FileType,
    originalFilename?: string
  ): string {
    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const timeString = new Date()
      .toISOString()
      .split("T")[1]
      .split(".")[0]
      .replace(/:/g, "-"); // HH-MM-SS

    if (originalFilename) {
      const baseName = originalFilename.replace(/\.csv$/i, "");
      return `${baseName}_updated_${timestamp}_${timeString}.csv`;
    }

    return `${fileType}_export_${timestamp}_${timeString}.csv`;
  }

  /**
   * Helper: Get headers for empty data
   */
  private static getHeadersForType(data: any[]): string[] {
    // This is a fallback - in practice, we'd define headers based on fileType
    if (data.length > 0) {
      return Object.keys(data[0]);
    }
    return []; // Empty headers for empty data
  }
}
