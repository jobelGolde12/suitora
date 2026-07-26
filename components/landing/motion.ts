/**
 * Shared Framer Motion variants for landing components.
 * Single source of truth for easing, entrance, and stagger definitions.
 */

import type { Easing } from "framer-motion";

export const easeOut: Easing = [0.21, 0.47, 0.32, 0.98];

export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: easeOut },
  }),
};

export const fadeInUpHero = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: i * 0.15, ease: easeOut },
  }),
};

export const stagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const staggerHero = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

/** Standard viewport config for scroll reveals */
export const revealViewport = { once: true, margin: "-80px" as const };

/** Card hover lift */
export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: 0.2, ease: easeOut },
};
