"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { bottomNavLinks } from "@/lib/navigation";

/** Routes treated as immersive flows — the bottom bar is hidden there. */
function isHiddenRoute(pathname: string): boolean {
  if (pathname === "/analysis" || pathname.startsWith("/analysis/")) return true;
  if (pathname.startsWith("/results/")) return true;
  if (pathname.startsWith("/trending/")) return true;
  return false;
}

function isTabActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

const TAB_LABEL = "text-[10px] leading-none";

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-16 flex-col items-center justify-center gap-1 text-muted",
        "transition-colors duration-200 hover:text-foreground",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        active && "text-accent"
      )}
    >
      {active && (
        <motion.span
          layoutId="mobile-nav-pill"
          className="absolute inset-1.5 rounded-full bg-accent/15"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon
        className={cn("relative h-5 w-5 shrink-0", active && "text-accent")}
        strokeWidth={1.5}
      />
      <span className={cn("relative", TAB_LABEL, active && "text-accent")}>{label}</span>
    </Link>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [hiddenByKeyboard, setHiddenByKeyboard] = useState(false);

  // Hide the bar while the soft keyboard is open (visualViewport shrinks).
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onChange = () => {
      setHiddenByKeyboard(window.innerHeight - vv.height > 120);
    };
    onChange();
    vv.addEventListener("resize", onChange);
    return () => vv.removeEventListener("resize", onChange);
  }, []);

  if (isHiddenRoute(pathname)) return null;

  const fabActive = pathname === "/upload" || pathname.startsWith("/analysis");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden" aria-label="Primary">
      <div
        className={cn(
          "grid grid-cols-5 border-t border-border bg-card/80 backdrop-blur-md",
          "pb-[env(safe-area-inset-bottom)] transition-transform duration-300",
          hiddenByKeyboard && "translate-y-full"
        )}
      >
        {bottomNavLinks.slice(0, 2).map((link) => (
          <TabLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            active={isTabActive(pathname, link.href)}
          />
        ))}

        <div className="relative flex justify-center">
          <Link
            href="/upload"
            aria-label="Try It On"
            aria-current={fabActive ? "page" : undefined}
            className={cn(
              "absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full",
              "bg-accent text-white shadow-elevated transition-transform duration-200 active:scale-95",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              fabActive && "ring-2 ring-accent ring-offset-2 ring-offset-background"
            )}
          >
            <Camera className="h-6 w-6" strokeWidth={1.5} />
          </Link>
          <span className={cn("absolute bottom-2.5 text-muted", TAB_LABEL)}>Try It On</span>
        </div>

        {bottomNavLinks.slice(2).map((link) => (
          <TabLink
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            active={isTabActive(pathname, link.href)}
          />
        ))}
      </div>
    </nav>
  );
}
