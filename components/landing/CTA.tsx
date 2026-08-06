"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fadeInUp, stagger, revealViewport } from "./motion";

export function CTA() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden bg-surface/40 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      {/* Extremely soft radial accent */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(197,160,122,0.09),transparent_55%)]"
      />

      <div className="mx-auto w-full max-w-6xl lg:max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="
            grid grid-cols-1 items-stretch gap-8
            rounded-3xl bg-white/5 p-6
            sm:rounded-[2rem] sm:p-8
            lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]
            lg:gap-12 lg:p-10
            xl:p-12
          "
        >
          {/* Left content */}
          <motion.div
            variants={fadeInUp}
            className="
              flex min-w-0 flex-col items-center justify-center
              gap-6 text-center
              sm:items-start sm:text-left
              lg:gap-7
            "
          >
            <div className="max-w-full space-y-3 sm:space-y-4">
              <span className="inline-flex w-fit items-center rounded-full bg-white/10 px-3.5 py-1 text-[11px] font-medium tracking-wide text-muted sm:text-xs">
                Smart styling, made simple
              </span>

              <h2
                id="cta-heading"
                className="
                  font-heading text-3xl font-light tracking-tight
                  text-foreground text-balance
                  sm:text-4xl
                  lg:text-[2.75rem]
                  xl:text-5xl xl:leading-[1.08]
                "
              >
                Ready to find your perfect fit?
              </h2>

              <p
                className="
                  mx-auto max-w-md text-sm font-light leading-relaxed text-muted
                  sm:mx-0 sm:max-w-xl sm:text-base
                "
              >
                Join thousands of smart shoppers who never wonder &quot;Will this
                look good on me?&quot; again.
              </p>
            </div>

            {/* CTA buttons */}
            <div
              className="
                flex w-full flex-col gap-3
                sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-start
              "
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  variant="editorial"
                  size="lg"
                  className="
                    group inline-flex min-h-12 w-full items-center justify-center
                    gap-2 rounded-full px-7 text-sm font-medium
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-lg
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                    motion-reduce:transition-none motion-reduce:transform-none
                    sm:min-h-11 sm:w-auto
                  "
                >
                  Get Started Free
                  <ArrowRight
                    aria-hidden
                    className="
                      h-4 w-4 transition-transform duration-200
                      group-hover:translate-x-1
                      motion-reduce:transform-none motion-reduce:transition-none
                    "
                  />
                </Button>
              </Link>

              <Link href="/#how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="ghost"
                  size="lg"
                  className="
                    inline-flex min-h-12 w-full items-center justify-center
                    rounded-full px-7 text-sm font-medium
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:bg-white/10
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
                    motion-reduce:transition-none motion-reduce:transform-none
                    sm:min-h-11 sm:w-auto
                  "
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <p className="text-[11px] font-light text-muted sm:text-xs">
              Free to start · Cancel anytime · Your photos stay private
            </p>
          </motion.div>

          {/* Right image */}
          <motion.div
            variants={fadeInUp}
            className="relative min-w-0 lg:h-full"
          >
            <div
              className="
                group relative aspect-[4/3] w-full overflow-hidden
                rounded-2xl bg-white/5
                transition-transform duration-500
                motion-reduce:transition-none motion-reduce:transform-none
                sm:aspect-[16/10] sm:rounded-3xl
                lg:aspect-auto lg:h-full lg:min-h-[420px]
                xl:min-h-[480px]
              "
            >
              <Image
                src="/images/landing/women_happy_with_her_dress.webp"
                alt="Happy woman wearing a dress she feels confident in"
                fill
                priority
                sizes="(min-width: 1024px) 45vw, (min-width: 640px) 92vw, 100vw"
                className="
                  object-cover object-center
                  transition-transform duration-700
                  group-hover:scale-105
                  motion-reduce:transform-none motion-reduce:transition-none
                "
                unoptimized
              />

              {/* Floating badge inside image so it never gets clipped */}
              <div
                className="
                  pointer-events-none absolute inset-x-3 bottom-3
                  rounded-2xl bg-[#111827]/90 px-3.5 py-2.5
                  backdrop-blur-md
                  sm:inset-x-auto sm:bottom-5 sm:left-5
                  sm:w-fit sm:max-w-[calc(100%-2.5rem)]
                  sm:px-4 sm:py-3
                "
              >
                <p className="text-xs font-medium text-white/90">
                  Style confidence, instantly
                </p>
                <p className="mt-0.5 text-[11px] text-white/60">
                  Responsive preview · Modern fit
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}