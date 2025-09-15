import csv from "csv-parser";
import { Readable } from "stream";
import type {
  StringsCSVRow,
  ClassificationsCSVRow,
  CSVValidationResult,
} from "@/types/csv.types";

export class CSVParser {
  static async parseBuffer<T extends Record<string, string>>(
    buffer: Buffer
  ): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const results: T[] = [];
      const stream = Readable.from(buffer.toString());

      stream
        .pipe(csv())
        .on("data", (data: Record<string, string>) => {
          // Trim whitespace from all values
          const trimmedData = {} as T;
          for (const [key, value] of Object.entries(data)) {
            (trimmedData as Record<string, string>)[key.trim()] =
              typeof value === "string" ? value.trim() : value;
          }
          results.push(trimmedData);
        })
        .on("end", () => resolve(results))
        .on("error", reject);
    });
  }

  static validateStringsCSV(data: StringsCSVRow[]): CSVValidationResult {
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
    const errors: string[] = [];

    if (!data.length) {
      errors.push("File is empty");
      return { isValid: false, errors };
    }

    const headers = Object.keys(data[0]!);
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length) {
      errors.push(`Missing required fields: ${missingFields.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateClassificationsCSV(
    data: ClassificationsCSVRow[]
  ): CSVValidationResult {
    const requiredFields: (keyof ClassificationsCSVRow)[] = [
      "Topic",
      "SubTopic",
      "Industry",
      "Classification",
    ];
    const errors: string[] = [];

    if (!data.length) {
      errors.push("File is empty");
      return { isValid: false, errors };
    }

    const headers = Object.keys(data[0]!);
    const missingFields = requiredFields.filter(
      (field) => !headers.includes(field)
    );

    if (missingFields.length) {
      errors.push(`Missing required fields: ${missingFields.join(", ")}`);
    }

    return { isValid: errors.length === 0, errors };
  }
}
