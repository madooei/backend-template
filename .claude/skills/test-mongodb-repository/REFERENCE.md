# MongoDB Repository Test Reference

Complete reference files for MongoDB repository testing.

## MongoDB Repository Test Example

**File**: `tests/repositories/note.mongodb.repository.test.ts`

```typescript
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from "vitest";
import { MongoDbNoteRepository } from "@/repositories/mongodb/note.mongodb.repository";
import type { MongoClient, Db } from "mongodb";
import type {
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
} from "@/schemas/note.schema";

describe("MongoDbNoteRepository", () => {
  let repository: MongoDbNoteRepository;
  let testClient: MongoClient;
  let testDb: Db;
  const testUserId = "test-user-123";

  beforeAll(async () => {
    const { db, client } = await setupTestDatabase();
    testDb = db;
    testClient = client;
  });

  afterAll(async () => {
    await cleanupTestDatabase(testClient);
  });

  beforeEach(async () => {
    repository = new MongoDbNoteRepository();
    await repository.clear();
  });

  afterEach(async () => {
    await repository.clear();
  });

  describe("create", () => {
    it("should create a new note successfully", async () => {
      const noteData: CreateNoteType = { content: "Test note content" };

      const result = await repository.create(noteData, testUserId);

      expect(result).toMatchObject({
        id: expect.any(String),
        content: "Test note content",
        createdBy: testUserId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("findById", () => {
    it("should find an existing note by ID", async () => {
      const noteData: CreateNoteType = { content: "Test note content" };
      const createdNote = await repository.create(noteData, testUserId);

      const foundNote = await repository.findById(createdNote.id);

      expect(foundNote).toEqual(createdNote);
    });

    it("should return null for non-existent note", async () => {
      const result = await repository.findById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    beforeEach(async () => {
      await repository.create({ content: "First note" }, testUserId);
      await repository.create({ content: "Second note" }, "other-user");
      await repository.create(
        { content: "Third note with search term" },
        testUserId,
      );
    });

    it("should return all notes with default pagination", async () => {
      const params: NoteQueryParamsType = {};
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it("should filter notes by createdBy", async () => {
      const params: NoteQueryParamsType = { createdBy: testUserId };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(2);
      expect(result.data.every((note) => note.createdBy === testUserId)).toBe(
        true,
      );
    });

    it("should search notes by content", async () => {
      const params: NoteQueryParamsType = { search: "search term" };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].content).toContain("search term");
    });

    it("should handle pagination correctly", async () => {
      const params: NoteQueryParamsType = { page: 1, limit: 2 };
      const result = await repository.findAll(params);

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(2);
    });

    it("should sort notes correctly", async () => {
      const params: NoteQueryParamsType = {
        sortBy: "content",
        sortOrder: "asc",
      };
      const result = await repository.findAll(params);

      expect(result.data[0].content).toBe("First note");
      expect(result.data[1].content).toBe("Second note");
    });
  });

  describe("update", () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await repository.create(
        { content: "Original content" },
        testUserId,
      );
      noteId = note.id;
    });

    it("should update an existing note", async () => {
      await new Promise((resolve) => setTimeout(resolve, 1));

      const updateData: UpdateNoteType = { content: "Updated content" };
      const result = await repository.update(noteId, updateData);

      expect(result).toMatchObject({
        id: noteId,
        content: "Updated content",
        createdBy: testUserId,
      });
    });

    it("should return null for non-existent note", async () => {
      const result = await repository.update("non-existent-id", {
        content: "Updated",
      });
      expect(result).toBeNull();
    });
  });

  describe("remove", () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await repository.create(
        { content: "Note to delete" },
        testUserId,
      );
      noteId = note.id;
    });

    it("should remove an existing note", async () => {
      const result = await repository.remove(noteId);
      expect(result).toBe(true);

      const foundNote = await repository.findById(noteId);
      expect(foundNote).toBeNull();
    });

    it("should return false for non-existent note", async () => {
      const result = await repository.remove("non-existent-id");
      expect(result).toBe(false);
    });
  });

  describe("database indexes", () => {
    it("should create proper indexes for performance", async () => {
      await repository.create({ content: "Test note" }, testUserId);
      const stats = await repository.getStats();

      expect(stats.indexes).toContain("_id_");
      expect(stats.indexes).toContain("notes_createdBy");
      expect(stats.indexes).toContain("notes_createdAt_desc");
      expect(stats.indexes).toContain("notes_content_text");
    });
  });

  describe("helper methods", () => {
    it("should clear all notes", async () => {
      await repository.create({ content: "Test note 1" }, testUserId);
      await repository.create({ content: "Test note 2" }, testUserId);

      await repository.clear();

      const result = await repository.findAll({});
      expect(result.data).toHaveLength(0);
    });

    it("should return collection stats", async () => {
      await repository.create({ content: "Test note 1" }, testUserId);
      await repository.create({ content: "Test note 2" }, testUserId);

      const stats = await repository.getStats();
      expect(stats.count).toBe(2);
    });
  });
});
```

## Vitest Configuration

**File**: `vitest.config.ts`

```typescript
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Global setup and teardown for MongoDB
    globalSetup: ["./tests/config/mongodb.global.ts"],
    // Per-test setup
    setupFiles: ["./tests/config/mongodb.setup.ts"],
    // Ensure tests run serially to avoid database conflicts
    pool: "forks",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/coverage/**",
        "**/node_modules/**",
        "**/dist/**",
        "**/scripts/**",
        "**/src/server.ts",
        "**/src/config/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

## MongoDB Global Setup

**File**: `tests/config/mongodb.global.ts`

```typescript
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

  // Store connection info in environment variables for tests
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
```

## MongoDB Per-Test Setup

**File**: `tests/config/mongodb.setup.ts`

```typescript
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
```

## Dependencies

Add to `package.json`:

```json
{
  "devDependencies": {
    "mongodb-memory-server": "^10.0.0",
    "vitest": "^2.0.0"
  }
}
```
