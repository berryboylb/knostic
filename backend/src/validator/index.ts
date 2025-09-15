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