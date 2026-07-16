"use client";

import { motion, type Easing } from "framer-motion";
import { Upload, Shirt, Zap, Star } from "lucide-react";

const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: easeOut },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const steps = [
  {
    icon: Upload,
    title: "Upload Your Photo",
    description: "Take a simple full-body photo or upload one you already have. Make sure you're standing straight with good lighting.",
  },
  {
    icon: Shirt,
    title: "Add a Clothing Item",
    description: "Upload a product image from any online store or take a photo of the clothing item you're considering.",
  },
  {
    icon: Zap,
    title: "Get AI Analysis",
    description: "Our AI processes the images and generates a virtual try-on with detailed compatibility scores and personalized insights.",
  },
  {
    icon: Star,
    title: "Shop with Confidence",
    description: "Review your results, save them for later, and make informed purchasing decisions with confidence.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-32 sm:py-40 px-6 bg-surface/40">
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
            How It Works
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-balance"
          >
            Three simple steps to fashion clarity
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mt-6 text-lg text-muted max-w-2xl mx-auto font-light leading-relaxed"
          >
            No complex setup. No fashion degree required. Just upload and discover.
          </motion.p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          {/* Connection Line (Desktop) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-border via-accent/40 to-border" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                custom={i}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step Number */}
                <div className="relative z-10 mb-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-card">
                    <Icon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center">
                    {i + 1}
                  </div>
                </div>

                <h3 className="font-heading text-lg font-medium mb-3">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed max-w-xs font-light">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
