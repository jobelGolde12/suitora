import { z } from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, "File size must be less than 5MB")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .png, and .webp files are accepted"
  );

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be less than 128 characters"),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
    agreeToTerms: z.literal(true, {
      message: "You must agree to the Terms and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters"),
    confirmPassword: z.string(),
    token: z.string().min(1, "The reset link is invalid or has expired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const uploadSchema = z.object({
  userImage: imageFileSchema,
  clothingImage: imageFileSchema,
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UploadFormData = z.infer<typeof uploadSchema>;

const genderEnum = z.enum(["male", "female", "non-binary", "prefer-not-to-say"]);
const fitPreferenceEnum = z.enum(["tight", "regular", "relaxed", "oversized"]);
const sizeSystemEnum = z.enum(["US", "EU", "UK"]);
const styleTagEnum = z.enum([
  "casual", "minimalist", "streetwear", "vintage", "formal",
  "korean", "business-casual", "bohemian", "athleisure", "preppy",
  "edgy", "romantic", "classic", "avant-garde",
]);

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
  gender: genderEnum.optional(),
  height: z.number().min(50).max(300).optional(),
  weight: z.number().min(20).max(500).optional(),
  chestCircumference: z.number().min(30).max(200).optional(),
  waistCircumference: z.number().min(30).max(200).optional(),
  hipCircumference: z.number().min(30).max(200).optional(),
  shoulderWidth: z.number().min(20).max(100).optional(),
  inseamLength: z.number().min(30).max(120).optional(),
  armLength: z.number().min(30).max(100).optional(),
  neckCircumference: z.number().min(20).max(60).optional(),
  footLength: z.number().min(15).max(40).optional(),
  footWidth: z.number().min(5).max(20).optional(),
  shoeSize: z.string().max(10).optional(),
  bustCupSize: z.string().max(5).optional(),
  styleTags: z.array(styleTagEnum).max(10).optional(),
  preferredBrands: z.array(z.string().max(50)).max(20).optional(),
  preferredColors: z.array(z.string().max(30)).max(20).optional(),
  avoidColors: z.array(z.string().max(30)).max(20).optional(),
  priceRangeMin: z.number().min(0).max(100000).optional(),
  priceRangeMax: z.number().min(0).max(100000).optional(),
  fitPreference: fitPreferenceEnum.optional(),
  sizePreference: sizeSystemEnum.optional(),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
