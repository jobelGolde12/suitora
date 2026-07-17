"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Heart,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  Palette,
  User as UserIcon,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { useToast } from "@/components/ui/Toast";
import {
  PageContainer,
  PageHeader,
  ScoreBar,
  fadeInUp,
} from "@/components/dashboard";
import { cn } from "@/lib/utils/cn";
import type {
  BodyShape,
  SkinTone,
  FaceShape,
  StyleType,
} from "@/types";

const bodyShapeLabels: Record<BodyShape, string> = {
  rectangle: "Rectangle",
  pear: "Pear",
  apple: "Apple",
  hourglass: "Hourglass",
  triangle: "Triangle",
};

const skinToneLabels: Record<SkinTone, string> = {
  warm: "Warm Tone",
  cool: "Cool Tone",
  neutral: "Neutral Tone",
};

const faceShapeLabels: Record<FaceShape, string> = {
  round: "Round",
  oval: "Oval",
  heart: "Heart",
  square: "Square",
  diamond: "Diamond",
};

const styleTypeLabels: Record<StyleType, string> = {
  casual: "Casual",
  minimalist: "Minimalist",
  streetwear: "Streetwear",
  vintage: "Vintage",
  formal: "Formal",
  korean: "Korean Style",
  "business-casual": "Business Casual",
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedView, setSelectedView] = useState<"tryon" | "original">("tryon");

  // Fetch results and check if favorited
  useEffect(() => {
    if (!id) return;

    async function loadData() {
      try {
        // 1. Get analysis details
        const res = await fetch(`/api/analysis?id=${id}`);
        if (!res.ok) {
          throw new Error("Failed to load analysis");
        }
        const data = await res.json();
        
        if (data.error) {
          addToast(data.error, "error");
          router.push("/upload");
          return;
        }

        setResult(data.analysis);

        // 2. Get favorites to see if this one is favorited
        const favsRes = await fetch("/api/favorites", {
          credentials: "include",
        });
        if (favsRes.ok) {
          const favsData = await favsRes.json();
          const isFav = favsData.favorites?.some((fav: any) => fav.analysisId === id);
          setIsFavorited(!!isFav);
        }
      } catch (err) {
        console.error("Error loading results:", err);
        addToast("Error loading results", "error");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, addToast, router]);

  const handleFavorite = async () => {
    if (!id) return;
    try {
      if (isFavorited) {
        const res = await fetch(`/api/favorites?analysisId=${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (res.ok) {
          setIsFavorited(false);
          addToast("Removed from favorites", "success");
        } else {
          throw new Error("Failed to remove favorite");
        }
      } else {
        const res = await fetch("/api/favorites", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ analysisId: id }),
        });
        if (res.ok) {
          setIsFavorited(true);
          addToast("Added to favorites", "success");
        } else {
          throw new Error("Failed to add favorite");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to update favorite status", "error");
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const imageUrl = selectedView === "tryon" ? result.generatedImage : result.productImage;
    if (!imageUrl) return;

    // Direct download trigger for data URL or standard image
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `suitora-analysis-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast("Image download triggered successfully", "success");
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      addToast("Link copied to clipboard", "success");
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-muted font-light">Retrieving compatibility report...</p>
        </div>
      </PageContainer>
    );
  }

  if (!result) {
    return (
      <PageContainer>
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-center gap-4">
          <AlertCircle className="h-10 w-10 text-error" />
          <h2 className="font-heading text-2xl font-light">Analysis Not Found</h2>
          <Link href="/upload">
            <Button variant="editorial" className="rounded-full">Back to Upload</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        className="mb-6"
      >
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          Back
        </button>
      </motion.div>

      <PageHeader
        label="Results"
        title="Analysis Results"
        description="Here's how this item works with your style profile."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="sm" onClick={handleShare} className="rounded-full">
              <Share2 className="h-4 w-4" strokeWidth={1.5} />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload} className="rounded-full">
              <Download className="h-4 w-4" strokeWidth={1.5} />
              Download
            </Button>
            <Button
              variant={isFavorited ? "accent" : "editorial"}
              size="sm"
              onClick={handleFavorite}
              className="rounded-full"
            >
              <Heart className={cn("h-4 w-4", isFavorited && "fill-white")} strokeWidth={1.5} />
              {isFavorited ? "Saved" : "Save"}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
        <div className="lg:col-span-3 space-y-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
          >
            <div className="flex items-center gap-2 mb-4">
              {(["tryon", "original"] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  onClick={() => setSelectedView(view)}
                  className={cn(
                    "px-3.5 py-1.5 text-xs font-medium rounded-full transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedView === view
                      ? "bg-foreground text-background"
                      : "bg-surface text-muted hover:text-foreground border border-border"
                  )}
                >
                  {view === "tryon" ? "Virtual Try-On" : "Original Item"}
                </button>
              ))}
            </div>
            <div className="rounded-2xl border border-border bg-card overflow-hidden aspect-[4/5] relative shadow-card">
              {selectedView === "tryon" && result.generatedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.generatedImage}
                  alt="Virtual try-on preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.productImage}
                  alt="Original clothing item"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={2}
          >
            <Card>
              <CardHeader>
                <CardTitle>Compatibility Scores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex flex-wrap items-center justify-center gap-8 py-2">
                  <ScoreCircle score={result.overallScore} size="lg" label="Overall" />
                  <ScoreCircle score={result.bodyScore || 0} size="md" label="Body Fit" />
                  <ScoreCircle score={result.styleScore || 0} size="md" label="Style Match" />
                  <ScoreCircle score={result.colorScore || 0} size="md" label="Color Harmony" />
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <ScoreBar label="Body fit" score={result.bodyScore || 0} />
                  <ScoreBar label="Style match" score={result.styleScore || 0} />
                  <ScoreBar label="Color harmony" score={result.colorScore || 0} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={3}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-muted" strokeWidth={1.5} />
                  Your Style Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["Body Shape", bodyShapeLabels[result.bodyShape as BodyShape] || "Not detected"],
                      ["Skin Tone", skinToneLabels[result.skinTone as SkinTone] || "Not detected"],
                      ["Face Shape", faceShapeLabels[result.faceShape as FaceShape] || "Not detected"],
                      ["Style Type", styleTypeLabels[result.styleType as StyleType] || "Minimalist"],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-surface p-3.5 border border-border/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                        {label}
                      </p>
                      <p className="text-sm font-medium mt-1">{value}</p>
                    </div>
                  ))}

                  {result.height && (
                    <div className="rounded-2xl bg-surface p-3.5 border border-border/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                        Predicted Height
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {result.height} cm
                        {result.heightConfidence && (
                          <span className="text-[10px] text-muted font-light block">
                            (± {Math.round((1 - result.heightConfidence) * 10)} cm, {Math.round(result.heightConfidence * 100)}% conf)
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {result.weight && (
                    <div className="rounded-2xl bg-surface p-3.5 border border-border/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                        Predicted Weight
                      </p>
                      <p className="text-sm font-medium mt-1">
                        {result.weight} kg
                        {result.weightConfidence && (
                          <span className="text-[10px] text-muted font-light block">
                            (± {Math.round((1 - result.weightConfidence) * 10)} kg, {Math.round(result.weightConfidence * 100)}% conf)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {result.colorAnalysis && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={4}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted" strokeWidth={1.5} />
                    Color Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {result.colorAnalysis.primaryColors && (
                    <div>
                      <p className="text-xs font-medium text-muted mb-2.5">Primary Colors</p>
                      <div className="flex flex-wrap gap-3">
                        {result.colorAnalysis.primaryColors.map((color: string, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <div
                              className="h-7 w-7 rounded-full border border-border shadow-soft"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-[11px] text-muted font-light tabular-nums">
                              {color}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.colorAnalysis.recommendedColors && (
                    <div>
                      <p className="text-xs font-medium text-muted mb-2.5">Recommended</p>
                      <div className="flex flex-wrap gap-2">
                        {result.colorAnalysis.recommendedColors.map((color: string, i: number) => (
                          <Badge key={i} variant="success">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {result.colorAnalysis.avoidColors && (
                    <div>
                      <p className="text-xs font-medium text-muted mb-2.5">Avoid</p>
                      <div className="flex flex-wrap gap-2">
                        {result.colorAnalysis.avoidColors.map((color: string, i: number) => (
                          <Badge key={i} variant="error">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={5}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-muted" strokeWidth={1.5} />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {result.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-6 w-6 rounded-full border border-border bg-surface flex items-center justify-center mt-0.5">
                          <span className="text-[10px] font-medium text-muted tabular-nums">
                            {i + 1}
                          </span>
                        </div>
                        <p className="text-sm text-muted font-light leading-relaxed">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={6}
          >
            <Link href="/upload">
              <Button variant="editorial" className="w-full rounded-full" size="lg">
                Try Another Item
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  );
}
