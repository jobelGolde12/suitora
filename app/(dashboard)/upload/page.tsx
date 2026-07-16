"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Camera,
  Shirt,
  X,
  Check,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageContainer, PageHeader, fadeInUp } from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/utils/validation";

interface ImageUpload {
  file: File | null;
  preview: string;
  error?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [userPhoto, setUserPhoto] = useState<ImageUpload>({ file: null, preview: "" });
  const [clothingPhoto, setClothingPhoto] = useState<ImageUpload>({ file: null, preview: "" });
  const [dragOver, setDragOver] = useState<"user" | "clothing" | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const userInputRef = useRef<HTMLInputElement>(null);
  const clothingInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | undefined => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Please upload a JPG, PNG, or WEBP image.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB.";
    }
    return undefined;
  }, []);

  const handleFileSelect = useCallback(
    (type: "user" | "clothing", file: File) => {
      const error = validateFile(file);
      const preview = URL.createObjectURL(file);
      const setter = type === "user" ? setUserPhoto : setClothingPhoto;
      setter({ file, preview, error });
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (type: "user" | "clothing", e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(type, file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = useCallback((type: "user" | "clothing") => {
    const setter = type === "user" ? setUserPhoto : setClothingPhoto;
    setter({ file: null, preview: "" });
  }, []);

  const handleAnalyze = async () => {
    if (!userPhoto.file || !clothingPhoto.file) return;
    setIsUploading(true);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
    router.push(`/analysis?id=mock_${Date.now()}`);
  };

  const canProceed =
    !!userPhoto.preview &&
    !!clothingPhoto.preview &&
    !userPhoto.error &&
    !clothingPhoto.error;

  return (
    <PageContainer narrow>
      <PageHeader
        label="Create"
        title="New Analysis"
        description="Upload your photo and a clothing item to see how well they work together."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
        {/* User Photo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={1}
        >
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
              <Camera className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
            </span>
            Your Photo
          </h2>
          {userPhoto.preview ? (
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden group shadow-card">
              <img
                src={userPhoto.preview}
                alt="Your photo"
                className="w-full aspect-[3/4] object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage("user")}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              {!userPhoto.error && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-card/95 border border-border text-foreground px-3 py-1 text-xs font-medium">
                  <Check className="h-3 w-3 text-success" strokeWidth={1.5} />
                  Uploaded
                </div>
              )}
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop("user", e)}
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOver("user")}
              onDragLeave={() => setDragOver(null)}
              onClick={() => userInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  userInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 cursor-pointer transition-all duration-200 aspect-[3/4] bg-card shadow-card",
                dragOver === "user"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40 hover:bg-surface/40"
              )}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
                  <Camera className="h-6 w-6 text-muted" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload your photo</p>
                  <p className="text-xs text-muted mt-1.5 font-light">
                    Drag & drop or click to browse
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground font-light">
                  JPG, PNG, WEBP up to 5MB
                </p>
              </div>
              <input
                ref={userInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect("user", file);
                }}
              />
            </div>
          )}
          {userPhoto.error && (
            <p className="mt-2 text-xs text-error flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {userPhoto.error}
            </p>
          )}
        </motion.div>

        {/* Clothing Photo */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
        >
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
              <Shirt className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
            </span>
            Clothing Item
          </h2>
          {clothingPhoto.preview ? (
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden group shadow-card">
              <img
                src={clothingPhoto.preview}
                alt="Clothing item"
                className="w-full aspect-[3/4] object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage("clothing")}
                className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Remove clothing photo"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
              {!clothingPhoto.error && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-card/95 border border-border text-foreground px-3 py-1 text-xs font-medium">
                  <Check className="h-3 w-3 text-success" strokeWidth={1.5} />
                  Uploaded
                </div>
              )}
            </div>
          ) : (
            <div
              onDrop={(e) => handleDrop("clothing", e)}
              onDragOver={handleDragOver}
              onDragEnter={() => setDragOver("clothing")}
              onDragLeave={() => setDragOver(null)}
              onClick={() => clothingInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  clothingInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 cursor-pointer transition-all duration-200 aspect-[3/4] bg-card shadow-card",
                dragOver === "clothing"
                  ? "border-accent bg-accent/5"
                  : "border-border hover:border-accent/40 hover:bg-surface/40"
              )}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface">
                  <Shirt className="h-6 w-6 text-muted" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload clothing item</p>
                  <p className="text-xs text-muted mt-1.5 font-light">
                    Drag & drop or click to browse
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground font-light">
                  JPG, PNG, WEBP up to 5MB
                </p>
              </div>
              <input
                ref={clothingInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect("clothing", file);
                }}
              />
            </div>
          )}
          {clothingPhoto.error && (
            <p className="mt-2 text-xs text-error flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {clothingPhoto.error}
            </p>
          )}
        </motion.div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        custom={3}
        className="flex justify-center"
      >
        <Button
          size="lg"
          variant="editorial"
          disabled={!canProceed}
          loading={isUploading}
          onClick={handleAnalyze}
          className="min-w-[220px] rounded-full px-8"
        >
          Analyze Compatibility
          <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
        </Button>
      </motion.div>
    </PageContainer>
  );
}
