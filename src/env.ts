import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Define the schema to validate the environment variables
const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
  // External authentication service
  AUTH_SERVICE_URL: z.string().url().optional(),
  // MongoDB URI Configuration
  MONGODB_HOST: z.string().default("localhost"),
  MONGODB_PORT: z.coerce.number().default(27017),
  MONGODB_USER: z.string().optional(),
  MONGODB_PASSWORD: z.string().optional(),
  MONGODB_DATABASE: z.string().default("backend-template"),
});

// Create an object to allow (potentially) mapping environment variables with different names
const mappedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL,
  MONGODB_HOST: process.env.COURSES_API_MONGODB_HOST,
  MONGODB_PORT: process.env.COURSES_API_MONGODB_PORT,
  MONGODB_USER: process.env.COURSES_API_MONGODB_USER,
  MONGODB_PASSWORD: process.env.COURSES_API_MONGODB_PASSWORD,
  MONGODB_DATABASE: process.env.COURSES_API_MONGODB_DATABASE,
};

const _env = envSchema.safeParse(mappedEnv);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables after mapping:",
    _env.error.format()
  );
  // Log the mappedEnv for easier debugging of what Zod received
  console.error("Mapped environment data passed to Zod:", mappedEnv);
  process.exit(1);
}

export const env = _env.data;
