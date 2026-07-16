"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Easing } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  Camera,
  Shirt,
  Brain,
  BarChart3,
  Shield,
  Zap,
  Palette,
  HeartHandshake,
  Upload,
  Search,
  Star,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

// ─── Animation Variants ───────────────────────────────────────────
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
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

// ─── Hero Section ─────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background pointer-events-none" />
      <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-1/3 -right-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >


          {/* Heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.1] mt-17"
          >
            Will it actually{" "}
            <span className="text-gradient">look good</span>{" "}
            on you?
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted leading-relaxed"
          >
            Stop wondering. Upload your photo and a clothing item to get
            AI-generated compatibility scores, virtual try-on, and
            personalized fashion recommendations.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/register">
              <Button size="xl" className="rounded-2xl shadow-lg shadow-primary/25">
                Start Free Trial
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/#how-it-works">
              <Button variant="secondary" size="xl" className="rounded-2xl">
                See How It Works
              </Button>
            </Link>
          </motion.div>

          {/* Social Proof */}
          <motion.div variants={fadeInUp} className="pt-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/80 to-accent/80"
                  />
                ))}
              </div>
              <span>
                <strong className="text-foreground">1,200+</strong> fashion lovers already using Suitora
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-5 w-5 text-muted" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Features Section ─────────────────────────────────────────────
const features = [
  {
    icon: Camera,
    title: "Upload Your Photo",
    description: "Take or upload a full-body photo. Our AI analyzes your body shape, skin tone, and facial features.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shirt,
    title: "Add Any Clothing",
    description: "Upload a product image or paste a URL from any online store. We extract and prepare the item for try-on.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our advanced AI model analyzes compatibility across body fit, color harmony, and style matching.",
    gradient: "from-orange-500 to-red-500",
  },
  {
    icon: BarChart3,
    title: "Compatibility Score",
    description: "Get detailed scores for overall compatibility, body fit, color coordination, and style alignment.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Palette,
    title: "Style Insights",
    description: "Discover your body shape, skin tone category, and personalized color palette recommendations.",
    gradient: "from-violet-500 to-indigo-500",
  },
  {
    icon: HeartHandshake,
    title: "Smart Recommendations",
    description: "Receive tailored fashion advice and discover similar items that would suit you even better.",
    gradient: "from-rose-500 to-pink-500",
  },
];

function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-semibold tracking-widest uppercase text-primary">
            Features
          </motion.span>
          <motion.h2 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Everything you need to dress with confidence
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            Suitora combines computer vision and fashion expertise to give you honest, personalized feedback.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeInUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="group relative rounded-2xl border border-border bg-card p-6 shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <div className={cn(
                  "mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-sm",
                  feature.gradient
                )}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works Section ─────────────────────────────────────────
const steps = [
  {
    icon: Upload,
    title: "Upload Your Photo",
    description: "Take a simple full-body photo or upload one you already have. Make sure you're standing straight with good lighting.",
    color: "from-primary/20 to-primary/5",
    border: "border-primary/20",
  },
  {
    icon: Shirt,
    title: "Add a Clothing Item",
    description: "Upload a product image from any online store or take a photo of the clothing item you're considering.",
    color: "from-accent/20 to-accent/5",
    border: "border-accent/20",
  },
  {
    icon: Zap,
    title: "Get AI Analysis",
    description: "Our AI processes the images and generates a virtual try-on with detailed compatibility scores and personalized insights.",
    color: "from-success/20 to-success/5",
    border: "border-success/20",
  },
  {
    icon: Star,
    title: "Shop with Confidence",
    description: "Review your results, save them for later, and make informed purchasing decisions with confidence.",
    color: "from-warning/20 to-warning/5",
    border: "border-warning/20",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32 px-4 bg-surface/50">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-semibold tracking-widest uppercase text-primary">
            How It Works
          </motion.span>
          <motion.h2 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Three simple steps to fashion clarity
          </motion.h2>
          <motion.p variants={fadeInUp} className="mt-4 text-lg text-muted max-w-2xl mx-auto">
            No complex setup. No fashion degree required. Just upload and discover.
          </motion.p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Connection Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary via-accent to-success" />

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
                <div className="relative z-10 mb-6">
                  <div className={cn(
                    "flex h-24 w-24 items-center justify-center rounded-2xl border bg-card shadow-card backdrop-blur-sm",
                    step.border
                  )}>
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shadow-lg">
                    {i + 1}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed max-w-xs">
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

// ─── FAQ Section ──────────────────────────────────────────────────
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

function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="relative py-24 sm:py-32 px-4">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="text-center mb-16"
        >
          <motion.span variants={fadeInUp} className="text-xs font-semibold tracking-widest uppercase text-primary">
            FAQ
          </motion.span>
          <motion.h2 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight">
            Got questions? We've got answers.
          </motion.h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              custom={i}
              className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-surface/50"
              >
                <span className="text-sm font-medium text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300",
                  openIndex === i ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-5 text-sm text-muted leading-relaxed">
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

// ─── CTA Section ──────────────────────────────────────────────────
function CTA() {
  return (
    <section className="relative py-24 sm:py-32 px-4 bg-surface/50">
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="space-y-8"
        >
          <motion.h2 variants={fadeInUp} className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Ready to find your perfect fit?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-muted max-w-xl mx-auto">
            Join thousands of smart shoppers who never wonder &quot;Will this look good on me?&quot; again.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Link href="/register">
              <Button size="xl" className="rounded-2xl shadow-lg shadow-primary/25">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Export ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
    </>
  );
}
