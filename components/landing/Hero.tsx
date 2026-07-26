"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Shield, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  fadeInUpHero as fadeInUp,
  staggerHero as stagger,
  revealViewport,
} from "./motion";

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
              <Button variant="editorial" size="lg" className="rounded-full px-8 group">
                Start Free Trial
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="ghost" size="lg" className="rounded-full px-8">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Trust Strip */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-muted font-light"
          >
            <span className="flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-muted/60" strokeWidth={1.5} />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted/60" strokeWidth={1.5} />
              Private by design
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted/60" strokeWidth={1.5} />
              Results in under 30s
            </span>
          </motion.div>

          {/* Social Proof */}
          <motion.div variants={fadeInUp} className="pt-4">
            <div className="flex items-center justify-center gap-3 text-sm text-muted">
              <div className="flex -space-x-2">
                {["A", "M", "K", "S"].map((initial) => (
                  <div
                    key={initial}
                    className="h-8 w-8 rounded-full border-2 border-background bg-surface flex items-center justify-center text-[10px] font-medium text-muted"
                  >
                    {initial}
                  </div>
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
        aria-hidden="true"
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
