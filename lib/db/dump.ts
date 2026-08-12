/**
 * Logical SQL dump/restore for the libSQL database (Pillar 03, Action Item 6).
 *
 * Produces a portable, human-readable SQL file from any libSQL connection
 * (remote Turso or local file) by reading `sqlite_schema` and streaming every
 * row as INSERTs. Restore replays that file. Schema objects are recreated with
 * their original CREATE statements, so the dump is fully self-contained.
 */

import type { Client } from "@libsql/client";

type SchemaObject = {
  type: "table" | "index" | "view" | "trigger";
  name: string;
  sql: string;
};

const CHUNK_SIZE = 500;

function quoteIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteLiteral(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "string") {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) {
    return `X'${Buffer.from(value).toString("hex")}'`;
  }
  if (typeof value === "boolean") return value ? "1" : "0";
  throw new Error(`Unsupported dump value type: ${typeof value}`);
}

export async function readSchemaObjects(client: Client): Promise<SchemaObject[]> {
  const rs = await client.execute(
    "SELECT type, name, sql FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' ORDER BY rowid"
  );
  return rs.rows
    .filter((r) => typeof r.sql === "string" && r.sql.length > 0)
    .map((r) => ({
      type: r.type as SchemaObject["type"],
      name: r.name as string,
      sql: r.sql as string,
    }));
}

export async function readTableColumns(
  client: Client,
  table: string
): Promise<string[]> {
  const rs = await client.execute(`PRAGMA table_info(${quoteIdentifier(table)})`);
  return rs.rows.map((r) => r.name as string);
}

/** Generate a full self-contained SQL dump for the connected database. */
export async function dumpDatabaseSql(client: Client): Promise<string> {
  const objects = await readSchemaObjects(client);
  const tables = objects.filter((o) => o.type === "table");
  const indexes = objects.filter((o) => o.type === "index");
  const views = objects.filter((o) => o.type === "view");
  const triggers = objects.filter((o) => o.type === "trigger");

  const lines: string[] = [
    "-- Suitora database dump (logical)",
    "-- Generated: " + new Date().toISOString(),
    "PRAGMA foreign_keys=OFF;",
    "BEGIN;",
  ];

  for (const table of tables) {
    lines.push(table.sql + ";");
    const columns = await readTableColumns(client, table.name);
    const colList = columns.map(quoteIdentifier).join(", ");

    const rs = await client.execute(
      `SELECT ${colList} FROM ${quoteIdentifier(table.name)}`
    );
    let chunk: unknown[][] = [];
    for (const row of rs.rows) {
      chunk.push(columns.map((c) => row[c]));
      if (chunk.length >= CHUNK_SIZE) {
        lines.push(emitInsert(table.name, colList, chunk));
        chunk = [];
      }
    }
    if (chunk.length > 0) {
      lines.push(emitInsert(table.name, colList, chunk));
    }
  }

  for (const view of views) lines.push(view.sql + ";");
  for (const trigger of triggers) lines.push(trigger.sql + ";");
  for (const index of indexes) lines.push(index.sql + ";");

  lines.push("COMMIT;");
  lines.push("PRAGMA foreign_keys=ON;");
  return lines.join("\n") + "\n";
}

function emitInsert(table: string, colList: string, rows: unknown[][]): string {
  const values = rows
    .map((r) => `(${r.map(quoteLiteral).join(", ")})`)
    .join(",\n");
  return `INSERT INTO ${quoteIdentifier(table)} (${colList}) VALUES\n${values};`;
}

/** Names of every table present in the target database (for pre-restore wipe). */
export async function listTables(client: Client): Promise<string[]> {
  const rs = await client.execute(
    "SELECT name FROM sqlite_schema WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid"
  );
  return rs.rows.map((r) => r.name as string);
}
