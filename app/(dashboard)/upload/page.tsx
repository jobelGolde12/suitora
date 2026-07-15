"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Upload,
  Camera,
  Shirt,
  X,
  Check,
  ArrowRight,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
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

    // Simulate upload and redirect to analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsUploading(false);
    router.push(`/analysis?id=mock_${Date.now()}`);
  };

  const canProceed = !!userPhoto.preview && !!clothingPhoto.preview && !userPhoto.error && !clothingPhoto.error;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold tracking-tight">New Analysis</h1>
          <p className="text-sm text-muted mt-1">
            Upload your photo and a clothing item to get started.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* User Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Your Photo
            </h2>
            {userPhoto.preview ? (
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden group">
                <img
                  src={userPhoto.preview}
                  alt="Your photo"
                  className="w-full aspect-[3/4] object-cover"
                />
                <button
                  onClick={() => removeImage("user")}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
                {!userPhoto.error && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-success/90 text-white px-3 py-1 text-xs font-medium">
                    <Check className="h-3 w-3" />
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
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 aspect-[3/4]",
                  dragOver === "user"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-surface/50"
                )}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Upload your photo
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Drag & drop or click to browse
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
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

          {/* Clothing Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shirt className="h-4 w-4 text-accent" />
              Clothing Item
            </h2>
            {clothingPhoto.preview ? (
              <div className="relative rounded-2xl border border-border bg-card overflow-hidden group">
                <img
                  src={clothingPhoto.preview}
                  alt="Clothing item"
                  className="w-full aspect-[3/4] object-cover"
                />
                <button
                  onClick={() => removeImage("clothing")}
                  className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </button>
                {!clothingPhoto.error && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-success/90 text-white px-3 py-1 text-xs font-medium">
                    <Check className="h-3 w-3" />
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
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-all duration-200 aspect-[3/4]",
                  dragOver === "clothing"
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-accent/50 hover:bg-surface/50"
                )}
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                    <Shirt className="h-8 w-8 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Upload clothing item
                    </p>
                    <p className="text-xs text-muted mt-1">
                      Drag & drop or click to browse
                    </p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
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

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <Button
            size="lg"
            disabled={!canProceed}
            loading={isUploading}
            onClick={handleAnalyze}
            className="min-w-[200px]"
          >
            Analyze Compatibility
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
