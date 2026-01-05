import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment variable prefix for this service.
 * This prevents conflicts when running multiple services in the same environment.
 * Change this prefix when creating a new service from this template.
 */
const PREFIX = "BT";

/**
 * Helper function to get prefixed environment variable.
 * Falls back to unprefixed variable for backwards compatibility during migration.
 */
const getEnv = (name: string): string | undefined => {
  return process.env[`${PREFIX}_${name}`] ?? process.env[name];
};

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

// Map prefixed environment variables to internal names
// The rest of the application uses these internal names (e.g., env.PORT, env.MONGODB_HOST)
const mappedEnv = {
  NODE_ENV: getEnv("NODE_ENV"),
  PORT: getEnv("PORT"),
  AUTH_SERVICE_URL: getEnv("AUTH_SERVICE_URL"),
  MONGODB_HOST: getEnv("MONGODB_HOST"),
  MONGODB_PORT: getEnv("MONGODB_PORT"),
  MONGODB_USER: getEnv("MONGODB_USER"),
  MONGODB_PASSWORD: getEnv("MONGODB_PASSWORD"),
  MONGODB_DATABASE: getEnv("MONGODB_DATABASE"),
};

const _env = envSchema.safeParse(mappedEnv);

if (!_env.success) {
  console.error(
    "❌ Invalid environment variables after mapping:",
    _env.error.format(),
  );
  // Log the mappedEnv for easier debugging of what Zod received
  console.error("Mapped environment data passed to Zod:", mappedEnv);
  process.exit(1);
}

export const env = _env.data;
