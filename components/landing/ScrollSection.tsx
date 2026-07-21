"use client";

import { ScrollFlyIn } from "@/components/ui/hero-section-3";

export function ScrollSection() {
  return (
    <section className="w-full bg-background text-foreground">
      <ScrollFlyIn>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            See It Before You Buy It
          </p>
          <h2 className="font-heading text-4xl md:text-6xl font-light leading-tight mt-2 text-balance">
            Your personal AI stylist
            <br />
            <span className="italic text-accent">in your pocket</span>
          </h2>
          <p className="mt-6 text-lg text-muted max-w-xl mx-auto font-light leading-relaxed">
            From casual to couture, discover how every piece actually looks on
            you before you add to cart.
          </p>
        </div>
      </ScrollFlyIn>
    </section>
  );
}
