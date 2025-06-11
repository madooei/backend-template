import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

export async function setup() {
  console.log("🚀 Starting MongoDB Memory Server...");

  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: "8.0.0", // Match your production MongoDB version
    },
    instance: {
      dbName: "test-database",
    },
  });

  const mongoUri = mongoServer.getUri();

  // Initialize MongoClient and connect
  mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();

  // Store connection info in global variables for tests
  process.env.MONGODB_TEST_URI = mongoUri;
  process.env.MONGODB_TEST_DB = "test-database";

  console.log(`✅ MongoDB Memory Server started at ${mongoUri}`);
}

export async function teardown() {
  console.log("🛑 Stopping MongoDB Memory Server...");

  if (mongoClient) {
    await mongoClient.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log("✅ MongoDB Memory Server stopped");
}
