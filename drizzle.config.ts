import { defineConfig } from "drizzle-kit";

// if (!process.env.DATABASE_URL) {
//   throw new Error("DATABASE_URL, ensure the database is provisioned");
// }

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    // url: process.env.DATABASE_URL,
    url: "postgres://avnadmin:AVNS_LqNC6s3gVUGK0UBx0i0@pg-3fa43b5f-spousey.k.aivencloud.com:14048/defaultdb?sslmode=require",
  },
});
