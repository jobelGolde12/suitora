"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
              <div className="absolute inset-0 flex items-center justify-center bg-surface">
                <div className="text-center px-6">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
                    <Sparkles className="h-5 w-5 text-muted" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-muted font-light">Generated try-on preview</p>
                  <p className="text-xs text-muted-foreground mt-1.5 font-light">
                    Mock preview — real AI integration coming soon
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
              <CardContent className="space-y-8">
                <div className="flex flex-wrap items-center justify-center gap-8 py-2">
                  <ScoreCircle score={mockResult.overallScore} size="lg" label="Overall" />
                  <ScoreCircle score={mockResult.bodyScore} size="md" label="Body Fit" />
                  <ScoreCircle score={mockResult.styleScore} size="md" label="Style Match" />
                  <ScoreCircle score={mockResult.colorScore} size="md" label="Color Harmony" />
                </div>
                <div className="space-y-4 max-w-md mx-auto">
                  <ScoreBar label="Body fit" score={mockResult.bodyScore} />
                  <ScoreBar label="Style match" score={mockResult.styleScore} />
                  <ScoreBar label="Color harmony" score={mockResult.colorScore} />
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
                      ["Body Shape", bodyShapeLabels[mockResult.bodyShape]],
                      ["Skin Tone", skinToneLabels[mockResult.skinTone]],
                      ["Face Shape", faceShapeLabels[mockResult.faceShape]],
                      ["Style Type", styleTypeLabels[mockResult.styleType]],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-surface p-3.5 border border-border/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium">
                        {label}
                      </p>
                      <p className="text-sm font-medium mt-1">{value}</p>
                    </div>
                  ))}
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
                  <Palette className="h-4 w-4 text-muted" strokeWidth={1.5} />
                  Color Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-muted mb-2.5">Primary Colors</p>
                  <div className="flex flex-wrap gap-3">
                    {mockResult.colorAnalysis.primaryColors.map((color, i) => (
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
                <div>
                  <p className="text-xs font-medium text-muted mb-2.5">Recommended</p>
                  <div className="flex flex-wrap gap-2">
                    {mockResult.colorAnalysis.recommendedColors.map((color, i) => (
                      <Badge key={i} variant="success">
                        {color}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted mb-2.5">Avoid</p>
                  <div className="flex flex-wrap gap-2">
                    {mockResult.colorAnalysis.avoidColors.map((color, i) => (
                      <Badge key={i} variant="error">
                        {color}
                      </Badge>
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
                  <Star className="h-4 w-4 text-muted" strokeWidth={1.5} />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {mockResult.recommendations.map((rec, i) => (
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
