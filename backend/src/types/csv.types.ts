export interface StringsCSVRow {
  Tier: string;
  Industry: string;
  Topic: string;
  Subtopic: string;
  Prefix: string;
  "Fuzzing-Idx": string;
  Prompt: string;
  Risks: string;
  Keywords: string;
  [key: string]: string;
}

export interface ClassificationsCSVRow {
  Topic: string;
  SubTopic: string;
  Industry: string;
  Classification: string;
  [key: string]: string;
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CSVData {
  strings: {
    data: StringsCSVRow[];
    originalFilename: string;
    uploadedAt: string;
  } | null;
  classifications: {
    data: ClassificationsCSVRow[];
    originalFilename: string;
    uploadedAt: string;
  } | null;
}

export interface ParsedCSVResponse {
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  rowCount: number;
  headers: string[];
  originalFilename: string
}

export interface UploadResponse {
  message: string;
  strings?: ParsedCSVResponse;
  classifications?: ParsedCSVResponse;
}


export type FileType = "strings" | "classifications";

// Structure-based identification, not filename-based
export interface CSVStructureType {
  strings: StringsCSVRow[]; // Identified by having Tier, Fuzzing-Idx, etc.
  classifications: ClassificationsCSVRow[]; // Identified by having Classification field
}

export interface GetDataParams {
  fileType: FileType; // Refers to data structure, not original filename
}

export interface GetDataResponse {
  fileType: FileType;
  originalFilename?: string; // Store original filename for reference
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  rowCount: number;
  headers: string[];
  lastModified: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  filename?: string;
}

// Also add this for more specific error handling
export interface ValidationErrorResponse extends ErrorResponse {
  field?: string;
  rowIndex?: number;
  expectedFormat?: string;
}


// Add these to existing csv.types.ts

export interface UpdateDataRequest {
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  validateReferences?: boolean; // Whether to validate cross-references
}

export interface UpdateDataResponse {
  fileType: FileType;
  message: string;
  updatedRows: number;
  validationResults?: {
    valid: boolean;
    errors: string[];
    invalidRows: number[];
  };
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  lastModified: string;
}

export interface DataValidationError {
  row: number;
  field: string;
  value: string;
  reason: string;
}

export interface CrossReferenceValidationResult {
  isValid: boolean;
  errors: DataValidationError[];
  validRowCount: number;
  invalidRowCount: number;
}

// For tracking updates
export interface DataUpdateParams {
  fileType: FileType;
}

// Add these to existing csv.types.ts

export interface ValidateRequest {
  // Optional: provide data to validate (if not provided, uses stored data)
  stringsData?: StringsCSVRow[];
  classificationsData?: ClassificationsCSVRow[];
  // Validation options
  includeRowDetails?: boolean;
  onlyShowErrors?: boolean;
}

export interface ValidationDetail {
  rowIndex: number;
  rowData: {
    Topic: string;
    Subtopic: string;
    Industry: string;
    Tier?: string;
    Prompt?: string;
  };
  isValid: boolean;
  matchedClassification?: ClassificationsCSVRow;
  error?: string;
}

export interface ValidateResponse {
  isValid: boolean;
  summary: {
    totalStringsRows: number;
    validRows: number;
    invalidRows: number;
    validationPercentage: number;
  };
  invalidCombinations: {
    combination: string;
    count: number;
    rows: number[];
  }[];
  missingClassifications: {
    Topic: string;
    SubTopic: string;
    Industry: string;
    suggestedClassification?: string;
  }[];
  rowDetails?: ValidationDetail[];
  availableClassifications: {
    Topic: string;
    SubTopic: string;
    Industry: string;
    Classification: string;
  }[];
  validatedAt: string;
}

export interface ValidationStats {
  totalCombinations: number;
  uniqueCombinations: number;
  validCombinations: number;
  invalidCombinations: number;
  duplicateRows: number;
}

// Add these to existing csv.types.ts

export interface ExportParams {
  fileType: FileType;
}

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  delimiter?: string;
  encoding?: 'utf8' | 'utf16le';
}

export interface ExportMetadata {
  filename: string;
  rowCount: number;
  fileSize: number;
  exportedAt: string;
  originalFilename?: string;
  contentType: string;
}

// For tracking export history (optional feature)
export interface ExportLog {
  fileType: FileType;
  filename: string;
  exportedAt: string;
  rowCount: number;
  userAgent?: string;
}