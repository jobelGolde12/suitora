"use client";

import { motion, type Easing } from "framer-motion";
import {
  Camera,
  Shirt,
  Brain,
  BarChart3,
  Palette,
  HeartHandshake,
} from "lucide-react";

const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

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
    <section id="features" className="relative py-32 sm:py-40 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-border/60 bg-card p-8 transition-all duration-500 hover:shadow-elevated hover:border-accent/30"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-border">
                  <Icon className="h-5 w-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-heading text-xl font-medium mb-3">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
