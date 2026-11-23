
import mongoose from "mongoose";
import { env } from "./environment.js";

/**
 * Connect the backend application to MongoDB
 * and display all existing database collections.
 */
export async function connectDatabase(): Promise<void> {
  try {
    console.log("\nConnecting to MongoDB...");

    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB connected successfully!");
    console.log(`Database: ${mongoose.connection.name}`);

    // Check that the database connection is available.
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB database instance is unavailable.");
    }

    // Retrieve all existing collections.
    const collections = await db.listCollections().toArray();

    console.log("\n----------------------------------------");
    console.log("MONGODB DATABASE COLLECTIONS");
    console.log("----------------------------------------");

    if (collections.length === 0) {
      console.log("No collections found.");
    } else {
      collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
      });
    }

    console.log("----------------------------------------");
    console.log(`Total collections: ${collections.length}`);
    console.log("----------------------------------------\n");

  } catch (error) {
    console.error("MongoDB connection failed!");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}
