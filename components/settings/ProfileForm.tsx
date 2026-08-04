"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";import {
  Ruler,
  Weight,
  Shirt,
  Footprints,
  Star,
  Camera,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Palette,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils/cn";
import { fadeInUp } from "@/components/dashboard/motion";
import { uploadImage } from "@/lib/ai/upload";
import { predictSizes, type SizePrediction } from "@/lib/ai/size-prediction";
import type {
  UserProfile,
  UpdateProfilePayload,
  StyleTag,
  FitPreference,
  SizeSystem,
  Gender,
} from "@/types";

// ─── Constants ───────────────────────────────────────────────────

const STYLE_TAGS: { value: StyleTag; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "minimalist", label: "Minimalist" },
  { value: "streetwear", label: "Streetwear" },
  { value: "vintage", label: "Vintage" },
  { value: "formal", label: "Formal" },
  { value: "korean", label: "Korean" },
  { value: "business-casual", label: "Biz Casual" },
  { value: "bohemian", label: "Bohemian" },
  { value: "athleisure", label: "Athleisure" },
  { value: "preppy", label: "Preppy" },
  { value: "edgy", label: "Edgy" },
  { value: "romantic", label: "Romantic" },
  { value: "classic", label: "Classic" },
  { value: "avant-garde", label: "Avant-Garde" },
];

const FIT_OPTIONS: { value: FitPreference; label: string }[] = [
  { value: "tight", label: "Tight" },
  { value: "regular", label: "Regular" },
  { value: "relaxed", label: "Relaxed" },
  { value: "oversized", label: "Oversized" },
];

const SIZE_SYSTEMS: { value: SizeSystem; label: string }[] = [
  { value: "US", label: "US" },
  { value: "EU", label: "EU" },
  { value: "UK", label: "UK" },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

// ─── Measurement Field Config ────────────────────────────────────

type NumericProfileKey =
  | "height"
  | "weight"
  | "chestCircumference"
  | "waistCircumference"
  | "hipCircumference"
  | "shoulderWidth"
  | "inseamLength"
  | "armLength"
  | "neckCircumference"
  | "footLength"
  | "footWidth";

interface MeasurementField {
  key: NumericProfileKey;
  label: string;
  icon: React.ElementType;
  unit: string;
  placeholder: string;
  hint?: string;
}

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: "height", label: "Height", icon: Ruler, unit: "cm", placeholder: "e.g. 165", hint: "Your total standing height" },
  { key: "weight", label: "Weight", icon: Weight, unit: "kg", placeholder: "e.g. 58", hint: "Your current body weight" },
  { key: "chestCircumference", label: "Chest", icon: Shirt, unit: "cm", placeholder: "e.g. 88", hint: "Chest/bust at fullest point" },
  { key: "waistCircumference", label: "Waist", icon: Shirt, unit: "cm", placeholder: "e.g. 68", hint: "Natural waist (narrowest point)" },
  { key: "hipCircumference", label: "Hip", icon: Shirt, unit: "cm", placeholder: "e.g. 92", hint: "Hip at fullest point" },
  { key: "shoulderWidth", label: "Shoulders", icon: Shirt, unit: "cm", placeholder: "e.g. 38", hint: "Shoulder to shoulder" },
  { key: "inseamLength", label: "Inseam", icon: Ruler, unit: "cm", placeholder: "e.g. 75", hint: "Crotch to ankle" },
  { key: "armLength", label: "Sleeve", icon: Ruler, unit: "cm", placeholder: "e.g. 58", hint: "Shoulder to wrist" },
  { key: "neckCircumference", label: "Neck", icon: Shirt, unit: "cm", placeholder: "e.g. 35", hint: "For collared shirts" },
  { key: "footLength", label: "Foot Length", icon: Footprints, unit: "cm", placeholder: "e.g. 24", hint: "Heel to longest toe" },
  { key: "footWidth", label: "Foot Width", icon: Footprints, unit: "cm", placeholder: "e.g. 9", hint: "Widest part of foot" },
];

// ─── Tag Select Component ────────────────────────────────────────

function TagSelect({
  tags,
  selected,
  onChange,
}: {
  tags: { value: string; label: string }[];
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((t) => t !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag.value}
          type="button"
          onClick={() => toggle(tag.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selected.includes(tag.value)
              ? "bg-foreground text-background border-foreground"
              : "bg-card text-muted border-border hover:border-muted hover:text-foreground"
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  );
}

// ─── Main Profile Form ───────────────────────────────────────────

export function ProfileForm() {
  const { addToast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [measurementsOpen, setMeasurementsOpen] = useState(true);
  const [preferencesOpen, setPreferencesOpen] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [shoeSize, setShoeSize] = useState("");
  const [bustCupSize, setBustCupSize] = useState("");
  const [measurements, setMeasurements] = useState<Record<string, string>>({});
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [preferredBrands, setPreferredBrands] = useState("");
  const [preferredColors, setPreferredColors] = useState("");
  const [avoidColors, setAvoidColors] = useState("");
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");
  const [fitPreference, setFitPreference] = useState<FitPreference>("regular");
  const [sizePreference, setSizePreference] = useState<SizeSystem>("US");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // AI estimated values
  const [estimatedHeight, setEstimatedHeight] = useState<number | null>(null);
  const [estimatedWeight, setEstimatedWeight] = useState<number | null>(null);
  const [estimatedBodyShape, setEstimatedBodyShape] = useState<string | null>(null);
  const [estimatedHeightConf, setEstimatedHeightConf] = useState<number | null>(null);
  const [estimatedWeightConf, setEstimatedWeightConf] = useState<number | null>(null);

  // Size prediction
  const [sizePrediction, setSizePrediction] = useState<SizePrediction | null>(null);
  const [sizePredictionOpen, setSizePredictionOpen] = useState(true);

  const recalcSizePredictions = useCallback((profileData?: UserProfile) => {
    const p = profileData || profile;
    if (!p) return;

    const result = predictSizes({
      height: p.height ?? undefined,
      weight: p.weight ?? undefined,
      chestCircumference: p.chestCircumference ?? undefined,
      waistCircumference: p.waistCircumference ?? undefined,
      hipCircumference: p.hipCircumference ?? undefined,
      shoulderWidth: p.shoulderWidth ?? undefined,
      inseamLength: p.inseamLength ?? undefined,
      armLength: p.armLength ?? undefined,
      neckCircumference: p.neckCircumference ?? undefined,
      footLength: p.footLength ?? undefined,
      shoeSize: p.shoeSize ?? undefined,
    });
    setSizePrediction(result);
  }, [profile]);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      const p: UserProfile = data.profile;

      setProfile(p);
      setName(p.userId ? "" : ""); // Will be filled from session
      setPhone(p.phone || "");
      setDateOfBirth(p.dateOfBirth || "");
      setGender((p.gender as Gender) || "");
      setShoeSize(p.shoeSize || "");
      setBustCupSize(p.bustCupSize || "");
      setStyleTags(p.styleTags || []);
      setPreferredBrands((p.preferredBrands || []).join(", "));
      setPreferredColors((p.preferredColors || []).join(", "));
      setAvoidColors((p.avoidColors || []).join(", "));
      setPriceRangeMin(p.priceRangeMin?.toString() || "");
      setPriceRangeMax(p.priceRangeMax?.toString() || "");
      setFitPreference(p.fitPreference || "regular");
      setSizePreference(p.sizePreference || "US");
      setAvatarUrl(p.selfImageUrl || null);

      // Set measurements
      const meas: Record<string, string> = {};
      MEASUREMENT_FIELDS.forEach((field) => {
        const val = p[field.key as keyof UserProfile];
        meas[field.key] = val !== undefined && val !== null ? String(val) : "";
      });
      setMeasurements(meas);

      // Set AI estimated values
      setEstimatedHeight(p.estimatedHeight ?? null);
      setEstimatedWeight(p.estimatedWeight ?? null);
      setEstimatedBodyShape(p.bodyShape ?? null);
      setEstimatedHeightConf(p.estimatedHeightConfidence ?? null);
      setEstimatedWeightConf(p.estimatedWeightConfidence ?? null);

      // Recalculate size predictions when profile is loaded
      recalcSizePredictions(p);

      // Also fetch the user's name from session if available
      try {
        const sessionRes = await fetch("/api/auth/get-session");
        const sessionData = await sessionRes.json();
        if (sessionData?.user?.name) {
          setName(sessionData.user.name);
        }
      } catch {}
    } catch {
      addToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, recalcSizePredictions]);

  // Fetch profile on mount
  useEffect(() => {
    void Promise.resolve().then(() => fetchProfile());
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: UpdateProfilePayload = {
        name,
        phone: phone || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: (gender as Gender) || undefined,
        shoeSize: shoeSize || undefined,
        bustCupSize: bustCupSize || undefined,
        styleTags,
        preferredBrands: preferredBrands.split(",").map((s) => s.trim()).filter(Boolean),
        preferredColors: preferredColors.split(",").map((s) => s.trim()).filter(Boolean),
        avoidColors: avoidColors.split(",").map((s) => s.trim()).filter(Boolean),
        priceRangeMin: priceRangeMin ? parseInt(priceRangeMin) : undefined,
        priceRangeMax: priceRangeMax ? parseInt(priceRangeMax) : undefined,
        fitPreference,
        sizePreference,
      };

      // Add measurements
      MEASUREMENT_FIELDS.forEach((field) => {
        const val = measurements[field.key];
        if (val && !isNaN(Number(val))) {
          payload[field.key] = Number(val);
        }
      });

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");
      addToast("Profile saved successfully", "success");
      await fetchProfile();
    } catch {
      addToast("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload image via the upload service (converts to base64)
      const res = await uploadImage(file);

      // Save to user's profile
      const saveRes = await fetch("/api/user/self-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfImageUrl: res.url }),
      });

      if (!saveRes.ok) throw new Error("Save failed");
      const data = await saveRes.json();
      setAvatarUrl(data.selfImageUrl);
      addToast("Photo uploaded", "success");
    } catch {
      addToast("Failed to upload photo", "error");
    }
  }, [addToast]);

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const res = await fetch("/api/user/profile/estimate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || "Estimation failed", "error");
        return;
      }

      if (data.estimation) {
        setEstimatedHeight(data.estimation.height);
        setEstimatedWeight(data.estimation.weight);
        setEstimatedBodyShape(data.estimation.bodyShape);
        setEstimatedHeightConf(data.estimation.heightConfidence);
        setEstimatedWeightConf(data.estimation.weightConfidence);
        addToast("Body estimation complete", "success");
      }
    } catch {
      addToast("Estimation failed", "error");
    } finally {
      setEstimating(false);
    }
  };

  const updateMeasurement = (key: string, value: string) => {
    setMeasurements((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 rounded-xl bg-surface" />
        <div className="h-64 rounded-2xl bg-surface" />
        <div className="h-48 rounded-2xl bg-surface" />
      </div>
    );
  }

  return (
    <motion.div
      key="profile"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      className="space-y-8"
    >
      {/* ── Basic Info Section ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <User className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <h3 className="font-heading text-lg font-medium tracking-tight">Basic Information</h3>
        </div>

        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="relative group">
                <Avatar
                  src={avatarUrl || undefined}
                  initials={name ? name.charAt(0).toUpperCase() : "?"}
                  size="xl"
                />
                <label className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/0 group-hover:bg-foreground/40 cursor-pointer transition-all duration-200">
                  <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" strokeWidth={1.5} />
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div className="flex-1 w-full space-y-4">
                <Input
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1-555-0123"
                  />
                  <Input
                    label="Date of Birth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          gender === opt.value
                            ? "bg-foreground text-background border-foreground"
                            : "bg-card text-muted border-border hover:border-muted hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Body Measurements Section ── */}
      <section>
        <button
          type="button"
          onClick={() => setMeasurementsOpen(!measurementsOpen)}
          className="flex items-center justify-between w-full mb-5 group"
        >
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-heading text-lg font-medium tracking-tight">Body Measurements</h3>
          </div>
          {measurementsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {measurementsOpen && (
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MEASUREMENT_FIELDS.map((field) => {
                  return (
                    <div key={field.key} className="relative">
                      <Input
                        label={field.label}
                        type="number"
                        value={measurements[field.key] || ""}
                        onChange={(e) => updateMeasurement(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        hint={field.hint}
                      />
                      <span className="absolute right-3 top-[38px] text-xs text-muted pointer-events-none">
                        {field.unit}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Extra measurement fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <Input
                  label="Shoe Size"
                  value={shoeSize}
                  onChange={(e) => setShoeSize(e.target.value)}
                  placeholder="e.g. US 8"
                  hint="Include sizing system (US/EU/UK)"
                />
                <Input
                  label="Bust Cup Size"
                  value={bustCupSize}
                  onChange={(e) => setBustCupSize(e.target.value)}
                  placeholder="e.g. 34B"
                  hint="For tops and dresses"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── AI Body Estimation Section ── */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Star className="h-4 w-4 text-accent" strokeWidth={1.5} />
          <h3 className="font-heading text-lg font-medium tracking-tight">AI Body Estimation</h3>
        </div>

        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <p className="text-sm text-muted font-light leading-relaxed">
                  Upload a full-body photo to let our AI estimate your height, weight, and body shape. 
                  Manual measurements above will override AI estimates.
                </p>
                <div className="flex gap-3">
                  <label className="cursor-pointer">
                    <span
                      className="inline-flex items-center justify-center rounded-full px-4 h-8 text-sm gap-1.5 font-medium border border-foreground/20 text-foreground hover:bg-foreground hover:text-background transition-all duration-200 btn-editorial-scale"
                    >
                      <Camera className="h-4 w-4" strokeWidth={1.5} />
                      Upload Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleAvatarUpload}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full"
                    onClick={handleEstimate}
                    loading={estimating}
                  >
                    <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
                    Estimate
                  </Button>
                </div>
              </div>

              {/* Estimation Results */}
              <div className="flex-1 rounded-xl bg-surface/60 p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                  AI Predictions
                </h4>
                {estimatedHeight || estimatedWeight || estimatedBodyShape ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted font-light">Height</span>
                      <span className="text-sm font-medium">
                        {estimatedHeight ? `${estimatedHeight} cm` : "—"}
                        {estimatedHeightConf && (
                          <span className="text-[11px] text-muted ml-1.5">
                            ({(estimatedHeightConf * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted font-light">Weight</span>
                      <span className="text-sm font-medium">
                        {estimatedWeight ? `${estimatedWeight} kg` : "—"}
                        {estimatedWeightConf && (
                          <span className="text-[11px] text-muted ml-1.5">
                            ({(estimatedWeightConf * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted font-light">Body Shape</span>
                      <span className="text-sm font-medium capitalize">
                        {estimatedBodyShape || "—"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted font-light italic">
                    No estimates yet. Upload a photo and click &ldquo;Estimate&rdquo;.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Size Prediction Section ── */}
      <section>
        <button
          type="button"
          onClick={() => setSizePredictionOpen(!sizePredictionOpen)}
          className="flex items-center justify-between w-full mb-5 group"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-heading text-lg font-medium tracking-tight">Size Predictions</h3>
          </div>
          {sizePredictionOpen ? (
            <ChevronUp className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {sizePredictionOpen && (
          <Card>
            <CardContent>
              {sizePrediction && sizePrediction.measurementsUsed.length > 0 ? (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Top Size */}
                    <div className="rounded-xl bg-surface/60 p-4 text-center border border-border/60">
                      <Shirt className="h-5 w-5 text-accent mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium">Top</p>
                      <p className="font-heading text-2xl font-medium mt-1">
                        {sizePrediction.topSize.size}
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${sizePrediction.topSize.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted mt-1">
                        {(sizePrediction.topSize.confidence * 100).toFixed(0)}% match
                      </p>
                    </div>

                    {/* Bottom Size */}
                    <div className="rounded-xl bg-surface/60 p-4 text-center border border-border/60">
                      <Shirt className="h-5 w-5 text-accent mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium">Bottom</p>
                      <p className="font-heading text-2xl font-medium mt-1">
                        {sizePrediction.bottomSize.size}
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${sizePrediction.bottomSize.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted mt-1">
                        {(sizePrediction.bottomSize.confidence * 100).toFixed(0)}% match
                      </p>
                    </div>

                    {/* Dress Size */}
                    <div className="rounded-xl bg-surface/60 p-4 text-center border border-border/60">
                      <Shirt className="h-5 w-5 text-accent mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium">Dress</p>
                      <p className="font-heading text-2xl font-medium mt-1">
                        {sizePrediction.dressSize.size}
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${sizePrediction.dressSize.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted mt-1">
                        {(sizePrediction.dressSize.confidence * 100).toFixed(0)}% match
                      </p>
                    </div>

                    {/* Shoe Size */}
                    <div className="rounded-xl bg-surface/60 p-4 text-center border border-border/60">
                      <Footprints className="h-5 w-5 text-accent mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] font-medium">Shoes</p>
                      <p className="font-heading text-lg font-medium mt-1 leading-tight">
                        EU {sizePrediction.shoeSize.eu}
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">
                        US {sizePrediction.shoeSize.us} · UK {sizePrediction.shoeSize.uk}
                      </p>
                      <div className="mt-1.5 h-1 w-full rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${sizePrediction.shoeSize.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted mt-1">
                        {(sizePrediction.shoeSize.confidence * 100).toFixed(0)}% match
                      </p>
                    </div>
                  </div>

                  {/* Measurements used / missing */}
                  <div className="flex flex-col sm:flex-row gap-4 text-xs">
                    {sizePrediction.measurementsUsed.length > 0 && (
                      <div className="flex items-center gap-1.5 text-success">
                        <Check className="h-3 w-3" strokeWidth={2} />
                        <span>
                          Using: {sizePrediction.measurementsUsed.map((m) =>
                            m.replace(/([A-Z])/g, " $1").toLowerCase()
                          ).join(", ")}
                        </span>
                      </div>
                    )}
                    {sizePrediction.missingMeasurements.length > 0 && (
                      <div className="flex items-center gap-1.5 text-muted">
                        <Info className="h-3 w-3" strokeWidth={2} />
                        <span>
                          Add: {sizePrediction.missingMeasurements.map((m) =>
                            m.replace(/([A-Z])/g, " $1").toLowerCase()
                          ).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <AlertCircle className="h-8 w-8 text-muted" strokeWidth={1.5} />
                  <p className="text-sm text-muted font-light">
                    Add body measurements above to see your predicted sizes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Style Preferences Section ── */}
      <section>
        <button
          type="button"
          onClick={() => setPreferencesOpen(!preferencesOpen)}
          className="flex items-center justify-between w-full mb-5 group"
        >
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-accent" strokeWidth={1.5} />
            <h3 className="font-heading text-lg font-medium tracking-tight">Style Preferences</h3>
          </div>
          {preferencesOpen ? (
            <ChevronUp className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted group-hover:text-foreground transition-colors" strokeWidth={1.5} />
          )}
        </button>

        {preferencesOpen && (
          <Card>
            <CardContent className="space-y-6">
              {/* Style Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Style Tags</label>
                <TagSelect
                  tags={STYLE_TAGS}
                  selected={styleTags}
                  onChange={(tags) => setStyleTags(tags as StyleTag[])}
                />
              </div>

              {/* Fit Preference */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Fit Preference</label>
                <div className="flex flex-wrap gap-2">
                  {FIT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFitPreference(opt.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        fitPreference === opt.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-muted border-border hover:border-muted hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size System */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Sizing System</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_SYSTEMS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSizePreference(opt.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        sizePreference === opt.value
                          ? "bg-foreground text-background border-foreground"
                          : "bg-card text-muted border-border hover:border-muted hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Price Range</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" strokeWidth={1.5} />
                    <input
                      type="number"
                      value={priceRangeMin}
                      onChange={(e) => setPriceRangeMin(e.target.value)}
                      placeholder="Min"
                      className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                  <span className="text-muted text-sm">—</span>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" strokeWidth={1.5} />
                    <input
                      type="number"
                      value={priceRangeMax}
                      onChange={(e) => setPriceRangeMax(e.target.value)}
                      placeholder="Max"
                      className="h-10 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm text-foreground placeholder:text-muted transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent"
                    />
                  </div>
                </div>
              </div>

              {/* Text-based preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Preferred Brands"
                  value={preferredBrands}
                  onChange={(e) => setPreferredBrands(e.target.value)}
                  placeholder="Nike, Zara, H&M"
                  hint="Comma-separated"
                />
                <Input
                  label="Favorite Colors"
                  value={preferredColors}
                  onChange={(e) => setPreferredColors(e.target.value)}
                  placeholder="Blue, Black, White"
                  hint="Comma-separated"
                />
                <Input
                  label="Colors to Avoid"
                  value={avoidColors}
                  onChange={(e) => setAvoidColors(e.target.value)}
                  placeholder="Orange, Pink"
                  hint="Comma-separated"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ── Save Button ── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
        <Button
          variant="secondary"
          className="rounded-full"
          onClick={fetchProfile}
          disabled={loading}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          loading={saving}
          variant="editorial"
          className="rounded-full px-6"
        >
          <Check className="h-4 w-4" strokeWidth={1.5} />
          Save Changes
        </Button>
      </div>
    </motion.div>
  );
}
