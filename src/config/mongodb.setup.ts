import { MongoClient, Db } from "mongodb";
import { env } from "@/env";

// Construct the connection URI with optional authentication
let MONGODB_URI = `mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}/${env.MONGODB_DATABASE}`;

// Add credentials and authSource only if username and password are provided
if (env.MONGODB_USER && env.MONGODB_PASSWORD) {
  MONGODB_URI =
    `mongodb://` +
    `${env.MONGODB_USER}:${env.MONGODB_PASSWORD}` +
    `@` +
    `${env.MONGODB_HOST}:${env.MONGODB_PORT}` +
    `/` +
    `${env.MONGODB_DATABASE}` +
    `?` +
    `authSource=admin`;
}

class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db;
    }

    try {
      console.log("🔌 Connecting to MongoDB...");
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      console.log("✅ Connected to MongoDB successfully");

      // Set the database instance
      this.db = this.client.db(env.MONGODB_DATABASE);
      console.log(`📚 Using database: ${env.MONGODB_DATABASE}`);

      // Return the database instance
      return this.db;
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log("🔌 Disconnected from MongoDB");
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.db;
  }

  isConnected(): boolean {
    return this.db !== null;
  }
}

// Export a singleton instance
export const database = new DatabaseConnection();

// Helper function to get database instance
export const getDatabase = async (): Promise<Db> => {
  return await database.connect();
};
