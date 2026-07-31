import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, unique, index } from "drizzle-orm/sqlite-core";

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
}, (t) => [
  index("analyses_user_id_idx").on(t.userId),
  index("analyses_created_at_idx").on(t.createdAt),
]);

export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  analysisId: text("analysis_id")
    .notNull()
    .references(() => analyses.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, { onDelete: "set null" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}, (t) => [
  unique("favorites_user_analysis_idx").on(t.userId, t.analysisId),
  index("favorites_user_id_idx").on(t.userId),
]);

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
}, (t) => [
  index("uploads_user_id_idx").on(t.userId),
]);

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

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  // Basic info
  phone: text("phone"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),

  // Manual body measurements
  height: real("height"),
  weight: real("weight"),
  chestCircumference: real("chest_circumference"),
  waistCircumference: real("waist_circumference"),
  hipCircumference: real("hip_circumference"),
  shoulderWidth: real("shoulder_width"),
  inseamLength: real("inseam_length"),
  armLength: real("arm_length"),
  neckCircumference: real("neck_circumference"),
  footLength: real("foot_length"),
  footWidth: real("foot_width"),
  shoeSize: text("shoe_size"),
  bustCupSize: text("bust_cup_size"),

  // AI-estimated fields
  estimatedHeight: real("estimated_height"),
  estimatedHeightConfidence: real("estimated_height_confidence"),
  estimatedWeight: real("estimated_weight"),
  estimatedWeightConfidence: real("estimated_weight_confidence"),
  bodyShape: text("body_shape"),
  bodyShapeConfidence: real("body_shape_confidence"),
  skinTone: text("skin_tone"),
  faceShape: text("face_shape"),
  bmiCategory: text("bmi_category"),

  // Self image
  selfImageUrl: text("self_image_url"),
  selfImageThumbnailUrl: text("self_image_thumbnail_url"),
  selfImageUploadedAt: text("self_image_uploaded_at"),

  // Style preferences
  styleTags: text("style_tags").default("[]"),
  preferredBrands: text("preferred_brands").default("[]"),
  preferredColors: text("preferred_colors").default("[]"),
  avoidColors: text("avoid_colors").default("[]"),
  priceRangeMin: integer("price_range_min"),
  priceRangeMax: integer("price_range_max"),
  fitPreference: text("fit_preference").default("regular"),
  sizePreference: text("size_preference").default("US"),

  // Timestamps
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const meta = sqliteTable("meta", {
  key: text("key").primaryKey(),
  value: text("value"),
});

/** Normalized online trending fashion items (provider-agnostic). */
export const trendItems = sqliteTable(
  "trend_items",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerId: text("provider_id").notNull(),
    title: text("title").notNull(),
    brand: text("brand"),
    description: text("description"),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    gender: text("gender"),
    imageUrl: text("image_url").notNull(),
    productUrl: text("product_url"),
    price: real("price"),
    currency: text("currency"),
    season: text("season"),
    occasion: text("occasion"),
    styleTags: text("style_tags").notNull().default("[]"),
    colors: text("colors").notNull().default("[]"),
    popularityScore: real("popularity_score").notNull().default(0),
    isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
    isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
    lastSynced: text("last_synced"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [unique("trend_items_provider_id_idx").on(t.provider, t.providerId)]
);

export const trendSyncLogs = sqliteTable("trend_sync_logs", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  status: text("status").notNull(), // success | partial | failed
  itemsFetched: integer("items_fetched").notNull().default(0),
  itemsUpserted: integer("items_upserted").notNull().default(0),
  message: text("message"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

