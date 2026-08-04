"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  Camera,
  Shirt,
  X,
  Check,
  ArrowRight,
  AlertCircle,
  Link as LinkIcon,
  Upload as UploadIcon,
  Loader2,
  Info,
  Download,
  RefreshCw,
} from "lucide-react";
import { UploadSkeleton } from "@/components/dashboard";
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

interface AnalysisRequest {
  userImageUrl: string;
  productImageUpload?: string;
  productUrl?: string;
}

/** Human-readable byte size for the preview meta row. */
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const { addToast } = useToast();
  
  // Self-image state
  const [selfImageUrl, setSelfImageUrl] = useState<string | null>(null);
  const [isLoadingSelfImage, setIsLoadingSelfImage] = useState(true);
  const [showSelfImageModal, setShowSelfImageModal] = useState(false);
  const [pendingSelf, setPendingSelf] = useState<ImageUpload>({ file: null, preview: "" });
  const [selfUploading, setSelfUploading] = useState(false);
  const [selfError, setSelfError] = useState("");
  const [selfDragOver, setSelfDragOver] = useState(false);

  // Clothing / Product state
  const [productInputMode, setProductInputMode] = useState<ProductInputMode>("upload");
  const [clothingPhoto, setClothingPhoto] = useState<ImageUpload>({ file: null, preview: "" });
  const [productUrl, setProductUrl] = useState("");
  const [productUrlError, setProductUrlError] = useState("");
  
  const [dragOver, setDragOver] = useState<"clothing" | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const clothingInputRef = useRef<HTMLInputElement>(null);
  const selfInputRef = useRef<HTMLInputElement>(null);

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
          }
        }
      } catch (err) {
        console.error("Failed to load self-image:", err);
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

  const uploadSelfPhoto = useCallback(
    async (file: File) => {
      setSelfUploading(true);
      setSelfError("");
      try {
        const res = await uploadImage(file);
        const saveRes = await fetch("/api/user/self-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ selfImageUrl: res.url }),
        });
        const data = await saveRes.json();
        if (saveRes.ok && data.success) {
          setSelfImageUrl(res.url);
          setPendingSelf({ file: null, preview: "" });
          addToast("Self photo uploaded successfully!", "success");
        } else {
          throw new Error(data.error || "Failed to save self photo");
        }
      } catch (err) {
        console.error(err);
        const message =
          err instanceof Error ? err.message : "Failed to upload self photo.";
        setSelfError(message);
        setPendingSelf({ file: null, preview: "" });
        addToast(message, "error");
      } finally {
        setSelfUploading(false);
      }
    },
    [addToast]
  );

  const handleSelfFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setSelfError(error);
        return;
      }
      setSelfError("");
      setPendingSelf({ file, preview: URL.createObjectURL(file) });
      void uploadSelfPhoto(file);
    },
    [validateFile, uploadSelfPhoto]
  );

  const handleSelfDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setSelfDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleSelfFileSelect(file);
    },
    [handleSelfFileSelect]
  );

  const handleAnalyze = async () => {
    if (!selfImageUrl) {
      addToast("Upload your self photo to continue.", "error");
      return;
    }

    setIsAnalyzing(true);

    try {
      const payload: AnalysisRequest = {
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
    } catch (err) {
      console.error(err);
      addToast(
        err instanceof Error ? err.message : "An error occurred starting the analysis.",
        "error"
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // URL / link flow state
  const [urlConfirmed, setUrlConfirmed] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const handleSelfRemove = useCallback(() => {
    setSelfImageUrl(null);
    setPendingSelf({ file: null, preview: "" });
    setSelfError("");
  }, []);

  const handleSelfPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = e.clipboardData?.files?.[0];
      if (file && file.type.startsWith("image/")) {
        e.preventDefault();
        handleSelfFileSelect(file);
      }
    },
    [handleSelfFileSelect]
  );

  const handleSelfDragEnter = useCallback(() => setSelfDragOver(true), []);
  const handleSelfDragLeave = useCallback(() => setSelfDragOver(false), []);

  const handleFetchProduct = useCallback(() => {
    if (!productUrl) {
      setProductUrlError("Please enter a product URL");
      setUrlConfirmed(false);
      return;
    }
    if (!/^https?:\/\//i.test(productUrl)) {
      setProductUrlError("URL must start with http:// or https://");
      setUrlConfirmed(false);
      return;
    }
    if (fetchingUrl) return;
    setProductUrlError("");
    setUrlConfirmed(true);
    setFetchingUrl(true);
    // The analysis backend performs the real product extraction on submit; a
    // brief spinner keeps the affordance legible, then the preview card shows.
    window.setTimeout(() => setFetchingUrl(false), 450);
  }, [productUrl, fetchingUrl]);

  const resetUrl = useCallback(() => {
    setProductUrlError("");
    setUrlConfirmed(false);
  }, []);

  const canProceed =
    !!selfImageUrl &&
    (productInputMode === "upload"
      ? !!clothingPhoto.preview && !clothingPhoto.error
      : !!productUrl && !productUrlError && urlConfirmed);

  if (isLoadingSelfImage) {
    return <UploadSkeleton />;
  }

  const showClothingZone = productInputMode === "upload";
  const showLinkPreview = productInputMode === "link" && urlConfirmed && !!productUrl;

  return (
    <div className="try-on min-h-screen">
      <div className="tryon-page">
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

        <header className="tryon-header">
          <span className="tryon-eyebrow">Create</span>
          <h1 className="tryon-title">Try It On</h1>
          <p className="tryon-subtitle">
            Select a clothing item and see how well it fits your body profile.
          </p>
        </header>

        <div className="tryon-grid">
          {/* ── Upload Self ─────────────────────────────── */}
          <div className="tryon-col">
            <div className="tryon-col-head">
              <div className="tryon-col-label">
                <span className="tryon-badge">
                  <Camera aria-hidden="true" />
                </span>
                <span id="self-zone-label">Upload Self</span>
              </div>
              {selfImageUrl && !pendingSelf.preview && (
                <button
                  type="button"
                  className="tryon-ghost"
                  onClick={() => setShowSelfImageModal(true)}
                >
                  <RefreshCw aria-hidden="true" /> Change Photo
                </button>
              )}
            </div>

            <div className="tryon-hint" aria-hidden="true">
              <Info /> Full-body, well-lit photos work best
            </div>

            <div className="tryon-slot" onPaste={handleSelfPaste}>
              {selfError && (
                <div className="tryon-error" role="alert">
                  <AlertCircle className="tryon-error-ico" aria-hidden="true" />
                  <span className="tryon-error-text">{selfError}</span>
                  <button
                    type="button"
                    className="tryon-error-dismiss"
                    onClick={() => setSelfError("")}
                    aria-label="Dismiss error"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              )}

              {selfImageUrl && !pendingSelf.preview ? (
                <div className="tryon-preview">
                  <div className="tryon-preview-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selfImageUrl} alt="Your body photo" />
                    <div className="tryon-preview-badge-success">
                      <Check aria-hidden="true" /> Profile Active
                    </div>
                  </div>
                  <div className="tryon-preview-foot">
                    <div className="tryon-preview-info">
                      <p className="tryon-preview-name">Saved self photo</p>
                      <p className="tryon-preview-size">Body photo</p>
                    </div>
                    <div className="tryon-preview-actions">
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={() => setShowSelfImageModal(true)}
                      >
                        <RefreshCw aria-hidden="true" /> Replace
                      </button>
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={handleSelfRemove}
                      >
                        <X aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : selfUploading || pendingSelf.preview ? (
                <div className="tryon-preview">
                  <div className="tryon-preview-media">
                    {pendingSelf.preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={pendingSelf.preview} alt="Self photo preview" />
                    )}
                    {selfUploading && (
                      <div className="tryon-zone-loading">
                        <Loader2 aria-hidden="true" />
                        <span>Uploading photo…</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={"tryon-zone" + (selfDragOver ? " dragover" : "")}
                  role="button"
                  tabIndex={0}
                  aria-labelledby="self-zone-label"
                  onClick={() => selfInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selfInputRef.current?.click();
                    }
                  }}
                  onDrop={handleSelfDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={handleSelfDragEnter}
                  onDragLeave={handleSelfDragLeave}
                >
                  <span className="tryon-zone-stack">
                    <span className="tryon-badge-xl">
                      {selfDragOver ? (
                        <Download aria-hidden="true" />
                      ) : (
                        <Camera aria-hidden="true" />
                      )}
                    </span>
                    <span className="tryon-zone-title">Upload your photo</span>
                    <span className="tryon-zone-helper">
                      Drag &amp; drop, click to browse, or paste from clipboard
                    </span>
                    <span className="tryon-zone-meta">
                      JPG, PNG, WEBP · up to 5MB
                    </span>
                  </span>
                  <input
                    ref={selfInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelfFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Upload Item to Match ───────────────────── */}
          <div className="tryon-col">
            <div className="tryon-col-head">
              <div className="tryon-col-label">
                <span className="tryon-badge">
                  <Shirt aria-hidden="true" />
                </span>
                <span id="item-zone-label">Upload Item to Match</span>
              </div>
            </div>

            <div className="tryon-segmented">
              <div
                className="tryon-seg-track"
                role="group"
                aria-label="Upload method"
              >
                <span
                  className="tryon-seg-indicator"
                  style={{
                    transform: `translateX(${productInputMode === "link" ? "100%" : "0%"})`,
                  }}
                />
                <button
                  type="button"
                  className={"tryon-seg-btn" + (productInputMode === "upload" ? " is-active" : "")}
                  onClick={() => setProductInputMode("upload")}
                >
                  <UploadIcon aria-hidden="true" /> Upload Image
                </button>
                <button
                  type="button"
                  className={"tryon-seg-btn" + (productInputMode === "link" ? " is-active" : "")}
                  onClick={() => setProductInputMode("link")}
                >
                  <LinkIcon aria-hidden="true" /> Paste URL
                </button>
              </div>
            </div>

            <div className="tryon-slot">
              {clothingPhoto.error && showClothingZone && (
                <div className="tryon-error" role="alert">
                  <AlertCircle className="tryon-error-ico" aria-hidden="true" />
                  <span className="tryon-error-text">{clothingPhoto.error}</span>
                  <button
                    type="button"
                    className="tryon-error-dismiss"
                    onClick={() =>
                      setClothingPhoto((p) => ({ ...p, error: undefined }))
                    }
                    aria-label="Dismiss error"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              )}

              {showLinkPreview ? (
                <div className="tryon-preview">
                  <div className="tryon-preview-media">
                    <div className="tryon-preview-placeholder">
                      <LinkIcon aria-hidden="true" />
                      <span>Product link added</span>
                    </div>
                    <div className="tryon-preview-badge-success">
                      <Check aria-hidden="true" /> Ready to Analyze
                    </div>
                  </div>
                  <div className="tryon-preview-foot">
                    <div className="tryon-preview-info">
                      <p className="tryon-preview-name">{productUrl}</p>
                      <p className="tryon-preview-size">Online product</p>
                    </div>
                    <div className="tryon-preview-actions">
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={resetUrl}
                      >
                        <RefreshCw aria-hidden="true" /> Replace
                      </button>
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={() => {
                          resetUrl();
                          setProductUrl("");
                        }}
                      >
                        <X aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : showClothingZone && clothingPhoto.preview ? (
                <div className="tryon-preview">
                  <div className="tryon-preview-media">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={clothingPhoto.preview} alt="Clothing item" />
                    {!clothingPhoto.error && (
                      <div className="tryon-preview-badge-success">
                        <Check aria-hidden="true" /> Ready to Analyze
                      </div>
                    )}
                  </div>
                  <div className="tryon-preview-foot">
                    <div className="tryon-preview-info">
                      <p className="tryon-preview-name">
                        {clothingPhoto.file?.name ?? "Clothing item"}
                      </p>
                      <p className="tryon-preview-size">
                        {formatBytes(clothingPhoto.file?.size)}
                      </p>
                    </div>
                    <div className="tryon-preview-actions">
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={() => clothingInputRef.current?.click()}
                      >
                        <RefreshCw aria-hidden="true" /> Replace
                      </button>
                      <button
                        type="button"
                        className="tryon-preview-btn"
                        onClick={removeImage}
                      >
                        <X aria-hidden="true" /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : showClothingZone ? (
                <div
                  className={"tryon-zone" + (dragOver === "clothing" ? " dragover" : "")}
                  role="button"
                  tabIndex={0}
                  aria-labelledby="item-zone-label"
                  onClick={() => clothingInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      clothingInputRef.current?.click();
                    }
                  }}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={() => setDragOver("clothing")}
                  onDragLeave={() => setDragOver(null)}
                >
                  <span className="tryon-zone-stack">
                    <span className="tryon-badge-xl">
                      {dragOver === "clothing" ? (
                        <Download aria-hidden="true" />
                      ) : (
                        <Shirt aria-hidden="true" />
                      )}
                    </span>
                    <span className="tryon-zone-title">Upload item to match</span>
                    <span className="tryon-zone-helper">
                      Drag &amp; drop or click to browse
                    </span>
                    <span className="tryon-zone-meta">
                      JPG, PNG, WEBP · up to 5MB
                    </span>
                  </span>
                  <input
                    ref={clothingInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                      e.target.value = "";
                    }}
                  />
                </div>
              ) : (
                <div className="tryon-url">
                  <div className="tryon-url-center">
                    <span className="tryon-badge-xl">
                      <LinkIcon aria-hidden="true" />
                    </span>
                    <p className="tryon-url-title">Paste E-Commerce Link</p>
                    <p className="tryon-url-sub">
                      Paste a product URL from Zara, H&amp;M, or other stores.
                    </p>
                  </div>
                  <div className="tryon-url-row">
                    <input
                      className="tryon-url-input"
                      value={productUrl}
                      placeholder="https://example.com/product/..."
                      aria-label="Product URL"
                      aria-invalid={!!productUrlError}
                      onChange={(e) => {
                        setProductUrl(e.target.value);
                        setProductUrlError("");
                        setUrlConfirmed(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFetchProduct();
                      }}
                    />
                    <button
                      type="button"
                      className="tryon-url-fetch"
                      onClick={handleFetchProduct}
                      disabled={fetchingUrl}
                    >
                      {fetchingUrl ? (
                        <Loader2 className="tryon-spin" aria-hidden="true" />
                      ) : (
                        <ArrowRight aria-hidden="true" />
                      )}
                      {fetchingUrl ? "Fetching" : "Fetch"}
                    </button>
                  </div>
                  {productUrlError && (
                    <p className="tryon-url-error" role="alert">
                      {productUrlError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tryon-cta">
          <button
            type="button"
            className="tryon-cta-btn"
            disabled={!canProceed || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? (
              <Loader2 className="tryon-spin" aria-hidden="true" />
            ) : null}
            {isAnalyzing ? "Working…" : "See How It Fits"}
            {!isAnalyzing && <ArrowRight aria-hidden="true" />}
          </button>
        </div>

        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {isAnalyzing
            ? "Preparing your analysis"
            : selfImageUrl && (showLinkPreview || clothingPhoto.preview)
            ? "Both photos ready"
            : ""}
        </span>
      </div>
    </div>
  );
}
