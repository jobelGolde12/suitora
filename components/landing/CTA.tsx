"use client";

import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

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

export function CTA() {
  return (
    <section className="relative py-32 sm:py-40 px-6 bg-surface/40">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
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
          <motion.div variants={fadeInUp}>
            <Link href="/register">
              <Button variant="editorial" size="lg" className="rounded-full px-10">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
