import type { ErrorRequestHandler, RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import multer from "multer";

const finalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(">>>> multer", err);
  // Handle Multer errors
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File too large" : err.message;
    return res.status(StatusCodes.BAD_REQUEST).json({ message });
  }

  // Handle custom fileFilter errors
  if (err instanceof Error && err.message === "Only CSV files are allowed") {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: err.message });
  }

  // Fallback
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: "Internal server error" });
};

const unexpectedRequest: RequestHandler = (_req, res) => {
  res.status(StatusCodes.NOT_FOUND).send("Not Found");
};

const addErrorToRequestLog: ErrorRequestHandler = (err, _req, res, next) => {
  res.locals.err = err;
  next(err);
};

export default (): [
  RequestHandler,
  ErrorRequestHandler,
  ErrorRequestHandler
] => [unexpectedRequest, addErrorToRequestLog, finalErrorHandler];
