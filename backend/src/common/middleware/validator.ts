import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";

type ValidationSource = "body" | "query" | "params";

export const validate =
  (schema: ZodSchema, source: ValidationSource = "body"): RequestHandler =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = req[source];
      if (
        !target ||
        (typeof target === "object" && Object.keys(target).length === 0)
      ) {
        return res.status(400).json({
          message: `Validation error: request ${source} is empty`,
          errors: [],
        });
      }
      //strip unwanted fields
      const result = await schema.parse(target);
      req[source] = result;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: err.errors.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        });
      }
      next(err);
    }
  };
