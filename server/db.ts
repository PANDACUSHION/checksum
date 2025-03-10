import dotenv from "dotenv";
dotenv.config(); // Load .env variables

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Debug: Check if DATABASE_URL is loaded
console.log("DATABASE_URL:", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client);
