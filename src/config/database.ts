import mongoose from "mongoose";
import { env } from "./environment.js";

/**
 * Connect the backend application to MongoDB.
 */
export async function connectDatabase(): Promise<void> {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB connected successfully!");
    console.log(`Database: ${mongoose.connection.name}`);
  } catch (error) { ``
    console.error("MongoDB connection failed!");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}