"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, type Easing } from "framer-motion";
import {
  Sparkles,
  Heart,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  Shirt,
  Palette,
  User as UserIcon,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import type {
  BodyShape,
  SkinTone,
  FaceShape,
  StyleType,
} from "@/types";

const mockResult = {
  id: "mock_1",
  userImage: "/placeholder.svg",
  productImage: "/placeholder.svg",
  generatedImage: "/placeholder.svg",
  overallScore: 84,
  bodyScore: 88,
  styleScore: 82,
  colorScore: 79,
  bodyShape: "hourglass" as BodyShape,
  skinTone: "warm" as SkinTone,
  faceShape: "oval" as FaceShape,
  styleType: "minimalist" as StyleType,
  recommendations: [
    "This piece complements your hourglass figure beautifully",
    "Consider pairing with neutral-toned accessories for balance",
    "The silhouette works well for both casual and semi-formal occasions",
    "Try rolling up the sleeves for a more relaxed look",
  ],
  colorAnalysis: {
    primaryColors: ["#2D2D2D", "#F5F5F5", "#8B7355"],
    recommendedColors: ["#E8D5B7", "#4A90D9", "#2ECC71"],
    avoidColors: ["#FF6B6B", "#98FB98"],
  },
  createdAt: new Date().toISOString(),
};

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

const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: easeOut },
  }),
};

export default function ResultsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [isFavorited, setIsFavorited] = useState(false);
  const [selectedView, setSelectedView] = useState<"tryon" | "original">("tryon");

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    addToast(
      isFavorited ? "Removed from favorites" : "Added to favorites",
      "success"
    );
  };

  const handleDownload = () => {
    addToast("Image downloaded successfully", "success");
  };

  const handleShare = () => {
    addToast("Link copied to clipboard", "success");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Analysis Results</h1>
            <p className="text-sm text-muted mt-1">
              Here&apos;s how this item works with your style profile.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Download
            </Button>
            <Button
              variant={isFavorited ? "primary" : "secondary"}
              size="sm"
              onClick={handleFavorite}
            >
              <Heart className={cn("h-4 w-4", isFavorited && "fill-white")} />
              {isFavorited ? "Saved" : "Save"}
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={1}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {["tryon", "original"].map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view as typeof selectedView)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
                        selectedView === view
                          ? "bg-primary text-white"
                          : "bg-surface text-muted hover:text-foreground"
                      )}
                    >
                      {view === "tryon" ? "Virtual Try-On" : "Original Item"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-card overflow-hidden aspect-[4/5] relative">
                <div className="absolute inset-0 flex items-center justify-center bg-surface">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-muted mx-auto mb-3" />
                    <p className="text-xs text-muted">Generated try-on preview</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      (Mock preview - real AI integration coming soon)
                    </p>
                  </div>
                </div>
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
                <CardContent>
                  <div className="flex flex-wrap items-center justify-center gap-8 py-4">
                    <ScoreCircle score={mockResult.overallScore} size="lg" label="Overall" />
                    <ScoreCircle score={mockResult.bodyScore} size="md" label="Body Fit" />
                    <ScoreCircle score={mockResult.styleScore} size="md" label="Style Match" />
                    <ScoreCircle score={mockResult.colorScore} size="md" label="Color Harmony" />
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
                    <UserIcon className="h-4 w-4 text-primary" />
                    Your Style Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-surface p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Body Shape</p>
                      <p className="text-sm font-medium mt-0.5">{bodyShapeLabels[mockResult.bodyShape]}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Skin Tone</p>
                      <p className="text-sm font-medium mt-0.5">{skinToneLabels[mockResult.skinTone]}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Face Shape</p>
                      <p className="text-sm font-medium mt-0.5">{faceShapeLabels[mockResult.faceShape]}</p>
                    </div>
                    <div className="rounded-xl bg-surface p-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Style Type</p>
                      <p className="text-sm font-medium mt-0.5">{styleTypeLabels[mockResult.styleType]}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={4}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-accent" />
                    Color Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted mb-2">Primary Colors</p>
                    <div className="flex gap-2">
                      {mockResult.colorAnalysis.primaryColors.map((color, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="h-6 w-6 rounded-lg border border-border" style={{ backgroundColor: color }} />
                          <span className="text-[10px] text-muted">{color}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-success mb-2">Recommended Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {mockResult.colorAnalysis.recommendedColors.map((color, i) => (
                        <Badge key={i} variant="success">{color}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-error mb-2">Avoid Colors</p>
                    <div className="flex flex-wrap gap-2">
                      {mockResult.colorAnalysis.avoidColors.map((color, i) => (
                        <Badge key={i} variant="error">{color}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={5}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-warning" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {mockResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                          <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                        </div>
                        <p className="text-sm text-muted leading-relaxed">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              custom={6}
            >
              <Link href="/upload">
                <Button className="w-full" size="lg">
                  Try Another Item
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
