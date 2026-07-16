"use client";

import { useState } from "react";
import { motion, type Easing } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: easeOut },
  }),
};

const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const faqs = [
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI model is trained on thousands of fashion combinations and body types. While we strive for high accuracy, we recommend using the results as a helpful guide rather than absolute fashion advice. The scores are based on established fashion principles, color theory, and body fit analysis.",
  },
  {
    question: "What kind of photos should I upload?",
    answer: "For best results, upload a full-body photo standing straight against a plain background with good lighting. For clothing items, use a clear front-facing image of the garment. We support JPG, PNG, and WEBP formats up to 5MB each.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your photos are encrypted in transit and at rest. We never share your personal images with third parties. You can delete your uploaded images and analysis history at any time from your account settings.",
  },
  {
    question: "Can I use Suitora for any type of clothing?",
    answer: "Yes! Suitora works with all types of clothing including tops, bottoms, dresses, outerwear, and accessories. The AI analyzes how each item complements your body shape, skin tone, and personal style.",
  },
  {
    question: "Do I need to create an account?",
    answer: "Yes, you'll need a free account to save your analyses and access your history. Creating an account also enables you to favorite results and track your fashion discoveries over time.",
  },
  {
    question: "Is there a mobile app available?",
    answer: "We're currently a web application optimized for both desktop and mobile browsers. A native mobile app is on our roadmap and coming soon!",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-32 sm:py-40 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="inline-block text-xs font-medium tracking-[0.2em] uppercase text-accent mb-6"
          >
            FAQ
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="font-heading text-4xl sm:text-5xl font-light tracking-tight"
          >
            Got questions? We&apos;ve got answers.
          </motion.h2>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={i}
              className="rounded-xl border border-border/60 bg-card overflow-hidden transition-all duration-300 hover:border-accent/30"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-surface/30"
              >
                <span className="text-sm font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition-transform duration-300",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm text-muted leading-relaxed font-light">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
