"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { dashboardLinks } from "@/lib/navigation";

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5 group", collapsed && "justify-center")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 overflow-hidden transition-colors group-hover:border-accent/50">
        <Image
          src="/suitora_logo.png"
          alt="Suitora"
          width={32}
          height={32}
          className="object-cover shrink-0"
          unoptimized
        />
      </div>
      {!collapsed && (
        <span className="font-heading text-xl font-medium tracking-tight">Suitora</span>
      )}
    </Link>
  );
}

function NavLinks({
  pathname,
  collapsed,
}: {
  pathname: string;
  collapsed?: boolean;
}) {
  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Main">
      {dashboardLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + "/");

        const isDashboardLink = link.href === "/dashboard";

        const handleMouseEnter = () => {
          if (isDashboardLink && typeof window !== "undefined") {
            // Prefetch dashboard stats and wardrobe count via the stats endpoint
            // (wardrobe count is now included in dashboard stats)
            fetch("/api/dashboard/stats", {
              credentials: "include",
            }).catch((err) => {
              console.warn("Failed to prefetch dashboard stats:", err);
            });
          }
        };

        return (
          <Link
            key={link.href}
            href={link.href}
            onMouseEnter={handleMouseEnter}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-surface text-foreground"
                : "text-muted hover:text-foreground hover:bg-surface/70",
              collapsed && "justify-center px-0"
            )}
            title={collapsed ? link.label : undefined}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon
              className={cn("h-5 w-5 shrink-0", isActive ? "text-accent" : "")}
              strokeWidth={1.5}
            />
            {!collapsed && <span>{link.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-border bg-card transition-all duration-300 md:flex",
        collapsed ? "w-16" : "w-60"
      )}
      data-collapsed={collapsed}
      aria-label="Sidebar"
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-border px-4",
          collapsed && "justify-center px-2"
        )}
      >
        <BrandMark collapsed={collapsed} />
      </div>

      <NavLinks pathname={pathname} collapsed={collapsed} />

      <div className="border-t border-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs text-muted",
            "hover:text-foreground hover:bg-surface transition-all duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn("h-4 w-4 transition-transform duration-200", collapsed && "rotate-180")}
            strokeWidth={1.5}
          />
          {!collapsed && <span className="ml-2">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
