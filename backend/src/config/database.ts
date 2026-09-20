import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(env.mongodbUri);

    console.log("🟢 MongoDB connected");
    console.log(`📦 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error("🔴 MongoDB connection failed");

    console.error(error);

    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();

  console.log("MongoDB disconnected");
}