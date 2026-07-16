import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hover?: boolean;
}

export function Card({ className, glass, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-card transition-all duration-200",
        glass && "glass",
        hover && "editorial-card-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-heading text-lg font-medium tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("pt-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-3 pt-4 mt-4 border-t border-border", className)} {...props} />
  );
}
