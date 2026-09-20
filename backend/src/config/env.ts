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

  GEMINI_API_KEY:
    process.env.GEMINI_API_KEY
};