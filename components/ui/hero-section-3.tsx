"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ScrollFlyInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const STAR_COUNT = 25;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    y: Math.random() * 100,
    delay: Math.random() * 6,
    duration: 2 + Math.random() * 3,
    repeatDelay: 2 + Math.random() * 4,
    size: 0.5 + Math.random() * 1.5,
    opacity: 0.15 + Math.random() * 0.25,
  }));
}

function ShootingStar({
  y,
  delay,
  duration,
  repeatDelay,
  size,
  opacity,
}: {
  y: number;
  delay: number;
  duration: number;
  repeatDelay: number;
  size: number;
  opacity: number;
}) {
  const starWidth = size * 20;
  const tailWidth = size * 60;

  return (
    <motion.div
      className="absolute left-0 top-0 pointer-events-none"
      style={{ top: `${y}%` }}
      initial={{ opacity: 0 }}
      animate={{
        x: [
          "calc(-100vw - 100px)",
          "calc(-100vw - 100px)",
          "calc(-100vw - 100px)",
          "calc(100vw + 100px)",
          "calc(100vw + 100px)",
          "calc(100vw + 100px)",
        ],
        opacity: [0, 0, opacity, opacity, 0, 0],
      }}
      transition={{
        duration: duration + repeatDelay + 2,
        times: [
          0,
          delay / (duration + repeatDelay + 2),
          (delay + 0.1) / (duration + repeatDelay + 2),
          (delay + duration - 0.3) / (duration + repeatDelay + 2),
          (delay + duration) / (duration + repeatDelay + 2),
          1,
        ],
        ease: "linear",
        repeat: Infinity,
      }}
    >
      {/* Star head */}
      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-accent"
        style={{
          width: `${starWidth}px`,
          height: `${Math.max(2, size * 2)}px`,
          boxShadow: `0 0 ${3 + size * 1.5}px ${size * 0.8}px rgba(197, 160, 122, ${opacity * 0.3})`,
        }}
      />
      {/* Tail */}
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{
          width: `${tailWidth}px`,
          height: `${Math.max(1, size)}px`,
          right: `${starWidth}px`,
          background: `linear-gradient(to left, rgba(197, 160, 122, ${opacity * 0.7}) 0%, rgba(197, 160, 122, ${opacity * 0.2}) 40%, transparent 100%)`,
        }}
      />
    </motion.div>
  );
}

function ScrollFlyIn({
  children,
  className,
  ...props
}: ScrollFlyInProps) {
  const [stars] = React.useState(generateStars);
  const sectionRef = React.useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start center"],
  });

  const contentOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [24, 0]);

  return (
    <div
      ref={sectionRef}
      className={cn(
        "relative h-screen overflow-hidden bg-gradient-to-br from-accent/5 via-background to-accent/10",
        className
      )}
      {...props}
    >
      {/* Shooting Stars Layer */}
      <div className="absolute inset-0 z-0">
        {stars.map((star) => (
          <ShootingStar key={star.id} {...star} />
        ))}
      </div>

      {/* Animated Text Content */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 flex h-full items-center justify-center px-4"
      >
        <div className="text-center">{children}</div>
      </motion.div>
    </div>
  );
}

export { ScrollFlyIn };
