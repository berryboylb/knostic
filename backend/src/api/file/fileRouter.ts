import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { fileController } from "./fileController";
import { upload } from "@/common/middleware/multer";
import { validate } from "@/common/middleware/validator";
import {
  ExportBatchResponseSchema,
  ExportMetadataResponseSchema,
  ExportResponseSchema,
  GetDataResponseSchema,
  ResultSchema,
  UpdateDataResponseSchema,
  ValidationStatsSchema,
} from "../../validator/index";
import {
  updateDataRequestSchema,
  classificationsCSVRowSchema,
  validateRequestSchema,
  UploadResponseSchema,
  validateResponseSchema,
  CSVUploadResponseSchema,
} from "@/validator";
export const fileRegistry = new OpenAPIRegistry();
export const fileRouter: Router = express.Router();

// userRegistry.register("File");

fileRegistry.registerPath({
  method: "post",
  path: "/files/upload",
  tags: ["File"],
  responses: createApiResponse(UploadResponseSchema, "Success"),
});

fileRouter.post(
  "/upload",
  upload.fields([
    { name: "file1", maxCount: 1 }, // Accept any field names
    { name: "file2", maxCount: 1 },
    { name: "strings", maxCount: 1 }, // Still support specific names
    { name: "classifications", maxCount: 1 },
  ]),
  fileController.upload
);

fileRegistry.registerPath({
  method: "post",
  path: "/files/validate",
  tags: ["File"],
  responses: createApiResponse(validateResponseSchema, "Success"),
});

fileRouter.post(
  "/validate",
  validate(validateRequestSchema),
  fileController.validate
);

fileRegistry.registerPath({
  method: "get",
  path: "/files",
  tags: ["File"],
  responses: createApiResponse(CSVUploadResponseSchema, "Success"),
});

fileRouter.get("/", fileController.getData);

fileRegistry.registerPath({
  method: "get",
  path: "/files/validate/stats",
  tags: ["File"],
  responses: createApiResponse(ValidationStatsSchema, "Success"),
});

fileRouter.get(
  "/validate/stats",
  validate(validateRequestSchema),
  fileController.validationStats
);

fileRegistry.registerPath({
  method: "get",
  path: "/files/validate/status",
  tags: ["File"],
  responses: createApiResponse(ResultSchema, "Success"),
});
fileRouter.get("/validate/status", fileController.validationStatus);

fileRegistry.registerPath({
  method: "get",
  path: "/files/export",
  tags: ["File"],
  responses: createApiResponse(ExportResponseSchema, "Success"),
});
fileRouter.get("/export", fileController.exportAll);

fileRegistry.registerPath({
  method: "get",
  path: "/files/export/batch",
  tags: ["File"],
  responses: createApiResponse(ExportBatchResponseSchema, "Success"),
});
fileRouter.get("/export/batch", fileController.exportBatch);

fileRegistry.registerPath({
  method: "get",
  path: "/files/:fileType",
  tags: ["File"],
  responses: createApiResponse(GetDataResponseSchema, "Success"),
});
fileRouter.get("/:fileType", fileController.getFile);

fileRegistry.registerPath({
  method: "get",
  path: "/files/export/:fileType",
  tags: ["File"],
  responses: createApiResponse(z.null(), "Success"),
});
fileRouter.get("/export/:fileType", fileController.exportSingle);

fileRegistry.registerPath({
  method: "get",
  path: "/files/export/metadata/:fileType",
  tags: ["File"],
  responses: createApiResponse(ExportMetadataResponseSchema, "Success"),
});
fileRouter.get("/export/metadata/:fileType", fileController.exportMetadata);

fileRegistry.registerPath({
  method: "put",
  path: "/files/:fileType",
  tags: ["File"],
  responses: createApiResponse(UpdateDataResponseSchema, "Success"),
});

fileRouter.put(
  "/:fileType",
  validate(updateDataRequestSchema),
  fileController.update
);
