"use client";

import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";

const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: easeOut },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-24">
      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-10"
        >
          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light tracking-tight text-balance leading-[1.05]"
          >
            Will it actually{" "}
            <span className="italic font-light text-accent">look good</span>{" "}
            on you?
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed font-light"
          >
            Stop wondering. Upload your photo and a clothing item to get
            AI-generated compatibility scores, virtual try-on, and
            personalized fashion recommendations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-2"
          >
            <Link href="/register">
              <Button variant="editorial" size="lg" className="rounded-full px-8">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="ghost" size="lg" className="rounded-full px-8">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div variants={fadeInUp} className="pt-8">
            <div className="flex items-center justify-center gap-3 text-sm text-muted">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-accent/60 to-accent/30"
                  />
                ))}
              </div>
              <span className="font-light">
                <strong className="font-medium text-foreground">1,200+</strong> fashion lovers already using Suitora
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-muted/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
