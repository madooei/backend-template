import { Server } from "net";
import { serve } from "@hono/node-server";
import { app } from "@/app";
import { env } from "@/env";
import { database } from "@/config/mongodb.setup";

// Set up graceful shutdown
const setupGracefulShutdown = (server: Server) => {
  const signals = ["SIGINT", "SIGTERM"] as const;

  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`${signal} received...`);

      server.close(async () => {
        console.log("\n🛑 Shutting down server...");
        try {
          await database.disconnect();
          console.log("✅ Database disconnected");
          process.exit(0);
        } catch (error) {
          console.error("❌ Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force close after 5 seconds if graceful shutdown fails
      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 5000);
    });
  }
};

async function startServer() {
  try {
    // Initialize database connection if not in test environment
    if (env.NODE_ENV !== "test") {
      await database.connect();
    }

    const server = serve(
      {
        fetch: app.fetch,
        port: env.PORT,
      },
      (info) => {
        console.log(`Server is running on http://localhost:${info.port}`);
      }
    );

    setupGracefulShutdown(server);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
