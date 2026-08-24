"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function MobileTopBar() {
  const pathname = usePathname();
  const isFavorites = pathname === "/favorites";

  return (
    <header className="fixed inset-x-0 top-0 z-40 bg-card/80 backdrop-blur-md pt-[env(safe-area-inset-top)] md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <Link
          href="/dashboard"
          aria-label="Suitora home"
          className="flex items-center gap-2.5 rounded-lg cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-accent/30 bg-accent/10">
            <Image
              src="/suitora_logo.png"
              alt=""
              width={28}
              height={28}
              className="shrink-0 object-cover"
              unoptimized
            />
          </div>
          <span className="font-heading text-lg font-medium tracking-tight">Suitora</span>
        </Link>

        <Link
          href="/favorites"
          aria-label="Favorites"
          aria-current={isFavorites ? "page" : undefined}
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-full text-muted cursor-pointer",
            "transition-colors duration-200 hover:bg-surface hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <Heart
            className={cn("h-5 w-5", isFavorites && "text-accent")}
            strokeWidth={1.5}
          />
        </Link>
      </div>
    </header>
  );
}
