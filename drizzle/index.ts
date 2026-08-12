// The DB client + pooled handles now live in `@/lib/db` (Pillar 03, Action
// Items 2 & 4). This module re-exports them under the historical `@/drizzle`
// path so existing imports keep working and all access flows through one pool.
export { db, dbRead, dbWrite, schema } from "@/lib/db";
