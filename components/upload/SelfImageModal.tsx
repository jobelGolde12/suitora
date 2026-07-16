"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, AlertCircle, Camera, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadImage } from "@/lib/ai/upload";
import { useToast } from "@/components/ui/Toast";

interface SelfImageModalProps {
  onSuccess: (url: string) => void;
}

export function SelfImageModal({ onSuccess }: SelfImageModalProps) {
  const { addToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        addToast("Please upload an image file", "error");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.type.startsWith("image/")) {
        addToast("Please upload an image file", "error");
        return;
      }
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload image (to Base64 mock representation)
      const res = await uploadImage(file, (progress) => {
        setUploadProgress(progress);
      });

      // 2. Persist to user's profile
      const saveRes = await fetch("/api/user/self-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ selfImageUrl: res.url }),
      });

      const data = await saveRes.json();

      if (saveRes.ok && data.success) {
        addToast("Self-image uploaded successfully!", "success");
        onSuccess(res.url);
      } else {
        throw new Error(data.error || "Failed to save image");
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Something went wrong during upload", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-elevated"
      >
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Left panel - Guidelines */}
          <div className="bg-surface/50 border-r border-border p-6 md:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent/20 bg-accent/5">
                <Camera className="h-5 w-5 text-accent" strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading text-lg font-medium text-foreground leading-tight">
                  Photo Guidelines
                </h3>
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  For the most accurate fashion and body shape analysis, follow these standards:
                </p>
              </div>

              <ul className="space-y-3 pt-2">
                {[
                  "Whole-body visible (head-to-toe)",
                  "Standing straight, front-facing",
                  "Form-fitting clothing",
                  "Clear, well-lit background",
                ].map((rule, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-muted font-light leading-snug">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" strokeWidth={2} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 flex items-center gap-2 text-[10px] text-muted-foreground font-light">
              <AlertCircle className="h-3 w-3 text-accent shrink-0" />
              <span>Required once to start analysis</span>
            </div>
          </div>

          {/* Right panel - Upload Zone */}
          <div className="p-6 md:p-8 flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <div>
                <h2 id="modal-title" className="font-heading text-2xl font-light tracking-tight">
                  Upload Self Image
                </h2>
                <p className="text-xs text-muted font-light mt-1">
                  We use your body outline to analyze fits and compatibility.
                </p>
              </div>

              {/* Drag zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 min-h-[200px] ${
                  preview ? "border-solid border-border/80 bg-surface/30" : "border-border/60 hover:border-accent/40 bg-surface/10"
                } ${isUploading ? "pointer-events-none opacity-80" : ""}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {preview ? (
                  <div className="relative w-full h-full max-h-[160px] flex items-center justify-center overflow-hidden rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preview}
                      alt="Self Image Preview"
                      className="max-h-[160px] max-w-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                      <span className="text-xs text-white bg-black/60 px-3 py-1.5 rounded-full font-light">
                        Change Image
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface border border-border">
                      <Upload className="h-5 w-5 text-muted" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Click or drag image to upload</p>
                      <p className="text-[11px] text-muted-foreground font-light">
                        Supports PNG, JPG, or WEBP. Max 10MB.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions / Progress */}
            <div className="pt-6 space-y-4">
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground font-light">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1 w-full bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                {preview && !isUploading && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                    className="rounded-full"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  loading={isUploading}
                  variant="editorial"
                  className="rounded-full px-6 flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  Analyze Photo
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
