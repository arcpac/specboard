import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getEnv } from "@/lib/db/env";
import * as schema from "./schema";

declare global {
  var __specboardPool: Pool | undefined;
}

const env = getEnv();

const pool =
  globalThis.__specboardPool ??
  new Pool({
    connectionString: env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__specboardPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema, pool };
