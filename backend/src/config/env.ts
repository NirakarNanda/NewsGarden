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

  // When true, kick off an edition build once the
  // server finishes starting.
  runOnStart:
    process.env.RUN_ON_START === "true",

  /*
   * Seconds before ActivityEvent documents expire via the
   * emittedAt TTL index (default: 30 days). Set
   * ACTIVITY_EVENT_TTL_DAYS=0 to disable expiry.
   */
  activityEventTtlSeconds: (() => {
    const days = Number(
      process.env.ACTIVITY_EVENT_TTL_DAYS
    );

    if (
      process.env.ACTIVITY_EVENT_TTL_DAYS === "0"
    ) {

      return 0;
    }

    return Number.isFinite(days) && days > 0
      ? Math.floor(days * 86400)
      : 30 * 86400;
  })(),

  /*
   * Max concurrent AI calls across the whole process.
   * Agents share one semaphore so a workflow fan-out cannot
   * hammer Ollama/Groq with dozens of parallel requests.
   */
  aiMaxConcurrency: (() => {

    const raw = Number(
      process.env.AI_MAX_CONCURRENCY
    );

    return Number.isFinite(raw) && raw > 0
      ? Math.floor(raw)
      : 4;
  })(),

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY
};