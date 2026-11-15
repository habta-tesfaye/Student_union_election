import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/environment.js";

/**
 * Start the backend server.
 */
async function startServer(): Promise<void> {
  try {
    // First, connect to MongoDB
    await connectDatabase();

    // Start the Express server
    app.listen(env.PORT, () => {
      console.log("----------------------------------------");
      console.log("Student Union Election System Backend");
      console.log("----------------------------------------");
      console.log(`Server running at: http://localhost:${env.PORT}`);
      console.log(`Environment: ${env.NODE_ENV}`);
      console.log("----------------------------------------");
    });
  } catch (error) {
    console.error("Failed to start the server:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the server
startServer();