import { sql, type SQL } from "drizzle-orm";

/**
 * Global soft-delete filter (Pillar 03, Action Item 5). Compose into any
 * query over a soft-deletable table:
 *
 *   db.select().from(analyses).where(and(notDeleted(analyses), eq(analyses.id, id)))
 */
export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return sql`${table.deletedAt} IS NULL`;
}
