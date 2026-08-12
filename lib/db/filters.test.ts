import { describe, it, expect } from "vitest";
import { and, eq } from "drizzle-orm";
import { dbRead, schema } from "@/drizzle";
import { notDeleted } from "@/lib/db/filters";

describe("notDeleted", () => {
  it("appends a deleted_at IS NULL filter", () => {
    const { sql } = dbRead
      .select()
      .from(schema.analyses)
      .where(notDeleted(schema.analyses))
      .toSQL();
    expect(sql).toContain('"analyses"."deleted_at" IS NULL');
  });

  it("composes with other conditions via and()", () => {
    const { sql } = dbRead
      .select()
      .from(schema.favorites)
      .where(
        and(notDeleted(schema.favorites), eq(schema.favorites.userId, "u1"))
      )
      .toSQL();
    expect(sql).toContain('"favorites"."deleted_at" IS NULL');
    expect(sql).toContain('"favorites"."user_id"');
  });

  it("renders IS NULL for every soft-deletable table", () => {
    const tables = [
      schema.analyses,
      schema.favorites,
      schema.userProfiles,
      schema.stylistMessages,
      schema.wardrobeFolders,
      schema.favoriteOutfits,
    ];
    tables.forEach((table) => {
      const { sql } = dbRead.select().from(table).where(notDeleted(table)).toSQL();
      expect(sql).toMatch(/IS NULL/);
    });
  });
});
