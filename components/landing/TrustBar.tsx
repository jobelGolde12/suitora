"use client";

import { motion } from "framer-motion";
import { fadeInUp, stagger, revealViewport } from "./motion";

const categories = [
  "Tops",
  "Dresses",
  "Bottoms",
  "Outerwear",
  "Footwear",
  "Accessories",
];

export function TrustBar() {
  return (
    <section className="relative py-12 px-6 border-y border-border/40">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
          variants={stagger}
          className="flex flex-col items-center gap-6"
        >
          <motion.p
            variants={fadeInUp}
            className="text-[11px] text-muted font-light uppercase tracking-[0.15em]"
          >
            Works with every category
          </motion.p>
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 text-xs font-light text-muted border border-border/60 rounded-full bg-card/50 transition-colors hover:border-accent/30 hover:text-foreground"
              >
                {cat}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
