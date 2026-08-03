"use client";

import { motion } from "framer-motion";
import {
  Camera,
  Shirt,
  Brain,
  BarChart3,
  Palette,
  HeartHandshake,
} from "lucide-react";
import {
  fadeInUp,
  stagger,
  revealViewport,
  cardHover,
} from "./motion";

const features = [
  {
    icon: Camera,
    title: "Upload Your Photo",
    description: "Take or upload a full-body photo. Our AI analyzes your body shape, skin tone, and facial features.",
  },
  {
    icon: Shirt,
    title: "Add Any Clothing",
    description: "Upload a product image or paste a URL from any online store. We extract and prepare the item for try-on.",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our advanced AI model analyzes compatibility across body fit, color harmony, and style matching.",
  },
  {
    icon: BarChart3,
    title: "Compatibility Score",
    description: "Get detailed scores for overall compatibility, body fit, color coordination, and style alignment.",
  },
  {
    icon: Palette,
    title: "Style Insights",
    description: "Discover your body shape, skin tone category, and personalized color palette recommendations.",
  },
  {
    icon: HeartHandshake,
    title: "Smart Recommendations",
    description: "Receive tailored fashion advice and discover similar items that would suit you even better.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 sm:py-40 px-6 scroll-mt-20">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="text-center mb-20"
        >
          <motion.span
            variants={fadeInUp}
            className="inline-block text-xs font-medium tracking-[0.2em] uppercase text-accent mb-6"
          >
            Features
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-balance"
          >
            Everything you need to dress with confidence
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-lg text-muted max-w-2xl mx-auto font-light leading-relaxed"
          >
            Suitora combines computer vision and fashion expertise to give you honest, personalized feedback.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={cardHover.whileHover}
                transition={cardHover.transition}
                className="group relative rounded-2xl border border-border/60 bg-card p-8 transition-all duration-500 hover:shadow-elevated hover:border-accent/30 hover:bg-surface/30"
              >
                {/* Subtle top accent line on hover (first card) */}
                {i === 0 && (
                  <span
                    aria-hidden
                    className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                )}
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border transition-all duration-300 group-hover:bg-accent/10 group-hover:border-accent/20">
                  <Icon className="h-5 w-5 text-accent transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
