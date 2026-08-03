"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  CreditCard,
  ShieldCheck,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScoreCircle } from "@/components/ui/ScoreCircle";
import {
  fadeInUpHero as fadeInUp,
  staggerHero as stagger,
  easeOut,
} from "./motion";

const trustItems = [
  { icon: CreditCard, label: "No credit card" },
  { icon: ShieldCheck, label: "Private by design" },
  { icon: Store, label: "Works with any store" },
];

const metrics = [
  { label: "Body Fit", value: 92 },
  { label: "Color Harmony", value: 96 },
  { label: "Style Match", value: 88 },
];

const avatars = [
  { initial: "A", src: "/images/landing/profile-a.png" },
  { initial: "M", src: "/images/landing/profile-m.png" },
  { initial: "S", src: "/images/landing/profile-s.png" },
  { initial: "K", src: "/images/landing/profile-k.png" },
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
      <div className="relative z-10 mx-auto w-full max-w-6xl">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]"
        >
          {/* Copy column */}
          <motion.div
            variants={stagger}
            className="space-y-10 text-center lg:text-left"
          >
            <motion.h1
              variants={fadeInUp}
              className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-light tracking-tight text-balance leading-[1.05]"
            >
              Will it actually{" "}
              <span className="italic font-light text-accent">look good</span>{" "}
              on you?
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed font-light lg:mx-0"
            >
              Stop wondering. Upload your photo and a clothing item to get
              AI-generated compatibility scores, virtual try-on, and
              personalized fashion recommendations.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-5 pt-2 sm:flex-row lg:justify-start"
            >
              <Link href="/register">
                <Button
                  variant="editorial"
                  size="lg"
                  className="group rounded-full px-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  Start Free Trial
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/#how-it-works">
                <Button
                  variant="ghost"
                  size="lg"
                  className="rounded-full px-8 transition-all duration-300 hover:-translate-y-0.5"
                >
                  See How It Works
                </Button>
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.ul
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 pt-1 lg:justify-start"
            >
              {trustItems.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-xs text-muted font-light sm:text-[13px]"
                >
                  <Icon
                    className="h-3.5 w-3.5 text-accent/70"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  {label}
                </li>
              ))}
            </motion.ul>

            {/* Social proof */}
            <motion.div variants={fadeInUp} className="pt-2">
              <div className="flex items-center justify-center gap-3 text-sm text-muted lg:justify-start">
                <div className="flex -space-x-2">
                  {avatars.map(({ initial, src }) => (
                    <div
                      key={initial}
                      className="h-8 w-8 overflow-hidden rounded-full border-2 border-background"
                    >
                      <Image
                        src={src}
                        alt={`User ${initial}`}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
                <span className="font-light">
                  <strong className="font-medium text-foreground">1,200+</strong>{" "}
                  fashion lovers already using Suitora
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* Product visual (desktop) */}
          <motion.div
            variants={fadeInUp}
            custom={4}
            className="relative hidden lg:block"
          >
            {/* Soft ambient glow */}
            <div
              aria-hidden
              className="absolute -inset-12 rounded-full bg-accent/10 blur-3xl"
            />

            {/* Live score card */}
            <div className="relative rounded-3xl border border-border bg-card p-7 shadow-modal">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <p className="editorial-label mb-2">Live compatibility</p>
                  <p className="font-heading text-lg text-foreground">
                    Silk Blouse
                  </p>
                </div>
                <span className="rounded-full border border-border/70 bg-surface/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted">
                  Score
                </span>
              </div>

              <div className="flex items-center gap-6">
                <ScoreCircle score={94} size="md" />
                <div className="flex-1 space-y-3.5">
                  {metrics.map((m) => (
                    <div key={m.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-light text-muted">{m.label}</span>
                        <span className="font-medium text-foreground">
                          {m.value}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.value}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.9,
                            ease: easeOut,
                            delay: 0.5,
                          }}
                          className="h-full rounded-full bg-accent/70"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating try-on chip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : 1.1,
                duration: 0.6,
                ease: easeOut,
              }}
              className="absolute -bottom-6 -left-8 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-modal"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/15">
                <Check className="h-4 w-4 text-accent" strokeWidth={2} />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Try-on approved
                </p>
                <p className="text-xs font-light text-muted">
                  Virtual preview ready
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduceMotion ? 0 : 2, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        {reduceMotion ? (
          <ChevronDown className="h-5 w-5 text-muted/50" />
        ) : (
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5 text-muted/50" />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
