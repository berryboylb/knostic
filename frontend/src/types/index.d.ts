import { QueryFunction, QueryKey } from "@tanstack/react-query";
import { AxiosRequestHeaders, AxiosResponse, Method } from "axios";

export interface SecureRequestProps<T = Record<string, unknown>> {
  method?: Method;
  url: string;
  body?: Record<string, unknown> | FormData;
  isApi?: boolean;
  baseURL?: string;
  headers?: AxiosRequestHeaders;
  endpoint?: string;
  queryKey?: string | string[] | number[];
  showSuccessToast?: boolean;
  showFailureToast?: boolean;
  token?: string;
  queryFn?: QueryFunction<ResponseType<T>, QueryKey>;
}

export interface RequestResponse<T = Record<string, unknown>> {
  queryFn?: QueryFunction<ResponseType<T>, QueryKey>;
}

export type ResponseType<D = Record<string, unknown>> = AxiosResponse<
  CredentialsServerResponseModel<D>
>;

export type CredentialsServerResponseModel<T> = {
  data: T;
  referenceId: string;
  message: string;
  status: boolean;
};

export interface ResponseErrorType {
  message: string;
  name: string;
  errors?: Record<string, unknown>;

  response: {
    data: {
      response_message: string;
      status: number;
      statusCode: number;
      message: string;
      details: string[];
      errors?: Record<string, unknown>;
      source: string;
    };
  };
}

export type CustomMethod = "get" | "put" | "delete" | "post" | "patch";

export type ResponseModel<T> = {
  data: T;
  status_code: number;
  message: string;
};

export type ServerResponseModel<T> = {
  data: {
    data: T;
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  status_code: number;
  message: string;
};


// Base CSV row types
export interface StringsCSVRow {
  Tier: string;
  Industry: string;
  Topic: string;
  Subtopic: string;
  Prefix: string;
  'Fuzzing-Idx': string;
  Prompt: string;
  Risks: string;
  Keywords: string;
}

export interface ClassificationsCSVRow {
  Topic: string;
  SubTopic: string;
  Industry: string;
  Classification: string;
}

export type FileType = 'strings' | 'classifications';

// API Response types
export interface GetDataResponse {
  fileType: FileType;
  originalFilename?: string;
  data: StringsCSVRow[] | ClassificationsCSVRow[];
  rowCount: number;
  headers: string[];
  lastModified: string;
}

export interface UploadResponse {
  message: string;
  strings?: {
    data: StringsCSVRow[];
    rowCount: number;
    headers: string[];
    originalFilename?: string;
  };
  classifications?: {
    data: ClassificationsCSVRow[];
    rowCount: number;
    headers: string[];
    originalFilename?: string;
  };
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
  validatedAt: string;
}

export interface ValidationStatusResponse {
  canValidate: boolean;
  hasStrings: boolean;
  hasClassifications: boolean;
  error?: string;
  dataInfo: {
    stringsRows: number;
    classificationsRows: number;
    stringsFilename?: string;
    classificationsFilename?: string;
  };
  checkedAt: string;
}

export interface ExportSummaryResponse {
  available: {
    strings: boolean;
    classifications: boolean;
  };
  summary: {
    strings?: { rows: number; filename?: string; lastModified?: string };
    classifications?: { rows: number; filename?: string; lastModified?: string };
  };
  totalRows: number;
  downloadLinks: {
    strings: string | null;
    classifications: string | null;
    batch: string | null;
  };
  generatedAt: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  filename?: string;
}