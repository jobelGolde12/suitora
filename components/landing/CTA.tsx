"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fadeInUp, stagger, revealViewport } from "./motion";

export function CTA() {
  return (
    <section className="relative py-14 sm:py-18 lg:py-20 px-6 bg-surface/40">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="grid items-center gap-8 overflow-hidden rounded-[1.75rem] bg-white/5 p-5 sm:p-7 lg:grid-cols-2 lg:p-8"
        >
          <motion.div variants={fadeInUp} className="space-y-6 text-left">
            <div className="space-y-3">
              <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-4 py-1 text-xs font-medium tracking-wide text-muted">
                Smart styling, made simple
              </span>

              <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-balance text-foreground">
                Ready to find your perfect fit?
              </h2>

              <p className="max-w-xl text-sm sm:text-base text-muted font-light leading-relaxed">
                Join thousands of smart shoppers who never wonder &quot;Will this look good on me?&quot; again.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="editorial"
                  size="lg"
                  className="group w-full sm:w-auto rounded-full px-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>

              <Link href="/#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="w-full sm:w-auto rounded-full px-7 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-[11px] text-muted font-light">
              Free to start · Cancel anytime · Your photos stay private
            </p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="relative mx-auto w-full max-w-[520px] lg:max-w-none"
          >
            <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[1.5rem] bg-white/5 transition-transform duration-500 hover:-translate-y-1 hover:scale-[1.01]">
              <Image
                src="/images/landing/women_happy_with_her_dress.webp"
                alt="Happy woman wearing a dress"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center transition-transform duration-700 hover:scale-105"
                unoptimized
              />
            </div>

            <div className="pointer-events-none absolute -bottom-3 -left-3 hidden sm:block rounded-2xl bg-[#111827]/95 px-4 py-3 backdrop-blur-md">
              <p className="text-xs font-medium text-white/90">
                Style confidence, instantly
              </p>
              <p className="text-[11px] text-white/60">
                Responsive preview • Modern fit
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}