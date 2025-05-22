import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

// Define the schema to validate the environment variables
const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(3000),
});

// Create an object to allow (potentially) mapping environment variables with different names
const mappedEnv = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
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
