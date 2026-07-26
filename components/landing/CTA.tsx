"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  fadeInUp,
  stagger,
  revealViewport,
} from "./motion";

export function CTA() {
  return (
    <section className="relative py-32 sm:py-40 px-6 bg-surface/40">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="space-y-10"
        >
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight text-balance"
          >
            Ready to find your perfect fit?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-lg text-muted max-w-xl mx-auto font-light leading-relaxed"
          >
            Join thousands of smart shoppers who never wonder &quot;Will this look good on me?&quot; again.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button variant="editorial" size="lg" className="rounded-full px-10 group">
                Get Started Free
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="ghost" size="lg" className="rounded-full px-8">
                See How It Works
              </Button>
            </Link>
          </motion.div>
          {/* Trust line */}
          <motion.p
            variants={fadeInUp}
            className="text-[11px] text-muted font-light"
          >
            Free to start · Cancel anytime · Your photos stay private
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
