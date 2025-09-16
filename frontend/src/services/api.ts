import type {
  FileType,
  GetDataResponse,
  UploadResponse,
  ValidateResponse,
  ValidationStatusResponse,
  ExportSummaryResponse,
  ErrorResponse,
  StringsCSVRow,
  ClassificationsCSVRow,
} from "@/types";

const API_BASE = import.meta.env.DEV
  ? "/api"
  : "https://knostic-app-production.up.railway.app";

// class APIError extends Error {
//   constructor(message: string, public status: number, public details?: string) {
//     super(message);
//     this.name = "APIError";
//   }
// }

class APIError extends Error {
  public status: number;
  public details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.details = details;
  }
}


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ErrorResponse = await response.json().catch(() => ({
      error: "Network error",
      details: `HTTP ${response.status}: ${response.statusText}`,
    }));

    throw new APIError(errorData.error, response.status, errorData.details);
  }

  return response.json();
}

export const api = {
  // Data endpoints
  async getData(fileType: FileType): Promise<GetDataResponse> {
    const response = await fetch(`${API_BASE}/files/${fileType}`);
    return handleResponse<GetDataResponse>(response);
  },

  async getAllData(): Promise<{
    success: boolean;
    message: string;
    responseObject: {
      strings: GetDataResponse | null;
      classifications: GetDataResponse | null;
    };
  }> {
    const response = await fetch(`${API_BASE}/files`);
    return handleResponse(response);
  },

  // Upload endpoints
  async uploadFiles(files: { [key: string]: File }): Promise<UploadResponse> {
    const formData = new FormData();

    Object.entries(files).forEach(([key, file]) => {
      formData.append(key, file);
    });

    const response = await fetch(`${API_BASE}/files/upload`, {
      method: "POST",
      body: formData,
    });

    return handleResponse<UploadResponse>(response);
  },

  async updateData(
    fileType: FileType,
    data: StringsCSVRow[] | ClassificationsCSVRow[],
    validateReferences = true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const response = await fetch(`${API_BASE}/${fileType}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, validateReferences }),
    });

    return handleResponse(response);
  },

  // Validation endpoints
  async validateData(): Promise<ValidateResponse> {
    const response = await fetch(`${API_BASE}/files/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    return handleResponse<ValidateResponse>(response);
  },

  async getValidationStatus(): Promise<ValidationStatusResponse> {
    const response = await fetch(`${API_BASE}/files/validate/status`);
    return handleResponse<ValidationStatusResponse>(response);
  },

  // Export endpoints
  async getExportSummary(): Promise<ExportSummaryResponse> {
    const response = await fetch(`${API_BASE}/files/export`);
    return handleResponse<ExportSummaryResponse>(response);
  },

  async downloadFile(
    fileType: FileType,
    options?: {
      filename?: string;
      delimiter?: string;
      includeHeaders?: boolean;
    }
  ): Promise<{ blob: Blob; filename: string }> {
    const searchParams = new URLSearchParams();

    if (options?.filename) searchParams.set("filename", options.filename);
    if (options?.delimiter) searchParams.set("delimiter", options.delimiter);
    if (options?.includeHeaders !== undefined) {
      searchParams.set("includeHeaders", options.includeHeaders.toString());
    }

    const url = `${API_BASE}/files/export/${fileType}${
      searchParams.toString() ? `?${searchParams}` : ""
    }`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new APIError(
        "Download failed",
        response.status,
        `Failed to download ${fileType} file`
      );
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get("content-disposition");
    const filename = contentDisposition
      ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") ||
        `${fileType}.csv`
      : `${fileType}.csv`;

    return { blob, filename };
  },
};

export { APIError };
