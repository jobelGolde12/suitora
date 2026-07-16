import type { Easing, Variants } from "framer-motion";

/** Calm ease-out curve for editorial motion */
export const editorialEase: Easing = [0.21, 0.47, 0.32, 0.98];

export const MOTION = {
  duration: 0.22,
  durationSlow: 0.28,
  stagger: 0.06,
  ease: editorialEase,
} as const;

/** Fade + subtle slide up — use with custom index for stagger */
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration,
      delay: typeof i === "number" ? i * MOTION.stagger : 0,
      ease: MOTION.ease,
    },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: MOTION.stagger,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.duration, ease: MOTION.ease },
  },
};
