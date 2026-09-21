// Runs before every backend test file.
//
// Guarantees the required-env validation in src/config/env.ts never
// throws on import when backend/.env is absent (CI, clean clones).
// Real values from the environment always win over these dummies.
process.env.MONGODB_URI ??=
  "mongodb://localhost:27017/newsgarden-test";
