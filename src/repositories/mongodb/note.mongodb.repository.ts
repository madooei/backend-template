import { Collection, Db, ObjectId } from "mongodb";
import type { WithId, Filter, Sort } from "mongodb";
import type {
  NoteType,
  CreateNoteType,
  UpdateNoteType,
  NoteQueryParamsType,
  NoteIdType,
} from "@/schemas/note.schema";
import { noteSchema } from "@/schemas/note.schema";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type PaginatedResultType,
} from "@/schemas/shared.schema";
import type { INoteRepository } from "@/repositories/note.repository";
import type { UserIdType } from "@/schemas/user.schemas";
import { getDatabase } from "@/config/mongodb.setup";

// It's essentially our Note schema but expects its primary key (_id) to be an ObjectId.
// The 'id' field in our Note domain model will be derived from _id.toHexString().
interface MongoNoteDocument
  extends Omit<NoteType, "id" | "createdAt" | "updatedAt"> {
  _id?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export class MongoDbNoteRepository implements INoteRepository {
  private collection: Collection<MongoNoteDocument> | null = null;

  // Lazy load the collection when needed
  // This ensures we only connect to the database when we actually need to perform an operation
  // and not at the time of instantiation.
  // Although, in the current setup, we connect to the database when the application starts,
  // this pattern allows for better separation of concerns and makes testing easier.
  private async getCollection(): Promise<Collection<MongoNoteDocument>> {
    if (!this.collection) {
      const db: Db = await getDatabase();
      this.collection = db.collection<MongoNoteDocument>("notes");
      await this.createIndexes(this.collection);
      console.log("📚 Notes collection initialized");
    }
    return this.collection;
  }

  // createIndex is idempotent, so we can safely call it multiple times
  private async createIndexes(
    collection: Collection<MongoNoteDocument>,
  ): Promise<void> {
    console.log("Creating indexes for notes collection...");

    await Promise.all([
      collection.createIndex({ createdBy: 1 }, { name: "notes_createdBy" }),
      collection.createIndex(
        { createdAt: -1 },
        { name: "notes_createdAt_desc" },
      ),
      collection.createIndex(
        { content: "text" },
        { name: "notes_content_text" },
      ),
    ]);

    console.log("✅ Notes indexes created successfully");
  }

  private mapDocumentToEntity(doc: WithId<MongoNoteDocument>): NoteType {
    const { _id, ...restOfDoc } = doc;
    // Parse and validate the document using Zod schema
    return noteSchema.parse({
      ...restOfDoc,
      id: _id.toHexString(),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private mapEntityToDocument(
    data: CreateNoteType,
    createdByUserId: UserIdType,
  ): Omit<MongoNoteDocument, "_id"> {
    const now = new Date();
    return {
      content: data.content,
      createdBy: createdByUserId,
      createdAt: now,
      updatedAt: now,
    };
  }

  async findAll(
    params: NoteQueryParamsType,
  ): Promise<PaginatedResultType<NoteType>> {
    const collection = await this.getCollection();

    // Build MongoDB query filter
    const filter: Filter<MongoNoteDocument> = {};

    if (params.createdBy) {
      filter.createdBy = params.createdBy;
    }

    if (params.search?.trim()) {
      // Use MongoDB text search for better performance
      filter.$text = { $search: params.search.trim() };
    }

    // Calculate pagination
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortBy = params.sortBy ?? "createdAt";
    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const sort: Sort = { [sortBy]: sortOrder };

    // Execute queries
    const [documents, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    // Map documents to entities
    const notes = documents.map((doc) => this.mapDocumentToEntity(doc));
    const totalPages = Math.ceil(total / limit);

    return {
      data: notes,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: NoteIdType): Promise<NoteType | null> {
    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();
    const document = await collection.findOne({ _id: new ObjectId(id) });

    if (!document) {
      return null;
    }

    return this.mapDocumentToEntity(document);
  }

  async findAllByIds(
    ids: NoteIdType[],
    params: NoteQueryParamsType,
  ): Promise<PaginatedResultType<NoteType>> {
    const collection = await this.getCollection();

    // Convert string IDs to ObjectIds and filter out invalid ones
    const objectIds = ids
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    // Build MongoDB query filter
    const filter: Filter<MongoNoteDocument> = { _id: { $in: objectIds } };

    if (params.createdBy) {
      filter.createdBy = params.createdBy;
    }

    if (params.search?.trim()) {
      filter.$text = { $search: params.search.trim() };
    }

    // Calculate pagination
    const page = params.page ?? DEFAULT_PAGE;
    const limit = params.limit ?? DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortBy =
      params.sortBy === "id" ? "_id" : (params.sortBy ?? "createdAt");
    const sortOrder = params.sortOrder === "asc" ? 1 : -1;
    const sort: Sort = { [sortBy]: sortOrder };

    // Execute queries
    const [documents, total] = await Promise.all([
      collection.find(filter).sort(sort).skip(skip).limit(limit).toArray(),
      collection.countDocuments(filter),
    ]);

    // Map documents to entities
    const notes = documents.map((doc) => this.mapDocumentToEntity(doc));
    const totalPages = Math.ceil(total / limit);

    return {
      data: notes,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async create(
    data: CreateNoteType,
    createdByUserId: UserIdType,
  ): Promise<NoteType> {
    const collection = await this.getCollection();
    const documentToInsert = this.mapEntityToDocument(data, createdByUserId);

    const result = await collection.insertOne(documentToInsert);

    if (!result.insertedId) {
      throw new Error(
        "Note creation failed, no ObjectId generated by database.",
      );
    }

    // Return the created note with the generated ID
    return noteSchema.parse({
      ...documentToInsert,
      id: result.insertedId.toHexString(),
    });
  }

  async update(id: NoteIdType, data: UpdateNoteType): Promise<NoteType | null> {
    if (!ObjectId.isValid(id)) {
      return null;
    }

    const collection = await this.getCollection();

    const updateDoc = {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateDoc,
      {
        returnDocument: "after",
      },
    );

    if (!result) {
      return null;
    }

    return this.mapDocumentToEntity(result);
  }

  async remove(id: NoteIdType): Promise<boolean> {
    if (!ObjectId.isValid(id)) {
      return false;
    }
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }

  // Helper method for testing: clear all notes
  async clear(): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteMany({});
  }

  // Helper method for testing: get collection stats
  async getStats(): Promise<{ count: number; indexes: string[] }> {
    const collection = await this.getCollection();
    const count = await collection.countDocuments();
    const indexes = await collection.listIndexes().toArray();
    return {
      count,
      indexes: indexes.map((idx) => idx.name),
    };
  }
}
