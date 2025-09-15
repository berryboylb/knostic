import type { FileType } from "@/types/csv.types.js";

export const detectFileType = (
  headers: string[]
): "strings" | "classifications" | "unknown" => {
  const stringsFields = [
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
  const classificationsFields = [
    "Topic",
    "SubTopic",
    "Industry",
    "Classification",
  ];

  const hasAllStringsFields = stringsFields.every((field) =>
    headers.includes(field)
  );
  const hasAllClassificationsFields = classificationsFields.every((field) =>
    headers.includes(field)
  );

  if (hasAllStringsFields) return "strings";
  if (hasAllClassificationsFields) return "classifications";
  return "unknown";
};

export const isValidFileType = (fileType: string): fileType is FileType => {
  return fileType === "strings" || fileType === "classifications";
};
