import "dotenv/config";

const requiredEnvVariables = [
  "MONGODB_URI",
] as const;

for (const variable of requiredEnvVariables) {
  if (!process.env[variable]) {
    throw new Error(
      `Missing required environment variable: ${variable}`
    );
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 4000,

  mongodbUri: process.env.MONGODB_URI as string,

  frontendUrl:
    process.env.FRONTEND_URL || "http://localhost:3000",

  /*
   * Comma-separated CORS allowlist. FRONTEND_URL is kept as a
   * backwards-compatible fallback. Defaults cover local dev:
   * localhost, 127.0.0.1 and Next.js's port-rollover.
   */
  corsOrigins: (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  // Optional. When set, mutating API routes require a
  // matching `x-api-key` header. When unset, they pass through.
  apiKey:
    process.env.API_KEY || "",

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY
};