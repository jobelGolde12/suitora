"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface ScrollFlyInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  imageUrl: string;
  imageAlt?: string;
}

function ScrollFlyIn({
  children,
  imageUrl,
  imageAlt = "Animated image",
  className,
  ...props
}: ScrollFlyInProps) {
  const targetRef = React.useRef<HTMLDivElement>(null);
  const [screenWidth, setScreenWidth] = React.useState(1920);
  const [imageLoaded, setImageLoaded] = React.useState(false);

  React.useEffect(() => {
    setScreenWidth(window.innerWidth);
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const x = useTransform(
    scrollYProgress,
    [0.1, 0.45],
    [`-${2 * screenWidth}px`, `${0.5 * screenWidth}px`]
  );

  const containerOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.2, 0.35, 0.45],
    [0, 1, 1, 0]
  );

  return (
    <div
      ref={targetRef}
      className={cn("relative h-[110vh] overflow-x-hidden", className)}
      {...props}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center">
        {/* Static Text Content */}
        <div className="relative z-10 text-center">{children}</div>

        {/* Animated Image Container — always animating, visible even before image loads */}
        <motion.div
          style={{ x, opacity: containerOpacity }}
          className="absolute top-0 left-0 z-0 flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/5 via-background to-accent/10"
        >
          {/* Placeholder gradient that shows while the image loads */}
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br from-accent/20 via-background to-accent/30 transition-opacity duration-700",
              imageLoaded ? "opacity-0" : "opacity-100"
            )}
          />

          <img
            src={imageUrl}
            alt={imageAlt}
            className={cn(
              "w-auto h-auto max-w-none transition-opacity duration-700",
              imageLoaded ? "opacity-100" : "opacity-0"
            )}
            loading="eager"
            fetchPriority="high"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/1200x800/000000/ffffff?text=Image+Error`;
              setImageLoaded(true);
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

export { ScrollFlyIn };
