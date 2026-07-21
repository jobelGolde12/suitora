"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  History,
  Heart,
  Settings,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Analysis", href: "/upload", icon: Upload },
  { label: "History", href: "/history", icon: History },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Settings", href: "/settings", icon: Settings },
];

function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className={cn("flex items-center gap-2.5 group", collapsed && "justify-center")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 overflow-hidden transition-colors group-hover:border-accent/50">
        <img
          src="/suitora_logo.png"
          alt="Suitora"
          width={32}
          height={32}
          className="object-cover"
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
  onNavigate,
}: {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-3" aria-label="Main">
      {sidebarLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          pathname === link.href || pathname.startsWith(link.href + "/");

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Mobile menu toggle — opens and closes */}
      <button
        onClick={() => setMobileOpen((open) => !open)}
        className={cn(
          "fixed bottom-6 left-6 z-[60] flex h-12 w-12 items-center justify-center rounded-full",
          "border border-border bg-card text-foreground shadow-elevated md:hidden",
          "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
        aria-expanded={mobileOpen}
        aria-controls="mobile-sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
      </button>

      {/* Desktop sidebar */}
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

      {/* Mobile sidebar drawer */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card transition-transform duration-300 md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <BrandMark />
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>

        <NavLinks pathname={pathname} onNavigate={closeMobile} />
      </aside>
    </>
  );
}
