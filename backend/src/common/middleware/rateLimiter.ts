import type { Request } from "express";
// import { rateLimit } from "express-rate-limit";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { env } from "@/common/utils/envConfig";

const rateLimiter = rateLimit({
  legacyHeaders: true,
  limit: env.COMMON_RATE_LIMIT_MAX_REQUESTS,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  windowMs: 15 * 60 * env.COMMON_RATE_LIMIT_WINDOW_MS,
  max: 100,
  keyGenerator: (req, res) => {
    const baseKey = ipKeyGenerator(req.ip?.toString() as string);
    // add your extra suffix/prefix if needed
    return `${baseKey}:${req.headers["x-some-header"] ?? ""}`;
  },
});

export default rateLimiter;
