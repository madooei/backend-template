import { MongoClient, Db } from "mongodb";
import { vi } from "vitest";

// Store test database instances globally
let testDb: Db;
let testClient: MongoClient;

// Mock database connection module
vi.mock("@/config/mongodb.setup", () => {
  return {
    database: {
      connect: vi.fn(async () => {
        if (!testDb) {
          throw new Error(
            "Test database not initialized. Call setupTestDatabase() first.",
          );
        }
        return testDb;
      }),
      disconnect: vi.fn(async () => {
        // No-op for tests, cleanup handled by global teardown
      }),
      getDb: vi.fn(() => {
        if (!testDb) {
          throw new Error(
            "Test database not initialized. Call setupTestDatabase() first.",
          );
        }
        return testDb;
      }),
      isConnected: vi.fn(() => !!testDb),
    },
    getDatabase: vi.fn(async () => {
      if (!testDb) {
        throw new Error(
          "Test database not initialized. Call setupTestDatabase() first.",
        );
      }
      return testDb;
    }),
  };
});

// Global test helper to set up database connection
declare global {
  var setupTestDatabase: () => Promise<{ db: Db; client: MongoClient }>;
  var cleanupTestDatabase: (client: MongoClient) => Promise<void>;
}

global.setupTestDatabase = async () => {
  const mongoUri = process.env.MONGODB_TEST_URI!;
  const dbName = process.env.MONGODB_TEST_DB!;

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  // Set the test database instances
  testDb = db;
  testClient = client;

  return { db, client };
};

global.cleanupTestDatabase = async (client: MongoClient) => {
  await client.close();
  testDb = undefined as any;
  testClient = undefined as any;
};
