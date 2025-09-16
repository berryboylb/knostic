import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import { fileRouter } from "./api/file/fileRouter";
import { openAPIRouter } from "@/api-docs/openAPIRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";
import path from "path";
import { fileURLToPath } from "url";
import type { CSVData } from "./types/csv.types.js";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
app.use(rateLimiter);

app.locals.csvData = {
  strings: null,
  classifications: null,
} satisfies CSVData;

// Request logging
app.use(requestLogger);

// Swagger UI
app.use("/api-docs", openAPIRouter);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);
app.use("/files", fileRouter);

// Serve static files from backend/dist/public
app.use(express.static(path.join(__dirname, "public")));

// Fallback: for any non-API route, return index.html so React Router works
app.get("*splat", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handlers
app.use(errorHandler());

export { app, logger };
