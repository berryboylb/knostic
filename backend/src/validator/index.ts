import { z } from "zod";

export const stringsCSVRowSchema = z.object({
  Tier: z.string(),
  Industry: z.string(),
  Topic: z.string(),
  Subtopic: z.string(),
  Prefix: z.string(),
  "Fuzzing-Idx": z.string(),
  Prompt: z.string(),
  Risks: z.string(),
  Keywords: z.string(),
}); // [key: string]: string

export const classificationsCSVRowSchema = z.object({
  Topic: z.string(),
  SubTopic: z.string(),
  Industry: z.string(),
  Classification: z.string(),
}); // [key: string]: string

export const ParsedCSVResponseSchema = z.object({
  data: z.union([
    z.array(stringsCSVRowSchema),
    z.array(classificationsCSVRowSchema),
  ]),
  rowCount: z.number(),
  headers: z.array(z.string()),
  originalFilename: z.string(),
});

export const UploadResponseSchema = z.object({
  message: z.string(),
  strings: ParsedCSVResponseSchema.optional(),
  classifications: ParsedCSVResponseSchema.optional(),
});

export const updateDataRequestSchema = z.object({
  data: z.union([
    z.array(stringsCSVRowSchema),
    z.array(classificationsCSVRowSchema),
  ]),
  validateReferences: z.boolean().optional(),
});

export const validateRequestSchema = z.object({
  stringsData: z.array(stringsCSVRowSchema).optional(),
  classificationsData: z.array(classificationsCSVRowSchema).optional(),
  includeRowDetails: z.boolean().optional(),
  onlyShowErrors: z.boolean().optional(),
});

export const ValidationDetailSchema = z.object({
  rowIndex: z.number(),
  rowData: z.object({
    Topic: z.string(),
    Subtopic: z.string(),
    Industry: z.string(),
    Tier: z.string().optional(),
    Prompt: z.string().optional(),
  }),
  isValid: z.boolean(),
  matchedClassification: classificationsCSVRowSchema.optional(),
  error: z.string().optional(),
});

export const validateResponseSchema = z.object({
  isValid: z.boolean(),
  summary: z.object({
    totalStringsRows: z.number(),
    validRows: z.number(),
    invalidRows: z.number(),
    validationPercentage: z.number(),
  }),
  invalidCombinations: z.array(
    z.object({
      combination: z.string(),
      count: z.number(),
      rows: z.array(z.number()),
    })
  ),
  missingClassifications: z.array(
    z.object({
      Topic: z.string(),
      SubTopic: z.string(),
      Industry: z.string(),
      suggestedClassification: z.string().optional(),
    })
  ),
  rowDetails: z.array(ValidationDetailSchema).optional(),
  availableClassifications: z.array(
    z.object({
      Topic: z.string(),
      SubTopic: z.string(),
      Industry: z.string(),
      Classification: z.string(),
    })
  ),
  validatedAt: z.string(),
});

const StringsFileSchema = z.object({
  fileType: z.literal("strings"),
  originalFilename: z.string(),
  data: z.array(stringsCSVRowSchema),
  rowCount: z.number(),
  headers: z.array(z.string()),
  lastModified: z.string(),
});

const ClassificationsFileSchema = z.object({
  fileType: z.literal("classifications"),
  originalFilename: z.string(),
  data: z.array(classificationsCSVRowSchema),
  rowCount: z.number(),
  headers: z.array(z.string()),
  lastModified: z.string(),
});

export const CSVUploadResponseSchema = z.object({
  strings: StringsFileSchema.nullable(),
  classifications: ClassificationsFileSchema.nullable(),
});

export const ValidationStatsSchema = z.object({
  totalCombinations: z.number(),
  uniqueCombinations: z.number(),
  validCombinations: z.number(),
  invalidCombinations: z.number(),
  duplicateRows: z.number(),
});

export const validationCheckSchema = z.object({
  canValidate: z.boolean(),
  hasStrings: z.boolean(),
  hasClassifications: z.boolean(),
  error: z.string().nullable().optional(), 
});

export const ResultSchema = validationCheckSchema.extend({
  dataInfo: z.object({
    stringsRows: z.number(),
    classificationsRows: z.number(),
    stringsFilename: z.string().optional().nullable(),
    classificationsFilename: z.string().optional().nullable(),
  }),
  checkedAt: z.string(), // ISO timestamp
});

export const ExportResponseSchema = z.object({
  available: z.object({
    strings: z.boolean(),
    classifications: z.boolean(),
  }),
  summary: z.any(), 
  downloadLinks: z.object({
    strings: z.string().url().nullable(),
    classifications: z.string().url().nullable(),
    batch: z.string().url().nullable(),
  }),
  generatedAt: z.string(),
});

export const ExportBatchResponseSchema = z.object({
  success: z.literal(true),
  files: z
    .array(
      z.object({
        fileType: z.enum(["strings", "classifications"]),
        filename: z.string(),
        downloadUrl: z.string().url(),
        metadata: z
          .object({
            // If you know the exact shape of file.metadata, replace z.any()
            // For example, if you at least know it has rowCount:
            rowCount: z.number(),
          })
          .passthrough(),
      })
    )
    .optional(), // if batchResult.files can be undefined
  batchSize: z.number().optional(),
  totalRows: z.number().optional(),
  generatedAt: z.string(),
});

export const GetDataResponseSchema = z.object({
  fileType: z.enum(["strings", "classifications"]),
  originalFilename: z.string(),
  data: z.array(z.record(z.string(), z.string())), 
  rowCount: z.number(),
  headers: z.array(z.string()),
  lastModified: z.string(), 
});

export const FileMetadataSchema = z
  .object({
    rowCount: z.number(),
  })
  .passthrough();

export const ExportMetadataResponseSchema = z.object({
  success: z.literal(true),
  files: z
    .array(
      z.object({
        fileType: z.enum(["strings", "classifications"]),
        filename: z.string(),
        downloadUrl: z.string().url(),
        metadata: FileMetadataSchema,
      })
    )
    .optional(), 
  batchSize: z.number().optional(),
  totalRows: z.number().optional(),
  generatedAt: z.string(),
});


export const FileTypeSchema = z.enum(["strings", "classifications"]);

export const UpdateDataResponseSchema = z.object({
  fileType: FileTypeSchema,
  message: z.string(),
  updatedRows: z.number(),
  validationResults: z
    .object({
      valid: z.boolean(),
      errors: z.array(z.string()),
      invalidRows: z.array(z.number()),
    })
    .optional(),
  data: z.array(z.union([stringsCSVRowSchema, classificationsCSVRowSchema])),
  lastModified: z.string(),
});