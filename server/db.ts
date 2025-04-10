// For ESM compatibility with pg
import pkg from "pg";
const { Pool } = pkg;

// Create a PostgreSQL connection pool
let pool;

try {
  // const connectionString = process.env.DATABASE_URL;
  const connectionString =
    "postgres://avnadmin:AVNS_LqNC6s3gVUGK0UBx0i0@pg-3fa43b5f-spousey.k.aivencloud.com:14048/defaultdb?sslmode=require";
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  pool = new Pool({
    connectionString,
    // Connection timeout after 5 seconds
    connectionTimeoutMillis: 5000,
    // Maximum number of clients the pool should contain
    max: 20,
    // Idle timeout after 30 seconds
    idleTimeoutMillis: 30000,
  });

  // Test the database connection
  pool.on("error", (err) => {
    console.error("Unexpected error on idle client", err);
  });

  console.log("Database connection initialized successfully");
} catch (error) {
  console.error("Error initializing database connection:", error);
  pool = null;
}

// Export the pool for session store usage
export { pool };
