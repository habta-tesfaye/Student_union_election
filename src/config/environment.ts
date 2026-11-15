
import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from the .env file
dotenv.config();

// Validate environment variables
const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(5000),

  MONGODB_URI: z.string().min(1, "MongoDB URI is required"),

  CLIENT_URL: z
    .string()
    .url()
    .default("http://localhost:5173"),
});

// Check environment variables
const result = environmentSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(result.error.format());
  process.exit(1);
}

// Export validated configuration
export const env = result.data;
