"use client";

import { Palette } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { deriveSeasonalPalette, type PaletteColor } from "@/lib/ai/color-palette";
import type { SkinTone } from "@/types";

interface ColorPaletteCardProps {
  skinTone?: SkinTone | null;
}

export function ColorPaletteCard({ skinTone }: ColorPaletteCardProps) {
  const palette = deriveSeasonalPalette(skinTone);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-muted" strokeWidth={1.5} />
          Your Color Palette
          <span className="ml-auto rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent">
            {palette.label}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted font-light leading-relaxed">
          {palette.description}
        </p>

        <SwatchGroup title="Best colors" colors={palette.best} />
        <SwatchGroup title="Neutrals" colors={palette.neutrals} />
        <SwatchGroup title="Avoid" colors={palette.avoid} muted />
      </CardContent>
    </Card>
  );
}

function SwatchGroup({
  title,
  colors,
  muted,
}: {
  title: string;
  colors: PaletteColor[];
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-muted mb-2.5">{title}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((color) => (
          <div
            key={color.name}
            className={`flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 ${
              muted ? "border-border text-muted" : "border-border/60"
            }`}
          >
            <span
              className="h-4 w-4 rounded-full border border-border shadow-soft"
              style={{ backgroundColor: color.hex }}
            />
            <span className="text-[11px] font-light">{color.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
