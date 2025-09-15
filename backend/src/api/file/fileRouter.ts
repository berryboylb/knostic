import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { fileController } from "./fileController";
import { upload } from "@/common/middleware/multer";
import { validate } from "@/common/middleware/validator";
import {
  updateDataRequestSchema,
  classificationsCSVRowSchema,
  validateRequestSchema,
} from "@/validator";
export const fileRegistry = new OpenAPIRegistry();
export const fileRouter: Router = express.Router();

// userRegistry.register("File");

// userRegistry.registerPath({
//     method: "get",
//     path: "/users",
//     tags: ["User"],
//     responses: createApiResponse(z.array(UserSchema), "Success"),
// });

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

fileRouter.post(
  "/validate",
  validate(validateRequestSchema),
  fileController.validate
);

fileRouter.get("/", fileController.getData);

fileRouter.get(
  "/validate/stats",
  validate(validateRequestSchema),
  fileController.validationStats
);
fileRouter.get("/validate/status", fileController.validationStatus);
fileRouter.get("/export", fileController.exportAll);
fileRouter.get("/export/batch", fileController.exportBatch);

fileRouter.get("/:fileType", fileController.getFile);
fileRouter.get("/export/:fileType", fileController.exportSingle);
fileRouter.get("/export/metadata/:fileType", fileController.exportMetadata);

fileRouter.put(
  "/:fileType",
  validate(updateDataRequestSchema),
  fileController.update
);
