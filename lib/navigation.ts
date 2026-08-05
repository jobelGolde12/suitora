import {
  LayoutDashboard,
  Upload,
  History,
  Heart,
  Settings,
  Sparkles,
  MessageCircle,
  GitCompareArrows,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** All top-level dashboard destinations (shared by sidebar + mobile nav). */
export const dashboardLinks: DashboardLink[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Try It On", href: "/upload", icon: Upload },
  { label: "AI Stylist", href: "/stylist", icon: MessageCircle },
  { label: "Compare", href: "/compare", icon: GitCompareArrows },
  { label: "Trending", href: "/trending", icon: Sparkles },
  { label: "History", href: "/history", icon: History },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Settings", href: "/settings", icon: Settings },
];

const linksByHref = new Map(dashboardLinks.map((link) => [link.href, link]));

/** Primary destinations shown in the mobile bottom nav (center slot is the Try It On FAB). */
export const bottomNavLinks: DashboardLink[] = [
  "/dashboard",
  "/trending",
  "/history",
  "/settings",
].map((href) => linksByHref.get(href)!);
