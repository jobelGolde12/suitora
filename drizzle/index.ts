import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const tursoDbUrl = process.env.TURSO_DATABASE_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

// Configure Turso client
const client = createClient({
  url: tursoDbUrl || "file:./data/suitora.db",
  authToken: tursoAuthToken,
});

export const db = drizzle(client, { schema });

export { schema };
