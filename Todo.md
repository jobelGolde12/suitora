Create another section at the bottom of "How it works" section and implement this:
You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure  
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles. 
If default path for components is not /components/ui, provide instructions on why it's important to create this folder
Copy-paste this component to /components/ui folder:
```tsx
hero-section-3.tsx
"use client";

import * as React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils"; // Assuming you have a `cn` utility

interface ScrollFlyInProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode; // For the static text content
  imageUrl: string;
  imageAlt?: string;
}

const ScrollFlyIn = React.forwardRef<HTMLDivElement, ScrollFlyInProps>(
  ({ children, imageUrl, imageAlt = "Animated image", className, ...props }, ref) => {
    const targetRef = React.useRef<HTMLDivElement>(null);
    const screenWidth = window.innerWidth;

    const { scrollYProgress } = useScroll({
      target: targetRef,
      offset: ["start end", "end start"],
    });

    // Using a more aggressive value for x-transform to ensure the plane is completely off-screen.
    const x = useTransform(scrollYProgress, [0.1, 0.8], [`-${5*screenWidth}px`, `${2.5*screenWidth}px`]);
    
    const opacity = useTransform(scrollYProgress, [0.1, 0.25, 0.7, 0.8], [0, 1, 1, 0]);

    return (
      <div ref={targetRef} className={cn("relative h-[200vh]", className)} {...props}>
        {/* The sticky container no longer has overflow-hidden, which prevents clipping */}
        <div className="sticky top-0 flex h-screen items-center justify-center">
          {/* Static Text Content */}
          <div className="z-10 text-center">
            {children}
          </div>

          {/* Animated Image (Plane) */}
          <motion.div 
            style={{ x, opacity }} 
            className="absolute top-0 left-0 z-20 flex h-full w-full items-center"
          >
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-auto h-auto max-w-none"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/1200x800/000000/ffffff?text=Image+Error`;
              }}
            />
          </motion.div>
        </div>
      </div>
    );
  }
);

ScrollFlyIn.displayName = "ScrollFlyIn";

export { ScrollFlyIn };


demo.tsx
import { ScrollFlyIn } from "@/components/ui/hero-section-3"; // Adjust path as needed

export default function ScrollFlyInDemo() {
  return (
    <div className="w-full bg-background text-foreground">
      <ScrollFlyIn
        imageUrl="https://cdn.prod.website-files.com/661fdce3e735db03332bf817/66223004372c7c1124c1b0d1_Top-view2x-p-2000.webp"
        imageAlt="Top view of a private jet flying across the screen"
      >
        {/* This is the static text content */}
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-md font-semibold uppercase tracking-widest text-muted-foreground">
            Welcome to Airvoir
          </p>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight mt-2">
            Where journeys become unforgettable
          </h2>
        </div>
      </ScrollFlyIn>
    </div>
  );
}

```

Install NPM dependencies:
```bash
framer-motion
```

Implementation Guidelines
 1. Analyze the component structure and identify all required dependencies
 2. Review the component's argumens and state
 3. Identify any required context providers or hooks and install them
 4. Questions to Ask
 - What data/props will be passed to this component?
 - Are there any specific state management requirements?
 - Are there any required assets (images, icons, etc.)?
 - What is the expected responsive behavior?
 - What is the best place to use this component in the app?

Steps to integrate
 0. Copy paste all the code above in the correct directories
 1. Install external dependencies
 2. Fill image assets with Unsplash stock images you know exist
 3. Use lucide-react icons for svgs or logos if component requires them
