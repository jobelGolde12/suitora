import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
  image: text("image"),
  selfImageUrl: text("self_image_url"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: integer("expires_at").notNull(),
  token: text("token"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at"),
  refreshTokenExpiresAt: integer("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  userImage: text("user_image").notNull(),
  productImage: text("product_image").notNull(),
  generatedImage: text("generated_image"),
  overallScore: real("overall_score").notNull().default(0),
  bodyScore: real("body_score"),
  styleScore: real("style_score"),
  colorScore: real("color_score"),
  bodyShape: text("body_shape"),
  skinTone: text("skin_tone"),
  faceShape: text("face_shape"),
  styleType: text("style_type"),
  recommendations: text("recommendations"),
  colorAnalysis: text("color_analysis"),
  status: text("status").notNull().default("completed"),
  height: real("height"),
  heightConfidence: real("height_confidence"),
  weight: real("weight"),
  weightConfidence: real("weight_confidence"),
  compatibilityMetadata: text("compatibility_metadata"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  analysisId: text("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url").unique(),
  title: text("title"),
  brand: text("brand"),
  priceCents: integer("price_cents"),
  currency: text("currency"),
  imageUrl: text("image_url"),
  metadata: text("metadata"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const uploads = sqliteTable("uploads", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind"),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferences: text("preferences"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  action: text("action").notNull(),
  details: text("details"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value"),
});
