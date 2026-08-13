import { z } from "zod";

/**
 * Consolidated Zod schemas for API request bodies and query strings.
 * Route handlers validate with these before touching the DB or external
 * services. Form schemas live in `lib/utils/validation.ts`.
 */

// Re-export the full profile form schema so API routes share one source of truth.
export { updateProfileSchema as updateProfileBodySchema } from "@/lib/utils/validation";
import { MAX_IMAGE_URL_LENGTH } from "@/lib/utils/validation";

// JSON bodies carrying image URLs (multi-MB data URLs in dev) need a matching
// size cap; two image URLs plus JSON overhead is the worst case.
export const MAX_IMAGE_BODY_SIZE = 2 * MAX_IMAGE_URL_LENGTH + 1024 * 1024;

export const analysisCategoryEnum = z.enum([
  "top", "bottom", "dress", "outerwear", "shoes", "accessory",
]);

// POST /api/analysis
export const createAnalysisSchema = z.object({
  productUrl: z
    .string()
    .url("A valid product URL is required")
    .max(2048)
    .optional(),
  productImageUpload: z.string().max(MAX_IMAGE_URL_LENGTH).optional(),
  userImageUrl: z.string().max(MAX_IMAGE_URL_LENGTH).optional(),
  category: analysisCategoryEnum.optional(),
});

// GET /api/analysis query params
export const analysisQuerySchema = z.object({
  id: z.string().max(128).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Shared pagination query
export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// /api/favorites
export const favoriteCreateSchema = z.object({
  analysisId: z.string().min(1).max(128),
});

export const favoriteUpdateSchema = z.object({
  analysisId: z.string().min(1).max(128),
  inWardrobe: z.boolean().optional(),
  wardrobeTags: z.array(z.string().max(30)).max(5).optional(),
  wardrobeFolder: z.string().max(128).nullable().optional(),
});

export const favoriteDeleteSchema = z.object({
  analysisId: z.string().min(1).max(128).optional(),
});

// /api/stylist
export const stylistMessageSchema = z.object({
  message: z.string().min(1).max(2000, "Message must be under 2000 characters"),
});

// POST /api/user/self-image
export const selfImageBodySchema = z.object({
  selfImageUrl: z
    .string()
    .min(1, "selfImageUrl is required")
    .max(MAX_IMAGE_URL_LENGTH, "selfImageUrl is too long"),
});

// /api/wardrobe/folders
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(48).trim(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(48).trim(),
});

// GET /api/wardrobe/outfits query
export const outfitsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(12).optional(),
  regenerate: z
    .enum(["0", "1", "true", "false"])
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

// POST /api/wardrobe/outfits — regenerate suggestions
export const regenerateOutfitsSchema = z.object({
  limit: z.number().int().min(1).max(12).optional(),
  regenerate: z.boolean().optional(),
});

// POST /api/wardrobe/outfits/favorite
const outfitItemRoleEnum = z.enum([
  "top", "bottom", "outer", "footwear", "accessory", "headwear", "dress",
]);

export const favoriteOutfitSchema = z.object({
  outfit: z.object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(200),
    items: z
      .array(
        z.object({
          analysisId: z.string().max(128).optional(),
          trendItemId: z.string().max(128).optional(),
          category: z.string().min(1).max(64),
          itemName: z.string().min(1).max(200),
          itemImageUrl: z.string().max(MAX_IMAGE_URL_LENGTH),
          individualScore: z.number(),
          role: outfitItemRoleEnum,
        })
      )
      .min(1)
      .max(20),
    overallScore: z.number(),
    coherenceScore: z.number().optional(),
    colorStoryScore: z.number().optional(),
    proportionScore: z.number().optional(),
    formalityConsistency: z.number().optional(),
    seasonTags: z.array(z.string().max(32)).max(20).optional(),
    occasionTags: z.array(z.string().max(32)).max(20).optional(),
    stylingTips: z.array(z.string().max(500)).max(20).optional(),
    generatedImageUrl: z.string().max(MAX_IMAGE_URL_LENGTH).optional(),
    createdAt: z.string().max(64).optional(),
  }),
});

// DELETE /api/wardrobe/outfits/favorite body fallback
export const favoriteOutfitDeleteSchema = z.object({
  id: z.string().min(1).max(128),
});

// GET /api/trending/similar query
export const similarItemsQuerySchema = z.object({
  analysisId: z.string().min(1, "Missing analysisId").max(128),
  limit: z.coerce.number().int().min(1).max(12).optional(),
});

// GET /api/trending query
export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(48).optional(),
  category: z.string().max(64).optional(),
  season: z.string().max(32).optional(),
  gender: z.string().max(32).optional(),
  occasion: z.string().max(64).optional(),
  brand: z.string().max(128).optional(),
  featured: z.enum(["true", "false"]).optional(),
});
