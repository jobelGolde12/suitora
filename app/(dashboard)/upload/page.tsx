"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Shirt,
  X,
  Check,
  ArrowRight,
  AlertCircle,
  Link as LinkIcon,
  Upload as UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageContainer, PageHeader, fadeInUp } from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";
import { MAX_FILE_SIZE, ACCEPTED_IMAGE_TYPES } from "@/lib/utils/validation";
import { uploadImage } from "@/lib/ai/upload";
import { SelfImageModal } from "@/components/upload/SelfImageModal";
import { useToast } from "@/components/ui/Toast";

interface ImageUpload {
  file: File | null;
  preview: string;
  error?: string;
}

type ProductInputMode = "upload" | "link";

export default function UploadPage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  // Self-image state
  const [selfImageUrl, setSelfImageUrl] = useState<string | null>(null);
  const [isLoadingSelfImage, setIsLoadingSelfImage] = useState(true);
  const [showSelfImageModal, setShowSelfImageModal] = useState(false);

  // Clothing / Product state
  const [productInputMode, setProductInputMode] = useState<ProductInputMode>("upload");
  const [clothingPhoto, setClothingPhoto] = useState<ImageUpload>({ file: null, preview: "" });
  const [productUrl, setProductUrl] = useState("");
  const [productUrlError, setProductUrlError] = useState("");
  
  const [dragOver, setDragOver] = useState<"clothing" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const clothingInputRef = useRef<HTMLInputElement>(null);

  // Fetch self-image on load
  useEffect(() => {
    async function checkSelfImage() {
      try {
        const res = await fetch("/api/user/self-image", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.selfImageUrl) {
            setSelfImageUrl(data.selfImageUrl);
          } else {
            setShowSelfImageModal(true);
          }
        } else {
          setShowSelfImageModal(true);
        }
      } catch (err) {
        console.error("Failed to load self-image:", err);
        setShowSelfImageModal(true);
      } finally {
        setIsLoadingSelfImage(false);
      }
    }
    checkSelfImage();
  }, []);

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
    (file: File) => {
      const error = validateFile(file);
      const preview = URL.createObjectURL(file);
      setClothingPhoto({ file, preview, error });
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(null);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const removeImage = useCallback(() => {
    setClothingPhoto({ file: null, preview: "" });
  }, []);

  const handleAnalyze = async () => {
    if (!selfImageUrl) {
      setShowSelfImageModal(true);
      return;
    }

    setIsAnalyzing(true);

    try {
      let payload: Record<string, any> = {
        userImageUrl: selfImageUrl,
      };

      if (productInputMode === "upload") {
        if (!clothingPhoto.file) return;
        // Upload the clothing image file first
        const uploadRes = await uploadImage(clothingPhoto.file);
        payload.productImageUpload = uploadRes.url;
      } else {
        if (!productUrl) {
          setProductUrlError("Please enter a product URL");
          setIsAnalyzing(false);
          return;
        }
        if (!productUrl.startsWith("http://") && !productUrl.startsWith("https://")) {
          setProductUrlError("URL must start with http:// or https://");
          setIsAnalyzing(false);
          return;
        }
        payload.productUrl = productUrl;
      }

      // Call API to create analysis
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addToast("Analysis started!", "success");
        router.push(`/analysis?id=${data.analysisId}`);
      } else {
        throw new Error(data.error || "Failed to start analysis");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "An error occurred starting the analysis.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canProceed =
    !!selfImageUrl &&
    (productInputMode === "upload"
      ? !!clothingPhoto.preview && !clothingPhoto.error
      : !!productUrl && !productUrlError);

  if (isLoadingSelfImage) {
    return (
      <PageContainer narrow>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted font-light">Loading profile details...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer narrow>
      {/* Forced Self Image Upload Modal */}
      <AnimatePresence>
        {showSelfImageModal && (
          <SelfImageModal
            onSuccess={(url) => {
              setSelfImageUrl(url);
              setShowSelfImageModal(false);
            }}
          />
        )}
      </AnimatePresence>

      <PageHeader
        label="Create"
        title="New Analysis"
        description="Select a clothing item and see how well it fits your body profile."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
        {/* User Photo Display */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={1}
        >
          <h2 className="text-sm font-medium mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
                <Camera className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
              </span>
              Your Body Photo
            </span>
            {selfImageUrl && (
              <button
                type="button"
                onClick={() => setShowSelfImageModal(true)}
                className="text-xs text-accent hover:text-accent-light transition-colors font-light"
              >
                Change Photo
              </button>
            )}
          </h2>
          {selfImageUrl ? (
            <div className="relative rounded-2xl border border-border bg-card overflow-hidden group shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selfImageUrl}
                alt="Your body photo"
                className="w-full aspect-[3/4] object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-card/95 border border-border text-foreground px-3 py-1 text-xs font-medium">
                <Check className="h-3 w-3 text-success" strokeWidth={1.5} />
                Profile Active
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-error/40 p-8 aspect-[3/4] bg-card shadow-card">
              <AlertCircle className="h-10 w-10 text-error mb-4" strokeWidth={1.5} />
              <p className="text-sm font-medium">Self-image required</p>
              <Button
                variant="editorial"
                size="sm"
                className="mt-4 rounded-full"
                onClick={() => setShowSelfImageModal(true)}
              >
                Upload Profile Photo
              </Button>
            </div>
          )}
        </motion.div>

        {/* Clothing Item Input (Upload or Link) */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          custom={2}
        >
          <h2 className="text-sm font-medium mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface">
                <Shirt className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
              </span>
              Clothing Item
            </span>
          </h2>

          {/* Selector Tabs */}
          <div className="flex border border-border rounded-xl p-1 bg-surface/50 mb-4">
            <button
              type="button"
              onClick={() => setProductInputMode("upload")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all",
                productInputMode === "upload"
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted hover:text-foreground"
              )}
            >
              <UploadIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setProductInputMode("link")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all",
                productInputMode === "link"
                  ? "bg-card text-foreground shadow-sm border border-border/40"
                  : "text-muted hover:text-foreground"
              )}
            >
              <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              Paste URL/Link
            </button>
          </div>

          <div className="aspect-[3/4] flex flex-col">
            {productInputMode === "upload" ? (
              clothingPhoto.preview ? (
                <div className="relative flex-1 rounded-2xl border border-border bg-card overflow-hidden group shadow-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={clothingPhoto.preview}
                    alt="Clothing item"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-3 right-3 h-9 w-9 rounded-full bg-card/90 border border-border text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Remove clothing photo"
                  >
                    <X className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  {!clothingPhoto.error && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-card/95 border border-border text-foreground px-3 py-1 text-xs font-medium">
                      <Check className="h-3 w-3 text-success" strokeWidth={1.5} />
                      Ready to Analyze
                    </div>
                  )}
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
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
                    "flex-1 relative flex flex-col items-center justify-center rounded-2xl border border-dashed p-8 cursor-pointer transition-all duration-200 bg-card shadow-card",
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
                      if (file) handleFileSelect(file);
                    }}
                  />
                </div>
              )
            ) : (
              <div className="flex-1 rounded-2xl border border-border bg-card p-6 flex flex-col justify-center gap-4 shadow-card">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface mx-auto mb-2">
                  <LinkIcon className="h-6 w-6 text-muted" strokeWidth={1.5} />
                </div>
                <div className="space-y-1 text-center">
                  <p className="text-sm font-medium">Paste E-Commerce Link</p>
                  <p className="text-xs text-muted font-light">
                    Paste a product URL from Zara, H&M, or other stores.
                  </p>
                </div>
                <Input
                  placeholder="https://example.com/product/..."
                  value={productUrl}
                  onChange={(e) => {
                    setProductUrl(e.target.value);
                    setProductUrlError("");
                  }}
                  error={productUrlError}
                  className="rounded-full mt-2"
                />
              </div>
            )}
          </div>
          {clothingPhoto.error && productInputMode === "upload" && (
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
          disabled={!canProceed || isAnalyzing}
          loading={isAnalyzing}
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
