"use client";

import type { ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { editorialEase } from "./motion";

/**
 * Mobile-only route transition (Material fade-through). Desktop routing is
 * left untouched; reduced-motion users get plain navigation.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.12, ease: editorialEase } }}
          transition={{ duration: 0.28, ease: editorialEase }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
}
